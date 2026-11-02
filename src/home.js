// Your home, the upgrade panel, the action button, and getting on and off your ride.
import * as THREE from 'three';
import { $, toast } from './util.js';
import { view, keys } from './state.js';
import { scene, textTexture } from './engine.js';
import { VEHICLES, VEHICLE_KEYS } from './data/vehicles.js';
import { HOMES } from './data/homes.js';
import { LOTS, showLotHome, homeRing } from './world.js';
import { body, player } from './player.js';
import { save, saveGame, rideStats } from './save.js';
import { orders, nearHub, capacity, syncCarry, takeOrder } from './orders.js';

const myLot = () => LOTS[save.slot];
const nearSpot = (spot, r) => Math.hypot(player.pos.x - spot.x, player.pos.z - spot.z) < r;

function showHome() {
  const l = myLot();
  showLotHome(l, save.homeLevel);
  l.signMaterial.map.dispose();
  l.signMaterial.map = textTexture([save.name, HOMES[save.homeLevel].name], '#fff', '#222');
  homeRing.position.set(l.step.x, .2, l.step.z);
  homeRing.visible = true;
}

function goHome() {
  player.pos.copy(myLot().step);
  body.rotation.y = Math.atan2(myLot().dx, myLot().dz);
  view.yaw = body.rotation.y + Math.PI;
}

function claimLot(lot, name) {
  save.slot = LOTS.indexOf(lot);
  save.name = name;
  saveGame();
  showHome();
  goHome();
  toast(`Welcome home, ${name}!`);
}

const claimBox = $('claimBox'), garageBox = $('garageBox');
const dialogOpen = () => claimBox.open || garageBox.open;
claimBox.addEventListener('close', () => {
  claimLot(LOTS[Math.floor(Math.random() * LOTS.length)], $('nameInput').value.trim() || 'Rider');
});

function buyHome() {
  const next = HOMES[save.homeLevel + 1];
  if (!next || save.cash < next.price) return false;
  save.cash -= next.price;
  save.homeLevel++;
  saveGame();
  showHome();
  toast(`${next.name} built!`);
  return true;
}

const nextVehicle = () => VEHICLE_KEYS.find(k => !save.owned.includes(k));

function buyVehicle(key) {
  const v = VEHICLES[key];
  if (key !== nextVehicle() || save.cash < v.price) return false;
  save.cash -= v.price;
  save.owned.push(key);
  setVehicle(key);
  saveGame();
  toast(`${v.name} bought!`);
  return true;
}

function buyPart(key, part) {
  const lv = save.parts[key], price = VEHICLES[key].parts[part].prices[lv[part]];
  if (!save.owned.includes(key) || price === undefined || save.cash < price) return false;
  save.cash -= price;
  lv[part]++;
  if (save.equipped === key) setVehicle(key);
  saveGame();
  toast(`${VEHICLES[key].parts[part].name} fitted!`);
  return true;
}

// The cheapest next thing you could buy right now, for the nudge in the hint line.
function affordable() {
  const v = VEHICLES[nextVehicle()], home = HOMES[save.homeLevel + 1], ride = VEHICLES[save.equipped];
  const options = [v, home].filter(Boolean);
  for (const [p, def] of Object.entries(ride?.parts || {})) {
    const price = def.prices[save.parts[save.equipped][p]];
    if (price !== undefined) options.push({ name: def.name, price });
  }
  return options.filter(o => o.price <= save.cash).sort((a, b) => a.price - b.price)[0];
}

function renderGarage() {
  $('garageCash').textContent = `You have ₱${save.cash}`;
  const heading = text => {
    const h = document.createElement('h3');
    h.textContent = text;
    return h;
  };
  const row = (name, sub, label, enabled, onClick) => {
    const r = document.createElement('div'), b = document.createElement('button');
    r.className = 'veh';
    r.append(document.createElement('b'), document.createElement('span'), b);
    r.children[0].textContent = name;
    r.children[1].textContent = sub;
    b.textContent = label;
    b.disabled = !enabled;
    b.onclick = () => { onClick(); renderGarage(); };
    return r;
  };
  const use = key => { setVehicle(key); saveGame(); };
  const rideLine = key => { const r = rideStats(key); return `${r.speed} m/s · carries ${r.carry}`; };
  const home = HOMES[save.homeLevel], nextHome = HOMES[save.homeLevel + 1];
  const list = [
    heading('House'),
    row(home.name, `+${Math.round(home.bonus * 100)}% pay${nextHome ? ` · next: ${nextHome.name}` : ''}`,
      nextHome ? `₱${nextHome.price}` : 'Max', nextHome && save.cash >= nextHome.price, buyHome),
    heading('Ride'),
    row('Running', rideLine(null), save.equipped ? 'Use' : 'Using', !!save.equipped, () => use(null)),
    ...VEHICLE_KEYS.map(k => {
      const v = VEHICLES[k];
      if (save.owned.includes(k)) return row(v.name, rideLine(k), save.equipped === k ? 'Using' : 'Use', save.equipped !== k, () => use(k));
      const line = `${v.speed} m/s · carries 1`;
      if (k === nextVehicle()) return row(v.name, line, `₱${v.price}`, save.cash >= v.price, () => buyVehicle(k));
      return row(v.name, line, 'Locked', false);
    }),
  ];
  const k = save.equipped;
  if (k) {
    list.push(heading(`${VEHICLES[k].name} upgrades`));
    for (const [p, def] of Object.entries(VEHICLES[k].parts)) {
      const level = save.parts[k][p], price = def.prices[level];
      const gives = def.carry ? `+${def.carry} order${def.carry > 1 ? 's' : ''}` : def.speed ? `+${def.speed} m/s` : `+${def.accel} grip`;
      list.push(row(def.name, `Level ${level} of ${def.prices.length} · ${gives}`,
        price === undefined ? 'Max' : `₱${price}`, price !== undefined && save.cash >= price, () => buyPart(k, p)));
    }
  }
  $('garageList').replaceChildren(...list);
}

function openGarage() {
  for (const k in keys) keys[k] = false;
  renderGarage();
  garageBox.showModal();
}

// What the action button would do right here.
function actionSpot() {
  if (orders.length < capacity() && nearHub()) return 'ORDER';
  if (myLot() && nearSpot(myLot().step, 3.6)) return 'HOME';
  return null;
}

function action() {
  const spot = actionSpot();
  if (spot === 'ORDER') takeOrder();
  else if (spot === 'HOME') openGarage();
}

// A vehicle rides under the player, or waits at the gate while they walk a yard.
let rideGroup = null, rideNow = null, parked = false;

function setVehicle(key) {
  rideGroup?.removeFromParent();
  save.equipped = key;
  parked = false;
  rideGroup = rideNow = null;
  if (key) {
    rideNow = rideStats(key);
    rideGroup = new THREE.Group();
    VEHICLES[key].model(rideGroup, save.parts[key]);
    mountVehicle();
  }
  syncCarry();
}

function mountVehicle() {
  parked = false;
  body.add(rideGroup);
  rideGroup.position.set(0, -rideNow.seat, 0);
  rideGroup.rotation.y = 0;
}

function parkVehicle() {
  parked = true;
  scene.add(rideGroup);
  rideGroup.position.set(player.pos.x, 0, player.pos.z);
  rideGroup.rotation.y = body.rotation.y;
  toast('Parked at the gate. On foot from here!');
}

export { myLot, nearSpot, showHome, goHome, claimLot, claimBox, dialogOpen, buyHome, nextVehicle, buyVehicle, buyPart, affordable, actionSpot, action, setVehicle, mountVehicle, parkVehicle, rideNow, parked };
