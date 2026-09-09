import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ContactShadows } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useScrollState } from '../hooks/useScrollContext'
import { mapRange } from '../lib/scroll'

/** Dark motion platform + opaque black cover. Nothing underneath is shown. */
const DECK = { w: 2.9, d: 1.5, h: 0.26, y: 0.13 }

function createTarpGeometry(): THREE.BufferGeometry {
  // Upright lathe: radius, height — reads as a draped cover over a bike-length form.
  const profile = [
    new THREE.Vector2(1.48, 0.0),
    new THREE.Vector2(1.4, 0.02),
    new THREE.Vector2(1.22, 0.12),
    new THREE.Vector2(1.05, 0.32),
    new THREE.Vector2(0.9, 0.55),
    new THREE.Vector2(0.74, 0.82),
    new THREE.Vector2(0.6, 1.05),
    new THREE.Vector2(0.5, 1.2),
    new THREE.Vector2(0.42, 1.3),
    new THREE.Vector2(0.28, 1.36),
    new THREE.Vector2(0.05, 1.34),
  ]

  const geo = new THREE.LatheGeometry(profile, 72)
  // Elongate along X (bike length), slim along Z
  geo.scale(1.28, 1, 0.68)

  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const ang = Math.atan2(z, x)
    const fold = Math.sin(ang * 5 + x * 0.9) * 0.014 * Math.min(1, y * 1.2)
    pos.setX(i, x + Math.cos(ang) * fold * 0.3)
    pos.setZ(i, z + Math.sin(ang) * fold * 0.3)
    pos.setY(i, Math.max(0.0, y + Math.abs(fold) * 0.15))
  }
  geo.computeVertexNormals()
  return geo
}

const tarpVertex = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 pos = position;
    float free = smoothstep(0.05, 0.5, position.y);
    float wave = sin(uTime * 0.5 + position.x * 2.0 + position.z * 1.8) * 0.008;
    pos += normal * wave * uWind * free;

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const tarpFragment = /* glsl */ `
  uniform float uKey;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(vec3(0.4, 1.0, 0.3));

    float diff = pow(dot(n, L) * 0.5 + 0.5, 1.9);
    float rim = pow(1.0 - max(dot(n, V), 0.0), 2.8);
    float velvet = pow(1.0 - max(dot(n, V), 0.0), 3.4);
    float key = mix(0.7, 1.15, clamp(uKey, 0.0, 1.0));

    vec3 col = vec3(0.02, 0.02, 0.022);
    col += vec3(0.085, 0.085, 0.095) * diff * key;
    col += vec3(0.15, 0.15, 0.17) * rim * 0.5 * key;
    col += vec3(0.07, 0.06, 0.05) * velvet * 0.4;
    col *= mix(0.5, 1.0, smoothstep(0.0, 0.5, vWorldPos.y));

    gl_FragColor = vec4(col, 1.0);
  }
`

function CoveredForm() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const geometry = useMemo(() => createTarpGeometry(), [])
  const { progress } = useScrollState()
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWind: { value: 0.3 },
      uKey: { value: 0.5 },
    }),
    [],
  )

  useFrame(({ clock }) => {
    const m = materialRef.current
    if (!m) return
    m.uniforms.uTime.value = clock.elapsedTime
    m.uniforms.uWind.value = mapRange(progress, 0.4, 0.9, 0.2, 0.65)
    m.uniforms.uKey.value = mapRange(progress, 0.2, 0.85, 0.45, 1)
  })

  // Hem rests on the floor; body rises over the deck
  return (
    <mesh geometry={geometry} position={[0, 0.01, 0]} castShadow receiveShadow>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={tarpVertex}
        fragmentShader={tarpFragment}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function Platform() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[DECK.w + 0.4, 0.04, DECK.d + 0.35]} />
        <meshStandardMaterial color="#09090b" metalness={0.5} roughness={0.6} />
      </mesh>
      <mesh position={[0, DECK.y, 0]} castShadow receiveShadow>
        <boxGeometry args={[DECK.w, DECK.h, DECK.d]} />
        <meshStandardMaterial color="#0e0e12" metalness={0.78} roughness={0.3} />
      </mesh>
      <mesh position={[0, DECK.y + DECK.h * 0.5 + 0.01, 0]} receiveShadow>
        <boxGeometry args={[DECK.w - 0.1, 0.02, DECK.d - 0.1]} />
        <meshStandardMaterial color="#16161a" metalness={0.82} roughness={0.26} />
      </mesh>
      {(
        [
          [-1.1, -0.5],
          [-1.1, 0.5],
          [1.1, -0.5],
          [1.1, 0.5],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.015, z]} castShadow>
          <cylinderGeometry args={[0.075, 0.095, 0.1, 16]} />
          <meshStandardMaterial color="#222428" metalness={0.9} roughness={0.22} />
        </mesh>
      ))}
    </group>
  )
}

export function CloakedSimulator() {
  const { reducedMotion } = useScrollState()
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion) return
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.14) * 0.01
  })

  return (
    <group ref={groupRef} position={[0, 0, -0.2]} rotation={[0, -0.18, 0]}>
      <Platform />
      <CoveredForm />
      <ContactShadows
        position={[0, 0.004, 0]}
        opacity={0.78}
        scale={8}
        blur={2.8}
        far={3}
        resolution={512}
        color="#000000"
      />
    </group>
  )
}
