import {
  CAMERA_HEIGHT_RANGE, FOCAL_RANGE, HEAD_TURN, MAX_CAMERA_DISTANCE, MIN_CAMERA_DISTANCE, distanceForFrame, elevationDeg, emitterPlanar, faceTurnDeg,
  fillRatio, frameHeight, lightHeight, lightTargetHeight, relAzimuthDeg, wrapDeg, type Light, type View,
} from './model'
import type { ChallengeSpec, Range } from './content/setups'

export type CheckGroup = 'framing' | 'key' | 'fill' | 'rim'
export type CheckId = 'faceTurn' | 'cameraHeight' | 'focal' | 'frame' | 'keyAngle' | 'keyHeight' | 'fill' | 'fillSide' | 'fillPlacement' | 'rim'
export type Hint = { key: string; vars?: Record<string, string | number> }
export type Check = { id: CheckId; group: CheckGroup; ok: boolean; hint?: Hint }

export const groupOrder: CheckGroup[] = ['framing', 'key', 'fill', 'rim']

const inRange = (value: number, [min, max]: Range) => value >= min && value <= max
const roundTo = (value: number, step: number) => Math.max(step, Math.round(value / step) * step)
const mid = ([min, max]: Range) => (min + max) / 2

/** Point de vue par défaut : boîtier dans l'axe, 2 m, hauteur d'yeux, 85 mm, Vénus non tournée. */
export const defaultView: View = { cameraAngle: 0, cameraDistance: 2, cameraHeight: 1.7, focal: 85, subjectRotY: 0 }

/** Hauteur à donner à une lampe pour atteindre une élévation (en degrés) vue depuis sa cible. */
const heightFor = (light: Light, subjectZ: number, elevation: number) => lightTargetHeight(light) + Math.tan(elevation * Math.PI / 180) * Math.max(emitterPlanar(light, subjectZ), .01)

function heightHint(light: Light, subjectZ: number, range: Range, prefix: 'key' | 'fill'): Hint {
  const target = Math.min(3.5, Math.max(.5, heightFor(light, subjectZ, mid(range))))
  const delta = target - lightHeight(light)
  return { key: `hint.${prefix}${delta > 0 ? 'Up' : 'Down'}`, vars: { cm: roundTo(Math.abs(delta) * 100, 5) } }
}

/**
 * Compare la scène au rendu recherché : cadrage (orientation du visage, hauteur, focale, taille du cadre),
 * puis principale, remplissage et contre-jour. Les angles des lampes sont mesurés depuis le boîtier.
 */
export function evaluate(spec: ChallengeSpec, lights: Light[], subjectZ: number, view: View = defaultView): Check[] {
  const azimuthDeg = (light: Light) => relAzimuthDeg(light, subjectZ, view.cameraAngle)
  const faceTurn = faceTurnDeg(view)
  const checks: Check[] = []
  const push = (group: CheckGroup, id: CheckId, hint?: Hint) => checks.push({ id, group, ok: !hint, hint })

  // ---- Cadrage : comme sur la référence
  if (!inRange(faceTurn, spec.faceTurn)) {
    // tourner le boîtier vers la droite du plan (angle croissant) ramène le visage vers la gauche de l'image
    const delta = faceTurn - mid(spec.faceTurn)
    push('framing', 'faceTurn', { key: delta > 0 ? 'hint.orbitRight' : 'hint.orbitLeft', vars: { deg: roundTo(Math.abs(delta), 5) } })
  } else push('framing', 'faceTurn')

  if (!inRange(view.cameraHeight, CAMERA_HEIGHT_RANGE)) {
    const delta = mid(CAMERA_HEIGHT_RANGE) - view.cameraHeight
    push('framing', 'cameraHeight', { key: delta > 0 ? 'hint.cameraUp' : 'hint.cameraDown', vars: { cm: roundTo(Math.abs(delta) * 100, 5) } })
  } else push('framing', 'cameraHeight')

  if (!inRange(view.focal, FOCAL_RANGE)) push('framing', 'focal', { key: view.focal < FOCAL_RANGE[0] ? 'hint.focalLonger' : 'hint.focalShorter' })
  else push('framing', 'focal')

  const frame = frameHeight(view.cameraDistance, view.focal)
  if (!inRange(frame, spec.frame)) {
    const wanted = Math.min(MAX_CAMERA_DISTANCE, Math.max(MIN_CAMERA_DISTANCE, distanceForFrame(mid(spec.frame), view.focal)))
    const delta = wanted - view.cameraDistance
    push('framing', 'frame', Math.abs(delta) < .05
      ? { key: frame > spec.frame[1] ? 'hint.frameZoomIn' : 'hint.frameZoomOut' }
      : { key: delta > 0 ? 'hint.cameraBack' : 'hint.cameraCloser', vars: { cm: roundTo(Math.abs(delta) * 100, 5) } })
  } else push('framing', 'frame')

  // ---- Principale
  const key = lights.find(l => l.id === 'key')
  const fill = lights.find(l => l.id === 'fill')
  const rim = lights.find(l => l.id === 'rim')
  // côté attendu : fixé par la référence, ou déduit de l'orientation du visage pour broad / short
  const keySide = spec.keySide === 'left' || spec.keySide === 'right' ? spec.keySide
    : !spec.keySide || Math.abs(faceTurn) < 8 ? undefined
      : (spec.keySide === 'broad') === (faceTurn > 0) ? 'left' : 'right'
  let keyAz = 0
  if (!key?.enabled) {
    push('key', 'keyAngle', { key: 'hint.keyOn' })
  } else {
    keyAz = azimuthDeg(key)
    const abs = Math.abs(keyAz)
    if (keySide && abs > 3 && (keyAz < 0 ? 'left' : 'right') !== keySide) push('key', 'keyAngle', { key: keySide === 'left' ? 'hint.keyToLeft' : 'hint.keyToRight' })
    else if (abs < spec.keyAzimuth[0]) push('key', 'keyAngle', { key: keySide ? (keySide === 'left' ? 'hint.keyWiderLeft' : 'hint.keyWiderRight') : 'hint.keyWider', vars: { deg: roundTo(mid(spec.keyAzimuth) - abs, 5) } })
    else if (abs > spec.keyAzimuth[1]) push('key', 'keyAngle', { key: 'hint.keyNarrower', vars: { deg: roundTo(abs - mid(spec.keyAzimuth), 5) } })
    else push('key', 'keyAngle')
    const elevation = elevationDeg(key, subjectZ)
    push('key', 'keyHeight', inRange(elevation, spec.keyElevation) ? undefined : heightHint(key, subjectZ, spec.keyElevation, 'key'))
  }

  // ---- Remplissage : dosage, côté, placement
  const ratio = fillRatio(key, fill, subjectZ)
  if (spec.fillRatio[0] > 0 && !fill?.enabled) push('fill', 'fill', { key: 'hint.fillOn' })
  else if (ratio < spec.fillRatio[0]) push('fill', 'fill', { key: 'hint.fillMore' })
  else if (ratio > spec.fillRatio[1]) push('fill', 'fill', { key: spec.fillRatio[1] < .4 ? 'hint.fillMuchLess' : 'hint.fillLess' })
  else push('fill', 'fill')

  if (spec.fillOpposite && fill?.enabled && key?.enabled && Math.abs(keyAz) > 15) {
    const fillAz = azimuthDeg(fill)
    const sameSide = Math.abs(fillAz) > 12 && Math.sign(fillAz) === Math.sign(keyAz)
    push('fill', 'fillSide', sameSide ? { key: 'hint.fillOpposite' } : undefined)
  }

  if (fill && (spec.fillAzimuth || spec.fillElevation)) {
    if (spec.fillAzimuth && !inRange(Math.abs(azimuthDeg(fill)), spec.fillAzimuth)) push('fill', 'fillPlacement', { key: 'hint.fillCentre' })
    else if (spec.fillElevation && !inRange(elevationDeg(fill, subjectZ), spec.fillElevation)) push('fill', 'fillPlacement', heightHint(fill, subjectZ, spec.fillElevation, 'fill'))
    else push('fill', 'fillPlacement')
  }

  // ---- Contre-jour
  if (spec.rim) {
    if (!rim?.enabled) push('rim', 'rim', { key: 'hint.rimOn' })
    else if (Math.abs(azimuthDeg(rim)) < 110) push('rim', 'rim', { key: 'hint.rimBehind' })
    else push('rim', 'rim')
  }

  return checks
}

export const isSolved = (checks: Check[]) => checks.length > 0 && checks.every(check => check.ok)

/** Boîtier placé comme sur la référence, pour la rotation actuelle de la Vénus. */
export const referenceView = (spec: ChallengeSpec, subjectRotY: number): View => ({
  cameraAngle: Math.round(wrapDeg(HEAD_TURN + subjectRotY - mid(spec.faceTurn))),
  cameraDistance: Math.round(distanceForFrame(mid(spec.frame), 85) * 10) / 10,
  cameraHeight: 1.7,
  focal: 85,
  subjectRotY,
})
