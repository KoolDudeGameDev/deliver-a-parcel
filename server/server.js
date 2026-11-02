// The multiplayer server: one world of up to seven players. It passes positions, looks and each
// player's worth and rating between them, and looks after who owns which home. The game itself runs
// in each browser, and nothing is stored: the board shows whoever is in the world right now.
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 8080;
const MAX_PLAYERS = 7, TICK_MS = 100, MAX_MESSAGE = 1024, MAX_PER_SECOND = 40;

const players = new Map();
let nextId = 1;

// Everything from a client is untrusted, so every field is checked before it's kept or shared.
const number = (v, low, high, fallback = 0) => (Number.isFinite(v) ? Math.min(high, Math.max(low, v)) : fallback);
const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const color = v => (Number.isInteger(v) && v >= 0 && v <= 0xffffff ? v : null);

// Returning players keep their home if it's free. Anyone else gets a random free lot.
function freeSlot(wanted) {
  const used = new Set([...players.values()].map(p => p.slot));
  if (Number.isInteger(wanted) && wanted >= 0 && wanted < MAX_PLAYERS && !used.has(wanted)) return wanted;
  const free = Array.from({ length: MAX_PLAYERS }, (_, i) => i).filter(i => !used.has(i));
  return free.length ? free[Math.floor(Math.random() * free.length)] : null;
}

function send(ws, message) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
}

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const p of players.values()) if (p.ws.readyState === p.ws.OPEN) p.ws.send(data);
}

function join(ws, m) {
  if (players.has(ws.id)) return;
  const slot = freeSlot(m.slot);
  if (slot === null) {
    send(ws, { t: 'full' });
    ws.close();
    return;
  }
  const p = {
    ws, id: ws.id, slot, name: text(m.name, 12) || 'Rider', x: 0, y: 0, z: 0, ry: 0, ride: null, speed: 0,
    level: 0, paint: null, shirt: null, hat: null, skin: null, pants: null, worth: 0, rating: 0,
  };
  players.set(ws.id, p);
  send(ws, { t: 'welcome', id: p.id, slot });
}

function onMessage(ws, data) {
  // A simple flood limit, so one client can't drown the server.
  const now = Date.now();
  if (now - ws.windowStart >= 1000) {
    ws.windowStart = now;
    ws.windowCount = 0;
  }
  if (++ws.windowCount > MAX_PER_SECOND) return;

  let m;
  try {
    m = JSON.parse(data);
  } catch {
    return;
  }
  if (!m || typeof m !== 'object') return;
  if (m.t === 'join') {
    join(ws, m);
    return;
  }
  const p = players.get(ws.id);
  if (!p) return;
  if (m.t === 's') {
    p.x = number(m.x, -200, 200);
    p.y = number(m.y, 0, 10);
    p.z = number(m.z, -200, 200);
    p.ry = number(m.ry, -10, 10);
    p.speed = number(m.speed, 0, 40);
    p.ride = text(m.ride, 16) || null;
  } else if (m.t === 'style') {
    p.level = number(m.level, 0, 4);
    p.paint = color(m.paint);
    p.shirt = color(m.shirt);
    p.hat = color(m.hat);
    p.skin = color(m.skin);
    p.pants = color(m.pants);
  } else if (m.t === 'stats') {
    // A browser could claim anything here, but it only ever shows to the six others in its world.
    p.worth = Math.floor(number(m.worth, 0, 1e9));
    p.rating = number(m.rating, 0, 5);
  }
}

const http = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end(`Deliver a Parcel: ${players.size} of ${MAX_PLAYERS} online\n`);
});
const wss = new WebSocketServer({ server: http, maxPayload: MAX_MESSAGE });

wss.on('connection', ws => {
  ws.id = nextId++;
  ws.windowStart = Date.now();
  ws.windowCount = 0;
  ws.on('message', data => onMessage(ws, data));
  ws.on('close', () => {
    if (players.delete(ws.id)) broadcast({ t: 'left', id: ws.id });
  });
  ws.on('error', () => ws.terminate());
});

setInterval(() => {
  if (!players.size) return;
  const list = [...players.values()].map(({ id, slot, name, x, y, z, ry, ride, speed, level, paint, shirt, hat, skin, pants, worth, rating }) =>
    ({ id, slot, name, x, y, z, ry, ride, speed, level, paint, shirt, hat, skin, pants, worth, rating }));
  broadcast({ t: 'w', players: list });
}, TICK_MS);

http.listen(PORT, () => console.log(`Listening on ${PORT}`));
