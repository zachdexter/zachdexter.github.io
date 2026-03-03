import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { STARS } from './Star'

const LABELS = { about: 'ABOUT', now: 'NOW', projects: 'PROJECTS', resume: 'RESUME' }

// Position label text offset from each star corner so it reads without overlapping
const OFFSETS = {
  about:    { dx: -18, dy: -22, anchor: 'end' },
  now:      { dx:  18, dy: -22, anchor: 'start' },
  projects: { dx: -18, dy:  34, anchor: 'end' },
  resume:   { dx:  18, dy:  34, anchor: 'start' },
}

export default function StarHintLabels({ activeSection }) {
  const groupRef = useRef(null)
  const [dismissed, setDismissed] = useState(false)

  // Fade in after constellation draws, auto-dismiss after a generous read window
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        groupRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.0, delay: 2.2, ease: 'power2.out' }
      )
      gsap.to(groupRef.current, {
        opacity: 0,
        duration: 1.5,
        delay: 10,          // visible from ~3.2s to ~10s = ~7 seconds of read time
        ease: 'power2.in',
        onComplete: () => setDismissed(true),
      })
    })
    return () => ctx.revert()
  }, [])

  // Immediately dismiss if the user clicks a star
  useEffect(() => {
    if (activeSection && !dismissed && groupRef.current) {
      gsap.to(groupRef.current, {
        opacity: 0,
        duration: 0.35,
        onComplete: () => setDismissed(true),
      })
    }
  }, [activeSection, dismissed])

  if (dismissed) return null

  return (
    <g ref={groupRef} opacity={0} style={{ pointerEvents: 'none' }}>
      {/* Label + small arrow near each nav star */}
      {STARS.map(star => {
        const off = OFFSETS[star.id]
        return (
          <g key={star.id}>
            {/* Section name label */}
            <text
              x={star.cx + off.dx}
              y={star.cy + off.dy}
              textAnchor={off.anchor}
              fill="rgba(125, 211, 252, 0.85)"
              fontSize="11"
              fontFamily="'Orbitron', sans-serif"
              letterSpacing="2.5"
            >
              {LABELS[star.id]}
            </text>
            {/* Small connector tick from label toward star */}
            <line
              x1={star.cx + off.dx * 0.35}
              y1={star.cy + off.dy * 0.35}
              x2={star.cx + (off.dx > 0 ? 14 : -14)}
              y2={star.cy + (off.dy > 0 ? 14 : -14)}
              stroke="rgba(125, 211, 252, 0.35)"
              strokeWidth="0.8"
            />
          </g>
        )
      })}

      {/* Central prompt text — above the top stars (y=80), below the SVG top edge (y=-100) */}
      <text
        x="500"
        y="22"
        textAnchor="middle"
        fill="rgba(125, 211, 252, 0.5)"
        fontSize="9"
        fontFamily="'Orbitron', sans-serif"
        letterSpacing="4"
      >
        CLICK A STAR TO EXPLORE
      </text>
    </g>
  )
}
