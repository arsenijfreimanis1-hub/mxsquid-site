import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ContactShadows } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useScrollState } from '../hooks/useScrollContext'
import { mapRange } from '../lib/scroll'
import { useClothTextures, useSteelTextures } from './textures'

const STEEL_NORMAL = new THREE.Vector2(0.22, 0.22)

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

    float windPhase = uTime * 0.85 - position.x * 0.72 + position.z * 0.32;
    float wave = sin(windPhase) * 0.016 + sin(windPhase * 0.62 + position.z * 0.9) * 0.008;
    float flutter = sin(uTime * 1.35 + position.y * 2.4) * 0.003;

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
  uniform sampler2D uNormalMap;
  uniform sampler2D uRoughMap;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;

    vec2 uv = vUv * vec2(4.0, 2.6);
    vec3 mapN = texture2D(uNormalMap, uv).xyz * 2.0 - 1.0;
    mapN.xy *= 1.45;
    float rough = texture2D(uRoughMap, uv).r;

    vec3 dp1 = dFdx(vWorldPos);
    vec3 dp2 = dFdy(vWorldPos);
    vec2 duv1 = dFdx(vUv);
    vec2 duv2 = dFdy(vUv);
    vec3 t = dp1 * duv2.y - dp2 * duv1.y;
    vec3 b = dp2 * duv1.x - dp1 * duv2.x;
    float handed = sign(dot(n, cross(t, b)));
    t = normalize(t);
    b = normalize(b) * handed;
    n = normalize(mat3(t, b, n) * mapN);

    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(vec3(0.55, 0.85, 0.25));
    vec3 L2 = normalize(vec3(-0.45, 0.35, 0.55));
    vec3 H = normalize(L + V);

    float diff = pow(dot(n, L) * 0.5 + 0.5, 1.35);
    float fill = pow(dot(n, L2) * 0.5 + 0.5, 1.55);
    float rim = pow(1.0 - max(dot(n, V), 0.0), 2.4);
    float sheen = pow(1.0 - max(dot(n, V), 0.0), 4.2);
    float spec = pow(max(dot(n, H), 0.0), mix(42.0, 12.0, rough));
    float key = mix(0.72, 1.12, clamp(uKey, 0.0, 1.0));

    vec3 col = vec3(0.028, 0.029, 0.032);
    col += vec3(0.085, 0.088, 0.095) * diff * key;
    col += vec3(0.032, 0.036, 0.04) * fill;
    col += vec3(0.13, 0.135, 0.15) * rim * 0.26 * key;
    col += vec3(0.07, 0.065, 0.06) * sheen * 0.2;
    col += vec3(0.15, 0.15, 0.16) * spec * (1.0 - rough) * 0.4 * key;
    col *= mix(0.78, 1.14, rough);
    col *= mix(0.74, 1.0, smoothstep(0.0, 1.2, vWorldPos.y));

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

function Scaffolding({ material }: { material: THREE.Material }) {
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

  return (
    <group>
      {poles.map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, poleH * 0.5, z]} material={material} castShadow>
            <cylinderGeometry args={[0.055, 0.06, poleH, 24]} />
          </mesh>
          <mesh position={[x, poleH + 0.03, z]} material={material} castShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.06, 20]} />
          </mesh>
          <mesh position={[x, 0.04, z]} material={material} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 0.08, 20]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, h + 0.04, -hz]} material={material} castShadow>
        <boxGeometry args={[hx * 2 + 0.06, 0.06, 0.06]} />
      </mesh>
      <mesh position={[0, h + 0.04, hz]} material={material} castShadow>
        <boxGeometry args={[hx * 2 + 0.06, 0.06, 0.06]} />
      </mesh>
      <mesh position={[-hx, h + 0.04, 0]} material={material} castShadow>
        <boxGeometry args={[0.06, 0.06, hz * 2 + 0.06]} />
      </mesh>
      <mesh position={[hx, h + 0.04, 0]} material={material} castShadow>
        <boxGeometry args={[0.06, 0.06, hz * 2 + 0.06]} />
      </mesh>
      <mesh position={[0, h * 0.52, -hz]} material={material} castShadow>
        <boxGeometry args={[hx * 2, 0.04, 0.04]} />
      </mesh>
      <mesh position={[0, h * 0.52, hz]} material={material} castShadow>
        <boxGeometry args={[hx * 2, 0.04, 0.04]} />
      </mesh>
      <mesh position={[-hx, h * 0.52, 0]} material={material} castShadow>
        <boxGeometry args={[0.04, 0.04, hz * 2]} />
      </mesh>
      <mesh position={[hx, h * 0.52, 0]} material={material} castShadow>
        <boxGeometry args={[0.04, 0.04, hz * 2]} />
      </mesh>
    </group>
  )
}

function ClothBay() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const geometry = useMemo(() => createClothGeometry(), [])
  const cloth = useClothTextures()
  const { progress } = useScrollState()
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWind: { value: 0.7 },
      uKey: { value: 0.5 },
      uNormalMap: { value: cloth.normalMap },
      uRoughMap: { value: cloth.roughnessMap },
    }),
    [cloth.normalMap, cloth.roughnessMap],
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

function FloorFan({ reducedMotion, material }: { reducedMotion: boolean; material: THREE.Material }) {
  const bladesRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!bladesRef.current || reducedMotion) return
    bladesRef.current.rotation.z -= delta * 8
  })

  return (
    <group position={[3.9, 0, 0.25]} rotation={[0, -0.55, 0]}>
      <mesh position={[0, 0.45, 0]} material={material} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.9, 24]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} material={material} castShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.05, 32]} />
      </mesh>
      <mesh position={[0, 1.05, 0]} material={material} castShadow>
        <sphereGeometry args={[0.16, 24, 16]} />
      </mesh>
      <mesh position={[0, 1.05, 0.12]} material={material} castShadow>
        <torusGeometry args={[0.38, 0.018, 12, 40]} />
      </mesh>
      <group ref={bladesRef} position={[0, 1.05, 0.12]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} material={material} castShadow>
            <boxGeometry args={[0.72, 0.1, 0.012]} />
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

function useSteelMaterial() {
  const maps = useSteelTextures()
  return useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: maps.map,
      normalMap: maps.normalMap,
      roughnessMap: maps.roughnessMap,
      metalnessMap: maps.metalnessMap,
      color: '#d7dee3',
      metalness: 1,
      roughness: 0.42,
      normalScale: STEEL_NORMAL,
      envMapIntensity: 1.05,
      anisotropy: 0.5,
      anisotropyRotation: Math.PI / 2,
    })
  }, [maps.map, maps.normalMap, maps.roughnessMap, maps.metalnessMap])
}

export function CloakedSimulator() {
  const { reducedMotion } = useScrollState()
  const groupRef = useRef<THREE.Group>(null)
  const steel = useSteelMaterial()

  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion) return
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.006
  })

  return (
    <group ref={groupRef} position={[0, 0, -0.35]} rotation={[0, -0.08, 0]}>
      <Scaffolding material={steel} />
      <BlackoutVolume />
      <ClothBay />
      <FloorFan reducedMotion={reducedMotion} material={steel} />
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
