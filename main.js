// ===== Background grid =====
const gridBg = document.getElementById('grid-bg');
const COLS = 16;
const ROWS = 12;
const NAV_H = 64;
let activeCell = null;

function buildGrid() {
  gridBg.innerHTML = '';
  activeCell = null;
  for (let i = 0; i < COLS * ROWS; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.style.setProperty('--hue', row * 30);
    if (col > 0 && col % 4 === 0) cell.classList.add('measure-start');
    gridBg.appendChild(cell);
  }
}

function fadeOut(cell) {
  if (cell.classList.contains('active')) return;
  cell.classList.remove('lit');
  cell.classList.add('fading');
  cell.addEventListener('transitionend', () => cell.classList.remove('fading'), { once: true });
}

function cellAt(clientX, clientY) {
  const adjustedY = clientY - NAV_H;
  if (adjustedY < 0) return null;
  const col = Math.floor(clientX / (window.innerWidth / COLS));
  const row = Math.floor(adjustedY / ((window.innerHeight - NAV_H) / ROWS));
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
  return gridBg.children[row * COLS + col] || null;
}

window.addEventListener('mousemove', e => {
  const cell = cellAt(e.clientX, e.clientY);
  if (!cell) {
    if (activeCell) { fadeOut(activeCell); activeCell = null; }
    return;
  }
  if (cell === activeCell) return;
  if (activeCell) fadeOut(activeCell);
  cell.classList.remove('fading');
  cell.classList.add('lit');
  activeCell = cell;
});

window.addEventListener('mouseleave', () => {
  if (activeCell) { fadeOut(activeCell); activeCell = null; }
});

window.addEventListener('click', e => {
  if (e.target.closest('a, button, input, select, textarea')) return;
  const cell = cellAt(e.clientX, e.clientY);
  if (!cell) return;
  if (cell.classList.contains('active')) {
    cell.classList.remove('active');
    if (cell !== activeCell) fadeOut(cell);
  } else {
    cell.classList.remove('fading');
    cell.classList.add('active');
    // Play sound immediately on activation
    const idx = [...gridBg.children].indexOf(cell);
    const row = Math.floor(idx / COLS);
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    sounds[row](audioCtx.currentTime);
  }
});

buildGrid();


// ===== Audio / Sequencer =====
let audioCtx    = null;
let masterGain  = null;
let bpm         = 120;
let isPlaying   = false;
let currentStep = 0;
let nextStepTime = 0;
let schedulerTimer = null;
const stepQueue = [];

const LOOKAHEAD      = 25;   // ms — scheduler interval
const SCHEDULE_AHEAD = 0.1;  // seconds — how far ahead to schedule

function initAudio() {
  if (audioCtx) return;
  audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = parseInt(document.getElementById('vol-slider').value) / 100;
  masterGain.connect(audioCtx.destination);
}

// --- Noise helper ---
function noiseBuffer(duration) {
  const size   = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
  const data   = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// --- 12 Synthesized drum sounds ---

// Row 0: Kick — deep sine sweep
function playKick(t) {
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(masterGain);
  osc.frequency.setValueAtTime(160, t);
  osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.55);
  gain.gain.setValueAtTime(1.0, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);
  osc.start(t); osc.stop(t + 0.55);
}

// Row 1: Snare — noise burst + tonal body
function playSnare(t) {
  const src    = audioCtx.createBufferSource();
  src.buffer   = noiseBuffer(0.2);
  const filter = audioCtx.createBiquadFilter();
  filter.type  = 'bandpass'; filter.frequency.value = 1200;
  const gain   = audioCtx.createGain();
  src.connect(filter); filter.connect(gain); gain.connect(masterGain);
  gain.gain.setValueAtTime(0.9, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
  src.start(t); src.stop(t + 0.18);

  const osc  = audioCtx.createOscillator();
  const og   = audioCtx.createGain();
  osc.frequency.value = 185;
  osc.connect(og); og.connect(masterGain);
  og.gain.setValueAtTime(0.5, t);
  og.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
  osc.start(t); osc.stop(t + 0.08);
}

// Row 2: Closed hi-hat — very short high-pass noise
function playClosedHH(t) {
  const src    = audioCtx.createBufferSource();
  src.buffer   = noiseBuffer(0.06);
  const filter = audioCtx.createBiquadFilter();
  filter.type  = 'highpass'; filter.frequency.value = 7000;
  const gain   = audioCtx.createGain();
  src.connect(filter); filter.connect(gain); gain.connect(masterGain);
  gain.gain.setValueAtTime(0.7, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
  src.start(t); src.stop(t + 0.05);
}

// Row 3: Open hi-hat — longer high-pass noise
function playOpenHH(t) {
  const src    = audioCtx.createBufferSource();
  src.buffer   = noiseBuffer(0.45);
  const filter = audioCtx.createBiquadFilter();
  filter.type  = 'highpass'; filter.frequency.value = 5500;
  const gain   = audioCtx.createGain();
  src.connect(filter); filter.connect(gain); gain.connect(masterGain);
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.42);
  src.start(t); src.stop(t + 0.42);
}

// Rows 4–6: Toms — pitched sine sweeps
function playTom(t, f1, f2, dur) {
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(masterGain);
  osc.frequency.setValueAtTime(f1, t);
  osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
  gain.gain.setValueAtTime(0.9, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
  osc.start(t); osc.stop(t + dur);
}

// Row 7: Clap — three rapid noise bursts
function playClap(t) {
  [0, 0.012, 0.024].forEach(offset => {
    const src    = audioCtx.createBufferSource();
    src.buffer   = noiseBuffer(0.1);
    const filter = audioCtx.createBiquadFilter();
    filter.type  = 'bandpass'; filter.frequency.value = 1100; filter.Q.value = 0.7;
    const gain   = audioCtx.createGain();
    src.connect(filter); filter.connect(gain); gain.connect(masterGain);
    gain.gain.setValueAtTime(0.75, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.09);
    src.start(t + offset); src.stop(t + offset + 0.09);
  });
}

// Row 8: Rimshot — sharp square click + filtered noise
function playRimshot(t) {
  const osc  = audioCtx.createOscillator();
  osc.type   = 'square'; osc.frequency.value = 420;
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(masterGain);
  gain.gain.setValueAtTime(0.7, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.055);
  osc.start(t); osc.stop(t + 0.055);

  const src    = audioCtx.createBufferSource();
  src.buffer   = noiseBuffer(0.055);
  const filter = audioCtx.createBiquadFilter();
  filter.type  = 'bandpass'; filter.frequency.value = 2800;
  const ng     = audioCtx.createGain();
  src.connect(filter); filter.connect(ng); ng.connect(masterGain);
  ng.gain.setValueAtTime(0.5, t);
  ng.gain.exponentialRampToValueAtTime(0.01, t + 0.055);
  src.start(t); src.stop(t + 0.055);
}

// Row 9: Cowbell — two detuned square waves
function playCowbell(t) {
  [562, 845].forEach(freq => {
    const osc  = audioCtx.createOscillator();
    osc.type   = 'square'; osc.frequency.value = freq;
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(masterGain);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);
    osc.start(t); osc.stop(t + 0.55);
  });
}

// Row 10: Shaker — short band-pass noise
function playShaker(t) {
  const src    = audioCtx.createBufferSource();
  src.buffer   = noiseBuffer(0.045);
  const filter = audioCtx.createBiquadFilter();
  filter.type  = 'bandpass'; filter.frequency.value = 5200; filter.Q.value = 1.8;
  const gain   = audioCtx.createGain();
  src.connect(filter); filter.connect(gain); gain.connect(masterGain);
  gain.gain.setValueAtTime(0.55, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
  src.start(t); src.stop(t + 0.04);
}

// Row 11: Crash cymbal — long high-pass noise decay
function playCrash(t) {
  const src    = audioCtx.createBufferSource();
  src.buffer   = noiseBuffer(1.6);
  const filter = audioCtx.createBiquadFilter();
  filter.type  = 'highpass'; filter.frequency.value = 4800;
  const gain   = audioCtx.createGain();
  src.connect(filter); filter.connect(gain); gain.connect(masterGain);
  gain.gain.setValueAtTime(0.65, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
  src.start(t); src.stop(t + 1.5);
}

const sounds = [
  playKick,
  playSnare,
  playClosedHH,
  playOpenHH,
  t => playTom(t, 500, 200, 0.28),   // High Tom
  t => playTom(t, 300, 120, 0.33),   // Mid Tom
  t => playTom(t, 175, 58,  0.40),   // Low Tom
  playClap,
  playRimshot,
  playCowbell,
  playShaker,
  playCrash,
];

// --- Sequencer ---

function stepDuration() {
  return (60 / bpm) / 4; // 16th note
}

function scheduleStep(step, time) {
  stepQueue.push({ step, time });
  for (let row = 0; row < ROWS; row++) {
    const cell = gridBg.children[row * COLS + step];
    if (cell && cell.classList.contains('active')) {
      sounds[row](time);
    }
  }
}

function scheduler() {
  while (nextStepTime < audioCtx.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(currentStep, nextStepTime);
    nextStepTime += stepDuration();
    currentStep = (currentStep + 1) % COLS;
  }
}

// Visual step indicator — driven by audio clock via rAF
let visualStep = -1;

requestAnimationFrame(function tick() {
  if (isPlaying && audioCtx) {
    const now = audioCtx.currentTime;
    while (stepQueue.length && stepQueue[0].time <= now) {
      const { step } = stepQueue.shift();
      if (visualStep >= 0) {
        for (let r = 0; r < ROWS; r++)
          gridBg.children[r * COLS + visualStep]?.classList.remove('current-step');
      }
      for (let r = 0; r < ROWS; r++) {
        const c = gridBg.children[r * COLS + step];
        if (!c) continue;
        c.classList.add('current-step');
        if (c.classList.contains('active')) {
          c.classList.add('playing');
          setTimeout(() => c.classList.remove('playing'), 120);
        }
      }
      visualStep = step;
    }
  }
  requestAnimationFrame(tick);
});

function startPlayback() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  isPlaying    = true;
  currentStep  = 0;
  nextStepTime = audioCtx.currentTime;
  schedulerTimer = setInterval(scheduler, LOOKAHEAD);
  const btn = document.getElementById('play-btn');
  btn.textContent = '■ Stop';
  btn.classList.add('playing');
}

function stopPlayback() {
  isPlaying = false;
  clearInterval(schedulerTimer);
  stepQueue.length = 0;
  if (visualStep >= 0) {
    for (let r = 0; r < ROWS; r++)
      gridBg.children[r * COLS + visualStep]?.classList.remove('current-step');
    visualStep = -1;
  }
  const btn = document.getElementById('play-btn');
  btn.textContent = '▶ Play';
  btn.classList.remove('playing');
}

document.getElementById('play-btn').addEventListener('click', () => {
  isPlaying ? stopPlayback() : startPlayback();
});

document.getElementById('bpm-slider').addEventListener('input', e => {
  bpm = parseInt(e.target.value);
  document.getElementById('bpm-val').textContent = bpm;
});

document.getElementById('vol-slider').addEventListener('input', e => {
  const v = parseInt(e.target.value) / 100;
  if (masterGain) masterGain.gain.value = v;
});


// ===== Mobile nav =====
const toggle = document.querySelector('.nav-toggle');
const links  = document.querySelector('.nav-links');

toggle?.addEventListener('click', () => links.classList.toggle('open'));
links?.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => links.classList.remove('open'))
);

// Active nav link on scroll
const sections = document.querySelectorAll('section[id], header[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.style.color = '');
      document.querySelector(`.nav-links a[href="#${entry.target.id}"]`)
        ?.style.setProperty('color', 'var(--text)');
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));
