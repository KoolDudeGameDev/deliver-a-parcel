// Taking, tracking and delivering orders.
import * as THREE from 'three';
import { toast } from './util.js';
import { RUN, FOOD_TIME, PARCEL_TIME, FOOD_PAY, PARCEL_PAY, FAR_PAY } from './config.js';
import { scene } from './engine.js';
import { HOMES } from './data/homes.js';
import { HUB, HUB_R, hubRing, HOUSES } from './world.js';
import { carryFood, carryParcel, player } from './player.js';
import { save, saveGame, rideStats } from './save.js';

const orders = [];
let lastHouse = null;
const beamGeometry = new THREE.CylinderGeometry(1.4, 1.4, 16, 16, 1, true);
const beamMaterial = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false });
const beams = [0, 1, 2, 3].map(() => {
  const b = new THREE.Mesh(beamGeometry, beamMaterial);
  b.visible = false;
  scene.add(b);
  return b;
});

const nearHub = () => Math.hypot(player.pos.x - HUB.x, player.pos.z - HUB.z) < HUB_R;
const capacity = () => rideStats(save.equipped).carry;
const nearestOrder = () => orders.reduce((best, o) => {
  const d = Math.hypot(player.pos.x - o.house.step.x, player.pos.z - o.house.step.z);
  return !best || d < best.d ? { o, d } : best;
}, null)?.o;

function syncCarry() {
  const parcel = orders.some(o => !o.food);
  carryParcel.visible = parcel;
  carryFood.visible = orders.some(o => o.food);
  carryFood.position.y = parcel ? 2.22 : 1.75;
  hubRing.visible = orders.length < capacity();
}

function takeOrder() {
  if (orders.length >= capacity() || !nearHub()) return;
  // Dog yards come up about twice as often: they're the fun part. A place can set its own weight.
  const pool = HOUSES.flatMap(h => Array(h.weight ?? (h.dog ? 2 : 1)).fill(h)).filter(h => h !== lastHouse && !orders.some(o => o.house === h));
  const house = pool[Math.floor(Math.random() * pool.length)];
  // Time is what a runner needs to get there plus a margin, so faster vehicles keep more of it as tip.
  const food = !house.parcelOnly && Math.random() < .6, dist = Math.hypot(house.step.x - HUB.x, house.step.z - HUB.z);
  const max = (food ? FOOD_TIME + dist / RUN * 1.25 : PARCEL_TIME + dist / RUN * 1.6) + (house.extraTime || 0);
  const pay = (food ? FOOD_PAY : PARCEL_PAY) + Math.round(Math.max(0, dist - 60) * FAR_PAY);
  const beam = beams.find(b => !b.visible);
  beam.position.set(house.step.x, 8, house.step.z);
  beam.visible = true;
  orders.push({ food, house, max, left: max, fresh: 100, pay, beam });
  lastHouse = house;
  syncCarry();
  toast(food ? 'Hot food! Go go go!' : 'Parcel: heavy, so you move slower');
}

function endOrder(o) {
  orders.splice(orders.indexOf(o), 1);
  o.beam.visible = false;
  syncCarry();
}

function updateOrder(dt) {
  for (const o of [...orders]) {
    o.left -= dt;
    if (o.left <= 0) {
      toast('Too late! Order cancelled');
      endOrder(o);
    } else if (Math.hypot(player.pos.x - o.house.step.x, player.pos.z - o.house.step.z) < 2.4) {
      const tip = Math.round(o.pay * 1.5 * (o.left / o.max) * (o.fresh / 100));
      const total = Math.round((o.pay + tip) * (1 + HOMES[save.homeLevel].bonus));
      save.cash += total;
      save.delivered++;
      saveGame();
      toast(`+₱${total} (tip ₱${tip})`);
      endOrder(o);
    }
  }
}

export { orders, nearHub, capacity, nearestOrder, syncCarry, takeOrder, updateOrder, beamMaterial };
