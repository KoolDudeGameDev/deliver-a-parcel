// Multiplayer. Leave MULTIPLAYER_URL empty and the game is simply single-player. Other players'
// positions, homes and clothes come from the server. Orders and dogs stay in each browser.
import * as THREE from 'three';
import { toast } from './util.js';
import { MULTIPLAYER_URL } from './config.js';
import { scene, box, textTexture } from './engine.js';
import { VEHICLES } from './data/vehicles.js';
import { HOMES } from './data/homes.js';
import { LOTS, showLotHome } from './world.js';
import { body, player, SKIN, SHIRT, HAT, PANTS } from './player.js';
import { save, saveGame, worth, rating } from './save.js';
import { myLot, showHome, goHome } from './home.js';

const SEND_MS = 100, RETRY_MS = 5000, SHOW_R = 170;
const url = new URLSearchParams(location.search).get('server') || MULTIPLAYER_URL;

const others = new Map();
const net = { online: false, count: 0, others };
let socket = null, myId = null, lastSent = 0, statsSent = '', styleSent = '';

function nameTag(name) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture([name], '#141d2b', '#fff'), transparent: true, opacity: .85, depthTest: false }));
  sprite.scale.set(2.4, 1.2, 1);
  sprite.position.y = 3.9;
  return sprite;
}

function buildRider(p) {
  const g = new THREE.Group();
  const shirt = box(.95, 1, .5, SHIRT, 0, 1.5, 0, g), hat = box(.78, .24, .78, HAT, 0, 2.8, 0, g), head = box(.72, .72, .72, SKIN, 0, 2.38, 0, g);
  const legs = [-.24, .24].map(x => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1, 0);
    box(.42, 1, .45, PANTS, 0, -.5, 0, pivot);
    g.add(pivot);
    return pivot;
  });
  g.add(nameTag(p.name));
  scene.add(g);
  return { group: g, shirt, hat, head, legs, x: p.x, y: p.y, z: p.z, ry: p.ry, phase: 0, rideKey: null, rideGroup: null, data: p, lot: null };
}

function showRide(o, key) {
  if (o.rideKey === key) return;
  o.rideGroup?.removeFromParent();
  o.rideKey = key;
  o.rideGroup = null;
  const v = VEHICLES[key];
  if (!v) return;
  const levels = Object.fromEntries(Object.keys(v.parts).map(k => [k, 0]));
  o.rideGroup = new THREE.Group();
  v.model(o.rideGroup, levels);
  o.rideGroup.position.y = -v.seat(levels);
  o.group.add(o.rideGroup);
}

// Other players' homes appear on their own lots, with their names on the sign.
function showOtherHome(o) {
  const p = o.data, lot = LOTS[p.slot];
  if (!lot || lot === myLot()) return;
  const look = `${p.level}|${p.paint}|${p.name}`;
  if (o.lot === lot && o.look === look) return;
  o.lot = lot;
  o.look = look;
  showLotHome(lot, p.level, p.paint);
  lot.signMaterial.map.dispose();
  lot.signMaterial.map = textTexture([p.name, HOMES[p.level].name], '#fff', '#222');
}

function clearHome(o) {
  if (!o.lot) return;
  showLotHome(o.lot, 0);
  o.lot.signMaterial.map.dispose();
  o.lot.signMaterial.map = textTexture([o.lot.name.toUpperCase(), 'OPEN'], '#fff', '#222');
}

function onWorld(list) {
  net.count = list.length;
  for (const p of list) {
    if (p.id === myId) continue;
    let o = others.get(p.id);
    if (!o) {
      o = buildRider(p);
      others.set(p.id, o);
      toast(`${p.name} joined`);
    }
    o.data = p;
    o.shirt.material.color.setHex(p.shirt ?? SHIRT);
    o.hat.material.color.setHex(p.hat ?? HAT);
    o.head.material.color.setHex(p.skin ?? SKIN);
    for (const leg of o.legs) leg.children[0].material.color.setHex(p.pants ?? PANTS);
    showRide(o, p.ride);
    showOtherHome(o);
  }
}

function drop(id) {
  const o = others.get(id);
  if (!o) return;
  o.group.removeFromParent();
  clearHome(o);
  others.delete(id);
  toast(`${o.data.name} left`);
}

function onMessage(event) {
  const m = JSON.parse(event.data);
  if (m.t === 'welcome') {
    myId = m.id;
    net.online = true;
    // Someone else already has our lot, so we've been moved to a free one.
    if (m.slot !== save.slot) {
      save.slot = m.slot;
      saveGame();
      showHome();
      goHome();
    }
  } else if (m.t === 'w') onWorld(m.players);
  else if (m.t === 'left') drop(m.id);
  else if (m.t === 'full') toast('This world is full, so you are playing solo');
}

function connect() {
  if (!url || !myLot()) return;
  socket = new WebSocket(url);
  socket.onopen = () => {
    socket.send(JSON.stringify({ t: 'join', name: save.name, slot: save.slot }));
    styleSent = statsSent = '';
  };
  socket.onmessage = onMessage;
  socket.onclose = () => {
    net.online = false;
    for (const id of [...others.keys()]) drop(id);
    setTimeout(connect, RETRY_MS);
  };
}

function sendState(now) {
  if (!net.online || socket.readyState !== WebSocket.OPEN || now - lastSent < SEND_MS) return;
  lastSent = now;
  const { x, y, z } = player.pos;
  socket.send(JSON.stringify({ t: 's', x, y, z, ry: body.rotation.y, ride: save.equipped, speed: Math.hypot(player.vx, player.vz) }));
  const { house, shirt, hat, skin, pants } = save.style;
  const style = JSON.stringify({ t: 'style', level: save.homeLevel, paint: house, shirt, hat, skin, pants });
  if (style !== styleSent) socket.send(styleSent = style);
  const stats = JSON.stringify({ t: 'stats', worth: worth(), rating: rating() });
  if (stats !== statsSent) socket.send(statsSent = stats);
}

// Everyone in this world, richest first, for the order board.
function worldBoard() {
  const list = [...others.values()].map(o => ({ name: o.data.name, worth: o.data.worth, rating: o.data.rating, me: false }));
  list.push({ name: save.name, worth: worth(), rating: rating(), me: true });
  return list.sort((a, b) => b.worth - a.worth);
}

// Riders glide between updates, so ten messages a second still looks smooth.
function updateNet(dt, now) {
  sendState(now);
  const k = Math.min(1, 10 * dt);
  for (const o of others.values()) {
    const p = o.data;
    o.x += (p.x - o.x) * k;
    o.y += (p.y - o.y) * k;
    o.z += (p.z - o.z) * k;
    const seat = VEHICLES[p.ride] ? o.rideGroup ? -o.rideGroup.position.y : 0 : 0;
    o.group.position.set(o.x, o.y + seat, o.z);
    o.group.rotation.y = p.ry;
    o.phase += p.speed * dt * 1.7;
    const swing = p.ride ? 0 : Math.sin(o.phase) * .8 * Math.min(1, p.speed / 4);
    o.legs[0].rotation.x = swing;
    o.legs[1].rotation.x = -swing;
    o.group.visible = Math.hypot(player.pos.x - o.x, player.pos.z - o.z) < SHOW_R;
  }
}

export { net, connect, updateNet, worldBoard };
