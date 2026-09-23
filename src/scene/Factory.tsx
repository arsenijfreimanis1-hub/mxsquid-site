import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScrollState } from '../hooks/useScrollContext'
import { mapRange } from '../lib/scroll'
import { useConcreteTextures, usePanelTextures } from './textures'

const CONCRETE_NORMAL = new THREE.Vector2(1.35, 1.35)
const PANEL_NORMAL = new THREE.Vector2(1.05, 1.05)

const gridVertex = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const gridFragment = /* glsl */ `
  uniform float uFade;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vWorldPos;

  float line(float v, float width) {
    float d = abs(fract(v - 0.5) - 0.5) / fwidth(v);
    return 1.0 - smoothstep(0.0, width, d);
  }

  void main() {
    vec2 uv = vWorldPos.xz;
    float major = max(line(uv.x / 4.0, 1.35), line(uv.y / 4.0, 1.35));
    float minor = max(line(uv.x, 1.15), line(uv.y, 1.15));

    vec3 cyan = vec3(0.18, 0.78, 0.86);
    vec3 orange = vec3(0.91, 0.36, 0.04);

    float lines = clamp(minor * 0.22 + major * 0.85, 0.0, 1.0);
    vec3 col = mix(cyan, orange, major * 0.18 * uFade);

    float dist = length(vWorldPos.xz);
    float fog = smoothstep(uFogNear, uFogFar, dist);
    float alpha = lines * (1.0 - fog) * 0.38;
    gl_FragColor = vec4(col, alpha);
  }
`

function InfiniteFloor() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { progress } = useScrollState()
  const concrete = useConcreteTextures()
  const uniforms = useMemo(
    () => ({
      uFade: { value: 0.4 },
      uFogNear: { value: 18 },
      uFogFar: { value: 55 },
    }),
    [],
  )
  const floorGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(160, 160)
    geo.setAttribute('uv2', geo.getAttribute('uv'))
    return geo
  }, [])

  useFrame(() => {
    if (!materialRef.current) return
    materialRef.current.uniforms.uFade.value = mapRange(progress, 0, 1, 0.35, 1)
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} geometry={floorGeometry} receiveShadow>
        <meshStandardMaterial
          map={concrete.map}
          normalMap={concrete.normalMap}
          roughnessMap={concrete.roughnessMap}
          aoMap={concrete.aoMap}
          aoMapIntensity={0.9}
          color="#e4e8ea"
          roughness={0.92}
          metalness={0.06}
          envMapIntensity={0.45}
          normalScale={CONCRETE_NORMAL}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <planeGeometry args={[160, 160]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={gridVertex}
          fragmentShader={gridFragment}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function GridWall({
  position,
  rotation,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[80, 28]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        uniforms={{
          uFogColor: { value: new THREE.Color('#05060a') },
        }}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          varying vec3 vWorldPos;
          void main() {
            vUv = uv;
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorldPos = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uFogColor;
          varying vec2 vUv;
          varying vec3 vWorldPos;

          float line(float v, float width) {
            float d = abs(fract(v - 0.5) - 0.5) / fwidth(v);
            return 1.0 - smoothstep(0.0, width, d);
          }

          void main() {
            vec2 g = vUv * vec2(24.0, 10.0);
            float major = max(line(g.x / 4.0, 1.1), line(g.y / 2.0, 1.1));
            float minor = max(line(g.x, 0.9), line(g.y, 0.9));
            float mask = minor * 0.18 + major * 0.45;
            vec3 col = vec3(0.08, 0.45, 0.55) * mask;
            float fadeY = smoothstep(0.0, 0.15, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
            float dist = length(vWorldPos.xz);
            float fog = smoothstep(20.0, 48.0, dist);
            float alpha = mask * fadeY * 0.34 * (1.0 - fog);
            gl_FragColor = vec4(mix(col, uFogColor, fog * 0.6), alpha);
          }
        `}
      />
    </mesh>
  )
}

function BayMark({ position }: { position: [number, number, number] }) {
  const { progress } = useScrollState()
  const glow = mapRange(progress, 0.35, 0.8, 0.25, 1.2)
  const w = 5.2
  const d = 4.0
  const t = 0.08

  return (
    <group position={position}>
      {/* Continuous rectangular frame - corners meet */}
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
      <mesh position={[0, 0.014, -d / 2 - 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w + 0.24, 0.035]} />
        <meshStandardMaterial
          color="#041418"
          emissive="#2ec4d6"
          emissiveIntensity={glow * 0.55}
          transparent
          opacity={0.8}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.014, d / 2 + 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w + 0.24, 0.035]} />
        <meshStandardMaterial
          color="#041418"
          emissive="#2ec4d6"
          emissiveIntensity={glow * 0.55}
          transparent
          opacity={0.8}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-w / 2 - 0.12, 0.014, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[d + 0.24, 0.035]} />
        <meshStandardMaterial
          color="#041418"
          emissive="#2ec4d6"
          emissiveIntensity={glow * 0.55}
          transparent
          opacity={0.8}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[w / 2 + 0.12, 0.014, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[d + 0.24, 0.035]} />
        <meshStandardMaterial
          color="#041418"
          emissive="#2ec4d6"
          emissiveIntensity={glow * 0.55}
          transparent
          opacity={0.8}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function PanelWalls() {
  const panels = usePanelTextures()
  const walls: { position: [number, number, number]; rotation: [number, number, number] }[] = [
    { position: [0, 7.2, -30.2], rotation: [0, 0, 0] },
    { position: [0, 7.2, 26.2], rotation: [0, Math.PI, 0] },
    { position: [-30.2, 7.2, 0], rotation: [0, Math.PI / 2, 0] },
    { position: [30.2, 7.2, 0], rotation: [0, -Math.PI / 2, 0] },
  ]

  return (
    <group>
      {walls.map((wall) => (
        <mesh key={wall.position.join(',')} position={wall.position} rotation={wall.rotation} receiveShadow>
          <planeGeometry args={[72, 16]} />
          <meshStandardMaterial
            map={panels.map}
            normalMap={panels.normalMap}
            roughnessMap={panels.roughnessMap}
            metalnessMap={panels.metalnessMap}
            color="#b7bdc2"
            metalness={0.72}
            roughness={0.58}
            envMapIntensity={0.7}
            normalScale={PANEL_NORMAL}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Concrete floor, worn metal walls, grid, bay mark. */
export function Factory() {
  return (
    <group>
      <InfiniteFloor />
      <PanelWalls />
      <GridWall position={[0, 8, -28]} rotation={[0, 0, 0]} />
      <GridWall position={[0, 8, 24]} rotation={[0, Math.PI, 0]} />
      <GridWall position={[-28, 8, 0]} rotation={[0, Math.PI / 2, 0]} />
      <GridWall position={[28, 8, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <BayMark position={[0, 0, -0.35]} />
    </group>
  )
}
