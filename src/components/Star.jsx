import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

// Narrower X span (180→820) keeps the Z taller than wide
export const STARS = [
  { id: 'about',    cx: 180,  cy: 80,  isNav: true },
  { id: 'now',      cx: 820,  cy: 80,  isNav: true },
  { id: 'projects', cx: 180,  cy: 720, isNav: true },
  { id: 'resume',   cx: 820,  cy: 720, isNav: true },
]

export const Z_PATH = ['about', 'now', 'projects', 'resume']

export function getTravelPath(fromId, toId) {
  const fromIdx = Z_PATH.indexOf(fromId)
  const toIdx   = Z_PATH.indexOf(toId)
  if (fromIdx === -1 || toIdx === -1) return [toId]
  if (fromIdx === toIdx) return [toId]
  const step = fromIdx < toIdx ? 1 : -1
  const path = []
  for (let i = fromIdx + step; i !== toIdx + step; i += step) {
    path.push(Z_PATH[i])
  }
  return path
}

export function getStarById(id) {
  return STARS.find(s => s.id === id)
}

// 4-pointed star path centered at (cx, cy)
function starPath(cx, cy, R, r) {
  return `M ${cx} ${cy - R} L ${cx + r} ${cy - r} L ${cx + R} ${cy} L ${cx + r} ${cy + r} L ${cx} ${cy + R} L ${cx - r} ${cy + r} L ${cx - R} ${cy} L ${cx - r} ${cy - r} Z`
}

export default function Star({ star, isActive, onNavigate }) {
  const glowRef   = useRef(null)
  const glintRef  = useRef(null)
  const pulseRef  = useRef(null)
  const pulseAnim = useRef(null)

  // Idle ambient glow pulse + periodic glint flash
  // All animations use attr: or opacity tweens — NO CSS scale/transform, so no wobble
  useEffect(() => {
    if (!star.isNav) return
    const ctx = gsap.context(() => {
      // Ambient halo: gently breathes opacity (stays subtle, doesn't interfere with active state)
      gsap.to(glowRef.current, {
        opacity: 0.12,
        duration: 2.4 + Math.random() * 0.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })

      // Periodic diagonal glint flash
      const glintTl = gsap.timeline({
        repeat: -1,
        repeatDelay: 2.8 + Math.random() * 3.5,
        delay: Math.random() * 3.5,
      })
      glintTl
        .fromTo(glintRef.current,
          { opacity: 0 },
          { opacity: 0.85, duration: 0.09, ease: 'power2.in' }
        )
        .to(glintRef.current, { opacity: 0, duration: 0.26, ease: 'power2.out' })
    })
    return () => ctx.revert()
  }, [star.isNav])

  // Active glow + expanding pulse ring
  useEffect(() => {
    const glow  = glowRef.current
    const pulse = pulseRef.current
    if (!glow || !pulse) return

    if (isActive) {
      if (pulseAnim.current) pulseAnim.current.kill()
      gsap.to(glow, { opacity: 1, duration: 0.4, ease: 'power2.out' })
      pulseAnim.current = gsap.fromTo(
        pulse,
        { attr: { r: 16, opacity: 0.7 } },
        { attr: { r: 44, opacity: 0 }, duration: 1.6, ease: 'power1.out', repeat: -1, repeatDelay: 0.15 }
      )
    } else {
      if (pulseAnim.current) { pulseAnim.current.kill(); pulseAnim.current = null }
      gsap.to(glow, { opacity: 0.06, duration: 0.35 })
      gsap.set(pulse, { attr: { r: 16, opacity: 0 } })
    }
    return () => { if (pulseAnim.current) pulseAnim.current.kill() }
  }, [isActive, star.isNav])

  const handleMouseEnter = () => {
    if (isActive) return
    gsap.to(glowRef.current, { opacity: 0.5, duration: 0.2, ease: 'power2.out' })
  }
  const handleMouseLeave = () => {
    if (isActive) return
    gsap.to(glowRef.current, { opacity: 0.06, duration: 0.3 })
  }

  return (
    <g
      style={{ cursor: 'pointer' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onNavigate(star.id)}
    >
      {/* Expanding pulse ring — active state only */}
      <circle
        ref={pulseRef}
        cx={star.cx} cy={star.cy} r={16}
        fill="none"
        stroke="rgba(125, 211, 252, 0.55)"
        strokeWidth="1.2"
        opacity={0}
      />

      {/* Glow halo — idle pulse at low opacity, full bright when active */}
      <circle
        ref={glowRef}
        cx={star.cx} cy={star.cy} r={26}
        fill="rgba(125, 211, 252, 0.22)"
        filter="url(#starGlow)"
        opacity={0.06}
      />

      {/* Main 4-pointed star shape — static, no transforms */}
      <path
        d={starPath(star.cx, star.cy, 11, 2.2)}
        fill="rgba(215, 238, 255, 0.94)"
      />

      {/* Diagonal glint rays — 45°-rotated, briefly flashes */}
      <path
        ref={glintRef}
        d={starPath(star.cx, star.cy, 10, 2)}
        fill="rgba(200, 230, 255, 0.85)"
        transform={`rotate(45, ${star.cx}, ${star.cy})`}
        opacity={0}
      />

      {/* Bright white center dot */}
      <circle cx={star.cx} cy={star.cy} r={3} fill="white" opacity={0.97} />
    </g>
  )
}
