import { useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { CHAPTER_SNAPS, nearestSnapIndex } from '../lib/scroll'

function scrollMax() {
  return document.documentElement.scrollHeight - window.innerHeight
}

const SNAP_DURATION = 0.72
const SNAP_LOCK_MS = 420

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches),
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px), (pointer: coarse)')
    const update = () => setMobile(media.matches || window.innerWidth < 768)
    update()
    media.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      media.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return mobile
}

export function useLenisScroll(reducedMotion: boolean, enabled = true, isMobile = false) {
  const [progress, setProgress] = useState(0)
  const lenisRef = useRef<Lenis | null>(null)
  const indexRef = useRef(0)
  const lockingRef = useRef(false)
  const progressRef = useRef(0)

  const publish = (value: number) => {
    const next = Math.min(1, Math.max(0, value))
    if (Math.abs(next - progressRef.current) < 0.0004) return
    progressRef.current = next
    setProgress(next)
    indexRef.current = nearestSnapIndex(next)
  }

  const scrollToProgress = useCallback(
    (t: number) => {
      if (!enabled) return
      const clamped = Math.min(1, Math.max(0, t))
      indexRef.current = nearestSnapIndex(clamped)
      const snap = CHAPTER_SNAPS[indexRef.current]
      const max = scrollMax()
      const y = snap * Math.max(0, max)

      if (reducedMotion || !lenisRef.current) {
        window.scrollTo({ top: y, behavior: 'smooth' })
        return
      }

      lockingRef.current = true
      lenisRef.current.scrollTo(y, {
        duration: isMobile ? 0.62 : SNAP_DURATION,
        easing: easeOutCubic,
      })
      window.setTimeout(() => {
        lockingRef.current = false
      }, isMobile ? 380 : SNAP_LOCK_MS)
    },
    [reducedMotion, enabled, isMobile],
  )

  const stepSnap = useCallback(
    (direction: 1 | -1) => {
      if (!enabled || lockingRef.current) return
      const next = Math.min(CHAPTER_SNAPS.length - 1, Math.max(0, indexRef.current + direction))
      if (next === indexRef.current) return
      indexRef.current = next
      scrollToProgress(CHAPTER_SNAPS[next])
    },
    [enabled, scrollToProgress],
  )

  useEffect(() => {
    if (!enabled) {
      lenisRef.current = null
      setProgress(0)
      progressRef.current = 0
      indexRef.current = 0
      return
    }

    if (reducedMotion) {
      lenisRef.current = null
      const onScroll = () => {
        const max = scrollMax()
        publish(max > 0 ? window.scrollY / max : 0)
      }
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
    }

    const lenis = new Lenis({
      duration: isMobile ? 0.72 : 0.58,
      easing: easeOutCubic,
      smoothWheel: true,
      syncTouch: true,
      touchMultiplier: isMobile ? 1.12 : 1,
      wheelMultiplier: isMobile ? 0.88 : 0.82,
    })
    lenisRef.current = lenis

    lenis.on('scroll', () => {
      const max = scrollMax()
      publish(max > 0 ? lenis.scroll / max : 0)
    })

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault()
        stepSnap(1)
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault()
        stepSnap(-1)
      } else if (event.key === 'Home') {
        event.preventDefault()
        scrollToProgress(0)
      } else if (event.key === 'End') {
        event.preventDefault()
        scrollToProgress(1)
      }
    }

    window.addEventListener('keydown', onKey)

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [reducedMotion, enabled, isMobile, stepSnap, scrollToProgress])

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
