import { useState, useEffect, useRef } from 'react'

const IS_TOUCH = typeof window !== 'undefined' && !window.matchMedia('(any-hover: hover)').matches && navigator.maxTouchPoints > 0

const HINT_COLOR  = 'rgba(125, 211, 252, 0.88)'
const ARROW_COLOR = 'rgba(125, 211, 252, 0.82)'

const FULL_TITLE = 'ZACHARY DEXTER'
const FULL_SUB   = 'SOFTWARE DEVELOPER'

const EDGE_HINTS = [
  { dir: 'top',    arrow: '↑', label: 'ABOUT',    style: { top: '7%',    left: '50%', transform: 'translateX(-50%)', flexDirection: 'column',         alignItems: 'center' } },
  { dir: 'right',  arrow: '→', label: 'LATELY',   style: { right: '5%',  top: '50%',  transform: 'translateY(-50%)', flexDirection: 'row-reverse',    alignItems: 'center' } },
  { dir: 'bottom', arrow: '↓', label: 'RESUME',   style: { bottom: '7%', left: '50%', transform: 'translateX(-50%)', flexDirection: 'column-reverse', alignItems: 'center' } },
  { dir: 'left',   arrow: '←', label: 'PROJECTS', style: { left: '5%',   top: '50%',  transform: 'translateY(-50%)', flexDirection: 'row',            alignItems: 'center' } },
]

export default function LandingScreen({ hasMovedShip }) {
  const [title, setTitle]           = useState('')
  const [sub, setSub]               = useState('')
  const [ctrlOpacity, setCtrlOpacity] = useState(0)
  const [edgeOpacity, setEdgeOpacity] = useState(0)

  useEffect(() => {
    let i = 0
    const t1 = setInterval(() => {
      i++
      setTitle(FULL_TITLE.slice(0, i))
      if (i === FULL_TITLE.length) clearInterval(t1)
    }, 55)

    let subInterval
    const t2 = setTimeout(() => {
      let j = 0
      subInterval = setInterval(() => {
        j++
        setSub(FULL_SUB.slice(0, j))
        if (j === FULL_SUB.length) clearInterval(subInterval)
      }, 35)
    }, 200)

    const t3 = setTimeout(() => setCtrlOpacity(1), 1300)
    const t4 = setTimeout(() => setEdgeOpacity(1), 1700)

    return () => {
      clearInterval(t1)
      clearTimeout(t2)
      clearInterval(subInterval)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  return (
    <>
      {/* Name + subtitle — centered */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 4vw, 48px)',
            fontWeight: 900,
            letterSpacing: 'clamp(5px, 1vw, 11px)',
            color: 'var(--star-white)',
            textTransform: 'uppercase',
            opacity: 0.95,
            textShadow: '0 0 30px rgba(125,211,252,0.30)',
            minHeight: '1em',
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(8px, 1vw, 12px)',
            letterSpacing: 'clamp(4px, 0.8vw, 7px)',
            color: 'rgba(125, 211, 252, 0.82)',
            marginTop: '10px',
            textTransform: 'uppercase',
            minHeight: '1em',
          }}
        >
          {sub}
        </div>

        {/* Controls hint — always in DOM to reserve space (prevents layout shift); fades in after typewriter */}
        {/* Outer div owns the fade-in opacity; inner div owns the pulse animation — they multiply correctly */}
        {!IS_TOUCH && (
          <div
            style={{
              marginTop: '36px',
              opacity: ctrlOpacity,
              transition: 'opacity 0.6s ease',
              pointerEvents: ctrlOpacity > 0 ? 'auto' : 'none',
            }}
          >
            <div
              className={hasMovedShip ? 'ctrl-hint--passive' : 'ctrl-hint--active'}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '9px',
                letterSpacing: '3px',
              }}
            >
              WASD / ARROWS TO FLY  ·  SPACE TO SHOOT
            </div>
          </div>
        )}
      </div>

      {/* Edge directional hints — desktop only, always rendered, staggered fade-in after controls hint */}
      {!IS_TOUCH && EDGE_HINTS.map(({ dir, arrow, label, style }) => (
        <div
          key={dir}
          style={{
            position: 'absolute', zIndex: 1, pointerEvents: 'none',
            display: 'flex', gap: '7px',
            opacity: edgeOpacity,
            transition: 'opacity 0.6s ease',
            ...style,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              color: ARROW_COLOR,
              lineHeight: 1,
              textShadow: '0 0 16px rgba(125,211,252,0.50)',
            }}
          >
            {arrow}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '9px',
              letterSpacing: '3.5px',
              color: HINT_COLOR,
              textTransform: 'uppercase',
              textShadow: '0 0 10px rgba(125,211,252,0.35)',
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </>
  )
}
