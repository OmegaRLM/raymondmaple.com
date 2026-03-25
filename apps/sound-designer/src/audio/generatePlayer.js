// ── Shared engine source ──────────────────────────────────────────────────────
// Written as a plain string so it can be embedded in exported files.
const ENGINE_SOURCE = `
let _audioCtx = null;
let _nodes = null;

function _getCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

function _makeDistortionCurve(amount) {
  const n = 256, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function _createNoiseBuffer(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function stopSound() {
  if (!_nodes) return;
  const { oscillator, noiseSource, gainNode, ctx, releaseTime } = _nodes;
  const now = ctx.currentTime;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(gainNode.gain.value, now);
  gainNode.gain.linearRampToValueAtTime(0, now + releaseTime);
  try { oscillator.stop(now + releaseTime); } catch (e) {}
  if (noiseSource) try { noiseSource.stop(now + releaseTime); } catch (e) {}
  _nodes = null;
}

function playSound(params) {
  const {
    waveform = 'sine', frequency = 440, volume = 0.5, detune = 0,
    attack = 0.01, decay = 0.1, sustain = 0.5, release = 0.2,
    lfoRate = 0, lfoDepth = 0, lfoWaveform = 'sine', lfoTarget = 'frequency',
    noiseEnabled = false, noiseLevel = 0.3,
    sweepEnabled = false, sweepEndFreq = 220, sweepTime = 0.3,
    filterEnabled = false, filterType = 'lowpass', filterFrequency = 800,
    filterQ = 1, filterEnvAmount = 0, filterEnvDecay = 0.3,
    distortionAmount = 0, delayWet = 0, delayTime = 0.3, delayFeedback = 0.3,
    pan = 0,
  } = params;

  stopSound();

  const ctx = _getCtx();
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(1, now + attack);
  gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, now);

  const pannerNode = ctx.createStereoPanner();
  pannerNode.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);

  let distortionNode = null;
  if (distortionAmount > 0) {
    distortionNode = ctx.createWaveShaper();
    distortionNode.curve = _makeDistortionCurve(distortionAmount);
    distortionNode.oversample = '2x';
  }

  let filterNode = null;
  if (filterEnabled) {
    filterNode = ctx.createBiquadFilter();
    filterNode.type = filterType;
    filterNode.Q.setValueAtTime(Math.max(0.0001, filterQ), now);
    if (filterEnvAmount !== 0) {
      filterNode.frequency.setValueAtTime(filterFrequency + filterEnvAmount, now);
      filterNode.frequency.linearRampToValueAtTime(filterFrequency, now + filterEnvDecay);
    } else {
      filterNode.frequency.setValueAtTime(filterFrequency, now);
    }
  }

  let delayInputNode = null;
  if (delayWet > 0) {
    const delayNode = ctx.createDelay(2.0);
    delayNode.delayTime.setValueAtTime(Math.max(0, delayTime), now);
    const feedbackGain = ctx.createGain();
    feedbackGain.gain.setValueAtTime(Math.min(delayFeedback, 0.95), now);
    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(delayWet, now);
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    delayNode.connect(wetGain);
    wetGain.connect(ctx.destination);
    delayInputNode = delayNode;
  }

  const oscillator = ctx.createOscillator();
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.detune.setValueAtTime(detune, now);
  if (sweepEnabled) oscillator.frequency.linearRampToValueAtTime(sweepEndFreq, now + sweepTime);

  if (lfoRate > 0 && lfoDepth > 0) {
    const lfo = ctx.createOscillator();
    lfo.type = lfoWaveform;
    lfo.frequency.setValueAtTime(lfoRate, now);
    const lfoGain = ctx.createGain();
    if (lfoTarget === 'volume') {
      lfoGain.gain.setValueAtTime(lfoDepth / 200, now);
      lfo.connect(lfoGain); lfoGain.connect(masterGain.gain);
    } else if (lfoTarget === 'filter' && filterNode) {
      lfoGain.gain.setValueAtTime(lfoDepth, now);
      lfo.connect(lfoGain); lfoGain.connect(filterNode.frequency);
    } else {
      lfoGain.gain.setValueAtTime(lfoDepth, now);
      lfo.connect(lfoGain); lfoGain.connect(oscillator.frequency);
    }
    lfo.start(now);
  }

  let last = oscillator;
  if (distortionNode) { last.connect(distortionNode); last = distortionNode; }
  if (filterNode)     { last.connect(filterNode);     last = filterNode; }
  last.connect(gainNode);
  gainNode.connect(masterGain);
  masterGain.connect(pannerNode);
  pannerNode.connect(ctx.destination);
  if (delayInputNode) pannerNode.connect(delayInputNode);

  let noiseSource = null;
  if (noiseEnabled) {
    noiseSource = ctx.createBufferSource();
    noiseSource.buffer = _createNoiseBuffer(ctx);
    noiseSource.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(noiseLevel, now);
    noiseSource.connect(noiseGain);
    noiseGain.connect(filterNode !== null ? filterNode : gainNode);
    noiseSource.start(now);
  }

  oscillator.start(now);
  _nodes = { oscillator, noiseSource, gainNode, ctx, releaseTime: release };
}
`.trim();

// ── Exports ───────────────────────────────────────────────────────────────────

/**
 * Standalone player file — engine only, no sound data.
 * Download once and reuse across your project.
 */
export function generatePlayerOnlyCode() {
  return `/**
 * sound-player.js — generated by Web Sound Designer
 *
 * Usage:
 *   import { playSound, stopSound } from './sound-player.js';
 *   playSound({ waveform: 'sine', frequency: 440, volume: 0.5, ... });
 *   stopSound();
 *
 * Call playSound() after a user gesture (click, keypress) to satisfy
 * browser autoplay policy.
 */

${ENGINE_SOURCE}
`;
}

/**
 * Bundles the engine + a single named sound into one file.
 */
export function generatePlayerCode(soundName, params) {
  const safeName = sanitizeName(soundName);
  const json = JSON.stringify(params, null, 2);

  return `/**
 * ${safeName}-player.js — generated by Web Sound Designer
 *
 * Usage:
 *   playSound(${safeName});
 *   stopSound();
 */

const ${safeName} = ${json};

${ENGINE_SOURCE}
`;
}

/**
 * ES module — named exports for every sound in the library.
 * Import into a bundled project (Vite, Webpack, etc.)
 */
export function generateLibraryJS(sounds) {
  const header = `// sounds.js — generated by Web Sound Designer
// Usage:
//   import { playSound } from './sound-player.js';
//   import { coinSound, laserSound } from './sounds.js';
//   playSound(coinSound);
`;
  const entries = sounds
    .map(s => `export const ${sanitizeName(s.name)} = ${JSON.stringify(s.params, null, 2)};`)
    .join('\n\n');
  return `${header}\n${entries}\n`;
}

/**
 * Plain JSON map of all sounds — for fetch-based loading or any runtime.
 */
export function generateLibraryJSON(sounds) {
  const obj = {};
  sounds.forEach(s => { obj[sanitizeName(s.name)] = s.params; });
  return JSON.stringify(obj, null, 2);
}

export function sanitizeName(name) {
  return (name || '').trim().replace(/[^a-zA-Z0-9_$]/g, '_') || 'mySound';
}
