import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Studio, type Backdrop, type BackgroundLight, type CaptureFn } from './scene/Studio'
import { challengeStart, setups } from './content/setups'
import { knowledgeBySetup, questionsBySetup, type Question } from './content/questions'
import { evaluate, isSolved, referenceView } from './challenge'
import { DEFAULT_COLOR, clampDistance, placeLights, polarToXZ, wrapDeg, type Light, type LightId, type View } from './model'
import { I18nProvider, detectLang, makeTranslator, type Lang } from './i18n'
import { loadLang, saveLang } from './storage'
import { LightPanel, RatioMeter } from './ui/LightPanel'
import { SubjectPanel, backdropColors } from './ui/SubjectPanel'
import { TopView } from './ui/TopView'
import { Diagnostic } from './ui/Diagnostic'
import { Preview } from './ui/Preview'
import { QuizModal, QuizTimer, StarBadge } from './ui/Quiz'
import { ContactSheet, Credits, EndModal, Intro, Toast, type Shot } from './ui/Overlays'
import { IconFill, IconHelp, IconInfo, IconKey, IconRim, IconSheet, IconSubject } from './ui/icons'

type Tab = 'subject' | 'key' | 'fill'
const QUIZ_STARS = 2
const QUIZ_INTERVAL = 180
const TIP_INTERVAL = 60_000

const emptyCounts = () => Object.fromEntries(setups.map(setup => [setup.id, 0])) as Record<string, number>

export function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang() ?? detectLang())
  const i18n = useMemo(() => makeTranslator(lang, setLang), [lang])
  const { t, l } = i18n

  // Plateau
  const [activeSetup, setActiveSetup] = useState(setups[0].id)
  // au départ, le boîtier est placé comme sur la référence du premier schéma
  const initialView = useMemo(() => referenceView(setups[0].challenge, 0), [])
  const [lights, setLights] = useState<Light[]>(() => placeLights(setups[0].lights, 0, initialView.cameraAngle))
  const [subjectZ, setSubjectZ] = useState(0)
  const [subjectRotY, setSubjectRotY] = useState(0)
  const [cameraAngle, setCameraAngleRaw] = useState(initialView.cameraAngle)
  const setCameraAngle = (angle: number) => setCameraAngleRaw(Math.round(wrapDeg(angle)))
  const [cameraDistance, setCameraDistance] = useState(initialView.cameraDistance)
  const [cameraHeight, setCameraHeight] = useState(initialView.cameraHeight)
  const [focalLength, setFocalLength] = useState(initialView.focal)
  const setCameraView = (view: View) => { setCameraAngle(view.cameraAngle); setCameraDistance(view.cameraDistance); setCameraHeight(view.cameraHeight); setFocalLength(view.focal) }
  const [showSpotPoint, setShowSpotPoint] = useState(true)
  const [backdrop, setBackdrop] = useState<Backdrop>({ visible: true, color: backdropColors[0].value })
  const [background, setBackground] = useState<BackgroundLight>({ enabled: false, power: 45, color: DEFAULT_COLOR, angle: 0, height: .35 })
  const [tab, setTab] = useState<Tab>('subject')
  const [selected, setSelected] = useState<LightId | null>(null)

  // Parcours
  const [introOpen, setIntroOpen] = useState(true)
  const [introSeen, setIntroSeen] = useState(false)
  const [quizStars, setQuizStars] = useState<Record<string, number>>(emptyCounts)
  const [challengeDone, setChallengeDone] = useState<Record<string, boolean>>({})
  const [answered, setAnswered] = useState(0)
  const [quizOpen, setQuizOpen] = useState(false)
  const [question, setQuestion] = useState<Question | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [challengeActive, setChallengeActive] = useState(false)
  const [justSolved, setJustSolved] = useState(false)
  const [tip, setTip] = useState<string | null>(null)
  const [tipIndex, setTipIndex] = useState(0)
  const [endOpen, setEndOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [creditsOpen, setCreditsOpen] = useState(false)
  const [shots, setShots] = useState<Shot[]>([])
  const [flash, setFlash] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const previewRef = useRef<HTMLCanvasElement>(null)
  const captureRef = useRef<CaptureFn | null>(null)
  const shotId = useRef(0)

  const setup = setups.find(s => s.id === activeSetup)!
  const modalOpen = introOpen || quizOpen || endOpen || sheetOpen || creditsOpen
  const starsOf = (id: string) => (challengeDone[id] ? 1 : 0) + Math.min(QUIZ_STARS, quizStars[id] ?? 0)
  const totalStars = setups.reduce((sum, s) => sum + starsOf(s.id), 0)
  const maxStars = setups.length * 3
  const challengesPassed = setups.filter(s => challengeDone[s.id]).length
  const labels = { key: t('name.key'), fill: t('name.fill'), rim: t('name.rim') }

  useEffect(() => { document.documentElement.lang = lang }, [lang])
  useEffect(() => { saveLang(lang) }, [lang])

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(current => current === message ? null : current), 2600)
  }, [])

  // Lampes
  const editLight = (id: LightId, patch: Partial<Light>) => setLights(current => current.map(light => light.id === id ? { ...light, ...patch } : light))
  const editPolar = (id: LightId, angle: number, distance: number) => editLight(id, polarToXZ(angle, clampDistance(distance), subjectZ))
  const select = (id: LightId | null) => {
    setSelected(id)
    if (id) setTab(id === 'key' ? 'key' : 'fill')
  }
  const openTab = (next: Tab) => {
    setTab(next)
    setSelected(next === 'subject' ? null : next)
  }
  const moveSubject = (z: number) => {
    setLights(current => current.map(light => ({ ...light, z: light.z + (z - subjectZ) })))
    setSubjectZ(z)
  }

  // Astuces
  const showTip = (setupId: string, index: number) => {
    const tips = knowledgeBySetup[setupId]
    if (!tips?.length) return
    setTip(l(tips[index % tips.length]))
    setTipIndex(index + 1)
  }
  useEffect(() => {
    if (tip || modalOpen) return
    const id = window.setTimeout(() => showTip(activeSetup, tipIndex), TIP_INTERVAL)
    return () => window.clearTimeout(id)
  }, [tip, modalOpen, activeSetup, tipIndex, lang])

  const apply = (id: string) => {
    const preset = setups.find(s => s.id === id)!
    // le boîtier et les lampes se placent comme sur le rendu recherché
    const view = referenceView(preset.challenge, subjectRotY)
    setCameraView(view)
    setLights(placeLights(preset.lights, subjectZ, view.cameraAngle))
    setActiveSetup(id)
    setChallengeActive(false)
    setJustSolved(false)
    setQuestionIndex(0)
    showTip(id, 0)
  }

  // Défi
  const view: View = { cameraAngle, cameraDistance, cameraHeight, focal: focalLength, subjectRotY }
  const checks = useMemo(() => evaluate(setup.challenge, lights, subjectZ, view), [setup, lights, subjectZ, cameraAngle, cameraDistance, cameraHeight, focalLength, subjectRotY])
  const solved = isSolved(checks)
  const startChallenge = () => {
    // tout est déréglé : boîtier dans l'axe et trop bas, lampes déplacées
    setCameraView({ ...view, cameraAngle: 0, cameraDistance: 2, cameraHeight: 1.45, focal: 85 })
    setLights(placeLights(challengeStart(), subjectZ, 0))
    setChallengeActive(true)
    setJustSolved(false)
    setTip(null)
    openTab('key')
  }

  const takeShot = (challenge: boolean) => {
    const src = captureRef.current?.()
    if (!src) return
    shotId.current += 1
    setShots(current => [...current, { id: shotId.current, setupId: setup.id, label: l(setup.label), src, challenge }].slice(-24))
    setFlash(true)
    window.setTimeout(() => setFlash(false), 450)
  }

  useEffect(() => {
    if (!challengeActive || !solved) return
    // on attend que l'élève relâche la lampe avant de valider
    const id = window.setTimeout(() => {
      setChallengeActive(false)
      setJustSolved(true)
      setChallengeDone(current => ({ ...current, [activeSetup]: true }))
      takeShot(true)
      window.setTimeout(() => setJustSolved(false), 6000)
    }, 900)
    return () => window.clearTimeout(id)
  }, [challengeActive, solved, activeSetup])

  // Questions
  const fireQuestion = () => {
    const list = questionsBySetup[activeSetup]
    if (!list?.length || (quizStars[activeSetup] ?? 0) >= QUIZ_STARS || modalOpen) return
    setQuestion(list[questionIndex % list.length])
    setQuestionIndex(i => i + 1)
    setQuizOpen(true)
  }
  const handleQuizResult = (ok: boolean) => {
    if (ok) setQuizStars(current => ({ ...current, [activeSetup]: Math.min(QUIZ_STARS, (current[activeSetup] ?? 0) + 1) }))
    setAnswered(n => n + 1)
  }

  // Fin de parcours : une seule ouverture automatique, au moment où tout est complet
  const complete = totalStars === maxStars
  const wasComplete = useRef(complete)
  useEffect(() => {
    if (complete && !wasComplete.current) setEndOpen(true)
    wasComplete.current = complete
  }, [complete])

  const resetAll = () => {
    setQuizStars(emptyCounts())
    setChallengeDone({})
    setAnswered(0)
    setEndOpen(false)
    apply(setups[0].id)
  }

  const takePhoto = () => {
    takeShot(false)
    showToast(t('sheet.added'))
  }

  const key = lights.find(light => light.id === 'key')!
  const fill = lights.find(light => light.id === 'fill')!
  const rim = lights.find(light => light.id === 'rim')!
  const tabs: { id: Tab; icon: JSX.Element; on?: boolean }[] = [
    { id: 'subject', icon: <IconSubject /> },
    { id: 'key', icon: <IconKey />, on: key.enabled },
    { id: 'fill', icon: <IconFill />, on: fill.enabled || rim.enabled },
  ]
  const panelProps = (light: Light) => ({ light, subjectZ, onEdit: (patch: Partial<Light>) => editLight(light.id, patch), onPolar: (angle: number, distance: number) => editPolar(light.id, angle + cameraAngle, distance), cameraAngle, showSpotPoint, setShowSpotPoint })

  return <I18nProvider value={i18n}>
    <main className="app">
      <aside className="library">
        <div className="brand-row">
          <div><span className="eyebrow">{t('intro.eyebrow')}</span><h1 className="brand">Studio Light Lab</h1></div>
        </div>
        <h2>{t('lib.patterns')}</h2>
        <p className="lib-hint">{t('lib.patternsHint')}</p>
        <div className="preset-list">
          {setups.map(s => <button type="button" className={s.id === activeSetup ? 'preset-active' : ''} key={s.id} onClick={() => apply(s.id)} aria-pressed={s.id === activeSetup}>
            <strong>{l(s.label)}</strong>
            <span>{l(s.description)}</span>
            <span className="preset-badge"><StarBadge filled={starsOf(s.id)} /></span>
          </button>)}
        </div>
        {(answered > 0 || challengesPassed > 0) && <div className="results-block">
          <span className="eyebrow">{t('lib.results')} · {totalStars}/{maxStars} ★</span>
          <button type="button" className="cta cta-small" onClick={() => setEndOpen(true)}>{t('lib.seeResults')}</button>
        </div>}
        <div className="lib-tools">
          <button type="button" onClick={() => setSheetOpen(true)}><IconSheet size={16} />{t('lib.sheet')}{shots.length > 0 && <span className="count">{shots.length}</span>}</button>
          <button type="button" onClick={() => setIntroOpen(true)}><IconHelp size={16} />{t('lib.help')}</button>
          <button type="button" onClick={() => setCreditsOpen(true)}><IconInfo size={16} />{t('lib.credits')}</button>
        </div>
        <footer className="library-foot">© 2026 Studio Light Lab · CC BY-NC-SA 4.0</footer>
      </aside>

      <section className="scene">
        <div className="scene-header">
          <div><span className="eyebrow">{t('scene.active')} • {l(setup.label).toUpperCase()}</span><h2>{t('scene.title')}</h2></div>
          <div className="scene-header-side">
            <span className="tip">{t('scene.grid')}</span>
            <div className="lang-toggle" role="group" aria-label={t('lib.lang')}>
              {(['fr', 'en'] as Lang[]).map(code => <button key={code} type="button" className={lang === code ? 'active' : ''} aria-pressed={lang === code} onClick={() => setLang(code)}>{code.toUpperCase()}</button>)}
            </div>
          </div>
        </div>
        <div className="stage">
          <Studio lights={lights} labels={labels} formatDistance={value => i18n.num(value)} subjectZ={subjectZ} subjectRotY={subjectRotY} cameraAngle={cameraAngle} cameraDistance={cameraDistance} cameraHeight={cameraHeight} focalLength={focalLength} selected={selected} onSelect={select} showSpotPoint={showSpotPoint} backdrop={backdrop} background={background} previewRef={previewRef} captureRef={captureRef} />
          {tip && <div className="info-pop" role="note">
            <div className="info-pop-head"><span className="eyebrow">{t('tip.eyebrow')} • {l(setup.label).toUpperCase()}</span><button type="button" className="info-close" onClick={() => setTip(null)} aria-label={t('common.close')}>×</button></div>
            {setup.reference && <figure className="lighting-reference"><img src={setup.reference} alt={t('tip.alt', { label: l(setup.label) })} /><figcaption>{t('tip.reference')}</figcaption></figure>}
            <p>{tip}</p>
          </div>}
          {!introOpen && <QuizTimer seconds={QUIZ_INTERVAL} paused={modalOpen} stars={starsOf(activeSetup)} finished={(quizStars[activeSetup] ?? 0) >= QUIZ_STARS} onFire={fireQuestion} />}
          <TopView lights={lights} subjectZ={subjectZ} subjectRotY={subjectRotY} cameraAngle={cameraAngle} onCameraMove={setCameraAngle} cameraDistance={cameraDistance} focalLength={focalLength} backdropVisible={backdrop.visible} selected={selected} onSelect={select} onMove={editPolar} />
          <Diagnostic checks={checks} active={challengeActive} done={!!challengeDone[activeSetup]} justSolved={justSolved} onStart={startChallenge} onAbandon={() => apply(activeSetup)} />
        </div>
      </section>

      <aside className="controls">
        <Preview canvasRef={previewRef} reference={setup.reference} label={l(setup.label)} flash={flash} onPhoto={takePhoto} />
        <div className="tabs" role="tablist">
          {tabs.map(item => <button key={item.id} type="button" role="tab" id={`tab-${item.id}`} aria-selected={tab === item.id} aria-controls={`panel-${item.id}`} className={`tab tab-${item.id} ${tab === item.id ? 'active' : ''}`} onClick={() => openTab(item.id)}>
            <span className="tab-icon">{item.icon}{item.on !== undefined && <i className={item.on ? 'dot on' : 'dot'} />}</span>
            <span className="tab-label">{t(`tab.${item.id}`)}</span>
          </button>)}
        </div>
        <div key={tab} className="tab-panel" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'subject' && <SubjectPanel cameraAngle={cameraAngle} setCameraAngle={setCameraAngle} cameraDistance={cameraDistance} setCameraDistance={setCameraDistance} cameraHeight={cameraHeight} setCameraHeight={setCameraHeight} focalLength={focalLength} setFocalLength={setFocalLength} subjectZ={subjectZ} setSubjectZ={moveSubject} subjectRotY={subjectRotY} setSubjectRotY={setSubjectRotY} backdrop={backdrop} setBackdrop={setBackdrop} background={background} setBackground={setBackground} />}
          {tab === 'key' && <>
            <LightPanel {...panelProps(key)} />
            <p className="field-hint panel-foot">{t('light.hint')}</p>
          </>}
          {tab === 'fill' && <>
            <LightPanel {...panelProps(fill)} />
            <RatioMeter lights={lights} subjectZ={subjectZ} />
            <section className={`rim-section ${selected === 'rim' ? 'is-selected' : ''}`} onFocus={() => setSelected('rim')} onMouseDown={() => setSelected('rim')}>
              <h3><IconRim size={17} />{t('rim.title')}</h3>
              <p className="field-hint">{t('rim.text')}</p>
              <LightPanel {...panelProps(rim)} compact />
            </section>
          </>}
        </div>
      </aside>

      {introOpen && <Intro resume={introSeen} onStart={() => { setIntroOpen(false); if (!introSeen) { setIntroSeen(true); showTip(activeSetup, 0) } }} />}
      {quizOpen && question && <QuizModal key={question.id} question={question} schemeLabel={l(setup.label)} stars={starsOf(activeSetup)} onResult={handleQuizResult} onClose={() => setQuizOpen(false)} />}
      {endOpen && <EndModal setups={setups} starsOf={starsOf} totalStars={totalStars} challenges={challengesPassed} answered={answered} onClose={() => setEndOpen(false)} onRestart={resetAll} />}
      {sheetOpen && <ContactSheet shots={shots} onRemove={id => setShots(current => current.filter(shot => shot.id !== id))} onClose={() => setSheetOpen(false)} />}
      {creditsOpen && <Credits onClose={() => setCreditsOpen(false)} />}
      <Toast message={toast} />
    </main>
  </I18nProvider>
}
