import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useScrollState } from '../hooks/useScrollContext'
import { lerp, mapRange } from '../lib/scroll'
import { Factory } from './Factory'
import { CloakedSimulator } from './CloakedSimulator'

/** Start looking straight up into black void (logo owns the frame). */
const SKY_POS = new THREE.Vector3(0.2, 3.8, 3.2)
const SKY_LOOK = new THREE.Vector3(0.2, 80, 3.2)

/** After the pan-down, begin the orbit facing the covered bay. */
const ORBIT_START_ANGLE = 0.55
const ORBIT_RADIUS = 8.2
const BAY_Z = -0.35
const FACE_POS = new THREE.Vector3(
  Math.sin(ORBIT_START_ANGLE) * ORBIT_RADIUS,
  4.2,
  BAY_Z + Math.cos(ORBIT_START_ANGLE) * ORBIT_RADIUS,
)
const FACE_LOOK = new THREE.Vector3(0, 1.05, BAY_Z)

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * 1) Black sky - camera facing up
 * 2) Pan down onto the covered sim
 * 3) Orbit around it, settle for CTA
 */
function cameraForScroll(t: number, outPos: THREE.Vector3, outLook: THREE.Vector3) {
  if (t < 0.28) {
    const u = easeOutCubic(t / 0.28)
    outPos.lerpVectors(SKY_POS, FACE_POS, u)
    outLook.lerpVectors(SKY_LOOK, FACE_LOOK, u)
    return
  }

  const u = mapRange(t, 0.28, 1, 0, 1)
  const eased = easeOutCubic(u)
  const angle = ORBIT_START_ANGLE + eased * Math.PI * 1.85
  const radius = lerp(ORBIT_RADIUS, 9.6, mapRange(eased, 0.7, 1, 0, 1))
  const height = lerp(4.2, 3.15, eased)
  outPos.set(Math.sin(angle) * radius, height, BAY_Z + Math.cos(angle) * radius)
  outLook.set(0, lerp(1.05, 0.72, eased), BAY_Z)
}

function SceneLights({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const reveal = mapRange(progress, 0.1, 0.38, 0, 1)
  const key = lerp(0.22, 1.45, mapRange(progress, 0.1, 0.8, 0, 1))
  const accent = lerp(0.04, 0.7, mapRange(progress, 0.3, 0.9, 0, 1))

  return (
    <>
      <ambientLight intensity={(isMobile ? 0.18 : 0.07) + progress * 0.08} />
      <hemisphereLight intensity={(isMobile ? 0.22 : 0.12) + reveal * 0.16} color="#243848" groundColor="#121418" />
      <directionalLight
        position={[6, 12, 4]}
        intensity={key}
        color="#e8f4ff"
        castShadow={!isMobile}
        shadow-mapSize={isMobile ? [512, 512] : [2048, 2048]}
        shadow-camera-far={40}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-5, 4, -2]} intensity={0.08 + reveal * 0.35} color="#0b5bd3" />
      <spotLight
        position={[0, 10, 1]}
        angle={0.5}
        penumbra={0.85}
        intensity={lerp(0.05, 2.0, mapRange(progress, 0.25, 0.85, 0, 1))}
        color="#ffffff"
        castShadow={!isMobile}
      />
      <pointLight position={[0.4, 2.4, 1]} intensity={accent} color="#ff5a00" distance={10} />
      <pointLight position={[-1.2, 2.1, -0.6]} intensity={accent * 0.35} color="#f5d000" distance={8} />
    </>
  )
}

export function Experience() {
  const { progress, reducedMotion, isMobile } = useScrollState()
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3().copy(SKY_LOOK))
  const smoothPos = useRef(new THREE.Vector3().copy(SKY_POS))
  const smoothT = useRef(0)
  const scratchPos = useRef(new THREE.Vector3())
  const scratchLook = useRef(new THREE.Vector3())
  const targetPos = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    const raw = Math.min(1, progress)
    const targetT = reducedMotion ? 0.08 : raw
    const track = isMobile ? 16 : 14
    smoothT.current += (targetT - smoothT.current) * (1 - Math.exp(-delta * track))
    const t = smoothT.current

    cameraForScroll(t, scratchPos.current, scratchLook.current)
    const settle = mapRange(t, 0.4, 1, 0, 1)
    const time = performance.now() * 0.001

    targetPos.current.copy(scratchPos.current)
    if (!isMobile) {
      targetPos.current.x += Math.sin(time * 0.045) * 0.028 * settle
      targetPos.current.y += Math.sin(time * 0.07) * 0.01 * settle
      targetPos.current.z += Math.cos(time * 0.04) * 0.02 * settle
    }

    const smoothFactor = 1 - Math.exp(-delta * (isMobile ? 14 : 12))
    smoothPos.current.lerp(targetPos.current, smoothFactor)
    lookAt.current.lerp(scratchLook.current, smoothFactor)

    camera.position.copy(smoothPos.current)
    camera.lookAt(lookAt.current)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = lerp(44, 36, mapRange(t, 0.08, 1, 0, 1))
      camera.updateProjectionMatrix()
    }
  })

  const envIntensity = mapRange(progress, 0.08, 0.35, 0.02, 0.28)

  return (
    <>
      <SceneLights progress={progress} isMobile={isMobile} />
      {isMobile ? null : (
        <Environment resolution={256} environmentIntensity={envIntensity}>
          <Lightformer intensity={0.7} position={[0, 8, -4]} scale={[20, 0.6, 1]} form="rect" color="#0b5bd3" />
          <Lightformer intensity={0.45} position={[8, 3, 2]} scale={[4, 8, 1]} form="rect" color="#16a34a" />
          <Lightformer intensity={0.4} position={[-6, 2, -2]} scale={[3, 6, 1]} form="rect" color="#ff5a00" />
          <Lightformer intensity={0.22} position={[2, 5, 6]} scale={[3, 3, 1]} form="rect" color="#cc1e1e" />
          <Lightformer intensity={0.18} position={[0, 6, 4]} scale={[2, 2, 1]} form="rect" color="#f5d000" />
        </Environment>
      )}
      <Factory />
      <CloakedSimulator />
      {isMobile ? null : (
        <EffectComposer multisampling={4} enableNormalPass={false}>
          <Bloom intensity={0.32} luminanceThreshold={0.82} luminanceSmoothing={0.45} mipmapBlur />
          <Noise opacity={0.01} blendFunction={BlendFunction.SOFT_LIGHT} />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={new THREE.Vector2(0.0001, 0.0001)}
            radialModulation={false}
            modulationOffset={0}
          />
          <Vignette offset={0.32} darkness={0.48} />
        </EffectComposer>
      )}
    </>
  )
}
