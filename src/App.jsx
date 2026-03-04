import { useState, useEffect, useRef, useCallback } from 'react'
import StarField from './components/StarField'
import Spaceship from './components/Spaceship'
import LandingScreen from './components/LandingScreen'
import SectionScreen from './components/SectionScreen'
import NavMenu from './components/NavMenu'
import About from './sections/About'
import Now from './sections/Now'
import Projects from './sections/Projects'
import { activeSection, dockingState } from './store'

const IS_TOUCH = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

// World grid: each cell is 1 viewport wide × 1 viewport tall
// col/row = scroll position in units of viewport dimensions
const GRID = {
  landing:  { col: 1, row: 1 },
  about:    { col: 1, row: 0 },
  now:      { col: 2, row: 1 },
  resume:   { col: 1, row: 2 },
  projects: { col: 0, row: 1 },
}

// Reverse lookup: GRID_MAP[col][row] = sectionName
const GRID_MAP = {}
for (const [s, { col, row }] of Object.entries(GRID)) {
  if (!GRID_MAP[col]) GRID_MAP[col] = {}
  GRID_MAP[col][row] = s
}

const EDGE_DELTA = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] }

export default function App() {
  const [currentSection, setCurrentSection] = useState('landing')
  const [shipHasMoved, setShipHasMoved] = useState(false)

  const currentSectionRef  = useRef('landing')
  const isPanningRef       = useRef(false)
  const scrollContainerRef = useRef(null)
  const wrapRef            = useRef(null)
  const passableEdgesRef   = useRef(new Set())

  // Keep currentSectionRef in sync
  useEffect(() => { currentSectionRef.current = currentSection }, [currentSection])

  // Compute passable edges whenever section changes
  useEffect(() => {
    const { col, row } = GRID[currentSection]
    const edges = new Set()
    if (GRID_MAP[col]?.[row - 1]) edges.add('top')
    if (GRID_MAP[col]?.[row + 1]) edges.add('bottom')
    if (GRID_MAP[col - 1]?.[row]) edges.add('left')
    if (GRID_MAP[col + 1]?.[row]) edges.add('right')
    passableEdgesRef.current = edges
  }, [currentSection])

  // Set initial scroll to the landing cell on mount
  useEffect(() => {
    const el = scrollContainerRef.current
    el.scrollLeft = window.innerWidth
    el.scrollTop  = window.innerHeight
  }, [])

  // Snap scroll to current section on window resize (prevents drift)
  useEffect(() => {
    const snap = () => {
      if (isPanningRef.current) return
      const { col, row } = GRID[currentSectionRef.current]
      const el = scrollContainerRef.current
      if (el) {
        el.scrollLeft = col * window.innerWidth
        el.scrollTop  = row * window.innerHeight
      }
    }
    window.addEventListener('resize', snap)
    return () => window.removeEventListener('resize', snap)
  }, [])

  const handleFirstMove = useCallback(() => setShipHasMoved(true), [])

  const panTo = useCallback((dest, source = 'nav') => {
    if (isPanningRef.current || dest === currentSectionRef.current) return
    const fromSection = currentSectionRef.current
    const from = GRID[fromSection]
    const to   = GRID[dest]
    if (!from || !to) return

    const dc = to.col - from.col
    const dr = to.row - from.row

    // Extracted scroll logic — called either immediately (ship/edge pans)
    // or after the explosion animation finishes (nav pans)
    const startScroll = () => {
      isPanningRef.current  = true
      activeSection.current = null  // disable all section interactions during pan
      dockingState.current  = null  // undock ship on any navigation

      // Nav fly-in starts immediately as the camera begins moving so both arrive together
      if (source === 'nav') {
        wrapRef.current?.({
          type: 'nav-arrive',
          from: fromSection,
          to: dest,
        })
      }

      const el       = scrollContainerRef.current
      const startX   = el.scrollLeft
      const startY   = el.scrollTop
      const endX     = to.col * window.innerWidth
      const endY     = to.row * window.innerHeight
      const duration = 700
      const t0       = performance.now()

      const tick = (now) => {
        const t = Math.min((now - t0) / duration, 1)
        const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t  // ease-in-out quad
        el.scrollLeft = startX + (endX - startX) * e
        el.scrollTop  = startY + (endY - startY) * e
        if (t < 1) {
          requestAnimationFrame(tick)
        } else {
          setCurrentSection(dest)
          isPanningRef.current  = false
          activeSection.current = dest

          // Edge-exit pan: preserve existing wrap behavior
          if (source === 'ship') {
            const isAdjacent = Math.abs(dc) + Math.abs(dr) === 1
            wrapRef.current?.({
              type: 'edge-wrap',
              dx: isAdjacent ? dc : 0,
              dy: isAdjacent ? dr : 0,
            })
          }
        }
      }
      requestAnimationFrame(tick)
    }

    if (source === 'nav') {
      if (wrapRef.current) {
        // Trigger explosion; scroll starts only after the explosion callback fires
        wrapRef.current({
          type: 'nav-depart',
          from: fromSection,
          to: dest,
          dc,
          dr,
          onDone: startScroll,
        })
      } else {
        // No spaceship on mobile — scroll immediately
        startScroll()
      }
    } else {
      // Ship-triggered edge exit: start scroll immediately
      startScroll()
    }
  }, [])

  const handleExitEdge = useCallback((exitEdge) => {
    const { col, row } = GRID[currentSectionRef.current]
    const [dc, dr] = EDGE_DELTA[exitEdge]
    const dest = GRID_MAP[col + dc]?.[row + dr]
    if (dest) panTo(dest, 'ship')
  }, [panTo])

  return (
    <div
      ref={scrollContainerRef}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
    >
      <StarField />

      {/* World: 3×3 grid of viewport-sized cells */}
      <div style={{ position: 'absolute', width: '300vw', height: '300vh' }}>

        {/* Landing — col:1, row:1 */}
        <div style={{ position: 'absolute', left: '100vw', top: '100vh', width: '100vw', height: '100vh' }}>
          <LandingScreen hasMovedShip={shipHasMoved} />
        </div>

        {/* About — col:1, row:0 */}
        <div style={{ position: 'absolute', left: '100vw', top: 0, width: '100vw', height: '100vh' }}>
          <About isActive={currentSection === 'about'} />
        </div>

        {/* Now — col:2, row:1 */}
        <div style={{ position: 'absolute', left: '200vw', top: '100vh', width: '100vw', height: '100vh', overflow: 'hidden' }}>
          <Now isActive={currentSection === 'now'} />
        </div>

        {/* Resume — col:1, row:2 */}
        <div style={{ position: 'absolute', left: '100vw', top: '200vh', width: '100vw', height: '100vh' }}>
          <SectionScreen section="resume" isActive={currentSection === 'resume'} />
        </div>

        {/* Projects — col:0, row:1 */}
        <div style={{ position: 'absolute', left: 0, top: '100vh', width: '100vw', height: '100vh' }}>
          <Projects isActive={currentSection === 'projects'} />
        </div>

      </div>

      {!IS_TOUCH && (
        <Spaceship
          wrapRef={wrapRef}
          isPanningRef={isPanningRef}
          passableEdgesRef={passableEdgesRef}
          onExitEdge={handleExitEdge}
          onFirstMove={handleFirstMove}
        />
      )}

      <NavMenu
        screen={currentSection}
        onNavigate={(id) => panTo(id, 'nav')}
      />
    </div>
  )
}
