import { useEffect, useRef } from 'react'

type Blob = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  hue: number
}

type LavaLampProps = {
  reducedMotion?: boolean
}

const COUNT = 14

function makeBlobs(width: number, height: number): Blob[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.18,
    vy: -0.12 - Math.random() * 0.22,
    r: 70 + Math.random() * 110,
    hue: i % 3 === 0 ? 18 : i % 3 === 1 ? 186 : 210,
  }))
}

export function LavaLamp({ reducedMotion = false }: LavaLampProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let blobs = makeBlobs(1, 1)
    let frame = 0
    let running = true
    const mouse = { x: -9999, y: -9999, active: false }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      blobs = makeBlobs(width, height)
    }

    const onMove = (event: PointerEvent) => {
      mouse.x = event.clientX
      mouse.y = event.clientY
      mouse.active = true
    }

    const onLeave = () => {
      mouse.active = false
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)

    const draw = () => {
      if (!running) return
      ctx.clearRect(0, 0, width, height)

      const gradient = ctx.createLinearGradient(0, 0, width * 0.2, height)
      gradient.addColorStop(0, '#05070c')
      gradient.addColorStop(0.45, '#081018')
      gradient.addColorStop(1, '#0a0604')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      if (!reducedMotion) {
        for (const blob of blobs) {
          if (mouse.active) {
            const dx = blob.x - mouse.x
            const dy = blob.y - mouse.y
            const dist = Math.hypot(dx, dy) || 1
            const reach = blob.r + 140
            if (dist < reach) {
              const force = ((reach - dist) / reach) * 0.55
              blob.vx += (dx / dist) * force
              blob.vy += (dy / dist) * force
            }
          }

          blob.vy += -0.004 + Math.sin(blob.x * 0.01) * 0.0015
          blob.vx *= 0.985
          blob.vy *= 0.985
          blob.x += blob.vx
          blob.y += blob.vy

          if (blob.y + blob.r < -40) {
            blob.y = height + blob.r
            blob.x = Math.random() * width
            blob.vy = -0.12 - Math.random() * 0.2
          }
          if (blob.x < -blob.r) blob.x = width + blob.r
          if (blob.x > width + blob.r) blob.x = -blob.r
        }
      }

      ctx.globalCompositeOperation = 'lighter'
      for (const blob of blobs) {
        const glow = ctx.createRadialGradient(blob.x, blob.y, blob.r * 0.08, blob.x, blob.y, blob.r)
        glow.addColorStop(0, `hsla(${blob.hue}, 85%, 58%, 0.55)`)
        glow.addColorStop(0.35, `hsla(${blob.hue}, 80%, 42%, 0.28)`)
        glow.addColorStop(1, `hsla(${blob.hue}, 70%, 20%, 0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'

      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [reducedMotion])

  return <canvas ref={canvasRef} className="lava-lamp" aria-hidden="true" />
}
