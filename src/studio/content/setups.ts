import type { Light, Modifier } from '../model'
import rembrandtReference from '../../assets/lighting-references/rembrandt.webp'
import butterflyReference from '../../assets/lighting-references/butterfly.webp'
import loopReference from '../../assets/lighting-references/loop.webp'
import splitReference from '../../assets/lighting-references/split.webp'
import broadReference from '../../assets/lighting-references/broad.webp'
import shortReference from '../../assets/lighting-references/short.webp'
import clamshellReference from '../../assets/lighting-references/clamshell.webp'

export type L10n = { fr: string; en: string }
export type Range = [number, number]

/**
 * Ce que montre le rendu recherché, et donc ce que l'élève doit reproduire.
 * Les angles des lampes sont mesurés depuis le boîtier (0° = axe de l'appareil).
 */
export type ChallengeSpec = {
  faceTurn: Range // orientation du visage vue du boîtier : 0 = de face, > 0 = tourné vers la droite de l'image
  frame: Range // hauteur de scène couverte par l'image au niveau du sujet (m) : buste = tête + épaules
  keyAzimuth: Range // valeur absolue, en degrés
  keySide?: 'left' | 'right' | 'broad' | 'short' // côté de l'image, ou côté du visage selon son orientation
  fillOpposite?: boolean // remplissage du côté opposé à la principale
  keyElevation: Range
  fillRatio: Range // remplissage / principale
  fillAzimuth?: Range
  fillElevation?: Range
  rim?: boolean
}

export type Setup = {
  id: string
  label: L10n
  description: L10n
  lights: Light[]
  reference?: string
  challenge: ChallengeSpec
}

const DISTANCE = 2
/** Cadrage « buste » des références : la tête et le haut des épaules. */
const BUST: Range = [.42, .75]
const around = (x: number, z: number) => {
  const angle = Math.atan2(x, z)
  return { x: Math.sin(angle) * DISTANCE, z: Math.cos(angle) * DISTANCE }
}
const key = (x: number, z: number, modifier: Modifier = 'Snoot', power = 72): Light => ({ id: 'key', ...around(x, z), power, modifier, enabled: true })
const fill = (x: number, z: number, power = 18, modifier: Modifier = 'Reflecteur', height = 1.7, targetY?: number): Light => ({ id: 'fill', ...around(x, z), power, modifier, enabled: true, height, targetY })
const rim = (enabled = false, x = 1.5, z = -1.5): Light => ({ id: 'rim', ...around(x, z), power: 90, modifier: 'Stripbox', enabled, height: 2.2, targetY: 1.72 })

export const setups: Setup[] = [
  {
    id: 'rembrandt',
    label: { fr: 'Rembrandt', en: 'Rembrandt' },
    description: { fr: 'Triangle lumineux sous l’œil opposé. Source à 45° et légèrement haute.', en: 'A small triangle of light under the far eye. Source at 45°, slightly high.' },
    lights: [key(-3, 2.5), fill(2.5, 1), rim()],
    reference: rembrandtReference,
    challenge: { faceTurn: [-12, 12], frame: BUST, keyAzimuth: [38, 62], keySide: 'left', keyElevation: [30, 55], fillRatio: [.1, .5], fillOpposite: true },
  },
  {
    id: 'butterfly',
    label: { fr: 'Butterfly / Paramount', en: 'Butterfly / Paramount' },
    description: { fr: 'Ombre papillon sous le nez. Source frontale, haute et centrée.', en: 'Butterfly-shaped shadow under the nose. Frontal, high and centred source.' },
    lights: [key(0, 3.5), fill(0, 1.5), rim()],
    reference: butterflyReference,
    challenge: { faceTurn: [-12, 12], frame: BUST, keyAzimuth: [0, 12], keyElevation: [30, 60], fillRatio: [.1, .6] },
  },
  {
    id: 'loop',
    label: { fr: 'Loop', en: 'Loop' },
    description: { fr: 'Petite ombre du nez en boucle, sans rejoindre l’ombre de la joue.', en: 'A small looping nose shadow that does not reach the cheek shadow.' },
    lights: [key(-2.3, 3), fill(2.8, 1), rim()],
    reference: loopReference,
    challenge: { faceTurn: [-12, 12], frame: BUST, keyAzimuth: [22, 42], keySide: 'left', keyElevation: [25, 50], fillRatio: [.15, .55], fillOpposite: true },
  },
  {
    id: 'split',
    label: { fr: 'Split', en: 'Split' },
    description: { fr: 'Une moitié du visage éclairée, l’autre dans l’ombre.', en: 'One half of the face lit, the other in shadow.' },
    lights: [key(-4, 0), fill(4, 0), rim()],
    reference: splitReference,
    challenge: { faceTurn: [-12, 12], frame: BUST, keyAzimuth: [75, 105], keySide: 'left', keyElevation: [0, 50], fillRatio: [0, .35], fillOpposite: true },
  },
  {
    id: 'broad',
    label: { fr: 'Broad', en: 'Broad' },
    description: { fr: 'La partie la plus visible du visage reçoit la lumière.', en: 'The side of the face turned towards the camera gets the light.' },
    lights: [key(-3.2, 2.2), fill(2, 1), rim()],
    reference: broadReference,
    challenge: { faceTurn: [20, 50], frame: BUST, keyAzimuth: [40, 70], keySide: 'broad', keyElevation: [25, 55], fillRatio: [.1, .5], fillOpposite: true },
  },
  {
    id: 'short',
    label: { fr: 'Short', en: 'Short' },
    description: { fr: 'La partie la moins visible du visage est éclairée, pour plus de volume.', en: 'The side of the face turned away from the camera is lit, for more depth.' },
    lights: [key(3.2, 2.2), fill(-2, 1), rim()],
    reference: shortReference,
    challenge: { faceTurn: [20, 50], frame: BUST, keyAzimuth: [40, 70], keySide: 'short', keyElevation: [25, 55], fillRatio: [.1, .5], fillOpposite: true },
  },
  {
    id: 'clamshell',
    label: { fr: 'Clamshell', en: 'Clamshell' },
    description: { fr: 'Deux sources alignées : une au-dessus, une sous le visage.', en: 'Two stacked sources: one above, one below the face.' },
    lights: [key(0, 3.5, 'Snoot', 50), fill(0, 2, 24, 'Reflecteur', 1.05, 1.7), rim()],
    reference: clamshellReference,
    challenge: { faceTurn: [-12, 12], frame: [.5, .9], keyAzimuth: [0, 15], keyElevation: [30, 60], fillRatio: [.25, .8], fillAzimuth: [0, 20], fillElevation: [-60, -20] },
  },
  {
    id: 'threepoint',
    label: { fr: 'Trois points', en: 'Three-point' },
    description: { fr: 'Principale, remplissage et contre-jour : le sujet se détache du fond.', en: 'Key, fill and rim light: the subject separates from the background.' },
    lights: [key(-2.8, 2.6, 'Softbox'), fill(2.6, 1.2, 16), rim(true)],
    challenge: { faceTurn: [-15, 45], frame: BUST, keyAzimuth: [25, 55], keyElevation: [25, 55], fillRatio: [.12, .55], fillOpposite: true, rim: true },
  },
]

/** Lampe placée par rapport au boîtier : azimut (°, négatif = gauche de l'image), à 2 m du sujet. */
const at = (id: Light['id'], azimuth: number, extra: Partial<Light>): Light => {
  const a = azimuth * Math.PI / 180
  return { id, x: Math.sin(a) * DISTANCE, z: Math.cos(a) * DISTANCE, power: 60, modifier: 'Softbox', enabled: true, height: 1.7, ...extra }
}

/** Boîtier d'un point de départ : angle autour du sujet, distance, hauteur, focale. */
export type StartCamera = { cameraAngle: number; cameraDistance: number; cameraHeight: number; focal: number }

/**
 * Points de départ de l'exercice : boîtier et lampes déréglés, différents à chaque essai.
 * Les lampes sont données par rapport au boîtier ; aucun ne réussit un schéma (vérifié par les tests).
 */
export const exerciseStarts: { camera: StartCamera; lights: Light[] }[] = [
  { // boîtier dans l'axe mais trop bas, principale collée à l'objectif, remplissage trop fort
    camera: { cameraAngle: 0, cameraDistance: 2, cameraHeight: 1.45, focal: 85 },
    lights: [at('key', 0, { power: 72 }), at('fill', 60, { power: 55, modifier: 'Reflecteur' }), rim()],
  },
  { // grand-angle de loin et trop haut, principale rasante à droite, remplissage du même côté que la caméra
    camera: { cameraAngle: -25, cameraDistance: 3.2, cameraHeight: 1.95, focal: 50 },
    lights: [at('key', 80, { height: 1.2, modifier: 'Parapluie' }), at('fill', -20, { power: 50, modifier: 'Reflecteur' }), rim()],
  },
  { // téléobjectif trop serré, principale derrière le sujet, remplissage bas et faible
    camera: { cameraAngle: 0, cameraDistance: 1.6, cameraHeight: 1.7, focal: 135 },
    lights: [at('key', 160, { height: 2.6, power: 72, modifier: 'Snoot' }), at('fill', 10, { power: 8, height: 1, modifier: 'Reflecteur' }), rim()],
  },
  { // boîtier tourné de profil, focale courte, principale presque à l'aplomb, remplissage éteint
    camera: { cameraAngle: 70, cameraDistance: 2.4, cameraHeight: 1.25, focal: 35 },
    lights: [at('key', -15, { height: 3.2, power: 72, modifier: 'Snoot' }), at('fill', 45, { power: 18, enabled: false, modifier: 'Reflecteur' }), { ...rim(true), power: 60 }],
  },
]
