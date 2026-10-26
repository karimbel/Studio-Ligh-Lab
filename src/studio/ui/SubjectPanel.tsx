import { useI18n, type TKey } from '../i18n'
import type { Backdrop, BackgroundLight } from '../scene/Studio'
import { Switch } from './LightPanel'
import { Range } from './Range'

export const backdropColors: { id: string; key: TKey; value: string }[] = [
  { id: 'black', key: 'color.black', value: '#15171b' },
  { id: 'grey', key: 'color.grey', value: '#5b6068' },
  { id: 'white', key: 'color.white', value: '#d9dcdf' },
]

type Props = {
  cameraAngle: number; setCameraAngle: (v: number) => void
  cameraDistance: number; setCameraDistance: (v: number) => void
  cameraHeight: number; setCameraHeight: (v: number) => void
  focalLength: number; setFocalLength: (v: number) => void
  subjectZ: number; setSubjectZ: (v: number) => void
  subjectRotY: number; setSubjectRotY: (v: number) => void
  backdrop: Backdrop; setBackdrop: (v: Backdrop) => void
  background: BackgroundLight; setBackground: (v: BackgroundLight) => void
}

export function SubjectPanel(p: Props) {
  const { t, num } = useI18n()
  return <div className="subject-panel">
    <div className="field-group">{t('subject.camera')}</div>
    <label className="field">{t('subject.orbit')} <output>{p.cameraAngle}°</output><Range min="-180" max="180" step="1" value={p.cameraAngle} onChange={e => p.setCameraAngle(+e.target.value)} /></label>
    <label className="field">{t('subject.distance')} <output>{num(p.cameraDistance)} m</output><Range min="1.5" max="4" step=".1" value={p.cameraDistance} onChange={e => p.setCameraDistance(+e.target.value)} /></label>
    <label className="field">{t('subject.height')} <output>{num(p.cameraHeight)} m</output><Range min="0.6" max="2.2" step=".1" value={p.cameraHeight} onChange={e => p.setCameraHeight(+e.target.value)} /></label>
    <label className="field">{t('subject.focal')} <output>{p.focalLength} mm</output><Range min="24" max="200" step="1" value={p.focalLength} onChange={e => p.setFocalLength(+e.target.value)} /></label>
    <div className="lesson"><span>{t('subject.lesson')}</span><p>{t('subject.lessonText')}</p></div>

    <div className="field-group">{t('subject.subject')}</div>
    <label className="field">{t('subject.forward')} <output>{num(p.subjectZ, 2)} m</output><Range min="-1.5" max=".5" step=".25" value={p.subjectZ} onChange={e => p.setSubjectZ(+e.target.value)} /></label>
    <label className="field">{t('subject.orientation')} <output>{p.subjectRotY}°</output><Range min="-180" max="180" step="1" value={p.subjectRotY} onChange={e => p.setSubjectRotY(+e.target.value)} /></label>
    <p className="field-hint">{t('subject.followHint')}</p>

    <div className="field-group">{t('subject.backdrop')}</div>
    <Switch checked={p.backdrop.visible} onChange={visible => p.setBackdrop({ ...p.backdrop, visible })} label={t('subject.backdropShow')} />
    {p.backdrop.visible && <div className="swatches">
      {backdropColors.map(color => <button key={color.id} type="button" className={p.backdrop.color === color.value ? 'swatch active' : 'swatch'} onClick={() => p.setBackdrop({ ...p.backdrop, color: color.value })}><span style={{ background: color.value }} />{t(color.key)}</button>)}
    </div>}
    <Switch checked={p.background.enabled} onChange={enabled => p.setBackground({ ...p.background, enabled, })} label={t('subject.bgLight')} />
    {p.background.enabled && <>
      <label className="field">{t('subject.power')} <output>{p.background.power} %</output><Range min="0" max="100" value={p.background.power} onChange={e => p.setBackground({ ...p.background, power: +e.target.value })} /></label>
      <label className="field">{t('subject.bgAngle')} <output>{p.background.angle}° · {p.background.angle === 0 ? t('light.axis') : p.background.angle < 0 ? t('light.left') : t('light.right')}</output><Range min="-60" max="60" step="1" value={p.background.angle} onChange={e => p.setBackground({ ...p.background, angle: +e.target.value })} /></label>
      <label className="field">{t('subject.bgHeight')} <output>{num(p.background.height, 2)} m</output><Range min=".2" max="2.4" step=".05" value={p.background.height} onChange={e => p.setBackground({ ...p.background, height: +e.target.value })} /></label>
      <p className="field-hint">{t('subject.bgHint')}</p>
    </>}
  </div>
}
