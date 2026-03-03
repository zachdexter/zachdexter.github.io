import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { getStarById, Z_PATH } from './Star'
import About from '../sections/About'
import Now from '../sections/Now'
import Projects from '../sections/Projects'
import Resume from '../sections/Resume'

const SECTION_MAP    = { about: About, now: Now, projects: Projects, resume: Resume }
const SECTION_LABELS = { about: 'About', now: 'Lately', projects: 'Projects', resume: 'Resume' }

// ─── Per-section visual themes ─────────────────────────────────────────────
// Each section has its own completely different look for the outer panel chrome.
const THEMES = {
  about: {
    // Earthy / granite — warm dark tones, amber glow
    panel: {
      backgroundColor: '#100e08',
      border: '1px solid rgba(175, 138, 78, 0.24)',
      boxShadow: '0 0 80px rgba(160, 115, 50, 0.10), 0 16px 70px rgba(0,0,0,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    },
    header: {
      background: 'transparent',
      borderBottom: '1px solid rgba(175, 138, 78, 0.13)',
    },
    label: {
      color: '#c4895a',
      fontFamily: 'var(--font-display)',
      letterSpacing: '4px',
      fontSize: '11px',
      textTransform: 'uppercase',
    },
    close: { color: 'rgba(175,138,78,0.45)', hover: '#c4895a' },
    nav: {
      borderTop: '1px solid rgba(175,138,78,0.12)',
      accent: '#c4895a',
      accentDim: 'rgba(175,138,78,0.10)',
    },
    backdrop: 'rgba(4, 2, 0, 0.5)',
  },

  now: {
    // Deep journal / warm midnight — indigo-purple
    panel: {
      backgroundColor: '#09071200',
      background: 'linear-gradient(160deg, #0c0a14 0%, #090712 100%)',
      border: '1px solid rgba(155, 110, 230, 0.20)',
      boxShadow: '0 0 80px rgba(130, 90, 210, 0.09), 0 16px 70px rgba(0,0,0,0.88)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
    },
    header: {
      background: 'transparent',
      borderBottom: '1px solid rgba(155, 110, 230, 0.12)',
    },
    label: {
      color: '#a78bda',
      fontFamily: 'var(--font-display)',
      letterSpacing: '4px',
      fontSize: '12px',
      textTransform: 'uppercase',
    },
    close: { color: 'rgba(155,110,230,0.45)', hover: '#a78bda' },
    nav: {
      borderTop: '1px solid rgba(155,110,230,0.12)',
      accent: '#a78bda',
      accentDim: 'rgba(155,110,230,0.10)',
    },
    backdrop: 'rgba(2, 1, 8, 0.45)',
  },

  projects: {
    // Terminal — dark green-on-black, macOS dots, red dot = close
    panel: {
      background: '#060d06',
      border: '1px solid rgba(74, 222, 128, 0.22)',
      boxShadow: '0 0 80px rgba(74, 222, 128, 0.08), 0 16px 70px rgba(0,0,0,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    },
    header: {
      background: '#0c160c',
      borderBottom: '1px solid rgba(74, 222, 128, 0.12)',
      terminal: true,   // renders the macOS dots row; red dot IS the close button
      path: 'zachdexter@portfolio  ~/projects',
    },
    label: {
      color: 'rgba(74,222,128,0.45)',
      fontFamily: "'Courier New', Consolas, monospace",
      letterSpacing: '0.5px',
      fontSize: '11px',
    },
    close: { color: 'rgba(74,222,128,0.40)', hover: '#4ade80' },
    nav: {
      borderTop: '1px solid rgba(74,222,128,0.12)',
      accent: '#4ade80',
      accentDim: 'rgba(74,222,128,0.10)',
    },
    backdrop: 'rgba(0, 3, 0, 0.5)',
  },

  resume: {
    // Blueprint / technical drawing — dark navy with grid lines
    panel: {
      backgroundColor: '#070b12',
      backgroundImage: [
        'linear-gradient(rgba(90,140,230,0.04) 1px, transparent 1px)',
        'linear-gradient(90deg, rgba(90,140,230,0.04) 1px, transparent 1px)',
      ].join(', '),
      backgroundSize: '26px 26px',
      border: '1px solid rgba(100, 155, 240, 0.22)',
      boxShadow: '0 0 80px rgba(80, 130, 220, 0.09), 0 16px 70px rgba(0,0,0,0.90)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    },
    header: {
      background: 'transparent',
      borderBottom: '1px solid rgba(100,155,240,0.12)',
    },
    label: {
      color: 'rgba(130,185,255,0.75)',
      fontFamily: 'var(--font-display)',
      letterSpacing: '4px',
      fontSize: '12px',
      textTransform: 'uppercase',
    },
    close: { color: 'rgba(100,155,240,0.40)', hover: 'rgba(130,185,255,0.9)' },
    nav: {
      borderTop: '1px solid rgba(100,155,240,0.12)',
      accent: 'rgba(130,185,255,0.85)',
      accentDim: 'rgba(100,155,240,0.08)',
    },
    backdrop: 'rgba(0, 2, 8, 0.48)',
  },
}

// Compute the closest 8-direction arrow for travel from one star to another
function directionArrow(fromId, toId) {
  const from = getStarById(fromId)
  const to   = getStarById(toId)
  if (!from || !to) return '→'
  const angle = Math.round(Math.atan2(to.cy - from.cy, to.cx - from.cx) * (180 / Math.PI) / 45) * 45
  const map = { '-180': '←', '-135': '↖', '-90': '↑', '-45': '↗', 0: '→', 45: '↘', 90: '↓', 135: '↙', 180: '←' }
  return map[angle] ?? '→'
}

function PanelNav({ currentSection, onNavigate, theme }) {
  const idx    = Z_PATH.indexOf(currentSection)
  const prevId = idx > 0 ? Z_PATH[idx - 1] : null
  const nextId = idx < Z_PATH.length - 1 ? Z_PATH[idx + 1] : null
  if (!prevId && !nextId) return null

  const btnBase = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
    fontSize: '10px',
    letterSpacing: '1.8px',
    color: 'var(--text-muted)',
    padding: '8px 12px',
    borderRadius: '5px',
    transition: 'color 0.18s, background 0.18s',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  }

  const accent    = theme?.nav?.accent    ?? 'var(--accent)'
  const accentDim = theme?.nav?.accentDim ?? 'var(--accent-dim)'

  return (
    <div style={{ ...theme?.nav, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      {prevId ? (
        <button
          style={btnBase}
          onClick={() => onNavigate(prevId)}
          onMouseEnter={e => { e.currentTarget.style.color = accent; e.currentTarget.style.background = accentDim }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: '14px', lineHeight: 1 }}>{directionArrow(currentSection, prevId)}</span>
          {SECTION_LABELS[prevId]}
        </button>
      ) : <span />}

      {nextId ? (
        <button
          style={{ ...btnBase, flexDirection: 'row-reverse' }}
          onClick={() => onNavigate(nextId)}
          onMouseEnter={e => { e.currentTarget.style.color = accent; e.currentTarget.style.background = accentDim }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: '14px', lineHeight: 1 }}>{directionArrow(currentSection, nextId)}</span>
          {SECTION_LABELS[nextId]}
        </button>
      ) : <span />}
    </div>
  )
}

export default function ContentPanel({ activeSection, svgRef, onClose, onNavigate }) {
  const panelRef                            = useRef(null)
  const [mounted, setMounted]               = useState(false)
  const [currentSection, setCurrentSection] = useState(null)

  useEffect(() => {
    const panel = panelRef.current

    if (activeSection && activeSection !== currentSection) {
      if (mounted && panel) {
        gsap.to(panel, {
          xPercent: -50, yPercent: -50,
          opacity: 0, y: -8,
          duration: 0.18, ease: 'power2.in',
          onComplete: () => setCurrentSection(activeSection),
        })
      } else {
        setCurrentSection(activeSection)
        setMounted(true)
      }
    } else if (!activeSection && mounted) {
      if (panel) {
        gsap.to(panel, {
          xPercent: -50, yPercent: -50,
          scale: 0.93, opacity: 0,
          duration: 0.22, ease: 'power2.in',
          onComplete: () => { setMounted(false); setCurrentSection(null) },
        })
      } else {
        setMounted(false)
        setCurrentSection(null)
      }
    }
  }, [activeSection]) // eslint-disable-line

  useEffect(() => {
    if (mounted && currentSection && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { xPercent: -50, yPercent: -50, scale: 0.9, opacity: 0, y: 10 },
        { xPercent: -50, yPercent: -50, scale: 1,   opacity: 1, y: 0, duration: 0.38, ease: 'back.out(1.25)', delay: 0.04 }
      )
    }
  }, [mounted, currentSection])

  if (!mounted || !currentSection) return null

  const SectionComponent = SECTION_MAP[currentSection]
  if (!SectionComponent) return null

  const theme = THEMES[currentSection] ?? THEMES.resume
  const isTerminal = !!theme.header.terminal

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9, background: theme.backdrop ?? 'rgba(2,4,12,0.38)' }}
        onClick={onClose}
      />

      {/* Panel shell — no CSS transform; GSAP owns xPercent/yPercent */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          zIndex: 10,
          width: 'min(720px, 94vw)',
          maxHeight: '88vh',
          borderRadius: '14px',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          ...theme.panel,
        }}
      >
        {/* ── Terminal header (Projects) ── */}
        {isTerminal ? (
          <div style={{
            ...theme.header,
            padding: '9px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            flexShrink: 0,
          }}>
            {/* Red dot = close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: '11px', height: '11px', borderRadius: '50%',
                background: '#ef4444', border: 'none', cursor: 'pointer',
                padding: 0, flexShrink: 0,
              }}
            />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#eab308', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ marginLeft: 'auto', marginRight: 'auto', ...theme.label }}>
              {theme.header.path}
            </span>
          </div>
        ) : (
          /* ── Standard header (all other sections) ── */
          <div style={{
            ...theme.header,
            padding: '22px 28px 14px',
            flexShrink: 0,
            position: 'relative',
          }}>
            <span style={{ ...theme.label }}>
              {SECTION_LABELS[currentSection] ?? currentSection}
            </span>
            <button
              onClick={onClose}
              aria-label="Close panel"
              style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: theme.close.color,
                fontSize: '20px',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '2px 6px',
                borderRadius: '4px',
                transition: 'color 0.18s',
              }}
              onMouseEnter={e => (e.target.style.color = theme.close.hover)}
              onMouseLeave={e => (e.target.style.color = theme.close.color)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Section content */}
        <div style={{ padding: isTerminal ? '14px 18px 16px' : '22px 28px 18px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <SectionComponent />
        </div>

        {/* Navigation arrows */}
        <PanelNav currentSection={currentSection} onNavigate={onNavigate} theme={theme} />
      </div>
    </>
  )
}
