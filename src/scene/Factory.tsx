import { useMemo } from 'react'
import * as THREE from 'three'
import { useScrollState } from '../hooks/useScrollContext'
import { mapRange } from '../lib/scroll'

function BayMark({ position }: { position: [number, number, number] }) {
  const { progress } = useScrollState()
  const glow = mapRange(progress, 0.35, 0.8, 0.25, 1.2)
  const w = 5.2
  const d = 4.0
  const t = 0.08

  return (
    <group position={position}>
      <mesh position={[0, 0.012, -d / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, t]} />
        <meshStandardMaterial
          color="#0a0806"
          emissive="#e85d04"
          emissiveIntensity={glow}
          transparent
          opacity={0.95}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.012, d / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, t]} />
        <meshStandardMaterial
          color="#0a0806"
          emissive="#e85d04"
          emissiveIntensity={glow}
          transparent
          opacity={0.95}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-w / 2, 0.012, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[d, t]} />
        <meshStandardMaterial
          color="#0a0806"
          emissive="#e85d04"
          emissiveIntensity={glow}
          transparent
          opacity={0.95}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[w / 2, 0.012, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[d, t]} />
        <meshStandardMaterial
          color="#0a0806"
          emissive="#e85d04"
          emissiveIntensity={glow}
          transparent
          opacity={0.95}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function SoftPad() {
  const geometry = useMemo(() => new THREE.CircleGeometry(7.5, 64), [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -0.35]} geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color="#0a0c10"
        roughness={0.95}
        metalness={0.05}
        transparent
        opacity={0.72}
        envMapIntensity={0.15}
      />
    </mesh>
  )
}

/** Quiet pad under the bay so the lava lamp can own the rest of the frame. */
export function Factory() {
  return (
    <group>
      <SoftPad />
      <BayMark position={[0, 0, -0.35]} />
    </group>
  )
}
