/**
 * Sound Engine - Pure JS module for Web Audio API sound synthesis
 */

let audioContext = null;
let currentNodes = null;

function getAudioContext() {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function createNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function makeDistortionCurve(amount) {
  const n = 256;
  const curve = new Float32Array(n);
  const k = amount;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export function stopSound() {
  if (currentNodes) {
    const { oscillator, noiseSource, gainNode, ctx, releaseTime } = currentNodes;
    const now = ctx.currentTime;

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + releaseTime);

    try { oscillator.stop(now + releaseTime); } catch (e) { /* already stopped */ }
    if (noiseSource) {
      try { noiseSource.stop(now + releaseTime); } catch (e) { /* already stopped */ }
    }

    currentNodes = null;
  }
}

/**
 * Updates AudioParams on the currently playing sound without restarting it.
 * Called on every slider/control change for real-time feedback.
 * Params that require a full rebuild (filterEnabled, noiseEnabled, sweepEnabled,
 * ADSR, delay) are handled by playOnChange restarting the sound instead.
 */
export function updateLiveParams(params) {
  if (!currentNodes) return;
  const { oscillator, filterNode, distortionNode, masterGain, pannerNode, lfoGain, ctx } = currentNodes;
  const now = ctx.currentTime;
  const snap = 0.008; // short time constant for snappy but click-free updates

  if (oscillator) {
    if (params.waveform !== undefined)   oscillator.type = params.waveform;
    if (params.frequency !== undefined)  oscillator.frequency.setTargetAtTime(params.frequency, now, snap);
    if (params.detune !== undefined)     oscillator.detune.setTargetAtTime(params.detune, now, snap);
  }
  if (masterGain && params.volume !== undefined) {
    masterGain.gain.setTargetAtTime(params.volume, now, snap);
  }
  if (pannerNode && params.pan !== undefined) {
    pannerNode.pan.setTargetAtTime(Math.max(-1, Math.min(1, params.pan)), now, snap);
  }
  if (filterNode) {
    if (params.filterFrequency !== undefined) filterNode.frequency.setTargetAtTime(params.filterFrequency, now, snap);
    if (params.filterQ !== undefined)         filterNode.Q.setTargetAtTime(Math.max(0.0001, params.filterQ), now, snap);
    if (params.filterType !== undefined)      filterNode.type = params.filterType;
  }
  if (distortionNode && params.distortionAmount !== undefined) {
    distortionNode.curve = makeDistortionCurve(params.distortionAmount);
  }
  if (lfoGain) {
    if (params.lfoDepth !== undefined) lfoGain.gain.setTargetAtTime(params.lfoDepth, now, snap);
  }
}

export function playSound(params) {
  const {
    waveform = 'sine',
    frequency = 440,
    volume = 0.5,
    detune = 0,
    attack = 0.01,
    decay = 0.1,
    sustain = 0.5,
    release = 0.2,
    lfoRate = 0,
    lfoDepth = 0,
    lfoWaveform = 'sine',
    lfoTarget = 'frequency',
    noiseEnabled = false,
    noiseLevel = 0.3,
    sweepEnabled = false,
    sweepEndFreq = 220,
    sweepTime = 0.3,
    filterEnabled = false,
    filterType = 'lowpass',
    filterFrequency = 800,
    filterQ = 1,
    filterEnvAmount = 0,
    filterEnvDecay = 0.3,
    distortionAmount = 0,
    delayWet = 0,
    delayTime = 0.3,
    delayFeedback = 0.3,
    pan = 0,
  } = params;

  stopSound();

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;

  // --- ADSR gain ---
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(1, now + attack);
  gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);

  // --- Master volume ---
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, now);

  // --- Panner ---
  const pannerNode = ctx.createStereoPanner();
  pannerNode.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);

  // --- Distortion ---
  let distortionNode = null;
  if (distortionAmount > 0) {
    distortionNode = ctx.createWaveShaper();
    distortionNode.curve = makeDistortionCurve(distortionAmount);
    distortionNode.oversample = '2x';
  }

  // --- Filter ---
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

  // --- Delay ---
  let delayNodes = null;
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

    delayNodes = { delayNode, wetGain };
  }

  // --- Oscillator ---
  const oscillator = ctx.createOscillator();
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.detune.setValueAtTime(detune, now);

  if (sweepEnabled) {
    oscillator.frequency.linearRampToValueAtTime(sweepEndFreq, now + sweepTime);
  }

  // --- LFO ---
  let lfoGain = null;
  if (lfoRate > 0 && lfoDepth > 0) {
    const lfo = ctx.createOscillator();
    lfo.type = lfoWaveform;
    lfo.frequency.setValueAtTime(lfoRate, now);

    lfoGain = ctx.createGain();

    if (lfoTarget === 'volume') {
      lfoGain.gain.setValueAtTime(lfoDepth / 200, now);
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);
    } else if (lfoTarget === 'filter' && filterNode) {
      lfoGain.gain.setValueAtTime(lfoDepth, now);
      lfo.connect(lfoGain);
      lfoGain.connect(filterNode.frequency);
    } else {
      lfoGain.gain.setValueAtTime(lfoDepth, now);
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
    }

    lfo.start(now);
  }

  // --- Build signal chain ---
  let lastNode = oscillator;
  if (distortionNode) { lastNode.connect(distortionNode); lastNode = distortionNode; }
  if (filterNode)     { lastNode.connect(filterNode);     lastNode = filterNode; }
  lastNode.connect(gainNode);
  gainNode.connect(masterGain);
  masterGain.connect(pannerNode);

  if (delayNodes) {
    pannerNode.connect(ctx.destination);
    pannerNode.connect(delayNodes.delayNode);
  } else {
    pannerNode.connect(ctx.destination);
  }

  // --- Noise ---
  let noiseSource = null;
  if (noiseEnabled) {
    noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(ctx);
    noiseSource.loop = true;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(noiseLevel, now);
    noiseSource.connect(noiseGain);
    noiseGain.connect(filterNode ?? gainNode);
    noiseSource.start(now);
  }

  oscillator.start(now);

  // Store all live-updatable nodes
  currentNodes = {
    oscillator, noiseSource, gainNode, masterGain, pannerNode,
    filterNode, distortionNode, lfoGain, ctx, releaseTime: release,
  };

  const stopScheduled = setTimeout(() => {
    if (currentNodes) stopSound();
  }, (attack + decay + 0.5) * 1000);

  return () => { clearTimeout(stopScheduled); stopSound(); };
}
