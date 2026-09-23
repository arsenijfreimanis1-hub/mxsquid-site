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

/** Start looking straight up into black void (logo owns the frame). */
const SKY_POS = new THREE.Vector3(0.2, 3.8, 3.2)
const SKY_LOOK = new THREE.Vector3(0.2, 80, 3.2)

/** After the pan-down, begin the orbit facing the covered bay. */
const ORBIT_START_ANGLE = 0.55
const ORBIT_RADIUS = 8.2
const BAY_Z = -0.35

/**
 * 1) Black sky - camera facing up
 * 2) Pan down onto the covered sim
 * 3) Orbit around it, settle for CTA
 */
function cameraForScroll(t: number, outPos: THREE.Vector3, outLook: THREE.Vector3) {
  if (t < 0.1) {
    outPos.copy(SKY_POS)
    outLook.copy(SKY_LOOK)
    return
  }

  // Pan down onto the sim
  if (t < 0.32) {
    const u = easeInOutCubic((t - 0.1) / 0.22)
    const facePos = new THREE.Vector3(
      Math.sin(ORBIT_START_ANGLE) * ORBIT_RADIUS,
      4.2,
      BAY_Z + Math.cos(ORBIT_START_ANGLE) * ORBIT_RADIUS,
    )
    const faceLook = new THREE.Vector3(0, 1.05, BAY_Z)
    outPos.lerpVectors(SKY_POS, facePos, u)
    outLook.lerpVectors(SKY_LOOK, faceLook, u)
    return
  }

  // Orbit around the covered bay, then ease out slightly for CTA space
  const u = mapRange(t, 0.32, 1, 0, 1)
  const eased = easeInOutCubic(u)
  const angle = ORBIT_START_ANGLE + eased * Math.PI * 1.85
  const radius = lerp(ORBIT_RADIUS, 9.6, mapRange(eased, 0.7, 1, 0, 1))
  const height = lerp(4.2, 3.15, eased)
  outPos.set(Math.sin(angle) * radius, height, BAY_Z + Math.cos(angle) * radius)
  outLook.set(0, lerp(1.05, 0.72, eased), BAY_Z)
}

function SceneLights({ progress }: { progress: number }) {
  const reveal = mapRange(progress, 0.1, 0.38, 0, 1)
  const key = lerp(0.22, 1.45, mapRange(progress, 0.1, 0.8, 0, 1))
  const accent = lerp(0.04, 0.7, mapRange(progress, 0.3, 0.9, 0, 1))

  return (
    <>
      <ambientLight intensity={0.07 + progress * 0.08} />
      <hemisphereLight intensity={0.12 + reveal * 0.16} color="#243848" groundColor="#121418" />
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
      <directionalLight position={[-5, 4, -2]} intensity={0.08 + reveal * 0.35} color="#2ec4d6" />
      <spotLight
        position={[0, 10, 1]}
        angle={0.5}
        penumbra={0.85}
        intensity={lerp(0.05, 2.0, mapRange(progress, 0.25, 0.85, 0, 1))}
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
  const lookAt = useRef(new THREE.Vector3().copy(SKY_LOOK))
  const smoothPos = useRef(new THREE.Vector3().copy(SKY_POS))
  const smoothT = useRef(0)
  const scratchPos = useRef(new THREE.Vector3())
  const scratchLook = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    const raw = Math.min(1, progress)
    const biased = Math.min(1, Math.pow(raw, 0.78))
    const targetT = reducedMotion ? 0.08 : biased
    smoothT.current += (targetT - smoothT.current) * (1 - Math.exp(-delta * 1.8))
    const t = smoothT.current

    cameraForScroll(t, scratchPos.current, scratchLook.current)
    const settle = mapRange(t, 0.4, 1, 0, 1)
    const time = performance.now() * 0.001

    const targetPos = scratchPos.current.clone().add(
      new THREE.Vector3(
        Math.sin(time * 0.045) * 0.028 * settle,
        Math.sin(time * 0.07) * 0.01 * settle,
        Math.cos(time * 0.04) * 0.02 * settle,
      ),
    )

    const smoothFactor = 1 - Math.exp(-delta * 3.4)
    smoothPos.current.lerp(targetPos, smoothFactor)
    lookAt.current.lerp(scratchLook.current, smoothFactor)

    camera.position.copy(smoothPos.current)
    camera.lookAt(lookAt.current)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = lerp(44, 36, mapRange(t, 0.1, 1, 0, 1))
      camera.updateProjectionMatrix()
    }
  })

  const envIntensity = mapRange(progress, 0.08, 0.35, 0.02, 0.45)

  return (
    <>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#05060a', 18, 54]} />
      <SceneLights progress={progress} />
      <Environment resolution={256} environmentIntensity={envIntensity}>
        <Lightformer intensity={1.2} position={[0, 8, -4]} scale={[20, 0.6, 1]} form="rect" color="#7de8f5" />
        <Lightformer intensity={0.9} position={[8, 3, 2]} scale={[4, 8, 1]} form="rect" color="#dfefff" />
        <Lightformer intensity={0.55} position={[-6, 2, -2]} scale={[3, 6, 1]} form="rect" color="#e85d04" />
      </Environment>
      <Factory />
      <CloakedSimulator />
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <Bloom intensity={0.42} luminanceThreshold={0.78} luminanceSmoothing={0.45} mipmapBlur />
        <Noise opacity={0.012} blendFunction={BlendFunction.SOFT_LIGHT} />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.00012, 0.00012)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette offset={0.28} darkness={0.62} />
      </EffectComposer>
    </>
  )
}
