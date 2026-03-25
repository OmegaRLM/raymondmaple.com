import { useState } from 'react';
import { sanitizeName } from '../audio/generatePlayer';

export default function ExportPanel({ state, onPlay, onStop, onImport, playOnChange, onPlayOnChangeToggle, onAddToLibrary }) {
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const [soundName, setSoundName] = useState('mySound');

  const jsonString = JSON.stringify(state, null, 2);

  const showFeedback = (msg) => {
    setCopyMsg(msg);
    setTimeout(() => setCopyMsg(''), 2000);
  };

  const handleExportJSON = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeName(soundName)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('JSON downloaded!');
  };

  const handleExportJS = () => {
    const jsCode = `playSound(${jsonString});`;
    navigator.clipboard.writeText(jsCode).then(() => {
      showFeedback('JS copied!');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = jsCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showFeedback('JS copied!');
    });
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      showFeedback('JSON copied!');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = jsonString;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showFeedback('JSON copied!');
    });
  };

  const handleAddToLibrary = () => {
    onAddToLibrary(sanitizeName(soundName), state);
    showFeedback(`"${sanitizeName(soundName)}" added to library!`);
  };

  const handleImport = () => {
    setImportError('');
    try {
      const parsed = JSON.parse(importText);
      onImport(parsed);
      setImportText('');
      showFeedback('Sound imported!');
    } catch (e) {
      setImportError('Invalid JSON: ' + e.message);
    }
  };

  return (
    <div className="export-panel">
      <div className="playback-controls">
        <button className="btn btn--primary btn--large" onClick={onPlay}>▶ Play Sound</button>
        <button className="btn btn--danger btn--large" onClick={onStop}>■ Stop</button>
        <label className="play-on-change-label">
          <input
            type="checkbox"
            className="checkbox"
            checked={playOnChange}
            onChange={(e) => onPlayOnChangeToggle(e.target.checked)}
          />
          Play on change
        </label>
        {copyMsg && <span className="copy-feedback">{copyMsg}</span>}
      </div>

      {/* Sound name + add to library */}
      <div className="sound-name-row">
        <div className="sound-name-field">
          <label htmlFor="soundName" className="sound-name-label">Sound name</label>
          <input
            id="soundName"
            type="text"
            className="sound-name-input"
            value={soundName}
            onChange={(e) => setSoundName(e.target.value)}
            placeholder="mySound"
            spellCheck={false}
          />
        </div>
        <button className="btn btn--primary" onClick={handleAddToLibrary}>
          + Add to Library
        </button>
      </div>

      {/* JSON preview */}
      <div className="json-preview-section">
        <div className="section-header">
          <h3 className="section-title">Sound Config</h3>
          <div className="button-group">
            <button className="btn btn--secondary btn--small" onClick={handleCopyJSON}>Copy</button>
            <button className="btn btn--secondary btn--small" onClick={handleExportJSON}>Export Sound</button>
            <button className="btn btn--secondary btn--small" onClick={handleExportJS}>Copy as Call</button>
          </div>
        </div>
        <pre className="json-preview">
          <code>{jsonString}</code>
        </pre>
      </div>

      {/* Import */}
      <div className="import-section">
        <h3 className="section-title">Import Sound</h3>
        <textarea
          className="import-textarea"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder='Paste JSON config here...'
          rows={5}
        />
        {importError && <p className="error-msg">{importError}</p>}
        <button className="btn btn--primary" onClick={handleImport} disabled={!importText.trim()}>
          Import Sound
        </button>
      </div>
    </div>
  );
}
