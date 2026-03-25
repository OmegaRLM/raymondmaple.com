import { useState, useRef } from 'react';
import { generateLibraryJSON, generateLibraryJS, generatePlayerOnlyCode, sanitizeName } from '../audio/generatePlayer';

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Converts a { name: params } JSON object into the internal array format
function jsonObjToLibrary(obj) {
  return Object.entries(obj).map(([name, params]) => ({
    id: `${Date.now()}_${Math.random()}`,
    name: sanitizeName(name),
    params,
  }));
}

function SoundRow({ sound, onPlay, actions }) {
  const { params } = sound;
  return (
    <tr className="lib-row">
      {actions.selectable && (
        <td className="lib-cell lib-cell--check">
          <input
            type="checkbox"
            className="checkbox"
            checked={actions.selected}
            onChange={() => actions.onToggleSelect(sound.id)}
          />
        </td>
      )}
      <td className="lib-cell lib-name">{sound.name}</td>
      {!actions.compact && <>
        <td className="lib-cell">{params.waveform}</td>
        <td className="lib-cell">{params.frequency} Hz</td>
        <td className="lib-cell lib-fx">
          {params.filterEnabled          && <span className="fx-tag">filter</span>}
          {params.distortionAmount > 0   && <span className="fx-tag">dist</span>}
          {params.delayWet > 0           && <span className="fx-tag">delay</span>}
          {params.lfoRate > 0 && params.lfoDepth > 0 && <span className="fx-tag">lfo</span>}
          {params.noiseEnabled           && <span className="fx-tag">noise</span>}
          {params.sweepEnabled           && <span className="fx-tag">sweep</span>}
        </td>
      </>}
      <td className="lib-cell lib-cell--actions">
        <button className="btn btn--secondary btn--small" onClick={() => onPlay(params)} title="Preview">▶</button>
        {actions.onAdd && (
          <button className="btn btn--secondary btn--small" onClick={() => actions.onAdd(sound)} title="Add to working library">→</button>
        )}
        {actions.onLoad && (
          <button className="btn btn--secondary btn--small" onClick={() => actions.onLoad(params)} title="Load into designer">Edit</button>
        )}
        {actions.onRemove && (
          <button className="library-remove-btn btn btn--small" onClick={() => actions.onRemove(sound.id)} title="Remove">✕</button>
        )}
      </td>
    </tr>
  );
}

function SoundTable({ sounds, onPlay, actions, emptyMsg }) {
  const allSelected = sounds.length > 0 && sounds.every(s => actions.selectedIds?.has(s.id));
  const someSelected = sounds.some(s => actions.selectedIds?.has(s.id));

  return sounds.length === 0 ? (
    <div className="lib-empty">{emptyMsg}</div>
  ) : (
    <div className="lib-table-wrapper">
      <table className="lib-table">
        <thead>
          <tr>
            {actions.selectable && (
              <th className="lib-th lib-cell--check">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={() => actions.onToggleAll(allSelected)}
                />
              </th>
            )}
            <th className="lib-th">Name</th>
            {!actions.compact && <>
              <th className="lib-th">Wave</th>
              <th className="lib-th">Freq</th>
              <th className="lib-th">FX</th>
            </>}
            <th className="lib-th"></th>
          </tr>
        </thead>
        <tbody>
          {sounds.map(sound => (
            <SoundRow
              key={sound.id}
              sound={sound}
              onPlay={onPlay}
              actions={{ ...actions, selected: actions.selectedIds?.has(sound.id) }}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LibraryTab({ workingLibrary, onPlay, onLoadIntoDesigner, onAddToWorking, onRemoveFromWorking, onClearWorking, onSwitchToDesigner }) {
  const [sourceLibrary, setSourceLibrary] = useState([]);
  const [sourceName, setSourceName] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [feedback, setFeedback] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [workingName, setWorkingName] = useState('my-sounds');
  const fileInputRef = useRef();

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 2500);
  };

  const handleLoadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target.result);
        setSourceLibrary(jsonObjToLibrary(obj));
        setSourceName(file.name.replace(/\.json$/, ''));
        setSelectedIds(new Set());
        showFeedback(`Loaded "${file.name}" — ${Object.keys(obj).length} sounds`);
      } catch {
        showFeedback('Error: invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleAll = (allSelected) => {
    setSelectedIds(allSelected ? new Set() : new Set(sourceLibrary.map(s => s.id)));
  };

  // Ensures unique name in target before adding
  const safeAdd = (sound) => {
    const existingNames = new Set(workingLibrary.map(s => s.name));
    let name = sound.name;
    let suffix = 2;
    while (existingNames.has(name)) name = `${sound.name}_${suffix++}`;
    onAddToWorking(name, sound.params);
  };

  const handleAddSelected = () => {
    const toAdd = sourceLibrary.filter(s => selectedIds.has(s.id));
    toAdd.forEach(safeAdd);
    showFeedback(`Added ${toAdd.length} sound${toAdd.length !== 1 ? 's' : ''} to working library`);
    setSelectedIds(new Set());
  };

  const handleSaveJS = () => {
    downloadFile(generateLibraryJS(workingLibrary), `${workingName}.js`, 'text/javascript');
    showFeedback(`${workingName}.js downloaded!`);
  };

  const handleSaveJSON = () => {
    downloadFile(generateLibraryJSON(workingLibrary), `${workingName}.json`, 'application/json');
    showFeedback(`${workingName}.json downloaded!`);
  };

  const handleDownloadPlayer = () => {
    downloadFile(generatePlayerOnlyCode(), 'sound-player.js', 'text/javascript');
    showFeedback('sound-player.js downloaded!');
  };

  const handleConfirmClear = () => {
    onClearWorking();
    setConfirmClear(false);
    showFeedback('Working library cleared');
  };

  return (
    <div className="library-tab">
      {/* Top toolbar */}
      <div className="lib-toolbar">
        <button className="btn btn--secondary btn--small" onClick={handleDownloadPlayer}>
          ↓ sound-player.js
        </button>
        {feedback && <span className="copy-feedback">{feedback}</span>}
      </div>

      <div className="lib-columns">

        {/* ── Left: Source Library ── */}
        <div className="lib-column">
          <div className="lib-column-header">
            <h3 className="lib-column-title">Source Library</h3>
            <div className="lib-column-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleLoadFile}
              />
              <button className="btn btn--secondary btn--small" onClick={() => fileInputRef.current.click()}>
                ↑ Load .json
              </button>
              {selectedIds.size > 0 && (
                <button className="btn btn--primary btn--small" onClick={handleAddSelected}>
                  Add {selectedIds.size} selected →
                </button>
              )}
            </div>
          </div>

          {sourceName && (
            <div className="lib-source-name">
              📂 {sourceName} — {sourceLibrary.length} sound{sourceLibrary.length !== 1 ? 's' : ''}
            </div>
          )}

          <SoundTable
            sounds={sourceLibrary}
            onPlay={onPlay}
            emptyMsg="Load a .json library file to see sounds here."
            actions={{
              selectable: true,
              selectedIds,
              onToggleSelect: handleToggleSelect,
              onToggleAll: handleToggleAll,
              onAdd: safeAdd,
            }}
          />
        </div>

        {/* ── Right: Working Library ── */}
        <div className="lib-column">
          <div className="lib-column-header">
            <h3 className="lib-column-title">
              Working Library
              <span className="library-count" style={{ marginLeft: 8 }}>
                {workingLibrary.length}
              </span>
            </h3>
            <div className="lib-column-actions">
              <input
                type="text"
                className="sound-name-input"
                value={workingName}
                onChange={e => setWorkingName(e.target.value)}
                placeholder="filename"
                style={{ width: 120 }}
                spellCheck={false}
              />
              <button className="btn btn--secondary btn--small" onClick={handleSaveJSON}
                disabled={!workingLibrary.length} title="Download as JSON — load via fetch() at runtime">
                ↓ .json
              </button>
              <button className="btn btn--secondary btn--small" onClick={handleSaveJS}
                disabled={!workingLibrary.length} title="Download as ES module — use with Vite/Webpack">
                ↓ .js
              </button>
              {!confirmClear ? (
                <button className="btn btn--small library-remove-btn" onClick={() => setConfirmClear(true)}
                  disabled={!workingLibrary.length} title="Clear working library">
                  Clear
                </button>
              ) : (
                <span className="lib-confirm-row">
                  Clear all?
                  <button className="btn btn--small btn--danger" onClick={handleConfirmClear}>Yes</button>
                  <button className="btn btn--small btn--secondary" onClick={() => setConfirmClear(false)}>No</button>
                </span>
              )}
            </div>
          </div>

          <SoundTable
            sounds={workingLibrary}
            onPlay={onPlay}
            emptyMsg={
              <span>
                No sounds yet.{' '}
                <button className="lib-link-btn" onClick={onSwitchToDesigner}>Go to Designer</button>
                {' '}and click <strong>+ Add to Library</strong>, or load sounds from the left.
              </span>
            }
            actions={{
              selectable: false,
              compact: true,
              onLoad: onLoadIntoDesigner,
              onRemove: onRemoveFromWorking,
            }}
          />
        </div>

      </div>
    </div>
  );
}
