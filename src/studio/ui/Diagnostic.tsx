import { useEffect, useState } from 'react'
import { hasKey, useI18n, type TKey, type Translator } from '../i18n'
import { groupOrder, type Check, type CheckGroup, type Hint, type SolutionFacts } from '../challenge'
import type { HelpLevel } from '../storage'
import { IconCamera, IconCheck, IconChevron, IconCross, IconEye, IconFill, IconHelp, IconKey, IconRestart, IconRim, IconTarget } from './icons'

type Props = {
  checks: Check[]
  active: boolean // exercice en cours
  done: boolean // étoile du défi déjà gagnée
  justSolved: boolean
  solutionShown: boolean
  canShowSolution: boolean // débloquée après de vrais essais
  canHint: boolean // l'indice se débloque plus tôt que la solution
  hintActive: boolean // indice affiché en ce moment
  hintUsed: boolean // l'étoile du défi est perdue pour ce schéma
  hintGroup?: CheckGroup // groupe que l'indice éclaire (le premier à corriger)
  facts: SolutionFacts
  why: string
  level: HelpLevel
  onLevel: (level: HelpLevel) => void
  onRestart: () => void
  onShowHint: () => void
  onShowSolution: () => void
}

const groupIcon: Record<CheckGroup, JSX.Element> = {
  framing: <IconCamera size={14} />,
  key: <IconKey size={14} />,
  fill: <IconFill size={14} />,
  rim: <IconRim size={14} />,
}
const levels: HelpLevel[] = ['guided', 'independent', 'expert']

/** Position d'une lampe vue du boîtier, en mots : « à 50° à gauche », « dans l'axe… ». */
const where = ({ t }: Translator, azimuth: number) =>
  Math.abs(azimuth) < 3 ? t('where.axis') : t(azimuth < 0 ? 'where.left' : 'where.right', { az: Math.abs(azimuth) })

/** Les réglages de la solution pour un groupe, en une phrase. */
export function factText(i18n: Translator, group: CheckGroup, facts: SolutionFacts): string | null {
  const { t, num } = i18n
  if (group === 'framing') {
    const f = facts.framing
    return t('fact.framing', { angle: f.angle, distance: num(f.distance), height: num(f.height), focal: f.focal })
  }
  if (group === 'key' && facts.key) return t('fact.key', { where: where(i18n, facts.key.azimuth), height: num(facts.key.height, 2), elev: facts.key.elevation })
  if (group === 'fill' && facts.fill) {
    const f = facts.fill
    return t(f.below ? 'fact.fillBelow' : 'fact.fill', { where: where(i18n, f.azimuth), height: num(f.height, 2), pct: f.percent, ratio: num(f.ratio) })
  }
  if (group === 'rim' && facts.rim) return t('fact.rim', { where: where(i18n, facts.rim.azimuth) })
  return null
}

/** Le conseil selon le niveau d'aide : chiffré, direction seule, ou rien. */
function hintText({ t }: Translator, hint: Hint | undefined, level: HelpLevel) {
  if (!hint || level === 'expert') return null
  if (level === 'independent' && hasKey(`${hint.key}Dir`)) return t(`${hint.key}Dir` as TKey)
  return t(hint.key as TKey, hint.vars)
}

/** Consignes : compare la scène au rendu recherché, groupe par groupe ; seuls les points à corriger restent dépliés. */
export function Diagnostic(p: Props) {
  const i18n = useI18n()
  const { t } = i18n
  const { checks, active, justSolved, solutionShown, level } = p
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 720px)').matches)
  const [confirming, setConfirming] = useState<'hint' | 'solution' | null>(null)
  useEffect(() => { if (justSolved) setCollapsed(false) }, [justSolved])
  useEffect(() => { if (!active) setConfirming(null) }, [active])
  const solved = checks.every(check => check.ok)
  const groups = groupOrder.map(group => ({ group, items: checks.filter(check => check.group === group) })).filter(g => g.items.length > 0)
  const explaining = solutionShown && !active && !justSolved
  const okCount = checks.filter(c => c.ok).length
  const solvedText = solutionShown ? t('diag.solvedNoStar') : p.hintUsed ? t('diag.solvedHint') : t('diag.solvedText')

  return <div className={`diagnostic ${active ? 'is-active' : ''} ${justSolved ? 'is-solved' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
    <button type="button" className="diagnostic-head" onClick={() => setCollapsed(c => !c)} aria-expanded={!collapsed} title={t(collapsed ? 'common.expand' : 'common.collapse')}>
      <span className="eyebrow">{explaining ? t('diag.titleSolution') : active ? t('diag.challenge') : t('diag.title')}</span>
      <span className="diagnostic-score">{okCount}/{checks.length}</span>
      <span className="card-chevron"><IconChevron size={16} /></span>
    </button>
    {collapsed && <div className="diag-meter" aria-hidden="true"><span style={{ width: `${(okCount / Math.max(1, checks.length)) * 100}%` }} /></div>}
    {!collapsed && <>
      {justSolved && <div className="diagnostic-win"><strong>{t('diag.solved')}</strong><p>{solvedText}</p></div>}
      {active && !justSolved && <div className="diag-intro">
        <p className="field-hint">{t('diag.startHint')}</p>
        <div className="level-toggle" role="radiogroup" aria-label={t('level.label')}>
          {levels.map(item => <button key={item} type="button" role="radio" aria-checked={level === item} className={level === item ? 'active' : ''} title={t(`level.${item}Help`)} onClick={() => p.onLevel(item)}>{t(`level.${item}`)}</button>)}
        </div>
      </div>}

      {explaining ? <>
        {/* solution commentée : les réglages et ce qu'ils produisent */}
        <p className="field-hint diag-solution-note">{t('diag.solutionShown')}</p>
        <div className="diag-groups">
          {groups.map(({ group }) => {
            const fact = factText(i18n, group, p.facts)
            if (!fact) return null
            const reason = group === 'framing' ? t('why.framing') : group === 'key' ? p.why : group === 'fill' ? t(p.facts.fill?.below ? 'why.fillBelow' : 'why.fill') : t('why.rim')
            return <section key={group} className={`diag-group diag-${group} is-explain`}>
              <header><span className="diag-group-icon">{groupIcon[group]}</span><strong>{t(`group.${group}`)}</strong></header>
              <p className="diag-fact">{fact}</p>
              <p className="diag-why"><b>{t('diag.why')} :</b> {reason}</p>
            </section>
          })}
        </div>
      </> : <div className="diag-groups">
        {groups.map(({ group, items }) => {
          const failing = items.filter(item => !item.ok)
          const hinted = p.hintActive && active && p.hintGroup === group
          return <section key={group} className={`diag-group diag-${group} ${failing.length ? 'has-issues' : 'is-ok'} ${hinted ? 'is-hinted' : ''}`}>
            <header>
              <span className="diag-group-icon">{groupIcon[group]}</span>
              <strong>{t(`group.${group}`)}</strong>
              <span className="diag-group-state">{failing.length ? `${items.length - failing.length}/${items.length}` : <IconCheck size={13} />}</span>
            </header>
            {hinted && <div className="diag-hint"><span className="eyebrow">{t('diag.hintLabel')}</span><p>{factText(i18n, group, p.facts)}</p><small>{t('diag.hintOnPlan')}</small></div>}
            {failing.length > 0 && <ul className="checks">
              {items.map(check => {
                const text = check.ok ? null : hintText(i18n, check.hint, level)
                return <li key={check.id} className={check.ok ? 'ok' : 'ko'}>
                  <span className="check-icon">{check.ok ? <IconCheck size={12} /> : <IconCross size={12} />}</span>
                  <span><strong>{t(`check.${check.id}`)}</strong>{text && <em>{text}</em>}</span>
                </li>
              })}
            </ul>}
          </section>
        })}
      </div>}

      {!active && solved && !justSolved && !explaining && <p className="field-hint diag-all-good">{t('diag.allGood')}</p>}
      <div className="diagnostic-actions">
        {active && !confirming && <div className="diag-buttons">
          <button type="button" className="ghost-btn" onClick={p.onRestart}><IconRestart size={14} />{t('diag.restart')}</button>
          {p.canHint && !p.hintActive && <button type="button" className="ghost-btn hint-btn" onClick={() => p.hintUsed || solutionShown ? p.onShowHint() : setConfirming('hint')}><IconHelp size={14} />{t('diag.hint')}</button>}
          {p.canShowSolution && <button type="button" className="ghost-btn solution-btn" onClick={() => solutionShown ? p.onShowSolution() : setConfirming('solution')}><IconEye size={14} />{t('diag.solution')}</button>}
        </div>}
        {active && !confirming && !p.canShowSolution && <p className="field-hint diag-locked-note">{t('diag.solutionLocked')}</p>}
        {active && confirming && <div className={`diag-confirm confirm-${confirming}`} role="alertdialog" aria-label={t(confirming === 'hint' ? 'diag.hint' : 'diag.solution')}>
          <p>{t(confirming === 'hint' ? 'diag.hintWarn' : 'diag.solutionWarn')}</p>
          <div className="diag-buttons">
            <button type="button" className="ghost-btn" onClick={() => setConfirming(null)}>{t('diag.cancel')}</button>
            <button type="button" className={`ghost-btn ${confirming === 'hint' ? 'hint-btn' : 'solution-btn'}`} onClick={() => { const what = confirming; setConfirming(null); if (what === 'hint') p.onShowHint(); else p.onShowSolution() }}>{t(confirming === 'hint' ? 'diag.hintConfirm' : 'diag.solutionConfirm')}</button>
          </div>
        </div>}
        {!active && <button type="button" className="cta cta-small" onClick={p.onRestart}><IconTarget size={15} />{solutionShown ? t('diag.practice') : t('diag.again')}{p.done && !solutionShown && <span className="done-star">★</span>}</button>}
      </div>
    </>}
  </div>
}
