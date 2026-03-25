# Web Sound Designer — Claude Code Guide

## Project Overview

A browser-based sound synthesis playground built with React + Vite and the Web Audio API. No backend — everything runs client-side.

## Dev Commands

```bash
npm run dev       # start dev server (localhost:5173)
npm run build     # production build → dist/
npm run preview   # preview production build
npm run lint      # eslint check
```

## Architecture

### Key files

| File | Purpose |
|------|---------|
| `src/audio/soundEngine.js` | Web Audio API engine — `playSound()`, `stopSound()`, `updateLiveParams()` |
| `src/audio/generatePlayer.js` | Code generation — exports `sound-player.js`, library `.js`/`.json` |
| `src/App.jsx` | Root state: soundState, library, activeTab, variation |
| `src/components/SoundControls.jsx` | Four-tab parameter UI (Osc, Envelope, Filter, FX) |
| `src/components/ExportPanel.jsx` | Playback controls, sound naming, JSON export/import |
| `src/components/LibraryTab.jsx` | Two-column library manager (source → working) |
| `src/components/PlayerTab.jsx` | Download + integration docs for `sound-player.js` |

### Audio signal chain

```
oscillator → [waveshaper distortion] → [biquad filter] → adsrGain → masterGain → panner → [delay wet/dry] → destination
                                                                                     ↑
                                                                                  lfoGain (modulates freq/vol/filter)
noise buffer ──────────────────────────────────────────────────────────────────────────────────────────────────────────┘ (mixed in at masterGain)
```

### State shape (DEFAULT_STATE in App.jsx)

All synthesis parameters live in a single flat object (`soundState`). Every key maps directly to an audio parameter in `soundEngine.js`.

### Live parameter updates

`handleParamChange` in `App.jsx` calls `updateLiveParams(next)` on every slider/control change. This updates playing audio in real time via `AudioParam.setTargetAtTime()` with `snap=0.008s` to avoid clicks.

## Important Constraints

- **Node.js**: Project requires Node ≤ 20.17 — Vite is pinned to `v5.4.19` (Vite 8+ requires Node 20.19+). Do not upgrade Vite without checking Node version first.
- **No external audio libraries**: All synthesis is vanilla Web Audio API.
- **No TypeScript**: Project is plain JSX. Do not convert to TS.
- **Library persistence**: `localStorage` key `wsd_library` stores the working library as a JSON array.

## Patterns to Follow

- All slider/select/toggle controls in `SoundControls.jsx` use inline `Slider`, `Select`, `Toggle` components with a `tip` prop for tooltips.
- Tooltip CSS uses `data-tooltip` attribute on `.control-label` elements — rendered via `::after` pseudo-element in `App.css`.
- New sound parameters must be added in four places: `DEFAULT_STATE`, `soundEngine.js` signal chain, `updateLiveParams()`, and `SoundControls.jsx`.
- `generatePlayer.js` contains `ENGINE_SOURCE` — a self-contained string copy of the audio engine for the downloadable `sound-player.js`. Keep it in sync with `soundEngine.js` when adding parameters.
- The `varyPreset` / `jitter` function uses a `floor` parameter for ADSR values so zero values can mutate upward. Maintain this pattern for any new time-based parameters.
