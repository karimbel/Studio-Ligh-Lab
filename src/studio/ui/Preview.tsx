import { useState, type RefObject } from 'react'
import { useI18n } from '../i18n'
import { IconCamera, IconCompare } from './icons'

type Props = {
  canvasRef: RefObject<HTMLCanvasElement>
  reference?: string
  label: string
  flash: boolean
  onPhoto: () => void
}

/** Aperçu « derrière l'appareil », avec comparaison glissante face au rendu recherché. */
export function Preview({ canvasRef, reference, label, flash, onPhoto }: Props) {
  const { t } = useI18n()
  const [compare, setCompare] = useState(false)
  const [split, setSplit] = useState(50)
  const comparing = compare && !!reference
  return <div className="preview-block">
    <div className={`preview ${flash ? 'is-flash' : ''}`}>
      <canvas ref={canvasRef} />
      {comparing && <>
        <img className="preview-reference" src={reference} alt={t('tip.alt', { label })} style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
        <span className="preview-split-line" style={{ left: `${split}%` }} />
        <span className="preview-tag preview-tag-left">{t('preview.reference')}</span>
        <span className="preview-tag preview-tag-right">{t('preview.yours')}</span>
        <input className="preview-split" type="range" min={0} max={100} value={split} onChange={event => setSplit(+event.target.value)} aria-label={t('preview.compare')} />
      </>}
      <div className="preview-head">{t('preview.head')}</div>
    </div>
    <div className="preview-actions">
      <button type="button" className="photo-btn" onClick={onPhoto}><IconCamera size={16} />{t('preview.photo')}</button>
      {reference && <button type="button" className={`icon-btn ${comparing ? 'active' : ''}`} onClick={() => setCompare(c => !c)} aria-pressed={comparing}><IconCompare size={16} />{comparing ? t('preview.compareOff') : t('preview.compare')}</button>}
    </div>
  </div>
}
