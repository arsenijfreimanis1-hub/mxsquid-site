import { useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

function scrollMax() {
  return document.documentElement.scrollHeight - window.innerHeight
}

export function useLenisScroll(reducedMotion: boolean, enabled = true) {
  const [progress, setProgress] = useState(0)
  const lenisRef = useRef<Lenis | null>(null)

  const scrollToProgress = useCallback(
    (t: number) => {
      if (!enabled) return
      const max = scrollMax()
      const y = Math.min(1, Math.max(0, t)) * Math.max(0, max)
      if (reducedMotion || !lenisRef.current) {
        window.scrollTo({ top: y, behavior: 'smooth' })
        return
      }
      lenisRef.current.scrollTo(y, { duration: 1.65, easing: (x) => 1 - Math.pow(1 - x, 3) })
    },
    [reducedMotion, enabled],
  )

  useEffect(() => {
    if (!enabled) {
      lenisRef.current = null
      setProgress(0)
      return
    }

    if (reducedMotion) {
      lenisRef.current = null
      const onScroll = () => {
        const max = scrollMax()
        setProgress(max > 0 ? window.scrollY / max : 0)
      }
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
    }

    const lenis = new Lenis({
      duration: 1.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.15,
      syncTouch: true,
    })
    lenisRef.current = lenis

    let target = 0
    let current = 0

    lenis.on('scroll', () => {
      const max = scrollMax()
      target = max > 0 ? lenis.scroll / max : 0
    })

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      current += (target - current) * 0.08
      setProgress(current)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [reducedMotion, enabled])

  return { progress, scrollToProgress }
}

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reducedMotion
}
