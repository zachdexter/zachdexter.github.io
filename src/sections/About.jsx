import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { polaroidBounds, polaroidHitHandler, shipControlDisabled, monitorBounds, activeSection } from '../store'

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

const CONTENT_LINES = [
  { type: 'text', value: '> DEXTER, ZACHARY' },
  { type: 'text', value: "  GWU CS '27" },
  { type: 'blank' },
  // { type: 'text', value: '  CS student at George Washington University.' },
  { type: 'text', value: '  Interested in SW Development & Cybersecurity!' },
  { type: 'text', value: '  When I\'m not behind a screen I spend a' },
  { type: 'text', value: "  lot of my time climbing or reading." },
  { type: 'text', value: '  On this page you\'ll find some proof that' },
  { type: 'text', value: '  I actually do touch grass :)' },

  { type: 'blank' },
  { type: 'text', value: '> CONNECTIONS:' },
  { type: 'link', label: '  github.com/zachdexter',          href: 'https://github.com/zachdexter' },
  { type: 'link', label: '  linkedin.com/in/zachary-dexter', href: 'https://www.linkedin.com/in/zachary-dexter/' },
  { type: 'link', label: '  open.spotify.com/zachdexter',    href: 'https://open.spotify.com/user/obu6xa01d9uil79bnsezpr7b2' },
  { type: 'link', label: '  instagram.com/zsdexter',         href: 'https://www.instagram.com/zsdexter/' },
  {
    type: 'links-row',
    links: [
      { label: '[GH]', href: 'https://github.com/zachdexter' },
      { label: '[LI]', href: 'https://www.linkedin.com/in/zachary-dexter/' },
      { label: '[SP]', href: 'https://open.spotify.com/user/obu6xa01d9uil79bnsezpr7b2' },
      { label: '[IG]', href: 'https://www.instagram.com/zsdexter/' },
    ],
  },
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
  return { xMin: M, xMax: vw - M - pw, yMin: mb.y + mb.h + G, yMax: vh - M - ph }
}

function findNonOverlappingBase(region, mb, existingParams, exclusionZones) {
  const vw = window.innerWidth, vh = window.innerHeight
  const margin = REGION_MARGIN
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
    for (const ez of (exclusionZones || [])) {
      if (cx + POLAROID_W > ez.x && cx < ez.x + ez.w &&
          cy + POLAROID_H > ez.y && cy < ez.y + ez.h) {
        overlaps = true
      }
    }
    if (!overlaps) {
      const baseX = Math.max(margin, Math.min(vw - POLAROID_W - margin, cx))
      const baseY = Math.max(margin, Math.min(vh - POLAROID_H - margin, cy))
      const maxAmpX = Math.max(0, Math.min(baseX - margin, vw - margin - POLAROID_W - baseX, Math.min(28, rw / 4)))
      const maxAmpY = Math.max(0, Math.min(baseY - margin, vh - margin - POLAROID_H - baseY, Math.min(22, rh / 4)))
      return {
        region,
        baseX,
        baseY,
        ampX:  maxAmpX * (0.5 + Math.random() * 0.5),
        ampY:  maxAmpY * (0.5 + Math.random() * 0.5),
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

  const { cx, cy } = bestCandidate || { cx: bounds.xMin + rw / 2, cy: bounds.yMin + rh / 2 }
  const baseX = Math.max(margin, Math.min(vw - POLAROID_W - margin, cx))
  const baseY = Math.max(margin, Math.min(vh - POLAROID_H - margin, cy))
  const maxAmpX = Math.max(0, Math.min(baseX - margin, vw - margin - POLAROID_W - baseX, Math.min(28, rw / 4)))
  const maxAmpY = Math.max(0, Math.min(baseY - margin, vh - margin - POLAROID_H - baseY, Math.min(22, rh / 4)))
  return {
    region,
    baseX,
    baseY,
    ampX:  maxAmpX * (0.5 + Math.random() * 0.5),
    ampY:  maxAmpY * (0.5 + Math.random() * 0.5),
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
function CRTMonitor({ monitorRef, isActive }) {
  const [typedState, setTypedState] = useState([])
  const intervalRef        = useRef(null)
  const lineIdxRef         = useRef(0)
  const charIdxRef         = useRef(0)

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

  // Refresh bounds when section becomes active (bounds were stale if rendered off-screen)
  useEffect(() => {
    if (!isActive || !monitorRef.current) return
    const r = monitorRef.current.getBoundingClientRect()
    monitorBounds.current = { x: r.left, y: r.top, w: r.width, h: r.height }
  }, [isActive, monitorRef])

  // Resume/start typing whenever section is active; pause when inactive
  useEffect(() => {
    if (!isActive) return
    if (lineIdxRef.current >= CONTENT_LINES.length) return  // already finished

    intervalRef.current = setInterval(() => {
      const lineIdx = lineIdxRef.current
      if (lineIdx >= CONTENT_LINES.length) {
        clearInterval(intervalRef.current)
        return
      }

      const line = CONTENT_LINES[lineIdx]

      const skipInstantly = line.type === 'blank'
        || line.type === 'links-row'
        || (line.type === 'link' && window.innerWidth < 768)
      if (skipInstantly) {
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
  }, [isActive])

  const currentLineIdx = lineIdxRef.current
  const isMobile = window.innerWidth < 768

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

        // On mobile, skip individual link lines — the links-row entry handles them
        if (line.type === 'link' && isMobile) return null

        // On desktop, skip the links-row entry — individual links handle them
        if (line.type === 'links-row' && !isMobile) return null

        if (line.type === 'links-row') {
          // Compact single-line icon row — underlined labels, no brackets
          return (
            <div key={i} style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
              {line.links.map(lk => (
                <a
                  key={lk.label}
                  href={lk.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    color: '#00e040',
                    textDecoration: 'underline',
                    letterSpacing: '0.12em',
                    cursor: 'pointer',
                  }}
                >
                  {lk.label}
                </a>
              ))}
            </div>
          )
        }

        if (line.type === 'link') {
          const displayed = line.label.slice(0, charsSoFar)
          const prefix  = line.label.match(/^\s*/)[0]
          const trimmed = line.label.trimStart()
          return (
            <div key={i}>
              {isComplete ? (
                <span>
                  {prefix}
                  <a href={line.href} target="_blank" rel="noopener noreferrer" className="crt-link">
                    {trimmed}
                  </a>
                </span>
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

  return (
    <div ref={monitorRef} className="crt-bezel">
      <div className="crt-screen">
        <div className="crt-scanlines" />
        {content}
      </div>
    </div>
  )
}

// ─── Polaroid layer ───────────────────────────────────────────────────────────
function PolaroidLayer({ onEnlargeRequest, monitorRef, isActive, isMobile, onFirstShot }) {
  const initSlotsRef  = useRef(null)
  const physicsRef    = useRef({})

  const [slots, setSlots] = useState(() => {
    const pool = shuffle(PHOTO_POOL)
    const mb = getApproxMonitorBounds()
    const vw = window.innerWidth, vh = window.innerHeight
    const shipLandX = vw / 2 - POLAROID_W / 2
    const shipLandY = vh * 0.89 - POLAROID_H / 2
    const shipZone = { x: shipLandX - 80, y: shipLandY - 60, w: POLAROID_W + 160, h: POLAROID_H + 120 }
    const slotCount = isMobile ? 2 : SLOT_COUNT
    const regions = isMobile ? ['bottom'] : ['left', 'right', 'bottom']
    const placed = []
    const result = Array.from({ length: slotCount }, (_, i) => {
      const counts = { left: 0, right: 0, bottom: 0 }
      placed.forEach(p => counts[p.region]++)
      const minCount = Math.min(...regions.map(r => counts[r]))
      const eligible = regions.filter(r => counts[r] === minCount)
      const region = eligible[Math.floor(Math.random() * eligible.length)]
      const dp = findNonOverlappingBase(region, mb, placed, [shipZone])
      placed.push(dp)
      const id = `slot-${i}`
      const speed = 1 + Math.random() * 20
      const angle = Math.random() * Math.PI * 2
      physicsRef.current[id] = { px: dp.baseX, py: dp.baseY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed }
      return { id, src: pool[i % pool.length], opacity: 0, rotation: dp.rotation,
               fadeDelay: 300 + Math.random() * 3800 }
    })
    initSlotsRef.current = result
    return result
  })

  useEffect(() => {
    const timers = initSlotsRef.current.map(slot =>
      setTimeout(() => {
        setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, opacity: 1 } : s))
      }, slot.fadeDelay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  const elemRefs     = useRef([])
  const rafRef       = useRef(null)
  const pendingSwaps = useRef({})
  const monitorBoundsRef = useRef(null)

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

  // Refresh bounds when section becomes active (bounds were stale if rendered off-screen)
  useEffect(() => {
    if (!isActive || !monitorRef?.current) return
    const r = monitorRef.current.getBoundingClientRect()
    monitorBoundsRef.current = { x: r.left, y: r.top, w: r.width, h: r.height }
  }, [isActive, monitorRef])

  useEffect(() => {
    let lastT = null
    const tick = (t) => {
      // Gate: only update bounds when About is active
      if (activeSection.current !== 'about') {
        polaroidBounds.current = []
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const dt  = lastT === null ? 16 : Math.min(t - lastT, 50)
      lastT = t
      const sec = dt / 1000
      const phy = physicsRef.current
      const mb  = monitorBoundsRef.current
      const vw  = window.innerWidth, vh = window.innerHeight
      const M   = REGION_MARGIN
      const PBUF = 10
      const GAP  = 8

      for (const slot of slots) {
        const p = phy[slot.id]
        if (!p) continue
        p.px += p.vx * sec
        p.py += p.vy * sec
      }

      for (const slot of slots) {
        const p = phy[slot.id]
        if (!p) continue
        const maxX = vw - M - POLAROID_W
        const maxY = vh - M - POLAROID_H
        if (p.px < M)    { p.px = M;    p.vx =  Math.abs(p.vx) }
        if (p.px > maxX) { p.px = maxX; p.vx = -Math.abs(p.vx) }
        if (p.py < M)    { p.py = M;    p.vy =  Math.abs(p.vy) }
        if (p.py > maxY) { p.py = maxY; p.vy = -Math.abs(p.vy) }
      }

      if (mb) {
        const mL = mb.x - PBUF, mR = mb.x + mb.w + PBUF
        const mT = mb.y - PBUF, mB = mb.y + mb.h + PBUF
        for (const slot of slots) {
          const p = phy[slot.id]
          if (!p) continue
          const pR = p.px + POLAROID_W, pB = p.py + POLAROID_H
          if (p.px < mR && pR > mL && p.py < mB && pB > mT) {
            const oL = pR - mL,  oR = mR - p.px
            const oT = pB - mT,  oB = mB - p.py
            const min = Math.min(oL, oR, oT, oB)
            if      (min === oL) { p.px = mL - POLAROID_W; if (p.vx > 0) p.vx = -p.vx }
            else if (min === oR) { p.px = mR;               if (p.vx < 0) p.vx = -p.vx }
            else if (min === oT) { p.py = mT - POLAROID_H;  if (p.vy > 0) p.vy = -p.vy }
            else                 { p.py = mB;               if (p.vy < 0) p.vy = -p.vy }
          }
        }
      }

      for (let a = 0; a < slots.length; a++) {
        const pa = phy[slots[a].id]
        if (!pa) continue
        for (let b = a + 1; b < slots.length; b++) {
          const pb = phy[slots[b].id]
          if (!pb) continue
          const dx  = pa.px - pb.px
          const dy  = pa.py - pb.py
          const ovX = (POLAROID_W + GAP) - Math.abs(dx)
          const ovY = (POLAROID_H + GAP) - Math.abs(dy)
          if (ovX > 0 && ovY > 0) {
            if (ovX < ovY) {
              const push = ovX / 2 + 1, dir = dx >= 0 ? 1 : -1
              pa.px += dir * push; pb.px -= dir * push
              const tmp = pa.vx; pa.vx = pb.vx; pb.vx = tmp
            } else {
              const push = ovY / 2 + 1, dir = dy >= 0 ? 1 : -1
              pa.py += dir * push; pb.py -= dir * push
              const tmp = pa.vy; pa.vy = pb.vy; pb.vy = tmp
            }
          }
        }
      }

      const bounds = []
      for (let i = 0; i < slots.length; i++) {
        const el = elemRefs.current[i]
        const p  = phy[slots[i].id]
        if (!el || !p || slots[i].opacity === 0) continue
        el.style.transform = `translate(${p.px}px, ${p.py}px) rotate(${slots[i].rotation}deg)`
        const rect = el.getBoundingClientRect()
        bounds.push({ id: slots[i].id, x: rect.left, y: rect.top, w: rect.width, h: rect.height })
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

  const hasFiredFirstShot = useRef(false)

  const handleHit = useCallback((id) => {
    if (pendingSwaps.current[id]) return
    if (!hasFiredFirstShot.current) {
      hasFiredFirstShot.current = true
      onFirstShot?.()
    }
    setSlots(prev => prev.map(s => s.id === id ? { ...s, opacity: 0 } : s))
    const timeout = setTimeout(() => {
      delete pendingSwaps.current[id]
      setSlots(prev => {
        const used = new Set(prev.filter(s => s.id !== id).map(s => s.src))
        const available = PHOTO_POOL.filter(p => !used.has(p))
        const pool = available.length > 0 ? available : PHOTO_POOL
        const newSrc = pool[Math.floor(Math.random() * pool.length)]
        const mb = monitorBoundsRef.current || getApproxMonitorBounds()
        const currentParams = prev
          .filter(s => s.id !== id && s.opacity > 0)
          .map(s => {
            const p = physicsRef.current[s.id]
            return { baseX: p?.px ?? 0, baseY: p?.py ?? 0, region: 'bottom' }
          })
        const regions = ['left', 'right', 'bottom']
        const region = regions[Math.floor(Math.random() * regions.length)]
        const dp = findNonOverlappingBase(region, mb, currentParams)
        const speed = 25 + Math.random() * 20
        const angle = Math.random() * Math.PI * 2
        physicsRef.current[id] = { px: dp.baseX, py: dp.baseY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed }
        return prev.map(s => s.id === id
          ? { ...s, src: newSrc, opacity: 1, rotation: -7 + Math.random() * 14 }
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

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {slots.map((slot, i) => {
        const initP = physicsRef.current[slot.id] || { px: 0, py: 0 }
        return (
          <div
            key={slot.id}
            ref={el => { elemRefs.current[i] = el }}
            className="polaroid"
            onClick={() => slot.opacity > 0 && onEnlargeRequest(slot.src)}
            style={{
              opacity: slot.opacity,
              transform: `translate(${initP.px}px, ${initP.py}px) rotate(${slot.rotation}deg)`,
              top: 0,
              left: 0,
              transition: 'opacity 2.5s ease',
            }}
          >
            <img src={slot.src} alt="adventure photo" draggable={false} />
            <div className="polaroid-caption">⛰</div>
          </div>
        )
      })}
    </div>
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
export default function About({ isActive }) {
  const [enlargedSrc, setEnlargedSrc] = useState(null)
  const [exifDates, setExifDates] = useState({})
  const [hasShot, setHasShot] = useState(false)
  const monitorRef = useRef(null)

  useEffect(() => {
    shipControlDisabled.current = !!enlargedSrc
  }, [enlargedSrc])

  useEffect(() => {
    return () => { shipControlDisabled.current = false }
  }, [])

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
      <CRTMonitor monitorRef={monitorRef} isActive={isActive} />

      {/* "shoot the photos" caption */}
      <p style={{
        position: 'absolute',
        top: 'calc(42vh - 236px)',
        left: '50%',
        zIndex: 11,
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: '10px',
        fontWeight: 400,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'rgba(0, 224, 64, 0.75)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        display: window.innerWidth < 768 ? 'none' : undefined,
        animation: hasShot ? 'none' : 'shoot-hint-pulse 1.6s ease-in-out infinite',
        transform: 'translateX(-50%)',
      }}>
        [ shoot the photos ]
      </p>

      <PolaroidLayer
        isActive={isActive}
        onEnlargeRequest={setEnlargedSrc}
        monitorRef={monitorRef}
        isMobile={window.innerWidth < 768}
        onFirstShot={() => setHasShot(true)}
      />

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
