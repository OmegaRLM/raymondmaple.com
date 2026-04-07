import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.getElementById('about-canvas');
if (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 4);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0x58a6ff, 8.5);
  keyLight.position.set(2, 3, 4);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xd2a8ff, 1.2);
  rimLight.position.set(-3, -1, -2);
  scene.add(rimLight);

  // Resize
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

  // Mouse parallax (disabled)
  // let mouseX = 0, mouseY = 0;
  // window.addEventListener('mousemove', e => {
  //   mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  //   mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  // });

  // Set once model loads
  let mixer = null;
  let model = null;
  let prevTime = performance.now();

  // Load model
  const loader = new GLTFLoader();
  loader.load(
    '/img/models/maple_model.glb',
    (gltf) => {
      model = gltf.scene;
      scene.add(model);

      // Play all animations if present
      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach(clip => mixer.clipAction(clip).play());
      }

      // Rotate model to face down -Z (toward camera)
      model.rotation.y = -Math.PI / 2;

      // Center and fit model in view
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      model.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      camera.position.set(0, 1, maxDim * 1.8);
      camera.near = maxDim * 0.01;
      camera.far = maxDim * 100;
      camera.updateProjectionMatrix();
    },
    undefined,
    (err) => console.error('Failed to load model:', err)
  );

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = (now - prevTime) / 1000;
    prevTime = now;
    if (mixer) mixer.update(delta);

    // Slow Y rotation
    if (model) model.rotation.y += delta * 0.4;

    // Subtle parallax drift (disabled)
    // camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.04;
    // camera.position.y += (-mouseY * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();
}
