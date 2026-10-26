import { useI18n } from '../i18n'
import { IconChevron } from './icons'

type Props = {
  label: string
  reference?: string
  tip: string | null
  collapsed: boolean
  unread: boolean
  onToggle: () => void
}

/**
 * Rendu recherché + « Le saviez-vous ? ». Repliée, la carte se réduit à une barre avec une vignette
 * de la référence ; une nouvelle astuce y est signalée par un point au lieu de rouvrir la carte.
 */
export function ReferenceCard({ label, reference, tip, collapsed, unread, onToggle }: Props) {
  const { t } = useI18n()
  return <div className={`info-pop ${collapsed ? 'is-collapsed' : ''}`} role="note">
    <button type="button" className="card-head" onClick={onToggle} aria-expanded={!collapsed} title={t(collapsed ? 'common.expand' : 'common.collapse')}>
      {collapsed && reference && <img className="card-thumb" src={reference} alt="" />}
      <span className="eyebrow">{t('tip.title')} • {label.toUpperCase()}</span>
      {collapsed && unread && <span className="card-dot" title={t('tip.new')} />}
      <span className="card-chevron"><IconChevron size={16} /></span>
    </button>
    {!collapsed && <>
      {reference && <figure className="lighting-reference"><img src={reference} alt={t('tip.alt', { label })} /></figure>}
      {tip && <div className="tip-body"><span className="eyebrow">{t('tip.eyebrow')}</span><p>{tip}</p></div>}
    </>}
  </div>
}
