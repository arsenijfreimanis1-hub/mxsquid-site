import { useRef } from 'react'
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
