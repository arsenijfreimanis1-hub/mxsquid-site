import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ContactShadows } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useScrollState } from '../hooks/useScrollContext'
import { mapRange } from '../lib/scroll'

/** Sealed cloth volume on exterior scaffolding. Corners stay connected. */
const BAY = { w: 4.5, d: 3.3, h: 2.2 }

function createClothGeometry(): THREE.BufferGeometry {
  const { w, d, h } = BAY
  // Continuous box mesh = no corner gaps between panels.
  const geo = new THREE.BoxGeometry(w, h, d, 36, 18, 28)
  geo.translate(0, h / 2, 0)

  const pos = geo.attributes.position
  const hw = w * 0.5
  const hd = d * 0.5

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)

    const onTop = y > h - 0.02
    const onBottom = y < 0.02
    const nx = Math.abs(x) / hw
    const nz = Math.abs(z) / hd
    const edge = Math.max(nx, nz)
    const corner = Math.pow(Math.min(1, nx * nz * 1.15), 1.4)

    if (onTop) {
      // Soft center sag only - corners stay on the frame.
      const sag = (1 - edge) * (1 - corner) * 0.12
      const wrinkle = Math.sin(x * 2.4) * Math.cos(z * 2.1) * 0.02 * (1 - edge)
      y -= sag - wrinkle
    } else if (!onBottom) {
      // Side folds, stronger mid-face, quiet near corners/hem.
      const midY = Math.sin((y / h) * Math.PI)
      const awayCorner = 1 - corner
      const fold = Math.sin(y * 5.5 + x * 1.2 + z * 1.4) * 0.035 * midY * awayCorner
      if (Math.abs(x) > hw - 0.02) x += Math.sign(x) * fold * 0.35
      if (Math.abs(z) > hd - 0.02) z += Math.sign(z) * fold * 0.35
      y += Math.abs(fold) * 0.08
    } else {
      y = 0
    }

    pos.setXYZ(i, x, Math.max(0, y), z)
  }

  pos.needsUpdate = true
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

    float floorPin = smoothstep(0.0, 0.18, position.y);
    float topPin = 1.0 - smoothstep(1.95, 2.2, position.y);
    float cornerPin = 1.0 - pow(
      smoothstep(1.7, 2.25, abs(position.x)) * smoothstep(1.2, 1.65, abs(position.z)),
      0.65
    );
    float free = floorPin * topPin * cornerPin * 0.85;

    float windPhase = uTime * 2.0 - position.x * 1.15 + position.z * 0.45;
    float wave = sin(windPhase) * 0.022 + sin(windPhase * 1.55 + position.z * 1.8) * 0.012;
    float flutter = sin(uTime * 4.4 + position.y * 6.5) * 0.006;

    pos.z += (wave + flutter) * uWind * free;
    pos.x += cos(windPhase) * 0.005 * uWind * free;
    pos.y += sin(windPhase * 0.7) * 0.008 * uWind * free * floorPin;

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
    float weave = sin(vUv.x * 80.0) * sin(vUv.y * 60.0) * 0.012;
    float key = mix(0.7, 1.15, clamp(uKey, 0.0, 1.0));

    vec3 col = vec3(0.045, 0.046, 0.05);
    col += vec3(0.1, 0.1, 0.11) * diff * key;
    col += vec3(0.045, 0.05, 0.055) * fill;
    col += vec3(0.16, 0.16, 0.18) * rim * 0.4 * key;
    col += vec3(0.07, 0.065, 0.06) * velvet * 0.3;
    col += weave;
    col *= mix(0.65, 1.0, smoothstep(0.0, 1.0, vWorldPos.y));

    gl_FragColor = vec4(col, 1.0);
  }
`

function BlackoutVolume() {
  const { w, d, h } = BAY
  // Stay well under the cloth sag so nothing punches through the roof.
  const bh = h * 0.72
  return (
    <mesh position={[0, bh * 0.5 + 0.02, 0]} raycast={() => null}>
      <boxGeometry args={[w * 0.92, bh, d * 0.92]} />
      <meshBasicMaterial color="#050506" />
    </mesh>
  )
}

function Scaffolding() {
  const { w, d, h } = BAY
  // Outside the cloth so poles actually read as holding the cover.
  const hx = w / 2 + 0.22
  const hz = d / 2 + 0.22
  const poleH = h + 0.18
  const poles: [number, number][] = [
    [-hx, -hz],
    [hx, -hz],
    [-hx, hz],
    [hx, hz],
  ]
  const steel = { color: '#5a616c', metalness: 0.88, roughness: 0.28 }

  return (
    <group>
      {poles.map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, poleH * 0.5, z]} castShadow>
            <cylinderGeometry args={[0.055, 0.06, poleH, 14]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh position={[x, poleH + 0.03, z]} castShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.06, 12]} />
            <meshStandardMaterial color="#3d4450" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[x, 0.04, z]} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 0.08, 12]} />
            <meshStandardMaterial color="#22262e" metalness={0.75} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Top frame resting on poles, cloth sits under / against it */}
      <mesh position={[0, h + 0.04, -hz]} castShadow>
        <boxGeometry args={[hx * 2 + 0.06, 0.06, 0.06]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[0, h + 0.04, hz]} castShadow>
        <boxGeometry args={[hx * 2 + 0.06, 0.06, 0.06]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[-hx, h + 0.04, 0]} castShadow>
        <boxGeometry args={[0.06, 0.06, hz * 2 + 0.06]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[hx, h + 0.04, 0]} castShadow>
        <boxGeometry args={[0.06, 0.06, hz * 2 + 0.06]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {/* Mid rails */}
      <mesh position={[0, h * 0.52, -hz]} castShadow>
        <boxGeometry args={[hx * 2, 0.04, 0.04]} />
        <meshStandardMaterial color="#4a515c" metalness={0.82} roughness={0.35} />
      </mesh>
      <mesh position={[0, h * 0.52, hz]} castShadow>
        <boxGeometry args={[hx * 2, 0.04, 0.04]} />
        <meshStandardMaterial color="#4a515c" metalness={0.82} roughness={0.35} />
      </mesh>
      <mesh position={[-hx, h * 0.52, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, hz * 2]} />
        <meshStandardMaterial color="#4a515c" metalness={0.82} roughness={0.35} />
      </mesh>
      <mesh position={[hx, h * 0.52, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, hz * 2]} />
        <meshStandardMaterial color="#4a515c" metalness={0.82} roughness={0.35} />
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
      uWind: { value: 0.7 },
      uKey: { value: 0.5 },
    }),
    [],
  )

  useFrame(({ clock }) => {
    const m = materialRef.current
    if (!m) return
    m.uniforms.uTime.value = clock.elapsedTime
    m.uniforms.uWind.value = mapRange(progress, 0.15, 0.85, 0.5, 0.9)
    m.uniforms.uKey.value = mapRange(progress, 0.2, 0.85, 0.45, 1)
  })

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={clothVertex}
        fragmentShader={clothFragment}
        side={THREE.FrontSide}
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
    <group position={[3.9, 0, 0.25]} rotation={[0, -0.55, 0]}>
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
        opacity={0.65}
        scale={14}
        blur={3.4}
        far={4.5}
        resolution={512}
        color="#000000"
      />
    </group>
  )
}
