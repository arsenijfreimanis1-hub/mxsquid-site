import { createContext, useContext } from 'react'
import type { RoutePath } from './useRoute'

export type ScrollState = {
  progress: number
  reducedMotion: boolean
  scrollToProgress: (t: number) => void
  path: RoutePath
  navigate: (to: RoutePath) => void
}

const noop = () => undefined

export const ScrollContext = createContext<ScrollState>({
  progress: 0,
  reducedMotion: false,
  scrollToProgress: noop,
  path: '/',
  navigate: noop,
})

export function useScrollState(): ScrollState {
  return useContext(ScrollContext)
}
