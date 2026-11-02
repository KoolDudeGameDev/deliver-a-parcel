// Dogs: wandering, chasing and biting.
import * as THREE from 'three';
import { clamp, toast } from './util.js';
import { view } from './state.js';
import { DOG_TYPES } from './config.js';
import { scene, box, resolve } from './engine.js';
import { HOUSES } from './world.js';
import { limb, player } from './player.js';
import { orders } from './orders.js';

const alertTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#ff3b30'; x.font = 'bold 60px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('!', 32, 34);
  return new THREE.CanvasTexture(c);
})();

function buildDog(h) {
  const t = DOG_TYPES[h.dog], g = new THREE.Group(), c = t.color;
  box(.6, .6, 1.4, c, 0, .75, 0, g);
  box(.55, .5, .55, c, 0, 1.15, .8, g);
  box(.3, .22, .3, 0x333333, 0, 1.05, 1.15, g);
  box(.14, .25, .14, 0x333333, -.2, 1.45, .75, g);
  box(.14, .25, .14, 0x333333, .2, 1.45, .75, g);
  const tail = box(.12, .12, .6, c, 0, 1, -.9, g);
  tail.rotation.x = .7;
  const legs = [[-.2, .5], [.2, .5], [-.2, -.5], [.2, -.5]].map(([x, z]) => {
    const p = limb(.18, .5, .18, c, x, .5, g);
    p.position.z = z;
    return p;
  });
  g.scale.setScalar(t.scale);
  scene.add(g);
  const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: alertTex, transparent: true }));
  mark.scale.setScalar(1.5);
  mark.position.y = 2.6;
  mark.visible = false;
  g.add(mark);
  const pos = new THREE.Vector3(h.x, 0, h.z).addScaledVector(new THREE.Vector3(h.dx, 0, h.dz), 5);
  return { ...t, house: h, group: g, legs, tail, mark, pos, target: pos.clone(), wait: 0, cd: 0, alert: false, phase: 0, r: .55 * t.scale };
}
const dogs = HOUSES.filter(h => h.dog).map(buildDog);
const inYard = (p, y) => p.x > y.x0 && p.x < y.x1 && p.z > y.z0 && p.z < y.z1;

function bite(d) {
  const a = Math.atan2(player.pos.x - d.pos.x, player.pos.z - d.pos.z);
  player.kx = Math.sin(a) * d.knock;
  player.kz = Math.cos(a) * d.knock;
  player.vy = Math.max(player.vy, 4);
  player.stun = d.stun;
  view.shake = .35;
  d.cd = 1.2;
  for (const o of orders) o.fresh = Math.max(0, o.fresh - d.damage);
  toast(orders.length ? `${d.name} bit you! -${d.damage}%` : `${d.name} bit you!`);
}

function updateDog(d, dt) {
  const y = d.house.yard, chasing = inYard(player.pos, y);
  // Too far off to make out, so not worth a dozen draw calls each.
  d.group.visible = Math.hypot(player.pos.x - d.pos.x, player.pos.z - d.pos.z) < 130;
  if (chasing && !d.alert) toast('WOOF! Run!');
  d.alert = chasing;
  d.mark.visible = chasing;
  d.cd -= dt;

  let speed = 1.6;
  if (chasing) {
    d.target.copy(player.pos);
    speed = d.speed;
  } else if ((d.wait -= dt) < 0) {
    d.wait = 1 + Math.random() * 3;
    d.target.set(d.house.x + (Math.random() - .5) * 20, 0, d.house.z + (Math.random() - .5) * 20);
    d.target.addScaledVector(new THREE.Vector3(d.house.dx, 0, d.house.dz), 4);
  }

  const dx = d.target.x - d.pos.x, dz = d.target.z - d.pos.z, dist = Math.hypot(dx, dz);
  const moving = dist > .6;
  if (moving) {
    d.pos.x += dx / dist * speed * dt;
    d.pos.z += dz / dist * speed * dt;
    d.group.rotation.y = Math.atan2(dx, dz);
    d.phase += speed * dt * 2.4;
  }
  resolve(d.pos, d.r);
  // Staying inside the yard rect is what makes a dog give up at the fence.
  d.pos.x = clamp(d.pos.x, y.x0 + .8, y.x1 - .8);
  d.pos.z = clamp(d.pos.z, y.z0 + .8, y.z1 - .8);

  const swing = moving ? Math.sin(d.phase) * .9 : 0;
  d.legs.forEach((l, i) => l.rotation.x = i % 2 ? -swing : swing);
  d.tail.rotation.y = Math.sin(performance.now() / (chasing ? 50 : 160)) * .6;
  d.group.position.copy(d.pos);
  d.group.position.y = chasing ? Math.abs(Math.sin(d.phase)) * .25 : 0;

  const touching = Math.hypot(player.pos.x - d.pos.x, player.pos.z - d.pos.z) < 1.1 + d.r;
  // The bigger the dog, the higher you have to jump to clear it.
  if (chasing && touching && d.cd <= 0 && player.pos.y < .5 + d.scale * .25) bite(d);
}

export { dogs, inYard, updateDog };
