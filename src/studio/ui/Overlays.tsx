import { useEffect, useRef, type ReactNode } from 'react'
import { useI18n, type TKey } from '../i18n'
import type { Setup } from '../content/setups'
import { StarBadge } from './Quiz'
import { IconDownload, IconCross } from './icons'

export type Shot = { id: number; setupId: string; label: string; src: string; challenge: boolean }

export function Modal({ children, onClose, labelledBy, wide }: { children: ReactNode; onClose?: () => void; labelledBy: string; wide?: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    cardRef.current?.querySelector<HTMLElement>('.cta, button, [href], input')?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current?.() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); previous?.focus?.() }
  }, [])
  return <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby={labelledBy} onMouseDown={event => { if (event.target === event.currentTarget) onClose?.() }}>
    <div className={`modal-card ${wide ? 'modal-wide' : ''}`} ref={cardRef}>
      {onClose && <button type="button" className="modal-close" onClick={onClose} aria-label="×"><IconCross size={16} /></button>}
      {children}
    </div>
  </div>
}

export function Intro({ resume, onStart }: { resume: boolean; onStart: () => void }) {
  const { t } = useI18n()
  const steps: TKey[] = ['intro.step1', 'intro.step2', 'intro.step3', 'intro.step4', 'intro.step5']
  return <Modal labelledBy="intro-title" onClose={resume ? onStart : undefined}>
    <span className="eyebrow">{t('intro.eyebrow')}</span>
    <h1 id="intro-title" className="modal-title">Studio Light Lab</h1>
    <p className="modal-text">{t('intro.text')}</p>
    <ol className="intro-steps">{steps.map((step, i) => <li key={step}><strong>{i + 1}</strong><span>{t(step)}</span></li>)}</ol>
    <button type="button" className="cta" onClick={onStart}>{t(resume ? 'intro.resume' : 'intro.cta')}</button>
  </Modal>
}

export function EndModal({ setups, starsOf, solutionShown, totalStars, challenges, answered, onClose, onRestart }: { setups: Setup[]; starsOf: (id: string) => number; solutionShown: Record<string, boolean>; totalStars: number; challenges: number; answered: number; onClose: () => void; onRestart: () => void }) {
  const { t, l } = useI18n()
  const max = setups.length * 3
  const pct = totalStars / max
  const level: TKey = pct < .6 ? 'level.beginner' : pct < .85 ? 'level.intermediate' : 'level.advanced'
  return <Modal labelledBy="end-title" onClose={onClose}>
    <div className="end-card">
      <span className="eyebrow">{t('end.eyebrow')}</span>
      <h1 id="end-title" className="modal-title">{t('end.title')}<span className="title-dot">.</span> {t('end.level')} <span className="end-level">{t(level)}</span></h1>
      <p className="end-summary">{t('end.summary', { stars: totalStars, max, challenges, answered })}{Object.values(solutionShown).some(Boolean) && ` · ${t('end.solutions', { count: Object.values(solutionShown).filter(Boolean).length })}`}</p>
      <div className="end-grid">{setups.map(s => <div key={s.id} className="end-row"><strong>{l(s.label)}</strong>{solutionShown[s.id] ? <span className="end-solution">{t('end.solution')}</span> : <StarBadge filled={starsOf(s.id)} />}</div>)}</div>
      <p className="field-hint end-legend">{t('end.legend')}</p>
      <div className="end-actions">
        <button type="button" className="cta" onClick={onClose}>{t('end.continue')}</button>
        <button type="button" className="ghost-btn" onClick={onRestart}>{t('end.restart')}</button>
      </div>
    </div>
  </Modal>
}

export function Credits({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  return <Modal labelledBy="credits-title" onClose={onClose}>
    <h1 id="credits-title" className="modal-title">{t('credits.title')}</h1>
    <ul className="credits">
      <li><a href="https://doi.org/10.5281/zenodo.10318081" target="_blank" rel="noreferrer">{t('credits.venus')}</a></li>
      <li><a href="https://sketchfab.com/3d-models/canon-eos-60d-ef-85mm-f14l-is-usm-lens-80f7a79909b3492c82e7ebab76f0c93f" target="_blank" rel="noreferrer">{t('credits.camera')}</a></li>
      <li>{t('credits.tech')}</li>
      <li>{t('credits.license')}</li>
    </ul>
  </Modal>
}

export function ContactSheet({ shots, onRemove, onClose }: { shots: Shot[]; onRemove: (id: number) => void; onClose: () => void }) {
  const { t } = useI18n()
  return <Modal labelledBy="sheet-title" onClose={onClose} wide>
    <h1 id="sheet-title" className="modal-title">{t('sheet.title')} <span className="sheet-count">{shots.length}</span></h1>
    {shots.length === 0 ? <p className="modal-text">{t('sheet.empty')}</p> : <>
      <div className="sheet-grid">
        {shots.map((shot, index) => <figure key={shot.id} className="sheet-frame">
          <img src={shot.src} alt={shot.label} />
          <figcaption>
            <span className="sheet-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="sheet-label">{shot.label}{shot.challenge && <em> · {t('sheet.challenge')} ★</em>}</span>
            <a className="icon-btn" href={shot.src} download={`studio-light-${shot.setupId}-${index + 1}.png`} title={t('sheet.download')}><IconDownload size={15} /></a>
            <button type="button" className="icon-btn" onClick={() => onRemove(shot.id)} title={t('sheet.remove')}><IconCross size={15} /></button>
          </figcaption>
        </figure>)}
      </div>
      <p className="field-hint">{t('sheet.session')}</p>
    </>}
  </Modal>
}

export function Toast({ message }: { message: string | null }) {
  return <div className={`toast ${message ? 'is-visible' : ''}`} role="status" aria-live="polite">{message}</div>
}
