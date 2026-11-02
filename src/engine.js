// Renderer, scene, lights and sky, plus the helpers that build and collide with the world.
import * as THREE from 'three';
import { isTouch, clamp } from './util.js';

const renderer = new THREE.WebGLRenderer({ antialias: !isTouch });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = !isTouch;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x8fd3ff, 130, 300);
const camera = new THREE.PerspectiveCamera(60, 1, .3, 440);

const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x6f8f5e, 1.3);
const sun = new THREE.DirectionalLight(0xfff0da, 2.4);
sun.castShadow = !isTouch;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.normalBias = .06;
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 240 });
scene.add(hemi, sun, sun.target);

const skyUniforms = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() } };
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
  vertexShader: `varying vec3 d;
    void main() { d = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform vec3 top, hor; varying vec3 d;
    void main() {
      gl_FragColor = vec4(mix(hor, top, pow(clamp(normalize(d).y, 0., 1.), .55)), 1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
}));
skyDome.renderOrder = -1;
scene.add(skyDome);

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const colliders = [], solids = [];

function box(w, h, d, color, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = !isTouch;
  parent.add(m);
  return m;
}

// Everything that never moves goes through these lists and becomes a few InstancedMeshes,
// so the whole map costs a handful of draw calls instead of one per box.
const blocks = [], walls = [], roofs = [], bulbs = [];
const block = (w, h, d, color, x, y, z) => blocks.push({ w, h, d, color, x, y, z });

function instanced(list, geometry, material, shadows = true) {
  const m = new THREE.InstancedMesh(geometry, material, list.length), o = new THREE.Object3D(), c = new THREE.Color();
  list.forEach((b, i) => {
    o.position.set(b.x, b.y, b.z);
    o.scale.set(b.w, b.h, b.d);
    o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
    m.setColorAt(i, c.set(b.color));
  });
  m.castShadow = m.receiveShadow = shadows && !isTouch;
  scene.add(m);
  return m;
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

function speckle(x, w, h, count, colors) {
  for (let i = 0; i < count; i++) {
    x.fillStyle = colors[i % colors.length];
    x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}

function addCollider(x, z, halfX, halfZ) {
  colliders.push({ x0: x - halfX, x1: x + halfX, z0: z - halfZ, z1: z + halfZ });
}

// Pushes a circle out of every box collider. Axis-aligned only, which is all this map needs.
function resolve(p, r) {
  for (const c of colliders) {
    const nx = clamp(p.x, c.x0, c.x1), nz = clamp(p.z, c.z0, c.z1);
    const dx = p.x - nx, dz = p.z - nz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-6) {
      const d = Math.sqrt(d2);
      p.x = nx + dx / d * r;
      p.z = nz + dz / d * r;
    } else {
      const l = p.x - c.x0, ri = c.x1 - p.x, t = p.z - c.z0, b = c.z1 - p.z, m = Math.min(l, ri, t, b);
      if (m === l) p.x = c.x0 - r;
      else if (m === ri) p.x = c.x1 + r;
      else if (m === t) p.z = c.z0 - r;
      else p.z = c.z1 + r;
    }
  }
}

function textTexture(lines, bg, fg) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 256, 128);
  x.fillStyle = fg; x.font = 'bold 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((l, i) => x.fillText(l, 128, 64 + (i - (lines.length - 1) / 2) * 50, 240));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function sign(lines, bg, fg, w, h, x, y, z, rotY) {
  // Two planes back to back, so the text isn't mirrored from behind.
  const material = new THREE.MeshBasicMaterial({ map: textTexture(lines, bg, fg), toneMapped: false });
  for (const turn of [0, Math.PI]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    m.position.set(x, y, z);
    m.rotation.y = rotY + turn;
    scene.add(m);
    distant.push({ object: m, reach: SIGN_REACH });
  }
  return material;
}

// Signs and homes too far off to make out aren't drawn. A few are checked each frame, which is
// plenty, because nothing on this list moves.
const SIGN_REACH = 75, CHECKS_PER_FRAME = 8;
const distant = [];
let nextCheck = 0;
function hideDistant(x, z) {
  for (let i = 0; i < CHECKS_PER_FRAME && distant.length; i++) {
    const { object, reach } = distant[nextCheck = (nextCheck + 1) % distant.length];
    object.visible = Math.hypot(object.position.x - x, object.position.z - z) < reach;
  }
}

export { renderer, scene, camera, hemi, sun, skyUniforms, skyDome, colliders, solids, blocks, walls, roofs, bulbs, block, box, instanced, canvasTexture, speckle, addCollider, resolve, textTexture, sign, distant, hideDistant };
