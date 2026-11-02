// What you can ride: prices, stats, upgrade parts and models.
import * as THREE from 'three';
import { isTouch } from '../util.js';
import { box } from '../engine.js';

function wheel(r, w, z, g, x = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 14).rotateZ(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  m.position.set(x, r, z);
  m.castShadow = !isTouch;
  g.add(m);
}

function sidecar(g) {
  box(.95, .5, 1.6, 0xd6402b, 1.25, .62, -.05, g);
  box(.95, .32, .5, 0xf2f2ee, 1.25, .98, .45, g);
  box(.6, .4, .6, 0xb98a56, 1.25, 1.05, -.3, g);
  box(1, .08, .08, 0x333333, .7, .5, .4, g);
  box(1, .08, .08, 0x333333, .7, .5, -.5, g);
  wheel(.32, .16, 0, g, 1.25);
}

// Bought in this order. A new vehicle is one more row here. Each part is levels of the same
// upgrade, one price per level, and what every level adds to speed, accel or carry.
const VEHICLES = {
  skateboard: {
    name: 'Skateboard', price: 150, speed: 9, accel: 6,
    seat: lv => .3 + lv.wheels * .1,
    parts: {
      wheels: { name: 'Bigger wheels', prices: [60, 160, 360], speed: 1 },
      deck: { name: 'Bigger deck', prices: [120, 320], accel: 2 },
      crate: { name: 'Milk crate', prices: [260], carry: 1 },
    },
    model(g, lv) {
      const r = .09 + lv.wheels * .05, len = 1.7 + lv.deck * .55, wide = .7 + lv.deck * .16;
      box(wide, .08, len, 0xd6402b, 0, r * 2 + .06, 0, g);
      for (const z of [-len * .32, len * .32]) {
        for (const x of [-wide * .42, wide * .42]) wheel(r, .16, z, g, x);
      }
      if (lv.crate) box(.6, .5, .6, 0x3f7fd6, 0, r * 2 + .35, -len * .36, g);
    },
  },
  bicycle: {
    name: 'Bicycle', price: 500, speed: 12, accel: 5,
    seat: lv => .8 + lv.tires * .16,
    parts: {
      tires: { name: 'Bigger tires', prices: [150, 400, 800], speed: 1 },
      basket: { name: 'Front basket', prices: [300], carry: 1 },
      sidecar: { name: 'Sidecar', prices: [700], carry: 2 },
    },
    model(g, lv) {
      const r = .48 + lv.tires * .08, lift = lv.tires * .16;
      for (const z of [-.85, .85]) wheel(r, .1 + lv.tires * .05, z, g);
      box(.12, .12, 1.6, 0x2fae57, 0, .9 + lift, 0, g);
      box(.1, .6, .1, 0x2fae57, 0, 1.15 + lift, .7, g);
      box(.95, .1, .1, 0x222222, 0, 1.45 + lift, .7, g);
      box(.34, .1, .5, 0x222222, 0, 1.02 + lift, -.35, g);
      if (lv.basket) box(.65, .35, .5, 0x8a6a3a, 0, 1.25 + lift, 1.05, g);
      if (lv.sidecar) sidecar(g);
    },
  },
  moped: {
    name: 'Moped', price: 1500, speed: 17, accel: 3.5,
    seat: lv => .75 + lv.tires * .12,
    parts: {
      engine: { name: 'Bigger engine', prices: [500, 1100, 2200], speed: 1.5 },
      tires: { name: 'Wider tires', prices: [400, 900], accel: 1 },
      topBox: { name: 'Top box', prices: [800], carry: 1 },
      sidecar: { name: 'Sidecar', prices: [1600], carry: 2 },
    },
    model(g, lv) {
      const r = .38 + lv.tires * .06, lift = lv.tires * .12;
      for (const z of [-.8, .85]) wheel(r, .24 + lv.tires * .08, z, g);
      box(.6, .4, 1.7, 0xe0443a, 0, .62 + lift, 0, g);
      box(.62, .95, .16, 0xe0443a, 0, 1.05 + lift, .72, g);
      box(.95, .1, .1, 0x222222, 0, 1.55 + lift, .68, g);
      box(.52, .2, .9, 0x222222, 0, .93 + lift, -.2, g);
      for (let i = 0; i < lv.engine; i++) box(.14, .14, .8, 0xb8bec6, .34 - i * .34, .32 + lift, -.75, g);
      if (lv.topBox) box(.75, .6, .6, 0xffd23f, 0, 1.3 + lift, -.8, g);
      if (lv.sidecar) sidecar(g);
    },
  },
};

const VEHICLE_KEYS = Object.keys(VEHICLES);

export { VEHICLES, VEHICLE_KEYS };
