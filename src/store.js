// Shared mutable refs used across canvas boundaries.
// Plain objects (not React state) so canvas loops can read/write without triggering re-renders.

// Ship position — written by Spaceship.jsx every frame, read by Projects.jsx for proximity detection
export const shipPosition = { current: { x: 0, y: 0 } }

// Polaroid bounding boxes — written by About.jsx every frame, read by Spaceship.jsx for laser collision
// Each entry: { id: string, x: number, y: number, w: number, h: number }
export const polaroidBounds = { current: [] }

// About.jsx registers a hit handler here on mount, clears on unmount
// Spaceship calls this when a laser hits a polaroid: handler(id: string)
export const polaroidHitHandler = { current: null }

// Satellite bounding circles — written by Projects.jsx canvas loop every frame
// Each entry: { id: string, x: number, y: number, r: number }
export const satelliteBounds = { current: [] }

// Projects.jsx registers a hit handler here on mount, clears on unmount
// Spaceship calls this when a laser hits a satellite: handler(id: string)
export const satelliteHitHandler = { current: null }

// Docking state — written by Projects.jsx when ship docks, read by Spaceship.jsx
// null = undocked; { satelliteId, offsetX, offsetY } = docked
export const dockingState = { current: null }

// Ship control disable — set by About.jsx when enlarged photo overlay is open
// Spaceship skips thrust/rotation input when true (but continues applying drag/velocity)
export const shipControlDisabled = { current: false }

// Now.jsx floating icon circles — written every frame, read by Spaceship for collision
// Each entry: { id: string, cx: number, cy: number, r: number }
export const nowIconBounds = { current: [] }

// Now.jsx registers a hit handler on mount, clears on unmount
// Called by Spaceship when ship or laser hits an icon: handler(id, dvx, dvy, dvr)
export const nowIconHitHandler = { current: null }

// Monitor bounding box — written by About.jsx CRTMonitor, cleared on unmount
// { x: number, y: number, w: number, h: number } in viewport coords
export const monitorBounds = { current: null }

// Active section — written by App.jsx immediately when a pan starts/ends
// Sections gate their rAF loops with this to avoid stale bounds / ghost interactions
export const activeSection = { current: 'landing' }
