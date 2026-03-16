import { useEffect, useRef } from 'react'
import { shipPosition, polaroidBounds, polaroidHitHandler, satelliteBounds, satelliteHitHandler, dockingState, shipControlDisabled, nowIconBounds, nowIconHitHandler, monitorBounds, resumeCardBounds, activeSection } from '../store'

// --- Constants ---
const TURN_SPEED    = 0.09
const THRUST        = 0.14
const MAX_SPEED     = 6.5
const DRAG          = 0.987
const LASER_SPEED   = 14
const LASER_DECAY   = 0.024
const FIRE_COOLDOWN = 10
const SHIP_RADIUS   = 7
const EDGE_MARGIN   = 32    // px past edge that triggers exit
const WALL_INSET    = 14    // ship is clamped this many px inside screen edges (dead-end walls)
const TRAIL_LENGTH  = 12    // contrail history length

// Nav fly-in configuration per section
const NAV_ENTRY_CONFIG = {
  about: {
    from: 'bottom',
    // Land lower on screen, clearly below the CRT
    target: (w, h) => ({ x: w * 0.5, y: h * 0.82 }),
  },
  projects: {
    from: 'right',
    target: (w, h) => ({ x: w * 0.85, y: h * 0.5 }),
  },
  now: {
    from: 'left',
    target: (w, h) => ({ x: w * 0.15, y: h * 0.5 }),
  },
  resume: {
    from: 'top',
    // Land high on the screen (top ~10%) since we navigate down from home
    target: (w, h) => ({ x: w * 0.5, y: h * 0.12 }),
  },
  landingFrom: {
    about: 'top',
    projects: 'left',
    now: 'right',
    resume: 'bottom',
  },
  landingTarget: {
    about:    (w, h) => ({ x: w * 0.50, y: h * 0.22 }),  // top entry → upper center
    now:      (w, h) => ({ x: w * 0.80, y: h * 0.50 }),  // right entry → right side
    projects: (w, h) => ({ x: w * 0.20, y: h * 0.50 }),  // left entry → left side
    resume:   (w, h) => ({ x: w * 0.50, y: h * 0.78 }),  // bottom entry → lower center
  },
}

const DIR_ANGLE = {
  up:    0,
  down:  Math.PI,
  left:  -Math.PI / 2,
  right: Math.PI / 2,
}

// --- Draw functions ---
function drawShip(ctx, x, y, angle, thrusting) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  if (thrusting) {
    const flicker = Math.random() * 3.75
    ctx.beginPath()
    ctx.moveTo(-3.4, 5.25)
    ctx.lineTo(0, 12 + flicker)
    ctx.lineTo(3.4, 5.25)
    ctx.fillStyle = `rgba(255, ${(100 + Math.random() * 80) | 0}, 20, 0.82)`
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(-1.5, 5.25)
    ctx.lineTo(0, 8.25 + flicker * 0.5)
    ctx.lineTo(1.5, 5.25)
    ctx.fillStyle = 'rgba(255, 235, 140, 0.9)'
    ctx.fill()
  }

  ctx.beginPath()
  ctx.moveTo(0, -9.75)
  ctx.lineTo(5.25, 2.25)
  ctx.lineTo(7.5, 6)
  ctx.lineTo(3.75, 5.25)
  ctx.lineTo(2.25, 5.25)
  ctx.lineTo(0, 3.75)
  ctx.lineTo(-2.25, 5.25)
  ctx.lineTo(-3.75, 5.25)
  ctx.lineTo(-7.5, 6)
  ctx.lineTo(-5.25, 2.25)
  ctx.closePath()
  ctx.fillStyle = 'rgba(15, 40, 90, 0.78)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.88)'
  ctx.lineWidth = 1.1
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(0, -2.25, 1.65, 2.85, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(100, 200, 255, 0.75)'
  ctx.fill()

  ctx.restore()
}

// Card AABB collision with slide
function resolveCardCollision(ship, bounds) {
  if (!bounds) return
  const { x, y, w, h } = bounds
  const m = SHIP_RADIUS + 6
  if (ship.x < x - m || ship.x > x + w + m || ship.y < y - m || ship.y > y + h + m) return

  const dl = ship.x - (x - m)
  const dr = (x + w + m) - ship.x
  const dt = ship.y - (y - m)
  const db = (y + h + m) - ship.y
  const min = Math.min(dl, dr, dt, db)

  if      (min === dl) { ship.x = x - m;     if (ship.vx > 0) ship.vx = 0 }
  else if (min === dr) { ship.x = x + w + m; if (ship.vx < 0) ship.vx = 0 }
  else if (min === dt) { ship.y = y - m;     if (ship.vy > 0) ship.vy = 0 }
  else                 { ship.y = y + h + m; if (ship.vy < 0) ship.vy = 0 }
}

export default function Spaceship({
  wrapRef,
  isPanningRef,
  passableEdgesRef,
  onExitEdge,
  onFirstMove,
}) {
  const onExitEdgeRef  = useRef(onExitEdge)
  const onFirstMoveRef = useRef(onFirstMove)
  const canvasRef      = useRef(null)
  const glowCanvasRef  = useRef(null)

  useEffect(() => { onExitEdgeRef.current  = onExitEdge  }, [onExitEdge])
  useEffect(() => { onFirstMoveRef.current = onFirstMove }, [onFirstMove])

  useEffect(() => {
    const canvas     = canvasRef.current
    const glowCanvas = glowCanvasRef.current
    const ctx        = canvas.getContext('2d')
    const glowCtx    = glowCanvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width      = window.innerWidth;  canvas.height      = window.innerHeight
      glowCanvas.width  = window.innerWidth;  glowCanvas.height  = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Delta-time: all animations/physics use elapsed ms, normalised to 60 fps (16.667 ms/frame)
    const MS_PER_FRAME = 1000 / 60
    let lastFrameTime  = 0  // set on first draw call

    const ENTRY_DURATION_MS = 1200  // was 72 frames @ 60 fps
    const ENTRY_START_X     = canvas.width + 100
    const ENTRY_END_Y       = canvas.height * 0.65  // below center text, above bottom RESUME hint
    const ENTRY_START_ANGLE = -Math.PI / 2  // pointing left → rotates to 0 (pointing up)
    let entryElapsed = 0  // ms elapsed in initial entry animation

    const ship = { x: ENTRY_START_X, y: ENTRY_END_Y, angle: ENTRY_START_ANGLE, vx: 0, vy: 0 }
    let firstMoveFired = false
    let shipGone       = false

    // Nav re-entry animation state
    const NAV_ENTRY_DURATION_MS = 800  // fires after camera settles; medium-speed entry
    let navEntryElapsed = 0
    let navEntryActive  = false
    let navEntryThrust  = false
    let navStartX       = 0
    let navStartY       = 0
    let navEndX         = 0
    let navEndY         = 0

    // Particle-dissolve explosion state
    const PARTICLE_COLORS = ['#7dd3fc', '#bae6fd', '#ffffff', '#fff0c0', '#fde68a']
    let explodeParticles  = []   // array of live particles
    let explodeActive     = false
    let pendingNavDone    = null  // callback to fire when explosion ends

    // Expose control function to App — called after each camera pan completes
    wrapRef.current = (cmd) => {
      if (!cmd || typeof cmd !== 'object') return

      if (cmd.type === 'edge-wrap') {
        const dx = cmd.dx ?? 0
        const dy = cmd.dy ?? 0
        const isCenter = dx === 0 && dy === 0
        if (isCenter) {
          ship.x  = canvas.width  / 2
          ship.y  = canvas.height / 2
          ship.vx = 0
          ship.vy = 0
        } else {
          ship.x -= dx * canvas.width
          ship.y -= dy * canvas.height
          for (const l of lasers) {
            l.x -= dx * canvas.width
            l.y -= dy * canvas.height
          }
        }
        trail.length   = 0
        shipGone       = false
        navEntryActive = false
        navEntryThrust = false
        explodeActive  = false
        explodeParticles = []
        pendingNavDone = null
      } else if (cmd.type === 'nav-depart') {
        // If another explosion was queued, cancel it cleanly
        if (pendingNavDone) { pendingNavDone = null }

        // Spawn particle-dissolve explosion at the ship's current position
        const ox = ship.x
        const oy = ship.y
        explodeParticles = []
        for (let i = 0; i < 36; i++) {
          const angle   = Math.random() * Math.PI * 2
          // two rings: fast outer sparks + slower inner sparks
          const isOuter = i < 18
          const speed   = isOuter ? 3.5 + Math.random() * 4.0 : 1.2 + Math.random() * 2.5
          const decay   = isOuter ? 0.055 + Math.random() * 0.025 : 0.045 + Math.random() * 0.020
          explodeParticles.push({
            x: ox, y: oy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: isOuter ? 1.5 + Math.random() * 1.5 : 2.0 + Math.random() * 2.0,
            life: 0,
            decay,
            color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          })
        }
        explodeActive    = true
        navEntryActive   = false
        navEntryThrust   = false
        shipGone         = false  // ship hidden once explosion starts (we skip drawing it)
        trail.length     = 0
        pendingNavDone   = cmd.onDone ?? null
      } else if (cmd.type === 'nav-arrive') {
        // Prepare a fresh section-aware fly-in animation into the new section
        const toSection   = cmd.to || 'landing'
        const fromSection = cmd.from || 'landing'

        const w = canvas.width
        const h = canvas.height

        // Determine direction and target based on destination (and origin if landing)
        let dir
        let target
        if (toSection === 'landing') {
          const map = NAV_ENTRY_CONFIG.landingFrom || {}
          const mappedDir = map[fromSection]
          dir = mappedDir || 'right'
          const landingTargetFn = NAV_ENTRY_CONFIG.landingTarget?.[fromSection]
          target = (landingTargetFn || ((w2, h2) => ({ x: w2 * 0.5, y: h2 * 0.65 })))(w, h)
        } else {
          const cfg = NAV_ENTRY_CONFIG[toSection]
          dir = cfg?.from || 'right'
          const fallbackTarget = (w2, h2) => ({ x: w2 * 0.5, y: h2 * 0.65 })
          target = (cfg?.target || fallbackTarget)(w, h)
        }

        if (dir === 'bottom') {
          navStartX = target.x
          navStartY = h + 40
        } else if (dir === 'top') {
          navStartX = target.x
          navStartY = -40
        } else if (dir === 'left') {
          navStartX = -40
          navStartY = target.y
        } else { // 'right' default
          navStartX = w + 40
          navStartY = target.y
        }

        navEndX         = target.x
        navEndY         = target.y
        navEntryElapsed = 0
        navEntryActive  = true
        navEntryThrust  = true

        const angle =
          dir === 'bottom' ? DIR_ANGLE.up :
          dir === 'top'    ? DIR_ANGLE.down :
          dir === 'left'   ? DIR_ANGLE.right :
                             DIR_ANGLE.left

        ship.x  = navStartX
        ship.y  = navStartY
        ship.vx = 0
        ship.vy = 0
        ship.angle = angle

        shipGone = false
        trail.length = 0
      }
    }

    const trail = []


    const lasers      = []
    let laserCooldown = 0

    const keys = {}
    const onKeyDown = (e) => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault() }
    const onKeyUp   = (e) => { keys[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)

    const draw = (t = 0) => {
      // --- Delta-time (capped at 50 ms to avoid huge jumps after tab focus) ---
      const dt       = lastFrameTime === 0 ? MS_PER_FRAME : Math.min(t - lastFrameTime, 50)
      lastFrameTime  = t
      const dtScale  = dt / MS_PER_FRAME  // 1.0 at 60 fps, 0.5 at 120 fps, etc.

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      glowCtx.clearRect(0, 0, glowCanvas.width, glowCanvas.height)
      const w = canvas.width
      const h = canvas.height

      if (shipGone) { animId = requestAnimationFrame(draw); return }

      // --- Particle-dissolve explosion ---
      if (explodeActive) {
        // Central flash: bright white circle, fades over first ~80 ms
        const firstParticle = explodeParticles[0]
        if (firstParticle) {
          const flashAlpha = Math.max(0, 1 - firstParticle.life * 5)
          if (flashAlpha > 0) {
            ctx.beginPath()
            ctx.arc(firstParticle.x, firstParticle.y, 18, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.85})`
            ctx.fill()
          }
        }

        let allDead = true
        for (const p of explodeParticles) {
          p.life += p.decay * dtScale   // dt-scaled: same total lifetime on any monitor
          p.x    += p.vx * dtScale
          p.y    += p.vy * dtScale
          if (p.life < 1) {
            allDead = false
            const alpha = 1 - p.life
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * (1 - p.life * 0.5), 0, Math.PI * 2)
            ctx.fillStyle = p.color
            ctx.globalAlpha = alpha
            ctx.fill()
            ctx.globalAlpha = 1
          }
        }

        if (allDead) {
          explodeActive    = false
          explodeParticles = []
          shipGone         = true
          const cb = pendingNavDone
          pendingNavDone   = null
          cb?.()  // tell App to start the scroll now
        }

        animId = requestAnimationFrame(draw)
        return
      }

      // --- Initial landing entry animation ---
      if (entryElapsed < ENTRY_DURATION_MS) {
        entryElapsed   = Math.min(entryElapsed + dt, ENTRY_DURATION_MS)
        const t2       = entryElapsed / ENTRY_DURATION_MS
        const ease     = 1 - Math.pow(1 - t2, 3)  // easeOutCubic
        ship.x         = ENTRY_START_X + (w / 2 - ENTRY_START_X) * ease
        ship.y         = ENTRY_END_Y
        ship.angle     = ENTRY_START_ANGLE * (1 - ease)
        ship.vx        = 0
        ship.vy        = 0
        drawShip(ctx, ship.x, ship.y, ship.angle, false)
        animId = requestAnimationFrame(draw)
        return
      }

      // --- Nav re-entry animation ---
      if (navEntryActive && navEntryElapsed < NAV_ENTRY_DURATION_MS) {
        navEntryElapsed = Math.min(navEntryElapsed + dt, NAV_ENTRY_DURATION_MS)
        const t2        = navEntryElapsed / NAV_ENTRY_DURATION_MS
        const ease      = 1 - Math.pow(1 - t2, 3)  // easeOutCubic
        ship.x  = navStartX + (navEndX - navStartX) * ease
        ship.y  = navStartY + (navEndY - navStartY) * ease
        ship.vx = 0
        ship.vy = 0

        if (navEntryElapsed >= NAV_ENTRY_DURATION_MS) {
          navEntryActive = false
          navEntryThrust = false
        }

        shipPosition.current = { x: ship.x, y: ship.y }
        drawShip(ctx, ship.x, ship.y, ship.angle, navEntryThrust)
        animId = requestAnimationFrame(draw)
        return
      }

      // --- Docking: ship follows satellite ---
      if (dockingState.current) {
        const { satelliteId, offsetX, offsetY } = dockingState.current
        const satBound = satelliteBounds.current.find(s => s.id === satelliteId)
        if (satBound) {
          ship.x  = satBound.x + offsetX
          ship.y  = satBound.y + offsetY
          ship.vx = 0
          ship.vy = 0
          shipPosition.current = { x: ship.x, y: ship.y }

          drawShip(ctx, ship.x, ship.y, ship.angle, false)

          animId = requestAnimationFrame(draw)
          return
        }
      }

      // --- Normal gameplay ---
      const anyInput = keys['ArrowLeft'] || keys['ArrowRight'] || keys['ArrowUp']
                    || keys['KeyA'] || keys['KeyD'] || keys['KeyW']

      if (!shipControlDisabled.current) {
        if (keys['ArrowLeft']  || keys['KeyA']) ship.angle -= TURN_SPEED * dtScale
        if (keys['ArrowRight'] || keys['KeyD']) ship.angle += TURN_SPEED * dtScale

        const thrusting = !!(keys['ArrowUp'] || keys['KeyW'])
        if (thrusting) {
          ship.vx += Math.sin(ship.angle) * THRUST * dtScale
          ship.vy -= Math.cos(ship.angle) * THRUST * dtScale
          const spd = Math.hypot(ship.vx, ship.vy)
          if (spd > MAX_SPEED) { ship.vx *= MAX_SPEED / spd; ship.vy *= MAX_SPEED / spd }
        }
      }

      const thrusting = !!(keys['ArrowUp'] || keys['KeyW']) && !shipControlDisabled.current

      // Drag: Math.pow(DRAG, dtScale) gives the same per-second decay on any refresh rate
      const dragFactor = Math.pow(DRAG, dtScale)
      ship.vx *= dragFactor;  ship.vy *= dragFactor
      ship.x  += ship.vx * dtScale;  ship.y  += ship.vy * dtScale

      if (!firstMoveFired && anyInput) {
        firstMoveFired = true
        onFirstMoveRef.current?.()
      }

      shipPosition.current = { x: ship.x, y: ship.y }

      // --- Dead-end wall clamping (edges with no destination) ---
      const passable = passableEdgesRef?.current
      if (passable && !isPanningRef?.current) {
        if (!passable.has('top')    && ship.y < WALL_INSET)   { ship.y = WALL_INSET;   if (ship.vy < 0) ship.vy = 0 }
        if (!passable.has('bottom') && ship.y > h-WALL_INSET) { ship.y = h-WALL_INSET; if (ship.vy > 0) ship.vy = 0 }
        if (!passable.has('left')   && ship.x < WALL_INSET)   { ship.x = WALL_INSET;   if (ship.vx < 0) ship.vx = 0 }
        if (!passable.has('right')  && ship.x > w-WALL_INSET) { ship.x = w-WALL_INSET; if (ship.vx > 0) ship.vx = 0 }
      }

      // --- Edge detection (only when not panning) ---
      if (!shipGone && !isPanningRef?.current) {
        if (ship.y < -EDGE_MARGIN  && passable?.has('top'))    { shipGone = true; onExitEdgeRef.current?.('top') }
        if (ship.y > h+EDGE_MARGIN && passable?.has('bottom')) { shipGone = true; onExitEdgeRef.current?.('bottom') }
        if (ship.x < -EDGE_MARGIN  && passable?.has('left'))   { shipGone = true; onExitEdgeRef.current?.('left') }
        if (ship.x > w+EDGE_MARGIN && passable?.has('right'))  { shipGone = true; onExitEdgeRef.current?.('right') }
      }

      if (shipGone) { trail.length = 0; animId = requestAnimationFrame(draw); return }

      // --- Monitor collision (About page) ---
      if (monitorBounds.current && activeSection.current === 'about') {
        resolveCardCollision(ship, monitorBounds.current)
      }

      // --- Resume card collision ---
      if (resumeCardBounds.current && activeSection.current === 'resume') {
        resolveCardCollision(ship, resumeCardBounds.current)
      }

      // --- Now icon circle-circle collision ---
      for (const ib of nowIconBounds.current) {
        const dx = ship.x - ib.cx
        const dy = ship.y - ib.cy
        const dist = Math.hypot(dx, dy)
        const minD = SHIP_RADIUS + ib.r
        if (dist < minD && dist > 0.01) {
          const nx = dx / dist
          const ny = dy / dist
          const overlap = minD - dist
          ship.x += nx * overlap * 0.5
          ship.y += ny * overlap * 0.5
          const dot = ship.vx * nx + ship.vy * ny
          if (dot < 0) {
            ship.vx -= dot * nx
            ship.vy -= dot * ny
            const tang = ship.vx * (-ny) + ship.vy * nx
            nowIconHitHandler.current?.(ib.id, -dot * nx * 0.4, -dot * ny * 0.4, tang * 0.06)
          }
        }
      }

      // --- Lasers ---
      if (laserCooldown > 0) laserCooldown -= dtScale
      if (keys['Space'] && laserCooldown <= 0) {
        const noseX = ship.x + Math.sin(ship.angle) * 10
        const noseY = ship.y - Math.cos(ship.angle) * 10
        lasers.push({
          x: noseX, y: noseY,
          vx: Math.sin(ship.angle) * LASER_SPEED + ship.vx * 0.25,
          vy: -Math.cos(ship.angle) * LASER_SPEED + ship.vy * 0.25,
          life: 1.0,
        })
        laserCooldown = FIRE_COOLDOWN
      }

      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i]
        l.x += l.vx * dtScale;  l.y += l.vy * dtScale;  l.life -= LASER_DECAY * dtScale
        if (l.life <= 0) { lasers.splice(i, 1); continue }

        let hit = false

        // Check polaroid hits (About page)
        if (!hit && polaroidBounds.current.length > 0) {
          const bounds = polaroidBounds.current
          for (let p = 0; p < bounds.length; p++) {
            const pb = bounds[p]
            if (l.x >= pb.x && l.x <= pb.x + pb.w && l.y >= pb.y && l.y <= pb.y + pb.h) {
              polaroidHitHandler.current?.(pb.id)
              lasers.splice(i, 1)
              hit = true
              break
            }
          }
        }

        // Check satellite hits (Projects page)
        if (!hit && satelliteBounds.current.length > 0) {
          const satBounds = satelliteBounds.current
          for (let s = 0; s < satBounds.length; s++) {
            const sb = satBounds[s]
            if (Math.hypot(l.x - sb.x, l.y - sb.y) < sb.r + 6) {
              satelliteHitHandler.current?.(sb.id)
              lasers.splice(i, 1)
              hit = true
              break
            }
          }
        }

        // Check Now icon hits
        if (!hit && nowIconBounds.current.length > 0) {
          for (const ib of nowIconBounds.current) {
            if (Math.hypot(l.x - ib.cx, l.y - ib.cy) < ib.r + 4) {
              const rx = l.x - ib.cx, ry = l.y - ib.cy
              const torque = (rx * l.vy - ry * l.vx) * 0.003
              nowIconHitHandler.current?.(ib.id, l.vx * 0.25, l.vy * 0.25, torque)
              lasers.splice(i, 1)
              hit = true
              break
            }
          }
        }

        if (hit) continue

        const tx = l.x - l.vx * 1.6, ty = l.y - l.vy * 1.6
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(l.x, l.y)
        ctx.strokeStyle = `rgba(255, 90, 140, ${l.life * 0.55})`
        ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.stroke()
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(l.x, l.y)
        ctx.strokeStyle = `rgba(255, 215, 230, ${l.life})`
        ctx.lineWidth = 1.2; ctx.stroke()
      }

      // --- Contrail trail ---
      trail.push({ x: ship.x, y: ship.y })
      if (trail.length > TRAIL_LENGTH) trail.shift()

      const speed = Math.hypot(ship.vx, ship.vy)
      if (speed > 0.5 && trail.length > 1) {
        for (let i = 0; i < trail.length - 1; i++) {
          const alpha  = (i / trail.length) * 0.45
          const radius = 0.4 + (i / trail.length) * 2.0
          ctx.beginPath()
          ctx.arc(trail[i].x, trail[i].y, radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(125, 211, 252, ${alpha})`
          ctx.fill()
        }
      }

      // --- Glow indicator (About page only — sits above polaroids at zIndex 8) ---
      if (activeSection.current === 'about') {
        const gr = glowCtx.createRadialGradient(ship.x, ship.y, 0, ship.x, ship.y, 22)
        gr.addColorStop(0,   'rgba(125, 211, 252, 0.28)')
        gr.addColorStop(0.5, 'rgba(125, 211, 252, 0.10)')
        gr.addColorStop(1,   'rgba(125, 211, 252, 0)')
        glowCtx.beginPath()
        glowCtx.arc(ship.x, ship.y, 22, 0, Math.PI * 2)
        glowCtx.fillStyle = gr
        glowCtx.fill()
      }

      // --- Draw ship ---
      drawShip(ctx, ship.x, ship.y, ship.angle, thrusting)

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      wrapRef.current = null
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
    }
  }, []) // eslint-disable-line

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }}
      />
      {/* Glow-only canvas sits above polaroids (zIndex 6) on the About page */}
      <canvas
        ref={glowCanvasRef}
        style={{ position: 'fixed', inset: 0, zIndex: 8, pointerEvents: 'none' }}
      />
    </>
  )
}
