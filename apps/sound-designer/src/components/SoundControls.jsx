import { useState } from 'react';
import WaveformSelector from './WaveformSelector';

function Slider({ label, id, min, max, step, value, unit, onChange, tip }) {
  const display = unit === 'ms'
    ? `${Math.round(value * 1000)} ms`
    : unit
      ? `${value} ${unit}`
      : String(value);

  return (
    <div className="control-group">
      <div className="control-header">
        <label htmlFor={id} className="control-label" data-tooltip={tip}>{label}</label>
        <span className="control-value">{display}</span>
      </div>
      <input
        type="range"
        id={id}
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

function Select({ label, id, value, options, onChange, tip }) {
  return (
    <div className="control-group">
      <div className="control-header">
        <label htmlFor={id} className="control-label" data-tooltip={tip}>{label}</label>
      </div>
      <select
        id={id}
        className="waveform-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, id, value, onChange, tip }) {
  return (
    <div className="control-group control-group--inline">
      <label htmlFor={id} className="control-label" data-tooltip={tip}>{label}</label>
      <input
        type="checkbox"
        id={id}
        className="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="control-value" style={{ minWidth: 32 }}>{value ? 'On' : 'Off'}</span>
    </div>
  );
}

const LFO_WAVEFORMS = [
  { value: 'sine',     label: 'Sine' },
  { value: 'square',   label: 'Square' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'sawtooth', label: 'Sawtooth' },
];

const LFO_TARGETS = [
  { value: 'frequency', label: 'Frequency (Vibrato)' },
  { value: 'volume',    label: 'Volume (Tremolo)' },
  { value: 'filter',    label: 'Filter Cutoff' },
];

const FILTER_TYPES = [
  { value: 'lowpass',   label: 'Lowpass' },
  { value: 'highpass',  label: 'Highpass' },
  { value: 'bandpass',  label: 'Bandpass' },
  { value: 'notch',     label: 'Notch' },
  { value: 'peaking',   label: 'Peaking' },
  { value: 'lowshelf',  label: 'Low Shelf' },
  { value: 'highshelf', label: 'High Shelf' },
];

const TABS = ['Osc', 'Envelope', 'Filter', 'FX'];

export default function SoundControls({ state, onParamChange }) {
  const [activeTab, setActiveTab] = useState('Osc');
  const p = state;
  const set = onParamChange;

  return (
    <div className="sound-controls">
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn${activeTab === tab ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="tab-content">

        {activeTab === 'Osc' && (
          <>
            <WaveformSelector value={p.waveform} onChange={(v) => set('waveform', v)}
              tip="Shape of the oscillator wave. Sine is smooth and pure; square is buzzy; sawtooth is bright and harsh; triangle is softer than square." />
            <Slider label="Frequency" id="frequency" min={50} max={2000} step={1}
              value={p.frequency} unit="Hz" onChange={(v) => set('frequency', v)}
              tip="Base pitch of the sound. 440 Hz = A4 (concert pitch). Lower = deeper, higher = brighter." />
            <Slider label="Volume" id="volume" min={0} max={1} step={0.01}
              value={p.volume} unit="" onChange={(v) => set('volume', v)}
              tip="Overall loudness. Keep below 0.8 when layering sounds to avoid clipping." />
            <Slider label="Detune" id="detune" min={-100} max={100} step={1}
              value={p.detune} unit="¢" onChange={(v) => set('detune', v)}
              tip="Fine-tune pitch in cents (100 cents = 1 semitone). Useful for slight pitch drift or chorus-like effects." />
            <Slider label="Pan" id="pan" min={-1} max={1} step={0.01}
              value={p.pan} unit="" onChange={(v) => set('pan', v)}
              tip="Stereo position. -1 = full left, 0 = center, +1 = full right." />
            <div className="tab-divider" />
            <p className="tab-section-label">Noise</p>
            <Toggle label="Enable" id="noiseEnabled" value={p.noiseEnabled} onChange={(v) => set('noiseEnabled', v)}
              tip="Mixes white noise into the signal. Useful for explosions, wind, whooshes, and adding texture." />
            <Slider label="Noise Level" id="noiseLevel" min={0} max={1} step={0.01}
              value={p.noiseLevel} unit="" onChange={(v) => set('noiseLevel', v)}
              tip="Volume of the noise layer relative to the oscillator." />
          </>
        )}

        {activeTab === 'Envelope' && (
          <>
            <Slider label="Attack" id="attack" min={0} max={2} step={0.001}
              value={p.attack} unit="ms" onChange={(v) => set('attack', v)}
              tip="Time to ramp from silence to full volume. Short = punchy, long = slow fade-in." />
            <Slider label="Decay" id="decay" min={0} max={2} step={0.001}
              value={p.decay} unit="ms" onChange={(v) => set('decay', v)}
              tip="Time to fall from peak volume down to the sustain level after the attack." />
            <Slider label="Sustain" id="sustain" min={0} max={1} step={0.01}
              value={p.sustain} unit="" onChange={(v) => set('sustain', v)}
              tip="Volume level held while the sound is active. 0 = silent after decay (percussive), 1 = no volume drop." />
            <Slider label="Release" id="release" min={0} max={2} step={0.001}
              value={p.release} unit="ms" onChange={(v) => set('release', v)}
              tip="Time to fade from sustain level to silence when the sound stops." />
            <div className="tab-divider" />
            <p className="tab-section-label">Pitch Sweep</p>
            <Toggle label="Enable" id="sweepEnabled" value={p.sweepEnabled} onChange={(v) => set('sweepEnabled', v)}
              tip="Glides the pitch from the oscillator frequency to the end frequency. Great for lasers, jump sounds, and coin effects." />
            <Slider label="End Frequency" id="sweepEndFreq" min={50} max={2000} step={1}
              value={p.sweepEndFreq} unit="Hz" onChange={(v) => set('sweepEndFreq', v)}
              tip="Target pitch at the end of the sweep. Set lower than frequency for a downward sweep, higher for an upward sweep." />
            <Slider label="Sweep Time" id="sweepTime" min={0.01} max={2} step={0.01}
              value={p.sweepTime} unit="s" onChange={(v) => set('sweepTime', v)}
              tip="How long the pitch glide takes to reach the end frequency." />
          </>
        )}

        {activeTab === 'Filter' && (
          <>
            <Toggle label="Enable" id="filterEnabled" value={p.filterEnabled} onChange={(v) => set('filterEnabled', v)}
              tip="Activates the filter. Filters sculpt the tone by boosting or cutting frequency ranges." />
            <Select label="Type" id="filterType" value={p.filterType} options={FILTER_TYPES}
              onChange={(v) => set('filterType', v)}
              tip="Lowpass: removes highs (warm/muffled). Highpass: removes lows (thin/airy). Bandpass: keeps a narrow range. Notch: cuts a narrow range. Peaking: boosts or cuts a band." />
            <Slider label="Cutoff" id="filterFrequency" min={20} max={8000} step={1}
              value={p.filterFrequency} unit="Hz" onChange={(v) => set('filterFrequency', v)}
              tip="The frequency where the filter starts to take effect. Lower = darker sound, higher = brighter." />
            <Slider label="Resonance (Q)" id="filterQ" min={0.1} max={20} step={0.1}
              value={p.filterQ} unit="" onChange={(v) => set('filterQ', v)}
              tip="Sharpness of the filter. Higher values create a resonant peak at the cutoff — can produce a 'wah' or 'whistling' quality." />
            <div className="tab-divider" />
            <p className="tab-section-label">Filter Envelope</p>
            <Slider label="Env Amount" id="filterEnvAmount" min={-4000} max={4000} step={10}
              value={p.filterEnvAmount} unit="Hz" onChange={(v) => set('filterEnvAmount', v)}
              tip="How much the cutoff sweeps at the start of the sound. Positive = sweeps up then returns; negative = sweeps down then returns." />
            <Slider label="Env Decay" id="filterEnvDecay" min={0.01} max={2} step={0.01}
              value={p.filterEnvDecay} unit="s" onChange={(v) => set('filterEnvDecay', v)}
              tip="How quickly the filter envelope sweep returns to the base cutoff frequency." />
          </>
        )}

        {activeTab === 'FX' && (
          <>
            <p className="tab-section-label">Distortion</p>
            <Slider label="Drive" id="distortionAmount" min={0} max={400} step={1}
              value={p.distortionAmount} unit="" onChange={(v) => set('distortionAmount', v)}
              tip="Waveshaper distortion. Adds harmonic saturation and grit. Low values = subtle warmth; high values = heavy clipping." />
            <div className="tab-divider" />
            <p className="tab-section-label">Delay</p>
            <Slider label="Wet Mix" id="delayWet" min={0} max={1} step={0.01}
              value={p.delayWet} unit="" onChange={(v) => set('delayWet', v)}
              tip="How much of the echo is heard. 0 = no delay effect. Combine with feedback for repeating echoes." />
            <Slider label="Time" id="delayTime" min={0.01} max={1} step={0.01}
              value={p.delayTime} unit="s" onChange={(v) => set('delayTime', v)}
              tip="Time between the original sound and its echo. Short (< 0.05s) = slap-back; longer = distinct repeating echo." />
            <Slider label="Feedback" id="delayFeedback" min={0} max={0.95} step={0.01}
              value={p.delayFeedback} unit="" onChange={(v) => set('delayFeedback', v)}
              tip="How much of each echo feeds back into the delay. High values create long trails; keep below 0.9 to avoid runaway feedback." />
            <div className="tab-divider" />
            <p className="tab-section-label">LFO</p>
            <Select label="Waveform" id="lfoWaveform" value={p.lfoWaveform} options={LFO_WAVEFORMS}
              onChange={(v) => set('lfoWaveform', v)}
              tip="Shape of the LFO oscillation. Sine = smooth wobble; square = abrupt switching; sawtooth = rising ramp." />
            <Select label="Target" id="lfoTarget" value={p.lfoTarget} options={LFO_TARGETS}
              onChange={(v) => set('lfoTarget', v)}
              tip="What the LFO modulates. Frequency = vibrato (pitch wobble). Volume = tremolo (loudness wobble). Filter Cutoff = wah-like tonal wobble." />
            <Slider label="Rate" id="lfoRate" min={0} max={20} step={0.1}
              value={p.lfoRate} unit="Hz" onChange={(v) => set('lfoRate', v)}
              tip="Speed of the LFO. 0 = off. 1-5 Hz = slow wobble; 5-15 Hz = fast vibrato/tremolo." />
            <Slider label="Depth" id="lfoDepth" min={0} max={100} step={1}
              value={p.lfoDepth} unit="" onChange={(v) => set('lfoDepth', v)}
              tip="Intensity of the LFO modulation. For frequency target, depth is in Hz (pitch deviation). For volume, it scales the loudness swing." />
          </>
        )}

      </div>
    </div>
  );
}
