// Jeepneys and tricycles on the ring roads. Stay out of their way. Every part of every vehicle
// shares one InstancedMesh, so the traffic costs a single draw call.
import * as THREE from 'three';
import { isTouch, toast } from './util.js';
import { view } from './state.js';
import { scene } from './engine.js';
import { RING, OUTER } from './world.js';
import { player } from './player.js';
import { hurtOrders } from './orders.js';
import { onLoop } from './citizens.js';
import { play } from './audio.js';

const LANE = 2.2, COOLDOWN = 2.5, TRAFFIC_DAMAGE = 8;

// Each part is [width, height, depth, colour, x, y, z].
const JEEPNEY = paint => [
  [2.2, 1.4, 5, paint, 0, 1.3, -.3], [2.3, .2, 5.3, 0xf1efe9, 0, 2.1, -.3], [2, .8, 1.3, 0xc8ccd2, 0, 1, 2.8],
  [2.24, .3, 5.04, 0xffd23f, 0, 1.1, -.3], [2.3, .55, .7, 0x151515, 0, .3, 1.9], [2.3, .55, .7, 0x151515, 0, .3, -1.9],
];
const TRICYCLE = paint => [
  [.6, .5, 1.8, paint, -.5, .75, 0], [1.3, .9, 1.7, paint, .55, 1, .1], [1.4, .14, 2, 0xf1efe9, .55, 1.85, .1],
  [.1, .7, .1, 0x333333, 1.15, 1.5, -.7], [.3, .6, .6, 0x151515, -.5, .3, -.8], [.3, .6, .6, 0x151515, -.5, .3, .8], [.3, .5, .5, 0x151515, .9, .25, .3],
];

const rides = [
  [OUTER, 1, 9, JEEPNEY(0xd6402b), 3], [OUTER, 1, 9, JEEPNEY(0x2f7de0), 3], [RING, 1, 7, JEEPNEY(0x3fae68), 3],
  [OUTER, 1, 8, TRICYCLE(0xe8c23c), 2.2], [RING, 1, 7, TRICYCLE(0x8d63d6), 2.2], [OUTER, 1, 8, TRICYCLE(0x2fb5a8), 2.2],
].map(([ring, dir, speed, parts, reach], i) => {
  const half = ring + LANE;
  return { half, dir, speed, parts, reach, along: half * 8 * (i / 6 + Math.random() * .1) };
});

const count = rides.reduce((n, r) => n + r.parts.length, 0);
const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), count);
mesh.castShadow = !isTouch;
mesh.frustumCulled = false;
scene.add(mesh);

// Each part's place on its vehicle, worked out once. Only the vehicle's own position changes.
const part = new THREE.Object3D(), root = new THREE.Object3D(), matrix = new THREE.Matrix4(), tint = new THREE.Color();
let index = 0;
for (const r of rides) {
  r.matrices = r.parts.map(([w, h, d, color, x, y, z]) => {
    part.position.set(x, y, z);
    part.scale.set(w, h, d);
    part.updateMatrix();
    mesh.setColorAt(index++, tint.set(color));
    return part.matrix.clone();
  });
}

let cooldown = 0;

function bump(r, x, z) {
  const dx = player.pos.x - x, dz = player.pos.z - z, d = Math.hypot(dx, dz) || 1;
  player.kx = dx / d * 14;
  player.kz = dz / d * 14;
  player.vy = Math.max(player.vy, 5);
  player.stun = .35;
  view.shake = .4;
  cooldown = COOLDOWN;
  hurtOrders(TRAFFIC_DAMAGE);
  play('hit');
  toast('Watch the road!');
}

function updateTraffic(dt) {
  cooldown -= dt;
  let i = 0;
  for (const r of rides) {
    r.along += r.dir * r.speed * dt;
    const [x, z] = onLoop(r.half, r.along), [nx, nz] = onLoop(r.half, r.along + r.dir);
    root.position.set(x, .1, z);
    root.rotation.y = Math.atan2(nx - x, nz - z);
    root.updateMatrix();
    for (const m of r.matrices) mesh.setMatrixAt(i++, matrix.multiplyMatrices(root.matrix, m));
    if (cooldown <= 0 && player.pos.y < 1.6 && Math.hypot(player.pos.x - x, player.pos.z - z) < r.reach) bump(r, x, z);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export { rides, updateTraffic };
