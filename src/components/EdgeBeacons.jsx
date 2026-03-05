import { useState, useRef, useEffect } from 'react'

const IS_TOUCH = typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches)

// Edge → section mapping (same as landing exit directions)
const EDGE_TO_SECTION = { top: 'about', right: 'now', bottom: 'resume', left: 'projects' }

// Section → which edge the ship flies off to return home
const RETURN_EDGE = { about: 'bottom', now: 'left', projects: 'right', resume: 'top' }

const BEACONS = [
  {
    edge: 'top',
    label: 'ABOUT',
    arrow: '↑',
    style: { top: 0, left: '50%', transform: 'translateX(-50%)' },
    flexDir: 'column',
    expandPad: '10px 20px 13px',
    compactPad: '4px 20px 6px',
    radius: '0 0 10px 10px',
  },
  {
    edge: 'right',
    label: 'LATELY',
    arrow: '→',
    style: { right: 0, top: '50%', transform: 'translateY(-50%)' },
    flexDir: 'row-reverse',
    expandPad: '10px 12px 10px 18px',
    compactPad: '10px 4px 10px 8px',
    radius: '10px 0 0 10px',
  },
  {
    edge: 'bottom',
    label: 'RESUME',
    arrow: '↓',
    style: { bottom: 0, left: '50%', transform: 'translateX(-50%)' },
    flexDir: 'column-reverse',
    expandPad: '13px 20px 10px',
    compactPad: '6px 20px 4px',
    radius: '10px 10px 0 0',
  },
  {
    edge: 'left',
    label: 'PROJECTS',
    arrow: '←',
    style: { left: 0, top: '50%', transform: 'translateY(-50%)' },
    flexDir: 'row',
    expandPad: '10px 18px 10px 12px',
    compactPad: '10px 8px 10px 4px',
    radius: '0 10px 10px 0',
  },
]

export default function EdgeBeacons({ screen, onNavigate }) {
  const [hovered, setHovered] = useState(null)
  const leaveTimerRef = useRef(null)
  const isLanding = screen === 'landing'

  useEffect(() => () => clearTimeout(leaveTimerRef.current), [])

  const handleClick = (beacon) => {
    if (isLanding) {
      onNavigate(EDGE_TO_SECTION[beacon.edge])
    } else {
      // Return edge → go home; anything else → go to that section
      if (RETURN_EDGE[screen] === beacon.edge) {
        onNavigate('landing')
      } else {
        onNavigate(EDGE_TO_SECTION[beacon.edge])
      }
    }
  }

  return (
    <>
      {BEACONS.map((beacon) => {
        const isCurrentSection = !isLanding && screen === EDGE_TO_SECTION[beacon.edge]
        const isReturnEdge     = !isLanding && RETURN_EDGE[screen] === beacon.edge
        const isActive         = !isCurrentSection
        const isHov            = hovered === beacon.edge
        const expanded         = IS_TOUCH || isHov

        // Label shown on the beacon
        const displayLabel = isReturnEdge ? 'RETURN' : beacon.label

        // Color logic
        let color
        if (isCurrentSection) {
          color = 'rgba(125,211,252,0.20)'
        } else if (isReturnEdge) {
          color = 'rgba(125,211,252,1.0)'
        } else if (expanded) {
          color = 'rgba(125,211,252,0.88)'
        } else {
          color = 'rgba(125,211,252,0.42)'
        }

        // Border color
        const borderColor = isReturnEdge
          ? 'rgba(125,211,252,0.45)'
          : expanded
            ? 'rgba(125,211,252,0.22)'
            : 'rgba(125,211,252,0.08)'

        const bgColor = expanded
          ? 'rgba(5, 8, 18, 0.82)'
          : 'rgba(5, 8, 18, 0.20)'

        return (
          <button
            key={beacon.edge}
            onClick={() => isActive && handleClick(beacon)}
            onMouseEnter={() => {
              if (!isActive || IS_TOUCH) return
              clearTimeout(leaveTimerRef.current)
              setHovered(beacon.edge)
            }}
            onMouseLeave={() => {
              leaveTimerRef.current = setTimeout(() => setHovered(null), 500)
            }}
            style={{
              position: 'fixed',
              ...beacon.style,
              zIndex: 15,
              display: 'flex',
              flexDirection: beacon.flexDir,
              alignItems: 'center',
              gap: '5px',
              fontFamily: 'var(--font-display)',
              color,
              background: bgColor,
              backdropFilter: expanded ? 'blur(12px)' : 'none',
              WebkitBackdropFilter: expanded ? 'blur(12px)' : 'none',
              border: `1px solid ${borderColor}`,
              borderRadius: beacon.radius,
              padding: expanded ? beacon.expandPad : beacon.compactPad,
              cursor: isActive ? 'pointer' : 'default',
              transition: 'color 0.22s, background 0.22s, border-color 0.22s, padding 0.22s, backdrop-filter 0.22s',
              userSelect: 'none',
              pointerEvents: 'auto',
            }}
          >
            {/* Arrow */}
            <span style={{
              fontSize: expanded ? '18px' : '13px',
              lineHeight: 1,
              transition: 'font-size 0.22s',
            }}>
              {beacon.arrow}
            </span>

            {/* Label — slides in on expand */}
            <span style={{
              fontSize: '7px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              opacity: expanded ? 1 : 0,
              maxWidth: expanded ? '80px' : '0',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.20s, max-width 0.22s',
            }}>
              {displayLabel}
            </span>
          </button>
        )
      })}
    </>
  )
}
