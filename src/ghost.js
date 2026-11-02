// The White Lady: she only appears in the cemetery after dark, and drifts straight through the
// tombs towards you. She's slower than you, but she never stops.
import * as THREE from 'three';
import { clamp, toast } from './util.js';
import { view } from './state.js';
import { GHOST_SPEED, GHOST_DAMAGE } from './config.js';
import { scene } from './engine.js';
import { HOUSES } from './world.js';
import { clock } from './daynight.js';
import { player } from './player.js';
import { orders, hurtOrders } from './orders.js';
import { inYard } from './dogs.js';
import { play } from './audio.js';

const cemetery = HOUSES.find(h => h.name === 'Cemetery');
const START = new THREE.Vector3(74.5, 0, 83);

const group = new THREE.Group();
function piece(w, h, d, color, y, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .82, fog: false }));
  m.position.set(0, y, z);
  group.add(m);
}
piece(1.5, .9, 1.1, 0xe9edf2, .75);
piece(1.2, .9, .85, 0xf1f4f7, 1.5);
piece(.95, .9, .6, 0xf7f9fb, 2.3);
piece(.68, .68, .68, 0xd6dee4, 3);
piece(.76, 1.7, .3, 0x0b0d10, 2.5, -.36);
piece(.76, .3, .76, 0x0b0d10, 3.4);
group.visible = false;
scene.add(group);

const lady = { pos: START.clone(), active: false, cooldown: 0 };

function scare() {
  const dx = player.pos.x - lady.pos.x, dz = player.pos.z - lady.pos.z, d = Math.hypot(dx, dz) || 1;
  player.kx = dx / d * 12;
  player.kz = dz / d * 12;
  player.vy = Math.max(player.vy, 5);
  player.stun = .5;
  view.shake = .5;
  hurtOrders(GHOST_DAMAGE);
  play('ghost');
  toast(orders.length ? `The White Lady! -${GHOST_DAMAGE}%` : 'The White Lady!');
  // She fades out and comes back from the far corner, so you get a moment to run.
  lady.cooldown = 2.5;
  const y = cemetery.yard;
  lady.pos.set(player.pos.x < (y.x0 + y.x1) / 2 ? y.x1 - 6 : y.x0 + 6, 0, player.pos.z < (y.z0 + y.z1) / 2 ? y.z1 - 8 : y.z0 + 8);
}

function updateGhost(dt) {
  if (clock.night < .6 || !inYard(player.pos, cemetery.yard)) {
    group.visible = lady.active = false;
    return;
  }
  if (!lady.active) {
    lady.active = true;
    lady.pos.copy(START);
    toast('Someone is standing by the graves...');
    play('ghost');
  }
  lady.cooldown -= dt;
  group.visible = lady.cooldown <= 0;
  if (!group.visible) return;

  const dx = player.pos.x - lady.pos.x, dz = player.pos.z - lady.pos.z, d = Math.hypot(dx, dz);
  if (d > .1) {
    lady.pos.x += dx / d * GHOST_SPEED * dt;
    lady.pos.z += dz / d * GHOST_SPEED * dt;
  }
  const y = cemetery.yard;
  lady.pos.x = clamp(lady.pos.x, y.x0 + 1, y.x1 - 1);
  lady.pos.z = clamp(lady.pos.z, y.z0 + 1, y.z1 - 1);
  group.position.set(lady.pos.x, .35 + Math.sin(performance.now() / 500) * .18, lady.pos.z);
  group.rotation.y = Math.atan2(dx, dz);
  if (d < 1.4 && player.pos.y < 1.2) scare();
}

export { lady, updateGhost };
