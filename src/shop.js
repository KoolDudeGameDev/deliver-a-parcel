// The one panel behind three places: your home, the dealer and the mechanic.
import { $ } from './util.js';
import { keys } from './state.js';
import { VEHICLES, VEHICLE_KEYS } from './data/vehicles.js';
import { HOMES } from './data/homes.js';
import { PAINTS, PAINT_PRICES, DECOR, DECOR_KEYS } from './data/cosmetics.js';
import { save, saveGame, rideStats } from './save.js';
import { buyHome, buyVehicle, buyPart, buyPaint, buyDecor, nextVehicle, setVehicle } from './home.js';

const shopBox = $('shopBox');
const TITLES = { home: 'Your home', dealer: 'Vehicle dealer', mechanic: 'Mechanic' };
let current = 'home';

function heading(text) {
  const h = document.createElement('h3');
  h.textContent = text;
  return h;
}

function row(name, sub, label, enabled, onClick) {
  const r = document.createElement('div'), b = document.createElement('button');
  r.className = 'veh';
  r.append(document.createElement('b'), document.createElement('span'), b);
  r.children[0].textContent = name;
  r.children[1].textContent = sub;
  b.textContent = label;
  b.disabled = !enabled;
  b.onclick = () => { onClick(); renderShop(); };
  return r;
}

// A strip of colour buttons. The colour in use is marked, and can't be bought twice.
function swatches(kind, current_, price, key) {
  const strip = document.createElement('div');
  strip.className = 'swatches';
  for (const { name, color } of PAINTS) {
    const b = document.createElement('button');
    b.className = 'swatch';
    b.style.background = `#${color.toString(16).padStart(6, '0')}`;
    b.title = `${name} ₱${price}`;
    b.setAttribute('aria-label', `${name}, ₱${price}`);
    b.disabled = color === current_ || save.cash < price;
    b.classList.toggle('picked', color === current_);
    b.onclick = () => { buyPaint(kind, color, key); renderShop(); };
    strip.append(b);
  }
  return strip;
}

const rideLine = key => { const r = rideStats(key); return `${r.speed} m/s · carries ${r.carry}`; };
const useRide = key => { setVehicle(key); saveGame(); };

function ownedRides() {
  return [
    row('On foot', rideLine(null), save.equipped ? 'Use' : 'Using', !!save.equipped, () => useRide(null)),
    ...VEHICLE_KEYS.filter(k => save.owned.includes(k)).map(k =>
      row(VEHICLES[k].name, rideLine(k), save.equipped === k ? 'Using' : 'Use', save.equipped !== k, () => useRide(k))),
  ];
}

function homeList() {
  const home = HOMES[save.homeLevel], next = HOMES[save.homeLevel + 1], style = save.style;
  return [
    heading('House'),
    row(home.name, `+${Math.round(home.bonus * 100)}% pay${next ? ` · next: ${next.name}` : ''}`,
      next ? `₱${next.price}` : 'Max', next && save.cash >= next.price, buyHome),
    heading(`Paint your house, ₱${PAINT_PRICES.house}`),
    swatches('house', style.house, PAINT_PRICES.house),
    heading('Garden'),
    ...DECOR_KEYS.map(k => row(DECOR[k].name, style.decor.includes(k) ? 'In your yard' : 'For your yard',
      style.decor.includes(k) ? 'Owned' : `₱${DECOR[k].price}`, !style.decor.includes(k) && save.cash >= DECOR[k].price, () => buyDecor(k))),
    heading(`Shirt, ₱${PAINT_PRICES.shirt}`),
    swatches('shirt', style.shirt, PAINT_PRICES.shirt),
    heading(`Cap, ₱${PAINT_PRICES.hat}`),
    swatches('hat', style.hat, PAINT_PRICES.hat),
    heading('Your rides'),
    ...ownedRides(),
  ];
}

function dealerList() {
  return [
    heading('Vehicles'),
    ...VEHICLE_KEYS.map(k => {
      const v = VEHICLES[k];
      if (save.owned.includes(k)) return row(v.name, rideLine(k), save.equipped === k ? 'Using' : 'Use', save.equipped !== k, () => useRide(k));
      const line = `${v.speed} m/s · carries 1`;
      if (k === nextVehicle()) return row(v.name, line, `₱${v.price}`, save.cash >= v.price, () => buyVehicle(k));
      return row(v.name, line, 'Locked', false);
    }),
  ];
}

function mechanicList() {
  const k = save.equipped;
  if (!k) return [heading('Nothing to work on'), row('Bring a vehicle', 'Buy one at the dealer, then pick it at home', 'Closed', false)];
  const list = [heading(`${VEHICLES[k].name} upgrades`)];
  for (const [p, def] of Object.entries(VEHICLES[k].parts)) {
    const level = save.parts[k][p], price = def.prices[level];
    const gives = def.carry ? `+${def.carry} order${def.carry > 1 ? 's' : ''}` : def.speed ? `+${def.speed} m/s` : `+${def.accel} grip`;
    list.push(row(def.name, `Level ${level} of ${def.prices.length} · ${gives}`,
      price === undefined ? 'Max' : `₱${price}`, price !== undefined && save.cash >= price, () => buyPart(k, p)));
  }
  list.push(heading(`Paint your ${VEHICLES[k].name.toLowerCase()}, ₱${PAINT_PRICES.ride}`), swatches('ride', save.style.rides[k], PAINT_PRICES.ride, k));
  return list;
}

function renderShop() {
  $('shopTitle').textContent = TITLES[current];
  $('shopCash').textContent = `₱${save.cash}`;
  $('shopList').replaceChildren(...{ home: homeList, dealer: dealerList, mechanic: mechanicList }[current]());
}

function openShop(kind) {
  current = kind;
  for (const k in keys) keys[k] = false;
  renderShop();
  shopBox.showModal();
}

export { shopBox, openShop };
