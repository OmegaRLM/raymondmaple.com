# Raymond Maple — Website CLAUDE.md

## Site Overview
Personal portfolio/brand site for Raymond Maple at **raymondmaple.com**.
- 20+ year game developer (WayForward, Disney/Avalanche), educator, AI enthusiast
- Contact: hello@raymondmaple.com

## Tech Stack
- **Pure static site** — vanilla HTML/CSS/JS, no build tools, no npm
- **Hosting**: GitHub Pages via CNAME (`raymondmaple.com`)
- **Fonts**: Google Fonts — Inter (sans-serif), JetBrains Mono (monospace)
- **Libraries**: Three.js (imported as ES module in scene.js, not yet wired up)
- **Audio**: Web Audio API — all drum sounds synthesized in code, no samples

## File Structure
```
index.html          # Landing page (hero, portfolio teaser, contact)
portfolio.html      # Full game timeline (1996–2024, 20+ titles)
drum-machine.html   # Interactive drum sequencer demo
main.js             # Landing page: grid bg, Web Audio synth, 16-step sequencer, mobile nav
portfolio.js        # Portfolio filter logic (All / WayForward / Disney / Recent)
scene.js            # Three.js particle system (built but not yet wired into index.html)
style.css           # Shared styles (landing + portfolio base)
portfolio.css       # Portfolio page-specific styles
CNAME               # raymondmaple.com
site.webmanifest    # PWA manifest (currently empty template)
favicon.ico / .svg  # Favicons
img/games/          # Game box art images (currently empty)
```

## Design System
All colors defined as CSS custom properties in `style.css`:
- `--bg` / `--bg-alt` / `--bg-card` — dark GitHub-style backgrounds
- `--accent` — blue `#58a6ff` (primary)
- `--accent-2` — green, `--accent-3` — purple, `--accent-4` — orange
- `--font-mono` — JetBrains Mono, `--font-sans` — Inter
- `--nav-h: 64px`, `--radius: 8px`
- Mobile breakpoint: **768px** (portfolio also has 600px)

Theme: GitHub Dark aesthetic — dark backgrounds, blue accents, monospace code blocks.

## Key Interactive Features (main.js)
1. **Grid background** — 16×12 cell grid, mouse hover lights cells, click toggles "active" state
2. **Drum synth** — 12 drum sounds (kick, snare, hats, toms, clap, rimshot, cowbell, shaker, crash) synthesized via Web Audio oscillators/noise — no samples
3. **16-step sequencer** — BPM slider (80–160, default 120), play/stop, lookahead scheduler for audio timing precision
4. **Volume control** — master gain slider
5. **Mobile nav** — hamburger toggle, IntersectionObserver for active section highlighting

## Portfolio Page (portfolio.html / portfolio.css)
- Timeline layout (vertical line + dot indicators) spanning 1996–2024
- Studios: WayForward Technologies, Disney/Avalanche Software
- Filter buttons: All, WayForward, Disney/Avalanche, Recent
- Badges for role, platform, studio (color-coded)
- Notable titles: Disney Infinity series, Epic Mickey, Cars, Toy Story, River City Girls, Contra, SpongeBob, Shantae

## Planned / In-Progress Sections
- Blog (placeholder)
- AI Applications (placeholder)
- Education (placeholder)
- Three.js particle system (`scene.js`) — built but not yet integrated
- Game box art images — directory exists, images not added yet

## Git / Deployment
- Branch: `main`
- Deploy: push to GitHub → auto-serves via GitHub Pages
- No build step needed — edit files and push
