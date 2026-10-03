import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Line, useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useState, useRef, type RefObject } from 'react'
import { Box3, Mesh, Object3D, Vector3, SpotLight, Quaternion, DoubleSide, WebGLRenderer, PerspectiveCamera, PCFSoftShadowMap } from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { Light, Modifier, setups } from './presets'
import { questionsBySetup, knowledgeBySetup, type Question } from './questions'
import venusModel from '../assets/53082b5d6cef4c34a9701a2a24f58075.glb'
import rembrandtReference from '../assets/lighting-references/rembrandt.png'
import butterflyReference from '../assets/lighting-references/butterfly.png'
import loopReference from '../assets/lighting-references/loop.png'
import splitReference from '../assets/lighting-references/split.png'
import broadReference from '../assets/lighting-references/broad.png'
import shortReference from '../assets/lighting-references/short.png'
import clamshellReference from '../assets/lighting-references/clamshell.png'

const modifiers: Modifier[] = ['Softbox', 'Parapluie', 'Stripbox', 'Reflecteur', 'Snoot']
const modifierBeamAngle = (modifier: Modifier) => modifier === 'Stripbox' ? Math.PI / 6 : modifier === 'Parapluie' ? Math.PI / 2.5 : modifier === 'Reflecteur' ? Math.PI / 3.2 : modifier === 'Snoot' ? Math.PI / 12 : Math.PI / 3.5
const subjectHeight = 1.9
const venusNativeHeight = 2.120558
const subjectLightHeight = 1.15
const sourceHeight = 2.7
const defaultLightHeight = sourceHeight - 0.3
const lightTargetHeight = (light: Light) => light.targetY ?? subjectLightHeight
const referenceDistance = 2
const defaultCameraDistance = 2
const cameraShift = -0.1
const defaultCameraHeight = 1.7
const defaultFocalLength = 85
const framingOffset = .35
const assets = {
  camera: 'models/canon_eos_60d__ef_85mm_f1.4l_is_usm_lens/scene.gltf',
}

const lightingReferences: Record<string, string> = {
  rembrandt: rembrandtReference,
  butterfly: butterflyReference,
  loop: loopReference,
  split: splitReference,
  broad: broadReference,
  short: shortReference,
  clamshell: clamshellReference,
}

function LightingReference({ setupId, label }: { setupId: string; label: string }) {
  return <figure className="lighting-reference">
    <img src={lightingReferences[setupId]} alt={`Exemple réaliste d’un éclairage ${label}`} />
    <figcaption>Rendu recherché</figcaption>
  </figure>
}

function StudioAsset({ url, height, stretch = [1, 1, 1], onlyMesh }: { url: string; height: number; stretch?: [number, number, number]; onlyMesh?: string }) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const copy = cloneSkeleton(scene)
    copy.traverse((child: Object3D) => {
      if ((child as { isLight?: boolean }).isLight) child.visible = false
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh
        if (onlyMesh && !mesh.name.includes(onlyMesh)) mesh.visible = false
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    const bounds = new Box3().setFromObject(copy)
    const size = bounds.getSize(new Vector3())
    const center = bounds.getCenter(new Vector3())
    const scale = height / Math.max(size.y, .01)
    copy.scale.set(scale * stretch[0], scale * stretch[1], scale * stretch[2])
    copy.position.set(-center.x * scale * stretch[0], -bounds.min.y * scale * stretch[1], -center.z * scale * stretch[2])
    return copy
  }, [scene, height, stretch, onlyMesh])
  return <primitive object={model} />
}

function Venus({ rotationY = 0 }: { rotationY?: number }) {
  const { scene } = useGLTF(venusModel)
  const model = useMemo(() => {
    const copy = scene.clone(true)
    copy.traverse((child: Object3D) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    copy.scale.setScalar(subjectHeight / venusNativeHeight)
    copy.updateMatrixWorld(true)
    const center = new Box3().setFromObject(copy).getCenter(new Vector3())
    copy.position.x -= center.x
    copy.position.z -= center.z
    return copy
  }, [scene])
  return <primitive object={model} rotation={[0, rotationY * Math.PI / 180, 0]} />
}

function BeamVisual({ height, targetHeight, planarDistance, angle, color }: { height: number; targetHeight: number; planarDistance: number; angle: number; color: string }) {
  const source = useMemo(() => new Vector3(0, height, -1.2), [height])
  const target = useMemo(() => new Vector3(0, targetHeight, -planarDistance), [targetHeight, planarDistance])
  const direction = target.clone().sub(source)
  const length = direction.length()
  if (length < .01) return null
  direction.divideScalar(length)
  const radius = Math.tan(angle) * length
  const center = source.clone().addScaledVector(direction, length / 2)
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().negate())
  return <group name="beam-helper">
    <mesh position={center} quaternion={quaternion}>
      <coneGeometry args={[radius, length, 48, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={.12} depthWrite={false} side={DoubleSide} />
    </mesh>
    <Line points={[source.toArray(), target.toArray()]} color={color} transparent opacity={.85} />
  </group>
}

let previewCapture: (() => string) | null = null

function PreviewRenderer({ canvasRef, subjectZ, cameraDistance, cameraHeight, focalLength }: { canvasRef: RefObject<HTMLCanvasElement | null>; subjectZ: number; cameraDistance: number; cameraHeight: number; focalLength: number }) {
  const scene = useThree(state => state.scene)
  const camera = useMemo(() => new PerspectiveCamera(16, 3 / 2, .5, 40), [])
  const rendererRef = useRef<WebGLRenderer | null>(null)

  useEffect(() => {
    return () => {
      rendererRef.current?.dispose()
      rendererRef.current = null
    }
  }, [])

  const renderPreview = (capture: boolean) => {
    camera.fov = 2 * Math.atan(0.024 / (2 * (focalLength / 1000))) * 180 / Math.PI
    const hideGuides = () => {
      const rig = scene.getObjectByName('camera-rig')
      const beams: Object3D[] = []
      scene.traverse(child => { if (child.name === 'beam-helper') beams.push(child) })
      const points: Object3D[] = []
      scene.traverse(child => { if (child.name === 'spot-point') points.push(child) })
      const hadBeamVisible = new Map<Object3D, boolean>()
      const hadPointVisible = new Map<Object3D, boolean>()
      let rigVisible = rig?.visible
      if (rig) rig.visible = false
      beams.forEach(beam => { hadBeamVisible.set(beam, beam.visible); beam.visible = false })
      points.forEach(point => { hadPointVisible.set(point, point.visible); point.visible = false })
      return () => {
        if (rig) rig.visible = rigVisible ?? true
        beams.forEach(beam => { beam.visible = hadBeamVisible.get(beam) ?? true })
        points.forEach(point => { point.visible = hadPointVisible.get(point) ?? true })
      }
    }
    if (capture) {
      const restore = hideGuides()
      const out = document.createElement('canvas')
      out.width = 1920
      out.height = 1280
      const capRenderer = new WebGLRenderer({ canvas: out, preserveDrawingBuffer: true })
      capRenderer.shadowMap.enabled = true
      capRenderer.shadowMap.type = PCFSoftShadowMap
      camera.aspect = 3 / 2
      camera.updateProjectionMatrix()
      camera.position.set(cameraShift, cameraHeight, cameraDistance)
      camera.lookAt(cameraShift, cameraHeight, subjectZ + framingOffset)
      capRenderer.render(scene, camera)
      restore()
      const data = out.toDataURL('image/png')
      capRenderer.dispose()
      return data
    }
    const canvas = canvasRef.current
    if (!canvas) return
    let renderer = rendererRef.current
    if (!renderer || renderer.domElement !== canvas) {
      if (renderer) renderer.dispose()
      renderer = new WebGLRenderer({ canvas, antialias: true })
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = PCFSoftShadowMap
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      rendererRef.current = renderer
    }
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width < 2 || height < 2) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    camera.position.set(cameraShift, cameraHeight, cameraDistance)
    camera.lookAt(cameraShift, cameraHeight, subjectZ + framingOffset)
    const restore = hideGuides()
    renderer.render(scene, camera)
    restore()
  }

  useEffect(() => {
    previewCapture = () => renderPreview(true) ?? ''
    return () => { previewCapture = null }
  }, [subjectZ, cameraDistance, cameraHeight, focalLength])

  useFrame(() => { renderPreview(false) })

  return null
}

function PreviewWindow({ canvasRef }: { canvasRef: { current: HTMLCanvasElement | null } }) {
  return <div className="preview">
    <canvas ref={node => { canvasRef.current = node }} />
    <div className="preview-head">APERÇU · CADRAGE</div>
  </div>
}

function lightDistance(light: Light, subjectZ: number) {
  return Math.hypot(light.x, light.z - subjectZ, (light.height ?? defaultLightHeight) - lightTargetHeight(light))
}

function subjectIllumination(light: Light, subjectZ: number) {
  const distance = lightDistance(light, subjectZ)
  return light.power * (referenceDistance / distance) ** 2
}

function StudioLight({ light, subjectZ, isSelected, onSelect, showSpotPoint }: { light: Light; subjectZ: number; isSelected: boolean; onSelect: () => void; showSpotPoint: boolean }) {
  const aimYaw = Math.atan2(light.x, light.z - subjectZ)
  const illumination = subjectIllumination(light, subjectZ)
  const beamColor = isSelected ? '#ffd47a' : (light.color ?? '#e7f4ff')
  const beamAngle = light.angle ?? modifierBeamAngle(light.modifier)
  const lightRef = useRef<SpotLight>(null!)
  const targetRef = useRef<Object3D>(null!)
  const planarDistance = Math.hypot(light.x, light.z - subjectZ)
  const lightHeight = light.height ?? defaultLightHeight
  const lightDistance = Math.hypot(planarDistance - 1.2, lightHeight - lightTargetHeight(light))

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current
    }
  }, [])

  return <group position={[light.x, 0, light.z]} rotation={[0, aimYaw, 0]} onClick={onSelect}>
    <spotLight 
      ref={lightRef}
      castShadow 
      shadow-mapSize={[1024, 1024]} 
      shadow-focus={light.focus ?? 1}
      shadow-intensity={light.shadowIntensity ?? 1}
      position={[0, lightHeight, -1.2]} 
      intensity={(illumination / 10) * (light.intensity ?? 1)} 
      decay={light.decay ?? 2} 
      distance={light.distance ?? 0} 
      color={beamColor} 
      angle={beamAngle} 
      penumbra={light.penumbra ?? 0.3} 
    />
    <object3D ref={targetRef} position={[0, lightTargetHeight(light), -planarDistance]} />
    {light.showHelper !== false && <BeamVisual height={lightHeight} targetHeight={lightTargetHeight(light)} planarDistance={planarDistance} angle={beamAngle} color={beamColor} />}
    <group position={[0, lightHeight, -1.2]}>
      {showSpotPoint && <mesh name="spot-point"><sphereGeometry args={[.07, 16, 16]} /><meshBasicMaterial color={beamColor} /></mesh>}
      <mesh><sphereGeometry args={[.15, 12, 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
    </group>
    <Html position={[0, lightHeight + 0.18, -1.2]} center><button className={`light-tag ${isSelected ? 'tag-selected' : ''}`}>{light.name} · {light.modifier} · {lightDistance.toFixed(1)} m</button></Html>
  </group>
}

function Camera({ subjectZ, distance, height, focal }: { subjectZ: number; distance: number; height: number; focal: number }) {
  const frameDepth = distance - (subjectZ + framingOffset)
  const frameHalfWidth = frameDepth * .036 / (2 * (focal / 1000))
  const frameHalfHeight = frameDepth * .024 / (2 * (focal / 1000))
  const frameTop = .55 + frameHalfHeight
  const frameBottom = .55 - frameHalfHeight
  return <group name="camera-rig" position={[cameraShift, height - .55, distance]}>
    <group position={[0, .45, 0]} rotation={[0, Math.PI, 0]}><StudioAsset url={assets.camera} height={.2} /></group>
    <Line points={[[0, .55, -.25], [0, .55, -frameDepth]]} color="#7fc9f3" transparent opacity={.62} />
    <Line points={[[-frameHalfWidth, frameTop, -frameDepth], [frameHalfWidth, frameTop, -frameDepth], [frameHalfWidth, frameBottom, -frameDepth], [-frameHalfWidth, frameBottom, -frameDepth], [-frameHalfWidth, frameTop, -frameDepth]]} color="#7fc9f3" transparent opacity={.55} />
    <Line points={[[0, .55, -.25], [-frameHalfWidth, frameTop, -frameDepth]]} color="#7fc9f3" transparent opacity={.3} />
    <Line points={[[0, .55, -.25], [frameHalfWidth, frameTop, -frameDepth]]} color="#7fc9f3" transparent opacity={.3} />
    <Line points={[[0, .55, -.25], [frameHalfWidth, frameBottom, -frameDepth]]} color="#7fc9f3" transparent opacity={.3} />
    <Line points={[[0, .55, -.25], [-frameHalfWidth, frameBottom, -frameDepth]]} color="#7fc9f3" transparent opacity={.3} />
  </group>
}

function Studio({ lights, subjectZ, cameraDistance, subjectRotY, selected, onSelect, showSpotPoint, setShowSpotPoint, canvasRef, cameraHeight, focalLength }: { lights: Light[]; subjectZ: number; cameraDistance: number; subjectRotY: number; selected: string | null; onSelect: (id: string | null) => void; showSpotPoint: boolean; setShowSpotPoint: (val: boolean) => void; canvasRef: RefObject<HTMLCanvasElement | null>; cameraHeight: number; focalLength: number }) {
  return <Canvas shadows camera={{ position: [4.5, 4.2, 4.5], fov: 34 }}>
    <color attach="background" args={['#050608']} /><ambientLight intensity={0.07} />
    <gridHelper args={[10, 20, '#28313c', '#151b22']} position={[0, .01, 0]} />
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -.02, 0]}><planeGeometry args={[10, 10]} /><meshStandardMaterial color="#090c10" roughness={.94} /></mesh>
    <group position={[0, 0, subjectZ]}><Venus rotationY={subjectRotY} /></group>
    {lights.filter(l => l.enabled).map(light => <StudioLight key={light.id} light={light} subjectZ={subjectZ} isSelected={selected === light.id} onSelect={() => onSelect(light.id)} showSpotPoint={showSpotPoint} />)}
    <Camera subjectZ={subjectZ} distance={cameraDistance} height={cameraHeight} focal={focalLength} />
    <PreviewRenderer canvasRef={canvasRef} subjectZ={subjectZ} cameraDistance={cameraDistance} cameraHeight={cameraHeight} focalLength={focalLength} />
    <OrbitControls makeDefault target={[0, 1.65, 0]} minDistance={3} maxDistance={18} maxPolarAngle={Math.PI / 2.05} />
  </Canvas>
}

function LightPanel({ light, subjectZ, onEdit, onPolar, onClose, showSpotPoint, setShowSpotPoint }: { light: Light; subjectZ: number; onEdit: (patch: Partial<Light>) => void; onPolar: (angle: number, distance: number) => void; onClose: () => void; showSpotPoint: boolean; setShowSpotPoint: (val: boolean) => void }) {
  const planarDistance = Math.hypot(light.x, light.z - subjectZ)
  const angle = Math.round(Math.atan2(light.x, light.z - subjectZ) * 180 / Math.PI)
  const beamAngle = light.angle ?? modifierBeamAngle(light.modifier)
  const beamLength = Math.hypot(planarDistance - 1.2, (light.height ?? defaultLightHeight) - lightTargetHeight(light))
  return <div className="panel-editor">
    <div className="panel-editor-head">
      <button type="button" className="panel-back" onClick={onClose} title="Retour à la sidebar">←</button>
      <div className="panel-editor-title">
        <strong>{light.id === 'key' ? 'Principale' : light.name}</strong>
        <span>{light.modifier} · {light.power}%</span>
      </div>
    </div>
    <div className="panel-group">Position</div>
    <label>Modeleur<select value={light.modifier} onChange={event => onEdit({ modifier: event.target.value as Modifier })}>{modifiers.map(modifier => <option key={modifier}>{modifier}</option>)}</select></label>
    <label>Angle <output>{angle}°</output><input type="range" min={-180} max={180} step={1} value={angle} onChange={event => onPolar(+event.target.value, planarDistance)} /></label>
    <label>Distance <output>{beamLength.toFixed(1)} m</output><input type="range" min={.5} max={3} step={.1} value={planarDistance.toFixed(1)} onChange={event => onPolar(angle, +event.target.value)} /></label>
    <label>Hauteur <output>{(light.height ?? defaultLightHeight).toFixed(2)} m</output><input type="range" min={.5} max={3.5} step={.1} value={light.height ?? defaultLightHeight} onChange={event => onEdit({ height: +event.target.value })} /></label>
    <div className="panel-group">Lampe</div>
    <label>Puissance <output>{light.power}%</output><input type="range" min={0} max={100} value={light.power} onChange={event => onEdit({ power: +event.target.value })} /></label>
    <label>Intensité <output>× {(light.intensity ?? 1).toFixed(1)}</output><input type="range" min={0} max={3} step={.1} value={light.intensity ?? 1} onChange={event => onEdit({ intensity: +event.target.value })} /></label>
    <label>Couleur <output>{light.color ?? '#e7f4ff'}</output><input type="color" value={light.color ?? '#e7f4ff'} onChange={event => onEdit({ color: event.target.value })} /></label>
    <label>Coupure <output>{light.distance ?? 0} m</output><input type="range" min={0} max={20} step={.5} value={light.distance ?? 0} onChange={event => onEdit({ distance: +event.target.value })} /></label>
    <label>Angle du faisceau <output>{Math.round(beamAngle * 180 / Math.PI)}°</output><input type="range" min={5} max={70} step={1} value={Math.round(beamAngle * 180 / Math.PI)} onChange={event => onEdit({ angle: +event.target.value * Math.PI / 180 })} /></label>
    <label>Pénombre <output>{(light.penumbra ?? .3).toFixed(2)}</output><input type="range" min={0} max={1} step={.05} value={light.penumbra ?? .3} onChange={event => onEdit({ penumbra: +event.target.value })} /></label>
    <label>Déclin <output>{(light.decay ?? 2).toFixed(1)}</output><input type="range" min={1} max={2} step={.1} value={light.decay ?? 2} onChange={event => onEdit({ decay: +event.target.value })} /></label>
    <div className="panel-group">Ombre</div>
    <label>Focus <output>{(light.focus ?? 1).toFixed(2)}</output><input type="range" min={0} max={1} step={.05} value={light.focus ?? 1} onChange={event => onEdit({ focus: +event.target.value })} /></label>
    <label>Intensité d’ombre <output>{(light.shadowIntensity ?? 1).toFixed(2)}</output><input type="range" min={0} max={1} step={.05} value={light.shadowIntensity ?? 1} onChange={event => onEdit({ shadowIntensity: +event.target.value })} /></label>
    <label className="checkbox-label"><input type="checkbox" checked={light.showHelper !== false} onChange={event => onEdit({ showHelper: event.target.checked })} /><span>Helper faisceau</span></label>
    <label className="checkbox-label"><input type="checkbox" checked={showSpotPoint} onChange={e => setShowSpotPoint(e.target.checked)} /><span>Point source</span></label>
    <p className="panel-hint">Dans un vrai studio, l’angle, la distance et le modeleur de chaque source déterminent le schéma d’éclairage.</p>
  </div>
}

function StarBadge({ correct, total = 3 }: { correct: number; total?: number }) {
  return <span className="star-badge">{Array.from({ length: total }, (_, i) => <span key={i} className={i < correct ? 'star on' : 'star'}>{i < correct ? '★' : '☆'}</span>)}</span>
}

function QuizTimer({ seconds = 180, paused, correct, onFire }: { seconds?: number; paused: boolean; correct: number; onFire: () => void }) {
  const [left, setLeft] = useState(seconds)
  const fireRef = useRef(onFire)
  fireRef.current = onFire

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setLeft(v => Math.max(0, v - 1)), 1000)
    return () => clearInterval(id)
  }, [paused])

  useEffect(() => {
    if (left > 0) return
    fireRef.current()
    setLeft(seconds)
  }, [left, seconds])

  const announce = left > 0 && left <= 15
  const mm = Math.floor(left / 60).toString().padStart(2, '0')
  const ss = (left % 60).toString().padStart(2, '0')
  const radius = 26
  const circ = 2 * Math.PI * radius

  return <div className={`quiz-timer ${announce ? 'quiz-announce' : ''}`}>
    <svg width="76" height="76" viewBox="0 0 76 76">
      <circle cx="38" cy="38" r={radius} fill="rgba(16,21,30,.85)" stroke="#26384a" strokeWidth="5" />
      <circle cx="38" cy="38" r={radius} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" transform="rotate(-90 38 38)" strokeDasharray={circ} strokeDashoffset={circ * (1 - left / seconds)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
      <text x="38" y="43" textAnchor="middle" fill="#dce6f3" style={{ font: '700 13px Inter, system-ui, sans-serif' }}>{mm}:{ss}</text>
    </svg>
    <span className="quiz-timer-label">{announce ? 'Question à venir…' : <StarBadge correct={correct} />}</span>
  </div>
}

function QuizModal({ question, schemeLabel, correct, onResult, onClose }: { question: Question; schemeLabel: string; correct: number; onResult: (ok: boolean) => void; onClose: () => void }) {
  const [pick, setPick] = useState<boolean | number | null>(null)
  const [picks, setPicks] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const ok = useMemo(() => {
    if (question.type === 'multiple') {
      const expected = question.answer as number[]
      return picks.length === expected.length && expected.every(i => picks.includes(i))
    }
    return pick === question.answer
  }, [question, pick, picks])
  const submit = () => { setDone(true); onResult(ok) }
  const rightAnswer = question.type === 'bool' ? ((question.answer as boolean) ? 'Oui' : 'Non') : question.type === 'single' ? question.options![question.answer as number] : (question.answer as number[]).map(i => question.options![i]).join(', ')
  return <div className="quiz-overlay">
    <div className="quiz-card">
      <div className="quiz-head">
        <span className="eyebrow">QUESTION · {schemeLabel.toUpperCase()}</span>
        <span className="quiz-score"><StarBadge correct={correct} /></span>
      </div>
      <p className="quiz-text">{question.question}</p>
      {question.type === 'bool' && <div className="quiz-options">{[true, false].map(v => <button key={String(v)} type="button" className={pick === v ? 'quiz-choice chosen' : 'quiz-choice'} onClick={() => setPick(v)} disabled={done}>{v ? 'Oui' : 'Non'}</button>)}</div>}
      {question.type === 'single' && <div className="quiz-options">{question.options!.map((o, i) => <button key={o} type="button" className={pick === i ? 'quiz-choice chosen' : 'quiz-choice'} onClick={() => setPick(i)} disabled={done}>{o}</button>)}</div>}
      {question.type === 'multiple' && <div className="quiz-options">{question.options!.map((o, i) => <label key={o} className="quiz-check"><input type="checkbox" checked={picks.includes(i)} disabled={done} onChange={event => setPicks(cur => event.target.checked ? [...cur, i] : cur.filter(x => x !== i))} /><span>{o}</span></label>)}</div>}
      {!done && <button type="button" className="quiz-cta" disabled={question.type === 'multiple' ? picks.length === 0 : pick === null} onClick={submit}>Valider</button>}
      {done && <div className={`quiz-feedback ${ok ? 'quiz-ok' : 'quiz-ko'}`}>
        <strong>{ok ? 'Bonne réponse' : 'Mauvaise réponse'}</strong>
        <p>{ok ? question.correctFeedback : question.wrongFeedback}</p>
        <p className="quiz-right">Bonne réponse : <b>{rightAnswer}</b></p>
        <button type="button" className="quiz-cta" onClick={onClose}>Continuer</button>
      </div>}
    </div>
  </div>
}

function InfoTimer({ seconds = 60, paused, onFire }: { seconds?: number; paused: boolean; onFire: () => void }) {
  const [left, setLeft] = useState(seconds)
  const fireRef = useRef(onFire)
  fireRef.current = onFire

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setLeft(v => Math.max(0, v - 1)), 1000)
    return () => clearInterval(id)
  }, [paused])

  useEffect(() => {
    if (left > 0) return
    fireRef.current()
    setLeft(seconds)
  }, [left, seconds])

  return null
}

useGLTF.preload(venusModel)
Object.values(assets).forEach(asset => useGLTF.preload(asset))

export function App() {
  const [lights, setLights] = useState<Light[]>(setups[0].lights)
  const [activeSetup, setActiveSetup] = useState(setups[0].id)
  const [selected, setSelected] = useState<string | null>(null)
  const [subjectZ, setSubjectZ] = useState(0)
  const [subjectRotY, setSubjectRotY] = useState(0)
  const [cameraDistance, setCameraDistance] = useState(defaultCameraDistance)
  const [cameraHeight, setCameraHeight] = useState(defaultCameraHeight)
  const [focalLength, setFocalLength] = useState(defaultFocalLength)
  const [showSpotPoint, setShowSpotPoint] = useState(true)
  const [openTab, setOpenTab] = useState<string | null>(null)
  const [introOpen, setIntroOpen] = useState(true)
  const [quizOpen, setQuizOpen] = useState(false)
  const [question, setQuestion] = useState<Question | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [correctBySetup, setCorrectBySetup] = useState<Record<string, number>>(() => Object.fromEntries(setups.map(setup => [setup.id, 0])))
  const [tipVisible, setTipVisible] = useState(false)
  const [tip, setTip] = useState('')
  const [tipIndex, setTipIndex] = useState(0)
  const [answeredTotal, setAnsweredTotal] = useState(0)
  const [endOpen, setEndOpen] = useState(false)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const editLight = (id: string, patch: Partial<Light>) => setLights(current => current.map(light => light.id === id ? { ...light, ...patch } : light))
  const editPolar = (id: string, angle: number, distance: number) => {
    const radians = angle * Math.PI / 180
    editLight(id, { x: Math.sin(radians) * distance, z: subjectZ + Math.cos(radians) * distance })
  }
  const showFirstTip = (setupId: string) => {
    const tips = knowledgeBySetup[setupId]
    if (!tips || tips.length === 0) return
    setTip(tips[0])
    setTipIndex(1)
    setTipVisible(true)
  }
  const apply = (id: string) => { const preset = setups.find(x => x.id === id)!; setLights(preset.lights); setActiveSetup(id); setSelected(null); setQuestionIndex(0); showFirstTip(id) }
  const showNextTip = () => {
    if (tipVisible) return
    const tips = knowledgeBySetup[activeSetup]
    if (!tips || tips.length === 0) return
    setTip(tips[tipIndex % tips.length])
    setTipIndex(i => i + 1)
    setTipVisible(true)
  }
  const fireQuestion = () => {
    const list = questionsBySetup[activeSetup]
    if (!list || list.length === 0 || correctBySetup[activeSetup] >= 3) return
    setQuestion(list[questionIndex % list.length])
    setQuestionIndex(i => i + 1)
    setQuizOpen(true)
  }
  const handleQuizResult = (ok: boolean) => { if (ok) setCorrectBySetup(current => ({ ...current, [activeSetup]: current[activeSetup] + 1 })); setAnsweredTotal(t => t + 1) }
  const totalCorrect = Object.values(correctBySetup).reduce((sum, n) => sum + n, 0)
  const endPct = Math.round((totalCorrect / 21) * 100)
  const level = endPct < 60 ? 'Débutant' : endPct < 85 ? 'Intermédiaire' : 'Avancé'
  useEffect(() => {
    if (setups.every(setup => correctBySetup[setup.id] >= 3)) setEndOpen(true)
  }, [correctBySetup])
  const resetAll = () => {
    setCorrectBySetup(Object.fromEntries(setups.map(setup => [setup.id, 0])))
    setAnsweredTotal(0)
    setEndOpen(false)
    apply(setups[0].id)
  }
  const takePhoto = () => {
    const src = previewCapture ? previewCapture() : ''
    if (!src) return
    const link = document.createElement('a')
    link.download = `studio-light-${activeSetup}.png`
    link.href = src
    link.click()
  }
  const selectedSetup = setups.find(setup => setup.id === activeSetup)!
  return <main>
    {introOpen && <div className="intro-overlay"><div className="intro-card"><span className="eyebrow">SIMULATEUR E-LEARNING</span><h1>Studio Light Lab</h1><p>Apprenez les principaux schémas d’éclairage photographique en explorant un plateau virtuel en 3D : placez votre caméra, positionnez votre sujet et composez la lumière, puis observez le résultat dans l’aperçu comme si vous étiez derrière l’appareil. Vous pouvez même prendre une photo de rendu.</p><ul className="intro-steps"><li><strong>1</strong><span>Choisissez un schéma de lumière (Rembrandt, Butterfly, Loop, Split…).</span></li><li><strong>2</strong><span>Étape 1 — Paramétrez votre cadrage et le positionnement de Vénus.</span></li><li><strong>3</strong><span>Étape 2 — Paramétrez vos lumières principale et de remplissage.</span></li><li><strong>4</strong><span>Gardez un œil en direct dans l’aperçu et cliquez sur « Prendre une photo ».</span></li><li><strong>5</strong><span>Tout au long de votre parcours, des questions vous seront posées : une bonne réponse vous apporte un point + un feedback, une mauvaise réponse un feedback.</span></li></ul><button type="button" className="intro-cta" onClick={() => { setIntroOpen(false); showFirstTip(activeSetup) }}>Commencer votre simulation</button></div></div>}
    {quizOpen && question && <QuizModal key={question.id} question={question} schemeLabel={selectedSetup.label} correct={correctBySetup[activeSetup]} onResult={handleQuizResult} onClose={() => setQuizOpen(false)} />}
    {endOpen && <div className="end-overlay"><div className="end-card"><span className="eyebrow">FIN DU PARCOURS</span><h1>Résultats<span className="title-dot">.</span> Niveau <span className="end-level">{level}</span></h1><p className="end-summary">{totalCorrect}/21 bonnes réponses sur {answeredTotal} question{answeredTotal > 1 ? 's' : ''} posée{answeredTotal > 1 ? 's' : ''}.</p><div className="end-grid">{setups.map(s => <div key={s.id} className="end-row"><strong>{s.label}</strong><StarBadge correct={correctBySetup[s.id]} /></div>)}</div><div className="end-actions"><button type="button" className="intro-cta" onClick={() => setEndOpen(false)}>Poursuivre</button><button type="button" className="intro-ghost" onClick={resetAll}>Recommencer</button></div></div></div>}
    <section className="workspace">
      <aside className="library"><span className="eyebrow">SIMULATEUR E-LEARNING</span><h1 className="brand">Studio Light Lab</h1><h2>Schémas de lumière</h2><p>Point de départ, modifiable ensuite.</p><div className="preset-list">{setups.map(s => <button className={s.id === activeSetup ? 'preset-active' : ''} key={s.id} onClick={() => apply(s.id)}><strong>{s.label}</strong><span>{s.description}</span><span className="preset-badge">{correctBySetup[s.id]}/3</span></button>)}</div>{answeredTotal > 0 && <div className="results-block"><span className="eyebrow">RÉSULTATS</span><button type="button" className="results-cta" onClick={() => setEndOpen(true)}>Voir mes résultats</button></div>}<footer className="library-foot">© 2026 Studio Light Lab · CC BY-NC-SA 4.0</footer></aside>
      <section className="scene"><div className="scene-header"><div><span className="eyebrow">SCHÉMA ACTIF • {selectedSetup.label.toUpperCase()}</span><h2>Placez vos sources autour du sujet</h2></div><span className="tip">Plateau 10 × 10 m • 1 case = 0,5 m</span></div><div className="quiz-anchor">{!introOpen && <QuizTimer seconds={180} paused={quizOpen} correct={correctBySetup[activeSetup]} onFire={fireQuestion} />}{tipVisible && <div className="info-pop"><div className="info-pop-head"><span className="eyebrow">LE SAVIEZ-VOUS ? • {selectedSetup.label.toUpperCase()}</span><button type="button" className="info-close" onClick={() => setTipVisible(false)}>×</button></div><LightingReference setupId={selectedSetup.id} label={selectedSetup.label} /><p>{tip}</p></div>}</div><Studio lights={lights} subjectZ={subjectZ} cameraDistance={cameraDistance} subjectRotY={subjectRotY} selected={selected} onSelect={setSelected} showSpotPoint={showSpotPoint} setShowSpotPoint={setShowSpotPoint} canvasRef={previewRef} cameraHeight={cameraHeight} focalLength={focalLength} />{!introOpen && !quizOpen && !tipVisible && <InfoTimer seconds={5} paused={false} onFire={showNextTip} />}</section>
      <aside className="controls">{(() => { const selectedLight = lights.find(light => light.id === selected); if (selectedLight) return <LightPanel light={selectedLight} subjectZ={subjectZ} onEdit={patch => editLight(selectedLight.id, patch)} onPolar={(angle, distance) => editPolar(selectedLight.id, angle, distance)} onClose={() => setSelected(null)} showSpotPoint={showSpotPoint} setShowSpotPoint={setShowSpotPoint} />; return <><div className="panel-section">Cadrage</div><PreviewWindow canvasRef={previewRef} /><button type="button" className="photo-btn" onClick={takePhoto}>Prendre une photo</button><div className="panel-section">Étape 1 : Plateau</div><p className="control-intro">Régler votre cadrage et le positionnement de Vénus.</p><details className="light-editor" open={openTab === 'boitier'} onToggle={event => { if (event.currentTarget.open) setOpenTab('boitier'); else setOpenTab(tab => tab === 'boitier' ? null : tab) }}><summary><span>Boîtier</span></summary><div className="light-editor-content"><label>Distance <output>{cameraDistance.toFixed(1)} m</output><input type="range" min="1.5" max="4" step=".1" value={cameraDistance} onChange={e => setCameraDistance(+e.target.value)} /></label><label>Hauteur <output>{cameraHeight.toFixed(1)} m</output><input type="range" min="0.6" max="2.2" step=".1" value={cameraHeight} onChange={e => setCameraHeight(+e.target.value)} /></label><label>Focale <output>{focalLength} mm</output><input type="range" min="24" max="200" step="1" value={focalLength} onChange={e => setFocalLength(+e.target.value)} /></label><div className="lesson"><span>À observer</span><p>La distance et le modeleur déterminent ici la contribution de chaque source.</p></div></div></details><details className="light-editor" open={openTab === 'sujet'} onToggle={event => { if (event.currentTarget.open) setOpenTab('sujet'); else setOpenTab(tab => tab === 'sujet' ? null : tab) }}><summary><span>Sujet</span></summary><div className="light-editor-content"><label>Avancer / reculer <output>{subjectZ.toFixed(1)} m</output><input type="range" min="-2" max=".5" step=".25" value={subjectZ} onChange={e => setSubjectZ(+e.target.value)} /></label><label>Orientation (face) <output>{subjectRotY}°</output><input type="range" min="-180" max="180" step="1" value={subjectRotY} onChange={e => setSubjectRotY(+e.target.value)} /></label><p className="inverse-helper">Les axes des lumières et le cadrage suivent automatiquement le sujet.</p></div></details><div className="panel-section">Étape 2 : Sources lumineuses</div><p className="control-intro">Régler les lumières principale et de remplissage pour correspondre aux schémas de lumière.</p><div className="source-list">{lights.map(light => { const title = light.id === 'key' ? 'Principale' : light.name; const beamAngleLabel = modifierBeamAngle(light.modifier); return <div className="source-row" key={light.id}><button type="button" className={`source-button ${selected === light.id ? 'active' : ''}`} onClick={() => setSelected(light.id)}><strong>{title}</strong><span>{light.enabled ? `${Math.round(beamAngleLabel * 180 / Math.PI)}° · ${light.modifier} · ${light.power}%` : 'Source masquée'}</span></button><label className="source-mask" title="Masquer la source"><input type="checkbox" checked={!light.enabled} onChange={event => editLight(light.id, { enabled: !event.target.checked })} /><span>Masquer</span></label></div> })}</div></>})()}</aside>
    </section>
  </main>
}
