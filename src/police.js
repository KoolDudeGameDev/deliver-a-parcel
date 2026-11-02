// Police cars patrol the ring roads. They ignore you until you're carrying contraband, then they
// come for you. They can't follow you into a yard, and a sprinting moped can just outrun them.
import * as THREE from 'three';
import { toast } from './util.js';
import { view } from './state.js';
import { POLICE_PATROL, POLICE_CHASE, POLICE_SEE, POLICE_LOSE, POLICE_GIVE_UP, ARREST_COST } from './config.js';
import { scene, box, resolve } from './engine.js';
import { HOUSES, HUB, RING, OUTER } from './world.js';
import { player } from './player.js';
import { save, saveGame } from './save.js';
import { orders, clearOrders } from './orders.js';
import { inYard } from './dogs.js';
import { onLoop } from './citizens.js';

const CATCH_R = 2.6, CAR_R = 1.5, SHOW_R = 140, GRACE = 6, LANE = 2.2;

function buildCar() {
  const g = new THREE.Group();
  box(2.2, .75, 4.6, 0xf1f2f4, 0, .75, 0, g);
  box(2.24, .3, 2, 0x1c2c52, 0, .8, 0, g);
  box(1.95, .7, 2.3, 0x24303f, 0, 1.45, -.2, g);
  for (const z of [-1.5, 1.5]) box(2.35, .6, .75, 0x151515, 0, .32, z, g);
  const red = box(.8, .24, .4, 0xe0352b, -.45, 1.92, -.2, g), blue = box(.8, .24, .4, 0x2f7de0, .45, 1.92, -.2, g);
  scene.add(g);
  return { group: g, red, blue };
}

const cars = [[RING, 1], [OUTER, -1]].map(([ring, dir]) => {
  const half = ring - LANE, along = Math.random() * half * 8, [x, z] = onLoop(half, along);
  return { ...buildCar(), half, along, dir, pos: new THREE.Vector3(x, 0, z), mode: 'patrol', lost: 0 };
});
let grace = 0;

function arrest() {
  const lost = Math.floor(save.cash * ARREST_COST);
  save.cash -= lost;
  saveGame();
  clearOrders();
  player.pos.set(HUB.x, 0, HUB.z + 3);
  player.vx = player.vz = player.kx = player.kz = 0;
  player.stun = 1;
  view.shake = .6;
  grace = GRACE;
  for (const c of cars) c.mode = 'return';
  toast(`Arrested! -₱${lost}`);
}

function updateCar(c, dt, wanted, playerHidden) {
  const dx = player.pos.x - c.pos.x, dz = player.pos.z - c.pos.z, d = Math.hypot(dx, dz);
  let tx = dx, tz = dz, speed = POLICE_CHASE;
  if (c.mode === 'patrol') {
    c.along += c.dir * POLICE_PATROL * dt;
    const [x, z] = onLoop(c.half, c.along), [nx, nz] = onLoop(c.half, c.along + c.dir);
    c.pos.set(x, 0, z);
    c.group.rotation.y = Math.atan2(nx - x, nz - z);
    if (wanted && grace <= 0 && d < POLICE_SEE && !playerHidden) {
      c.mode = 'chase';
      c.lost = 0;
      toast('Police! Run for it!');
    }
  } else {
    if (c.mode === 'chase') {
      c.lost = d > POLICE_LOSE || playerHidden ? c.lost + dt : 0;
      if (!wanted || c.lost > POLICE_GIVE_UP) {
        c.mode = 'return';
        if (wanted) toast('You lost them');
      }
    }
    if (c.mode === 'return') {
      const [x, z] = onLoop(c.half, c.along);
      tx = x - c.pos.x;
      tz = z - c.pos.z;
      speed = POLICE_PATROL * 1.5;
      if (Math.hypot(tx, tz) < 2) c.mode = 'patrol';
    }
    const len = Math.hypot(tx, tz) || 1, px = c.pos.x, pz = c.pos.z;
    c.pos.x += tx / len * speed * dt;
    c.pos.z += tz / len * speed * dt;
    resolve(c.pos, CAR_R);
    // Fences stop a car, and so does the rule that it never drives in through a gate.
    if (HOUSES.some(h => inYard(c.pos, h.yard))) c.pos.set(px, 0, pz);
    c.group.rotation.y = Math.atan2(tx, tz);
    if (c.mode === 'chase' && d < CATCH_R) arrest();
  }

  c.group.position.copy(c.pos);
  c.group.visible = d < SHOW_R;
  const flash = Math.floor(performance.now() / (c.mode === 'chase' ? 110 : 320)) % 2 === 0;
  c.red.material.emissive.setHex(flash ? 0xff2015 : 0x000000);
  c.blue.material.emissive.setHex(flash ? 0x000000 : 0x1d6dff);
}

function updatePolice(dt) {
  grace -= dt;
  const wanted = orders.some(o => o.contraband), playerHidden = HOUSES.some(h => inYard(player.pos, h.yard));
  for (const c of cars) updateCar(c, dt, wanted, playerHidden);
}

export { cars, updatePolice, arrest };
