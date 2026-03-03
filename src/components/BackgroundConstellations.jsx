// Decorative background constellations — star positions only, no connecting lines.
// Placed around the edges of the SVG so they don't compete with the main Z.
// All coordinates are in the SVG logical space matching VB_FULL = '-120 -100 1240 1000'

const BG_CONSTELLATIONS = [
  // Cassiopeia (W shape) — top-left corner
  {
    id: 'cassiopeia',
    stars: [
      { x: -75, y: 55,  r: 1.7 },
      { x: -42, y: 10,  r: 1.3 },
      { x:  -5, y: 50,  r: 2.0 },
      { x:  32, y: 8,   r: 1.4 },
      { x:  68, y: 48,  r: 1.6 },
    ],
  },

  // Little Dipper (Ursa Minor) — top-right corner
  // Handle tip = Polaris; bowl opens toward center
  {
    id: 'little_dipper',
    stars: [
      { x: 940, y: 28,  r: 1.9 }, // Polaris — tip of handle
      { x: 972, y: 55,  r: 1.3 },
      { x: 1005, y: 42, r: 1.4 },
      { x: 1032, y: 18, r: 1.5 }, // bowl corner
      { x: 1068, y: 32, r: 1.7 }, // Kochab
      { x: 1065, y: 68, r: 1.3 },
      { x: 1028, y: 60, r: 1.2 },
    ],
  },

  // Orion (simplified) — lower-right area
  {
    id: 'orion',
    stars: [
      { x: 998,  y: 460, r: 2.2 }, // Betelgeuse (top-left shoulder, large red)
      { x: 1082, y: 472, r: 1.7 }, // Bellatrix  (top-right shoulder)
      { x: 985,  y: 545, r: 1.5 }, // Alnitak    (belt left)
      { x: 1022, y: 542, r: 1.8 }, // Alnilam    (belt center)
      { x: 1058, y: 539, r: 1.5 }, // Mintaka    (belt right)
      { x: 992,  y: 638, r: 1.6 }, // Saiph      (foot left)
      { x: 1080, y: 622, r: 2.2 }, // Rigel      (foot right, bright)
    ],
  },

  // Pleiades cluster — top center-left
  {
    id: 'pleiades',
    stars: [
      { x: 380, y: -55, r: 2.0 }, // Alcyone (brightest)
      { x: 403, y: -72, r: 1.4 }, // Atlas
      { x: 422, y: -44, r: 1.5 }, // Electra
      { x: 360, y: -68, r: 1.3 }, // Merope
      { x: 395, y: -88, r: 1.6 }, // Pleione
      { x: 428, y: -68, r: 1.0 },
      { x: 365, y: -45, r: 1.1 },
    ],
  },

  // Scorpius (head + partial body) — lower-left
  {
    id: 'scorpius',
    stars: [
      { x: -65, y: 680, r: 2.3 }, // Antares (bright, reddish)
      { x: -35, y: 648, r: 1.4 },
      { x:  -8, y: 640, r: 1.5 },
      { x:  18, y: 648, r: 1.3 },
      { x: -72, y: 715, r: 1.5 },
      { x: -58, y: 748, r: 1.4 },
      { x: -74, y: 778, r: 1.6 }, // tail curve
      { x: -55, y: 800, r: 1.3 },
    ],
  },

  // Crux / Southern Cross — bottom center
  {
    id: 'crux',
    stars: [
      { x: 620, y: 808, r: 2.0 }, // Acrux   (bottom, brightest)
      { x: 620, y: 764, r: 1.8 }, // Gacrux  (top)
      { x: 586, y: 786, r: 1.5 }, // Mimosa  (left)
      { x: 654, y: 786, r: 1.4 }, // δ Crucis (right)
      { x: 607, y: 794, r: 1.0 }, // ε Crucis (small inner)
    ],
  },
]

export default function BackgroundConstellations() {
  return (
    <g opacity={0.45}>
      {BG_CONSTELLATIONS.map(constellation =>
        constellation.stars.map((star, i) => (
          <circle
            key={`${constellation.id}-${i}`}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="rgba(190, 215, 255, 0.75)"
            style={{ pointerEvents: 'none' }}
          />
        ))
      )}
    </g>
  )
}
