import { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import Star, { STARS, getStarById, getTravelPath } from './Star'
import ConstellationLine from './ConstellationLine'
import BackgroundConstellations from './BackgroundConstellations'
import StarHintLabels from './StarHintLabels'
import ContentPanel from './ContentPanel'

// Logical space: x -120→1120, y -100→900 (total 1240×1000 with padding)
// Z stars: TL(180,80), TR(820,80), BL(180,720), BR(820,720)
const VB_FULL = '-120 -100 1240 1000'

// Draw the 3 Z lines sequentially at constant pen speed (500 SVG units/sec).
// Each line overlaps the previous by 0.07s to eliminate the perceptible gap at junctions
// (power2.inOut eases both ends to near-zero, so exact sequential timing looks like a pause).
// Line 1: (180,80)→(820,80)  length=640  → duration=1.28s, delay=0.50, ends ~1.78
// Line 2: (820,80)→(180,720) length=905  → duration=1.81s, delay=1.71, ends ~3.52
// Line 3: (180,720)→(820,720) length=640 → duration=1.28s, delay=3.45, ends ~4.73
const LINES = [
  { x1: 180, y1: 80,  x2: 820, y2: 80,  delay: 0.50, duration: 1.28 },
  { x1: 820, y1: 80,  x2: 180, y2: 720, delay: 1.71, duration: 1.81 },
  { x1: 180, y1: 720, x2: 820, y2: 720, delay: 3.45, duration: 1.28 },
]

// Pulse travel durations scale with line length at 380 SVG units/sec
// Line 1: 640/380 = 1.68s, Line 2: 905/380 = 2.38s, Line 3: 640/380 = 1.68s
const PULSE_TRAVELS = [1.68, 2.38, 1.68]
const PULSE_FADE = 0.28

function focusedViewBox(cx, cy) {
  const w = 1040
  const h = 700
  return `${cx - w / 2} ${cy - h / 2 - 50} ${w} ${h}`
}

function waypointViewBox(cx, cy) {
  const w = 1140
  const h = 760
  return `${cx - w / 2} ${cy - h / 2} ${w} ${h}`
}

const Constellation = forwardRef(function Constellation(
  { activeSection, onNavigate, onClosePanel, onPanelNavigate },
  ref
) {
  const svgRef          = useRef(null)
  const parallaxRef     = useRef(null)
  const prevSectionRef  = useRef(null)
  const suppressResetRef = useRef(false)  // set before panel-nav to skip the zoom-out
  const pulse1Ref   = useRef(null)
  const pulse2Ref   = useRef(null)
  const pulse3Ref   = useRef(null)

  // Camera travel animation along the Z path
  const travel = useCallback((targetId, onComplete) => {
    const svg = svgRef.current
    if (!svg) { onComplete?.(); return }

    const fromId = prevSectionRef.current
    const path = fromId ? getTravelPath(fromId, targetId) : [targetId]
    prevSectionRef.current = targetId

    const tl = gsap.timeline({ onComplete })

    if (path.length === 1) {
      const star = getStarById(targetId)
      tl.to(svg, {
        attr: { viewBox: focusedViewBox(star.cx, star.cy) },
        duration: 0.65,
        ease: 'power3.inOut',
      })
    } else {
      const waypoints   = path.slice(0, -1)
      const destination = path[path.length - 1]

      waypoints.forEach((id, i) => {
        const star = getStarById(id)
        tl.to(svg, {
          attr: { viewBox: waypointViewBox(star.cx, star.cy) },
          duration: 0.25,
          ease: i === 0 ? 'power2.in' : 'power1.inOut',
        })
      })

      const destStar = getStarById(destination)
      tl.to(svg, {
        attr: { viewBox: focusedViewBox(destStar.cx, destStar.cy) },
        duration: 0.45,
        ease: 'power2.out',
      })
    }
  }, [])

  useImperativeHandle(ref, () => ({
    travel,
    suppressReset: () => { suppressResetRef.current = true },
  }), [travel])

  // Pan back to full view when panel closes (skipped during panel-nav so camera flows directly star→star)
  useEffect(() => {
    if (!activeSection) {
      if (suppressResetRef.current) {
        // Panel-nav: keep prevSectionRef so travel() computes the correct path
        suppressResetRef.current = false
        return
      }
      prevSectionRef.current = null
      gsap.to(svgRef.current, {
        attr: { viewBox: VB_FULL },
        duration: 0.7,
        ease: 'power2.inOut',
      })
    }
  }, [activeSection])

  // Fade the whole constellation in on mount
  useEffect(() => {
    const anim = gsap.fromTo(
      svgRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.4, ease: 'power2.out' }
    )
    return () => anim.kill()
  }, [])

  // Mouse parallax — subtle depth shift opposite cursor direction
  useEffect(() => {
    const MAX_SHIFT = 12
    const handleMouseMove = (e) => {
      if (!parallaxRef.current) return
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const dx = ((e.clientX - cx) / cx) * -MAX_SHIFT
      const dy = ((e.clientY - cy) / cy) * -MAX_SHIFT
      gsap.to(parallaxRef.current, { x: dx, y: dy, duration: 1.2, ease: 'power2.out' })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Sequential Z-trace pulse: a dot travels each line in order, then repeats infrequently
  useEffect(() => {
    const pulses = [pulse1Ref.current, pulse2Ref.current, pulse3Ref.current]
    if (pulses.some(p => !p)) return

    // Park all pulses at their start points, invisible
    LINES.forEach((l, i) => gsap.set(pulses[i], { attr: { cx: l.x1, cy: l.y1 }, opacity: 0 }))

    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 14,           // run infrequently
      delay: 5.3,                // wait for draw-in to finish (~4.73s) + small buffer
    })

    LINES.forEach((l, i) => {
      const travel = PULSE_TRAVELS[i]
      // Fade in
      tl.to(pulses[i], { opacity: 0.88, duration: PULSE_FADE, ease: 'power2.out' })
      // Travel to endpoint (starts simultaneously with fade-in)
      tl.to(pulses[i], { attr: { cx: l.x2, cy: l.y2 }, duration: travel, ease: 'sine.inOut' }, '<')
      // Fade out just before arrival
      tl.to(pulses[i], { opacity: 0, duration: PULSE_FADE, ease: 'power2.in' }, `>-${PULSE_FADE}`)
      // Reset to start for next loop
      tl.set(pulses[i], { attr: { cx: l.x1, cy: l.y1 } })
    })

    return () => tl.kill()
  }, [])

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={VB_FULL}
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="starGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="lineGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background constellations — outside parallax group for depth layering */}
        <BackgroundConstellations />

        {/* Parallax group */}
        <g ref={parallaxRef}>
          {/* Z constellation lines — drawn sequentially */}
          <g filter="url(#lineGlow)">
            {LINES.map((l, i) => (
              <ConstellationLine key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} delay={l.delay} duration={l.duration} />
            ))}
          </g>

          {/* Pulse dots — one per line, orchestrated sequentially in the useEffect above */}
          <g filter="url(#starGlow)">
            <circle ref={pulse1Ref} cx={180} cy={80}  r="2.2" fill="rgba(180, 225, 255, 0.9)" opacity={0} />
            <circle ref={pulse2Ref} cx={820} cy={80}  r="2.2" fill="rgba(180, 225, 255, 0.9)" opacity={0} />
            <circle ref={pulse3Ref} cx={180} cy={720} r="2.2" fill="rgba(180, 225, 255, 0.9)" opacity={0} />
          </g>

          {/* Nav stars */}
          {STARS.map(star => (
            <Star
              key={star.id}
              star={star}
              isActive={activeSection === star.id}
              onNavigate={onNavigate}
            />
          ))}

          {/* First-load hint labels */}
          <StarHintLabels activeSection={activeSection} />
        </g>
      </svg>

      <ContentPanel
        activeSection={activeSection}
        svgRef={svgRef}
        onClose={onClosePanel}
        onNavigate={onPanelNavigate ?? onNavigate}
      />
    </>
  )
})

export default Constellation
