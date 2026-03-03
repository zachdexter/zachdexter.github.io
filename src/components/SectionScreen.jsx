import { useRef, useEffect } from 'react'
import About    from '../sections/About'
import Now      from '../sections/Now'
import Projects from '../sections/Projects'
import Resume   from '../sections/Resume'

const SECTION_MAP = { about: About, now: Now, projects: Projects, resume: Resume }

// Sections that render full-viewport (bypass the centered card)
const FULL_VIEWPORT = new Set(['about', 'projects', 'now'])

const RETURN_EDGE = { about: 'bottom', now: 'left', projects: 'right', resume: 'top' }

const PANEL_STYLE = {
  now: {
    background: 'linear-gradient(160deg, #0c0a14 0%, #090712 100%)',
    border: '1px solid rgba(155, 110, 230, 0.18)',
    boxShadow: '0 0 60px rgba(130, 90, 210, 0.09), 0 20px 80px rgba(0,0,0,0.86)',
  },
  resume: {
    backgroundColor: '#070b12',
    backgroundImage: [
      'linear-gradient(rgba(90,140,230,0.06) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(90,140,230,0.06) 1px, transparent 1px)',
    ].join(', '),
    backgroundSize: '28px 28px',
    border: '1px solid rgba(100, 155, 240, 0.20)',
    boxShadow: '0 0 60px rgba(80, 130, 220, 0.08), 0 20px 80px rgba(0,0,0,0.88)',
  },
}

// Small "fly here to return" indicator at the return edge
function ReturnHint({ section }) {
  const edge = RETURN_EDGE[section]
  const arrows = { top: '↑', bottom: '↓', left: '←', right: '→' }
  const pos = {
    top:    { top: '4%',    left: '50%', transform: 'translateX(-50%)' },
    bottom: { bottom: '4%', left: '50%', transform: 'translateX(-50%)' },
    left:   { left: '3%',   top: '50%',  transform: 'translateY(-50%)' },
    right:  { right: '3%',  top: '50%',  transform: 'translateY(-50%)' },
  }
  return (
    <div style={{
      position: 'fixed', zIndex: 1, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      fontFamily: 'var(--font-display)', color: 'rgba(125,211,252,0.22)',
      ...pos[edge],
    }}>
      <span style={{ fontSize: '16px' }}>{arrows[edge]}</span>
      <span style={{ fontSize: '7px', letterSpacing: '2.5px', textTransform: 'uppercase' }}>RETURN</span>
    </div>
  )
}

export default function SectionScreen({ section, onBoundsChange }) {
  const cardRef = useRef(null)

  useEffect(() => {
    // Full-viewport sections don't have a card — clear any existing bounds
    if (FULL_VIEWPORT.has(section)) {
      onBoundsChange(null)
      return
    }

    const el = cardRef.current
    if (!el) return
    const report = () => {
      const r = el.getBoundingClientRect()
      onBoundsChange({ x: r.left, y: r.top, w: r.width, h: r.height })
    }
    report()
    const ro = new ResizeObserver(report)
    ro.observe(el)
    window.addEventListener('resize', report)
    return () => { ro.disconnect(); window.removeEventListener('resize', report) }
  }, [section, onBoundsChange])

  const SectionContent = SECTION_MAP[section]

  // Full-viewport sections render their own layout — no centered card wrapper
  if (FULL_VIEWPORT.has(section)) {
    return (
      <>
        <ReturnHint section={section} />
        <SectionContent />
      </>
    )
  }

  const panelStyle = PANEL_STYLE[section] ?? {}

  return (
    <>
      <ReturnHint section={section} />

      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          width: 'min(660px, 78vw)',
          maxHeight: '76vh',
          borderRadius: '14px',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          ...panelStyle,
        }}
      >
        <div style={{ padding: '24px 28px 20px', flex: 1 }}>
          <SectionContent />
        </div>
      </div>
    </>
  )
}
