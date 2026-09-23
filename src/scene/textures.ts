import { useMemo, useRef } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

/** CC0 maps from Poly Haven (polyhaven.com), tiled in the scene. */

function prep(texture: THREE.Texture, rx: number, ry: number, srgb: boolean) {
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(rx, ry)
  texture.anisotropy = 8
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
}

function useOnce(setup: () => void) {
  const done = useRef(false)
  if (!done.current) {
    setup()
    done.current = true
  }
}

export function useConcreteTextures() {
  const maps = useTexture({
    map: '/textures/concrete/diff.jpg',
    normalMap: '/textures/concrete/nor.jpg',
    roughnessMap: '/textures/concrete/rough.jpg',
    aoMap: '/textures/concrete/ao.jpg',
  })

  useOnce(() => {
    prep(maps.map, 24, 24, true)
    prep(maps.normalMap, 24, 24, false)
    prep(maps.roughnessMap, 24, 24, false)
    prep(maps.aoMap, 24, 24, false)
  })

  return maps
}

export function useSteelTextures() {
  const maps = useTexture({
    map: '/textures/steel/diff.jpg',
    normalMap: '/textures/steel/nor.jpg',
    roughnessMap: '/textures/steel/rough.jpg',
    metalnessMap: '/textures/steel/metal.jpg',
  })

  useOnce(() => {
    prep(maps.map, 1.4, 3.2, true)
    prep(maps.normalMap, 1.4, 3.2, false)
    prep(maps.roughnessMap, 1.4, 3.2, false)
    prep(maps.metalnessMap, 1.4, 3.2, false)
  })

  return maps
}

export function usePanelTextures() {
  const maps = useTexture({
    map: '/textures/panels/diff.jpg',
    normalMap: '/textures/panels/nor.jpg',
    roughnessMap: '/textures/panels/rough.jpg',
    metalnessMap: '/textures/panels/metal.jpg',
  })

  useOnce(() => {
    prep(maps.map, 2.5, 1.6, true)
    prep(maps.normalMap, 2.5, 1.6, false)
    prep(maps.roughnessMap, 2.5, 1.6, false)
    prep(maps.metalnessMap, 2.5, 1.6, false)
  })

  return maps
}

/** The source weave is nearly black. Stretch it so the twill blocks stay dark but readable. */
function liftCarbonMap(texture: THREE.Texture) {
  const image = texture.image as CanvasImageSource | undefined
  if (!image) return texture
  const width = 'width' in image ? Number(image.width) : 0
  const height = 'height' in image ? Number(image.height) : 0
  if (!width || !height) return texture

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return texture
  ctx.drawImage(image, 0, 0)
  const data = ctx.getImageData(0, 0, width, height)
  const px = data.data
  for (let i = 0; i < px.length; i += 4) {
    const lifted = 0.16 + Math.pow(px[i] / 255, 0.5) * 0.7
    const value = Math.round(Math.min(1, lifted) * 255)
    px[i] = value
    px[i + 1] = value
    px[i + 2] = value
  }
  ctx.putImageData(data, 0, 0)

  const liftedMap = new THREE.CanvasTexture(canvas)
  liftedMap.wrapS = THREE.RepeatWrapping
  liftedMap.wrapT = THREE.RepeatWrapping
  liftedMap.anisotropy = 8
  liftedMap.colorSpace = THREE.SRGBColorSpace
  liftedMap.needsUpdate = true
  return liftedMap
}

/** Tileable twill from the three.js examples (github.com/mrdoob/three.js). */
export function useCarbonTextures() {
  const source = useTexture({
    map: '/textures/carbon/diff.png',
    normalMap: '/textures/carbon/nor.png',
  })
  const map = useMemo(() => {
    const lifted = liftCarbonMap(source.map)
    prep(lifted, 2.4, 1.8, true)
    return lifted
  }, [source.map])

  useOnce(() => {
    prep(source.normalMap, 2.4, 1.8, false)
  })

  return { map, normalMap: source.normalMap }
}

export function useClothTextures() {
  const maps = useTexture({
    normalMap: '/textures/cloth/nor.jpg',
    roughnessMap: '/textures/cloth/rough.jpg',
  })

  useOnce(() => {
    prep(maps.normalMap, 1, 1, false)
    prep(maps.roughnessMap, 1, 1, false)
  })

  return maps
}
