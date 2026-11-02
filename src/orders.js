// Taking, tracking and delivering orders.
import * as THREE from 'three';
import { clamp, toast } from './util.js';
import { RUN, FOOD_TIME, PARCEL_TIME, FOOD_PAY, PARCEL_PAY, FAR_PAY, NIGHT_PAY, STAR_PAY, OFFER_COUNT, OFFER_LIFE, DOG_TYPES, DOG_BREEDS } from './config.js';
import { clock } from './daynight.js';
import { scene } from './engine.js';
import { HOMES } from './data/homes.js';
import { ORDER_TYPES, ORDER_KEYS } from './data/orderTypes.js';
import { HUB, HUB_R, hubRing, HOUSES } from './world.js';
import { carryFood, carryParcel, player } from './player.js';
import { save, saveGame, rideStats } from './save.js';

const orders = [];
let lastHouse = null, offers = [], offersBorn = 0;
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

// The more deliveries you do well, the harder the orders you're trusted with.
function maxStars() {
  const n = save.ratingCount, average = n ? save.ratingSum / n : 0;
  return n >= 15 && average >= 4 ? 5 : n >= 5 && average >= 3.5 ? 4 : 3;
}

const starText = n => '★'.repeat(n) + '☆'.repeat(5 - n);

function difficulty(house, type) {
  const dist = Math.hypot(house.step.x - HUB.x, house.step.z - HUB.z);
  const dog = house.dog ? DOG_TYPES[DOG_BREEDS[house.dog].size].danger : 0;
  const risk = (house.risk || 0) + (clock.night > .5 ? house.nightRisk || 0 : 0);
  return clamp(Math.round(1 + Math.max(0, dist - 60) / 70 + dog + risk + type.stars), 1, 5);
}

function pickType() {
  const pool = ORDER_KEYS.flatMap(k => Array(ORDER_TYPES[k].weight).fill(k));
  return pool[Math.floor(Math.random() * pool.length)];
}

function makeOffer(house, typeKey) {
  const type = ORDER_TYPES[typeKey], stars = difficulty(house, type);
  const food = !type.parcelOnly && !house.parcelOnly && Math.random() < .6;
  const dist = Math.hypot(house.step.x - HUB.x, house.step.z - HUB.z);
  // Time is what a runner needs to get there plus a margin, so faster vehicles keep more of it as tip.
  const max = ((food ? FOOD_TIME + dist / RUN * 1.25 : PARCEL_TIME + dist / RUN * 1.6) + (house.extraTime || 0)) * type.time;
  const base = (food ? FOOD_PAY : PARCEL_PAY) + Math.max(0, dist - 60) * FAR_PAY;
  const pay = Math.round(base * (1 + (stars - 1) * STAR_PAY) * type.pay);
  const place = house.place || `${house.name} house`, thing = food ? 'food' : 'parcel', label = type.label || (food ? 'Food' : 'Parcel');
  return { food, house, type, stars, max, pay, title: `${type.label ? `${label} ${thing}` : label} to ${place}` };
}

function renewOffers() {
  offers = [];
  offersBorn = performance.now();
  // Dog yards come up about twice as often: they're the fun part. A place can set its own weight.
  const pool = HOUSES.flatMap(h => Array(h.weight ?? (h.dog ? 2 : 1)).fill(h));
  for (let i = 0; i < 80 && offers.length < OFFER_COUNT; i++) {
    const house = pool[Math.floor(Math.random() * pool.length)];
    if (house === lastHouse || orders.some(o => o.house === house) || offers.some(o => o.house === house)) continue;
    // The first offer is always a plain one, so there's always something you can take.
    const offer = makeOffer(house, offers.length ? pickType() : 'normal');
    if (offer.stars <= maxStars()) offers.push(offer);
  }
  offers.sort((a, b) => a.stars - b.stars);
}

function currentOffers() {
  if (!offers.length || performance.now() - offersBorn > OFFER_LIFE * 1000) renewOffers();
  return offers;
}

function offerProblem(offer) {
  if (orders.length >= capacity()) return 'Your ride is full';
  if (capacity() < (offer.type.minCarry || 0)) return `Needs a sidecar`;
  return '';
}

function addOrder(order) {
  const beam = beams.find(b => !b.visible);
  beam.position.set(order.house.step.x, 8, order.house.step.z);
  beam.visible = true;
  orders.push({ ...order, left: order.max, fresh: 100, beam });
  syncCarry();
}

function acceptOffer(offer) {
  if (offerProblem(offer)) return false;
  lastHouse = offer.house;
  addOrder(offer);
  toast(offer.food ? 'Hot food! Go go go!' : 'Parcel: heavy, so you move slower');
  return true;
}

// Dogs and collisions hurt everything you're carrying, and fragile orders twice as much.
function hurtOrders(amount) {
  for (const o of orders) o.fresh = Math.max(0, o.fresh - amount * (o.type?.damage ?? 1));
}

function rate(stars) {
  save.ratingSum += stars;
  save.ratingCount++;
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
      rate(1);
      saveGame();
      toast('Too late! Order cancelled, 1 star');
      endOrder(o);
    } else if (Math.hypot(player.pos.x - o.house.step.x, player.pos.z - o.house.step.z) < 2.4) {
      const tip = Math.round(o.pay * 1.5 * (o.left / o.max) * (o.fresh / 100));
      const night = clock.night > .5;
      const total = Math.round((o.pay + tip) * (1 + HOMES[save.homeLevel].bonus) * (night ? NIGHT_PAY : 1));
      // Rush orders run short on time by design, so the clock counts for less than the condition.
      const stars = clamp(Math.round(1 + 4 * (Math.min(1, o.left / o.max * 1.6) * .5 + o.fresh / 100 * .5)), 1, 5);
      rate(stars);
      save.cash += total;
      save.delivered++;
      saveGame();
      toast(`${starText(stars)} +₱${total}${night ? ' night pay' : ''}`);
      endOrder(o);
    }
  }
}

export { orders, nearHub, capacity, nearestOrder, syncCarry, currentOffers, renewOffers, acceptOffer, offerProblem, addOrder, starText, maxStars, hurtOrders, updateOrder, beamMaterial };
