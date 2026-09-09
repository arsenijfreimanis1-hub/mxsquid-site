import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useScrollState } from '../hooks/useScrollContext'
import { easeInOutCubic, lerp, mapRange } from '../lib/scroll'
import { Factory } from './Factory'
import { CloakedSimulator } from './CloakedSimulator'

/** Camera arcs toward the centered cloaked machine — brand lives in the HTML overlay. */
const CAMERA_POINTS = [
  new THREE.Vector3(0.15, 2.35, 6.4),
  new THREE.Vector3(1.8, 2.5, 5.4),
  new THREE.Vector3(3.4, 2.2, 4.2),
  new THREE.Vector3(2.6, 1.85, 3.2),
  new THREE.Vector3(1.1, 1.55, 2.9),
  new THREE.Vector3(0.2, 1.4, 3.1),
  new THREE.Vector3(0, 1.35, 3.25),
]

const LOOK_POINTS = [
  new THREE.Vector3(0, 0.95, -0.2),
  new THREE.Vector3(0.15, 0.95, -0.15),
  new THREE.Vector3(0.2, 0.9, -0.1),
  new THREE.Vector3(0.1, 0.9, -0.1),
  new THREE.Vector3(0, 0.88, -0.15),
  new THREE.Vector3(0, 0.9, -0.1),
  new THREE.Vector3(0, 0.92, -0.05),
]

function SceneLights({ progress }: { progress: number }) {
  const key = lerp(0.4, 1.35, mapRange(progress, 0.25, 0.85, 0, 1))
  const accent = lerp(0.2, 0.7, mapRange(progress, 0.4, 0.9, 0, 1))

  return (
    <>
      <ambientLight intensity={0.1 + progress * 0.05} />
      <hemisphereLight intensity={0.2} color="#1a3040" groundColor="#05060a" />
      <directionalLight
        position={[6, 10, 4]}
        intensity={key}
        color="#e8f4ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-5, 4, -2]} intensity={0.4} color="#2ec4d6" />
      <spotLight
        position={[0, 7, 2]}
        angle={0.42}
        penumbra={0.8}
        intensity={lerp(0.5, 2.2, mapRange(progress, 0.45, 0.85, 0, 1))}
        color="#ffffff"
        castShadow
      />
      <pointLight position={[0.4, 2.2, 0.8]} intensity={accent} color="#e85d04" distance={8} />
    </>
  )
}

export function Experience() {
  const { progress, reducedMotion } = useScrollState()
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3())
  const smoothPos = useRef(new THREE.Vector3(0.15, 2.35, 6.4))
  const smoothT = useRef(0)

  const cameraCurve = useMemo(
    () => new THREE.CatmullRomCurve3(CAMERA_POINTS, false, 'catmullrom', 0.35),
    [],
  )
  const lookCurve = useMemo(
    () => new THREE.CatmullRomCurve3(LOOK_POINTS, false, 'catmullrom', 0.35),
    [],
  )

  useFrame((_, delta) => {
    const targetT = reducedMotion ? 0.05 : easeInOutCubic(Math.min(1, progress))
    smoothT.current += (targetT - smoothT.current) * Math.min(1, delta * 2.1)
    const t = smoothT.current

    const basePos = cameraCurve.getPointAt(t)
    const baseLook = lookCurve.getPointAt(t)
    const settle = mapRange(t, 0.55, 0.95, 0, 1)
    const time = performance.now() * 0.001

    const targetPos = basePos.clone().add(
      new THREE.Vector3(
        Math.sin(time * 0.1) * 0.1 * settle,
        Math.sin(time * 0.16) * 0.035 * settle,
        Math.cos(time * 0.09) * 0.07 * settle,
      ),
    )

    const smoothFactor = 1 - Math.pow(0.0004, delta)
    smoothPos.current.lerp(targetPos, smoothFactor)
    lookAt.current.lerp(baseLook, smoothFactor)

    camera.position.copy(smoothPos.current)
    camera.lookAt(lookAt.current)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = lerp(40, 34, settle)
      camera.updateProjectionMatrix()
    }
  })

  return (
    <>
      <color attach="background" args={['#05060a']} />
      <fog attach="fog" args={['#05060a', 16, 52]} />
      <SceneLights progress={progress} />
      <Environment resolution={256} environmentIntensity={0.25 + progress * 0.25}>
        <Lightformer intensity={1.4} position={[0, 8, -4]} scale={[20, 0.6, 1]} form="rect" color="#7de8f5" />
        <Lightformer intensity={1.0} position={[8, 3, 2]} scale={[4, 8, 1]} form="rect" color="#dfefff" />
        <Lightformer intensity={0.65} position={[-6, 2, -2]} scale={[3, 6, 1]} form="rect" color="#e85d04" />
      </Environment>
      <Factory />
      <CloakedSimulator />
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <Bloom intensity={0.5} luminanceThreshold={0.74} luminanceSmoothing={0.3} mipmapBlur />
        <Noise opacity={0.03} blendFunction={BlendFunction.SOFT_LIGHT} />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.00025, 0.00025)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette offset={0.2} darkness={0.75} />
      </EffectComposer>
    </>
  )
}
