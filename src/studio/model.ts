export type Modifier = 'Softbox' | 'Parapluie' | 'Stripbox' | 'Reflecteur' | 'Snoot'
export type LightId = 'key' | 'fill' | 'rim'

export type Light = {
  id: LightId
  x: number
  z: number
  power: number
  modifier: Modifier
  enabled: boolean
  color?: string
  intensity?: number
  distance?: number
  angle?: number
  penumbra?: number
  decay?: number
  focus?: number
  shadowIntensity?: number
  showHelper?: boolean
  height?: number
  targetY?: number
}

export const modifiers: Modifier[] = ['Softbox', 'Parapluie', 'Stripbox', 'Reflecteur', 'Snoot']

// Plateau (mètres)
export const SUBJECT_HEIGHT = 1.9
export const VENUS_NATIVE_HEIGHT = 2.120558
export const BUST_CENTER = 1.62 // centre du buste (visage + épaules)
export const BUST_RADIUS = .35
export const EMITTER_OFFSET = 1.2 // la tête de la lampe est avancée vers le sujet par rapport au pied
export const DEFAULT_LIGHT_HEIGHT = 2.4
export const REFERENCE_DISTANCE = 2
export const MIN_LIGHT_DISTANCE = 1.5
export const MAX_LIGHT_DISTANCE = 3
export const CAMERA_SHIFT = -.1
export const DEFAULT_CAMERA_DISTANCE = 2
export const DEFAULT_CAMERA_HEIGHT = 1.7
export const DEFAULT_FOCAL = 85
export const FRAMING_OFFSET = .35
export const BACKDROP_Z = -2.6
export const DEFAULT_COLOR = '#e7f4ff'

const deg = (radians: number) => radians * 180 / Math.PI
const rad = (degrees: number) => degrees * Math.PI / 180

export const lightHeight = (light: Light) => light.height ?? DEFAULT_LIGHT_HEIGHT
export const lightTargetHeight = (light: Light) => light.targetY ?? BUST_CENTER
export const planarDistance = (light: Light, subjectZ: number) => Math.hypot(light.x, light.z - subjectZ)
export const emitterPlanar = (light: Light, subjectZ: number) => planarDistance(light, subjectZ) - EMITTER_OFFSET
export const emitterDistance = (light: Light, subjectZ: number) => Math.hypot(emitterPlanar(light, subjectZ), lightHeight(light) - lightTargetHeight(light))

/** Azimut de la source par rapport à l'axe caméra, en degrés. Négatif = côté gauche de l'image. */
export const azimuthDeg = (light: Light, subjectZ: number) => deg(Math.atan2(light.x, light.z - subjectZ))
/** Élévation de la tête de lampe vue depuis le buste, en degrés. Négatif = source plus basse que la cible. */
export const elevationDeg = (light: Light, subjectZ: number) => deg(Math.atan2(lightHeight(light) - lightTargetHeight(light), Math.max(emitterPlanar(light, subjectZ), .01)))

export const polarToXZ = (angleDeg: number, distance: number, subjectZ: number) => ({ x: Math.sin(rad(angleDeg)) * distance, z: subjectZ + Math.cos(rad(angleDeg)) * distance })
export const clampDistance = (distance: number) => Math.min(MAX_LIGHT_DISTANCE, Math.max(MIN_LIGHT_DISTANCE, distance))

// Le faisceau est calé pour envelopper le buste et le visage, quelle que soit la distance de la lampe.
export const fittedBeamAngle = (light: Light, subjectZ: number) => Math.min(rad(70), Math.max(rad(5), Math.atan(BUST_RADIUS / Math.max(emitterDistance(light, subjectZ), .05))))
export const beamAngleOf = (light: Light, subjectZ: number) => light.angle ?? fittedBeamAngle(light, subjectZ)

// Le modeleur règle la netteté de la lumière : petit et dur (snoot) → bords et ombres nets, grand et diffus (parapluie) → fondus.
const softness: Record<Modifier, number> = { Snoot: 0, Reflecteur: .2, Stripbox: .45, Softbox: .7, Parapluie: 1 }
export const modifierSoftness = (modifier: Modifier) => softness[modifier]
export const modifierPenumbra = (modifier: Modifier) => .1 + softness[modifier] * .5
export const penumbraOf = (light: Light) => light.penumbra ?? modifierPenumbra(light.modifier)
export const shadowRadiusOf = (light: Light) => 1 + softness[light.modifier] * 10
/** Une grande source « enveloppe » le sujet : ses ombres sont un peu moins denses. */
export const shadowDensityOf = (light: Light) => light.shadowIntensity ?? 1 - softness[light.modifier] * .25

/** Éclairement relatif reçu par le sujet (même formule que l'intensité de la lampe). */
export const subjectIllumination = (light: Light, subjectZ: number) => {
  if (!light.enabled) return 0
  const distance = Math.hypot(light.x, light.z - subjectZ, lightHeight(light) - lightTargetHeight(light))
  return light.power * (REFERENCE_DISTANCE / distance) ** 2 * (light.intensity ?? 1)
}

/** Rapport remplissage / principale (0 = pas de remplissage). */
export const fillRatio = (key: Light | undefined, fill: Light | undefined, subjectZ: number) => {
  const k = key ? subjectIllumination(key, subjectZ) : 0
  const f = fill ? subjectIllumination(fill, subjectZ) : 0
  return k > 0 ? f / k : 0
}

/** Ratio d'éclairage photographique (côté éclairé : principale + remplissage, côté ombre : remplissage). */
export const lightingRatio = (ratio: number) => ratio > 0 ? (1 + ratio) / ratio : Infinity
export const ratioStops = (ratio: number) => ratio > 0 ? Math.log2(lightingRatio(ratio)) : Infinity
