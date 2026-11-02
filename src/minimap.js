// The minimap in the upper right.
import { $ } from './util.js';
import { view } from './state.js';
import { walls } from './engine.js';
import { ROADS, EDGE, HUB, HOUSES, LOTS, TREES, SHOPS } from './world.js';
import { body, player } from './player.js';
import { orders, capacity, nearestOrder } from './orders.js';
import { dogs } from './dogs.js';
import { lady } from './ghost.js';
import { dealer } from './contraband.js';
import { cars } from './police.js';
import { myLot } from './home.js';

const mini = $('mini'), mx = mini.getContext('2d');
const MINI_RANGE = 90, MAP_PX = 2; // Metres from centre to rim; pixels per metre in the prerendered map.
const hex = c => '#' + c.toString(16).padStart(6, '0');

// The map only changes when the world does, so it's drawn once and rotated each frame.
const mapLayer = document.createElement('canvas');
function drawMapLayer() {
  mapLayer.width = mapLayer.height = EDGE * 2 * MAP_PX;
  const x = mapLayer.getContext('2d');
  x.scale(MAP_PX, MAP_PX);
  x.translate(EDGE, EDGE);
  x.fillStyle = '#7dc777';
  x.fillRect(-EDGE, -EDGE, EDGE * 2, EDGE * 2);
  x.fillStyle = '#3e8c4a';
  for (const [tx, tz] of TREES) x.fillRect(tx - 1.5, tz - 1.5, 3, 3);
  x.fillStyle = '#5a5f6a';
  for (const [w, d, rx, rz] of ROADS) x.fillRect(rx - w / 2, rz - d / 2, w, d);
  x.fillStyle = '#cfd3da';
  x.beginPath();
  x.arc(0, 0, 15, 0, Math.PI * 2);
  x.fill();
  for (const h of HOUSES) {
    const y = h.yard;
    x.fillStyle = h.mapColor || (h.dog ? '#d9866b' : '#a6dd9f');
    x.fillRect(y.x0, y.z0, y.x1 - y.x0, y.z1 - y.z0);
  }
  x.fillStyle = '#b98a56';
  for (const l of LOTS) x.fillRect(l.x - 6, l.z - 6, 12, 12);
  for (const w of walls) {
    x.fillStyle = hex(w.color);
    x.fillRect(w.x - w.w / 2, w.z - w.d / 2, w.w, w.d);
  }
}
drawMapLayer();

function sizeMini() {
  mini.width = mini.height = Math.round(mini.clientWidth * Math.min(devicePixelRatio, 2));
}
addEventListener('resize', sizeMini);
sizeMini();

function updateMini(now) {
  const size = mini.width, r = size / 2, k = r / MINI_RANGE, p = player.pos;
  const s = Math.sin(view.yaw), c = Math.cos(view.yaw), dot = size / 60;
  // World to screen, turned so the way the camera faces is always up. Markers pin to the rim.
  const toMini = (x, z, pin) => {
    const dx = x - p.x, dz = z - p.z;
    let sx = (dx * c - dz * s) * k, sy = (dx * s + dz * c) * k;
    const d = Math.hypot(sx, sy), max = r - dot * 2.5;
    if (pin && d > max) { sx *= max / d; sy *= max / d; }
    return [r + sx, r + sy];
  };

  mx.save();
  mx.clearRect(0, 0, size, size);
  mx.beginPath();
  mx.arc(r, r, r, 0, Math.PI * 2);
  mx.clip();
  mx.fillStyle = '#3e8c4a';
  mx.fillRect(0, 0, size, size);
  mx.save();
  mx.translate(r, r);
  mx.rotate(view.yaw);
  mx.scale(k, k);
  mx.translate(-p.x, -p.z);
  mx.drawImage(mapLayer, -EDGE, -EDGE, EDGE * 2, EDGE * 2);
  mx.restore();

  const marker = (x, y, radius, fill) => {
    mx.beginPath();
    mx.arc(x, y, radius, 0, Math.PI * 2);
    mx.fillStyle = fill;
    mx.fill();
    mx.strokeStyle = '#fff';
    mx.lineWidth = size / 110;
    mx.stroke();
  };
  for (const d of dogs) marker(...toMini(d.pos.x, d.pos.z), dot * (.4 + d.scale * .4), '#e0352b');
  for (const [s, c] of [[SHOPS.dealer, '#ffa23f'], [SHOPS.mechanic, '#35d8c8']]) marker(...toMini(s.step.x, s.step.z), dot, c);
  if (dealer.visible) marker(...toMini(dealer.position.x, dealer.position.z, true), dot * 1.3, '#b14dff');
  for (const c of cars) marker(...toMini(c.pos.x, c.pos.z, c.mode === 'chase'), dot * .9, c.mode === 'chase' && now % 240 < 120 ? '#e0352b' : '#2f7de0');
  if (lady.active) marker(...toMini(lady.pos.x, lady.pos.z), dot, '#ffffff');
  if (myLot()) marker(...toMini(myLot().x, myLot().z, true), dot * 1.5, '#2f7de0');
  if (orders.length < capacity()) marker(...toMini(HUB.x, HUB.z, true), dot * 1.4, '#35d873');
  const first = nearestOrder();
  for (const o of orders) {
    const t = o.house.step;
    marker(...toMini(t.x, t.z, true), o === first ? dot * (1.6 + Math.sin(now / 160) * .35) : dot * 1.2, '#ffd23f');
  }

  // Player arrow, pointing the way the character faces.
  mx.translate(r, r);
  mx.rotate(Math.PI - body.rotation.y + view.yaw);
  mx.beginPath();
  mx.moveTo(0, -dot * 2.4);
  mx.lineTo(dot * 1.7, dot * 1.8);
  mx.lineTo(0, dot * .8);
  mx.lineTo(-dot * 1.7, dot * 1.8);
  mx.closePath();
  mx.fillStyle = '#2f7de0';
  mx.fill();
  mx.strokeStyle = '#fff';
  mx.lineWidth = size / 90;
  mx.stroke();
  mx.restore();

  // North marker on the rim, so the turning map stays readable.
  const nx = r + s * (r - dot * 2), ny = r - c * (r - dot * 2);
  mx.font = `bold ${dot * 2.2}px system-ui, sans-serif`;
  mx.textAlign = 'center';
  mx.textBaseline = 'middle';
  mx.lineWidth = size / 90;
  mx.strokeStyle = 'rgba(0,0,0,.65)';
  mx.strokeText('N', nx, ny);
  mx.fillStyle = '#fff';
  mx.fillText('N', nx, ny);
}

export { updateMini };
