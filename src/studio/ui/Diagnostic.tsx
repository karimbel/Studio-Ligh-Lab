import { useEffect, useState } from 'react'
import { useI18n, type TKey } from '../i18n'
import type { Check } from '../challenge'
import { IconCheck, IconCross, IconTarget } from './icons'

type Props = {
  checks: Check[]
  active: boolean
  done: boolean
  justSolved: boolean
  onStart: () => void
  onAbandon: () => void
}

export function Diagnostic({ checks, active, done, justSolved, onStart, onAbandon }: Props) {
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 720px)').matches)
  useEffect(() => { if (active || justSolved) setCollapsed(false) }, [active, justSolved])
  const solved = checks.every(check => check.ok)
  return <div className={`diagnostic ${active ? 'is-active' : ''} ${justSolved ? 'is-solved' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
    <button type="button" className="diagnostic-head" onClick={() => setCollapsed(c => !c)} aria-expanded={!collapsed}>
      <span className="eyebrow">{active ? t('diag.challenge') : t('diag.title')}</span>
      <span className="diagnostic-score">{checks.filter(c => c.ok).length}/{checks.length}</span>
    </button>
    {!collapsed && <>
      {justSolved && <div className="diagnostic-win"><strong>{t('diag.solved')}</strong><p>{t('diag.solvedText')}</p></div>}
      {active && !justSolved && <p className="field-hint">{t('diag.startHint')}</p>}
      <ul className="checks">
        {checks.map(check => <li key={check.id} className={check.ok ? 'ok' : 'ko'}>
          <span className="check-icon">{check.ok ? <IconCheck size={14} /> : <IconCross size={14} />}</span>
          <span>
            <strong>{t(`check.${check.id}`)}</strong>
            {!check.ok && check.hint && <em>{t(check.hint.key as TKey, check.hint.vars)}</em>}
          </span>
        </li>)}
      </ul>
      {!active && solved && !justSolved && <p className="field-hint">{t('diag.allGood')}</p>}
      <div className="diagnostic-actions">
        {active
          ? <button type="button" className="ghost-btn" onClick={onAbandon}>{t('diag.abandon')}</button>
          : <button type="button" className="cta cta-small" onClick={onStart}><IconTarget size={15} />{done ? t('diag.again') : t('diag.start')}{done && <span className="done-star">★</span>}</button>}
      </div>
    </>}
  </div>
}
