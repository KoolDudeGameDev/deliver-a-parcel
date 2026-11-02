// Progress saved in the browser, and the stats it gives your ride.
import { clamp } from './util.js';
import { RUN } from './config.js';
import { VEHICLES, VEHICLE_KEYS } from './data/vehicles.js';
import { HOMES } from './data/homes.js';
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

function loadSave() {
  const fresh = { name: '', slot: null, cash: 0, delivered: 0, owned: [], equipped: null, homeLevel: 0, parts: cleanParts() };
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
  if (!key) return { name: 'Running', speed: RUN, accel: 30, carry: 1, seat: 0 };
  const v = VEHICLES[key], lv = save.parts[key], stats = { name: v.name, speed: v.speed, accel: v.accel, carry: 1, seat: v.seat(lv) };
  for (const [p, def] of Object.entries(v.parts)) {
    for (const stat of ['speed', 'accel', 'carry']) stats[stat] += (def[stat] || 0) * lv[p];
  }
  return stats;
}

export { save, saveGame, rideStats };
