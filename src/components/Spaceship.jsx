import { useEffect, useRef } from 'react'
import { shipPosition, polaroidBounds, polaroidHitHandler, satelliteBounds, satelliteHitHandler, dockingState, shipControlDisabled, nowIconBounds, nowIconHitHandler, monitorBounds } from '../store'

// --- Constants ---
const TURN_SPEED    = 0.06
const THRUST        = 0.12
const MAX_SPEED     = 6.5
const DRAG          = 0.987
const LASER_SPEED   = 14
const LASER_DECAY   = 0.024
const FIRE_COOLDOWN = 10
const ENTRY_FRAMES  = 55     // ~0.92 s at 60 fps
const SHIP_RADIUS   = 7
const INVINCIBLE_T  = 50
const EDGE_MARGIN   = 32     // px past edge that triggers exit
const WALL_INSET    = 14     // ship is clamped this many px inside screen edges (walls)
const TRAIL_LENGTH  = 12     // contrail history length
const FOCUS_DELAY   = 7000   // ms before focus indicator appears

// --- Helpers ---
function makeAsteroidShape(radius) {
  const n = 8 + Math.floor(Math.random() * 4)
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const r = radius * (0.6 + Math.random() * 0.6)
    return { x: Math.cos(a) * r, y: Math.sin(a) * r }
  })
}

function spawnAsteroid(w, h) {
  const edge = Math.floor(Math.random() * 4)
  const m = 55
  let x, y
  if      (edge === 0) { x = Math.random() * w; y = -m }
  else if (edge === 1) { x = w + m; y = Math.random() * h }
  else if (edge === 2) { x = Math.random() * w; y = h + m }
  else                 { x = -m; y = Math.random() * h }

  const radius   = 11 + Math.random() * 10
  const toCenter = Math.atan2(h / 2 - y, w / 2 - x)
  const speed    = 0.14 + Math.random() * 0.24
  return {
    x, y,
    vx: Math.cos(toCenter) * speed + (Math.random() - 0.5) * 0.35,
    vy: Math.sin(toCenter) * speed + (Math.random() - 0.5) * 0.35,
    angle: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.016,
    radius,
    shape: makeAsteroidShape(radius),
  }
}

// Entry config per edge: where ship spawns and where it aims
function getEntryConfig(entryEdge, w, h, isSection) {
  switch (entryEdge) {
    case 'top':
      return { sx: w / 2, sy: -60, tx: w / 2, ty: isSection ? h * 0.11 : h * 0.26, angle: Math.PI }
    case 'left':
      return { sx: -60, sy: h / 2, tx: isSection ? w * 0.11 : w * 0.26, ty: h / 2, angle: Math.PI / 2 }
    case 'right':
      return { sx: w + 60, sy: h / 2, tx: isSection ? w * 0.89 : w * 0.74, ty: h / 2, angle: -Math.PI / 2 }
    default: // 'bottom' or null (first load)
      return { sx: w / 2, sy: h + 60, tx: w / 2, ty: isSection ? h * 0.89 : h * 0.74, angle: 0 }
  }
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

function drawAsteroid(ctx, a) {
  ctx.save()
  ctx.translate(a.x, a.y)
  ctx.rotate(a.angle)
  ctx.beginPath()
  a.shape.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.closePath()
  ctx.fillStyle = 'rgba(40, 60, 100, 0.4)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(140, 175, 215, 0.72)'
  ctx.lineWidth = 1.4
  ctx.stroke()
  ctx.restore()
}

const easeOutCubic = (t) => 1 - (1 - t) ** 3

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
  entryEdge        = null,
  isSection        = false,
  returnEdge       = null,
  onExitEdge,
  onFirstMove,
  cardBoundsRef,
}) {
  const callbackRef    = useRef(null)
  const onExitEdgeRef  = useRef(onExitEdge)
  const onFirstMoveRef = useRef(onFirstMove)
  const canvasRef      = useRef(null)

  useEffect(() => { onExitEdgeRef.current = onExitEdge },          [onExitEdge])
  useEffect(() => { onFirstMoveRef.current = onFirstMove },         [onFirstMove])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let animId

    const _entryEdge  = entryEdge
    const _isSection  = isSection
    const _returnEdge = returnEdge

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const initialDelay = _entryEdge === null ? 30 : 0

    const ship = { x: 0, y: 0, angle: 0, vx: 0, vy: 0 }
    let entryCountdown = initialDelay
    let entryProgress  = -1
    let entrySX = 0, entrySY = 0, entryTX = 0, entryTY = 0
    let hasEntered     = false
    let firstMoveFired = false
    let shipInvincible = 0
    let shipGone       = false

    // Contrail trail buffer
    const trail = []

    // Focus indicator
    let lastInputTime   = Date.now()
    let focusOpacity    = 0

    const maxAsteroids = _isSection ? 0 : 8
    const lasers       = []
    const asteroids    = Array.from({ length: maxAsteroids }, () =>
      spawnAsteroid(canvas.width, canvas.height)
    )
    const particles    = []
    const respawnQueue = []
    let laserCooldown  = 0

    const keys = {}
    const onKeyDown = (e) => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault() }
    const onKeyUp   = (e) => { keys[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)

    function explode(x, y, radius) {
      const count = 7 + Math.floor(radius / 5)
      for (let i = 0; i < count; i++) {
        const ang   = (i / count) * Math.PI * 2 + Math.random() * 0.9
        const speed = radius * 0.08 + Math.random() * 2.2
        particles.push({
          x, y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          life: 1.0,
          decay: 0.024 + Math.random() * 0.018,
          r: 1.2 + Math.random() * 2.2,
        })
      }
    }

    function destroyAsteroid(idx) {
      const a = asteroids[idx]
      explode(a.x, a.y, a.radius)
      asteroids.splice(idx, 1)
      callbackRef.current?.()
      respawnQueue.push(60)
    }

    const draw = (t = 0) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const w = canvas.width
      const h = canvas.height

      // --- Respawn queue ---
      if (!shipGone) {
        for (let i = respawnQueue.length - 1; i >= 0; i--) {
          respawnQueue[i]--
          if (respawnQueue[i] <= 0) {
            respawnQueue.splice(i, 1)
            if (asteroids.length < maxAsteroids) asteroids.push(spawnAsteroid(w, h))
          }
        }
      }

      // --- Asteroids ---
      for (const a of asteroids) {
        a.x += a.vx;  a.y += a.vy;  a.angle += a.rotSpeed
        if (a.x < -a.radius - 30) a.x = w + a.radius
        if (a.x > w + a.radius + 30) a.x = -a.radius
        if (a.y < -a.radius - 30) a.y = h + a.radius
        if (a.y > h + a.radius + 30) a.y = -a.radius
        drawAsteroid(ctx, a)
      }

      // --- Particles ---
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx;  p.y += p.vy;  p.life -= p.decay
        if (p.life <= 0) { particles.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2)
        const g = (150 + ((1 - p.life) * 60)) | 0
        ctx.fillStyle = `rgba(255, ${g}, 55, ${p.life})`
        ctx.fill()
      }

      if (shipGone) { animId = requestAnimationFrame(draw); return }

      // --- Entry animation ---
      if (!hasEntered) {
        if (entryCountdown > 0) { entryCountdown--; animId = requestAnimationFrame(draw); return }

        if (entryProgress === -1) {
          entryProgress = 0
          trail.length = 0   // clear trail on entry
          const cfg = getEntryConfig(_entryEdge, w, h, _isSection)
          ship.x = cfg.sx;  ship.y = cfg.sy;  ship.angle = cfg.angle
          ship.vx = 0;  ship.vy = 0
          entrySX = cfg.sx;  entrySY = cfg.sy;  entryTX = cfg.tx;  entryTY = cfg.ty
        }

        entryProgress++
        const t2   = Math.min(entryProgress / ENTRY_FRAMES, 1)
        const ease = easeOutCubic(t2)
        ship.x = entrySX + ease * (entryTX - entrySX)
        ship.y = entrySY + ease * (entryTY - entrySY)

        // Export position even during entry
        shipPosition.current = { x: ship.x, y: ship.y }

        drawShip(ctx, ship.x, ship.y, ship.angle, true)

        if (entryProgress >= ENTRY_FRAMES) {
          hasEntered = true
          ship.x = entryTX;  ship.y = entryTY
          ship.vx = 0;  ship.vy = 0
          lastInputTime = Date.now()  // reset focus timer after entry
        }

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

          // Draw contrail while docked (empty since no movement)
          // Draw ship at docked position
          const showShip = shipInvincible === 0 || Math.floor(shipInvincible / 4) % 2 === 0
          if (showShip) drawShip(ctx, ship.x, ship.y, ship.angle, false)

          animId = requestAnimationFrame(draw)
          return
        }
        // satBound not found — fall through to normal physics
      }

      // --- Normal gameplay ---
      if (shipInvincible > 0) shipInvincible--

      const anyInput = keys['ArrowLeft'] || keys['ArrowRight'] || keys['ArrowUp']

      if (!shipControlDisabled.current) {
        if (keys['ArrowLeft'])  ship.angle -= TURN_SPEED
        if (keys['ArrowRight']) ship.angle += TURN_SPEED

        const thrusting = !!keys['ArrowUp']
        if (thrusting) {
          ship.vx += Math.sin(ship.angle) * THRUST
          ship.vy -= Math.cos(ship.angle) * THRUST
          const spd = Math.hypot(ship.vx, ship.vy)
          if (spd > MAX_SPEED) { ship.vx *= MAX_SPEED / spd; ship.vy *= MAX_SPEED / spd }
        }
      }

      const thrusting = !!keys['ArrowUp'] && !shipControlDisabled.current

      ship.vx *= DRAG;  ship.vy *= DRAG
      ship.x  += ship.vx;  ship.y  += ship.vy

      // Track last input time for focus indicator
      if (anyInput) lastInputTime = Date.now()

      // Fire onFirstMove on the first key input
      if (!firstMoveFired && anyInput) {
        firstMoveFired = true
        onFirstMoveRef.current?.()
      }

      // Export position to store (read by Projects satellites)
      shipPosition.current = { x: ship.x, y: ship.y }

      // --- Edge detection ---
      if (_isSection) {
        if ('top'    !== _returnEdge && ship.y < WALL_INSET)   { ship.y = WALL_INSET;   if (ship.vy < 0) ship.vy = 0 }
        if ('bottom' !== _returnEdge && ship.y > h-WALL_INSET) { ship.y = h-WALL_INSET; if (ship.vy > 0) ship.vy = 0 }
        if ('left'   !== _returnEdge && ship.x < WALL_INSET)   { ship.x = WALL_INSET;   if (ship.vx < 0) ship.vx = 0 }
        if ('right'  !== _returnEdge && ship.x > w-WALL_INSET) { ship.x = w-WALL_INSET; if (ship.vx > 0) ship.vx = 0 }
      }
      if (!shipGone) {
        if (ship.y < -EDGE_MARGIN  && (!_isSection || _returnEdge === 'top'))    { shipGone = true; onExitEdgeRef.current?.('top') }
        if (ship.y > h+EDGE_MARGIN && (!_isSection || _returnEdge === 'bottom')) { shipGone = true; onExitEdgeRef.current?.('bottom') }
        if (ship.x < -EDGE_MARGIN  && (!_isSection || _returnEdge === 'left'))   { shipGone = true; onExitEdgeRef.current?.('left') }
        if (ship.x > w+EDGE_MARGIN && (!_isSection || _returnEdge === 'right'))  { shipGone = true; onExitEdgeRef.current?.('right') }
      }

      if (shipGone) { trail.length = 0; animId = requestAnimationFrame(draw); return }

      // --- Card collision (section screens only) ---
      resolveCardCollision(ship, cardBoundsRef?.current)

      // --- Monitor collision (About page) ---
      if (monitorBounds.current) {
        resolveCardCollision(ship, monitorBounds.current)
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
      if (laserCooldown > 0) laserCooldown--
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
        l.x += l.vx;  l.y += l.vy;  l.life -= LASER_DECAY
        if (l.life <= 0) { lasers.splice(i, 1); continue }

        let hit = false

        // Check asteroid hits
        for (let j = asteroids.length - 1; j >= 0; j--) {
          if (Math.hypot(l.x - asteroids[j].x, l.y - asteroids[j].y) < asteroids[j].radius + 4) {
            destroyAsteroid(j)
            lasers.splice(i, 1)
            hit = true
            break
          }
        }

        // Check polaroid hits (About page) — read from shared store
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

        // Check satellite hits (Projects page) — circle collision
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

        // Check Now icon hits (Now page) — circle collision
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

      // --- Ship–asteroid collision ---
      if (shipInvincible === 0) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
          if (Math.hypot(ship.x - asteroids[j].x, ship.y - asteroids[j].y) < SHIP_RADIUS + asteroids[j].radius) {
            destroyAsteroid(j)
            shipInvincible = INVINCIBLE_T
            break
          }
        }
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

      // --- Focus indicator ---
      const timeSinceInput = Date.now() - lastInputTime
      if (timeSinceInput > FOCUS_DELAY) {
        focusOpacity = Math.min(1, focusOpacity + 0.04)
      } else {
        focusOpacity = Math.max(0, focusOpacity - 0.07)
      }

      if (focusOpacity > 0.01) {
        const pulse = Math.sin(t * 0.003) * 0.3 + 0.7
        const alpha = focusOpacity * pulse
        const ringR = 22

        ctx.save()
        ctx.translate(ship.x, ship.y)

        // Outer ring
        ctx.beginPath()
        ctx.arc(0, 0, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Four inward-pointing chevrons at N/S/E/W
        const chevronSize = 4
        const chevronDist = ringR + 7
        const dirs = [
          { angle: 0,             dx: 0,            dy: -chevronDist },
          { angle: Math.PI,       dx: 0,            dy:  chevronDist },
          { angle: -Math.PI / 2,  dx: -chevronDist, dy: 0 },
          { angle: Math.PI / 2,   dx:  chevronDist, dy: 0 },
        ]
        ctx.fillStyle = `rgba(125, 211, 252, ${alpha})`
        dirs.forEach(d => {
          ctx.save()
          ctx.translate(d.dx, d.dy)
          ctx.rotate(d.angle)
          ctx.beginPath()
          ctx.moveTo(0, chevronSize)
          ctx.lineTo(-chevronSize * 0.6, -chevronSize * 0.5)
          ctx.lineTo( chevronSize * 0.6, -chevronSize * 0.5)
          ctx.closePath()
          ctx.fill()
          ctx.restore()
        })

        ctx.restore()
      }

      // --- Draw ship ---
      const showShip = shipInvincible === 0 || Math.floor(shipInvincible / 4) % 2 === 0
      if (showShip) drawShip(ctx, ship.x, ship.y, ship.angle, thrusting)

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
    }
  }, []) // eslint-disable-line

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }}
    />
  )
}
