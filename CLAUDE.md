# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Zachary Dexter's personal portfolio site at zacharydexter.com. Built with React 19 + Vite, deployed to GitHub Pages automatically on push to `main`.

## Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # Build to dist/
npm run preview  # Preview production build
```

No linting or test setup currently exists.

## Architecture

### Navigation Model

The site has no router. `App.jsx` manages a `currentScreen` state (`landing` | `about` | `now` | `projects` | `resume`) and renders either `<LandingScreen>` or `<SectionScreen section={...}>`.

Navigation happens through a physics-based spaceship: the user flies off a screen edge to trigger a warp transition to another section. Edge-to-section mapping (from landing):
- Top → `about`
- Right → `now`
- Bottom → `resume`
- Left → `projects`

The warp is a white-flash transition (~150ms flash, ~340ms fade). On mobile (detected via `window.matchMedia('(hover: none)')`), the spaceship is hidden and replaced by `<MobileNav>` — a hamburger menu.

### Canvas Components

`StarField.jsx` and `Spaceship.jsx` both use `<canvas>` with `requestAnimationFrame`. They are separate from React's render cycle — refs are used to pass bounds and state into the canvas loops without re-renders.

**Spaceship physics:** thrust, velocity, drag (Newtonian). Constants like `TURN_SPEED`, `MAX_SPEED`, `LASER_SPEED` are at the top of `Spaceship.jsx`. On section screens, `WALL_INSET` constraints keep the ship inside bounds. Entry animations spawn the ship off-screen and fly it to center.

**StarField:** ~220 twinkling stars, rotating nebula gradients, periodic shooting stars. Full-screen, `pointer-events: none`.

### Content Sections

`SectionScreen.jsx` renders a centered glass card and delegates content to `About`, `Now`, `Projects`, or `Resume` components in `src/sections/`. Each section has a distinct color theme:
- **About** → amber/warm
- **Now** → indigo/purple
- **Projects** → terminal green
- **Resume** → grid-pattern blue

`Projects.jsx` uses a terminal aesthetic — each project rendered as `$ open ./project-id` with flags. `Resume.jsx` is just a button linking to the PDF.

### Styling

`src/index.css` defines CSS custom properties for the design system. Key variables:
- `--bg-deep: #05070f` (background)
- `--star-white: #f0f4ff` (text)
- `--star-glow: #7dd3fc` (accent)

Fonts: **Orbitron** for display headings, **Inter** for body text, Courier New/Consolas for terminal-style sections. Loaded from Google Fonts in `index.html`.

The root-level `style.css` is a legacy file from before the React rewrite — it's not imported by the app (but `breakout/breakout.html` links to it directly).

### Breakout Game

`breakout/` is a self-contained vanilla JS game — no build step. It links directly to the root `style.css` for base styles. The game uses delta-time physics (`BALL_SPEED`/`PADDLE_SPEED` in px/s) for consistent behavior across machines.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) runs on push to `main`: `npm ci` → `npm run build` → deploys `dist/` to GitHub Pages via `peaceiris/actions-gh-pages`. The `CNAME` file sets the custom domain.
