import { generatePlayerOnlyCode } from '../audio/generatePlayer';

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CodeBlock({ code }) {
  return (
    <pre className="player-code-block">
      <code>{code}</code>
    </pre>
  );
}

function Step({ number, title, children }) {
  return (
    <div className="player-step">
      <div className="player-step-header">
        <span className="player-step-number">{number}</span>
        <h3 className="player-step-title">{title}</h3>
      </div>
      <div className="player-step-body">{children}</div>
    </div>
  );
}

export default function PlayerTab() {
  const handleDownload = () => {
    downloadFile(generatePlayerOnlyCode(), 'sound-player.js', 'text/javascript');
  };

  return (
    <div className="player-tab">

      <div className="player-hero">
        <div className="player-hero-text">
          <h2 className="player-hero-title">sound-player.js</h2>
          <p className="player-hero-desc">
            A self-contained Web Audio API engine with no dependencies.
            Download it once, drop it into your project, and call <code className="inline-code">playSound()</code> anywhere.
          </p>
        </div>
        <button className="btn btn--primary btn--large player-download-btn" onClick={handleDownload}>
          ↓ Download sound-player.js
        </button>
      </div>

      <div className="player-steps">

        <Step number="1" title="Add the file to your project">
          <p>Copy <code className="inline-code">sound-player.js</code> into your project. Any location works — a common convention:</p>
          <CodeBlock code={`your-project/\n  src/\n    audio/\n      sound-player.js   ← place it here\n      sounds.js         ← your exported sound library\n  index.html`} />
        </Step>

        <Step number="2" title="Export your sounds">
          <p>
            In the <strong>Designer</strong> tab, design a sound, name it, and click <strong>+ Add to Library</strong>.
            Repeat for each sound. Then go to the <strong>Library</strong> tab and download your sounds as
            either a <code className="inline-code">.js</code> module or a <code className="inline-code">.json</code> file.
          </p>
        </Step>

        <Step number="3" title="Import and call in a bundled app (Vite, Webpack, etc.)">
          <p>Use ES module imports. Both files use standard <code className="inline-code">export</code> / <code className="inline-code">import</code> syntax.</p>
          <CodeBlock code={`import { playSound, stopSound } from './audio/sound-player.js';\nimport { coinSound, laserSound, jumpSound } from './audio/sounds.js';\n\n// Play a sound\nplaySound(coinSound);\n\n// Stop whatever is currently playing\nstopSound();\n\n// Play with inline params (no library file needed)\nplaySound({ waveform: 'sine', frequency: 440, volume: 0.5,\n            attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 });`} />
        </Step>

        <Step number="4" title="Use via a plain script tag (no bundler)">
          <p>Add both files as scripts. The player exposes <code className="inline-code">playSound</code> and <code className="inline-code">stopSound</code> as global functions.</p>
          <CodeBlock code={`<!-- In your HTML -->\n<script src="audio/sound-player.js"></script>\n<script src="audio/sounds.js"></script>\n\n<script>\n  // Call after a user gesture (click, keypress)\n  document.getElementById('shoot-btn').addEventListener('click', () => {\n    playSound(laserSound);\n  });\n</script>`} />
        </Step>

        <Step number="5" title="Load sounds from JSON at runtime (fetch)">
          <p>If you exported <code className="inline-code">sounds.json</code>, you can fetch it at runtime — useful when you want to add or swap sounds without touching your code.</p>
          <CodeBlock code={`import { playSound } from './audio/sound-player.js';\n\nconst sounds = await fetch('./audio/sounds.json').then(r => r.json());\n\n// sounds is a plain object: { coinSound: {...}, laserSound: {...} }\nplaySound(sounds.coinSound);\nplaySound(sounds.laserSound);`} />
        </Step>

        <Step number="6" title="Autoplay policy — important">
          <p>
            Browsers block audio until the user interacts with the page. Always call <code className="inline-code">playSound()</code> inside
            an event handler triggered by a user gesture (click, keydown, touch). The player handles
            the AudioContext resume automatically once a gesture has occurred.
          </p>
          <CodeBlock code={`// ✅ Works — called from a user gesture\nbutton.addEventListener('click', () => playSound(coinSound));\nwindow.addEventListener('keydown', (e) => {\n  if (e.code === 'Space') playSound(jumpSound);\n});\n\n// ❌ Won't work — called on page load with no prior interaction\nwindow.onload = () => playSound(coinSound);`} />
        </Step>

      </div>

      <div className="player-params-section">
        <h3 className="player-params-title">Full parameter reference</h3>
        <table className="player-params-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['waveform',        'string',  '"sine"',    'Oscillator shape: sine, square, triangle, sawtooth'],
              ['frequency',       'number',  '440',       'Base pitch in Hz (50–2000)'],
              ['volume',          'number',  '0.5',       'Master volume (0–1)'],
              ['detune',          'number',  '0',         'Fine-tune in cents (−100 to +100)'],
              ['pan',             'number',  '0',         'Stereo position (−1 left, 0 center, +1 right)'],
              ['attack',          'number',  '0.01',      'Time to reach full volume (seconds)'],
              ['decay',           'number',  '0.1',       'Time to fall to sustain level (seconds)'],
              ['sustain',         'number',  '0.5',       'Hold volume level (0–1)'],
              ['release',         'number',  '0.2',       'Fade-out time after sound stops (seconds)'],
              ['sweepEnabled',    'boolean', 'false',     'Glide pitch from frequency to sweepEndFreq'],
              ['sweepEndFreq',    'number',  '220',       'Target pitch for sweep (Hz)'],
              ['sweepTime',       'number',  '0.3',       'Duration of pitch sweep (seconds)'],
              ['filterEnabled',   'boolean', 'false',     'Enable BiquadFilter'],
              ['filterType',      'string',  '"lowpass"', 'Filter shape: lowpass, highpass, bandpass, notch, peaking…'],
              ['filterFrequency', 'number',  '800',       'Filter cutoff frequency (Hz)'],
              ['filterQ',         'number',  '1',         'Filter resonance / Q factor'],
              ['filterEnvAmount', 'number',  '0',         'Cutoff sweep at start (Hz, can be negative)'],
              ['filterEnvDecay',  'number',  '0.3',       'How fast filter envelope returns (seconds)'],
              ['distortionAmount','number',  '0',         'Waveshaper drive (0–400)'],
              ['delayWet',        'number',  '0',         'Delay mix, 0 = off (0–1)'],
              ['delayTime',       'number',  '0.3',       'Echo time (seconds)'],
              ['delayFeedback',   'number',  '0.3',       'Echo repeats (0–0.95)'],
              ['lfoRate',         'number',  '0',         'LFO speed in Hz, 0 = off'],
              ['lfoDepth',        'number',  '0',         'LFO intensity'],
              ['lfoWaveform',     'string',  '"sine"',    'LFO shape: sine, square, triangle, sawtooth'],
              ['lfoTarget',       'string',  '"frequency"','What LFO modulates: frequency, volume, filter'],
              ['noiseEnabled',    'boolean', 'false',     'Mix in white noise'],
              ['noiseLevel',      'number',  '0.3',       'Noise volume (0–1)'],
            ].map(([param, type, def, desc]) => (
              <tr key={param}>
                <td><code className="inline-code">{param}</code></td>
                <td className="player-param-type">{type}</td>
                <td className="player-param-default">{def}</td>
                <td className="player-param-desc">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
