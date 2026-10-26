import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import type { Question } from '../content/questions'
import { IconQuestion } from './icons'

export function StarBadge({ filled, total = 3 }: { filled: number; total?: number }) {
  return <span className="star-badge" aria-label={`${filled}/${total}`}>
    {Array.from({ length: total }, (_, i) => <span key={i} className={i < filled ? 'star on' : 'star'}>{i < filled ? '★' : '☆'}</span>)}
  </span>
}

/** Minuteur avant la prochaine question, avec possibilité de répondre tout de suite. */
export function QuizTimer({ seconds = 180, paused, stars, finished: done, locked, onFire }: { seconds?: number; paused: boolean; stars: number; finished: boolean; locked?: boolean; onFire: () => void }) {
  const finished = done || !!locked
  const { t } = useI18n()
  const [left, setLeft] = useState(seconds)
  const fireRef = useRef(onFire)
  fireRef.current = onFire

  useEffect(() => {
    if (paused || finished) return
    const id = setInterval(() => setLeft(v => Math.max(0, v - 1)), 1000)
    return () => clearInterval(id)
  }, [paused, finished])

  useEffect(() => {
    if (left > 0) return
    fireRef.current()
    setLeft(seconds)
  }, [left, seconds])

  const announce = !finished && left > 0 && left <= 15
  const mm = Math.floor(left / 60).toString().padStart(2, '0')
  const ss = (left % 60).toString().padStart(2, '0')
  const radius = 26
  const circ = 2 * Math.PI * radius
  const progress = finished ? 1 : 1 - left / seconds

  return <div className={`quiz-timer ${announce ? 'quiz-announce' : ''} ${finished ? 'quiz-finished' : ''} ${locked ? 'quiz-locked' : ''}`}>
    <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
      <circle cx="38" cy="38" r={radius} fill="rgba(16,21,30,.85)" stroke="#26384a" strokeWidth="5" />
      <circle cx="38" cy="38" r={radius} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" transform="rotate(-90 38 38)" strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
      <text x="38" y="43" textAnchor="middle" fill="#dce6f3" style={{ font: '700 13px Manrope, system-ui, sans-serif' }}>{locked ? '—' : finished ? '✓' : `${mm}:${ss}`}</text>
    </svg>
    <span className="quiz-timer-label">{locked ? t('quiz.locked') : finished ? t('quiz.over') : announce ? t('quiz.soon') : <StarBadge filled={stars} />}</span>
    {!finished && <button type="button" className="quiz-now" onClick={() => { setLeft(seconds); fireRef.current() }} disabled={paused}><IconQuestion size={14} /><span className="quiz-now-label">{t('quiz.now')}</span></button>}
  </div>
}

export function QuizModal({ question, schemeLabel, stars, onResult, onClose }: { question: Question; schemeLabel: string; stars: number; onResult: (ok: boolean) => void; onClose: () => void }) {
  const { t, l } = useI18n()
  const [pick, setPick] = useState<boolean | number | null>(null)
  const [picks, setPicks] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const continueRef = useRef<HTMLButtonElement>(null)
  const ok = useMemo(() => {
    if (question.type === 'multiple') {
      const expected = question.answer as number[]
      return picks.length === expected.length && expected.every(i => picks.includes(i))
    }
    return pick === question.answer
  }, [question, pick, picks])
  const submit = () => { setDone(true); onResult(ok) }
  useEffect(() => { if (done) continueRef.current?.focus() }, [done])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && done) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, onClose])

  const rightAnswer = question.type === 'bool'
    ? t((question.answer as boolean) ? 'quiz.yes' : 'quiz.no')
    : question.type === 'single'
      ? l(question.options![question.answer as number])
      : (question.answer as number[]).map(i => l(question.options![i])).join(', ')

  return <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="quiz-text">
    <div className="modal-card quiz-card">
      <div className="quiz-head">
        <span className="eyebrow">{t('quiz.eyebrow')} · {schemeLabel.toUpperCase()}</span>
        <span className="quiz-score"><StarBadge filled={stars} /></span>
      </div>
      <p className="quiz-text" id="quiz-text">{l(question.question)}</p>
      {question.type === 'bool' && <div className="quiz-options">{[true, false].map(v => <button key={String(v)} type="button" className={pick === v ? 'quiz-choice chosen' : 'quiz-choice'} onClick={() => setPick(v)} disabled={done}>{t(v ? 'quiz.yes' : 'quiz.no')}</button>)}</div>}
      {question.type === 'single' && <div className="quiz-options">{question.options!.map((o, i) => <button key={i} type="button" className={pick === i ? 'quiz-choice chosen' : 'quiz-choice'} onClick={() => setPick(i)} disabled={done}>{l(o)}</button>)}</div>}
      {question.type === 'multiple' && <div className="quiz-options">{question.options!.map((o, i) => <label key={i} className="quiz-check"><input type="checkbox" checked={picks.includes(i)} disabled={done} onChange={event => setPicks(cur => event.target.checked ? [...cur, i] : cur.filter(x => x !== i))} /><span>{l(o)}</span></label>)}</div>}
      {!done && <button type="button" className="cta" disabled={question.type === 'multiple' ? picks.length === 0 : pick === null} onClick={submit}>{t('quiz.submit')}</button>}
      {done && <div className={`quiz-feedback ${ok ? 'quiz-ok' : 'quiz-ko'}`}>
        <strong>{t(ok ? 'quiz.good' : 'quiz.bad')}</strong>
        <p>{l(ok ? question.correctFeedback : question.wrongFeedback)}</p>
        <p className="quiz-right">{t('quiz.answer')} <b>{rightAnswer}</b></p>
        <button ref={continueRef} type="button" className="cta" onClick={onClose}>{t('quiz.continue')}</button>
      </div>}
    </div>
  </div>
}
