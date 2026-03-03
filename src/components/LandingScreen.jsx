const IS_TOUCH = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

const HINT_COLOR  = 'rgba(125, 211, 252, 0.88)'
const ARROW_COLOR = 'rgba(125, 211, 252, 0.82)'

const EDGE_HINTS = [
  { dir: 'top',    arrow: '↑', label: 'ABOUT',    style: { top: '7%',    left: '50%', transform: 'translateX(-50%)', flexDirection: 'column',         alignItems: 'center' } },
  { dir: 'right',  arrow: '→', label: 'LATELY',   style: { right: '5%',  top: '50%',  transform: 'translateY(-50%)', flexDirection: 'row-reverse',    alignItems: 'center' } },
  { dir: 'bottom', arrow: '↓', label: 'RESUME',   style: { bottom: '7%', left: '50%', transform: 'translateX(-50%)', flexDirection: 'column-reverse', alignItems: 'center' } },
  { dir: 'left',   arrow: '←', label: 'PROJECTS', style: { left: '5%',   top: '50%',  transform: 'translateY(-50%)', flexDirection: 'row',            alignItems: 'center' } },
]

export default function LandingScreen({ hasMovedShip }) {
  return (
    <>
      {/* Name + subtitle — centered */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
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
          }}
        >
          ZACHARY DEXTER
        </div>

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(8px, 1vw, 12px)',
            letterSpacing: 'clamp(4px, 0.8vw, 7px)',
            color: 'rgba(125, 211, 252, 0.82)',
            marginTop: '10px',
            textTransform: 'uppercase',
          }}
        >
          SOFTWARE DEVELOPER
        </div>

        {/* Controls hint — pulse until ship first moves, hidden on mobile */}
        {!IS_TOUCH && (
          <div
            className={hasMovedShip ? 'ctrl-hint--passive' : 'ctrl-hint--active'}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '9px',
              letterSpacing: '3px',
              marginTop: '36px',
            }}
          >
            ARROWS TO FLY  ·  SPACE TO SHOOT
          </div>
        )}
      </div>

      {/* Edge directional hints — desktop only (EdgeBeacons handles mobile) */}
      {!IS_TOUCH && EDGE_HINTS.map(({ dir, arrow, label, style }) => (
        <div
          key={dir}
          style={{
            position: 'fixed', zIndex: 1, pointerEvents: 'none',
            display: 'flex', gap: '7px',
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
