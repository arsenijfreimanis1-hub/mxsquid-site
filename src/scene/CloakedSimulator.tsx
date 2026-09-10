import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ContactShadows } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useScrollState } from '../hooks/useScrollContext'
import { mapRange } from '../lib/scroll'

/** Covered build bay - sealed cloth volume on scaffolding. Nothing inside is visible. */
const BAY = { w: 4.6, d: 3.4, h: 2.25 }
const POLE_INSET = 0.12

function createClothGeometry(): THREE.BufferGeometry {
  const { w, d, h } = BAY
  // Slightly oversized so walls overlap corners and sit past the frame.
  const ow = w + 0.16
  const od = d + 0.16
  const segX = 56
  const segZ = 42
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  const pushVert = (x: number, y: number, z: number, u: number, v: number) => {
    positions.push(x, y, z)
    uvs.push(u, v)
  }

  // Top drape - mild sag, corners stay high on the scaffolding.
  for (let iz = 0; iz <= segZ; iz++) {
    for (let ix = 0; ix <= segX; ix++) {
      const u = ix / segX
      const v = iz / segZ
      const x = (u - 0.5) * ow
      const z = (v - 0.5) * od
      const edge = Math.max(Math.abs(u - 0.5) * 2, Math.abs(v - 0.5) * 2)
      const corner = Math.pow(edge, 1.6)
      const sag = (1 - corner) * 0.18
      const wrinkle =
        Math.sin(u * Math.PI * 4.8) * Math.cos(v * Math.PI * 3.6) * 0.028 * (1 - corner)
      pushVert(x, h - sag + wrinkle, z, u, v)
    }
  }

  for (let iz = 0; iz < segZ; iz++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = iz * (segX + 1) + ix
      const b = a + 1
      const c = a + (segX + 1)
      const dIdx = c + 1
      indices.push(a, c, b, b, c, dIdx)
    }
  }

  // Hanging walls with extra corner overlap (extend past each edge).
  const wallSegU = 28
  const wallSegV = 24
  const overhang = 0.14
  const walls: Array<{
    from: [number, number, number]
    to: [number, number, number]
    outward: [number, number]
  }> = [
    {
      from: [-ow / 2 - overhang, h, -od / 2],
      to: [ow / 2 + overhang, h, -od / 2],
      outward: [0, -1],
    },
    {
      from: [-ow / 2 - overhang, h, od / 2],
      to: [ow / 2 + overhang, h, od / 2],
      outward: [0, 1],
    },
    {
      from: [-ow / 2, h, -od / 2 - overhang],
      to: [-ow / 2, h, od / 2 + overhang],
      outward: [-1, 0],
    },
    {
      from: [ow / 2, h, -od / 2 - overhang],
      to: [ow / 2, h, od / 2 + overhang],
      outward: [1, 0],
    },
  ]

  for (const wall of walls) {
    const base = positions.length / 3
    for (let iy = 0; iy <= wallSegV; iy++) {
      for (let ix = 0; ix <= wallSegU; ix++) {
        const u = ix / wallSegU
        const v = iy / wallSegV
        const x = wall.from[0] + (wall.to[0] - wall.from[0]) * u
        const z = wall.from[2] + (wall.to[2] - wall.from[2]) * u
        // Hem pinned to the floor - no lift gaps.
        const y = h * (1 - v) * (1 - v * 0.02)
        const flare = v * v * 0.04
        const fold = Math.sin(u * Math.PI * 5 + v * 3.2) * 0.012 * v
        pushVert(
          x + wall.outward[0] * (flare + fold),
          Math.max(0.0, y),
          z + wall.outward[1] * (flare + fold),
          u,
          v,
        )
      }
    }
    for (let iy = 0; iy < wallSegV; iy++) {
      for (let ix = 0; ix < wallSegU; ix++) {
        const a = base + iy * (wallSegU + 1) + ix
        const b = a + 1
        const c = a + (wallSegU + 1)
        const dIdx = c + 1
        indices.push(a, c, b, b, c, dIdx)
      }
    }
  }

  // Floor skirt - seals the hem completely.
  const skirtBase = positions.length / 3
  const skirtSeg = 24
  for (let iz = 0; iz <= skirtSeg; iz++) {
    for (let ix = 0; ix <= skirtSeg; ix++) {
      const u = ix / skirtSeg
      const v = iz / skirtSeg
      const x = (u - 0.5) * (ow + 0.2)
      const z = (v - 0.5) * (od + 0.2)
      pushVert(x, 0.005, z, u, v)
    }
  }
  for (let iz = 0; iz < skirtSeg; iz++) {
    for (let ix = 0; ix < skirtSeg; ix++) {
      const a = skirtBase + iz * (skirtSeg + 1) + ix
      const b = a + 1
      const c = a + (skirtSeg + 1)
      const dIdx = c + 1
      indices.push(a, c, b, b, c, dIdx)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

const clothVertex = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Pin floor hem and corner posts; only mid-panels breathe.
    float floorPin = smoothstep(0.0, 0.22, position.y);
    float cornerPin = 1.0 - (
      smoothstep(1.9, 2.35, abs(position.x)) *
      smoothstep(1.35, 1.75, abs(position.z))
    );
    float free = floorPin * cornerPin * smoothstep(0.15, 1.5, position.y);

    float windPhase = uTime * 2.1 - position.x * 1.2 + position.z * 0.5;
    float wave = sin(windPhase) * 0.028 + sin(windPhase * 1.6 + position.z * 2.0) * 0.016;
    float flutter = sin(uTime * 4.8 + position.y * 7.0 + position.z * 2.6) * 0.008;

    pos.z += (wave + flutter) * uWind * free;
    pos.y += sin(windPhase * 0.75) * 0.01 * uWind * free;
    pos.x += cos(windPhase) * 0.006 * uWind * free;

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const clothFragment = /* glsl */ `
  uniform float uKey;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(vec3(0.55, 0.85, 0.2));
    vec3 L2 = normalize(vec3(-0.6, 0.4, 0.3));

    float diff = pow(dot(n, L) * 0.5 + 0.5, 1.7);
    float fill = pow(dot(n, L2) * 0.5 + 0.5, 2.0);
    float rim = pow(1.0 - max(dot(n, V), 0.0), 2.6);
    float velvet = pow(1.0 - max(dot(n, V), 0.0), 3.8);
    float weave = sin(vUv.x * 90.0) * sin(vUv.y * 70.0) * 0.015;
    float key = mix(0.65, 1.15, clamp(uKey, 0.0, 1.0));

    vec3 col = vec3(0.018, 0.018, 0.02);
    col += vec3(0.09, 0.09, 0.1) * diff * key;
    col += vec3(0.04, 0.05, 0.06) * fill;
    col += vec3(0.14, 0.14, 0.16) * rim * 0.45 * key;
    col += vec3(0.06, 0.055, 0.05) * velvet * 0.35;
    col += weave;
    col *= mix(0.55, 1.0, smoothstep(0.0, 0.9, vWorldPos.y));

    gl_FragColor = vec4(col, 1.0);
  }
`

function BlackoutVolume() {
  const { w, d, h } = BAY
  return (
    <mesh position={[0, h * 0.48, 0]} raycast={() => null}>
      <boxGeometry args={[w - 0.2, h * 0.92, d - 0.2]} />
      <meshBasicMaterial color="#000000" />
    </mesh>
  )
}

function Scaffolding() {
  const { w, d, h } = BAY
  const hx = w / 2 - POLE_INSET
  const hz = d / 2 - POLE_INSET
  const poles: [number, number, number][] = [
    [-hx, h * 0.5, -hz],
    [hx, h * 0.5, -hz],
    [-hx, h * 0.5, hz],
    [hx, h * 0.5, hz],
  ]
  const steel = { color: '#3a3f48', metalness: 0.85, roughness: 0.32 }

  return (
    <group>
      {poles.map(([x, y, z], i) => (
        <group key={i}>
          <mesh position={[x, y, z]} castShadow>
            <cylinderGeometry args={[0.045, 0.05, h, 12]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[x, h + 0.02, z]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.05, 12]} />
            <meshStandardMaterial color="#2a2e36" metalness={0.8} roughness={0.35} />
          </mesh>
          <mesh position={[x, 0.03, z]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 0.06, 12]} />
            <meshStandardMaterial color="#1a1c22" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Top rails */}
      <mesh position={[0, h, -hz]} castShadow>
        <boxGeometry args={[w - POLE_INSET * 2, 0.05, 0.05]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[0, h, hz]} castShadow>
        <boxGeometry args={[w - POLE_INSET * 2, 0.05, 0.05]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[-hx, h, 0]} castShadow>
        <boxGeometry args={[0.05, 0.05, d - POLE_INSET * 2]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[hx, h, 0]} castShadow>
        <boxGeometry args={[0.05, 0.05, d - POLE_INSET * 2]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {/* Mid braces */}
      <mesh position={[0, h * 0.55, -hz]} castShadow>
        <boxGeometry args={[w - POLE_INSET * 2, 0.035, 0.035]} />
        <meshStandardMaterial color="#2e333c" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, h * 0.55, hz]} castShadow>
        <boxGeometry args={[w - POLE_INSET * 2, 0.035, 0.035]} />
        <meshStandardMaterial color="#2e333c" metalness={0.8} roughness={0.4} />
      </mesh>
    </group>
  )
}

function ClothBay() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const geometry = useMemo(() => createClothGeometry(), [])
  const { progress } = useScrollState()
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWind: { value: 0.75 },
      uKey: { value: 0.5 },
    }),
    [],
  )

  useFrame(({ clock }) => {
    const m = materialRef.current
    if (!m) return
    m.uniforms.uTime.value = clock.elapsedTime
    m.uniforms.uWind.value = mapRange(progress, 0.15, 0.85, 0.55, 0.95)
    m.uniforms.uKey.value = mapRange(progress, 0.2, 0.85, 0.4, 1)
  })

  return (
    <mesh geometry={geometry} position={[0, 0, 0]} castShadow receiveShadow>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={clothVertex}
        fragmentShader={clothFragment}
        side={THREE.DoubleSide}
        depthWrite
      />
    </mesh>
  )
}

function FloorFan({ reducedMotion }: { reducedMotion: boolean }) {
  const bladesRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!bladesRef.current || reducedMotion) return
    bladesRef.current.rotation.z -= delta * 14
  })

  return (
    <group position={[3.75, 0, 0.2]} rotation={[0, -0.55, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.9, 16]} />
        <meshStandardMaterial color="#1a1c22" metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.05, 24]} />
        <meshStandardMaterial color="#12141a" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.16, 24, 16]} />
        <meshStandardMaterial color="#22252c" metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.05, 0.12]} castShadow>
        <torusGeometry args={[0.38, 0.018, 12, 32]} />
        <meshStandardMaterial color="#2a2e36" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.05, 0.12]}>
        <torusGeometry args={[0.26, 0.012, 10, 28]} />
        <meshStandardMaterial color="#2a2e36" metalness={0.85} roughness={0.25} />
      </mesh>
      <group ref={bladesRef} position={[0, 1.05, 0.12]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} castShadow>
            <boxGeometry args={[0.72, 0.1, 0.012]} />
            <meshStandardMaterial color="#0c0d10" metalness={0.5} roughness={0.45} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 16]} />
          <meshStandardMaterial
            color="#e85d04"
            metalness={0.6}
            roughness={0.3}
            emissive="#e85d04"
            emissiveIntensity={0.25}
          />
        </mesh>
      </group>
      <pointLight position={[-0.4, 1.1, 0.6]} intensity={0.35} distance={3.5} color="#8ad4e0" />
    </group>
  )
}

export function CloakedSimulator() {
  const { reducedMotion } = useScrollState()
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion) return
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.12) * 0.008
  })

  return (
    <group ref={groupRef} position={[0, 0, -0.35]} rotation={[0, -0.08, 0]}>
      <Scaffolding />
      <BlackoutVolume />
      <ClothBay />
      <FloorFan reducedMotion={reducedMotion} />
      <ContactShadows
        position={[0, 0.004, 0]}
        opacity={0.72}
        scale={14}
        blur={3.4}
        far={4.5}
        resolution={512}
        color="#000000"
      />
    </group>
  )
}
