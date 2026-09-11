import { useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { CHAPTER_SNAPS, nearestSnapIndex } from '../lib/scroll'

function scrollMax() {
  return document.documentElement.scrollHeight - window.innerHeight
}

const SNAP_DURATION = 1.05
const SNAP_LOCK_MS = 980

export function useLenisScroll(reducedMotion: boolean, enabled = true) {
  const [progress, setProgress] = useState(0)
  const lenisRef = useRef<Lenis | null>(null)
  const indexRef = useRef(0)
  const lockingRef = useRef(false)
  const touchYRef = useRef<number | null>(null)
  const progressRef = useRef(0)

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
        duration: SNAP_DURATION,
        easing: (x) => 1 - Math.pow(1 - x, 3),
      })
      window.setTimeout(() => {
        lockingRef.current = false
      }, SNAP_LOCK_MS)
    },
    [reducedMotion, enabled],
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
        const value = max > 0 ? window.scrollY / max : 0
        progressRef.current = value
        setProgress(value)
        indexRef.current = nearestSnapIndex(value)
      }
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
    }

    const lenis = new Lenis({
      duration: SNAP_DURATION,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: false,
      syncTouch: false,
      touchMultiplier: 0,
      wheelMultiplier: 0,
    })
    lenisRef.current = lenis

    let target = 0
    let current = 0

    lenis.on('scroll', () => {
      const max = scrollMax()
      target = max > 0 ? lenis.scroll / max : 0
    })

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (Math.abs(event.deltaY) < 6) return
      stepSnap(event.deltaY > 0 ? 1 : -1)
    }

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

    const onTouchStart = (event: TouchEvent) => {
      touchYRef.current = event.touches[0]?.clientY ?? null
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (touchYRef.current === null) return
      const endY = event.changedTouches[0]?.clientY
      if (endY === undefined) return
      const delta = touchYRef.current - endY
      touchYRef.current = null
      if (Math.abs(delta) < 42) return
      stepSnap(delta > 0 ? 1 : -1)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      // Snappier follow so chapter text and camera settle together.
      current += (target - current) * 0.16
      progressRef.current = current
      setProgress(current)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [reducedMotion, enabled, stepSnap, scrollToProgress])

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
