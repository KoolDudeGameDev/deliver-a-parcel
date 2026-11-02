// Dogs: wandering, chasing and biting.
import * as THREE from 'three';
import { clamp, toast } from './util.js';
import { view } from './state.js';
import { DOG_TYPES, DOG_BREEDS } from './config.js';
import { scene, box, resolve } from './engine.js';
import { HOUSES } from './world.js';
import { limb, player } from './player.js';
import { orders, hurtOrders } from './orders.js';
import { play } from './audio.js';

const alertTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#ff3b30'; x.font = 'bold 60px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('!', 32, 34);
  return new THREE.CanvasTexture(c);
})();

function buildDog(h) {
  const b = DOG_BREEDS[h.dog], t = DOG_TYPES[b.size], g = new THREE.Group(), c = b.coat, dark = b.muzzle ?? 0x333333;
  return (b.shape === 'goose' ? buildGoose : buildFourLegs)(h, b, t, g, c, dark);
}

function buildGoose(h, b, t, g, c) {
  box(.7, .6, 1.2, c, 0, .75, 0, g);
  box(.26, 1, .26, c, 0, 1.5, .55, g);
  box(.34, .3, .46, c, 0, 2.05, .66, g);
  box(.22, .12, .34, 0xf0883a, 0, 2, 1, g);
  const tail = box(.3, .2, .4, c, 0, .95, -.7, g);
  const legs = [-.18, .18].map(x => limb(.12, .46, .12, 0xf0883a, x, .46, g));
  return finishDog(h, b, t, g, legs, tail);
}

function buildFourLegs(h, b, t, g, c, dark) {
  const len = b.len ?? 1, tall = b.legs ?? 1, bulk = b.fluffy ? 1.3 : 1, legH = .5 * tall, y = legH + .25, front = .7 * len;
  box(.6 * bulk, .6 * bulk, 1.4 * len, c, 0, y, 0, g);
  if (b.mark) box(.62 * bulk, .14, .95 * len, b.mark, 0, y + .26 * bulk, -.08, g);
  box(.55 * bulk, .5 * bulk, .55, c, 0, y + .4, front + .1, g);
  box(.3, .22, .3, dark, 0, y + .3, front + .45, g);
  for (const s of [-1, 1]) {
    if (b.ears === 'flop') box(.14, .36, .2, b.mark ?? dark, s * (.3 * bulk + .05), y + .42, front + .1, g);
    else box(.14, .28, .14, c, s * .2, y + .72, front + .05, g);
  }
  const tail = box(.12, .12, .6, c, 0, y + .25, -.7 * len - .2, g);
  tail.rotation.x = b.tail === 'up' ? 1.1 : b.tail === 'curl' ? 1.6 : .3;
  const legs = [[-.2, .5], [.2, .5], [-.2, -.5], [.2, -.5]].map(([x, z]) => {
    const p = limb(.18, legH, .18, c, x, legH, g);
    p.position.z = z * len;
    return p;
  });
  return finishDog(h, b, t, g, legs, tail);
}

function finishDog(h, b, t, g, legs, tail) {
  g.scale.setScalar(t.scale);
  scene.add(g);
  const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: alertTex, transparent: true }));
  mark.scale.setScalar(1.5);
  mark.position.y = 2.6;
  mark.visible = false;
  g.add(mark);
  const pos = new THREE.Vector3(h.x, 0, h.z).addScaledVector(new THREE.Vector3(h.dx, 0, h.dz), 5);
  return { ...t, name: b.name, call: b.call ?? 'WOOF!', house: h, group: g, legs, tail, mark, pos, target: pos.clone(), wait: 0, cd: 0, alert: false, phase: 0, r: .55 * t.scale };
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
  hurtOrders(d.damage);
  play('bite');
  toast(orders.length ? `${d.name} bit you! -${d.damage}%` : `${d.name} bit you!`);
}

function updateDog(d, dt) {
  const y = d.house.yard, chasing = inYard(player.pos, y);
  // Too far off to make out, so not worth a dozen draw calls each.
  d.group.visible = Math.hypot(player.pos.x - d.pos.x, player.pos.z - d.pos.z) < 130;
  if (chasing && !d.alert) {
    toast(`${d.call} Run!`);
    play(d.call === 'WOOF!' ? 'bark' : 'honk');
  }
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
