import { useEffect, useState } from 'react'
import { useI18n, type TKey } from '../i18n'
import { groupOrder, type Check, type CheckGroup } from '../challenge'
import { IconCamera, IconCheck, IconCross, IconEye, IconFill, IconKey, IconRestart, IconRim, IconTarget } from './icons'

type Props = {
  checks: Check[]
  active: boolean // exercice en cours
  done: boolean // étoile du défi déjà gagnée
  justSolved: boolean
  solutionShown: boolean
  canShowSolution: boolean // débloquée après de vrais essais
  onRestart: () => void
  onShowSolution: () => void
}

const groupIcon: Record<CheckGroup, JSX.Element> = {
  framing: <IconCamera size={14} />,
  key: <IconKey size={14} />,
  fill: <IconFill size={14} />,
  rim: <IconRim size={14} />,
}

/** Compare la scène au rendu recherché, groupe par groupe : seuls les points à corriger restent dépliés. */
export function Diagnostic({ checks, active, done, justSolved, solutionShown, canShowSolution, onRestart, onShowSolution }: Props) {
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 720px)').matches)
  const [confirming, setConfirming] = useState(false)
  useEffect(() => { if (justSolved) setCollapsed(false) }, [justSolved])
  useEffect(() => { if (!active) setConfirming(false) }, [active])
  const solved = checks.every(check => check.ok)
  const groups = groupOrder.map(group => ({ group, items: checks.filter(check => check.group === group) })).filter(g => g.items.length > 0)

  return <div className={`diagnostic ${active ? 'is-active' : ''} ${justSolved ? 'is-solved' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
    <button type="button" className="diagnostic-head" onClick={() => setCollapsed(c => !c)} aria-expanded={!collapsed}>
      <span className="eyebrow">{active ? t('diag.challenge') : t('diag.title')}</span>
      <span className="diagnostic-score">{checks.filter(c => c.ok).length}/{checks.length}</span>
    </button>
    {!collapsed && <>
      {justSolved && <div className="diagnostic-win"><strong>{t('diag.solved')}</strong><p>{t(solutionShown ? 'diag.solvedNoStar' : 'diag.solvedText')}</p></div>}
      {active && !justSolved && <p className="field-hint">{t('diag.startHint')}</p>}
      {!active && !justSolved && solutionShown && <p className="field-hint diag-solution-note">{t('diag.solutionShown')}</p>}
      <div className="diag-groups">
        {groups.map(({ group, items }) => {
          const failing = items.filter(item => !item.ok)
          return <section key={group} className={`diag-group diag-${group} ${failing.length ? 'has-issues' : 'is-ok'}`}>
            <header>
              <span className="diag-group-icon">{groupIcon[group]}</span>
              <strong>{t(`group.${group}`)}</strong>
              <span className="diag-group-state">{failing.length ? `${items.length - failing.length}/${items.length}` : <IconCheck size={13} />}</span>
            </header>
            {failing.length > 0 && <ul className="checks">
              {items.map(check => <li key={check.id} className={check.ok ? 'ok' : 'ko'}>
                <span className="check-icon">{check.ok ? <IconCheck size={12} /> : <IconCross size={12} />}</span>
                <span>
                  <strong>{t(`check.${check.id}`)}</strong>
                  {!check.ok && check.hint && <em>{t(check.hint.key as TKey, check.hint.vars)}</em>}
                </span>
              </li>)}
            </ul>}
          </section>
        })}
      </div>
      {!active && solved && !justSolved && <p className="field-hint diag-all-good">{t('diag.allGood')}</p>}
      <div className="diagnostic-actions">
        {active && !confirming && <div className={`diag-buttons ${canShowSolution ? '' : 'single'}`}>
          <button type="button" className="ghost-btn" onClick={onRestart}><IconRestart size={14} />{t('diag.restart')}</button>
          {canShowSolution && <button type="button" className="ghost-btn solution-btn" onClick={() => solutionShown ? onShowSolution() : setConfirming(true)}><IconEye size={14} />{t('diag.solution')}</button>}
        </div>}
        {active && !confirming && !canShowSolution && <p className="field-hint diag-locked-note">{t('diag.solutionLocked')}</p>}
        {active && confirming && <div className="diag-confirm" role="alertdialog" aria-label={t('diag.solution')}>
          <p>{t('diag.solutionWarn')}</p>
          <div className="diag-buttons">
            <button type="button" className="ghost-btn" onClick={() => setConfirming(false)}>{t('diag.cancel')}</button>
            <button type="button" className="ghost-btn solution-btn" onClick={() => { setConfirming(false); onShowSolution() }}>{t('diag.solutionConfirm')}</button>
          </div>
        </div>}
        {!active && <button type="button" className="cta cta-small" onClick={onRestart}><IconTarget size={15} />{solutionShown ? t('diag.practice') : t('diag.again')}{done && !solutionShown && <span className="done-star">★</span>}</button>}
      </div>
    </>}
  </div>
}
