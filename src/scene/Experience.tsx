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

/**
 * Start on empty grid (logo owns the frame). Mid scroll reveals the covered bay.
 * End stays wide so the full bay and CTA both read clearly.
 */
const CAMERA_POINTS = [
  new THREE.Vector3(-1.8, 5.2, 12.5),
  new THREE.Vector3(-3.6, 4.4, 10.0),
  new THREE.Vector3(2.8, 3.8, 9.2),
  new THREE.Vector3(3.4, 3.2, 8.0),
  new THREE.Vector3(1.4, 3.0, 8.4),
  new THREE.Vector3(0.3, 3.15, 9.0),
  new THREE.Vector3(0, 3.35, 9.6),
]

const LOOK_POINTS = [
  new THREE.Vector3(-5.5, 1.4, -9),
  new THREE.Vector3(-2.5, 1.2, -5),
  new THREE.Vector3(0.2, 1.15, -0.5),
  new THREE.Vector3(0.1, 1.2, -0.35),
  new THREE.Vector3(0, 1.15, -0.3),
  new THREE.Vector3(0, 1.05, -0.3),
  new THREE.Vector3(0, 1.0, -0.3),
]

function SceneLights({ progress }: { progress: number }) {
  const reveal = mapRange(progress, 0.12, 0.55, 0, 1)
  const key = lerp(0.15, 1.25, mapRange(progress, 0.2, 0.85, 0, 1))
  const accent = lerp(0.05, 0.65, mapRange(progress, 0.4, 0.9, 0, 1))

  return (
    <>
      <ambientLight intensity={0.06 + progress * 0.06} />
      <hemisphereLight intensity={0.14 + reveal * 0.08} color="#1a3040" groundColor="#05060a" />
      <directionalLight
        position={[6, 10, 4]}
        intensity={key}
        color="#e8f4ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={40}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-5, 4, -2]} intensity={0.2 + reveal * 0.25} color="#2ec4d6" />
      <spotLight
        position={[0, 8, 2.5]}
        angle={0.45}
        penumbra={0.85}
        intensity={lerp(0.05, 2.0, mapRange(progress, 0.35, 0.85, 0, 1))}
        color="#ffffff"
        castShadow
      />
      <pointLight position={[0.4, 2.4, 1]} intensity={accent} color="#e85d04" distance={10} />
    </>
  )
}

export function Experience() {
  const { progress, reducedMotion } = useScrollState()
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3())
  const smoothPos = useRef(new THREE.Vector3(-1.8, 5.2, 12.5))
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
        Math.sin(time * 0.1) * 0.08 * settle,
        Math.sin(time * 0.16) * 0.03 * settle,
        Math.cos(time * 0.09) * 0.06 * settle,
      ),
    )

    const smoothFactor = 1 - Math.pow(0.0004, delta)
    smoothPos.current.lerp(targetPos, smoothFactor)
    lookAt.current.lerp(baseLook, smoothFactor)

    camera.position.copy(smoothPos.current)
    camera.lookAt(lookAt.current)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = lerp(44, 38, settle)
      camera.updateProjectionMatrix()
    }
  })

  return (
    <>
      <color attach="background" args={['#05060a']} />
      <fog attach="fog" args={['#05060a', 14, 48]} />
      <SceneLights progress={progress} />
      <Environment resolution={256} environmentIntensity={0.18 + progress * 0.28}>
        <Lightformer intensity={1.2} position={[0, 8, -4]} scale={[20, 0.6, 1]} form="rect" color="#7de8f5" />
        <Lightformer intensity={0.9} position={[8, 3, 2]} scale={[4, 8, 1]} form="rect" color="#dfefff" />
        <Lightformer intensity={0.55} position={[-6, 2, -2]} scale={[3, 6, 1]} form="rect" color="#e85d04" />
      </Environment>
      <Factory />
      <CloakedSimulator />
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <Bloom intensity={0.48} luminanceThreshold={0.74} luminanceSmoothing={0.3} mipmapBlur />
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
