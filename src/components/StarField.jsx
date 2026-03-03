import { useEffect, useRef } from 'react'

const NUM_STARS = 220

function generateStars(w, h) {
  return Array.from({ length: NUM_STARS }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.4 + 0.3,
    baseOpacity: Math.random() * 0.5 + 0.2,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.0008 + 0.0003,
    drift: (Math.random() - 0.5) * 0.015,
  }))
}

// Shooting star — spawns offscreen top-right, streaks diagonally
function spawnShootingStar(w, h) {
  const angle = (Math.PI / 180) * (160 + Math.random() * 20) // mostly downward-left
  const speed = 6 + Math.random() * 8
  const length = 80 + Math.random() * 120
  return {
    x: Math.random() * w * 0.7 + w * 0.3,
    y: Math.random() * h * 0.4,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    length,
    opacity: 1,
    decay: 0.018 + Math.random() * 0.012,
  }
}

export default function StarField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    let stars = []
    let shooters = []
    let nextShooterIn = 120 + Math.random() * 180 // frames until next shooting star
    let nebulaAngle = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      stars = generateStars(canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)

    let t = 0
    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      t += 1
      nebulaAngle += 0.0004

      // --- Nebula color wash ---
      const nx = w * 0.5 + Math.cos(nebulaAngle) * w * 0.18
      const ny = h * 0.45 + Math.sin(nebulaAngle * 0.7) * h * 0.14

      const nebula1 = ctx.createRadialGradient(nx, ny, 0, nx, ny, w * 0.55)
      nebula1.addColorStop(0, 'rgba(55, 8, 110, 0.28)')
      nebula1.addColorStop(0.45, 'rgba(20, 10, 80, 0.14)')
      nebula1.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = nebula1
      ctx.fillRect(0, 0, w, h)

      const nx2 = w * 0.3 + Math.cos(nebulaAngle * 0.6 + 2) * w * 0.2
      const ny2 = h * 0.6 + Math.sin(nebulaAngle * 0.5 + 1) * h * 0.15
      const nebula2 = ctx.createRadialGradient(nx2, ny2, 0, nx2, ny2, w * 0.46)
      nebula2.addColorStop(0, 'rgba(0, 55, 100, 0.24)')
      nebula2.addColorStop(0.5, 'rgba(5, 30, 70, 0.12)')
      nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = nebula2
      ctx.fillRect(0, 0, w, h)

      // --- Background stars ---
      for (const s of stars) {
        const opacity = s.baseOpacity + Math.sin(t * s.speed * 60 + s.phase) * 0.18
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220, 235, 255, ${Math.max(0.05, opacity)})`
        ctx.fill()
        s.x += s.drift
        if (s.x < -2) s.x = w + 2
        if (s.x > w + 2) s.x = -2
      }

      // --- Shooting stars ---
      nextShooterIn--
      if (nextShooterIn <= 0) {
        shooters.push(spawnShootingStar(w, h))
        nextShooterIn = 200 + Math.random() * 300
      }

      shooters = shooters.filter(s => s.opacity > 0)
      for (const s of shooters) {
        const tailX = s.x - Math.cos(Math.atan2(s.vy, s.vx)) * s.length * s.opacity
        const tailY = s.y - Math.sin(Math.atan2(s.vy, s.vx)) * s.length * s.opacity

        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y)
        grad.addColorStop(0, 'rgba(200, 230, 255, 0)')
        grad.addColorStop(0.7, `rgba(200, 230, 255, ${s.opacity * 0.4})`)
        grad.addColorStop(1, `rgba(255, 255, 255, ${s.opacity})`)

        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(s.x, s.y)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.stroke()

        s.x += s.vx
        s.y += s.vy
        s.opacity -= s.decay
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 40%, #0d1630 0%, #05070f 70%)',
      }}
    />
  )
}
