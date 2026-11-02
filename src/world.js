// The map: roads, houses, home sites, trees and decoration, then baked into a few draw calls.
import * as THREE from 'three';
import { isTouch } from './util.js';
import { scene, colliders, solids, blocks, walls, roofs, bulbs, block, instanced, canvasTexture, speckle, addCollider, sign } from './engine.js';
import { HOMES } from './data/homes.js';

{
  const t = canvasTexture(128, 128, x => {
    x.fillStyle = '#6fc46a'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#68bb63'; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64);
    speckle(x, 128, 128, 500, ['#5fae5a', '#7ad075', '#74c96f']);
  });
  t.repeat.set(70, 70);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshLambertMaterial({ map: t }));
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = !isTouch;
  scene.add(g);
}

const PATH = 0xd9c79a, RING = 36, OUTER = 118, ROAD_W = 9;
// [width, depth, x, z], shared by the 3D roads and the minimap.
const ROADS = [
  [RING * 2 + ROAD_W, ROAD_W, 0, -RING],
  [RING * 2 + ROAD_W, ROAD_W, 0, RING],
  [ROAD_W, RING * 2 + ROAD_W, -RING, 0],
  [ROAD_W, RING * 2 + ROAD_W, RING, 0],
  [OUTER * 2 + ROAD_W, ROAD_W, 0, -OUTER],
  [OUTER * 2 + ROAD_W, ROAD_W, 0, OUTER],
  [ROAD_W, OUTER * 2 + ROAD_W, -OUTER, 0],
  [ROAD_W, OUTER * 2 + ROAD_W, OUTER, 0],
  [ROAD_W, OUTER * 2, 0, 0],
  [OUTER * 2, ROAD_W, 0, 0],
];
{
  const pos = [], uv = [], normal = [], index = [];
  for (const [w, d, x, z] of ROADS) {
    block(w + 3, .06, d + 3, 0xbfc3c9, x, .03, z);
    // One stretched quad per road. The texture runs along v, so it's turned for east-west roads,
    // which also sit a touch lower so crossings don't flicker.
    const eastWest = w > d, y = eastWest ? .08 : .11, n = pos.length / 3, len = Math.max(w, d) / ROAD_W;
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
    pos.push(x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1);
    uv.push(...(eastWest ? [0, 0, 0, len, 1, len, 1, 0] : [0, 0, 1, 0, 1, len, 0, len]));
    normal.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    index.push(n, n + 2, n + 1, n, n + 3, n + 2);
  }
  // Patches over the junctions, from a line-free part of the texture, so lane lines stop at them.
  const h = ROAD_W / 2 + 1, y = .13;
  for (const ring of [RING, OUTER]) {
    for (const s of [-1, 1]) {
      for (const [x, z] of [[0, s * ring], [s * ring, 0], [ring, s * ring], [-ring, s * ring]]) {
        const n = pos.length / 3;
        pos.push(x - h, y, z - h, x + h, y, z - h, x + h, y, z + h, x - h, y, z + h);
        uv.push(.12, 0, .42, 0, .42, .3, .12, .3);
        normal.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
        index.push(n, n + 2, n + 1, n, n + 3, n + 2);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
  g.setIndex(index);
  const t = canvasTexture(256, 256, x => {
    x.fillStyle = '#464a53'; x.fillRect(0, 0, 256, 256);
    speckle(x, 256, 256, 2500, ['#3e424b', '#50545e', '#585c66']);
    x.fillStyle = '#f2f2ee';
    x.fillRect(8, 0, 5, 256); x.fillRect(243, 0, 5, 256);
    x.fillStyle = '#ffd23f';
    x.fillRect(124, 0, 8, 128);
  });
  const roads = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: t }));
  roads.receiveShadow = !isTouch;
  scene.add(roads);
}

// World edge is a hedge you can see, plus a hard clamp in movePlayer.
const EDGE = 170;
for (const s of [-1, 1]) {
  block(EDGE * 2 + 4, 4, 2, 0x3e8c4a, 0, 2, s * (EDGE + 1));
  block(2, 4, EDGE * 2 + 4, 0x3e8c4a, s * (EDGE + 1), 2, 0);
}

const HUB = new THREE.Vector3(0, 0, 3), HUB_R = 4.5;
{
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, .1, 32), new THREE.MeshLambertMaterial({ color: 0xcfd3da }));
  plaza.position.y = .1;
  plaza.receiveShadow = !isTouch;
  scene.add(plaza);
  walls.push({ w: 14, h: 6, d: 7, color: 0xff7a45, x: 0, y: 3, z: -9 });
  block(15, .5, 3, 0xffffff, 0, 4.2, -4.8);
  addCollider(0, -9, 7, 3.5);
  sign(['ORDERS'], '#fff', '#d6402b', 8, 2, 0, 5.3, -5.4, 0);
}
const hubRing = new THREE.Mesh(new THREE.RingGeometry(HUB_R - .5, HUB_R, 40),
  new THREE.MeshBasicMaterial({ color: 0x4dff88, side: THREE.DoubleSide, transparent: true, opacity: .8 }));
hubRing.rotation.x = -Math.PI / 2;
hubRing.position.set(HUB.x, .2, HUB.z);
scene.add(hubRing);

const YARD = 13, GATE = 3.5, ROOF_COLORS = [0x8a4b38, 0x56606e, 0x6b3e2e, 0x4e6a58, 0x7c3f3f];
const HOUSES = [
  // Around the inner ring.
  { name: 'Red',    color: 0xe0524d, x: -30,  z: -62,  dx: 0,  dz: 1,  dog: 'chihuahua' },
  { name: 'Blue',   color: 0x4d8de0, x: 30,   z: -62,  dx: 0,  dz: 1,  dog: null },
  { name: 'Yellow', color: 0xe8c23c, x: 62,   z: -30,  dx: -1, dz: 0,  dog: 'beagle' },
  { name: 'Orange', color: 0xf0883a, x: 62,   z: 30,   dx: -1, dz: 0,  dog: null },
  { name: 'Green',  color: 0x3fae68, x: 30,   z: 62,   dx: 0,  dz: -1, dog: null },
  { name: 'Pink',   color: 0xe77fb3, x: -30,  z: 62,   dx: 0,  dz: -1, dog: 'shihTzu' },
  { name: 'Purple', color: 0x8d63d6, x: -62,  z: 30,   dx: 1,  dz: 0,  dog: null },
  { name: 'Teal',   color: 0x2fb5a8, x: -62,  z: -30,  dx: 1,  dz: 0,  dog: 'pomeranian' },
  // Just inside the outer ring, gates facing it.
  { name: 'Coral',  color: 0xf0776a, x: -30,  z: -96,  dx: 0,  dz: -1, dog: null },
  { name: 'Lime',   color: 0x9ccc3c, x: 96,   z: -30,  dx: 1,  dz: 0,  dog: 'germanShepherd' },
  { name: 'Navy',   color: 0x3a5a9a, x: 30,   z: 96,   dx: 0,  dz: 1,  dog: 'aspin' },
  { name: 'Peach',  color: 0xf4b183, x: -96,  z: 30,   dx: -1, dz: 0,  dog: null },
  // Outside the outer ring.
  { name: 'Gold',   color: 0xd6a520, x: 143,  z: -70,  dx: -1, dz: 0,  dog: 'greatDane' },
  { name: 'Mint',   color: 0x7fd8b0, x: 143,  z: 70,   dx: -1, dz: 0,  dog: null },
  { name: 'Rose',   color: 0xd85a7f, x: 70,   z: 143,  dx: 0,  dz: -1, dog: 'dachshund' },
  { name: 'Sky',    color: 0x6cc6ff, x: -70,  z: 143,  dx: 0,  dz: -1, dog: 'husky' },
  { name: 'Lilac',  color: 0xb79ae0, x: -143, z: 70,   dx: 1,  dz: 0,  dog: null },
  { name: 'Brown',  color: 0x9a6a45, x: -143, z: -70,  dx: 1,  dz: 0,  dog: 'saintBernard' },
  { name: 'Indigo', color: 0x5560c8, x: -70,  z: -143, dx: 0,  dz: 1,  dog: 'aspin' },
  { name: 'Cream',  color: 0xeadfba, x: 0,    z: -143, dx: 0,  dz: 1,  dog: null },
  { name: 'Slate',  color: 0x6c7a89, x: 70,   z: -143, dx: 0,  dz: 1,  dog: 'mastiff' },
];

function buildHouse(h) {
  // Local coords: v points from the house towards the road, u runs across the yard.
  const px = h.dz, pz = -h.dx;
  const at = (u, v) => [h.x + h.dx * v + px * u, h.z + h.dz * v + pz * u];
  const face = Math.atan2(h.dx, h.dz);
  h.yard = { x0: h.x - YARD, x1: h.x + YARD, z0: h.z - YARD, z1: h.z + YARD };

  const fence = (u0, v0, u1, v1) => {
    const [ax, az] = at(u0, v0), [bx, bz] = at(u1, v1);
    const w = Math.max(Math.abs(bx - ax), .4), d = Math.max(Math.abs(bz - az), .4);
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    block(w, 2, d, 0xf3efe4, mx, 1, mz);
    addCollider(mx, mz, w / 2, d / 2);
  };
  fence(-YARD, -YARD, YARD, -YARD);
  fence(-YARD, -YARD, -YARD, YARD);
  fence(YARD, -YARD, YARD, YARD);
  fence(-YARD, YARD, -GATE, YARD);
  fence(GATE, YARD, YARD, YARD);

  // Gate arch, so the way in reads from the road.
  for (const s of [-1, 1]) {
    const [x, z] = at(s * GATE, YARD);
    block(.6, 4, .6, h.color, x, 2, z);
  }
  const [gx, gz] = at(0, YARD);
  block(Math.abs(h.dz) * (GATE * 2 + .6) + .6 * Math.abs(h.dx), .5, Math.abs(h.dx) * (GATE * 2 + .6) + .6 * Math.abs(h.dz), h.color, gx, 4, gz);

  // House body, roof, door.
  const [hx, hz] = at(0, -YARD + 6);
  const bw = Math.abs(h.dz) * 14 + Math.abs(h.dx) * 9, bd = Math.abs(h.dx) * 14 + Math.abs(h.dz) * 9;
  walls.push({ w: bw, h: 6, d: bd, color: h.color, x: hx, y: 3, z: hz });
  addCollider(hx, hz, bw / 2, bd / 2);
  roofs.push({ w: bw + 1.4, h: 4, d: bd + 1.4, color: ROOF_COLORS[roofs.length % ROOF_COLORS.length], x: hx, y: 8, z: hz });
  const [dx, dz] = at(0, -YARD + 10.6);
  block(Math.abs(h.dz) * 2 + Math.abs(h.dx) * .3, 3.4, Math.abs(h.dx) * 2 + Math.abs(h.dz) * .3, 0x5a3a28, dx, 1.7, dz);

  const [sx, sz] = at(0, -YARD + 12.2);
  h.step = new THREE.Vector3(sx, 0, sz);
  block(Math.abs(h.dz) * 4 + Math.abs(h.dx) * 2.2, .12, Math.abs(h.dx) * 4 + Math.abs(h.dz) * 2.2, 0xbdb8aa, sx, .08, sz);

  // Path from the road, through the gate, up to the doorstep.
  const [p0x, p0z] = at(0, -YARD + 13), [p1x, p1z] = at(0, YARD + 10);
  block(Math.abs(h.dz) * 5 + Math.abs(p1x - p0x), .06, Math.abs(h.dx) * 5 + Math.abs(p1z - p0z), PATH, (p0x + p1x) / 2, .02, (p0z + p1z) / 2);

  if (h.dog) {
    const [ax, az] = at(5.5, YARD + 1.2);
    block(.25, 2.3, .25, 0x7a5a3c, ax, 1.15, az);
    sign(['BEWARE', 'OF DOG'], '#ffd23f', '#222', 3, 1.5, ax, 2.7, az, face);
  }
}
HOUSES.forEach(buildHouse);

const ringGeometry = new THREE.RingGeometry(2.6, 3.1, 32).rotateX(-Math.PI / 2);
const homeRing = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({
  color: 0x6cc6ff, transparent: true, opacity: .8, side: THREE.DoubleSide, toneMapped: false,
}));
homeRing.visible = false;
scene.add(homeRing);

// Seeded so the map is the same on every visit, and players can learn it.
let seed = 20261102;
const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;

// Spots with something on them, as [x, z, half size], so trees keep off.
const taken = HOUSES.map(h => [h.x, h.z, YARD + 12]);

function addTower(x, z, w, d, floors, color) {
  for (let f = 0; f < floors; f++) walls.push({ w, h: 6, d, color, x, y: 3 + f * 6, z });
  block(w + 1, .6, d + 1, 0x6e7480, x, floors * 6 + .3, z);
  addCollider(x, z, w / 2, d / 2);
  taken.push([x, z, Math.max(w, d) / 2 + 6]);
}
addTower(62, -62, 16, 16, 5, 0xc9ccd4);
addTower(-62, -62, 14, 18, 4, 0xe2c9a8);
addTower(62, 62, 18, 14, 3, 0xa9c4d8);
addTower(-62, 62, 16, 16, 4, 0xd8b4a8);

// Sari-sari stores: one floor, an awning and a sign, facing the outer ring.
for (const [x, z, face] of [[96, 30, 1], [-96, -30, -1]]) {
  addTower(x, z, 9, 14, 1, 0xf2e3c4);
  block(3, .4, 15, 0x2f9e6e, x + face * 6, 3.8, z);
  sign(['SARI-SARI'], '#2f9e6e', '#fff', 7, 1.6, x + face * 4.8, 5, z, Math.PI / 2);
}

// A basketball court and a pond in the open lots between the rings.
{
  const [x, z] = [30, -96];
  block(24, .05, 14, 0xc96f3a, x, .03, z);
  block(21, .06, 11, 0xd98a50, x, .04, z);
  block(.3, .07, 11, 0xffffff, x, .05, z);
  for (const s of [-1, 1]) {
    block(.3, 4, .3, 0x444a55, x + s * 11, 2, z);
    block(.2, 1.3, 2.2, 0xffffff, x + s * 10.6, 3.8, z);
    addCollider(x + s * 11, z, .2, .2);
  }
  taken.push([x, z, 16]);
  block(24, .05, 16, 0x3f97d6, -30, .03, 96);
  block(26, .03, 18, 0xd9c79a, -30, .02, 96);
  taken.push([-30, 96, 16]);
}

// Street lamps along both rings.
for (const ring of [RING, OUTER]) {
  const side = ROAD_W / 2 + .9, step = ring === RING ? 24 : 42;
  for (let a = -ring + 12; a < ring - 6; a += step) {
    if (Math.abs(a) < ROAD_W) continue; // That's a junction with a spoke road.
    for (const s of [-1, 1]) {
      for (const [x, z, ox, oz] of [[a, s * (ring + side), 0, -s], [s * (ring + side), a, -s, 0]]) {
        block(.25, 5.2, .25, 0x4a5058, x, 2.6, z);
        block(ox ? 1.4 : .16, .16, oz ? 1.4 : .16, 0x4a5058, x + ox * .7, 5.2, z + oz * .7);
        bulbs.push({ w: .4, h: .16, d: .4, color: 0xffffff, x: x + ox * 1.3, y: 5.05, z: z + oz * 1.3 });
      }
    }
  }
}

const onRoad = (x, z, margin) => ROADS.some(([w, d, rx, rz]) => Math.abs(x - rx) < w / 2 + margin && Math.abs(z - rz) < d / 2 + margin);
const isTaken = (x, z, margin) => taken.some(([tx, tz, r]) => Math.abs(x - tx) < r + margin && Math.abs(z - tz) < r + margin);

// Seven home sites scattered across the map, one per player, each facing the middle of it.
const LOTS = [];
for (let i = 0; i < 20000 && LOTS.length < 7; i++) {
  const x = Math.round((rnd() - .5) * (EDGE * 2 - 32)), z = Math.round((rnd() - .5) * (EDGE * 2 - 32));
  if (isTaken(x, z, 6) || onRoad(x, z, 15) || LOTS.some(l => Math.hypot(l.x - x, l.z - z) < 60)) continue;
  const dx = Math.abs(x) > Math.abs(z) ? -Math.sign(x) : 0, dz = dx ? 0 : -Math.sign(z);
  const l = { name: `Home ${LOTS.length + 1}`, x, z, dx, dz, step: new THREE.Vector3(x + dx * 8, 0, z + dz * 8) };
  block(dx ? 18 : 24, .05, dx ? 24 : 18, 0xb9a27a, x, .03, z);
  taken.push([x, z, 14]);
  l.collider = { x0: x, x1: x, z0: z, z1: z };
  colliders.push(l.collider);
  l.group = new THREE.Group();
  l.group.position.set(x, 0, z);
  l.group.rotation.y = Math.atan2(dx, dz);
  scene.add(l.group);
  const sx = x + dx * 7 + dz * 5.5, sz = z + dz * 7 - dx * 5.5;
  block(.25, 2.4, .25, 0x7a5a3c, sx, 1.2, sz);
  l.signMaterial = sign([l.name.toUpperCase(), 'OPEN'], '#fff', '#222', 3.2, 1.6, sx, 3.2, sz, Math.atan2(dx, dz));
  LOTS.push(l);
}

function showLotHome(l, level) {
  const home = HOMES[level], [w, d] = l.dx ? [...home.size].reverse() : home.size;
  l.group.clear();
  home.model(l.group);
  Object.assign(l.collider, { x0: l.x - w, x1: l.x + w, z0: l.z - d, z1: l.z + d });
}
LOTS.forEach(l => showLotHome(l, 0));

// Undas candles on the graves, lit after dark.
const candles = [];
function candle(x, y, z) {
  block(.12, .3, .12, 0xfff4d8, x, y + .15, z);
  candles.push({ x, y: y + .4, z });
}

// The cemetery: a walled Filipino graveyard on the outer ring, with painted tombs on the ground
// and apartment tombs stacked like cabinets. Parcels go to one grave near the far wall.
// Built after the home sites and without rnd(), so it can't move anyone's home.
{
  const x0 = 68, x1 = 108, z0 = 70, z1 = 106, x = (x0 + x1) / 2, z = (z0 + z1) / 2;
  const STONE = 0x8b8f96, IRON = 0x2b2f36, GATE_GAP = 3.5, side = (z1 - z0) / 2 - GATE_GAP;
  const wall = (cx, cz, w, d) => {
    block(w, 1.6, d, STONE, cx, .8, cz);
    addCollider(cx, cz, w / 2, d / 2);
  };
  block(x1 - x0, .04, z1 - z0, 0x6f8a62, x, .03, z);
  wall(x, z0, x1 - x0 + .6, .6);
  wall(x, z1, x1 - x0 + .6, .6);
  wall(x0, z, .6, z1 - z0);
  wall(x1, z0 + side / 2, .6, side);
  wall(x1, z1 - side / 2, .6, side);

  // Gate, and paths from the road along the middle aisle and up the west side.
  for (const s of [-1, 1]) block(.9, 3.4, .9, STONE, x1, 1.7, z + s * GATE_GAP);
  block(.7, .5, GATE_GAP * 2 + .9, IRON, x1, 3.6, z);
  sign(['CEMETERY'], '#2b2f36', '#e8e4d8', 6, 1.5, x1, 4.7, z, Math.PI / 2);
  block(40.5, .04, 3.6, PATH, 92.75, .05, z);
  block(3.6, .04, 11, PATH, 74.5, .05, 82.5);

  // Apartment tombs: rows of niches stacked four high. (ax, az) is the middle of the front face,
  // (ux, uz) runs along it, and (nx, nz) points out of it.
  const CELL = 1.5, CELL_H = 1.15, ROWS = 4, DEPTH = 2.4;
  const PLATES = [0xf4f1ea, 0xe6e1d6, 0xd5dde2, 0xeadcd6];
  const FLOWERS = [0xe0443a, 0xffd23f, 0xe77fb3, 0xffffff];
  const apartments = (ax, az, ux, uz, nx, nz, cells) => {
    const len = cells * CELL, bx = ax - nx * DEPTH / 2, bz = az - nz * DEPTH / 2, h = ROWS * CELL_H + .2;
    block(ux ? len : DEPTH, h, uz ? len : DEPTH, 0xdcd8cc, bx, h / 2, bz);
    block(ux ? len + .6 : DEPTH + .5, .25, uz ? len + .6 : DEPTH + .5, 0x9fc6d9, bx, h + .12, bz);
    addCollider(bx, bz, (ux ? len : DEPTH) / 2, (uz ? len : DEPTH) / 2);
    for (let c = 0; c < cells; c++) {
      const offset = (c - (cells - 1) / 2) * CELL, px = ax + ux * offset, pz = az + uz * offset;
      for (let r = 0; r < ROWS; r++) {
        const y = .2 + (r + .5) * CELL_H, pick = (c * 5 + r * 3) % 7;
        // A few niches are still empty, so they stay dark.
        const color = pick === 6 ? 0x3a3f48 : PLATES[pick % PLATES.length];
        block(ux ? CELL - .14 : .08, CELL_H - .14, uz ? CELL - .14 : .08, color, px + nx * .04, y, pz + nz * .04);
        if (pick === 2 || pick === 4) {
          block(.3, .22, .3, 0xb7b2a6, px + nx * .18, y - .42, pz + nz * .18);
          block(.34, .3, .34, FLOWERS[(c + r) % FLOWERS.length], px + nx * .18, y - .18, pz + nz * .18);
        }
        if (pick === 1 && r === 0) candle(px + nx * .3, .02, pz + nz * .3);
      }
    }
  };
  apartments(71.4, 88, 0, 1, 1, 0, 18);
  apartments(89, 73.4, 1, 0, 0, 1, 20);
  apartments(89, 102.6, 1, 0, 0, -1, 20);

  // Tombs on the ground, painted in the usual pale colours, in three styles.
  const PAINT = [0xf1efe9, 0xbcdff0, 0xf4c6d0, 0xc7e8c5, 0xe9e3b8];
  const cross = (tx, y, tz) => {
    block(.2, 1.4, .2, 0xffffff, tx, y + .7, tz);
    block(.8, .2, .2, 0xffffff, tx, y + .95, tz);
  };
  let n = 0;
  for (const tz of [77.5, 82, 94, 98.5]) {
    for (let tx = 79; tx <= 104; tx += 4.5) {
      const style = n % 3, c = PAINT[n % PAINT.length];
      n++;
      block(1.7, .7, 2.6, c, tx, .35, tz);
      if (style === 0) {
        block(1.9, .12, 2.8, 0xe6e1d6, tx, .76, tz);
        cross(tx, .8, tz - 1.1);
        candle(tx - .4, .82, tz + .9);
        candle(tx + .4, .82, tz + .9);
      } else if (style === 1) {
        // A small family tomb with its own roof.
        block(1.7, 1.3, 2.6, c, tx, 1.35, tz);
        block(2.2, .22, 3.1, 0x9fc6d9, tx, 2.1, tz);
        cross(tx, 2.2, tz);
        candle(tx, .02, tz + 1.55);
      } else {
        // Two tombs stacked on the same plot.
        block(1.7, .7, 2.6, PAINT[(n + 2) % PAINT.length], tx, 1.08, tz);
        cross(tx, 1.43, tz - 1.1);
        candle(tx, 1.43, tz + .8);
      }
      addCollider(tx, tz, .95, 1.4);
    }
  }

  // The parcel goes to this grave, beside the west wall.
  block(1.7, .7, 2.6, 0xbcdff0, 74.5, .35, 75.5);
  block(1.9, .12, 2.8, 0xe6e1d6, 74.5, .76, 75.5);
  cross(74.5, .8, 74.4);
  block(.4, .3, .4, FLOWERS[0], 74.5, .96, 76.3);
  candle(74, .82, 76.6);
  candle(75, .82, 76.6);
  addCollider(74.5, 75.5, .95, 1.4);

  for (const [tx, tz] of [[106, 104], [106, 72], [76, 97]]) {
    block(.7, 5, .7, 0x4a3a2c, tx, 2.5, tz);
    block(2.6, .3, .3, 0x4a3a2c, tx, 3.6, tz);
    block(.3, .3, 2.2, 0x4a3a2c, tx, 4.4, tz);
    addCollider(tx, tz, .5, .5);
  }

  taken.push([x, z, 22]);
  HOUSES.push({
    name: 'Cemetery', place: 'the cemetery', x, z, dx: -1, dz: 0, dog: null, mapColor: '#8fa08a',
    yard: { x0, x1, z0, z1 }, step: new THREE.Vector3(74.5, 0, 78.6),
    parcelOnly: true, weight: 3, extraTime: 10,
  });
}

const TREE_LEAVES = [0x3f9b52, 0x358a48, 0x4caf5f, 0x2f7f45];
const TREES = [];
function addTree(x, z) {
  const s = .85 + rnd() * .6, leaves = TREE_LEAVES[Math.floor(rnd() * TREE_LEAVES.length)];
  block(1, 3 * s, 1, 0x7a5a3c, x, 1.5 * s, z);
  block(4.4 * s, 3 * s, 4.4 * s, leaves, x, 4 * s, z);
  block(2.8 * s, 2 * s, 2.8 * s, leaves, x, 6.2 * s, z);
  addCollider(x, z, .7, .7);
  TREES.push([x, z]);
}
{
  let placed = 0;
  for (let i = 0; i < 1500 && placed < 110; i++) {
    const x = (rnd() - .5) * (EDGE * 2 - 8), z = (rnd() - .5) * (EDGE * 2 - 8);
    if (isTaken(x, z, 0) || onRoad(x, z, 6) || Math.hypot(x, z) < 18) continue;
    addTree(x, z);
    placed++;
  }
}

// Blocky clouds, slowly drifting.
const clouds = [];
for (let i = 0; i < 14; i++) {
  const x = (rnd() - .5) * 640, z = (rnd() - .5) * 640, y = 75 + rnd() * 25, n = 2 + Math.floor(rnd() * 3);
  for (let j = 0; j < n; j++) {
    clouds.push({ w: 18 + rnd() * 16, h: 5 + rnd() * 3, d: 12 + rnd() * 10, color: 0xffffff, x: x + j * 12, y: y + j % 2 * 3, z: z + j * 5 });
  }
}

// Bake everything static.
const wallMaterial = new THREE.MeshLambertMaterial({
  emissive: 0xffc97a, emissiveIntensity: 0,
  map: canvasTexture(256, 128, x => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 128);
    x.fillStyle = '#e4e4e4';
    for (let y = 8; y < 120; y += 14) x.fillRect(0, y, 256, 2);
    x.fillStyle = '#b5b5b5'; x.fillRect(0, 118, 256, 10);
    for (const wx of [18, 70, 150, 202]) {
      x.fillStyle = '#f7f7f7'; x.fillRect(wx - 4, 30, 44, 60);
      x.fillStyle = '#7fa6c9'; x.fillRect(wx, 34, 36, 52);
      x.fillStyle = '#f7f7f7'; x.fillRect(wx + 16, 34, 4, 52);
    }
  }),
  emissiveMap: canvasTexture(256, 128, x => {
    x.fillStyle = '#000'; x.fillRect(0, 0, 256, 128);
    x.fillStyle = '#fff';
    for (const wx of [18, 70, 150, 202]) x.fillRect(wx, 34, 36, 52);
  }),
});
solids.push(instanced(walls, new THREE.BoxGeometry(1, 1, 1), wallMaterial));
instanced(roofs, new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4), new THREE.MeshLambertMaterial());
instanced(blocks, new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial());

const bulbMaterial = new THREE.MeshBasicMaterial({ fog: false });
instanced(bulbs, new THREE.BoxGeometry(1, 1, 1), bulbMaterial, false);

const cloudMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: .92, fog: false });
const cloudMesh = instanced(clouds, new THREE.BoxGeometry(1, 1, 1), cloudMaterial, false);

// Night lighting is faked with soft sprites and ground pools: real lamps would cost far too much.
const glowTexture = canvasTexture(64, 64, x => {
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,225,170,1)');
  g.addColorStop(1, 'rgba(255,225,170,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
});
const glowMaterial = new THREE.PointsMaterial({
  map: glowTexture, size: 5, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, fog: false,
});
const lampGlow = new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(bulbs.flatMap(b => [b.x, b.y, b.z]), 3)),
  glowMaterial);
const poolMaterial = new THREE.MeshBasicMaterial({
  map: glowTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, fog: false,
});
const lampPools = instanced(bulbs.map(b => ({ w: 13, h: 1, d: 13, color: 0xffffff, x: b.x, y: .16, z: b.z })),
  new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), poolMaterial, false);
scene.add(lampGlow);
const candleMaterial = new THREE.PointsMaterial({
  map: glowTexture, size: 1.7, color: 0xffb65c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, fog: false,
});
const candleGlow = new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(candles.flatMap(c => [c.x, c.y, c.z]), 3)),
  candleMaterial);
scene.add(candleGlow);

export { ROADS, RING, OUTER, ROAD_W, EDGE, HUB, HUB_R, hubRing, HOUSES, YARD, LOTS, showLotHome, homeRing, TREES, wallMaterial, bulbMaterial, cloudMaterial, cloudMesh, glowMaterial, poolMaterial, lampGlow, lampPools, candleMaterial, candleGlow };
