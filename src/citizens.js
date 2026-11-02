// Citizens walking the sidewalks, some with a dog on a leash. Hit one at speed and they go flying.
// All their body parts share a couple of InstancedMeshes, so the crowd costs almost no draw calls.
// This uses Math.random, never the world's rnd(), so it can't move anything on the map.
import * as THREE from 'three';
import { isTouch, toast } from './util.js';
import { view } from './state.js';
import { HIT_SPEED, HIT_FINE, HIT_DAMAGE } from './config.js';
import { scene, box, resolve } from './engine.js';
import { RING, OUTER, ROAD_W, COURT } from './world.js';
import { clock } from './daynight.js';
import { player } from './player.js';
import { save, saveGame } from './save.js';
import { hurtOrders } from './orders.js';
import { play } from './audio.js';

const INNER_WALKERS = 5, OUTER_WALKERS = 7, WALK_STRIDE = 3.2, DOG_EVERY = 3;
const SOLID_R = 1, CARE_R = 55, SHOW_R = 130, RALLY_TIME = 1.1; // How close you bump into someone, and how far away they can go home unseen.
const SKINS = [0xc99a6b, 0xb5835a, 0xd8ab7c, 0x9a6b45];
const SHIRTS = [0xe0524d, 0x4d8de0, 0xe8c23c, 0x3fae68, 0xf4f1ea, 0xe77fb3, 0x8d63d6, 0xf0883a];
const PANTS = [0x2b3a55, 0x3a3f48, 0x5a4636, 0x6c7a89];
const HAIR = [0x1c1712, 0x2b211a, 0x3a2c20];
const DOG_COATS = [0xc9915a, 0x9a6a45, 0xe8d0a9, 0x5f4632];
const pick = list => list[Math.floor(Math.random() * list.length)];

// Throwaway skeletons, posed once per citizen each frame and copied into the instances.
const rig = new THREE.Object3D(), dogRig = new THREE.Object3D();
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
const hand = new THREE.Object3D();
hand.position.y = -1;
shoulderR.add(hand);

const DOG_PARTS = [
  part(dogRig, .55, .55, 1.2, 0, .65, 0), part(dogRig, .5, .45, .5, 0, 1, .7), part(dogRig, .28, .2, .28, 0, .92, 1.02),
  part(dogRig, .12, .12, .55, 0, .95, -.75), part(dogRig, .5, .42, .16, 0, .22, .42), part(dogRig, .5, .42, .16, 0, .22, -.42),
];
const leash = new THREE.Object3D(), collar = new THREE.Object3D();
collar.position.set(0, .95, .55);
dogRig.add(collar);

// Each walker loops the inside sidewalk of a ring road, which keeps clear of the lamp posts.
const citizens = [];
function addWalkers(ring, count) {
  const half = ring - ROAD_W / 2 - .75;
  for (let i = 0; i < count; i++) {
    const skin = pick(SKINS), legs = pick(PANTS), n = citizens.length;
    citizens.push({
      half, along: (i + Math.random() * .8) / count * half * 8, dir: Math.random() < .5 ? 1 : -1,
      speed: 1.3 + Math.random() * .9, scale: .82 + Math.random() * .2, phase: Math.random() * 6,
      colors: [pick(SHIRTS), skin, pick(HAIR), legs, legs, skin, skin],
      // A third stay out after dark. The rest go home once they're out of sight.
      nightOwl: n % 3 === 0, away: false, fall: null,
      dog: n % DOG_EVERY === 1 ? pick(DOG_COATS) : null,
    });
  }
}
addWalkers(RING, INNER_WALKERS);
addWalkers(OUTER, OUTER_WALKERS);

// The pickleball players, one at each end of the court. They're out day and night, and whatever
// happens to them they get back up and carry on.
for (const end of [-1, 1]) {
  const skin = pick(SKINS), legs = pick(PANTS);
  citizens.push({
    end, x: COURT.x, along: 0, dir: 1, speed: 0, half: 0, scale: .95, phase: Math.random() * 6, swing: 0,
    colors: [end < 0 ? 0xffd23f : 0xe0524d, skin, pick(HAIR), legs, legs, skin, skin], nightOwl: true, away: false, fall: null, dog: null,
  });
}
const players = citizens.filter(c => c.end);
const paddles = players.map(() => box(.5, .65, .1, 0x2b2f36, 0, 0, 0));
const ball = box(.3, .3, .3, 0xd8f24a, 0, 0, 0);
const rally = { t: 0, end: -1, fromX: 0, toX: 2 };
const walkers = citizens.filter(c => c.dog);

function crowdMesh(count) {
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), count);
  m.castShadow = !isTouch;
  // Citizens move all over the map, so the mesh's bounds can't stay meaningful.
  m.frustumCulled = false;
  scene.add(m);
  return m;
}
const crowd = crowdMesh(citizens.length * PARTS.length), pack = crowdMesh(walkers.length * (DOG_PARTS.length + 1));
const tint = new THREE.Color();
citizens.forEach((c, i) => c.colors.forEach((color, p) => crowd.setColorAt(i * PARTS.length + p, tint.set(color))));
walkers.forEach((c, i) => {
  DOG_PARTS.forEach((_, p) => pack.setColorAt(i * (DOG_PARTS.length + 1) + p, tint.set(c.dog)));
  pack.setColorAt(i * (DOG_PARTS.length + 1) + DOG_PARTS.length, tint.set(0xd6402b));
});

// Turns a distance around the square loop into a point on it and the way to face.
function onLoop(half, along) {
  const length = half * 8, a = (along % length + length) % length;
  const side = Math.floor(a / (half * 2)), t = a - side * half * 2 - half;
  if (side === 0) return [t, -half, Math.PI / 2];
  if (side === 1) return [half, t, 0];
  if (side === 2) return [-t, half, -Math.PI / 2];
  return [-half, -t, Math.PI];
}

function updateRally(dt, near) {
  ball.visible = near;
  paddles.forEach(p => { p.visible = near; });
  // Nobody plays on while someone's flat on their back. The ball waits by the net.
  if (players.some(c => c.fall)) {
    ball.position.set(COURT.x + 1, .3, COURT.z + 1);
    return;
  }
  rally.t += dt / RALLY_TIME;
  if (rally.t >= 1) {
    rally.t -= 1;
    rally.end = -rally.end;
    rally.fromX = rally.toX;
    rally.toX = (Math.random() - .5) * 7;
    players.find(c => c.end === rally.end).swing = 1;
  }
  const { t, end, fromX, toX } = rally;
  ball.position.set(COURT.x + fromX + (toX - fromX) * t, 1.5 + Math.sin(t * Math.PI) * 1.6, COURT.z + end * COURT.half * (1 - 2 * t));
}

function hit(c, x, z, pace) {
  const p = player;
  c.fall = { x, z, y: .1, vx: p.vx * .8, vz: p.vz * .8, vy: 5 + pace * .15, roll: 0, time: 3.4 };
  p.vx *= .45;
  p.vz *= .45;
  p.stun = .15;
  view.shake = .3;
  play('hit');
  if (c.end) {
    toast('Point!');
    return;
  }
  const fine = Math.min(HIT_FINE, save.cash);
  save.cash -= fine;
  saveGame();
  hurtOrders(HIT_DAMAGE);
  toast(`Hoy! Watch it! -₱${fine}`);
}

// In the air, then flat on the ground, then back up and over to the sidewalk.
function tumble(c, homeX, homeZ, dt) {
  const f = c.fall;
  f.time -= dt;
  if (f.time > .7) {
    f.vy -= 26 * dt;
    f.y += f.vy * dt;
    f.x += f.vx * dt;
    f.z += f.vz * dt;
    resolve(f, .4);
    if (f.y <= .3) {
      f.y = .3;
      f.vy = 0;
      f.vx *= Math.exp(-7 * dt);
      f.vz *= Math.exp(-7 * dt);
    }
    f.roll = Math.min(Math.PI / 2, f.roll + 9 * dt);
  } else {
    const k = Math.min(1, 6 * dt);
    f.x += (homeX - f.x) * k;
    f.z += (homeZ - f.z) * k;
    f.y += (.1 - f.y) * k;
    f.roll *= 1 - k;
    if (f.time <= 0) c.fall = null;
  }
}

function updateCitizens(dt) {
  const px = player.pos.x, pz = player.pos.z, pace = Math.hypot(player.vx, player.vz);
  let dogIndex = 0;
  updateRally(dt, Math.hypot(px - COURT.x, pz - COURT.z) < SHOW_R);
  citizens.forEach((c, i) => {
    if (c.end) {
      // Shuffle across to meet the ball, or back to the middle once it's been hit.
      const target = rally.end === -c.end ? rally.toX : 0;
      c.x += (COURT.x + target - c.x) * Math.min(1, 3 * dt);
      c.swing = Math.max(0, c.swing - dt * 3);
    }
    const [homeX, homeZ, facing] = c.end ? [c.x, COURT.z + c.end * COURT.half, c.end > 0 ? Math.PI : 0] : onLoop(c.half, c.along);
    const gap = Math.hypot(px - homeX, pz - homeZ);
    if (!c.nightOwl && gap > CARE_R) c.away = clock.night > .5;

    if (c.fall) {
      tumble(c, homeX, homeZ, dt);
    } else {
      c.along += c.dir * c.speed * dt;
      c.phase += c.speed * dt * WALK_STRIDE;
      if (!c.away && gap < SOLID_R && player.pos.y < 1.2) {
        if (pace >= HIT_SPEED) {
          hit(c, homeX, homeZ, pace);
        } else {
          // Too slow to knock anyone over, so you just bump into them.
          const d = gap || 1;
          player.pos.x = homeX + (px - homeX) / d * SOLID_R;
          player.pos.z = homeZ + (pz - homeZ) / d * SOLID_R;
        }
      }
    }

    const f = c.fall, swing = f ? 0 : Math.sin(c.phase) * .6;
    rig.position.set(f ? f.x : homeX, f ? f.y : .1, f ? f.z : homeZ);
    rig.rotation.set(f ? -f.roll : 0, c.dir > 0 ? facing : facing + Math.PI, 0, 'YXZ');
    rig.scale.setScalar(c.away ? 0 : c.scale);
    hipL.rotation.x = shoulderR.rotation.x = swing;
    hipR.rotation.x = shoulderL.rotation.x = -swing;
    if (c.end) {
      hipL.rotation.x = hipR.rotation.x = shoulderL.rotation.x = 0;
      shoulderR.rotation.x = -.9 - c.swing * 1.5;
    }
    rig.updateMatrixWorld(true);
    PARTS.forEach((o, p) => crowd.setMatrixAt(i * PARTS.length + p, o.matrixWorld));
    if (c.end) {
      const paddle = paddles[players.indexOf(c)];
      paddle.position.setFromMatrixPosition(hand.matrixWorld);
      paddle.rotation.y = rig.rotation.y;
    }

    if (c.dog) {
      const base = dogIndex++ * (DOG_PARTS.length + 1);
      const [dogX, dogZ] = onLoop(c.half, c.along + c.dir * 2.4), [nextX, nextZ] = onLoop(c.half, c.along + c.dir * 2.6);
      dogRig.position.set(dogX, .1 + Math.abs(Math.sin(c.phase * 1.3)) * .1, dogZ);
      dogRig.rotation.y = Math.atan2(nextX - dogX, nextZ - dogZ);
      dogRig.scale.setScalar(c.away ? 0 : .8);
      dogRig.updateMatrixWorld(true);
      DOG_PARTS.forEach((o, p) => pack.setMatrixAt(base + p, o.matrixWorld));
      const from = new THREE.Vector3().setFromMatrixPosition(hand.matrixWorld);
      const to = new THREE.Vector3().setFromMatrixPosition(collar.matrixWorld);
      leash.position.lerpVectors(from, to, .5);
      leash.lookAt(to);
      leash.scale.set(c.away ? 0 : .09, c.away ? 0 : .09, from.distanceTo(to));
      leash.updateMatrix();
      pack.setMatrixAt(base + DOG_PARTS.length, leash.matrix);
    }
  });
  crowd.instanceMatrix.needsUpdate = true;
  pack.instanceMatrix.needsUpdate = true;
}

export { citizens, onLoop, updateCitizens };
