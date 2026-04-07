import { useState, useRef, useEffect } from 'react'

const IS_TOUCH = typeof window !== 'undefined' && !window.matchMedia('(any-hover: hover)').matches && navigator.maxTouchPoints > 0

const NAV_ITEMS = [
  { id: 'landing', label: 'HOME' },
  { id: 'about',   label: 'ABOUT' },
  { id: 'projects',label: 'PROJECTS' },
  { id: 'now',     label: 'LATELY' },
  { id: 'resume',  label: 'RESUME' },
]

export default function NavMenu({ screen, onNavigate }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside (mobile)
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  const handleNav = (id) => {
    setOpen(false)
    onNavigate(id)
  }

  const containerProps = IS_TOUCH
    ? { onClick: () => setOpen(o => !o) }
    : { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) }

  return (
    <div
      ref={menuRef}
      {...containerProps}
      style={{
        position: 'fixed',
        top: 16,
        right: 20,
        zIndex: 200,
        userSelect: 'none',
        paddingBottom: open ? '8px' : 0,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: open ? 'rgba(125,211,252,0.12)' : 'rgba(30,40,60,0.55)',
          border: `1px solid ${open ? 'rgba(125,211,252,0.35)' : 'rgba(125,211,252,0.15)'}`,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          cursor: 'pointer',
          transition: 'background 0.18s, border-color 0.18s',
          color: open ? 'rgba(125,211,252,0.95)' : 'rgba(200,220,255,0.6)',
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ⊕
      </div>

      {/* Dropdown panel */}
      <div
        style={{
          position: 'absolute',
          top: 44,
          right: 0,
          minWidth: 160,
          background: 'rgba(8,12,24,0.92)',
          border: '1px solid rgba(125,211,252,0.18)',
          borderRadius: 10,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '6px 0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.97)',
          transformOrigin: 'top right',
          transition: 'opacity 0.16s ease, transform 0.16s ease',
        }}
      >
        {NAV_ITEMS.map((item, i) => {
          const isActive = item.id === screen || (item.id === 'landing' && screen === 'landing')
          return (
            <button
              key={item.id}
              onClick={(e) => { if (!isActive) { e.stopPropagation(); handleNav(item.id) } }}
              style={{
                display: 'block',
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '9px 20px',
                textAlign: 'left',
                fontFamily: 'var(--font-display)',
                fontSize: '10px',
                letterSpacing: '2px',
                color: isActive
                  ? 'rgba(125,211,252,0.35)'
                  : 'rgba(200,220,255,0.75)',
                cursor: isActive ? 'default' : 'pointer',
                transition: 'color 0.15s, background 0.15s',
                borderTop: i === 1 ? '1px solid rgba(125,211,252,0.1)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.color = 'rgba(125,211,252,0.95)'
                if (!isActive) e.currentTarget.style.background = 'rgba(125,211,252,0.06)'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.color = 'rgba(200,220,255,0.75)'
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              {isActive ? `· ${item.label}` : item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
