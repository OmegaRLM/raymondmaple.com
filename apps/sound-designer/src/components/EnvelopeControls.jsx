function EnvelopeSlider({ label, id, min, max, step, value, unit, onChange }) {
  const displayValue = unit === 'ms'
    ? `${Math.round(value * 1000)} ms`
    : value.toFixed(2);

  return (
    <div className="control-group">
      <div className="control-header">
        <label htmlFor={id} className="control-label">{label}</label>
        <span className="control-value">{displayValue}</span>
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

export default function EnvelopeControls({ attack, decay, sustain, release, onChange }) {
  return (
    <div className="envelope-controls">
      <h3 className="section-title">Envelope (ADSR)</h3>
      <EnvelopeSlider
        label="Attack"
        id="attack"
        min={0}
        max={2}
        step={0.001}
        value={attack}
        unit="ms"
        onChange={(v) => onChange('attack', v)}
      />
      <EnvelopeSlider
        label="Decay"
        id="decay"
        min={0}
        max={2}
        step={0.001}
        value={decay}
        unit="ms"
        onChange={(v) => onChange('decay', v)}
      />
      <EnvelopeSlider
        label="Sustain"
        id="sustain"
        min={0}
        max={1}
        step={0.01}
        value={sustain}
        unit="level"
        onChange={(v) => onChange('sustain', v)}
      />
      <EnvelopeSlider
        label="Release"
        id="release"
        min={0}
        max={2}
        step={0.001}
        value={release}
        unit="ms"
        onChange={(v) => onChange('release', v)}
      />
    </div>
  );
}
