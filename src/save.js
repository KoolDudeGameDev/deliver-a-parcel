// Progress saved in the browser, and the stats it gives your ride.
import { clamp } from './util.js';
import { RUN } from './config.js';
import { VEHICLES, VEHICLE_KEYS } from './data/vehicles.js';
import { HOMES } from './data/homes.js';
import { PAINTS, SKINS, DECOR, DECOR_KEYS } from './data/cosmetics.js';
import { LOTS } from './world.js';

// Lives in this browser for now. Anything unexpected in it just means a new game.
const SAVE_KEY = 'delivery-game-save-v1';
function cleanParts(saved) {
  const parts = {};
  for (const k of VEHICLE_KEYS) {
    parts[k] = {};
    for (const [p, def] of Object.entries(VEHICLES[k].parts)) {
      const n = saved?.[k]?.[p];
      parts[k][p] = Number.isInteger(n) ? clamp(n, 0, def.prices.length) : 0;
    }
  }
  return parts;
}

const isPaint = c => PAINTS.some(p => p.color === c);
function cleanStyle(saved) {
  const rides = {};
  for (const k of VEHICLE_KEYS) if (isPaint(saved?.rides?.[k])) rides[k] = saved.rides[k];
  return {
    house: isPaint(saved?.house) ? saved.house : null, shirt: isPaint(saved?.shirt) ? saved.shirt : null, hat: isPaint(saved?.hat) ? saved.hat : null,
    pants: isPaint(saved?.pants) ? saved.pants : null, skin: SKINS.includes(saved?.skin) ? saved.skin : null,
    rides, decor: DECOR_KEYS.filter(k => Array.isArray(saved?.decor) && saved.decor.includes(k)),
  };
}

function cleanRegulars(saved) {
  const out = {};
  for (const [k, v] of Object.entries(saved && typeof saved === 'object' ? saved : {})) if (Number.isInteger(v) && v > 0) out[k] = v;
  return out;
}

function cleanGoals(saved) {
  const list = Array.isArray(saved?.list) ? saved.list.filter(g => Number.isInteger(g?.type) && Number.isFinite(g?.progress)) : [];
  return { day: typeof saved?.day === 'string' ? saved.day : '', list: list.map(g => ({ type: g.type, progress: g.progress, done: g.done === true })) };
}

function loadSave() {
  const fresh = { name: '', slot: null, cash: 0, delivered: 0, owned: [], equipped: null, homeLevel: 0, parts: cleanParts(), ratingSum: 0, ratingCount: 0, muted: false, style: cleanStyle(), streak: 0, regulars: {}, goals: { day: '', list: [] } };
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!s || typeof s !== 'object') return fresh;
    const owned = VEHICLE_KEYS.filter(k => Array.isArray(s.owned) && s.owned.includes(k));
    return {
      name: typeof s.name === 'string' ? s.name.slice(0, 12) : '',
      slot: Number.isInteger(s.slot) && LOTS[s.slot] ? s.slot : null,
      cash: Number.isFinite(s.cash) && s.cash > 0 ? Math.floor(s.cash) : 0,
      delivered: Number.isFinite(s.delivered) && s.delivered > 0 ? Math.floor(s.delivered) : 0,
      owned,
      equipped: owned.includes(s.equipped) ? s.equipped : null,
      homeLevel: HOMES[s.homeLevel] ? s.homeLevel : 0,
      parts: cleanParts(s.parts),
      ratingSum: Number.isFinite(s.ratingSum) && s.ratingSum > 0 ? s.ratingSum : 0,
      ratingCount: Number.isInteger(s.ratingCount) && s.ratingCount > 0 ? s.ratingCount : 0,
      muted: s.muted === true,
      style: cleanStyle(s.style),
      streak: Number.isInteger(s.streak) && s.streak > 0 ? s.streak : 0,
      regulars: cleanRegulars(s.regulars),
      goals: cleanGoals(s.goals),
    };
  } catch {
    return fresh;
  }
}
const save = loadSave();
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Private browsing can refuse storage. The game still plays, it just won't be kept.
  }
}

function rideStats(key) {
  if (!key) return { name: 'Running', speed: RUN, accel: 30, carry: 1, seat: 0, pose: null };
  const v = VEHICLES[key], lv = save.parts[key], stats = { name: v.name, speed: v.speed, accel: v.accel, carry: v.carry ?? 1, seat: v.seat(lv), pose: v.pose };
  for (const [p, def] of Object.entries(v.parts)) {
    for (const stat of ['speed', 'accel', 'carry']) stats[stat] += (def[stat] || 0) * lv[p];
  }
  return stats;
}

// What you're worth: cash plus everything you've built and bought, for the board in a shared world.
function worth() {
  let total = save.cash + HOMES.slice(1, save.homeLevel + 1).reduce((sum, h) => sum + h.price, 0);
  for (const k of save.owned) {
    total += VEHICLES[k].price;
    for (const [p, def] of Object.entries(VEHICLES[k].parts)) total += def.prices.slice(0, save.parts[k][p]).reduce((a, b) => a + b, 0);
  }
  return total + save.style.decor.reduce((sum, k) => sum + DECOR[k].price, 0);
}

const rating = () => (save.ratingCount ? save.ratingSum / save.ratingCount : 0);

export { save, saveGame, rideStats, worth, rating };
