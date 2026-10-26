import { azimuthDeg, elevationDeg, emitterPlanar, fillRatio, lightHeight, lightTargetHeight, type Light } from './model'
import type { ChallengeSpec, Range } from './content/setups'

export type CheckId = 'keyAngle' | 'keyHeight' | 'fill' | 'fillPlacement' | 'rim'
export type Hint = { key: string; vars?: Record<string, string | number> }
export type Check = { id: CheckId; ok: boolean; hint?: Hint }

const inRange = (value: number, [min, max]: Range) => value >= min && value <= max
const roundTo = (value: number, step: number) => Math.max(step, Math.round(value / step) * step)
const mid = ([min, max]: Range) => (min + max) / 2

/** Hauteur à donner à une lampe pour atteindre une élévation (en degrés) vue depuis sa cible. */
const heightFor = (light: Light, subjectZ: number, elevation: number) => lightTargetHeight(light) + Math.tan(elevation * Math.PI / 180) * Math.max(emitterPlanar(light, subjectZ), .01)

function heightHint(light: Light, subjectZ: number, range: Range, prefix: 'key' | 'fill'): Hint {
  const target = Math.min(3.5, Math.max(.5, heightFor(light, subjectZ, mid(range))))
  const delta = target - lightHeight(light)
  return { key: `hint.${prefix}${delta > 0 ? 'Up' : 'Down'}`, vars: { cm: roundTo(Math.abs(delta) * 100, 5) } }
}

export function evaluate(spec: ChallengeSpec, lights: Light[], subjectZ: number): Check[] {
  const key = lights.find(l => l.id === 'key')
  const fill = lights.find(l => l.id === 'fill')
  const rim = lights.find(l => l.id === 'rim')
  const checks: Check[] = []

  // Angle de la principale
  if (!key?.enabled) {
    checks.push({ id: 'keyAngle', ok: false, hint: { key: 'hint.keyOn' } })
  } else {
    const az = azimuthDeg(key, subjectZ)
    const side = az < 0 ? 'left' : 'right'
    const abs = Math.abs(az)
    if (spec.keySide && abs > 3 && side !== spec.keySide) {
      checks.push({ id: 'keyAngle', ok: false, hint: { key: spec.keySide === 'left' ? 'hint.keyToLeft' : 'hint.keyToRight' } })
    } else if (abs < spec.keyAzimuth[0]) {
      checks.push({ id: 'keyAngle', ok: false, hint: { key: 'hint.keyWider', vars: { deg: roundTo(mid(spec.keyAzimuth) - abs, 5) } } })
    } else if (abs > spec.keyAzimuth[1]) {
      checks.push({ id: 'keyAngle', ok: false, hint: { key: 'hint.keyNarrower', vars: { deg: roundTo(abs - mid(spec.keyAzimuth), 5) } } })
    } else {
      checks.push({ id: 'keyAngle', ok: true })
    }
    const elevation = elevationDeg(key, subjectZ)
    checks.push(inRange(elevation, spec.keyElevation) ? { id: 'keyHeight', ok: true } : { id: 'keyHeight', ok: false, hint: heightHint(key, subjectZ, spec.keyElevation, 'key') })
  }

  // Remplissage : dosage
  const ratio = fillRatio(key, fill, subjectZ)
  if (spec.fillRatio[0] > 0 && !fill?.enabled) {
    checks.push({ id: 'fill', ok: false, hint: { key: 'hint.fillOn' } })
  } else if (ratio < spec.fillRatio[0]) {
    checks.push({ id: 'fill', ok: false, hint: { key: 'hint.fillMore' } })
  } else if (ratio > spec.fillRatio[1]) {
    checks.push({ id: 'fill', ok: false, hint: { key: spec.fillRatio[1] < .4 ? 'hint.fillMuchLess' : 'hint.fillLess' } })
  } else {
    checks.push({ id: 'fill', ok: true })
  }

  // Remplissage : placement (clamshell)
  if (fill && (spec.fillAzimuth || spec.fillElevation)) {
    if (spec.fillAzimuth && !inRange(Math.abs(azimuthDeg(fill, subjectZ)), spec.fillAzimuth)) {
      checks.push({ id: 'fillPlacement', ok: false, hint: { key: 'hint.fillCentre' } })
    } else if (spec.fillElevation && !inRange(elevationDeg(fill, subjectZ), spec.fillElevation)) {
      checks.push({ id: 'fillPlacement', ok: false, hint: heightHint(fill, subjectZ, spec.fillElevation, 'fill') })
    } else {
      checks.push({ id: 'fillPlacement', ok: true })
    }
  }

  // Contre-jour
  if (spec.rim) {
    if (!rim?.enabled) checks.push({ id: 'rim', ok: false, hint: { key: 'hint.rimOn' } })
    else if (Math.abs(azimuthDeg(rim, subjectZ)) < 110) checks.push({ id: 'rim', ok: false, hint: { key: 'hint.rimBehind' } })
    else checks.push({ id: 'rim', ok: true })
  }

  return checks
}

export const isSolved = (checks: Check[]) => checks.length > 0 && checks.every(check => check.ok)
