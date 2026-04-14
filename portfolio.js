import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ============================================================
// Game data
// ============================================================
const GAMES = [
  {
    title: 'Disney Epic Mickey: Rebrushed',
    year: 2024, studio: 'recent',
    role: 'Senior Programmer',
    platform: 'Switch · PS4 · PS5 · Xbox · PC',
    company: 'Purple Lamp / THQ Nordic',
    desc: 'Add your description here.',
    boxArt: 'img/games/epic-mickey-rebrushed.jpg',
    gif: null,
  },
  {
    title: 'River City Girls 2',
    year: 2022, studio: 'wayforward',
    role: 'Special Thanks',
    platform: 'Switch · PS4 · PS5 · Xbox · PC',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/river-city-girls-2.jpg',
    gif: null,
  },
  {
    title: 'Disney Infinity 3.0 Edition',
    year: 2015, studio: 'disney',
    role: 'Programmer',
    platform: 'PS3 · PS4 · Xbox 360 · Xbox One · Wii U · PC · iOS',
    company: 'Avalanche Software',
    desc: 'This was the final game I worked on at Disney. It was a pretty sad time as we all hoped that we would work at Disney until retirement. What you learn about business is that making money is the only objective. I miss that time and my friends I worked with.',
    boxArt: 'img/games/disney-infinity-3.jpg',
    gif: null,
  },
  {
    title: 'Disney Infinity: Toy Box 2.0',
    year: 2015, studio: 'disney',
    role: 'Programmer',
    platform: 'iOS · Android',
    company: 'Avalanche Software',
    desc: 'Add your description here.',
    boxArt: 'img/games/disney-infinity-2.jpg',
    gif: null,
  },
  {
    title: 'Disney Infinity 2.0: Marvel Super Heroes',
    year: 2014, studio: 'disney',
    role: 'Programmer',
    platform: 'PS3 · PS4 · Xbox 360 · Xbox One · PS Vita · PC · iOS',
    company: 'Avalanche Software',
    desc: 'Add your description here.',
    boxArt: 'img/games/disney-infinity-2-marvel.jpg',
    gif: null,
  },
  {
    title: 'Disney Infinity',
    year: 2013, studio: 'disney',
    role: 'Programmer',
    platform: 'PS3 · Xbox 360 · Wii · Wii U · PC · iOS',
    company: 'Avalanche Software',
    desc: 'Add your description here.',
    boxArt: 'img/games/disney-infinity.jpg',
    gif: null,
  },
  {
    title: 'Disney·Pixar Cars 2',
    year: 2011, studio: 'disney',
    role: 'Programmer',
    platform: 'PS3 · Xbox 360 · Wii · NDS · 3DS · PC',
    company: 'Avalanche Software',
    desc: 'Add your description here.',
    boxArt: 'img/games/cars-2-2011.jpg',
    gif: null,
  },
  {
    title: 'Disney·Pixar Toy Story 3 — Shooting Gallery',
    year: 2010, studio: 'disney',
    role: 'Lead Programmer',
    platform: 'PS3 Move',
    company: 'Avalanche Software',
    desc: 'Add your description here.',
    boxArt: 'img/games/toy-story-3-shooting-gallery.jpg',
    gif: null,
  },
  {
    title: 'Disney·Pixar Toy Story 3',
    year: 2010, studio: 'disney',
    role: 'Programmer',
    platform: 'PS3 · Xbox 360 · Wii · NDS · PSP · PC',
    company: 'Avalanche Software',
    desc: 'Add your description here.',
    boxArt: 'img/games/toy-story-3.jpg',
    gif: null,
  },
  {
    title: 'Disney Epic Mickey',
    year: 2010, studio: 'disney',
    role: 'Senior Programmer',
    platform: 'Wii',
    company: 'Junction Point Studios',
    desc: 'Add your description here.',
    boxArt: 'img/games/epic-mickey.jpg',
    gif: null,
  },
  {
    title: 'Disney Cruise Line — Pirates of the Caribbean',
    year: 2009, studio: 'disney',
    role: 'Lead Programmer',
    platform: 'Interactive Experience',
    company: 'Disney Interactive',
    desc: 'Add your description here.',
    boxArt: 'img/games/pirates-cruise-line.jpg',
    gif: null,
  },
  {
    title: 'The Chronicles of Narnia: Prince Caspian',
    year: 2008, studio: 'disney',
    role: 'Programmer',
    platform: 'PS3 · Xbox 360 · Wii · NDS · PC',
    company: 'Fall Line Studio',
    desc: 'Add your description here.',
    boxArt: 'img/games/narnia-prince-caspian.jpg',
    gif: null,
  },
  {
    title: 'Ultimate Band',
    year: 2008, studio: 'disney',
    role: 'Additional Programming',
    platform: 'Wii · NDS',
    company: 'Fall Line Studio',
    desc: 'Add your description here.',
    boxArt: 'img/games/ultimate-band.jpg',
    gif: null,
  },
  {
    title: 'Contra 4',
    year: 2007, studio: 'wayforward',
    role: 'Contributor',
    platform: 'NDS',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/contra-4.jpg',
    gif: null,
  },
  {
    title: 'Looney Tunes: Duck Amuck',
    year: 2007, studio: 'wayforward',
    role: 'Programmer',
    platform: 'NDS',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/looney-tunes-duck-amuck.jpg',
    gif: null,
  },
  {
    title: 'SpongeBob SquarePants: Creature from the Krusty Krab',
    year: 2006, studio: 'wayforward',
    role: 'Lead Programmer',
    platform: 'GBA · NDS · GameCube · PS2 · Wii · PC',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/spongebob-creature-krusty-krab.jpg',
    gif: null,
  },
  {
    title: 'Looney Tunes Double Pack: Dizzy Driving / Acme Antics',
    year: 2006, studio: 'wayforward',
    role: 'Programmer',
    platform: 'GBA',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/looney-tunes-double-pack.jpg',
    gif: null,
  },
  {
    title: 'Teenage Mutant Ninja Turtles: Battle for the City',
    year: 2005, studio: 'wayforward',
    role: 'Programmer',
    platform: 'GBA',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/tmnt-battle-for-the-city.jpg',
    gif: null,
  },
  {
    title: 'Spy vs. Spy',
    year: 2003, studio: 'wayforward',
    role: 'Lead Programmer',
    platform: 'Xbox · PS2',
    company: 'WayForward',
    unreleased: true,
    desc: 'Add your description here.',
    boxArt: 'img/games/spy-vs-spy.jpg',
    gif: null,
  },
  {
    title: 'Shantae',
    year: 2002, studio: 'wayforward',
    role: 'Special Thanks',
    platform: 'GBC',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/shantae.jpg',
    gif: null,
  },
  {
    title: 'Pacific Gunner',
    year: 2002, studio: 'wayforward',
    role: 'Additional Programming',
    platform: 'PS2',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/pacific-gunner.jpg',
    gif: null,
  },
  {
    title: 'Pearl Harbor: Defend the Fleet',
    year: 2001, studio: 'wayforward',
    role: 'Programmer',
    platform: 'GBA',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/pearl-harbor.jpg',
    gif: null,
  },
  {
    title: 'Big Mouth Bass 3D',
    year: 2001, studio: 'wayforward',
    role: 'Lead Programmer',
    platform: 'Web',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/big-mouth-bass-3d.jpg',
    gif: null,
  },
  {
    title: 'Xtreme Sports',
    year: 2000, studio: 'wayforward',
    role: 'Special Thanks',
    platform: 'GBC',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/xtreme-sports-gbc.jpg',
    gif: null,
  },
  {
    title: 'GAMES Interactive 2',
    year: 2000, studio: 'wayforward',
    role: 'Programmer',
    platform: 'Windows',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/games-interactive-2.jpg',
    gif: null,
  },
  {
    title: 'Delirium',
    year: 2000, studio: 'wayforward',
    role: 'Lead Programmer',
    platform: 'Web',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/delirium.jpg',
    gif: null,
  },
  {
    title: 'Xtreme Sports Arcade: Summer Edition',
    year: 1999, studio: 'wayforward',
    role: 'Lead Programmer',
    platform: 'Windows',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/xtreme-sports-arcade.jpg',
    gif: null,
  },
  {
    title: 'Microshaft Winblows 98',
    year: 1998, studio: 'wayforward',
    role: 'Programmer',
    platform: 'Windows',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/microshaft-winblows-98.jpg',
    gif: null,
  },
  {
    title: 'FunPack 3D',
    year: 1998, studio: 'wayforward',
    role: 'Programmer',
    platform: 'Windows',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/funpack-3d.jpg',
    gif: null,
  },
  {
    title: 'Casper: Animated Activity Center',
    year: 1998, studio: 'wayforward',
    role: 'Programmer',
    platform: 'Windows',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/casper-activity-center.jpg',
    gif: null,
  },
  {
    title: 'Star Warped',
    year: 1997, studio: 'wayforward',
    role: 'Programmer',
    platform: 'PC',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/star-warped.jpg',
    gif: null,
  },
  {
    title: 'An American Tail: Animated MovieBook',
    year: 1997, studio: 'wayforward',
    role: 'Programmer',
    platform: 'Windows',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/american-tail.jpg',
    gif: null,
  },
  {
    title: 'The X-Fools: The Spoof Is Out There',
    year: 1997, studio: 'wayforward',
    role: 'Programmer',
    platform: 'Windows',
    company: 'WayForward',
    desc: 'Add your description here.',
    boxArt: 'img/games/x-fools.jpg',
    gif: null,
  },
];

// ============================================================
// State
// ============================================================
let currentIndex = 0;
let activeFilter = 'all';
let filteredGames = [...GAMES];

function getFiltered() {
  if (activeFilter === 'all') return GAMES;
  return GAMES.filter(g => g.studio === activeFilter);
}

// ============================================================
// DOM refs
// ============================================================
const titleEl    = document.getElementById('pf-title');
const yearLineEl = document.getElementById('pf-year-line');
const metaEl     = document.getElementById('pf-meta');
const descEl     = document.getElementById('pf-desc');
const counterEl  = document.getElementById('pf-counter');
const gameInfo   = document.querySelector('.pf-game-info');

function studioClass(studio) {
  if (studio === 'wayforward') return 'wayforward';
  if (studio === 'disney')     return 'disney';
  return 'recent';
}

function updateInfoPanel(game, index, total) {
  titleEl.innerHTML = game.title + (game.unreleased ? '<span class="pf-unreleased">Unreleased</span>' : '');
  yearLineEl.textContent = `${game.year}`;
  metaEl.innerHTML = `
    <span class="pf-badge pf-badge-role">${game.role}</span>
    <span class="pf-badge pf-badge-platform">${game.platform}</span>
    <span class="pf-badge pf-badge-studio ${studioClass(game.studio)}">${game.company}</span>
  `;
  descEl.textContent = game.desc;
  counterEl.textContent = `${index + 1} / ${total}`;
}

function transitionTo(index) {
  gameInfo.classList.add('transitioning');
  setTimeout(() => {
    currentIndex = index;
    const game = filteredGames[currentIndex];
    updateInfoPanel(game, currentIndex, filteredGames.length);
    loadGameAssets(game);
    gameInfo.classList.remove('transitioning');
  }, 150);
}

// ============================================================
// Filter buttons
// ============================================================
document.querySelectorAll('.pf-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pf-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    filteredGames = getFiltered();
    transitionTo(0);
  });
});

document.getElementById('pf-prev').addEventListener('click', () => {
  const next = (currentIndex - 1 + filteredGames.length) % filteredGames.length;
  transitionTo(next);
});

document.getElementById('pf-next').addEventListener('click', () => {
  const next = (currentIndex + 1) % filteredGames.length;
  transitionTo(next);
});

// ============================================================
// Three.js scene
// ============================================================
const canvas = document.getElementById('pf-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
camera.position.set(0, 1.5, 11);
camera.lookAt(0, 0, 0);

// ---- Lights ----
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

const keyLight = new THREE.DirectionalLight(0x8ab4ff, 2.0);
keyLight.position.set(4, 6, 6);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xd2a8ff, 0.8);
rimLight.position.set(-4, -2, -4);
scene.add(rimLight);

// Screen glow point light
const screenLight = new THREE.PointLight(0x4488ff, 1.5, 8);
screenLight.position.set(0, 0.2, 1.8);
scene.add(screenLight);

// ---- Root group (for float animation) ----
const root = new THREE.Group();
scene.add(root);

// ---- Screen (canvas texture with GIF) ----
const screenCanvas = document.createElement('canvas');
screenCanvas.width = 512;
screenCanvas.height = 384;
const screenCtx = screenCanvas.getContext('2d');
const screenTex = new THREE.CanvasTexture(screenCanvas);

const screen = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1), // resized after model loads
  new THREE.MeshBasicMaterial({ map: screenTex })
);
root.add(screen);

// ---- Box art case (on top of TV) ----
const BOX_W = 1.6, BOX_H = 2.2, BOX_D = 0.25;
const boxArtPlaceholderTex = makePlaceholderTex();

const boxCaseMats = [
  new THREE.MeshStandardMaterial({ color: 0x222230 }), // +x
  new THREE.MeshStandardMaterial({ color: 0x222230 }), // -x
  new THREE.MeshStandardMaterial({ color: 0x222230 }), // +y
  new THREE.MeshStandardMaterial({ color: 0x222230 }), // -y
  new THREE.MeshStandardMaterial({ map: boxArtPlaceholderTex }), // +z (front — box art)
  new THREE.MeshStandardMaterial({ color: 0x1a1a28 }), // -z (back)
];

const boxCase = new THREE.Mesh(new THREE.BoxGeometry(BOX_W, BOX_H, BOX_D), boxCaseMats);
boxCase.visible = false; // shown after model loads
root.add(boxCase);

// ---- Load TV model ----
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  '/img/models/tv.glb',
  (gltf) => {
    const tv = gltf.scene;
    tv.rotation.y = -Math.PI / 2;
    root.add(tv);

    // Center model
    const box = new THREE.Box3().setFromObject(tv);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    tv.position.sub(center);

    // Fit camera to model
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(0, size.y * 0.1, maxDim * 2.2);
    camera.near = maxDim * 0.01;
    camera.far = maxDim * 100;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    // Position screen on the front face center of the TV
    // Front face = max Z after centering
    const frontZ = box.max.z - center.z + 0.02;
    const screenW = size.x * 0.72;
    const screenH = size.y * 0.62;
    screen.geometry.dispose();
    screen.geometry = new THREE.PlaneGeometry(screenW, screenH);
    screen.position.set(0, size.y * 0.04, frontZ);

    // Update screen light position
    screenLight.position.set(0, size.y * 0.04, frontZ + 0.5);

    // Position box art above TV
    const topY = box.max.y - center.y;
    const boxScale = size.x * 0.22;
    boxCase.scale.setScalar(boxScale / BOX_W);
    boxCase.position.set(0, topY + (BOX_H * boxScale / BOX_W) * 0.5 + 0.05, frontZ * 0.5);
    boxCase.visible = true;
  },
  undefined,
  (err) => {
    console.error('Failed to load tv.glb:', err);
    // Fallback: show the old cube placeholder
    const tvBody = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 3.8, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x1a1d26, metalness: 0.3, roughness: 0.7 })
    );
    root.add(tvBody);
    screen.geometry.dispose();
    screen.geometry = new THREE.PlaneGeometry(4.0, 2.9);
    screen.position.set(0, 0, 0.555);
    screenLight.position.set(0, 0.2, 1.8);
    boxCase.position.set(0, 3.3, 0.3);
    boxCase.visible = true;
  }
);

// ---- Texture loader ----
const texLoader = new THREE.TextureLoader();
let gifImg = null;
let gifLoaded = false;

function makePlaceholderTex() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a1d2e';
  ctx.fillRect(0, 0, 128, 192);
  ctx.strokeStyle = '#2a3050';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 120, 184);
  ctx.fillStyle = '#2a3050';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('box art', 64, 100);
  return new THREE.CanvasTexture(c);
}

function drawScreenPlaceholder() {
  const grad = screenCtx.createLinearGradient(0, 0, 0, 384);
  grad.addColorStop(0, '#060c18');
  grad.addColorStop(1, '#0a1020');
  screenCtx.fillStyle = grad;
  screenCtx.fillRect(0, 0, 512, 384);
  screenCtx.fillStyle = 'rgba(88,166,255,0.25)';
  screenCtx.font = 'bold 14px monospace';
  screenCtx.textAlign = 'center';
  screenCtx.fillText('[ no footage available ]', 256, 196);
  screenTex.needsUpdate = true;
}

function loadGameAssets(game) {
  // Screen GIF
  gifLoaded = false;
  if (game.gif) {
    gifImg = new Image();
    gifImg.onload = () => { gifLoaded = true; };
    gifImg.src = game.gif;
  } else {
    gifImg = null;
    drawScreenPlaceholder();
  }

  // Box art
  if (game.boxArt) {
    texLoader.load(
      game.boxArt,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        boxCaseMats[4].map = tex;
        boxCaseMats[4].needsUpdate = true;
      },
      undefined,
      () => {
        boxCaseMats[4].map = boxArtPlaceholderTex;
        boxCaseMats[4].needsUpdate = true;
      }
    );
  }
}

// ---- Resize ----
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

// ---- Animation ----
let prevTime = performance.now();
let elapsed = 0;
// let boxArtAngle = 0;
// const BOX_SWING = 0.06; // radians

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - prevTime) / 1000;
  prevTime = now;
  elapsed += delta;

  // Gentle float (disabled)
  // root.position.y = Math.sin(elapsed * 0.6) * 0.12;

  // Box art case sway (disabled)
  // boxArtAngle = Math.sin(elapsed * 0.4) * BOX_SWING;
  // boxCase.rotation.y = boxArtAngle;

  // Copy current GIF frame to screen canvas
  if (gifLoaded && gifImg) {
    screenCtx.drawImage(gifImg, 0, 0, 512, 384);
    screenTex.needsUpdate = true;
  }

  // Screen glow pulse
  screenLight.intensity = 1.2 + Math.sin(elapsed * 1.5) * 0.2;

  // Camera movement (disabled)
  // camera.position.x += (targetX * 1.5 - camera.position.x) * 0.04;
  // camera.position.y += (targetY * 0.8 - camera.position.y) * 0.04;
  // camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

// ---- Init ----
filteredGames = getFiltered();
const firstGame = filteredGames[0];
updateInfoPanel(firstGame, 0, filteredGames.length);
loadGameAssets(firstGame);
animate();
