import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useI18n } from '../i18n'
import { BACKDROP_Z, CAMERA_SHIFT, EMITTER_OFFSET, MAX_LIGHT_DISTANCE, MIN_LIGHT_DISTANCE, azimuthDeg, beamAngleOf, emitterPlanar, type Light, type LightId } from '../model'

const RANGE = 2.15
const MIN_E = MIN_LIGHT_DISTANCE - EMITTER_OFFSET
const MAX_E = MAX_LIGHT_DISTANCE - EMITTER_OFFSET
const colors: Record<LightId, string> = { key: '#ffd47a', fill: '#9ed4ff', rim: '#d6a8ff' }

type Props = {
  lights: Light[]
  subjectZ: number
  subjectRotY: number
  cameraAngle: number
  cameraDistance: number
  focalLength: number
  backdropVisible: boolean
  selected: LightId | null
  onSelect: (id: LightId) => void
  onMove: (id: LightId, angleDeg: number, planarDistance: number) => void
  onCameraMove: (angleDeg: number) => void
}

/** Plan du plateau vu de dessus : la caméra est en bas, on fait glisser la tête des lampes. */
export function TopView({ lights, subjectZ, subjectRotY, cameraAngle, cameraDistance, focalLength, backdropVisible, selected, onSelect, onMove, onCameraMove }: Props) {
  const { t } = useI18n()
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<LightId | 'camera' | null>(null)

  const toPlan = (event: ReactPointerEvent) => {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) return null
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    return { x: point.x, y: point.y }
  }

  const move = (event: ReactPointerEvent, id: LightId) => {
    const point = toPlan(event)
    if (!point) return
    const angle = Math.round(Math.atan2(point.x, point.y) * 180 / Math.PI)
    const e = Math.min(MAX_E, Math.max(MIN_E, Math.hypot(point.x, point.y)))
    onMove(id, angle, e + EMITTER_OFFSET)
  }

  const camY = Math.min(RANGE - .18, cameraDistance)
  const camX = CAMERA_SHIFT
  const fovHalf = Math.atan(18 / focalLength)
  const fovLength = Math.max(.1, camY)
  const rot = subjectRotY * Math.PI / 180
  const backdropY = BACKDROP_Z - subjectZ

  return <div className="topview">
    <div className="topview-head"><span className="eyebrow">{t('plan.title')}</span><span>{t('plan.hint')}</span></div>
    <svg ref={svgRef} viewBox={`${-RANGE} ${-RANGE} ${RANGE * 2} ${RANGE * 2}`} role="img" aria-label={t('plan.title')}>
      <circle r={MAX_E} className="tv-zone" />
      <circle r={MIN_E} className="tv-zone-inner" />
      {[1, 2].map(r => <circle key={r} r={r} className="tv-ring" />)}
      {backdropVisible && backdropY > -RANGE && <line x1={-RANGE} x2={RANGE} y1={backdropY} y2={backdropY} className="tv-backdrop" />}
      {/* boîtier et champ de vision : le groupe tourne autour du sujet, on fait glisser le boîtier sur son cercle */}
      <circle r={camY} className="tv-camera-orbit" />
      <g transform={`rotate(${-cameraAngle})`}>
      <line x1={0} y1={0} x2={camX} y2={camY} className="tv-axis" />
      <path d={`M ${camX} ${camY} L ${camX + Math.sin(-fovHalf) * -fovLength} ${camY - Math.cos(fovHalf) * fovLength} L ${camX + Math.sin(fovHalf) * -fovLength} ${camY - Math.cos(fovHalf) * fovLength} Z`} className="tv-fov" />
      <g
        transform={`translate(${camX} ${camY})`}
        className={`tv-camera ${dragging === 'camera' ? 'is-dragging' : ''}`}
        tabIndex={0}
        role="slider"
        aria-label={t('subject.orbit')}
        aria-valuemin={-180}
        aria-valuemax={180}
        aria-valuenow={Math.round(cameraAngle)}
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setDragging('camera') }}
        onPointerMove={event => {
          if (dragging !== 'camera') return
          const point = toPlan(event)
          if (point) onCameraMove(Math.round(Math.atan2(point.x, point.y) * 180 / Math.PI))
        }}
        onPointerUp={event => { event.currentTarget.releasePointerCapture(event.pointerId); setDragging(null) }}
        onKeyDown={event => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); onCameraMove(cameraAngle - 5) }
          if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); onCameraMove(cameraAngle + 5) }
        }}
      >
        <circle r={.26} className="tv-camera-hit" />
        <rect x={-.17} y={-.09} width={.34} height={.2} rx={.04} /><rect x={-.07} y={-.18} width={.14} height={.1} rx={.02} />
      </g>
      </g>
      {/* sujet */}
      <g className="tv-subject">
        <circle r={.24} />
        <line x1={0} y1={0} x2={Math.sin(rot) * .36} y2={Math.cos(rot) * .36} />
      </g>
      {lights.map(light => {
        const az = azimuthDeg(light, subjectZ) * Math.PI / 180
        const e = emitterPlanar(light, subjectZ)
        const x = Math.sin(az) * e
        const y = Math.cos(az) * e
        const beam = Math.min(beamAngleOf(light, subjectZ), Math.PI / 3)
        const toward = Math.atan2(-x, -y)
        const reach = e + .25
        const left = { x: x + Math.sin(toward - beam) * reach, y: y + Math.cos(toward - beam) * reach }
        const right = { x: x + Math.sin(toward + beam) * reach, y: y + Math.cos(toward + beam) * reach }
        const isSelected = selected === light.id
        return <g key={light.id} className={`tv-light ${light.enabled ? '' : 'is-off'} ${isSelected ? 'is-selected' : ''}`} style={{ color: colors[light.id] }}>
          {light.enabled && <path d={`M ${x} ${y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`} className="tv-beam" />}
          <circle
            cx={x} cy={y} r={.15}
            className={`tv-handle ${dragging === light.id ? 'is-dragging' : ''}`}
            tabIndex={0}
            role="button"
            aria-label={t(`name.${light.id}`)}
            onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(light.id); onSelect(light.id) }}
            onPointerMove={event => { if (dragging === light.id) move(event, light.id) }}
            onPointerUp={event => { event.currentTarget.releasePointerCapture(event.pointerId); setDragging(null) }}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onSelect(light.id) }}
          />
          <text x={x} y={y + .055} className="tv-letter">{t(`name.${light.id}`).charAt(0)}</text>
        </g>
      })}
    </svg>
  </div>
}
