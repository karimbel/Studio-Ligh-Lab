import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Line, useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useRef, type MutableRefObject, type RefObject } from 'react'
import { Box3, Mesh, MeshStandardMaterial, Object3D, Vector3, SpotLight, Quaternion, DoubleSide, WebGLRenderer, PerspectiveCamera, PCFShadowMap } from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import venusModel from '../../assets/53082b5d6cef4c34a9701a2a24f58075.glb'
import {
  BACKDROP_Z, CAMERA_SHIFT, DEFAULT_COLOR, EMITTER_OFFSET, FRAMING_OFFSET, SUBJECT_HEIGHT, VENUS_NATIVE_HEIGHT,
  beamAngleOf, cameraPose, emitterDistance, lightHeight, lightTargetHeight, penumbraOf, planarDistance, shadowDensityOf, shadowRadiusOf, subjectIllumination,
  type Light, type LightId,
} from '../model'

const CAMERA_MODEL = 'models/canon_eos_60d__ef_85mm_f1.4l_is_usm_lens/scene.gltf'
const GUIDE_LAYER = 1 // repères (faisceaux, points, boîtier) : visibles dans la vue studio, jamais dans l'aperçu ni la photo

export type Backdrop = { visible: boolean; color: string }
export type BackgroundLight = { enabled: boolean; power: number; color: string }
export type CaptureFn = () => string

const onGuideLayer = (object: Object3D | null) => { object?.traverse(child => child.layers.set(GUIDE_LAYER)) }

function CameraProp() {
  const { scene } = useGLTF(CAMERA_MODEL)
  const model = useMemo(() => {
    const copy = cloneSkeleton(scene)
    copy.traverse((child: Object3D) => {
      if ((child as { isLight?: boolean }).isLight) child.visible = false
      child.layers.set(GUIDE_LAYER)
      // repère hors des faisceaux : on l'éclaire « de l'intérieur » pour qu'il reste lisible dans la vue studio
      const mesh = child as Mesh
      if (mesh.isMesh) {
        const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(material => {
          const copy = material.clone() as MeshStandardMaterial
          if (copy.emissive) { copy.emissive.set('#8a96a6'); copy.emissiveMap = copy.map ?? null; copy.emissiveIntensity = 1.2 }
          return copy
        })
        mesh.material = Array.isArray(mesh.material) ? materials : materials[0]
      }
    })
    const bounds = new Box3().setFromObject(copy)
    const size = bounds.getSize(new Vector3())
    const center = bounds.getCenter(new Vector3())
    const scale = .2 / Math.max(size.y, .01)
    copy.scale.setScalar(scale)
    copy.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)
    return copy
  }, [scene])
  return <primitive object={model} />
}

function Venus({ rotationY }: { rotationY: number }) {
  const { scene } = useGLTF(venusModel)
  const model = useMemo(() => {
    const copy = scene.clone(true)
    copy.traverse((child: Object3D) => {
      if ((child as Mesh).isMesh) { (child as Mesh).castShadow = true; (child as Mesh).receiveShadow = true }
    })
    copy.scale.setScalar(SUBJECT_HEIGHT / VENUS_NATIVE_HEIGHT)
    copy.updateMatrixWorld(true)
    const center = new Box3().setFromObject(copy).getCenter(new Vector3())
    copy.position.x -= center.x
    copy.position.z -= center.z
    return copy
  }, [scene])
  return <primitive object={model} rotation={[0, rotationY * Math.PI / 180, 0]} />
}

function BeamVisual({ height, targetHeight, planar, angle, color }: { height: number; targetHeight: number; planar: number; angle: number; color: string }) {
  const source = useMemo(() => new Vector3(0, height, -EMITTER_OFFSET), [height])
  const target = useMemo(() => new Vector3(0, targetHeight, -planar), [targetHeight, planar])
  const direction = target.clone().sub(source)
  const length = direction.length()
  if (length < .01) return null
  direction.divideScalar(length)
  const radius = Math.tan(angle) * length
  const center = source.clone().addScaledVector(direction, length / 2)
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().negate())
  return <group ref={onGuideLayer}>
    <mesh position={center} quaternion={quaternion}>
      <coneGeometry args={[radius, length, 48, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={.12} depthWrite={false} side={DoubleSide} />
    </mesh>
    <Line points={[source.toArray(), target.toArray()]} color={color} transparent opacity={.85} />
  </group>
}

const guideColor: Record<LightId, string> = { key: '#ffd47a', fill: '#9ed4ff', rim: '#d6a8ff' }

function StudioLight({ light, subjectZ, label, distanceLabel, isSelected, onSelect, showSpotPoint }: { light: Light; subjectZ: number; label: string; distanceLabel: (value: number) => string; isSelected: boolean; onSelect: () => void; showSpotPoint: boolean }) {
  const aimYaw = Math.atan2(light.x, light.z - subjectZ)
  const lightColor = light.color ?? DEFAULT_COLOR
  const beamColor = isSelected ? guideColor[light.id] : lightColor
  const beamAngle = beamAngleOf(light, subjectZ)
  const lightRef = useRef<SpotLight>(null!)
  const targetRef = useRef<Object3D>(null!)
  const planar = planarDistance(light, subjectZ)
  const height = lightHeight(light)
  const target = lightTargetHeight(light)

  useEffect(() => { if (lightRef.current && targetRef.current) lightRef.current.target = targetRef.current }, [])

  return <group position={[light.x, 0, light.z]} rotation={[0, aimYaw, 0]} onClick={event => { event.stopPropagation(); onSelect() }}>
    <spotLight
      ref={lightRef}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-radius={shadowRadiusOf(light)}
      shadow-bias={-.0004}
      shadow-normalBias={.025}
      shadow-focus={light.focus ?? 1}
      shadow-intensity={shadowDensityOf(light)}
      position={[0, height, -EMITTER_OFFSET]}
      intensity={(subjectIllumination(light, subjectZ) / 10)}
      decay={light.decay ?? 2}
      distance={light.distance ?? 0}
      color={lightColor}
      angle={beamAngle}
      penumbra={penumbraOf(light)}
    />
    <object3D ref={targetRef} position={[0, target, -planar]} />
    {light.showHelper !== false && <BeamVisual height={height} targetHeight={target} planar={planar} angle={beamAngle} color={beamColor} />}
    <group position={[0, height, -EMITTER_OFFSET]} ref={onGuideLayer}>
      {showSpotPoint && <mesh><sphereGeometry args={[.07, 16, 16]} /><meshBasicMaterial color={beamColor} /></mesh>}
      <mesh><sphereGeometry args={[.15, 12, 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
    </group>
    <Html position={[0, height + .18, -EMITTER_OFFSET]} center zIndexRange={[20, 0]}>
      <button type="button" className={`light-tag tag-${light.id} ${isSelected ? 'tag-selected' : ''}`} onClick={onSelect}>{label} · {distanceLabel(emitterDistance(light, subjectZ))} m</button>
    </Html>
  </group>
}

function CameraRig({ subjectZ, angle, distance, height, focal }: { subjectZ: number; angle: number; distance: number; height: number; focal: number }) {
  const frameDepth = distance - FRAMING_OFFSET
  const halfWidth = frameDepth * .036 / (2 * (focal / 1000))
  const halfHeight = frameDepth * .024 / (2 * (focal / 1000))
  const top = .55 + halfHeight
  const bottom = .55 - halfHeight
  return <group position={[0, 0, subjectZ]} rotation={[0, angle * Math.PI / 180, 0]}><group position={[CAMERA_SHIFT, height - .55, distance]} ref={onGuideLayer}>
    <group position={[0, .45, 0]} rotation={[0, Math.PI, 0]}><CameraProp /></group>
    <Line points={[[0, .55, -.25], [0, .55, -frameDepth]]} color="#7fc9f3" transparent opacity={.62} />
    <Line points={[[-halfWidth, top, -frameDepth], [halfWidth, top, -frameDepth], [halfWidth, bottom, -frameDepth], [-halfWidth, bottom, -frameDepth], [-halfWidth, top, -frameDepth]]} color="#7fc9f3" transparent opacity={.55} />
    {[[-halfWidth, top], [halfWidth, top], [halfWidth, bottom], [-halfWidth, bottom]].map(([x, y], i) => <Line key={i} points={[[0, .55, -.25], [x, y, -frameDepth]]} color="#7fc9f3" transparent opacity={.3} />)}
  </group></group>
}

function BackdropPaper({ backdrop }: { backdrop: Backdrop }) {
  if (!backdrop.visible) return null
  return <mesh receiveShadow position={[0, 2.5, BACKDROP_Z]}>
    <planeGeometry args={[10, 5]} />
    <meshStandardMaterial color={backdrop.color} roughness={1} />
  </mesh>
}

function BackgroundSpot({ light }: { light: BackgroundLight }) {
  const spot = useRef<SpotLight>(null!)
  const target = useRef<Object3D>(null!)
  useEffect(() => { if (spot.current && target.current) spot.current.target = target.current }, [light.enabled])
  if (!light.enabled) return null
  return <group>
    <spotLight ref={spot} position={[0, .35, BACKDROP_Z + 1.1]} intensity={light.power * .12} angle={Math.PI / 4.2} penumbra={.85} decay={2} color={light.color} />
    <object3D ref={target} position={[0, 1.6, BACKDROP_Z]} />
    <mesh position={[0, .35, BACKDROP_Z + 1.1]} ref={onGuideLayer}><sphereGeometry args={[.06, 12, 12]} /><meshBasicMaterial color={light.color} /></mesh>
  </group>
}

function PreviewRenderer({ canvasRef, captureRef, subjectZ, cameraAngle, cameraDistance, cameraHeight, focalLength }: { canvasRef: RefObject<HTMLCanvasElement | null>; captureRef: MutableRefObject<CaptureFn | null>; subjectZ: number; cameraAngle: number; cameraDistance: number; cameraHeight: number; focalLength: number }) {
  const scene = useThree(state => state.scene)
  const camera = useMemo(() => new PerspectiveCamera(16, 3 / 2, .5, 40), [])
  const invalidate = useThree(state => state.invalidate)
  const rendererRef = useRef<WebGLRenderer | null>(null)

  useEffect(() => () => { rendererRef.current?.dispose(); rendererRef.current = null }, [])

  // L'aperçu vit hors du canvas principal : on redemande une image quand sa taille change.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => invalidate())
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [canvasRef, invalidate])

  const aim = (aspect: number) => {
    camera.fov = 2 * Math.atan(0.024 / (2 * (focalLength / 1000))) * 180 / Math.PI
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    const pose = cameraPose(cameraAngle, cameraDistance, cameraHeight, subjectZ)
    camera.position.set(...pose.eye)
    camera.lookAt(...pose.target)
  }

  useEffect(() => {
    captureRef.current = () => {
      const out = document.createElement('canvas')
      out.width = 1920
      out.height = 1280
      const renderer = new WebGLRenderer({ canvas: out, antialias: true, preserveDrawingBuffer: true })
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = PCFShadowMap
      aim(3 / 2)
      renderer.render(scene, camera)
      const data = out.toDataURL('image/png')
      renderer.dispose()
      renderer.forceContextLoss()
      return data
    }
    return () => { captureRef.current = null }
  })

  useFrame(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let renderer = rendererRef.current
    if (!renderer || renderer.domElement !== canvas) {
      renderer?.dispose()
      renderer = new WebGLRenderer({ canvas, antialias: true })
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = PCFShadowMap
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      rendererRef.current = renderer
    }
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width < 2 || height < 2) return
    renderer.setSize(width, height, false)
    aim(width / height)
    renderer.render(scene, camera)
  })

  return null
}

/** Vue d'ensemble : la caméra « régie » voit aussi les repères, l'aperçu non. */
function GuideAwareControls() {
  const camera = useThree(state => state.camera)
  const raycaster = useThree(state => state.raycaster)
  useEffect(() => { camera.layers.enable(GUIDE_LAYER); raycaster.layers.enableAll() }, [camera, raycaster])
  return <OrbitControls makeDefault target={[0, 1.65, 0]} minDistance={3} maxDistance={18} maxPolarAngle={Math.PI / 2.05} />
}

export type StudioProps = {
  lights: Light[]
  labels: Record<LightId, string>
  formatDistance: (value: number) => string
  subjectZ: number
  subjectRotY: number
  cameraAngle: number
  cameraDistance: number
  cameraHeight: number
  focalLength: number
  selected: LightId | null
  onSelect: (id: LightId) => void
  showSpotPoint: boolean
  backdrop: Backdrop
  background: BackgroundLight
  previewRef: RefObject<HTMLCanvasElement | null>
  captureRef: MutableRefObject<CaptureFn | null>
}

export function Studio(props: StudioProps) {
  const { lights, labels, formatDistance, subjectZ, subjectRotY, cameraAngle, cameraDistance, cameraHeight, focalLength, selected, onSelect, showSpotPoint, backdrop, background, previewRef, captureRef } = props
  return <Canvas shadows="percentage" frameloop="demand" camera={{ position: [4.5, 4.2, 4.5], fov: 34 }} dpr={[1, 2]}>
    <color attach="background" args={['#020304']} />
    <ambientLight intensity={0.07} />
    <gridHelper args={[10, 20, '#28313c', '#151b22']} position={[0, .01, 0]} ref={onGuideLayer} />
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -.02, 0]}><planeGeometry args={[10, 10]} /><meshStandardMaterial color="#090c10" roughness={.94} /></mesh>
    <BackdropPaper backdrop={backdrop} />
    <BackgroundSpot light={background} />
    <group position={[0, 0, subjectZ]}><Venus rotationY={subjectRotY} /></group>
    {lights.filter(light => light.enabled).map(light => <StudioLight key={light.id} light={light} label={labels[light.id]} distanceLabel={formatDistance} subjectZ={subjectZ} isSelected={selected === light.id} onSelect={() => onSelect(light.id)} showSpotPoint={showSpotPoint} />)}
    <CameraRig subjectZ={subjectZ} angle={cameraAngle} distance={cameraDistance} height={cameraHeight} focal={focalLength} />
    <PreviewRenderer canvasRef={previewRef} captureRef={captureRef} subjectZ={subjectZ} cameraAngle={cameraAngle} cameraDistance={cameraDistance} cameraHeight={cameraHeight} focalLength={focalLength} />
    <GuideAwareControls />
  </Canvas>
}

useGLTF.preload(venusModel)
useGLTF.preload(CAMERA_MODEL)
