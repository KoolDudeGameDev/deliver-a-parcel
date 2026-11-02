// Night jobs. After dark a dealer appears somewhere on the map. Take their shady package to the
// buyer for big money, but it makes you a target for the police.
import * as THREE from 'three';
import { toast } from './util.js';
import { RUN, DEALER_MIN, BUYER_MIN, CONTRABAND_PAY, CONTRABAND_FAR_PAY } from './config.js';
import { scene, box } from './engine.js';
import { clearSpot } from './world.js';
import { clock } from './daynight.js';
import { player } from './player.js';
import { orders, capacity, addOrder } from './orders.js';

const REACH = 3.6, SPAWN_DELAY = 8, RING_COLOR = 0xb14dff;

function figure(coat) {
  const g = new THREE.Group();
  box(.95, 1.6, .55, coat, 0, 1.2, 0, g);
  box(.85, .85, .8, coat, 0, 2.4, 0, g);
  box(.5, .4, .1, 0x171717, 0, 2.35, .4, g);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.1, 28).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: RING_COLOR, transparent: true, opacity: .8, side: THREE.DoubleSide, toneMapped: false }));
  ring.position.y = .2;
  g.add(ring);
  g.visible = false;
  scene.add(g);
  return g;
}
const dealer = figure(0x2c2238), buyer = figure(0x3a2a22);
let wait = 2;

const carrying = () => orders.find(o => o.contraband);
const nearDealer = () => dealer.visible && Math.hypot(player.pos.x - dealer.position.x, player.pos.z - dealer.position.z) < REACH;

function takePackage() {
  if (!nearDealer()) return false;
  if (orders.length >= capacity()) {
    toast('Your ride is full');
    return false;
  }
  const [x, z] = clearSpot(dealer.position.x, dealer.position.z, BUYER_MIN);
  const dist = Math.hypot(x - dealer.position.x, z - dealer.position.z);
  addOrder({
    food: false, light: true, contraband: true, title: 'Shady package to the buyer',
    house: { name: 'Buyer', place: 'the buyer', x, z, step: new THREE.Vector3(x, 0, z) },
    max: 10 + dist / RUN * .9, pay: Math.round(CONTRABAND_PAY + dist * CONTRABAND_FAR_PAY),
  });
  dealer.visible = false;
  wait = SPAWN_DELAY;
  toast('Shady package. Watch out for the police!');
  return true;
}

function updateContraband(dt) {
  const job = carrying(), dark = clock.night > .5;
  buyer.visible = !!job;
  if (job) buyer.position.set(job.house.x, 0, job.house.z);
  if (!dark) dealer.visible = false;
  if (dark && !job && !dealer.visible && (wait -= dt) <= 0) {
    const [x, z] = clearSpot(player.pos.x, player.pos.z, DEALER_MIN);
    dealer.position.set(x, 0, z);
    dealer.rotation.y = Math.random() * 6;
    dealer.visible = true;
    toast('A dealer is out tonight. Check the map');
  }
}

export { dealer, buyer, carrying, nearDealer, takePackage, updateContraband };
