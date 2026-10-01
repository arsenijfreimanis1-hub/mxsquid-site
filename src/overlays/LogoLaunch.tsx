import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { mapRange } from '../lib/scroll'

type LogoLaunchProps = {
  progress: number
  slotRef: RefObject<HTMLDivElement | null>
}

export function LogoLaunch({ progress, slotRef }: LogoLaunchProps) {
  const [origin, setOrigin] = useState({ x: 0, y: 0, size: 0 })
  const t = mapRange(progress, 0, 0.18, 0, 1)
  const width = typeof window === 'undefined' ? 1200 : window.innerWidth
  const launchX = -t * width * 1.15
  const spin = t * 420
  const opacity = 1 - mapRange(progress, 0.15, 0.22, 0, 1)

  useEffect(() => {
    const measure = () => {
      const slot = slotRef.current
      if (!slot) return
      const rect = slot.getBoundingClientRect()
      if (rect.width < 8) return
      setOrigin({ x: rect.left, y: rect.top, size: rect.width })
    }
    measure()
    const frame = window.requestAnimationFrame(measure)
    const observer = new ResizeObserver(measure)
    if (slotRef.current) observer.observe(slotRef.current)
    window.addEventListener('resize', measure)
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [slotRef])

  if (origin.size < 8 || opacity <= 0.01) return null

  return (
    <div
      className="logo-launch"
      aria-hidden="true"
      style={{
        left: origin.x,
        top: origin.y,
        width: origin.size,
        height: origin.size,
        opacity,
        transform: `translate3d(${launchX}px, 0, 0) rotate(${spin}deg)`,
      }}
    >
      <img className="logo-launch__mark" src="/mxsquid-logo-clear.png" alt="" />
    </div>
  )
}
