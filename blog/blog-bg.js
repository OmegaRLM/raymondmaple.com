'use strict';
(function () {

  const canvas = document.getElementById('fluid-bg');
  if (!canvas) return;

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const gl = canvas.getContext('webgl', { alpha: false, depth: false, stencil: false, antialias: false });
  if (!gl) return;

  // ── extensions ────────────────────────────────────────────
  const hfExt     = gl.getExtension('OES_texture_half_float');
  const hfLinear  = gl.getExtension('OES_texture_half_float_linear');
  gl.getExtension('OES_texture_float');
  gl.getExtension('OES_texture_float_linear');

  const HF = hfExt ? hfExt.HALF_FLOAT_OES : null;

  // Test half-float render target support
  function testHalfFloat() {
    if (!HF) return false;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, HF, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(tex);
    return ok;
  }

  const useHF   = testHalfFloat();
  const TEX     = useHF ? HF : gl.UNSIGNED_BYTE;
  const FILTER  = (useHF && hfLinear) ? gl.LINEAR : gl.NEAREST;

  // UNSIGNED_BYTE can't store negatives — encode velocity as [0,1] offset by 0.5
  const ENCODE_VEL = !useHF;

  // ── shaders ───────────────────────────────────────────────
  const VS = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() {
      vUv = aPos * 0.5 + 0.5;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  // Velocity stored as-is (half-float) or offset by 0.5 (ubyte)
  const DECODE = ENCODE_VEL
    ? 'vec2 decodeVel(vec2 v) { return (v - 0.5) * 20.0; }'
    : 'vec2 decodeVel(vec2 v) { return v; }';
  const ENCODE = ENCODE_VEL
    ? 'vec2 encodeVel(vec2 v) { return v / 20.0 + 0.5; }'
    : 'vec2 encodeVel(vec2 v) { return v; }';

  const ADVECT_FS = `
    precision highp float;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform float uDt;
    uniform float uDissipation;
    uniform bool uIsVelocity;
    varying vec2 vUv;
    ${DECODE}
    ${ENCODE}
    void main() {
      vec2 vel = decodeVel(texture2D(uVelocity, vUv).xy);
      vec2 coord = vUv - uDt * vel;
      vec4 s = uDissipation * texture2D(uSource, coord);
      if (uIsVelocity) {
        gl_FragColor = vec4(encodeVel(decodeVel(s.xy)), 0.0, 1.0);
      } else {
        gl_FragColor = s;
      }
    }
  `;

  const SPLAT_VEL_FS = `
    precision highp float;
    uniform sampler2D uBase;
    uniform vec2 uPoint;
    uniform vec2 uVelocity;
    uniform float uRadius;
    uniform float uAspect;
    varying vec2 vUv;
    ${DECODE}
    ${ENCODE}
    void main() {
      vec2 d = vUv - uPoint;
      d.x *= uAspect;
      float s = exp(-dot(d, d) / uRadius);
      vec2 vel = decodeVel(texture2D(uBase, vUv).xy) + s * uVelocity;
      gl_FragColor = vec4(encodeVel(vel), 0.0, 1.0);
    }
  `;

  const SPLAT_DYE_FS = `
    precision highp float;
    uniform sampler2D uBase;
    uniform vec2 uPoint;
    uniform vec3 uColor;
    uniform float uRadius;
    uniform float uAspect;
    varying vec2 vUv;
    void main() {
      vec2 d = vUv - uPoint;
      d.x *= uAspect;
      float s = exp(-dot(d, d) / uRadius);
      vec3 col = texture2D(uBase, vUv).xyz + s * uColor;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const DIV_FS = `
    precision highp float;
    uniform sampler2D uVelocity;
    uniform vec2 uTexel;
    varying vec2 vUv;
    ${DECODE}
    void main() {
      vec2 L = decodeVel(texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).xy);
      vec2 R = decodeVel(texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).xy);
      vec2 T = decodeVel(texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).xy);
      vec2 B = decodeVel(texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).xy);
      float div = 0.5 * (R.x - L.x + T.y - B.y);
      gl_FragColor = vec4(div * 0.5 + 0.5, 0.0, 0.0, 1.0);
    }
  `;

  const PRESSURE_FS = `
    precision highp float;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    uniform vec2 uTexel;
    varying vec2 vUv;
    void main() {
      float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x * 2.0 - 1.0;
      float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x * 2.0 - 1.0;
      float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x * 2.0 - 1.0;
      float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x * 2.0 - 1.0;
      float div = texture2D(uDivergence, vUv).x * 2.0 - 1.0;
      float p = (L + R + T + B - div) * 0.25;
      gl_FragColor = vec4(p * 0.5 + 0.5, 0.0, 0.0, 1.0);
    }
  `;

  const GRAD_SUB_FS = `
    precision highp float;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    uniform vec2 uTexel;
    varying vec2 vUv;
    ${DECODE}
    ${ENCODE}
    void main() {
      float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x * 2.0 - 1.0;
      float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x * 2.0 - 1.0;
      float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x * 2.0 - 1.0;
      float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x * 2.0 - 1.0;
      vec2 vel = decodeVel(texture2D(uVelocity, vUv).xy);
      vel -= 0.5 * vec2(R - L, T - B);
      gl_FragColor = vec4(encodeVel(vel), 0.0, 1.0);
    }
  `;

  const DISPLAY_FS = `
    precision highp float;
    uniform sampler2D uDye;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(uDye, vUv).xyz;
      // Tone map: smooth brightness curve
      float lum = max(c.r, max(c.g, c.b));
      if (lum > 0.0) c = c / lum * (1.0 - exp(-lum * 8.0));
      // Add site background color
      gl_FragColor = vec4(vec3(0.051, 0.067, 0.090) + c, 1.0);
    }
  `;

  // ── compile helpers ───────────────────────────────────────
  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  function program(fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    p.u = {};
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      p.u[info.name] = gl.getUniformLocation(p, info.name);
    }
    return p;
  }

  const prog = {
    advect:   program(ADVECT_FS),
    splatVel: program(SPLAT_VEL_FS),
    splatDye: program(SPLAT_DYE_FS),
    div:      program(DIV_FS),
    pressure: program(PRESSURE_FS),
    gradSub:  program(GRAD_SUB_FS),
    display:  program(DISPLAY_FS),
  };

  // ── fullscreen quad ───────────────────────────────────────
  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  function useProgram(p) {
    gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    const loc = gl.getAttribLocation(p, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  // ── FBO helpers ───────────────────────────────────────────
  function makeTex(w, h, filter) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, TEX, null);
    return t;
  }

  function makeFBO(w, h, filter, clearR = 0, clearG = 0, clearB = 0) {
    const tex = makeTex(w, h, filter);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(clearR, clearG, clearB, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { fbo, tex, w, h };
  }

  function makeDouble(w, h, filter, clearR = 0, clearG = 0, clearB = 0) {
    let a = makeFBO(w, h, filter, clearR, clearG, clearB),
        b = makeFBO(w, h, filter, clearR, clearG, clearB);
    return {
      get read()  { return a; },
      get write() { return b; },
      swap() { [a, b] = [b, a]; },
    };
  }

  function blit(target, w, h) {
    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.w, target.h);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function tex(unit, t) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    return unit;
  }

  // ── buffers ───────────────────────────────────────────────
  const SIM = 128;
  const DYE = 512;

  const velClear   = ENCODE_VEL ? 0.5 : 0;
  const velocity   = makeDouble(SIM, SIM, FILTER, velClear, velClear, velClear);
  const dye        = makeDouble(DYE, DYE, FILTER, 0, 0, 0);
  const pressure   = makeDouble(SIM, SIM, gl.NEAREST, 0.5, 0.5, 0.5);
  const divergence = makeFBO(SIM, SIM, gl.NEAREST, 0, 0, 0);

  const simT = [1 / SIM, 1 / SIM];

  // ── simulation steps ──────────────────────────────────────
  function advectVelocity(dt) {
    useProgram(prog.advect);
    gl.uniform1i(prog.advect.u['uVelocity'], tex(0, velocity.read.tex));
    gl.uniform1i(prog.advect.u['uSource'],   tex(1, velocity.read.tex));
    gl.uniform1f(prog.advect.u['uDt'], dt);
    gl.uniform1f(prog.advect.u['uDissipation'], velDissipation);
    gl.uniform1i(prog.advect.u['uIsVelocity'], 1);
    blit(velocity.write);
    velocity.swap();
  }

  function advectDye(dt) {
    useProgram(prog.advect);
    gl.uniform1i(prog.advect.u['uVelocity'], tex(0, velocity.read.tex));
    gl.uniform1i(prog.advect.u['uSource'],   tex(1, dye.read.tex));
    gl.uniform1f(prog.advect.u['uDt'], dt);
    gl.uniform1f(prog.advect.u['uDissipation'], dyeDissipation);
    gl.uniform1i(prog.advect.u['uIsVelocity'], 0);
    blit(dye.write);
    dye.swap();
  }

  function addSplat(x, y, dx, dy, color, radius = 0.0008) {
    const aspect = canvas.width / canvas.height;

    useProgram(prog.splatVel);
    gl.uniform1i(prog.splatVel.u['uBase'], tex(0, velocity.read.tex));
    gl.uniform2f(prog.splatVel.u['uPoint'], x, y);
    gl.uniform2f(prog.splatVel.u['uVelocity'], dx, dy);
    gl.uniform1f(prog.splatVel.u['uRadius'], radius);
    gl.uniform1f(prog.splatVel.u['uAspect'], aspect);
    blit(velocity.write);
    velocity.swap();

    useProgram(prog.splatDye);
    gl.uniform1i(prog.splatDye.u['uBase'], tex(0, dye.read.tex));
    gl.uniform2f(prog.splatDye.u['uPoint'], x, y);
    gl.uniform3f(prog.splatDye.u['uColor'], color[0], color[1], color[2]);
    gl.uniform1f(prog.splatDye.u['uRadius'], radius * 1.2);
    gl.uniform1f(prog.splatDye.u['uAspect'], aspect);
    blit(dye.write);
    dye.swap();
  }

  function addAmbientVelocity(x, y, dx, dy) {
    const aspect = canvas.width / canvas.height;
    useProgram(prog.splatVel);
    gl.uniform1i(prog.splatVel.u['uBase'], tex(0, velocity.read.tex));
    gl.uniform2f(prog.splatVel.u['uPoint'], x, y);
    gl.uniform2f(prog.splatVel.u['uVelocity'], dx, dy);
    gl.uniform1f(prog.splatVel.u['uRadius'], 0.06);
    gl.uniform1f(prog.splatVel.u['uAspect'], aspect);
    blit(velocity.write);
    velocity.swap();
  }

  // Slowly drifting ambient flow direction
  let ambientAngle = Math.random() * Math.PI * 2;
  let ambientTurn  = (Math.random() - 0.5) * 0.0008;

  function injectAmbient() {
    // Gradually evolve flow direction; occasionally nudge it
    ambientAngle += ambientTurn;
    if (Math.random() < 0.004) ambientTurn = (Math.random() - 0.5) * 0.0008;

    // One broad, slow splat per frame — large radius = smooth flow, not wiggle
    const x     = Math.random();
    const y     = Math.random();
    const angle = ambientAngle + (Math.random() - 0.5) * 0.3;
    const speed = 0.04 + Math.random() * 0.03;
    addAmbientVelocity(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  function project() {
    // Divergence
    useProgram(prog.div);
    gl.uniform1i(prog.div.u['uVelocity'], tex(0, velocity.read.tex));
    gl.uniform2fv(prog.div.u['uTexel'], simT);
    blit(divergence);

    // Pressure solve
    useProgram(prog.pressure);
    gl.uniform1i(prog.pressure.u['uDivergence'], tex(1, divergence.tex));
    gl.uniform2fv(prog.pressure.u['uTexel'], simT);
    for (let i = 0; i < 25; i++) {
      gl.uniform1i(prog.pressure.u['uPressure'], tex(0, pressure.read.tex));
      blit(pressure.write);
      pressure.swap();
    }

    // Gradient subtract
    useProgram(prog.gradSub);
    gl.uniform1i(prog.gradSub.u['uPressure'], tex(0, pressure.read.tex));
    gl.uniform1i(prog.gradSub.u['uVelocity'], tex(1, velocity.read.tex));
    gl.uniform2fv(prog.gradSub.u['uTexel'], simT);
    blit(velocity.write);
    velocity.swap();
  }

  function render() {
    useProgram(prog.display);
    gl.uniform1i(prog.display.u['uDye'], tex(0, dye.read.tex));
    blit(null);
  }

  // ── mouse / touch input ───────────────────────────────────
  // Rainbow spread, kept dim for subtlety
  const COLORS = [
    [0.07, 0.17, 0.28],  // blue
    [0.05, 0.19, 0.08],  // green
    [0.18, 0.14, 0.28],  // purple
    [0.26, 0.17, 0.07],  // orange
    [0.06, 0.21, 0.21],  // teal
    [0.28, 0.06, 0.06],  // red
    [0.26, 0.24, 0.04],  // yellow
    [0.05, 0.22, 0.18],  // cyan-green
    [0.22, 0.08, 0.20],  // magenta
    [0.08, 0.10, 0.28],  // indigo
  ];
  // ── slider-controlled parameters ─────────────────────────
  // FADE:  slider 1-100 → dye dissipation 0.975-0.999  (higher = stays longer)
  // FORCE: slider 1-100 → force multiplier 0.1-2.0     (higher = stronger push)
  // VISC:  slider 1-100 → vel dissipation 0.995-0.950  (higher = more viscous/thick)
  let dyeDissipation = 0.988; // matches default fade slider value of 65
  let forceMultiplier = 1.0;  // matches default force slider value of 50
  let velDissipation  = 0.98; // matches default visc slider value of 33

  const fadeSlider  = document.getElementById('fade-slider');
  const forceSlider = document.getElementById('force-slider');
  const viscSlider  = document.getElementById('visc-slider');

  if (fadeSlider)  fadeSlider.addEventListener('input', e => {
    dyeDissipation = 0.975 + (parseInt(e.target.value) / 100) * 0.024;
  });
  if (forceSlider) forceSlider.addEventListener('input', e => {
    forceMultiplier = 0.1 + (parseInt(e.target.value) / 100) * 1.9;
  });
  if (viscSlider)  viscSlider.addEventListener('input', e => {
    // Higher slider = more viscous = velocity dies faster = lower dissipation
    velDissipation = 0.995 - (parseInt(e.target.value) / 100) * 0.045;
  });

  let colorIdx = 0;
  let lastX = -1, lastY = -1;

  function onMove(clientX, clientY) {
    const x =       clientX / canvas.width;
    const y = 1.0 - clientY / canvas.height;

    if (lastX < 0) { lastX = x; lastY = y; return; }

    const dx = (x - lastX);
    const dy = (y - lastY);
    lastX = x; lastY = y;

    const speed = Math.sqrt(dx * dx + dy * dy);
    if (speed < 0.00005) return;

    // Faster mouse = stronger velocity push over a wider area
    const scale  = (8 + speed * 300) * forceMultiplier;
    const radius = Math.min(0.000375 + speed * 0.03, 0.0045);

    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    addSplat(x, y, dx * scale, dy * scale, c, radius);
  }

  window.addEventListener('mousedown', e => {
    if (!e.target.closest('a, button, input, select, textarea'))
      document.body.classList.add('dragging');
  });
  window.addEventListener('mouseup',   () => { document.body.classList.remove('dragging'); lastX = -1; lastY = -1; });
  window.addEventListener('mousemove', e => {
    if (e.buttons === 1 && document.body.classList.contains('dragging')) {
      onMove(e.clientX, e.clientY);
    } else if (e.buttons === 0) {
      lastX = -1; lastY = -1;
    }
  });
  window.addEventListener('mouseleave', () => { lastX = -1; lastY = -1; });

  window.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.touches) onMove(t.clientX, t.clientY);
  }, { passive: false });
  window.addEventListener('touchend', () => { lastX = -1; lastY = -1; });

  // ── main loop ─────────────────────────────────────────────
  let lastTime = 0;
  function step(now) {
    const dt = Math.min((now - lastTime) * 0.001, 0.016);
    lastTime = now;

    // injectAmbient();
    advectVelocity(dt);
    advectDye(dt);
    project();
    render();

    requestAnimationFrame(step);
  }

  requestAnimationFrame(t => { lastTime = t; requestAnimationFrame(step); });

})();
