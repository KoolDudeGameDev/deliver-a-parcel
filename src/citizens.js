// Citizens walking the sidewalks. They're scenery for now, so nothing collides with them.
// Every body part of every citizen shares one InstancedMesh, so a crowd costs a single draw call.
// This uses Math.random, never the world's rnd(), so it can't move anything on the map.
import * as THREE from 'three';
import { isTouch } from './util.js';
import { scene } from './engine.js';
import { RING, OUTER, ROAD_W } from './world.js';

const INNER_WALKERS = 12, OUTER_WALKERS = 18, WALK_STRIDE = 3.2;
const SKINS = [0xc99a6b, 0xb5835a, 0xd8ab7c, 0x9a6b45];
const SHIRTS = [0xe0524d, 0x4d8de0, 0xe8c23c, 0x3fae68, 0xf4f1ea, 0xe77fb3, 0x8d63d6, 0xf0883a];
const PANTS = [0x2b3a55, 0x3a3f48, 0x5a4636, 0x6c7a89];
const HAIR = [0x1c1712, 0x2b211a, 0x3a2c20];
const pick = list => list[Math.floor(Math.random() * list.length)];

// A throwaway skeleton, posed once per citizen each frame and copied into the instances.
const rig = new THREE.Object3D();
function part(parent, w, h, d, x, y, z) {
  const o = new THREE.Object3D();
  o.position.set(x, y, z);
  o.scale.set(w, h, d);
  parent.add(o);
  return o;
}
// Limbs hang from a pivot at the hip or shoulder, so swinging the pivot swings the limb.
function limb(w, h, d, x, y) {
  const pivot = new THREE.Object3D();
  pivot.position.set(x, y, 0);
  rig.add(pivot);
  return [pivot, part(pivot, w, h, d, 0, -h / 2, 0)];
}
const torso = part(rig, .95, 1, .5, 0, 1.5, 0), head = part(rig, .72, .72, .72, 0, 2.38, 0), hair = part(rig, .76, .2, .76, 0, 2.76, 0);
const [hipL, legL] = limb(.42, 1, .45, -.24, 1), [hipR, legR] = limb(.42, 1, .45, .24, 1);
const [shoulderL, armL] = limb(.3, 1, .38, -.64, 2), [shoulderR, armR] = limb(.3, 1, .38, .64, 2);
const PARTS = [torso, head, hair, legL, legR, armL, armR];

// Each walker loops the inside sidewalk of a ring road, which keeps clear of the lamp posts.
const citizens = [];
function addWalkers(ring, count) {
  const half = ring - ROAD_W / 2 - .75;
  for (let i = 0; i < count; i++) {
    citizens.push({
      half, along: (i + Math.random() * .8) / count * half * 8, dir: Math.random() < .5 ? 1 : -1,
      speed: 1.3 + Math.random() * .9, scale: .82 + Math.random() * .2, phase: Math.random() * 6,
      colors: (skin => [pick(SHIRTS), skin, pick(HAIR), pick(PANTS), pick(PANTS), skin, skin])(pick(SKINS)),
    });
    const c = citizens[citizens.length - 1];
    c.colors[4] = c.colors[3];
  }
}
addWalkers(RING, INNER_WALKERS);
addWalkers(OUTER, OUTER_WALKERS);

const crowd = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), citizens.length * PARTS.length);
const tint = new THREE.Color();
citizens.forEach((c, i) => c.colors.forEach((color, p) => crowd.setColorAt(i * PARTS.length + p, tint.set(color))));
crowd.castShadow = !isTouch;
// Citizens move all over the map, so the mesh's bounds can't stay meaningful.
crowd.frustumCulled = false;
scene.add(crowd);

// Turns a distance around the square loop into a point on it and the way to face.
function onLoop(half, along) {
  const side = Math.floor(along / (half * 2)), t = along - side * half * 2 - half;
  if (side === 0) return [t, -half, Math.PI / 2];
  if (side === 1) return [half, t, 0];
  if (side === 2) return [-t, half, -Math.PI / 2];
  return [-half, -t, Math.PI];
}

function updateCitizens(dt) {
  citizens.forEach((c, i) => {
    const length = c.half * 8;
    c.along = (c.along + c.dir * c.speed * dt + length) % length;
    c.phase += c.speed * dt * WALK_STRIDE;
    const [x, z, facing] = onLoop(c.half, c.along), swing = Math.sin(c.phase) * .6;
    rig.position.set(x, .1, z);
    rig.rotation.y = c.dir > 0 ? facing : facing + Math.PI;
    rig.scale.setScalar(c.scale);
    hipL.rotation.x = shoulderR.rotation.x = swing;
    hipR.rotation.x = shoulderL.rotation.x = -swing;
    rig.updateMatrixWorld(true);
    PARTS.forEach((o, p) => crowd.setMatrixAt(i * PARTS.length + p, o.matrixWorld));
  });
  crowd.instanceMatrix.needsUpdate = true;
}

export { citizens, updateCitizens };
