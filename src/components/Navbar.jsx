import { useState } from 'react'

const NAV_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'now', label: 'Lately' },
  { id: 'projects', label: 'Projects' },
  { id: 'resume', label: 'Resume' },
]

export default function Navbar({ activeSection, onNavigate, asteroidScore = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleNav = (id) => {
    setMenuOpen(false)
    onNavigate(id)
  }

  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: '56px',
    background: 'rgba(5, 7, 15, 0.6)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(100, 160, 220, 0.12)',
  }

  const logoStyle = {
    fontFamily: 'var(--font-display)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--star-white)',
    letterSpacing: '3px',
    userSelect: 'none',
    cursor: 'default',
  }

  const desktopNavStyle = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  }

  const navItemBase = {
    fontFamily: 'var(--font-display)',
    fontSize: '10px',
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 14px',
    borderRadius: '4px',
    transition: 'color 0.2s, background 0.2s',
  }

  return (
    <nav style={navStyle}>
      <div style={logoStyle}>
        {asteroidScore > 0
          ? <span style={{ color: 'var(--accent)', letterSpacing: '2px' }}>⬡ {asteroidScore}</span>
          : 'Z'
        }
      </div>

      {/* Desktop nav */}
      <div style={desktopNavStyle} className="desktop-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            style={{
              ...navItemBase,
              color: activeSection === item.id ? 'var(--accent)' : 'var(--text-muted)',
              background: activeSection === item.id ? 'var(--accent-dim)' : 'transparent',
            }}
            onMouseEnter={e => {
              if (activeSection !== item.id) {
                e.currentTarget.style.color = 'var(--star-white)'
              }
            }}
            onMouseLeave={e => {
              if (activeSection !== item.id) {
                e.currentTarget.style.color = 'var(--text-muted)'
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMenuOpen(o => !o)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '20px',
          display: 'none',
          padding: '4px',
        }}
        aria-label="Toggle menu"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '56px',
            left: 0,
            right: 0,
            background: 'rgba(5, 7, 15, 0.95)',
            borderBottom: '1px solid var(--panel-border)',
            padding: '12px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              style={{
                ...navItemBase,
                fontSize: '11px',
                textAlign: 'left',
                padding: '10px 32px',
                color: activeSection === item.id ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}
