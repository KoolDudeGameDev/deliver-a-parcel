// The multiplayer server: one world of up to seven players. It passes positions between players,
// looks after who owns which home, and keeps a leaderboard. The game itself runs in each browser.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 8080;
const BOARD_FILE = process.env.BOARD_FILE || './leaderboard.json';
const MAX_PLAYERS = 7, TICK_MS = 100, MAX_MESSAGE = 1024, MAX_PER_SECOND = 40, BOARD_SIZE = 10;

const players = new Map();
let nextId = 1;

let leaderboard = [];
try {
  leaderboard = JSON.parse(readFileSync(BOARD_FILE, 'utf8'));
} catch {
  // No file yet, or a bad one. Start empty.
}

// Everything from a client is untrusted, so every field is checked before it's kept or shared.
const number = (v, low, high, fallback = 0) => (Number.isFinite(v) ? Math.min(high, Math.max(low, v)) : fallback);
const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const color = v => (Number.isInteger(v) && v >= 0 && v <= 0xffffff ? v : null);

function freeSlot(wanted) {
  const used = new Set([...players.values()].map(p => p.slot));
  if (Number.isInteger(wanted) && wanted >= 0 && wanted < MAX_PLAYERS && !used.has(wanted)) return wanted;
  for (let i = 0; i < MAX_PLAYERS; i++) if (!used.has(i)) return i;
  return null;
}

function send(ws, message) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
}

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const p of players.values()) if (p.ws.readyState === p.ws.OPEN) p.ws.send(data);
}

function updateBoard(p, delivered) {
  const entry = leaderboard.find(e => e.name === p.name);
  if (entry && entry.delivered >= delivered) return;
  if (entry) entry.delivered = delivered;
  else leaderboard.push({ name: p.name, delivered });
  leaderboard.sort((a, b) => b.delivered - a.delivered);
  leaderboard = leaderboard.slice(0, BOARD_SIZE);
  try {
    writeFileSync(BOARD_FILE, JSON.stringify(leaderboard));
  } catch {
    // Without a disk the board still works until the server restarts.
  }
  broadcast({ t: 'board', board: leaderboard });
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
    level: number(m.level, 0, 4), paint: color(m.paint), shirt: color(m.shirt), hat: color(m.hat),
  };
  players.set(ws.id, p);
  send(ws, { t: 'welcome', id: p.id, slot, board: leaderboard });
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
  } else if (m.t === 'score') {
    updateBoard(p, number(m.delivered, 0, 1e7));
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
  const list = [...players.values()].map(({ id, slot, name, x, y, z, ry, ride, speed, level, paint, shirt, hat }) =>
    ({ id, slot, name, x, y, z, ry, ride, speed, level, paint, shirt, hat }));
  broadcast({ t: 'w', players: list });
}, TICK_MS);

http.listen(PORT, () => console.log(`Listening on ${PORT}`));
