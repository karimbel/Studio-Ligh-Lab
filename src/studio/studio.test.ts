import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { challengeStart, setups } from './content/setups'
import { knowledgeBySetup, questionsBySetup } from './content/questions'
import { evaluate, isSolved } from './challenge'
import { dictionaries } from './i18n'
import { azimuthDeg, elevationDeg, fillRatio, fittedBeamAngle, polarToXZ, type Light } from './model'

describe('schémas et défi', () => {
  it.each(setups.map(s => [s.id, s] as const))('le preset %s réussit son propre défi', (_, setup) => {
    const checks = evaluate(setup.challenge, setup.lights, 0)
    expect(checks.filter(c => !c.ok)).toEqual([])
    expect(isSolved(checks)).toBe(true)
  })

  it.each(setups.map(s => [s.id, s] as const))('le point de départ du défi %s ne le réussit pas', (_, setup) => {
    expect(isSolved(evaluate(setup.challenge, challengeStart(), 0))).toBe(false)
  })

  it('les presets restent valides quand le sujet recule', () => {
    for (const setup of setups) {
      const moved = setup.lights.map(light => ({ ...light, z: light.z - 1.25 }))
      expect(isSolved(evaluate(setup.challenge, moved, -1.25))).toBe(true)
    }
  })

  it('broad et short éclairent des côtés opposés', () => {
    const side = (id: string) => Math.sign(azimuthDeg(setups.find(s => s.id === id)!.lights[0], 0))
    expect(side('broad')).toBe(-1)
    expect(side('short')).toBe(1)
  })

  it('le clamshell a bien une source sous le visage, devant le sujet', () => {
    const fill = setups.find(s => s.id === 'clamshell')!.lights.find(l => l.id === 'fill')!
    expect(elevationDeg(fill, 0)).toBeLessThan(-20)
    expect(Math.abs(azimuthDeg(fill, 0))).toBeLessThan(10)
  })

  it('chaque conseil du diagnostic existe dans les deux langues', () => {
    const keys = new Set<string>()
    const rng = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(42)
    for (let i = 0; i < 4000; i++) {
      const lights: Light[] = (['key', 'fill', 'rim'] as const).map(id => ({
        id, ...polarToXZ(rng() * 360 - 180, 1.5 + rng() * 1.5, 0), power: Math.round(rng() * 100), modifier: 'Softbox', enabled: rng() > .15, height: .5 + rng() * 3,
      }))
      for (const setup of setups) for (const check of evaluate(setup.challenge, lights, 0)) if (check.hint) keys.add(check.hint.key)
    }
    expect(keys.size).toBeGreaterThan(10)
    for (const key of keys) {
      expect(dictionaries.fr, key).toHaveProperty([key])
      expect(dictionaries.en, key).toHaveProperty([key])
    }
  })
})

describe('modèle', () => {
  it('le faisceau automatique se resserre quand la lampe recule', () => {
    const near: Light = { id: 'key', ...polarToXZ(-45, 1.6, 0), power: 70, modifier: 'Softbox', enabled: true }
    const far: Light = { ...near, ...polarToXZ(-45, 3, 0) }
    expect(fittedBeamAngle(far, 0)).toBeLessThan(fittedBeamAngle(near, 0))
  })

  it('le ratio est nul sans remplissage', () => {
    const [key, fill] = setups[0].lights
    expect(fillRatio(key, { ...fill, enabled: false }, 0)).toBe(0)
    expect(fillRatio(key, fill, 0)).toBeGreaterThan(0)
  })
})

describe('contenus', () => {
  it('chaque schéma a ses astuces et ses questions, dans les deux langues', () => {
    for (const setup of setups) {
      expect(knowledgeBySetup[setup.id]?.length, setup.id).toBeGreaterThanOrEqual(3)
      const questions = questionsBySetup[setup.id]
      expect(questions?.length, setup.id).toBeGreaterThanOrEqual(3)
      for (const q of questions) {
        expect(q.question.fr && q.question.en).toBeTruthy()
        if (q.type === 'single') expect(q.options![q.answer as number], q.id).toBeDefined()
        if (q.type === 'multiple') for (const i of q.answer as number[]) expect(q.options![i], q.id).toBeDefined()
        if (q.type === 'bool') expect(typeof q.answer).toBe('boolean')
        for (const option of q.options ?? []) expect(option.fr && option.en, q.id).toBeTruthy()
      }
    }
  })

  it('les identifiants de questions sont uniques', () => {
    const ids = Object.values(questionsBySetup).flat().map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toutes les clés de traduction utilisées dans le code existent', () => {
    const files: string[] = []
    const walk = (dir: string) => readdirSync(dir).forEach(name => {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (/\.tsx?$/.test(name) && !name.endsWith('.test.ts')) files.push(path)
    })
    walk(join(__dirname))
    const used = new Set<string>()
    for (const file of files) for (const match of readFileSync(file, 'utf8').matchAll(/\bt\('([a-zA-Z]+\.[a-zA-Z]+)'/g)) used.add(match[1])
    expect(used.size).toBeGreaterThan(40)
    for (const key of used) expect(dictionaries.fr, key).toHaveProperty([key])
  })
})
