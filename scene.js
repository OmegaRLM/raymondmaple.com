import * as THREE from 'three';

export function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.z = 80;

  const PARTICLE_COUNT = 110;
  const CONNECT_DIST   = 26;
  const MAX_SEGMENTS   = 350;
  const BOUNDS         = { x: 150, y: 95, z: 30 };

  // --- Particles ---
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  const vel = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pos[i*3]   = (Math.random() - 0.5) * BOUNDS.x;
    pos[i*3+1] = (Math.random() - 0.5) * BOUNDS.y;
    pos[i*3+2] = (Math.random() - 0.5) * BOUNDS.z;
    vel[i*3]   = (Math.random() - 0.5) * 0.04;
    vel[i*3+1] = (Math.random() - 0.5) * 0.04;
    vel[i*3+2] = (Math.random() - 0.5) * 0.01;
  }

  const particleGeo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  particleGeo.setAttribute('position', posAttr);

  const particleMat = new THREE.PointsMaterial({
    color: 0x58a6ff,
    size: 1.0,
    transparent: true,
    opacity: 0.75,
    sizeAttenuation: true,
  });

  scene.add(new THREE.Points(particleGeo, particleMat));

  // --- Connection lines ---
  const linePosArr  = new Float32Array(MAX_SEGMENTS * 6);
  const lineGeo     = new THREE.BufferGeometry();
  const linePosAttr = new THREE.BufferAttribute(linePosArr, 3);
  linePosAttr.setUsage(THREE.DynamicDrawUsage);
  lineGeo.setAttribute('position', linePosAttr);
  lineGeo.setDrawRange(0, 0);

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x58a6ff,
    transparent: true,
    opacity: 0.18,
  });

  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  // --- Resize ---
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Mouse parallax ---
  let targetX = 0, targetY = 0;
  window.addEventListener('mousemove', e => {
    targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // --- Animation loop ---
  function animate() {
    requestAnimationFrame(animate);

    // Move particles, bounce at bounds
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i*3]   += vel[i*3];
      pos[i*3+1] += vel[i*3+1];
      pos[i*3+2] += vel[i*3+2];

      if (Math.abs(pos[i*3])   > BOUNDS.x / 2) vel[i*3]   *= -1;
      if (Math.abs(pos[i*3+1]) > BOUNDS.y / 2) vel[i*3+1] *= -1;
      if (Math.abs(pos[i*3+2]) > BOUNDS.z / 2) vel[i*3+2] *= -1;
    }
    particleGeo.attributes.position.needsUpdate = true;

    // Build line segments between nearby particles
    let segCount = 0;
    outer: for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        if (segCount >= MAX_SEGMENTS) break outer;
        const dx = pos[i*3]   - pos[j*3];
        const dy = pos[i*3+1] - pos[j*3+1];
        const dz = pos[i*3+2] - pos[j*3+2];
        if (dx*dx + dy*dy + dz*dz < CONNECT_DIST * CONNECT_DIST) {
          const b = segCount * 6;
          linePosArr[b]   = pos[i*3];   linePosArr[b+1] = pos[i*3+1]; linePosArr[b+2] = pos[i*3+2];
          linePosArr[b+3] = pos[j*3];   linePosArr[b+4] = pos[j*3+1]; linePosArr[b+5] = pos[j*3+2];
          segCount++;
        }
      }
    }
    lineGeo.setDrawRange(0, segCount * 2);
    lineGeo.attributes.position.needsUpdate = true;

    // Subtle camera drift following mouse
    camera.position.x += (targetX * 6  - camera.position.x) * 0.025;
    camera.position.y += (-targetY * 4 - camera.position.y) * 0.025;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  animate();
}
