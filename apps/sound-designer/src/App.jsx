import { useState, useCallback, useEffect, useRef } from 'react';
import SoundControls from './components/SoundControls';
import ExportPanel from './components/ExportPanel';
import LibraryTab from './components/LibraryTab';
import PlayerTab from './components/PlayerTab';
import { playSound, stopSound, updateLiveParams } from './audio/soundEngine';
import './App.css';

const LIBRARY_STORAGE_KEY = 'wsd_library';

const DEFAULT_STATE = {
  // Oscillator
  waveform: 'sine',
  frequency: 440,
  volume: 0.5,
  detune: 0,
  // ADSR
  attack: 0.01,
  decay: 0.1,
  sustain: 0.5,
  release: 0.2,
  // LFO
  lfoWaveform: 'sine',
  lfoTarget: 'frequency',
  lfoRate: 0,
  lfoDepth: 0,
  // Noise
  noiseEnabled: false,
  noiseLevel: 0.3,
  // Pitch sweep
  sweepEnabled: false,
  sweepEndFreq: 220,
  sweepTime: 0.3,
  // Filter
  filterEnabled: false,
  filterType: 'lowpass',
  filterFrequency: 800,
  filterQ: 1,
  filterEnvAmount: 0,
  filterEnvDecay: 0.3,
  // Distortion
  distortionAmount: 0,
  // Delay
  delayWet: 0,
  delayTime: 0.3,
  delayFeedback: 0.3,
  // Pan
  pan: 0,
};

const PRESETS = {
  Laser: {
    ...DEFAULT_STATE,
    waveform: 'sawtooth',
    frequency: 880,
    volume: 0.7,
    attack: 0.001,
    decay: 0.2,
    sustain: 0,
    release: 0.1,
    sweepEnabled: true,
    sweepEndFreq: 120,
    sweepTime: 0.2,
    filterEnabled: true,
    filterType: 'lowpass',
    filterFrequency: 3000,
    filterEnvAmount: -2000,
    filterEnvDecay: 0.2,
    distortionAmount: 20,
  },
  Explosion: {
    ...DEFAULT_STATE,
    waveform: 'sawtooth',
    frequency: 80,
    volume: 1,
    attack: 0.001,
    decay: 0.6,
    sustain: 0.1,
    release: 0.8,
    noiseEnabled: true,
    noiseLevel: 0.8,
    filterEnabled: true,
    filterType: 'lowpass',
    filterFrequency: 300,
    filterEnvAmount: 1200,
    filterEnvDecay: 0.5,
    distortionAmount: 80,
  },
  Coin: {
    ...DEFAULT_STATE,
    waveform: 'sine',
    frequency: 988,
    volume: 0.8,
    attack: 0.001,
    decay: 0.05,
    sustain: 0,
    release: 0.08,
    sweepEnabled: true,
    sweepEndFreq: 1320,
    sweepTime: 0.06,
  },
  Jump: {
    ...DEFAULT_STATE,
    waveform: 'square',
    frequency: 200,
    volume: 0.7,
    attack: 0.001,
    decay: 0.15,
    sustain: 0.1,
    release: 0.1,
    sweepEnabled: true,
    sweepEndFreq: 520,
    sweepTime: 0.12,
    filterEnabled: true,
    filterType: 'lowpass',
    filterFrequency: 1500,
    filterQ: 2,
  },
  Hit: {
    ...DEFAULT_STATE,
    waveform: 'triangle',
    frequency: 180,
    volume: 0.9,
    attack: 0.001,
    decay: 0.08,
    sustain: 0,
    release: 0.05,
    noiseEnabled: true,
    noiseLevel: 0.6,
    filterEnabled: true,
    filterType: 'lowpass',
    filterFrequency: 800,
    filterQ: 1.5,
    filterEnvAmount: 1200,
    filterEnvDecay: 0.08,
    distortionAmount: 30,
  },
  Powerup: {
    ...DEFAULT_STATE,
    waveform: 'sine',
    frequency: 330,
    volume: 0.8,
    attack: 0.05,
    decay: 0.1,
    sustain: 0.6,
    release: 0.4,
    sweepEnabled: true,
    sweepEndFreq: 990,
    sweepTime: 0.5,
    lfoRate: 6,
    lfoDepth: 30,
    lfoTarget: 'frequency',
    delayWet: 0.25,
    delayTime: 0.18,
    delayFeedback: 0.4,
  },
};

const WAVEFORMS = ['sine', 'square', 'triangle', 'sawtooth'];
const LFO_TARGETS = ['frequency', 'volume', 'filter'];
const FILTER_TYPES = ['lowpass', 'highpass', 'bandpass', 'notch', 'peaking'];

// Applies a scaled random nudge to numeric preset values.
// variation: 0 = exact preset, 1 = large changes.
// floor: minimum base used when value is 0, so zero values can mutate upward.
function varyPreset(preset, variation) {
  if (variation === 0) return preset;

  const jitter = (value, maxPct, min, max, decimals = 3, floor = null) => {
    const base = value === 0 && floor !== null ? floor : value;
    if (base === 0) return 0;
    const delta = base * maxPct * variation * (Math.random() * 2 - 1);
    return parseFloat(Math.max(min, Math.min(max, value + delta)).toFixed(decimals));
  };

  return {
    ...preset,
    frequency:       jitter(preset.frequency,       0.6,  50,   2000, 0),
    detune:          jitter(preset.detune || 1,     2.0,  -100, 100,  0),
    volume:          jitter(preset.volume,           0.3,  0.1,  1,    2),
    attack:          jitter(preset.attack,           1.5,  0,    2,    4,  0.05),
    decay:           jitter(preset.decay,            1.5,  0,    2,    4,  0.05),
    sustain:         jitter(preset.sustain,          0.8,  0,    1,    2,  0.1),
    release:         jitter(preset.release,          1.5,  0,    2,    4,  0.05),
    filterFrequency: jitter(preset.filterFrequency,  0.7,  20,   8000, 0),
    filterQ:         jitter(preset.filterQ,          1.0,  0.1,  20,   2),
    sweepEndFreq:    jitter(preset.sweepEndFreq,     0.6,  50,   2000, 0),
    sweepTime:       jitter(preset.sweepTime,        1.0,  0.01, 2,    3),
    noiseLevel:      jitter(preset.noiseLevel,       0.8,  0,    1,    2,  0.1),
  };
}

function randomBetween(min, max, decimals) {
  const val = Math.random() * (max - min) + min;
  return decimals !== undefined ? parseFloat(val.toFixed(decimals)) : Math.round(val);
}

function randomizeState() {
  return {
    waveform: WAVEFORMS[Math.floor(Math.random() * WAVEFORMS.length)],
    frequency: randomBetween(80, 1200),
    volume: randomBetween(0.4, 0.9, 2),
    detune: randomBetween(-30, 30),
    attack: randomBetween(0.001, 0.3, 3),
    decay: randomBetween(0.05, 0.8, 3),
    sustain: randomBetween(0, 0.8, 2),
    release: randomBetween(0.05, 0.6, 3),
    lfoWaveform: WAVEFORMS[Math.floor(Math.random() * WAVEFORMS.length)],
    lfoTarget: LFO_TARGETS[Math.floor(Math.random() * LFO_TARGETS.length)],
    lfoRate: randomBetween(0, 12, 1),
    lfoDepth: randomBetween(0, 60),
    noiseEnabled: Math.random() > 0.75,
    noiseLevel: randomBetween(0.1, 0.5, 2),
    sweepEnabled: Math.random() > 0.5,
    sweepEndFreq: randomBetween(80, 1400),
    sweepTime: randomBetween(0.05, 0.6, 2),
    filterEnabled: Math.random() > 0.4,
    filterType: FILTER_TYPES[Math.floor(Math.random() * FILTER_TYPES.length)],
    filterFrequency: randomBetween(100, 4000),
    filterQ: randomBetween(0.5, 8, 1),
    filterEnvAmount: randomBetween(-1500, 1500),
    filterEnvDecay: randomBetween(0.05, 0.8, 2),
    distortionAmount: Math.random() > 0.6 ? randomBetween(0, 150) : 0,
    delayWet: Math.random() > 0.6 ? randomBetween(0.1, 0.4, 2) : 0,
    delayTime: randomBetween(0.05, 0.5, 2),
    delayFeedback: randomBetween(0.1, 0.6, 2),
    pan: randomBetween(-0.5, 0.5, 2),
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState('designer');
  const [soundState, setSoundState] = useState(DEFAULT_STATE);
  const [playOnChange, setPlayOnChange] = useState(false);
  const [variation, setVariation] = useState(0);
  const [library, setLibrary] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY)) ?? [];
    } catch {
      return [];
    }
  });
  const isFirstRender = useRef(true);

  // Persist library to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  const handleAddToLibrary = useCallback((name, params) => {
    const entry = { id: `${Date.now()}_${Math.random()}`, name, params };
    setLibrary((prev) => [...prev, entry]);
  }, []);

  const handleRemoveFromLibrary = useCallback((id) => {
    setLibrary((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleClearLibrary = useCallback(() => {
    setLibrary([]);
  }, []);

  const handleParamChange = useCallback((param, value) => {
    setSoundState((prev) => {
      const next = { ...prev, [param]: value };
      updateLiveParams(next);
      return next;
    });
  }, []);

  const handlePlay = useCallback(() => {
    playSound(soundState);
  }, [soundState]);

  const handleStop = useCallback(() => {
    stopSound();
  }, []);

  const handleImport = useCallback((newState) => {
    setSoundState((prev) => ({ ...prev, ...newState }));
  }, []);

  const handlePreset = useCallback((presetName) => {
    const next = varyPreset(PRESETS[presetName], variation);
    setSoundState(next);
    playSound(next);
  }, [variation]);

  const handleRandomize = useCallback(() => {
    const next = randomizeState();
    setSoundState(next);
    playSound(next);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (playOnChange) playSound(soundState);
  }, [soundState, playOnChange]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        playSound(soundState);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [soundState]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">Web Sound Designer</h1>
          <p className="app-subtitle">Browser-based sound synthesis with Web Audio API</p>
        </div>
        <nav className="app-tabs">
          <button
            className={`app-tab${activeTab === 'designer' ? ' app-tab--active' : ''}`}
            onClick={() => setActiveTab('designer')}
          >Designer</button>
          <button
            className={`app-tab${activeTab === 'library' ? ' app-tab--active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            Library
            {library.length > 0 && <span className="app-tab-badge">{library.length}</span>}
          </button>
          <button
            className={`app-tab${activeTab === 'player' ? ' app-tab--active' : ''}`}
            onClick={() => setActiveTab('player')}
          >Player</button>
        </nav>
      </header>

      {activeTab === 'player' && <PlayerTab />}

      {activeTab === 'library' && (
        <LibraryTab
          workingLibrary={library}
          onPlay={(params) => playSound(params)}
          onLoadIntoDesigner={(params) => { setSoundState(params); setActiveTab('designer'); }}
          onAddToWorking={handleAddToLibrary}
          onRemoveFromWorking={handleRemoveFromLibrary}
          onClearWorking={handleClearLibrary}
          onSwitchToDesigner={() => setActiveTab('designer')}
        />
      )}

      {activeTab === 'designer' && <>
      <div className="presets-bar">
        <span className="presets-label">Presets:</span>
        {Object.keys(PRESETS).map((name) => (
          <button key={name} className="btn btn--preset" onClick={() => handlePreset(name)}>
            {name}
          </button>
        ))}
        <button className="btn btn--randomize" onClick={handleRandomize}>
          Randomize
        </button>
        <div className="mutation-control">
          <span className="presets-label">Mutation:</span>
          <input
            type="range"
            className="slider mutation-slider"
            min={0}
            max={1}
            step={0.01}
            value={variation}
            onChange={(e) => setVariation(parseFloat(e.target.value))}
          />
          <button className="btn btn--mutate" onClick={() => {
            const next = varyPreset(soundState, variation);
            setSoundState(next);
            playSound(next);
          }}>
            Mutate
          </button>
        </div>
      </div>

      <main className="app-main">
        <aside className="panel panel--controls">
          <h2 className="panel-title">Sound Controls</h2>
          <SoundControls state={soundState} onParamChange={handleParamChange} />
        </aside>

        <section className="panel panel--export">
          <h2 className="panel-title">Playback / Export / Import</h2>
          <ExportPanel
            state={soundState}
            onPlay={handlePlay}
            onStop={handleStop}
            onImport={handleImport}
            playOnChange={playOnChange}
            onPlayOnChangeToggle={setPlayOnChange}
            onAddToLibrary={handleAddToLibrary}
          />
        </section>
      </main>
      </>}
    </div>
  );
}
