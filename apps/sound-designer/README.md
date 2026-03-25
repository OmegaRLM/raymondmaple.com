# Web Sound Designer

A browser-based sound synthesis playground built with React and the Web Audio API. Design, preview, and export game-ready sound effects — no plugins, no backend, no dependencies.

![Web Sound Designer](src/assets/hero.png)

## Features

- **Oscillator** — sine, square, triangle, sawtooth with frequency, volume, and detune
- **ADSR envelope** — attack, decay, sustain, release
- **Pitch sweep** — glide from one frequency to another over time
- **Filter** — lowpass / highpass / bandpass / notch / peaking with envelope modulation
- **Distortion** — waveshaper drive
- **Delay** — echo with wet/dry mix, time, and feedback
- **LFO** — modulate frequency, volume, or filter cutoff
- **Noise** — white noise mix-in
- **Stereo pan**
- **Presets** — Laser, Explosion, Coin, Jump, Hit, Powerup
- **Mutation** — vary any preset or the current sound by a dialed-in amount
- **Randomize** — generate a fully random sound
- **Play on Change** — hear updates in real time as you move sliders
- **Spacebar** shortcut to replay the current sound
- **Sound Library** — save sounds to localStorage, export as `.js` or `.json`, load from file
- **sound-player.js** — download a standalone, zero-dependency audio engine to drop into any project

## Getting Started

Requires **Node.js 20.x** (≤ 20.17 recommended — see note below).

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build for production

```bash
npm run build
npm run preview
```

## Using sound-player.js in Your Project

The **Player** tab explains the full integration workflow. The short version:

1. Download `sound-player.js` from the Player tab.
2. Design sounds in the **Designer** tab, add them to your library, then export as `sounds.js` or `sounds.json` from the **Library** tab.
3. Import and call in your app:

```js
import { playSound } from './audio/sound-player.js';
import { coinSound, laserSound } from './audio/sounds.js';

playSound(coinSound);
```

Or load JSON at runtime:

```js
const sounds = await fetch('./audio/sounds.json').then(r => r.json());
playSound(sounds.coinSound);
```

`playSound()` must be called from a user gesture (click, keydown) due to browser autoplay policy.

## Sound Parameter Reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `waveform` | string | `"sine"` | Oscillator shape: sine, square, triangle, sawtooth |
| `frequency` | number | `440` | Base pitch in Hz |
| `volume` | number | `0.5` | Master volume (0–1) |
| `detune` | number | `0` | Fine-tune in cents (−100 to +100) |
| `pan` | number | `0` | Stereo position (−1 left, 0 center, +1 right) |
| `attack` | number | `0.01` | Time to reach full volume (seconds) |
| `decay` | number | `0.1` | Time to fall to sustain level (seconds) |
| `sustain` | number | `0.5` | Hold volume level (0–1) |
| `release` | number | `0.2` | Fade-out time after sound stops (seconds) |
| `sweepEnabled` | boolean | `false` | Glide pitch from frequency to sweepEndFreq |
| `sweepEndFreq` | number | `220` | Target pitch for sweep (Hz) |
| `sweepTime` | number | `0.3` | Duration of pitch sweep (seconds) |
| `filterEnabled` | boolean | `false` | Enable BiquadFilter |
| `filterType` | string | `"lowpass"` | Filter shape |
| `filterFrequency` | number | `800` | Filter cutoff frequency (Hz) |
| `filterQ` | number | `1` | Filter resonance / Q factor |
| `filterEnvAmount` | number | `0` | Cutoff sweep at start (Hz, can be negative) |
| `filterEnvDecay` | number | `0.3` | How fast filter envelope returns (seconds) |
| `distortionAmount` | number | `0` | Waveshaper drive (0–400) |
| `delayWet` | number | `0` | Delay mix, 0 = off (0–1) |
| `delayTime` | number | `0.3` | Echo time (seconds) |
| `delayFeedback` | number | `0.3` | Echo repeats (0–0.95) |
| `lfoRate` | number | `0` | LFO speed in Hz, 0 = off |
| `lfoDepth` | number | `0` | LFO intensity |
| `lfoWaveform` | string | `"sine"` | LFO shape |
| `lfoTarget` | string | `"frequency"` | What LFO modulates: frequency, volume, filter |
| `noiseEnabled` | boolean | `false` | Mix in white noise |
| `noiseLevel` | number | `0.3` | Noise volume (0–1) |

## Tech Stack

- [React 19](https://react.dev/)
- [Vite 5](https://vitejs.dev/) — pinned to v5.4.x for Node 20.17 compatibility
- Web Audio API — no external audio libraries

## Node Version Note

Vite 8+ requires Node 20.19+. This project pins Vite to `5.4.19` to stay compatible with Node 20.17.0. Do not upgrade Vite without verifying your Node version.
