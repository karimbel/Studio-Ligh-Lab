import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { exerciseStarts, setups } from './content/setups'
import { knowledgeBySetup, questionsBySetup } from './content/questions'
import { defaultView, evaluate, isSolved, referenceView } from './challenge'
import { dictionaries } from './i18n'
import { HEAD_TURN, azimuthDeg, cameraPose, elevationDeg, faceTurnDeg, fillRatio, fittedBeamAngle, placeLights, polarToXZ, type Light } from './model'

describe('schémas et défi', () => {
  const placed = (setup: typeof setups[number], subjectRotY = 0, subjectZ = 0) => {
    const view = referenceView(setup.challenge, subjectRotY)
    return { view, lights: placeLights(setup.lights, subjectZ, view.cameraAngle) }
  }

  it.each(setups.map(s => [s.id, s] as const))('le preset %s, cadré comme sa référence, réussit son défi', (_, setup) => {
    const { view, lights } = placed(setup)
    const checks = evaluate(setup.challenge, lights, 0, view)
    expect(checks.filter(c => !c.ok)).toEqual([])
  })

  it.each(setups.map(s => [s.id, s] as const))('aucun point de départ ne réussit déjà le schéma %s', (_, setup) => {
    for (const [index, start] of exerciseStarts.entries()) {
      for (const subjectRotY of [0, 35, -60]) {
        const view = { ...start.camera, subjectRotY }
        const checks = evaluate(setup.challenge, placeLights(start.lights, 0, start.camera.cameraAngle), 0, view)
        expect(isSolved(checks), `départ ${index} · Vénus ${subjectRotY}°`).toBe(false)
        // chaque départ laisse du travail sur le cadrage et sur la lumière
        expect(checks.some(c => c.group === 'framing' && !c.ok), `cadrage, départ ${index}`).toBe(true)
        expect(checks.some(c => c.group !== 'framing' && !c.ok), `lumière, départ ${index}`).toBe(true)
      }
    }
  })

  it.each([-90, 0, 45, 120])('les presets restent valides quand la Vénus a pivoté de %s°', rot => {
    for (const setup of setups) {
      const { view, lights } = placed(setup, rot, -1.25)
      expect(isSolved(evaluate(setup.challenge, lights, -1.25, view)), `${setup.id} @ ${rot}°`).toBe(true)
    }
  })

  it('les références de face placent le boîtier face au visage', () => {
    const rembrandt = setups.find(s => s.id === 'rembrandt')!
    expect(Math.abs(faceTurnDeg(referenceView(rembrandt.challenge, 0)))).toBeLessThan(5)
  })

  it('tourner le boîtier hors de la référence est signalé dans le cadrage', () => {
    const rembrandt = setups.find(s => s.id === 'rembrandt')!
    const { view, lights } = placed(rembrandt)
    const checks = evaluate(rembrandt.challenge, lights, 0, { ...view, cameraAngle: view.cameraAngle + 40 })
    const face = checks.find(c => c.id === 'faceTurn')!
    expect(face.ok).toBe(false)
    expect(face.hint?.key).toBe('hint.orbitLeft')
  })

  it('un remplissage du même côté que la principale est signalé', () => {
    const rembrandt = setups.find(s => s.id === 'rembrandt')!
    const { view, lights } = placed(rembrandt)
    const key = lights.find(l => l.id === 'key')!
    const sameSide = lights.map(l => l.id === 'fill' ? { ...l, x: key.x, z: key.z } : l)
    expect(evaluate(rembrandt.challenge, sameSide, 0, view).find(c => c.id === 'fillSide')?.ok).toBe(false)
  })

  it('le cadrage guide la distance et la focale', () => {
    const butterfly = setups.find(s => s.id === 'butterfly')!
    const { view, lights } = placed(butterfly)
    const tooFar = evaluate(butterfly.challenge, lights, 0, { ...view, cameraDistance: 4 }).find(c => c.id === 'frame')!
    expect(tooFar.hint?.key).toBe('hint.cameraCloser')
    const wide = evaluate(butterfly.challenge, lights, 0, { ...view, focal: 35 }).find(c => c.id === 'focal')!
    expect(wide.hint?.key).toBe('hint.focalLonger')
  })

  it('broad et short s’inversent quand le visage se tourne de l’autre côté', () => {
    const broad = setups.find(s => s.id === 'broad')!
    const short = setups.find(s => s.id === 'short')!
    const facingLeft = { ...defaultView, cameraAngle: 2 * HEAD_TURN, subjectRotY: 0 } // visage tourné de -35° : vers la gauche de l'image
    const spec = { ...broad.challenge, faceTurn: [-50, -20] as [number, number] }
    expect(isSolved(evaluate(spec, placeLights(broad.lights, 0, facingLeft.cameraAngle), 0, facingLeft))).toBe(false)
    expect(isSolved(evaluate(spec, placeLights(short.lights, 0, facingLeft.cameraAngle), 0, facingLeft))).toBe(true)
  })

  it('le boîtier tourne autour du sujet à distance constante', () => {
    for (const angle of [0, 60, -150]) {
      const { eye } = cameraPose(angle, 2.5, 1.7, -1)
      expect(Math.hypot(eye[0], eye[2] + 1)).toBeCloseTo(Math.hypot(.1, 2.5), 5)
    }
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
      const view = { cameraAngle: rng() * 360 - 180, cameraDistance: 1.5 + rng() * 2.5, cameraHeight: .6 + rng() * 1.6, focal: 24 + rng() * 176, subjectRotY: rng() * 360 - 180 }
      for (const setup of setups) for (const check of evaluate(setup.challenge, lights, 0, view)) if (check.hint) keys.add(check.hint.key)
    }
    expect(keys.size).toBeGreaterThan(20)
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
