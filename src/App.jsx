import { useState, useRef, useCallback } from 'react'
import StarField from './components/StarField'
import Spaceship from './components/Spaceship'
import LandingScreen from './components/LandingScreen'
import SectionScreen from './components/SectionScreen'
import NavMenu from './components/NavMenu'

const IS_TOUCH = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

const EXIT_SECTION = { top: 'about', right: 'now', left: 'projects', bottom: 'resume' }
const RETURN_EDGE  = { about: 'bottom', now: 'left', projects: 'right', resume: 'top' }
const OPPOSITE     = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

// Softer blue hyperspace burst — less jarring than the old near-white flash
function WarpFlash({ active }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(140,210,255,0.65) 0%, rgba(80,160,255,0.28) 55%, transparent 100%)',
        opacity: active ? 1 : 0,
        transition: active ? 'opacity 0.14s ease-in' : 'opacity 0.38s ease-out',
      }}
    />
  )
}

export default function App() {
  const [screen, setScreen]               = useState('landing')
  const [entryEdge, setEntryEdge]         = useState(null)
  const [isWarping, setIsWarping]         = useState(false)
  const [spaceshipKey, setSpaceshipKey]   = useState(0)
  const [shipHasMoved, setShipHasMoved]   = useState(false)
  const cardBoundsRef = useRef(null)

  const handleFirstMove = useCallback(() => setShipHasMoved(true), [])

  const warpTo = useCallback((destScreen, destEntryEdge) => {
    setIsWarping(true)
    // Reset ship-moved state when navigating (so hint re-animates on new screen)
    // Actually keep it once moved — user already knows controls
    setTimeout(() => {
      setScreen(destScreen)
      setEntryEdge(destEntryEdge)
      setSpaceshipKey(k => k + 1)
      cardBoundsRef.current = null
    }, 150)
    setTimeout(() => setIsWarping(false), 490)
  }, [])

  const handleExitEdge = useCallback((exitEdge) => {
    if (screen === 'landing') {
      const dest = EXIT_SECTION[exitEdge]
      if (!dest) return
      warpTo(dest, OPPOSITE[exitEdge])
    } else {
      if (exitEdge !== RETURN_EDGE[screen]) return
      warpTo('landing', OPPOSITE[exitEdge])
    }
  }, [screen, warpTo])

  const navigateTo = useCallback((destSection) => {
    if (destSection === screen) return
    let entry
    if (destSection === 'landing') {
      entry = OPPOSITE[RETURN_EDGE[screen]] ?? 'bottom'
    } else {
      const exitDir = Object.keys(EXIT_SECTION).find(k => EXIT_SECTION[k] === destSection)
      entry = exitDir ? OPPOSITE[exitDir] : 'bottom'
    }
    warpTo(destSection, entry)
  }, [screen, warpTo])

  const returnEdge = screen !== 'landing' ? RETURN_EDGE[screen] : null

  // Full-viewport sections bypass SectionScreen's card (ship flies freely, no card collision)
  const FULL_VIEWPORT = ['about', 'projects', 'now']
  const isFullViewport = FULL_VIEWPORT.includes(screen)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <StarField />

      {screen === 'landing'
        ? <LandingScreen hasMovedShip={shipHasMoved} />
        : <SectionScreen
            section={screen}
            onBoundsChange={b => { cardBoundsRef.current = isFullViewport ? null : b }}
          />
      }

      {/* Ship only on desktop; full-viewport sections have no card collision */}
      {!IS_TOUCH && (
        <Spaceship
          key={spaceshipKey}
          entryEdge={entryEdge}
          isSection={screen !== 'landing'}
          returnEdge={returnEdge}
          onExitEdge={handleExitEdge}
          onFirstMove={handleFirstMove}
          cardBoundsRef={isFullViewport ? { current: null } : cardBoundsRef}
        />
      )}

      <NavMenu screen={screen} onNavigate={navigateTo} />

      <WarpFlash active={isWarping} />
    </div>
  )
}
