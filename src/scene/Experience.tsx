import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useScrollState } from '../hooks/useScrollContext'
import { easeInOutCubic, lerp, mapRange } from '../lib/scroll'
import { Factory } from './Factory'
import { CloakedSimulator } from './CloakedSimulator'

const LOGO_POS = new THREE.Vector3(1.2, 8.8, 11.5)
const LOGO_LOOK = new THREE.Vector3(2.5, 2.4, 22)
const SIM_POS = new THREE.Vector3(4.5, 3.5, 8.0)
const SIM_LOOK = new THREE.Vector3(0, 1.0, -0.35)
const END_POS = new THREE.Vector3(1.2, 3.25, 9.4)
const END_LOOK = new THREE.Vector3(0, 0.72, -0.35)

/**
 * Three beats only:
 * 1) Logo / empty void
 * 2) One turn onto the covered sim
 * 3) Hold / slight settle on the covered sim
 */
function cameraForScroll(t: number, outPos: THREE.Vector3, outLook: THREE.Vector3) {
  if (t < 0.2) {
    outPos.copy(LOGO_POS)
    outLook.copy(LOGO_LOOK)
    return
  }

  if (t < 0.42) {
    const u = easeInOutCubic((t - 0.2) / 0.22)
    outPos.lerpVectors(LOGO_POS, SIM_POS, u)
    outLook.lerpVectors(LOGO_LOOK, SIM_LOOK, u)
    return
  }

  const u = easeInOutCubic(mapRange(t, 0.42, 1, 0, 1))
  outPos.lerpVectors(SIM_POS, END_POS, u)
  outLook.lerpVectors(SIM_LOOK, END_LOOK, u)
}

function SceneLights({ progress }: { progress: number }) {
  const reveal = mapRange(progress, 0.18, 0.5, 0, 1)
  const key = lerp(0.22, 1.2, mapRange(progress, 0.2, 0.85, 0, 1))
  const accent = lerp(0.06, 0.6, mapRange(progress, 0.4, 0.9, 0, 1))

  return (
    <>
      <ambientLight intensity={0.08 + progress * 0.05} />
      <hemisphereLight intensity={0.16 + reveal * 0.08} color="#1a3040" groundColor="#05060a" />
      <directionalLight
        position={[6, 12, 4]}
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
        position={[0, 10, 1]}
        angle={0.5}
        penumbra={0.85}
        intensity={lerp(0.15, 2.0, mapRange(progress, 0.3, 0.85, 0, 1))}
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
  const lookAt = useRef(new THREE.Vector3().copy(LOGO_LOOK))
  const smoothPos = useRef(new THREE.Vector3().copy(LOGO_POS))
  const smoothT = useRef(0)
  const scratchPos = useRef(new THREE.Vector3())
  const scratchLook = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    const targetT = reducedMotion ? 0.05 : easeInOutCubic(Math.min(1, progress))
    smoothT.current += (targetT - smoothT.current) * Math.min(1, delta * 2.0)
    const t = smoothT.current

    cameraForScroll(t, scratchPos.current, scratchLook.current)
    const settle = mapRange(t, 0.55, 1, 0, 1)
    const time = performance.now() * 0.001

    const targetPos = scratchPos.current.clone().add(
      new THREE.Vector3(
        Math.sin(time * 0.08) * 0.04 * settle,
        Math.sin(time * 0.12) * 0.015 * settle,
        Math.cos(time * 0.07) * 0.03 * settle,
      ),
    )

    const smoothFactor = 1 - Math.pow(0.00035, delta)
    smoothPos.current.lerp(targetPos, smoothFactor)
    lookAt.current.lerp(scratchLook.current, smoothFactor)

    camera.position.copy(smoothPos.current)
    camera.lookAt(lookAt.current)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = lerp(42, 36, mapRange(t, 0.2, 1, 0, 1))
      camera.updateProjectionMatrix()
    }
  })

  return (
    <>
      <color attach="background" args={['#05060a']} />
      <fog attach="fog" args={['#05060a', 16, 52]} />
      <SceneLights progress={progress} />
      <Environment resolution={256} environmentIntensity={0.2 + progress * 0.25}>
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
