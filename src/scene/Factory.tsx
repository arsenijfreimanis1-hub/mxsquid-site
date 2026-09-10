import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScrollState } from '../hooks/useScrollContext'
import { mapRange } from '../lib/scroll'

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
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vWorldPos;

  float line(float v, float width) {
    float d = abs(fract(v - 0.5) - 0.5) / fwidth(v);
    return 1.0 - smoothstep(0.0, width, d);
  }

  void main() {
    vec2 uv = vWorldPos.xz;
    float major = max(line(uv.x / 4.0, 1.2), line(uv.y / 4.0, 1.2));
    float minor = max(line(uv.x, 1.0), line(uv.y, 1.0));

    vec3 base = vec3(0.035, 0.038, 0.045);
    vec3 cyan = vec3(0.15, 0.75, 0.85);
    vec3 orange = vec3(0.91, 0.36, 0.04);

    float g = minor * 0.22 + major * 0.55;
    vec3 col = base + cyan * g * 0.55;
    col += orange * major * 0.08 * uFade;

    float dist = length(vWorldPos.xz);
    float fog = smoothstep(uFogNear, uFogFar, dist);
    col = mix(col, uFogColor, fog);

    float alpha = (0.35 + g * 0.65) * (1.0 - fog * 0.95);
    gl_FragColor = vec4(col, alpha);
  }
`

function InfiniteFloor() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { progress } = useScrollState()
  const uniforms = useMemo(
    () => ({
      uFade: { value: 0.4 },
      uFogColor: { value: new THREE.Color('#05060a') },
      uFogNear: { value: 18 },
      uFogFar: { value: 55 },
    }),
    [],
  )

  useFrame(() => {
    if (!materialRef.current) return
    materialRef.current.uniforms.uFade.value = mapRange(progress, 0, 1, 0.35, 1)
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
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
            float alpha = mask * fadeY * 0.55 * (1.0 - fog);
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

/** Infinite cyber-industrial void: grid floor, distant grid walls, bay mark. */
export function Factory() {
  return (
    <group>
      <InfiniteFloor />
      <GridWall position={[0, 8, -28]} rotation={[0, 0, 0]} />
      <GridWall position={[0, 8, 24]} rotation={[0, Math.PI, 0]} />
      <GridWall position={[-28, 8, 0]} rotation={[0, Math.PI / 2, 0]} />
      <GridWall position={[28, 8, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <BayMark position={[0, 0, -0.35]} />
    </group>
  )
}
