import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

export default function ConstellationLine({ x1, y1, x2, y2, delay = 0, duration = 1.2 }) {
  const lineRef = useRef(null)

  useEffect(() => {
    const line = lineRef.current
    if (!line) return
    const length = Math.hypot(x2 - x1, y2 - y1)

    gsap.set(line, { attr: { 'stroke-dasharray': length, 'stroke-dashoffset': length } })

    const anim = gsap.to(line, {
      attr: { 'stroke-dashoffset': 0 },
      duration,
      delay,
      ease: 'power2.inOut',
    })

    return () => anim.kill()
  }, [x1, y1, x2, y2, delay, duration])

  return (
    <line
      ref={lineRef}
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="rgba(120, 180, 255, 0.55)"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  )
}
