import { useI18n } from '../i18n'
import { Range } from './Range'
import {
  DEFAULT_COLOR, MAX_LIGHT_DISTANCE, MIN_LIGHT_DISTANCE, relAzimuthDeg, beamAngleOf, emitterDistance, lightHeight, modifiers, penumbraOf, planarDistance, shadowDensityOf,
  fillRatio, lightingRatio, ratioStops, type Light,
} from '../model'

type Props = {
  light: Light
  subjectZ: number
  onEdit: (patch: Partial<Light>) => void
  onPolar: (angle: number, distance: number) => void
  showSpotPoint: boolean
  setShowSpotPoint: (value: boolean) => void
  compact?: boolean
  cameraAngle: number
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="switch">
    <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
    <span className="switch-track" aria-hidden="true"><span /></span>
    <span className="switch-label">{label}</span>
  </label>
}

export function LightPanel({ light, subjectZ, onEdit, onPolar, showSpotPoint, setShowSpotPoint, compact, cameraAngle }: Props) {
  const { t, num } = useI18n()
  const planar = planarDistance(light, subjectZ)
  // angle mesuré depuis le boîtier : 0° = dans l'axe de l'appareil
  const angle = Math.round(relAzimuthDeg(light, subjectZ, cameraAngle))
  const beamAngle = beamAngleOf(light, subjectZ)
  const side = Math.abs(angle) < 3 ? t('light.axis') : angle < 0 ? t('light.left') : t('light.right')

  return <div className={`light-panel light-${light.id} ${light.enabled ? '' : 'is-off'}`}>
    <Switch checked={light.enabled} onChange={enabled => onEdit({ enabled })} label={t('light.on')} />
    <fieldset disabled={!light.enabled}>
      <div className="field-group">{t('light.modifier')}</div>
      <div className="chips" role="radiogroup" aria-label={t('light.modifier')}>
        {modifiers.map(modifier => <button key={modifier} type="button" role="radio" aria-checked={light.modifier === modifier} className={light.modifier === modifier ? 'chip active' : 'chip'} onClick={() => onEdit({ modifier })}>{t(`mod.${modifier}`)}</button>)}
      </div>
      <p className="field-hint">{t(`modHint.${light.modifier}`)}</p>

      <div className="field-group">{t('light.position')}</div>
      <label className="field">{t('light.angle')} <output>{angle}° · {side}</output><Range min={-180} max={180} step={1} value={angle} onChange={event => onPolar(+event.target.value, planar)} /></label>
      <label className="field">{t('light.distance')} <output>{num(emitterDistance(light, subjectZ))} m</output><Range min={MIN_LIGHT_DISTANCE} max={MAX_LIGHT_DISTANCE} step={.05} value={planar} onChange={event => onPolar(angle, +event.target.value)} /></label>
      <label className="field">{t('light.height')} <output>{num(lightHeight(light), 2)} m</output><Range min={.5} max={3.5} step={.05} value={lightHeight(light)} onChange={event => onEdit({ height: +event.target.value })} /></label>

      <div className="field-group">{t('light.lamp')}</div>
      <label className="field">{t('light.power')} <output>{light.power} %</output><Range min={0} max={100} value={light.power} onChange={event => onEdit({ power: +event.target.value })} /></label>
      {!compact && <label className="field field-color">{t('light.color')} <output>{light.color ?? DEFAULT_COLOR}</output><input type="color" value={light.color ?? DEFAULT_COLOR} onChange={event => onEdit({ color: event.target.value })} /></label>}

      {!compact && <details className="advanced">
        <summary>{t('light.advanced')}</summary>
        <label className="field">{t('light.intensity')} <output>× {num(light.intensity ?? 1)}</output><Range min={0} max={3} step={.1} value={light.intensity ?? 1} onChange={event => onEdit({ intensity: +event.target.value })} /></label>
        <label className="field">{t('light.beam')} <output>{Math.round(beamAngle * 180 / Math.PI)}°{light.angle === undefined ? ` · ${t('light.beamAuto')}` : ''}</output><Range min={5} max={70} step={1} value={Math.round(beamAngle * 180 / Math.PI)} onChange={event => onEdit({ angle: +event.target.value * Math.PI / 180 })} /></label>
        {light.angle !== undefined && <button type="button" className="ghost-btn" onClick={() => onEdit({ angle: undefined })}>{t('light.beamReset')}</button>}
        <label className="field">{t('light.penumbra')} <output>{num(penumbraOf(light), 2)}</output><Range min={0} max={1} step={.05} value={penumbraOf(light)} onChange={event => onEdit({ penumbra: +event.target.value })} /></label>
        <label className="field">{t('light.cutoff')} <output>{light.distance ?? 0} m</output><Range min={0} max={20} step={.5} value={light.distance ?? 0} onChange={event => onEdit({ distance: +event.target.value })} /></label>
        <label className="field">{t('light.decay')} <output>{num(light.decay ?? 2)}</output><Range min={1} max={2} step={.1} value={light.decay ?? 2} onChange={event => onEdit({ decay: +event.target.value })} /></label>
        <div className="field-group">{t('light.shadow')}</div>
        <label className="field">{t('light.focus')} <output>{num(light.focus ?? 1, 2)}</output><Range min={0} max={1} step={.05} value={light.focus ?? 1} onChange={event => onEdit({ focus: +event.target.value })} /></label>
        <label className="field">{t('light.shadowIntensity')} <output>{num(shadowDensityOf(light), 2)}</output><Range min={0} max={1} step={.05} value={shadowDensityOf(light)} onChange={event => onEdit({ shadowIntensity: +event.target.value })} /></label>
        <label className="check"><input type="checkbox" checked={light.showHelper !== false} onChange={event => onEdit({ showHelper: event.target.checked })} /><span>{t('light.helper')}</span></label>
        <label className="check"><input type="checkbox" checked={showSpotPoint} onChange={event => setShowSpotPoint(event.target.checked)} /><span>{t('light.spot')}</span></label>
      </details>}
    </fieldset>
  </div>
}

/** Ratio d'éclairage : rapport entre le côté éclairé et le côté à l'ombre. */
export function RatioMeter({ lights, subjectZ }: { lights: Light[]; subjectZ: number }) {
  const { t, num } = useI18n()
  const ratio = fillRatio(lights.find(l => l.id === 'key'), lights.find(l => l.id === 'fill'), subjectZ)
  const value = lightingRatio(ratio)
  const stops = ratioStops(ratio)
  const finite = Number.isFinite(value)
  const mood = !finite || value > 6 ? 'hard' : value > 3 ? 'medium' : 'soft'
  const position = finite ? Math.min(100, Math.max(0, (stops / 4) * 100)) : 100
  return <div className="ratio" title={t('ratio.help')}>
    <div className="ratio-head">
      <span className="field-group">{t('ratio.title')}</span>
      <strong className={`ratio-value ratio-${mood}`}>{finite ? `${num(value)}:1` : '∞'}</strong>
    </div>
    <div className="ratio-bar" aria-hidden="true"><span style={{ left: `${position}%` }} /></div>
    <p className="field-hint">{finite ? `${t(`ratio.${mood}`)} · ${t('ratio.stops', { stops: num(stops) })}` : t('ratio.none')}</p>
  </div>
}
