const WAVEFORMS = ['sine', 'square', 'triangle', 'sawtooth'];

export default function WaveformSelector({ value, onChange, tip }) {
  return (
    <div className="control-group">
      <label htmlFor="waveform-select" className="control-label" data-tooltip={tip}>
        Waveform
      </label>
      <select
        id="waveform-select"
        className="waveform-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {WAVEFORMS.map((w) => (
          <option key={w} value={w}>
            {w.charAt(0).toUpperCase() + w.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
