// Your home, the upgrade panel, the action button, and getting on and off your ride.
import * as THREE from 'three';
import { $, toast } from './util.js';
import { view } from './state.js';
import { scene, textTexture } from './engine.js';
import { VEHICLES, VEHICLE_KEYS } from './data/vehicles.js';
import { HOMES } from './data/homes.js';
import { PAINT_PRICES, DECOR } from './data/cosmetics.js';
import { LOTS, showLotHome, homeRing } from './world.js';
import { body, player, shirtMaterial, hatMaterials, SHIRT, HAT } from './player.js';
import { save, saveGame, rideStats } from './save.js';
import { syncCarry } from './orders.js';

const myLot = () => LOTS[save.slot];
const nearSpot = (spot, r) => Math.hypot(player.pos.x - spot.x, player.pos.z - spot.z) < r;

function showHome() {
  const l = myLot();
  showStyle();
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

const claimBox = $('claimBox');
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

function buyPaint(kind, color, key) {
  const price = PAINT_PRICES[kind];
  if (save.cash < price) return false;
  save.cash -= price;
  if (kind === 'ride') {
    save.style.rides[key] = color;
    if (save.equipped === key) setVehicle(key);
  } else {
    save.style[kind] = color;
    showStyle();
  }
  saveGame();
  toast('Fresh paint!');
  return true;
}

function buyDecor(key) {
  const item = DECOR[key];
  if (save.style.decor.includes(key) || save.cash < item.price) return false;
  save.cash -= item.price;
  save.style.decor.push(key);
  showStyle();
  saveGame();
  toast(`${item.name} added!`);
  return true;
}

// Puts your paint and clothes on the world.
function showStyle() {
  const l = myLot(), { style } = save;
  shirtMaterial.color.setHex(style.shirt ?? SHIRT);
  for (const m of hatMaterials) m.color.setHex(style.hat ?? HAT);
  if (!l) return;
  showLotHome(l, save.homeLevel, style.house);
  l.decor.clear();
  for (const k of style.decor) DECOR[k].model(l.decor);
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
    VEHICLES[key].model(rideGroup, save.parts[key], save.style.rides[key]);
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

export { myLot, nearSpot, showHome, showStyle, goHome, claimLot, claimBox, buyHome, nextVehicle, buyVehicle, buyPart, buyPaint, buyDecor, affordable, setVehicle, mountVehicle, parkVehicle, rideNow, rideGroup, parked };
