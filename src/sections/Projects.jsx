import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { shipPosition, satelliteBounds, satelliteHitHandler, dockingState, activeSection, monitorBounds } from '../store'

// ─── Project data ─────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: 'spotify-ai',
    title: 'Spotify Statistics + AI Playlist Creator',
    description:
      'A web app that uses AI to generate personalized Spotify playlists based on user prompts. Built with Node.js, React, and the Spotify API — live previews, user preference handling, and direct export to Spotify accounts.',
    video: '/assets/07.07.2025_spotify_site_2.mp4',
    github: 'https://github.com/zachdexter/spotify-ai',
    live: null,
    tags: ['React', 'Node.js', 'Spotify API', 'OpenAI'],
  },
  {
    id: 'student-portal',
    title: 'Student Portal & Course Registration',
    description:
      'Full-stack web app built with Agile methodology. HTML, Bootstrap, and JavaScript on the frontend; Flask + SQLite on the backend to manage course registration and user data.',
    image: '/assets/dbProjSS.png',
    github: 'https://github.com/zachdexter/CourseRegistration',
    live: null,
    tags: ['Flask', 'SQLite', 'JavaScript'],
  },
  {
    id: 'breakout',
    title: 'Brick Breaker Game',
    description:
      'A browser-based clone of Atari Breakout built with JavaScript and HTML Canvas. Two levels, multi-hit bricks, extra lives, and delta-time physics for consistent gameplay across machines.',
    image: '/assets/BreakoutSS.png',
    github: 'https://github.com/zachdexter',
    live: '/breakout/breakout.html',
    liveLabel: 'Play',
    tags: ['JavaScript', 'Canvas'],
  },
  {
    id: 'library',
    title: 'Home Library Database',
    description:
      'A searchable home library system powered by SQL. Manages a personal book collection with sorting by author, title, and genre, plus a quick search feature.',
    image: '/assets/LibrarySS.png',
    github: 'https://github.com/zachdexter/home-library',
    live: null,
    tags: ['SQL'],
  },
  {
    id: 'basket-lsat',
    title: 'Basket LSAT',
    description:
      'Production LSAT tutoring SaaS serving 50+ users. Built with Next.js App Router, TypeScript, and Supabase (PostgreSQL + Auth + RLS). Features multi-GB video delivery via Mux Direct Upload, Stripe Checkout with webhook validation, rate limiting, reCAPTCHA, and isolated staging/production environments.',
    image: '/assets/BasketLSATSS.png',
    github: 'https://github.com/zachdexter/lsat-site',
    live: 'https://basketlsat.com',
    tags: ['Next.js', 'TypeScript', 'Supabase', 'Stripe', 'Mux'],
  },
]

// ─── Satellite visual configs ─────────────────────────────────────────────────
const SATELLITE_CONFIGS = [
  {
    id: 'spotify-ai',
    name: 'Spotify AI',
    angle: 0,
    radius: 195,
    speed: 0.00018,
    inclineY: 0.65,
    scale: 1.0,
    color: '#4ade80',
    bodyW: 24, bodyH: 12,
    panels: [
      { ox: -23, oy: 0, w: 22, h: 5, a: 0 },
      { ox:  23, oy: 0, w: 22, h: 5, a: 0 },
    ],
    dish: 'top',
    antennas: 2,
    blinkRate: 800,
    trailOpacity: 0.40,
  },
  {
    id: 'student-portal',
    name: 'Student Portal',
    angle: 2.1,
    radius: 285,
    speed: 0.00012,
    inclineY: 0.72,
    scale: 1.15,
    color: '#7dd3fc',
    bodyW: 30, bodyH: 11,
    panels: [
      { ox: -20, oy: -3.5, w: 14, h: 4, a: 0 },
      { ox: -20, oy:  3.5, w: 14, h: 4, a: 0 },
      { ox:  20, oy: -3.5, w: 14, h: 4, a: 0 },
      { ox:  20, oy:  3.5, w: 14, h: 4, a: 0 },
    ],
    dish: 'right',
    antennas: 1,
    blinkRate: 1100,
    trailOpacity: 0.35,
  },
  {
    id: 'breakout',
    name: 'Brick Breaker',
    angle: 3.8,
    radius: 145,
    speed: 0.00025,
    inclineY: 0.55,
    scale: 0.85,
    color: '#f59e0b',
    bodyW: 20, bodyH: 11,
    panels: [
      { ox: -14, oy: 2, w: 16, h: 4, a:  0.26 },
      { ox:  14, oy: 2, w: 16, h: 4, a: -0.26 },
    ],
    dish: null,
    antennas: 3,
    blinkRate: 500,
    trailOpacity: 0.45,
  },
  {
    id: 'library',
    name: 'Library DB',
    angle: 1.2,
    radius: 355,
    speed: 0.00009,
    inclineY: 0.78,
    scale: 1.05,
    color: '#a78bfa',
    bodyW: 14, bodyH: 26,
    panels: [
      { ox: -18, oy:  0, w: 20, h: 4.5, a: 0 },
      { ox:  18, oy:  0, w: 20, h: 4.5, a: 0 },
      { ox:   0, oy: 15, w:  9, h: 3,   a: 0 },
    ],
    dish: 'left',
    antennas: 1,
    blinkRate: 1400,
    trailOpacity: 0.30,
  },
  {
    id: 'basket-lsat',
    name: 'Basket LSAT',
    angle: 4.9,
    radius: 420,
    speed: 0.000065,
    inclineY: 0.82,
    scale: 1.1,
    color: '#f43f5e',
    bodyW: 32, bodyH: 13,
    panels: [
      { ox: -26, oy: -3, w: 22, h: 4.5, a: 0 },
      { ox: -26, oy:  3, w: 22, h: 4.5, a: 0 },
      { ox:  26, oy: -3, w: 22, h: 4.5, a: 0 },
      { ox:  26, oy:  3, w: 22, h: 4.5, a: 0 },
    ],
    dish: 'bottom',
    antennas: 2,
    blinkRate: 950,
    trailOpacity: 0.32,
  },
]

const DOCK_THRESHOLD   = 52    // px from satellite center
const UNDOCK_COOLDOWN  = 3000  // ms before ship can re-dock after closing a card

// ─── Canvas drawing helpers ───────────────────────────────────────────────────
function drawPlanet(ctx, cx, cy) {
  const halo = ctx.createRadialGradient(cx, cy, 20, cx, cy, 75)
  halo.addColorStop(0, 'rgba(80,140,255,0.18)')
  halo.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.beginPath()
  ctx.arc(cx, cy, 75, 0, Math.PI * 2)
  ctx.fillStyle = halo
  ctx.fill()

  const body = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 28)
  body.addColorStop(0, 'rgba(180,210,255,0.95)')
  body.addColorStop(0.45, 'rgba(90,150,230,0.85)')
  body.addColorStop(1, 'rgba(30,70,160,0.80)')
  ctx.beginPath()
  ctx.arc(cx, cy, 28, 0, Math.PI * 2)
  ctx.fillStyle = body
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, 28, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(140,200,255,0.35)'
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawOrbitRing(ctx, cx, cy, r, inclineY, color) {
  ctx.beginPath()
  ctx.ellipse(cx, cy, r, r * inclineY, 0, 0, Math.PI * 2)
  ctx.strokeStyle = `${color}18`
  ctx.lineWidth = 0.5
  ctx.stroke()
}

function drawOrbitalTrail(ctx, cx, cy, sat, vscale) {
  const r = sat.radius * vscale
  const ry = r * sat.inclineY
  const trailLen = Math.PI * 0.55
  ctx.beginPath()
  let first = true
  for (let a = sat.angle - trailLen; a <= sat.angle; a += 0.04) {
    const px = cx + Math.cos(a) * r
    const py = cy + Math.sin(a) * ry
    if (first) { ctx.moveTo(px, py); first = false }
    else ctx.lineTo(px, py)
  }
  const trail = ctx.createLinearGradient(
    cx + Math.cos(sat.angle - trailLen) * r,
    cy + Math.sin(sat.angle - trailLen) * ry,
    cx + Math.cos(sat.angle) * r,
    cy + Math.sin(sat.angle) * ry,
  )
  trail.addColorStop(0, `${sat.color}00`)
  trail.addColorStop(1, `${sat.color}${Math.round(sat.trailOpacity * 255).toString(16).padStart(2, '0')}`)
  ctx.strokeStyle = trail
  ctx.lineWidth = 1.8
  ctx.stroke()
}

function drawSatelliteBody(ctx, cfg, bodyAngle, highlighted, t) {
  const s = cfg.scale
  const c = cfg.color
  const bw = cfg.bodyW * s
  const bh = cfg.bodyH * s

  ctx.save()
  ctx.rotate(bodyAngle)

  if (highlighted) {
    ctx.shadowColor = c
    ctx.shadowBlur = 22
  }

  ctx.fillStyle = c
  ctx.fillRect(-bw / 2, -bh / 2, bw, bh)
  ctx.fillStyle = 'rgba(0,0,0,0.30)'
  ctx.fillRect(-bw / 2 + 2 * s, -bh / 2 + 2 * s, bw - 4 * s, bh - 4 * s)
  ctx.shadowBlur = 0

  cfg.panels.forEach(p => {
    ctx.save()
    ctx.translate(p.ox * s, p.oy * s)
    ctx.rotate(p.a)
    ctx.fillStyle = `${c}bb`
    ctx.fillRect(-p.w / 2 * s, -p.h / 2 * s, p.w * s, p.h * s)
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'
    ctx.lineWidth = 0.8
    const cols = 3
    for (let i = 1; i < cols; i++) {
      const lx = -p.w / 2 * s + (p.w * s / cols) * i
      ctx.beginPath()
      ctx.moveTo(lx, -p.h / 2 * s)
      ctx.lineTo(lx,  p.h / 2 * s)
      ctx.stroke()
    }
    ctx.strokeStyle = `${c}66`
    ctx.lineWidth = 0.6
    ctx.strokeRect(-p.w / 2 * s, -p.h / 2 * s, p.w * s, p.h * s)
    ctx.restore()
  })

  if (cfg.dish) {
    const dishR = 6 * s
    let dx = 0, dy = 0
    let startA = 0, endA = Math.PI
    if (cfg.dish === 'top') {
      dy = -bh / 2 - dishR * 0.5; startA = Math.PI; endA = Math.PI * 2
    } else if (cfg.dish === 'bottom') {
      dy = bh / 2 + dishR * 0.5; startA = 0; endA = Math.PI
    } else if (cfg.dish === 'right') {
      dx = bw / 2 + dishR * 0.5; startA = -Math.PI / 2; endA = Math.PI / 2
    } else if (cfg.dish === 'left') {
      dx = -bw / 2 - dishR * 0.5; startA = Math.PI / 2; endA = Math.PI * 1.5
    }
    ctx.strokeStyle = c; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(dx, dy, dishR, startA, endA); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(dx, dy)
    if (cfg.dish === 'top') ctx.lineTo(0, -bh / 2)
    else if (cfg.dish === 'bottom') ctx.lineTo(0, bh / 2)
    else if (cfg.dish === 'right') ctx.lineTo(bw / 2, 0)
    else ctx.lineTo(-bw / 2, 0)
    ctx.stroke()
    ctx.beginPath(); ctx.arc(dx, dy, 2 * s, 0, Math.PI * 2)
    ctx.fillStyle = c; ctx.fill()
  }

  ctx.strokeStyle = c; ctx.lineWidth = 1
  for (let a = 0; a < cfg.antennas; a++) {
    const ax = ((a - (cfg.antennas - 1) / 2) * 5) * s
    ctx.beginPath(); ctx.moveTo(ax, -bh / 2); ctx.lineTo(ax, -bh / 2 - 9 * s); ctx.stroke()
    ctx.beginPath(); ctx.arc(ax, -bh / 2 - 9 * s, 1.5 * s, 0, Math.PI * 2)
    ctx.fillStyle = c; ctx.fill()
  }

  const blinkOn = Math.floor(t / cfg.blinkRate) % 2 === 0
  ctx.beginPath(); ctx.arc(bw / 2 - 2 * s, -bh / 2 + 2 * s, 2 * s, 0, Math.PI * 2)
  ctx.fillStyle = blinkOn ? '#fff' : c
  if (blinkOn) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 6 }
  ctx.fill(); ctx.shadowBlur = 0

  ctx.restore()
}

function drawSatelliteLabel(ctx, x, y, cfg, highlighted) {
  if (!highlighted) return
  const s = cfg.scale
  const bh = cfg.bodyH * s
  const c = cfg.color

  ctx.save()
  ctx.font = `bold 11px Orbitron, sans-serif`
  ctx.fillStyle = c
  ctx.textAlign = 'center'
  ctx.globalAlpha = 0.9
  ctx.shadowColor = c; ctx.shadowBlur = 8
  ctx.fillText(cfg.name, x, y + bh / 2 + 22)
  ctx.shadowBlur = 0
  ctx.font = '8px Orbitron, sans-serif'
  ctx.fillStyle = `${c}99`
  ctx.fillText('FLY CLOSE TO DOCK', x, y + bh / 2 + 36)
  ctx.restore()
}

function drawDebris(ctx, particles) {
  particles.forEach(p => {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.angle)
    ctx.globalAlpha = p.opacity
    ctx.fillStyle = 'rgba(128, 108, 88, 1)'
    ctx.strokeStyle = 'rgba(158, 132, 108, 1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, -p.size)
    ctx.lineTo(p.size * 0.7, -p.size * 0.3)
    ctx.lineTo(p.size * 0.9, p.size * 0.5)
    ctx.lineTo(0, p.size)
    ctx.lineTo(-p.size * 0.8, p.size * 0.4)
    ctx.lineTo(-p.size * 0.6, -p.size * 0.6)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  })
}

// ─── Satellite canvas ─────────────────────────────────────────────────────────
function SatelliteCanvas({ onSatelliteClick, selectedIdRef, cardRef, lastUndockTimeRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    let lastT = 0

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const isMob = () => canvas.width < 768
    const getVScale = () => {
      if (isMob()) return Math.min(0.40, (canvas.width * 0.45) / SATELLITE_CONFIGS[4].radius)
      return Math.max(0.55, Math.min(1.0, window.innerWidth / 1440))
    }
    const getCX = () => canvas.width * (isMob() ? 0.50 : 0.40)

    const sats = SATELLITE_CONFIGS.map(cfg => ({
      ...cfg,
      bodyAngle: Math.random() * Math.PI * 2,
      bodyRotSpeed: 0.00008 + Math.random() * 0.00010,
      spinBoost: 0,
    }))

    const debris = Array.from({ length: 26 }, () => {
      const vscale = getVScale()
      const cx = getCX()
      const cy = window.innerHeight * 0.50
      return {
        x: cx + (Math.random() - 0.5) * (SATELLITE_CONFIGS[4].radius * vscale * 2 + 80),
        y: cy + (Math.random() - 0.5) * (SATELLITE_CONFIGS[4].radius * vscale * 1.4),
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.12,
        size: 1.5 + Math.random() * 2.5,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.012,
        opacity: 0.55 + Math.random() * 0.25,
      }
    })

    satelliteHitHandler.current = (id) => {
      const sat = sats.find(s => s.id === id)
      if (sat) sat.spinBoost = 130
    }

    const draw = (t) => {
      const dt = Math.min(t - lastT, 50)
      lastT = t

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Always draw the scene so it's never empty when the camera pans in.
      // Only clear collision bounds when not on the projects page so the ship
      // doesn't collide with off-screen satellites.
      if (activeSection.current !== 'projects') {
        satelliteBounds.current = []
      }

      const vscale = getVScale()
      const cx = getCX()
      const cy = canvas.height * 0.50

      debris.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.angle += p.rotSpeed
        const maxR = SATELLITE_CONFIGS[4].radius * vscale + 100
        if (Math.hypot(p.x - cx, p.y - cy) > maxR * 1.2) {
          p.x = cx + (Math.random() - 0.5) * maxR
          p.y = cy + (Math.random() - 0.5) * maxR * 0.8
        }
      })
      drawDebris(ctx, debris)

      sats.forEach(sat => {
        drawOrbitRing(ctx, cx, cy, sat.radius * vscale, sat.inclineY, sat.color)
      })

      drawPlanet(ctx, cx, cy)

      const ship = shipPosition.current
      const bounds = []

      sats.forEach(sat => {
        sat.angle += sat.speed * dt
        if (sat.spinBoost > 0) {
          sat.bodyAngle += sat.bodyRotSpeed * dt * 18
          sat.spinBoost -= 1
        } else {
          sat.bodyAngle += sat.bodyRotSpeed * dt
        }

        const sx = cx + Math.cos(sat.angle) * sat.radius * vscale
        const sy = cy + Math.sin(sat.angle) * sat.radius * vscale * sat.inclineY

        const hitR = Math.max(sat.bodyW, sat.bodyH) * sat.scale * 0.8
        bounds.push({ id: sat.id, x: sx, y: sy, r: hitR })

        const dist = Math.hypot(ship.x - sx, ship.y - sy)
        const highlighted = dist < 150

        if (activeSection.current === 'projects'
            && !dockingState.current
            && dist < sat.bodyW * sat.scale * 0.5 + DOCK_THRESHOLD
            && Date.now() - lastUndockTimeRef.current > UNDOCK_COOLDOWN) {
          dockingState.current = {
            satelliteId: sat.id,
            offsetX: ship.x - sx,
            offsetY: ship.y - sy,
          }
          onSatelliteClick(sat.id)
        }

        drawOrbitalTrail(ctx, cx, cy, sat, vscale)

        ctx.save()
        ctx.translate(sx, sy)
        drawSatelliteBody(ctx, sat, sat.bodyAngle, highlighted, t)
        ctx.restore()

        drawSatelliteLabel(ctx, sx, sy, sat, highlighted)
      })

      satelliteBounds.current = bounds

      animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)

    const handleClick = (e) => {
      if (activeSection.current !== 'projects') return
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const vscale = getVScale()
      const cx = getCX()
      const cy = canvas.height * 0.50

      for (const sat of SATELLITE_CONFIGS) {
        const sx = cx + Math.cos(sats.find(s => s.id === sat.id).angle) * sat.radius * vscale
        const sy = cy + Math.sin(sats.find(s => s.id === sat.id).angle) * sat.radius * vscale * sat.inclineY
        const hitR = Math.max(sat.bodyW, sat.bodyH) * sat.scale + 10
        if (Math.hypot(mx - sx, my - sy) < hitR) {
          onSatelliteClick(sat.id)
          break
        }
      }
    }
    canvas.addEventListener('click', handleClick)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('click', handleClick)
      satelliteHitHandler.current = null
      satelliteBounds.current = []
    }
  }, [onSatelliteClick, selectedIdRef, cardRef])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        cursor: 'crosshair',
      }}
    />
  )
}

// ─── Project detail overlay ───────────────────────────────────────────────────
function ProjectOverlay({ project, cfg, onClose, cardRef }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' || e.key === ' ') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const isMobile = window.innerWidth < 768
  const c = cfg.color
  const CD = `${c}88`
  const CBG = `${c}12`
  const CBD = `${c}30`

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(5,7,15,0.60)',
        zIndex: 9000,
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        animation: 'fadeIn 0.16s ease',
      }}
    >
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9001,
          width: isMobile ? '96vw' : undefined,
        }}
      >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(8,12,24,0.97)',
          border: `1px solid ${CBD}`,
          borderRadius: isMobile ? '10px' : '12px',
          padding: isMobile ? '16px' : '28px',
          width: '100%',
          maxWidth: isMobile ? undefined : 'min(520px, 88vw)',
          maxHeight: isMobile ? '88vh' : undefined,
          overflowY: isMobile ? 'auto' : undefined,
          boxShadow: `0 0 60px ${c}22, 0 24px 80px rgba(0,0,0,0.7)`,
          animation: 'scaleIn 0.16s ease',
          position: 'relative',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '8px', letterSpacing: '2.5px', color: CD, textTransform: 'uppercase', marginBottom: '6px' }}>
            ◈ SATELLITE — {cfg.name.toUpperCase()}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '17px' : '15px', fontWeight: 700, color: 'var(--star-white)', lineHeight: 1.3 }}>
            {project.title}
          </h2>
        </div>

        {(project.image || project.video) && (
          <div style={{ borderRadius: '6px', overflow: 'hidden', border: `1px solid ${CBD}`, marginBottom: '16px', aspectRatio: isMobile ? '1/1' : '16/9' }}>
            {project.video
              ? <video src={project.video} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <img src={project.image} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            }
          </div>
        )}

        <p style={{ fontSize: isMobile ? '15px' : '13px', lineHeight: 1.7, color: 'var(--text-muted)', marginBottom: '16px' }}>
          {project.description}
        </p>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {project.tags.map(tag => (
            <span key={tag} style={{
              fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '1px',
              color: c, background: CBG, border: `1px solid ${CBD}`,
              padding: '3px 10px', borderRadius: '4px',
            }}>
              {tag}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {project.live && !(isMobile && project.id === 'breakout') && (
            <a
              href={project.live}
              target={project.live.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '1.5px',
                color: '#070b12', background: c, textDecoration: 'none',
                padding: '8px 18px', borderRadius: '5px', fontWeight: 700,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {(project.liveLabel ?? 'LIVE DEMO')} ↗
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '1.5px',
                color: c, textDecoration: 'none',
                border: `1px solid ${CBD}`, padding: '8px 18px', borderRadius: '5px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = CBG)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              GitHub ↗
            </a>
          )}
          {!project.live && !project.github && (
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '1.5px', color: `${c}55` }}>
              links coming soon
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.6)', width: 28, height: 28, borderRadius: '50%',
            cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          ✕
        </button>
      </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Projects() {
  const [selectedId, setSelectedId] = useState(null)
  const selectedIdRef = useRef(null)
  const cardRef = useRef(null)
  const lastUndockTimeRef = useRef(0)

  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  // Clear monitorBounds when Projects section is active (no monitor on this page)
  useEffect(() => {
    if (activeSection.current === 'projects') {
      monitorBounds.current = null
    }
  }, []) // Run once on mount

  // Also clear when section changes to projects
  useEffect(() => {
    const check = () => {
      if (activeSection.current === 'projects') {
        monitorBounds.current = null
      }
    }
    // Check immediately and on section changes
    check()
    const interval = setInterval(check, 100) // Check periodically as fallback
    return () => clearInterval(interval)
  }, [])

  const handleSatelliteClick = useCallback((id) => {
    setSelectedId(id)
  }, [])

  const handleClose = useCallback(() => {
    lastUndockTimeRef.current = Date.now()
    dockingState.current = null
    setSelectedId(null)
  }, [])

  const selectedProject = selectedId ? PROJECTS.find(p => p.id === selectedId) : null
  const selectedCfg     = selectedId ? SATELLITE_CONFIGS.find(c => c.id === selectedId) : null

  return (
    <>
      <SatelliteCanvas
        onSatelliteClick={handleSatelliteClick}
        selectedIdRef={selectedIdRef}
        cardRef={cardRef}
        lastUndockTimeRef={lastUndockTimeRef}
      />

      {/* Header hint */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 8, fontFamily: 'var(--font-display)', fontSize: '8px',
        letterSpacing: '2.5px', color: 'rgba(125,211,252,0.30)',
        textTransform: 'uppercase', pointerEvents: 'none', userSelect: 'none',
      }}>
        {window.innerWidth < 768 ? '◎ TAP SATELLITES TO VIEW PROJECTS' : '◎ FLY CLOSE TO DOCK · CLICK TO VIEW'}
      </div>

      {selectedProject && selectedCfg && (
        <ProjectOverlay
          project={selectedProject}
          cfg={selectedCfg}
          onClose={handleClose}
          cardRef={cardRef}
        />
      )}
    </>
  )
}
