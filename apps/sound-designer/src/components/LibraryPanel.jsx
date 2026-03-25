import { useState } from 'react';
import {
  generateLibraryJS,
  generateLibraryJSON,
  generatePlayerOnlyCode,
  sanitizeName,
} from '../audio/generatePlayer';

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LibraryPanel({ library, onPlay, onLoad, onRemove }) {
  const [feedback, setFeedback] = useState('');

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 2000);
  };

  const handleDownloadPlayer = () => {
    downloadFile(generatePlayerOnlyCode(), 'sound-player.js', 'text/javascript');
    showFeedback('sound-player.js downloaded!');
  };

  const handleExportJS = () => {
    if (!library.length) return;
    downloadFile(generateLibraryJS(library), 'sounds.js', 'text/javascript');
    showFeedback('sounds.js downloaded!');
  };

  const handleExportJSON = () => {
    if (!library.length) return;
    downloadFile(generateLibraryJSON(library), 'sounds.json', 'application/json');
    showFeedback('sounds.json downloaded!');
  };

  return (
    <section className="library-panel">
      <div className="library-header">
        <div className="library-title-row">
          <h2 className="panel-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            Sound Library
          </h2>
          <span className="library-count">{library.length} sound{library.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="library-actions">
          <button className="btn btn--secondary btn--small" onClick={handleDownloadPlayer}>
            ↓ sound-player.js
          </button>
          <button
            className="btn btn--secondary btn--small"
            onClick={handleExportJS}
            disabled={!library.length}
            title="ES module with named exports — use with Vite, Webpack, etc."
          >
            ↓ sounds.js
          </button>
          <button
            className="btn btn--secondary btn--small"
            onClick={handleExportJSON}
            disabled={!library.length}
            title="JSON map of all sounds — load via fetch() at runtime"
          >
            ↓ sounds.json
          </button>
          {feedback && <span className="copy-feedback">{feedback}</span>}
        </div>
      </div>

      {library.length === 0 ? (
        <div className="library-empty">
          <p>No sounds yet. Design a sound and click <strong>Add to Library</strong> to save it here.</p>
          <p className="library-empty-sub">
            Download <code className="inline-code">sound-player.js</code> once and keep it in your project.
            Export your sounds as <code className="inline-code">sounds.js</code> or <code className="inline-code">sounds.json</code> whenever you're ready.
          </p>
        </div>
      ) : (
        <div className="library-table-wrapper">
          <table className="library-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Waveform</th>
                <th>Freq</th>
                <th>Filter</th>
                <th>FX</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {library.map((sound) => (
                <tr key={sound.id}>
                  <td className="library-name">{sanitizeName(sound.name)}</td>
                  <td className="library-cell">{sound.params.waveform}</td>
                  <td className="library-cell">{sound.params.frequency} Hz</td>
                  <td className="library-cell">{sound.params.filterEnabled ? `${sound.params.filterType} ${sound.params.filterFrequency}Hz` : '—'}</td>
                  <td className="library-cell library-fx">
                    {sound.params.distortionAmount > 0 && <span className="fx-tag">dist</span>}
                    {sound.params.delayWet > 0 && <span className="fx-tag">delay</span>}
                    {sound.params.lfoRate > 0 && sound.params.lfoDepth > 0 && <span className="fx-tag">lfo</span>}
                    {sound.params.noiseEnabled && <span className="fx-tag">noise</span>}
                    {sound.params.sweepEnabled && <span className="fx-tag">sweep</span>}
                  </td>
                  <td className="library-row-actions">
                    <button
                      className="btn btn--secondary btn--small"
                      onClick={() => onPlay(sound.params)}
                      title="Preview this sound"
                    >▶</button>
                    <button
                      className="btn btn--secondary btn--small"
                      onClick={() => onLoad(sound.params)}
                      title="Load into editor"
                    >Edit</button>
                    <button
                      className="btn btn--small library-remove-btn"
                      onClick={() => onRemove(sound.id)}
                      title="Remove from library"
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {library.length > 0 && (
        <div className="library-usage-hint">
          <code className="inline-code">import {'{ playSound }'} from './sound-player.js';</code>
          <code className="inline-code">import {'{ ' + library.slice(0, 3).map(s => sanitizeName(s.name)).join(', ') + (library.length > 3 ? ', ...' : ' ') + '}'} from './sounds.js';</code>
        </div>
      )}
    </section>
  );
}
