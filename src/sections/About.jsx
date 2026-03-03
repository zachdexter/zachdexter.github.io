import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { polaroidBounds, polaroidHitHandler, shipControlDisabled, monitorBounds } from '../store'

// ── EDIT PHOTO DATES HERE ──────────────────────────────────────────
const PHOTO_DATE_OVERRIDES = {
  'meLuge.png': 'Summer 2023',
  'meGeorgeBondiCliff.png': 'Jan 2024',
}
// ──────────────────────────────────────────────────────────────────

const PHOTO_POOL = [
  '/assets/about/gwccOutdoorSmallGroupPic2.jpg',
  '/assets/about/gwccOutdoorTopDownShot.jpg',
  '/assets/about/meBenOutdoor.JPG',
  '/assets/about/gwccOutdoorSmallGroupPic.JPG',
  '/assets/about/gwccGroupHikingWithCrashpads.jpg',
  '/assets/about/meBenOutdoor2.JPG',
  '/assets/about/meLayingOnCrashpadOutdoor.JPG',
  '/assets/about/meOutdoorActionShot2.JPG',
  '/assets/about/meOutdoorActionShot3.JPG',
  '/assets/about/meOutdoorActionShot4.JPG',
  '/assets/about/meOutdoorMushroomHat.JPG',
  '/assets/about/meOutdoorActionShot1.JPG',
  '/assets/about/meClimbingIndoors.jpeg',
  '/assets/about/gwccGroupPictureOutside.jpeg',
  '/assets/about/meHiking.JPEG',
  '/assets/about/meDrivingNZ.jpg',
  '/assets/about/meNZBridge.jpg',
  '/assets/about/meGeorgeNZPier.jpg',
  '/assets/about/meLuge.png',
  '/assets/about/meGeorgeBondiCliff.png',
  '/assets/about/meOutdoorActionshot5.jpg',
  '/assets/about/MeBenOutdoor3.jpg',
]

const SLOT_COUNT = 7

// CRT monitor content — typed out character by character on entry
const CONTENT_LINES = [
  { type: 'text', value: '> DEXTER, ZACHARY' },
  { type: 'text', value: "  GWU CS '27" },
  { type: 'blank' },
  { type: 'text', value: '  CS student at George Washington University.' },
  { type: 'text', value: '  I build things that feel good to use — software,' },
  { type: 'text', value: '  games, and whatever gets me outside. Mostly' },
  { type: 'text', value: "  you'll find me climbing, hiking, or chasing" },
  { type: 'text', value: '  the next adventure.' },
  { type: 'blank' },
  { type: 'text', value: '> CONNECTIONS:' },
  { type: 'link', label: '  github.com/zachdexter',          href: 'https://github.com/zachdexter' },
  { type: 'link', label: '  linkedin.com/in/zachary-dexter', href: 'https://www.linkedin.com/in/zachary-dexter/' },
  { type: 'link', label: '  open.spotify.com/zachdexter',    href: 'https://open.spotify.com/user/obu6xa01d9uil79bnsezpr7b2' },
  { type: 'link', label: '  instagram.com/zsdexter',         href: 'https://www.instagram.com/zsdexter/' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const POLAROID_W = 176
const POLAROID_H = 210
const REGION_MARGIN = 16
const REGION_GAP    = 20

function getApproxMonitorBounds() {
  const vw = window.innerWidth, vh = window.innerHeight
  const mw = 460, mh = 418
  return { x: (vw - mw) / 2, y: vh * 0.42 - mh / 2, w: mw, h: mh }
}

function getRegionBounds(region, mb) {
  const vw = window.innerWidth, vh = window.innerHeight
  const M = REGION_MARGIN, G = REGION_GAP, pw = POLAROID_W, ph = POLAROID_H
  if (region === 'left') {
    return { xMin: M, xMax: mb.x - G - pw, yMin: M, yMax: vh - M - ph }
  }
  if (region === 'right') {
    return { xMin: mb.x + mb.w + G, xMax: vw - M - pw, yMin: M, yMax: vh - M - ph }
  }
  // bottom
  return { xMin: M, xMax: vw - M - pw, yMin: mb.y + mb.h + G, yMax: vh - M - ph }
}

function findNonOverlappingBase(region, mb, existingParams) {
  const vw = window.innerWidth, vh = window.innerHeight
  let bounds = getRegionBounds(region, mb)
  if (bounds.xMax - bounds.xMin <= 0 || bounds.yMax - bounds.yMin <= 0) {
    region = 'bottom'
    bounds = getRegionBounds('bottom', mb)
  }
  const rw = Math.max(1, bounds.xMax - bounds.xMin)
  const rh = Math.max(1, bounds.yMax - bounds.yMin)
  const bufX = POLAROID_W + 24, bufY = POLAROID_H + 24

  let bestCandidate = null
  let bestMinDist = -1

  for (let attempt = 0; attempt < 30; attempt++) {
    const cx = bounds.xMin + Math.random() * rw
    const cy = bounds.yMin + Math.random() * rh
    let minDist = Infinity
    let overlaps = false
    for (const ep of existingParams) {
      const dx = Math.abs(cx - ep.baseX)
      const dy = Math.abs(cy - ep.baseY)
      if (dx < bufX && dy < bufY) { overlaps = true }
      minDist = Math.min(minDist, Math.sqrt(dx * dx + dy * dy))
    }
    if (!overlaps) {
      // Build params with this position
      return {
        region,
        baseX: Math.max(REGION_MARGIN, Math.min(vw - POLAROID_W - REGION_MARGIN, cx)),
        baseY: Math.max(REGION_MARGIN, Math.min(vh - POLAROID_H - REGION_MARGIN, cy)),
        ampX:  Math.min(28, rw / 4) * (0.5 + Math.random() * 0.5),
        ampY:  Math.min(22, rh / 4) * (0.5 + Math.random() * 0.5),
        freqX: 0.00018 + Math.random() * 0.00012,
        freqY: 0.00014 + Math.random() * 0.00010,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        rotation: -7 + Math.random() * 14,
      }
    }
    if (minDist > bestMinDist) {
      bestMinDist = minDist
      bestCandidate = { cx, cy }
    }
  }

  // No non-overlapping found — use best candidate
  const { cx, cy } = bestCandidate || { cx: bounds.xMin + rw / 2, cy: bounds.yMin + rh / 2 }
  return {
    region,
    baseX: Math.max(REGION_MARGIN, Math.min(vw - POLAROID_W - REGION_MARGIN, cx)),
    baseY: Math.max(REGION_MARGIN, Math.min(vh - POLAROID_H - REGION_MARGIN, cy)),
    ampX:  Math.min(28, rw / 4) * (0.5 + Math.random() * 0.5),
    ampY:  Math.min(22, rh / 4) * (0.5 + Math.random() * 0.5),
    freqX: 0.00018 + Math.random() * 0.00012,
    freqY: 0.00014 + Math.random() * 0.00010,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    rotation: -7 + Math.random() * 14,
  }
}

function getFilename(src) {
  return src.split('/').pop()
}

function formatExifDate(d) {
  if (!d) return null
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// ─── CRT Monitor ─────────────────────────────────────────────────────────────
function CRTMonitor({ monitorRef }) {
  // typedState: array of { line, charsSoFar, isComplete }
  const [typedState, setTypedState] = useState([])
  const intervalRef = useRef(null)
  const lineIdxRef  = useRef(0)
  const charIdxRef  = useRef(0)

  // Write monitor bounds to store for ship collision
  useEffect(() => {
    const update = () => {
      if (monitorRef.current) {
        const r = monitorRef.current.getBoundingClientRect()
        monitorBounds.current = { x: r.left, y: r.top, w: r.width, h: r.height }
      }
    }
    update()
    window.addEventListener('resize', update)
    const obs = new ResizeObserver(update)
    if (monitorRef.current) obs.observe(monitorRef.current)
    return () => {
      window.removeEventListener('resize', update)
      obs.disconnect()
      monitorBounds.current = null
    }
  }, [monitorRef])

  useEffect(() => {
    // Start typing
    intervalRef.current = setInterval(() => {
      const lineIdx = lineIdxRef.current
      if (lineIdx >= CONTENT_LINES.length) {
        clearInterval(intervalRef.current)
        return
      }

      const line = CONTENT_LINES[lineIdx]

      if (line.type === 'blank') {
        // Blank lines complete instantly
        setTypedState(prev => {
          const next = [...prev]
          if (!next[lineIdx]) next[lineIdx] = { line, charsSoFar: 0, isComplete: true }
          return next
        })
        lineIdxRef.current++
        charIdxRef.current = 0
        return
      }

      const content = line.type === 'link' ? line.label : line.value
      const charIdx = charIdxRef.current

      if (charIdx <= content.length) {
        setTypedState(prev => {
          const next = [...prev]
          next[lineIdx] = {
            line,
            charsSoFar: charIdx,
            isComplete: charIdx >= content.length,
          }
          return next
        })
        charIdxRef.current++
      }

      if (charIdx >= content.length) {
        lineIdxRef.current++
        charIdxRef.current = 0
      }
    }, 28)

    return () => clearInterval(intervalRef.current)
  }, [])

  // Find the currently typing line index for cursor placement
  const currentLineIdx = lineIdxRef.current

  const content = (
    <div className="crt-content">
      {typedState.map((entry, i) => {
        if (!entry) return null
        const { line, charsSoFar, isComplete } = entry
        const isCurrent = i === currentLineIdx - (isComplete ? 0 : 1) ||
                          (i === typedState.length - 1 && !isComplete)

        if (line.type === 'blank') {
          return <div key={i} style={{ height: '0.6em' }} />
        }

        if (line.type === 'link') {
          const displayed = line.label.slice(0, charsSoFar)
          return (
            <div key={i}>
              {isComplete ? (
                <a href={line.href} target="_blank" rel="noopener noreferrer" className="crt-link">
                  {line.label}
                </a>
              ) : (
                <span>
                  {displayed}
                  {isCurrent && <span className="crt-cursor">_</span>}
                </span>
              )}
            </div>
          )
        }

        const displayed = line.value.slice(0, charsSoFar)
        return (
          <div key={i}>
            {displayed}
            {isCurrent && !isComplete && <span className="crt-cursor">_</span>}
          </div>
        )
      })}
      {lineIdxRef.current >= CONTENT_LINES.length && (
        <div><span className="crt-cursor">_</span></div>
      )}
    </div>
  )

  return createPortal(
    <div ref={monitorRef} className="crt-bezel">
      <div className="crt-screen">
        <div className="crt-scanlines" />
        {content}
      </div>
    </div>,
    document.body
  )
}

// ─── Polaroid layer ───────────────────────────────────────────────────────────
function PolaroidLayer({ onEnlargeRequest, monitorRef }) {
  const [slots, setSlots] = useState(() => {
    const pool = shuffle(PHOTO_POOL)
    const mb = getApproxMonitorBounds()
    const regions = ['left', 'right', 'bottom']
    const placed = []
    return Array.from({ length: SLOT_COUNT }, (_, i) => {
      const counts = { left: 0, right: 0, bottom: 0 }
      placed.forEach(p => counts[p.region]++)
      const minCount = Math.min(...Object.values(counts))
      const eligible = regions.filter(r => counts[r] === minCount)
      const region = eligible[Math.floor(Math.random() * eligible.length)]
      const dp = findNonOverlappingBase(region, mb, placed)
      placed.push(dp)
      return { id: `slot-${i}`, src: pool[i % pool.length], opacity: 1, driftParams: dp }
    })
  })

  const elemRefs    = useRef([])
  const rafRef      = useRef(null)
  const pendingSwaps = useRef({})
  // Cache monitor bounds for collision
  const monitorBoundsRef = useRef(null)

  // Update monitor bounds on resize
  useEffect(() => {
    const updateBounds = () => {
      if (monitorRef?.current) {
        const r = monitorRef.current.getBoundingClientRect()
        monitorBoundsRef.current = { x: r.left, y: r.top, w: r.width, h: r.height }
      }
    }
    updateBounds()
    window.addEventListener('resize', updateBounds)
    const obs = new ResizeObserver(updateBounds)
    if (monitorRef?.current) obs.observe(monitorRef.current)
    return () => {
      window.removeEventListener('resize', updateBounds)
      obs.disconnect()
    }
  }, [monitorRef])

  useEffect(() => {
    const tick = (t) => {
      const polaroidW = POLAROID_W
      const polaroidH = POLAROID_H
      const mb = monitorBoundsRef.current
      const BUFFER = 10
      const GAP = 16  // minimum gap between polaroid edges

      // Step 1: compute raw Lissajous positions for all active polaroids
      const active = slots.map((slot, i) => {
        const el = elemRefs.current[i]
        if (!el || slot.opacity === 0) return null
        const dp = slot.driftParams
        return {
          i, el, slot, dp,
          px: dp.baseX + Math.sin(t * dp.freqX + dp.phaseX) * dp.ampX,
          py: dp.baseY + Math.cos(t * dp.freqY + dp.phaseY) * dp.ampY,
        }
      })

      // Step 2: push each polaroid out of monitor (safety net)
      const pushOut = (p, zone, noUp = false) => {
        const pRight  = p.px + polaroidW
        const pBottom = p.py + polaroidH
        const overlapX = p.px < zone.x + zone.w + BUFFER && pRight  > zone.x - BUFFER
        const overlapY = p.py < zone.y + zone.h + BUFFER && pBottom > zone.y - BUFFER
        if (!overlapX || !overlapY) return
        const dLeft   = Math.abs(pRight  - (zone.x - BUFFER))
        const dRight  = Math.abs(p.px    - (zone.x + zone.w + BUFFER))
        const dTop    = Math.abs(pBottom - (zone.y - BUFFER))
        const dBottom = Math.abs(p.py    - (zone.y + zone.h + BUFFER))
        const minDist = noUp
          ? Math.min(dLeft, dRight, dBottom)
          : Math.min(dLeft, dRight, dTop, dBottom)
        if (minDist === dLeft)        p.px = zone.x - polaroidW - BUFFER
        else if (minDist === dRight)  p.px = zone.x + zone.w + BUFFER
        else if (!noUp && minDist === dTop) p.py = zone.y - polaroidH - BUFFER
        else                          p.py = zone.y + zone.h + BUFFER
      }

      for (const p of active) {
        if (!p) continue
        if (mb) pushOut(p, mb, true)   // monitor: never push upward (safety net)
      }

      // Step 3: inter-polaroid separation (3 relaxation passes)
      for (let iter = 0; iter < 3; iter++) {
        for (let a = 0; a < active.length; a++) {
          if (!active[a]) continue
          for (let b = a + 1; b < active.length; b++) {
            if (!active[b]) continue
            const pa = active[a], pb = active[b]
            const overlapX = pa.px < pb.px + polaroidW + GAP && pa.px + polaroidW + GAP > pb.px
            const overlapY = pa.py < pb.py + polaroidH + GAP && pa.py + polaroidH + GAP > pb.py
            if (!overlapX || !overlapY) continue
            const dx = (pa.px + polaroidW / 2) - (pb.px + polaroidW / 2)
            const dy = (pa.py + polaroidH / 2) - (pb.py + polaroidH / 2)
            const overlapAmtX = (polaroidW + GAP) - Math.abs(dx)
            const overlapAmtY = (polaroidH + GAP) - Math.abs(dy)
            if (overlapAmtX < overlapAmtY) {
              const push = overlapAmtX / 2 + 1
              const dir = dx >= 0 ? 1 : -1
              pa.px += dir * push
              pb.px -= dir * push
            } else {
              const push = overlapAmtY / 2 + 1
              const dir = dy >= 0 ? 1 : -1
              pa.py += dir * push
              pb.py -= dir * push
            }
          }
        }
      }

      // Step 4: apply transforms and collect laser-hit bounds
      const bounds = []
      for (const p of active) {
        if (!p) continue
        p.el.style.transform = `translate(${p.px}px, ${p.py}px) rotate(${p.dp.rotation}deg)`
        const rect = p.el.getBoundingClientRect()
        bounds.push({ id: p.slot.id, x: rect.left, y: rect.top, w: rect.width, h: rect.height })
      }
      polaroidBounds.current = bounds
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      polaroidBounds.current = []
    }
  }, [slots])

  const handleHit = useCallback((id) => {
    if (pendingSwaps.current[id]) return
    setSlots(prev => prev.map(s => s.id === id ? { ...s, opacity: 0 } : s))
    const timeout = setTimeout(() => {
      delete pendingSwaps.current[id]
      setSlots(prev => {
        const used = new Set(prev.filter(s => s.id !== id).map(s => s.src))
        const available = PHOTO_POOL.filter(p => !used.has(p))
        const pool = available.length > 0 ? available : PHOTO_POOL
        const newSrc = pool[Math.floor(Math.random() * pool.length)]
        const mb = monitorBoundsRef.current || getApproxMonitorBounds()
        const currentParams = prev.filter(s2 => s2.id !== id && s2.opacity > 0).map(s2 => s2.driftParams)
        const regions = ['left', 'right', 'bottom']
        const region = regions[Math.floor(Math.random() * regions.length)]
        const dp = findNonOverlappingBase(region, mb, currentParams)
        return prev.map(s => s.id === id
          ? { ...s, src: newSrc, opacity: 1, driftParams: dp }
          : s
        )
      })
    }, 1000)
    pendingSwaps.current[id] = timeout
  }, [])

  useEffect(() => {
    polaroidHitHandler.current = handleHit
    return () => { polaroidHitHandler.current = null }
  }, [handleHit])

  useEffect(() => {
    return () => { Object.values(pendingSwaps.current).forEach(clearTimeout) }
  }, [])

  return createPortal(
    <>
      {slots.map((slot, i) => (
        <div
          key={slot.id}
          ref={el => { elemRefs.current[i] = el }}
          className="polaroid"
          onClick={() => slot.opacity > 0 && onEnlargeRequest(slot.src)}
          style={{
            opacity: slot.opacity,
            transform: `translate(${slot.driftParams.baseX}px, ${slot.driftParams.baseY}px) rotate(${slot.driftParams.rotation}deg)`,
            top: 0,
            left: 0,
            transition: 'opacity 0.6s ease',
          }}
        >
          <img src={slot.src} alt="adventure photo" draggable={false} />
          <div className="polaroid-caption">⛰</div>
        </div>
      ))}
    </>,
    document.body
  )
}

// ─── Enlarged polaroid overlay ────────────────────────────────────────────────
function EnlargedOverlay({ src, onClose, exifDates }) {
  const filename = getFilename(src)
  const dateLabel = exifDates[src] || PHOTO_DATE_OVERRIDES[filename] || null

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(5,7,15,0.88)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          background: '#f5f0e8',
          padding: '16px 16px 52px',
          borderRadius: '2px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          maxWidth: 'min(380px, 88vw)',
          width: '100%',
          animation: 'scaleIn 0.18s ease',
        }}
      >
        <img
          src={src}
          alt="enlarged photo"
          draggable={false}
          style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'cover', display: 'block' }}
        />
        {dateLabel && (
          <p style={{
            position: 'absolute',
            bottom: 16,
            left: 20,
            fontFamily: 'Courier New, monospace',
            fontSize: '11px',
            color: 'rgba(80,60,40,0.65)',
            letterSpacing: '0.5px',
          }}>
            {dateLabel}
          </p>
        )}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0,0,0,0.55)',
            border: 'none',
            color: '#fff',
            width: 28,
            height: 28,
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.55)')}
        >
          ✕
        </button>
      </div>
    </div>,
    document.body
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function About() {
  const [enlargedSrc, setEnlargedSrc] = useState(null)
  const [exifDates, setExifDates] = useState({})
  const monitorRef = useRef(null)

  // Disable ship control while photo is enlarged
  useEffect(() => {
    shipControlDisabled.current = !!enlargedSrc
  }, [enlargedSrc])

  // Clear control disable on unmount
  useEffect(() => {
    return () => { shipControlDisabled.current = false }
  }, [])

  // Load EXIF dates for all photos asynchronously
  useEffect(() => {
    let cancelled = false
    const loadDates = async () => {
      try {
        const exifr = (await import('exifr')).default
        const entries = await Promise.all(
          PHOTO_POOL.map(async src => {
            try {
              const data = await exifr.parse(src, ['DateTimeOriginal'])
              const date = data?.DateTimeOriginal
              return [src, formatExifDate(date)]
            } catch {
              return [src, null]
            }
          })
        )
        if (!cancelled) {
          const map = {}
          entries.forEach(([src, date]) => { if (date) map[src] = date })
          setExifDates(map)
        }
      } catch {
        // exifr not available
      }
    }
    loadDates()
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <CRTMonitor monitorRef={monitorRef} />
      {/* "shoot the photos" caption */}
      {createPortal(
        <p style={{
          position: 'fixed',
          /* sits just above the CRT bezel top edge (monitor center ~42vh, half-height ~209px) */
          top: 'calc(42vh - 236px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 11,
          fontFamily: '"Courier New", Consolas, monospace',
          fontSize: '10px',
          fontWeight: 400,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(0, 224, 64, 0.75)',
          textShadow: '0 0 10px rgba(0, 224, 64, 0.55)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          [ shoot the photos ]
        </p>,
        document.body
      )}
      <PolaroidLayer onEnlargeRequest={setEnlargedSrc} monitorRef={monitorRef} />
      {enlargedSrc && (
        <EnlargedOverlay
          src={enlargedSrc}
          onClose={() => setEnlargedSrc(null)}
          exifDates={exifDates}
        />
      )}
    </>
  )
}
