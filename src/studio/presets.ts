export type LightType = 'continue' | 'flash'
export type Modifier = 'Softbox' | 'Parapluie' | 'Stripbox' | 'Reflecteur' | 'Snoot'
export type Light = { id: string; name: string; x: number; z: number; power: number; modifier: Modifier; enabled: boolean; color?: string; intensity?: number; distance?: number; angle?: number; penumbra?: number; decay?: number; focus?: number; shadowIntensity?: number; showHelper?: boolean; height?: number; targetY?: number }
export type Setup = { id: string; label: string; description: string; lights: Light[] }

const defaultDistanceFromSubject = 2
const positionFromSubject = (x: number, z: number) => {
  const angle = Math.atan2(x, z)
  return { x: Math.sin(angle) * defaultDistanceFromSubject, z: Math.cos(angle) * defaultDistanceFromSubject }
}
const key = (x: number, z: number, modifier: Modifier = 'Snoot'): Light => ({ id: 'key', name: 'Principale', ...positionFromSubject(x, z), power: 72, modifier, enabled: true, targetY: 1.5 })
const fill = (x: number, z: number, power = 18, modifier: Modifier = 'Reflecteur'): Light => ({ id: 'fill', name: 'Remplissage', ...positionFromSubject(x, z), power, modifier, enabled: true, height: 1.7 })

export const setups: Setup[] = [
  { id: 'rembrandt', label: 'Rembrandt', description: 'Triangle lumineux sous l’œil opposé. Source à 45° et légèrement haute.', lights: [key(-3, 2.5, 'Snoot'), fill(2.5, 1)] },
  { id: 'butterfly', label: 'Butterfly / Paramount', description: 'Ombre papillon sous le nez. Source frontale, haute et centrée.', lights: [key(0, 3.5, 'Snoot'), fill(0, 1.5)] },
  { id: 'loop', label: 'Loop', description: 'Petite ombre du nez en boucle, sans rejoindre l’ombre de la joue.', lights: [key(-2.3, 3, 'Snoot'), fill(2.8, 1)] },
  { id: 'split', label: 'Split', description: 'Une moitié du visage éclairée, l’autre dans l’ombre.', lights: [key(-4, 0, 'Snoot')] },
  { id: 'broad', label: 'Broad', description: 'La partie la plus visible du visage reçoit la lumière.', lights: [key(-3.2, 2.2, 'Snoot'), fill(2, 1)] },
  { id: 'short', label: 'Short', description: 'La partie la moins visible du visage est éclairée, pour plus de volume.', lights: [key(3.2, 2.2, 'Snoot'), fill(-2, 1)] },
  { id: 'clamshell', label: 'Clamshell', description: 'Deux sources alignées : une au-dessus, une sous le visage.', lights: [key(0, 3.5, 'Snoot'), fill(0, -2)] }
]
