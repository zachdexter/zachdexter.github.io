// Now — 5 themed planets with proximity-reveal panels
import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { shipPosition, nowIconBounds, nowIconHitHandler, activeSection, shipControlDisabled } from '../store'
import { LATELY_DATA } from '../data/lately'
import { useLastfmNowPlaying } from '../hooks/useLastfmNowPlaying'

const PROXIMITY = 150

const PLANETS = [
  { id: 'music',  x: 22, y: 28, w: 130, h: 130, panelW: 240, panelH: 220, floatDur: 6, floatDelay: 0   },
  { id: 'book',   x: 68, y: 18, w: 82,  h: 82,  panelW: 220, panelH: 230, floatDur: 8, floatDelay: 1.5 },
  { id: 'tv',     x: 78, y: 62, w: 110, h: 110, panelW: 230, panelH: 200, floatDur: 7, floatDelay: 0.8 },
  { id: 'photos', x: 32, y: 72, w: 105, h: 105, panelW: 280, panelH: 320, floatDur: 9, floatDelay: 2.5 },
  { id: 'game',   x: 54, y: 48, w: 100, h: 100, panelW: 240, panelH: 220, floatDur: 5, floatDelay: 3   },
]

// ─── Shared image slot ────────────────────────────────────────────────────────

function ImageSlot({ src, alt, width, height }) {
  if (src) {
    return (
      <div className="now-panel__image" style={{ width, height }}>
        <img src={src} alt={alt || ''} />
      </div>
    )
  }
  return (
    <div className="now-panel__image now-panel__image--placeholder" style={{ width, height }}>
      ?
    </div>
  )
}

// ─── Panel content ────────────────────────────────────────────────────────────

function MusicPanel({ nowPlaying }) {
  if (!nowPlaying) {
    return <>
      <div className="now-panel__header">NOW LISTENING</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '8px', letterSpacing: '2px',
        color: 'var(--text-muted)', textTransform: 'uppercase',
        textAlign: 'center', padding: '20px 8px',
      }}>
        [ NOTHING PLAYING ]
      </div>
    </>
  }

  return <>
    <div className="now-panel__header">{nowPlaying.isRecent ? 'LAST PLAYED' : 'NOW LISTENING'}</div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <ImageSlot src={nowPlaying.imageUrl} alt="album cover" width={64} height={64} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="now-panel__title">{nowPlaying.track}</div>
        <div className="now-panel__sub">{nowPlaying.artist}</div>
        <div className="now-panel__detail">{nowPlaying.album}</div>
      </div>
    </div>
    <div style={{
      fontFamily: 'var(--font-display)', fontSize: '7px', letterSpacing: '2px',
      color: nowPlaying.isRecent ? 'var(--text-muted)' : nowPlaying.isPlaying ? '#1db954' : 'var(--text-muted)',
      textTransform: 'uppercase', marginTop: 8,
    }}>
      {nowPlaying.isRecent ? '⏮ LAST PLAYED' : nowPlaying.isPlaying ? '▶ PLAYING' : '⏸ PAUSED'}
    </div>
  </>
}

function BookPanel() {
  const d = LATELY_DATA.book
  return <>
    <div className="now-panel__header">CURRENTLY READING</div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <ImageSlot src={d.image} alt="book cover" width={52} height={70} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="now-panel__title">{d.title}</div>
        <div className="now-panel__sub">{d.author}</div>
        {/* <div className="now-panel__progress">
          <div className="now-panel__progress-fill" style={{ width: `${d.progress ?? 0}%` }} />
        </div> */}
      </div>
    </div>
    {d.description && <div className="now-panel__desc">{d.description}</div>}
  </>
}

function TVPanel() {
  const d = LATELY_DATA.tv
  return <>
    <div className="now-panel__header">NOW WATCHING</div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <ImageSlot src={d.image} alt="show poster" width={52} height={70} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="now-panel__title">{d.title}</div>
        <div className="now-panel__sub">{d.type}</div>
        <div className="now-panel__detail">{d.status}</div>
      </div>
    </div>
    {d.description && <div className="now-panel__desc">{d.description}</div>}
  </>
}

function PhotoLightbox({ photos, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx)

  // Find indices that actually have a src
  const realIndices = photos.map((p, i) => p.src ? i : null).filter(i => i !== null)
  const posInReal   = realIndices.indexOf(idx)
  const hasPrev     = posInReal > 0
  const hasNext     = posInReal < realIndices.length - 1

  const prev = useCallback(() => {
    if (hasPrev) setIdx(realIndices[posInReal - 1])
  }, [hasPrev, posInReal, realIndices])

  const next = useCallback(() => {
    if (hasNext) setIdx(realIndices[posInReal + 1])
  }, [hasNext, posInReal, realIndices])

  // Keyboard: Esc / Space → close, ArrowLeft/Right → navigate
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Escape' || e.code === 'Space') {
        e.preventDefault()
        onClose()
      } else if (e.code === 'ArrowLeft')  { e.preventDefault(); prev() }
      else if (e.code === 'ArrowRight') { e.preventDefault(); next() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  const photo = photos[idx]

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        background: 'rgba(4, 8, 18, 0.82)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.18s ease',
      }}
    >
      {/* Card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          background: 'rgba(8, 14, 28, 0.97)',
          border: '1px solid rgba(125, 211, 252, 0.30)',
          borderRadius: '10px',
          boxShadow: '0 0 50px rgba(125,211,252,0.10), 0 20px 60px rgba(0,0,0,0.75)',
          padding: '20px',
          maxWidth: 'min(520px, 88vw)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 10, right: 12,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: '16px',
            color: 'rgba(125,211,252,0.60)', lineHeight: 1,
            padding: '4px 6px',
          }}
          aria-label="Close"
        >×</button>

        {/* Counter + date row — paddingRight keeps text clear of the × button */}
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          justifyContent: 'space-between', alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
          gap: window.innerWidth < 768 ? '4px' : 0,
          width: '100%', paddingRight: '28px',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '7px',
            letterSpacing: '3px', color: 'rgba(125,211,252,0.40)',
            textTransform: 'uppercase',
          }}>
            PHOTO {posInReal + 1} / {realIndices.length}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {photo.date && (
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '7px',
                letterSpacing: '2px', color: 'rgba(255,220,160,0.55)',
                textTransform: 'uppercase',
              }}>{photo.date}</div>
            )}
            {photo.location && (
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '7px',
                letterSpacing: '2px', color: 'rgba(160,220,255,0.55)',
                textTransform: 'uppercase',
              }}>◎ {photo.location}</div>
            )}
          </div>
        </div>

        {/* Image + nav arrows row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          {/* Prev arrow */}
          <button
            onClick={prev}
            disabled={!hasPrev}
            style={{
              background: 'none', border: 'none', cursor: hasPrev ? 'pointer' : 'default',
              fontFamily: 'var(--font-display)', fontSize: '20px',
              color: hasPrev ? 'rgba(125,211,252,0.75)' : 'rgba(125,211,252,0.18)',
              padding: '4px 8px', flexShrink: 0, lineHeight: 1,
              transition: 'color 0.2s',
            }}
            aria-label="Previous photo"
          >←</button>

          {/* Enlarged image */}
          <div style={{ flex: 1, borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(125,211,252,0.15)' }}>
            <img
              src={photo.src}
              alt={photo.caption}
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '60vh', objectFit: 'contain' }}
            />
          </div>

          {/* Next arrow */}
          <button
            onClick={next}
            disabled={!hasNext}
            style={{
              background: 'none', border: 'none', cursor: hasNext ? 'pointer' : 'default',
              fontFamily: 'var(--font-display)', fontSize: '20px',
              color: hasNext ? 'rgba(125,211,252,0.75)' : 'rgba(125,211,252,0.18)',
              padding: '4px 8px', flexShrink: 0, lineHeight: 1,
              transition: 'color 0.2s',
            }}
            aria-label="Next photo"
          >→</button>
        </div>

        {/* Caption */}
        {photo.caption && (
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '9px',
            letterSpacing: '2.5px', color: 'rgba(125,211,252,0.70)',
            textTransform: 'uppercase', textAlign: 'center',
          }}>
            {photo.caption}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

function PhotosPanel() {
  const photos = LATELY_DATA.photos
  const [lightboxIdx, setLightboxIdx] = useState(null)

  const openLightbox = useCallback((i) => {
    setLightboxIdx(i)
    shipControlDisabled.current = true
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxIdx(null)
    shipControlDisabled.current = false
  }, [])

  return <>
    <div className="now-panel__header">WHERE I&apos;VE BEEN</div>
    <div className="now-panel__photo-grid">
      {photos.map((p, i) => (
        <div
          key={i}
          className="now-panel__photo-slot"
          onClick={() => p.src && openLightbox(i)}
          style={{ cursor: p.src ? 'pointer' : 'default', position: 'relative' }}
        >
          {p.src
            ? <div style={{ position: 'relative' }}>
                <img src={p.src} alt={p.caption} style={{ display: 'block', width: '100%' }} />
                {/* Enlarge hint badge */}
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  fontFamily: 'var(--font-display)', fontSize: '7px',
                  letterSpacing: '1.5px', color: 'rgba(125,211,252,0.70)',
                  background: 'rgba(4,8,18,0.72)', borderRadius: '3px',
                  padding: '2px 5px', pointerEvents: 'none',
                  textTransform: 'uppercase',
                }}>⤢ VIEW</div>
              </div>
            : <div className="now-panel__image--placeholder" style={{ height: 72 }} />
          }
          <div className="now-panel__photo-caption">{p.caption}</div>
        </div>
      ))}
    </div>

    {lightboxIdx !== null && (
      <PhotoLightbox
        photos={photos}
        startIdx={lightboxIdx}
        onClose={closeLightbox}
      />
    )}
  </>
}

function GamePanel() {
  const d = LATELY_DATA.game
  return <>
    <div className="now-panel__header">&gt; CURRENTLY PLAYING:</div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <ImageSlot src={d.image} alt="game cover" width={64} height={64} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="now-panel__title">{d.title}</div>
        <div className="now-panel__sub">PLATFORM: {d.platform}</div>
        {/* <div className="now-panel__status">STATUS: {d.status.toUpperCase()}</div> */}
      </div>
    </div>
    {d.description && <div className="now-panel__desc">{d.description}</div>}
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

export default function Now({ isActive }) {
  const { nowPlaying } = useLastfmNowPlaying()
  const planetRefs  = useRef([])
  const panelRefs   = useRef([])
  const rafRef      = useRef(null)
  const readyAt     = useRef(0)
  const lensIrisRef = useRef(null)
  const lockedIdxRef = useRef(-1)

  const positionPanel = useCallback((idx) => {
    const W = window.innerWidth
    const H = window.innerHeight
    const isMobile = W < 768
    PLANETS.forEach((p, i) => {
      const panel = panelRefs.current[i]
      if (!panel) return
      if (i === idx) {
        if (isMobile) {
          const panelW = Math.min(p.panelW, W - 32)
          const panelH = Math.min(p.panelH, H - 80)
          panel.style.width     = panelW + 'px'
          panel.style.maxHeight = panelH + 'px'
          panel.style.overflowY = 'auto'
          panel.style.left      = ((W - panelW) / 2) + 'px'
          panel.style.top       = Math.max(60, (H - panelH) / 2) + 'px'
          panel.style.zIndex    = '100'
        } else {
          const cx = W * p.x / 100
          const cy = H * p.y / 100
          let px = cx + p.w / 2 + 18
          if (px + p.panelW > W - 12) px = cx - p.w / 2 - p.panelW - 18
          let py = cy - p.panelH / 2
          py = Math.max(12, Math.min(H - p.panelH - 12, py))
          panel.style.left = px + 'px'
          panel.style.top  = py + 'px'
        }
        panel.style.opacity = '1'
        panel.style.pointerEvents = 'auto'
      } else {
        panel.style.opacity = '0'
        panel.style.pointerEvents = 'none'
      }
    })
  }, [])

  const handlePlanetClick = useCallback((i) => {
    const newLocked = lockedIdxRef.current === i ? -1 : i
    lockedIdxRef.current = newLocked
    if (newLocked >= 0) {
      positionPanel(newLocked)
    } else {
      PLANETS.forEach((_, pi) => {
        const panel = panelRefs.current[pi]
        if (panel) { panel.style.opacity = '0'; panel.style.pointerEvents = 'none' }
      })
    }
  }, [positionPanel])

  // Reset readyAt when section becomes active so proximity doesn't fire immediately
  useEffect(() => {
    if (isActive) readyAt.current = Date.now() + 400
  }, [isActive])

  // Clear lock when section becomes inactive
  useEffect(() => {
    if (!isActive) {
      lockedIdxRef.current = -1
      PLANETS.forEach((_, i) => {
        const panel = panelRefs.current[i]
        if (panel) { panel.style.opacity = '0'; panel.style.pointerEvents = 'none' }
      })
    }
  }, [isActive])

  useEffect(() => {
    let lastActiveIdx = -1
    readyAt.current = Date.now() + 600

    const tick = () => {
      // Gate: only run when this section is active
      if (activeSection.current !== 'now') {
        nowIconBounds.current = []
        rafRef.current = requestAnimationFrame(tick)
        return
      }

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

      // Find closest planet within proximity (or use locked idx)
      let newActiveIdx = -1
      if (lockedIdxRef.current >= 0) {
        newActiveIdx = lockedIdxRef.current
      } else {
        let minDist = Infinity
        PLANETS.forEach((p, i) => {
          const dist = Math.hypot(ship.x - W * p.x / 100, ship.y - H * p.y / 100)
          if (dist < PROXIMITY && dist < minDist) {
            minDist = dist
            newActiveIdx = i
          }
        })
      }

      if (newActiveIdx !== lastActiveIdx) {
        // Hide previous panel
        if (lastActiveIdx >= 0) {
          const old = panelRefs.current[lastActiveIdx]
          if (old) { old.style.opacity = '0'; old.style.pointerEvents = 'none' }
        }
        // Show new panel via positionPanel (handles mobile centering)
        if (newActiveIdx >= 0) {
          positionPanel(newActiveIdx)
        }
        lastActiveIdx = newActiveIdx
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    // Hit handler
    nowIconHitHandler.current = (id) => {
      const idx = PLANETS.findIndex(p => p.id === id)
      if (idx < 0) return

      if (id === 'photos') {
        const iris = lensIrisRef.current
        if (!iris) return
        iris.classList.remove('shutter--fire')
        void iris.offsetWidth
        iris.classList.add('shutter--fire')
        setTimeout(() => iris.classList.remove('shutter--fire'), 500)
      } else {
        const el = planetRefs.current[idx]
        if (!el) return
        el.classList.add('planet--hit')
        setTimeout(() => el.classList.remove('planet--hit'), 350)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      nowIconBounds.current = []
      nowIconHitHandler.current = null
    }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>

      {/* Page label */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
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
          onClick={() => handlePlanetClick(i)}
          style={{
            position: 'absolute',
            left: `${planet.x}%`,
            top: `${planet.y}%`,
            transform: 'translate(-50%, -50%)',
            width: planet.w,
            height: planet.h,
            pointerEvents: 'auto',
            cursor: 'pointer',
            zIndex: 6,
          }}
        >
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
              {planet.id === 'game' && (
                <div className="dpad">
                  <div className="dpad-h" />
                  <div className="dpad-v" />
                </div>
              )}
              {planet.id === 'book' && (
                <div className="planet-surface">
                  <div className="book-crater" />
                  <div className="book-crater" />
                  <div className="book-crater" />
                  <div className="book-crater" />
                  <div className="book-crater" />
                </div>
              )}
              {planet.id === 'photos' && (
                <svg className="lens-svg" viewBox="0 0 105 105" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <clipPath id="lensBarrel">
                      <circle cx="52.5" cy="52.5" r="37" />
                    </clipPath>
                    <radialGradient id="lensOuter" cx="40%" cy="36%" r="60%">
                      <stop offset="0%"   stopColor="#7a7c82" />
                      <stop offset="25%"  stopColor="#565860" />
                      <stop offset="60%"  stopColor="#363840" />
                      <stop offset="85%"  stopColor="#404248" />
                      <stop offset="100%" stopColor="#1a1c1e" />
                    </radialGradient>
                    <radialGradient id="lensBarrelRing" cx="50%" cy="50%" r="50%">
                      <stop offset="0%"   stopColor="#1a1c20" />
                      <stop offset="100%" stopColor="#252830" />
                    </radialGradient>
                    <radialGradient id="lensIrisBg" cx="50%" cy="50%" r="50%">
                      <stop offset="0%"   stopColor="#030408" />
                      <stop offset="100%" stopColor="#07080e" />
                    </radialGradient>
                    <radialGradient id="lensPupil" cx="38%" cy="36%" r="65%">
                      <stop offset="0%"   stopColor="#020308" />
                      <stop offset="100%" stopColor="#04050c" />
                    </radialGradient>
                    <linearGradient id="lb0" x1="15%" y1="0%" x2="85%" y2="100%">
                      <stop offset="0%"   stopColor="#111218" />
                      <stop offset="50%"  stopColor="#1e1f2a" />
                      <stop offset="100%" stopColor="#131418" />
                    </linearGradient>
                    <linearGradient id="lb1" x1="0%" y1="15%" x2="100%" y2="85%">
                      <stop offset="0%"   stopColor="#10111a" />
                      <stop offset="50%"  stopColor="#1c1d28" />
                      <stop offset="100%" stopColor="#12131c" />
                    </linearGradient>
                    <linearGradient id="lb2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%"   stopColor="#0f1018" />
                      <stop offset="50%"  stopColor="#191a24" />
                      <stop offset="100%" stopColor="#111218" />
                    </linearGradient>
                    <linearGradient id="lb3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%"   stopColor="#0f1214" />
                      <stop offset="50%"  stopColor="#1a1e20" />
                      <stop offset="100%" stopColor="#111416" />
                    </linearGradient>
                    <linearGradient id="lb4" x1="20%" y1="0%" x2="80%" y2="100%">
                      <stop offset="0%"   stopColor="#0e1214" />
                      <stop offset="50%"  stopColor="#191e20" />
                      <stop offset="100%" stopColor="#101416" />
                    </linearGradient>
                    <linearGradient id="lb5" x1="0%" y1="10%" x2="100%" y2="90%">
                      <stop offset="0%"   stopColor="#101214" />
                      <stop offset="50%"  stopColor="#1c2022" />
                      <stop offset="100%" stopColor="#121416" />
                    </linearGradient>
                    <linearGradient id="lb6" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%"   stopColor="#111218" />
                      <stop offset="50%"  stopColor="#1e1f28" />
                      <stop offset="100%" stopColor="#131418" />
                    </linearGradient>
                  </defs>
                  <circle cx="52.5" cy="52.5" r="51.5" fill="url(#lensOuter)" />
                  <circle cx="52.5" cy="52.5" r="41" fill="url(#lensBarrelRing)" />
                  <circle cx="52.5" cy="52.5" r="37" fill="url(#lensIrisBg)" />
                  <g className="lens-iris" ref={lensIrisRef} clipPath="url(#lensBarrel)">
                    {[0,1,2,3,4,5,6].map(i => (
                      <ellipse
                        key={i}
                        cx="52.5"
                        cy="35"
                        rx="22"
                        ry="34"
                        fill={`url(#lb${i})`}
                        transform={`rotate(${(i * 51.4286).toFixed(2)} 52.5 52.5)`}
                      />
                    ))}
                  </g>
                  <circle cx="52.5" cy="52.5" r="12" fill="url(#lensPupil)" />
                  <ellipse
                    cx="39" cy="34"
                    rx="11" ry="6"
                    fill="rgba(255,255,255,0.11)"
                    transform="rotate(-28 39 34)"
                  />
                </svg>
              )}
            </div>
            {planet.id === 'book' && <>
              <span className="book-moon book-moon--1">
                <svg viewBox="0 0 20 24" width="18" height="18">
                  <rect x="1" y="1" width="3" height="22" rx="1" fill="#7f1d1d"/>
                  <rect x="3" y="1" width="15" height="22" rx="1" fill="#b91c1c"/>
                  <rect x="3.5" y="1" width="14.5" height="22" rx="0.5" fill="#dc2626"/>
                  <rect x="3" y="1.5" width="1.5" height="21" fill="#fef9c3"/>
                  <rect x="6" y="5.5" width="10" height="1.5" rx="0.5" fill="rgba(255,255,255,0.45)"/>
                  <rect x="6" y="8.5" width="7" height="1" rx="0.5" fill="rgba(255,255,255,0.3)"/>
                  <rect x="6" y="11" width="9" height="1" rx="0.5" fill="rgba(255,255,255,0.3)"/>
                  <rect x="1.5" y="3" width="1" height="6" rx="0.5" fill="rgba(255,255,255,0.2)"/>
                </svg>
              </span>
              <span className="book-moon book-moon--2">
                <svg viewBox="0 0 24 20" width="18" height="18">
                  <path d="M12 3 Q7 2 2 3 L2 18 Q7 17 12 18 Z" fill="#1e3a8a"/>
                  <path d="M12 3 Q17 2 22 3 L22 18 Q17 17 12 18 Z" fill="#2563eb"/>
                  <line x1="12" y1="3" x2="12" y2="18" stroke="#1e40af" strokeWidth="1"/>
                  <line x1="4" y1="7"  x2="10" y2="7"  stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
                  <line x1="4" y1="10" x2="10" y2="10" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                  <line x1="4" y1="13" x2="10" y2="13" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                  <line x1="14" y1="7"  x2="20" y2="7"  stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
                  <line x1="14" y1="10" x2="20" y2="10" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                  <line x1="14" y1="13" x2="20" y2="13" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                </svg>
              </span>
              <span className="book-moon book-moon--3">
                <svg viewBox="0 0 20 26" width="18" height="18">
                  <rect x="1" y="1" width="18" height="24" rx="1.5" fill="#92400e"/>
                  <rect x="3" y="1" width="16" height="24" rx="1" fill="#d97706"/>
                  <rect x="4" y="2.5" width="13" height="21" rx="0.5" fill="none" stroke="rgba(255,220,80,0.55)" strokeWidth="0.8"/>
                  <line x1="6" y1="8"  x2="15" y2="8"  stroke="rgba(255,220,80,0.5)" strokeWidth="0.8"/>
                  <line x1="6" y1="13" x2="15" y2="13" stroke="rgba(255,220,80,0.5)" strokeWidth="0.8"/>
                  <line x1="6" y1="18" x2="15" y2="18" stroke="rgba(255,220,80,0.5)" strokeWidth="0.8"/>
                  <rect x="1" y="1" width="3" height="24" rx="1.5" fill="#78350f"/>
                  <rect x="1.5" y="3" width="0.8" height="7" rx="0.4" fill="rgba(255,255,255,0.2)"/>
                </svg>
              </span>
            </>}
          </div>
        </div>
      ))}

      {/* Proximity panels */}
      {PLANETS.map((planet, i) => {
        const PanelComp = PANEL_COMPS[planet.id]
        const extraProps = planet.id === 'music'
          ? { nowPlaying }
          : {}
        return (
          <div
            key={`panel-${planet.id}`}
            ref={el => { panelRefs.current[i] = el }}
            className={`now-panel now-panel--${planet.id}`}
            style={{
              position: 'absolute',
              left: 0, top: 0,
              width: planet.panelW,
              opacity: 0,
              pointerEvents: 'none',
              transition: 'opacity 0.3s ease',
              zIndex: 7,
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); handlePlanetClick(i) }}
              style={{
                position: 'absolute', top: 8, right: 10,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: '18px',
                color: 'rgba(125,211,252,0.60)', lineHeight: 1,
                padding: '4px 6px', zIndex: 1,
              }}
              aria-label="Close"
            >×</button>
            <PanelComp {...extraProps} />
          </div>
        )
      })}

    </div>
  )
}
