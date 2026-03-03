// Now — 5 themed planets with proximity-reveal panels
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { shipPosition, nowIconBounds, nowIconHitHandler } from '../store'
import { LATELY_DATA } from '../data/lately'

const PROXIMITY = 150

const PLANETS = [
  { id: 'music',  x: 22, y: 28, w: 130, h: 130, panelW: 240, floatDur: 6, floatDelay: 0   },
  { id: 'book',   x: 68, y: 18, w: 82,  h: 112, panelW: 220, floatDur: 8, floatDelay: 1.5 },
  { id: 'tv',     x: 78, y: 62, w: 110, h: 110, panelW: 230, floatDur: 7, floatDelay: 0.8 },
  { id: 'photos', x: 32, y: 72, w: 85,  h: 85,  panelW: 220, floatDur: 9, floatDelay: 2.5 },
  { id: 'game',   x: 54, y: 48, w: 100, h: 100, panelW: 220, floatDur: 5, floatDelay: 3   },
]

// ─── Panel content ────────────────────────────────────────────────────────────

function MusicPanel() {
  const d = LATELY_DATA.cassette
  return <>
    <div className="now-panel__header">NOW LISTENING</div>
    <div className="now-panel__title">{d.track}</div>
    <div className="now-panel__sub">{d.artist}</div>
    <div className="now-panel__detail">{d.album}</div>
    <div className="now-panel__footer">[ SPOTIFY SYNC PENDING ]</div>
  </>
}

function BookPanel() {
  const d = LATELY_DATA.book
  return <>
    <div className="now-panel__header">CURRENTLY READING</div>
    <div className="now-panel__title">{d.title}</div>
    <div className="now-panel__sub">{d.author}</div>
    <div className="now-panel__progress">
      <div className="now-panel__progress-fill" style={{ width: '35%' }} />
    </div>
  </>
}

function TVPanel() {
  const d = LATELY_DATA.tv
  return <>
    <div className="now-panel__header">NOW WATCHING</div>
    <div className="now-panel__title">{d.title}</div>
    <div className="now-panel__sub">{d.type}</div>
    <div className="now-panel__detail">{d.status}</div>
  </>
}

function PhotosPanel() {
  return <>
    <div className="now-panel__header">LATEST CAPTURES</div>
    <div className="now-panel__sub" style={{ marginTop: 8 }}>Film roll loading...</div>
  </>
}

function GamePanel() {
  const d = LATELY_DATA.game
  return <>
    <div className="now-panel__header">&gt; CURRENTLY PLAYING:</div>
    <div className="now-panel__title">{d.title}</div>
    <div className="now-panel__sub">PLATFORM: {d.platform}</div>
    <div className="now-panel__status">STATUS: IN PROGRESS</div>
  </>
}

const PANEL_COMPS = {
  music:  MusicPanel,
  book:   BookPanel,
  tv:     TVPanel,
  photos: PhotosPanel,
  game:   GamePanel,
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Now() {
  const planetRefs = useRef([])
  const panelRefs  = useRef([])
  const rafRef     = useRef(null)
  const readyAt    = useRef(0)

  useEffect(() => {
    let lastActiveIdx = -1
    readyAt.current = Date.now() + 600

    const tick = () => {
      if (Date.now() < readyAt.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const W   = window.innerWidth
      const H   = window.innerHeight
      const ship = shipPosition.current

      // Write planet bounds to store for Spaceship laser collision
      nowIconBounds.current = PLANETS.map(p => ({
        id: p.id,
        cx: W * p.x / 100,
        cy: H * p.y / 100,
        r:  Math.max(p.w, p.h) / 2,
      }))

      // Find closest planet within proximity
      let newActiveIdx = -1
      let minDist = Infinity
      PLANETS.forEach((p, i) => {
        const dist = Math.hypot(ship.x - W * p.x / 100, ship.y - H * p.y / 100)
        if (dist < PROXIMITY && dist < minDist) {
          minDist = dist
          newActiveIdx = i
        }
      })

      if (newActiveIdx !== lastActiveIdx) {
        // Hide previous panel
        if (lastActiveIdx >= 0) {
          const old = panelRefs.current[lastActiveIdx]
          if (old) { old.style.opacity = '0'; old.style.pointerEvents = 'none' }
        }
        // Show new panel
        if (newActiveIdx >= 0) {
          const panel  = panelRefs.current[newActiveIdx]
          const planet = PLANETS[newActiveIdx]
          if (panel) {
            const cx = W * planet.x / 100
            const cy = H * planet.y / 100
            const panelH = 150
            let px = cx + planet.w / 2 + 18
            if (px + planet.panelW > W - 12) px = cx - planet.w / 2 - planet.panelW - 18
            let py = cy - panelH / 2
            py = Math.max(12, Math.min(H - panelH - 12, py))
            panel.style.left = px + 'px'
            panel.style.top  = py + 'px'
            panel.style.opacity = '1'
            panel.style.pointerEvents = 'none'
          }
        }
        lastActiveIdx = newActiveIdx
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    // Hit handler — flash planet on laser hit
    nowIconHitHandler.current = (id) => {
      const idx = PLANETS.findIndex(p => p.id === id)
      if (idx < 0) return
      const el = planetRefs.current[idx]
      if (!el) return
      el.classList.add('planet--hit')
      setTimeout(() => el.classList.remove('planet--hit'), 350)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      nowIconBounds.current = []
      nowIconHitHandler.current = null
    }
  }, [])

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none' }}>

      {/* Page label */}
      <div style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '3px',
        color: 'var(--text-muted)', textTransform: 'uppercase',
        pointerEvents: 'none', userSelect: 'none', zIndex: 8,
      }}>
        LATELY
      </div>

      {/* Planets */}
      {PLANETS.map((planet, i) => (
        <div
          key={planet.id}
          style={{
            position: 'absolute',
            left: `${planet.x}%`,
            top: `${planet.y}%`,
            transform: 'translate(-50%, -50%)',
            width: planet.w,
            height: planet.h,
          }}
        >
          {/* Separate float wrapper to avoid clobbering the centering transform */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            animation: `planet-float ${planet.floatDur}s ease-in-out ${planet.floatDelay}s infinite`,
          }}>
            <div
              ref={el => { planetRefs.current[i] = el }}
              className={`planet-body planet--${planet.id}`}
              style={{ width: '100%', height: '100%' }}
            >
              {planet.id === 'music' && (
                <div className="planet-rings">
                  <div className="planet-ring planet-ring--1" />
                  <div className="planet-ring planet-ring--2" />
                  <div className="planet-ring planet-ring--3" />
                </div>
              )}
              {planet.id === 'book' && (
                <div className="typo-chars" aria-hidden="true">
                  <span className="typo-char" style={{ top: '13%', left: '14%', fontSize: '14px', '--rot': '15deg'  }}>A</span>
                  <span className="typo-char" style={{ top: '20%', left: '60%', fontSize:  '9px', '--rot': '-20deg' }}>§</span>
                  <span className="typo-char" style={{ top: '45%', left: '16%', fontSize: '13px', '--rot':   '8deg' }}>&amp;</span>
                  <span className="typo-char" style={{ top: '58%', left: '63%', fontSize:  '8px', '--rot': '-15deg' }}>¶</span>
                  <span className="typo-char" style={{ top: '36%', left: '68%', fontSize: '11px', '--rot':  '22deg' }}>Ω</span>
                  <span className="typo-char" style={{ top: '72%', left: '28%', fontSize: '10px', '--rot':  '-8deg' }}>@</span>
                  <span className="typo-char" style={{ top: '15%', left: '80%', fontSize:  '7px', '--rot':  '35deg' }}>»</span>
                </div>
              )}
              {planet.id === 'game' && (
                <div className="dpad">
                  <div className="dpad-h" />
                  <div className="dpad-v" />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Proximity panels */}
      {PLANETS.map((planet, i) => {
        const PanelComp = PANEL_COMPS[planet.id]
        return (
          <div
            key={`panel-${planet.id}`}
            ref={el => { panelRefs.current[i] = el }}
            className={`now-panel now-panel--${planet.id}`}
            style={{
              position: 'fixed',
              left: 0, top: 0,
              width: planet.panelW,
              opacity: 0,
              pointerEvents: 'none',
              transition: 'opacity 0.3s ease',
              zIndex: 7,
            }}
          >
            <PanelComp />
          </div>
        )
      })}

    </div>,
    document.body
  )
}
