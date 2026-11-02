// What you can ride: prices, stats, upgrade parts and models.
import * as THREE from 'three';
import { isTouch } from '../util.js';
import { box } from '../engine.js';

function wheel(r, w, z, g, x = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 14).rotateZ(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  m.position.set(x, r, z);
  m.castShadow = !isTouch;
  m.userData.r = r;
  // A spoke, or a spinning black cylinder would look exactly like a still one.
  box(w + .03, r * 1.7, .07, 0x9aa0a8, 0, 0, 0, m);
  g.add(m);
  (g.userData.wheels ??= []).push(m);
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
// upgrade, one price per level, and what every level adds to speed, accel or carry. seat lifts the
// rider's feet off the ground so their hips land on the saddle, and pose picks their animation.
const VEHICLES = {
  rollerblades: {
    name: 'Roller blades', price: 300, speed: 7.8, accel: 8, pose: 'blades',
    seat: lv => .2 + lv.wheels * .05,
    parts: {
      wheels: { name: 'Faster wheels', prices: [80, 200], speed: .8 },
      laces: { name: 'Tighter laces', prices: [120], accel: 3 },
      pack: { name: 'Backpack', prices: [220], carry: 1 },
    },
    model(g, lv, paint = 0x4d8de0) {
      const skates = [-.24, .24].map(x => {
        const skate = new THREE.Group();
        skate.position.x = x;
        box(.44, .16, .78, paint, 0, .14 + lv.wheels * .05, 0, skate);
        box(.12, .1, .7, 0x222222, 0, .05, 0, skate);
        g.add(skate);
        return skate;
      });
      g.userData.skates = skates;
      if (lv.pack) box(.8, .9, .36, paint, 0, 1.85, -.42, g);
    },
  },
  skateboard: {
    name: 'Skateboard', price: 900, speed: 9.5, accel: 6, pose: 'board',
    seat: lv => .3 + lv.wheels * .1,
    parts: {
      wheels: { name: 'Bigger wheels', prices: [100, 250, 500], speed: 1 },
      deck: { name: 'Bigger deck', prices: [180, 450], accel: 2 },
      crate: { name: 'Milk crate', prices: [350], carry: 1 },
    },
    model(g, lv, paint = 0xd6402b) {
      const r = .09 + lv.wheels * .05, len = 1.7 + lv.deck * .55, wide = .7 + lv.deck * .16;
      box(wide, .08, len, paint, 0, r * 2 + .06, 0, g);
      for (const z of [-len * .32, len * .32]) {
        for (const x of [-wide * .42, wide * .42]) wheel(r, .16, z, g, x);
      }
      if (lv.crate) box(.6, .5, .6, 0x3f7fd6, 0, r * 2 + .35, -len * .36, g);
    },
  },
  bicycle: {
    name: 'Bicycle', price: 2500, speed: 12.5, accel: 5, pose: 'pedal',
    seat: lv => .1 + lv.tires * .16,
    parts: {
      tires: { name: 'Bigger tires', prices: [250, 600, 1100], speed: 1 },
      basket: { name: 'Front basket', prices: [450], carry: 1 },
      sidecar: { name: 'Sidecar', prices: [900], carry: 2 },
    },
    model(g, lv, paint = 0x2fae57) {
      const r = .48 + lv.tires * .08, lift = lv.tires * .16;
      for (const z of [-.85, .85]) wheel(r, .1 + lv.tires * .05, z, g);
      box(.12, .12, 1.6, paint, 0, .9 + lift, 0, g);
      box(.1, .6, .1, paint, 0, 1.15 + lift, .7, g);
      box(.95, .1, .1, 0x222222, 0, 1.45 + lift, .7, g);
      box(.34, .1, .5, 0x222222, 0, 1.02 + lift, -.35, g);
      if (lv.basket) box(.65, .35, .5, 0x8a6a3a, 0, 1.25 + lift, 1.05, g);
      if (lv.sidecar) sidecar(g);
    },
  },
  moped: {
    name: 'Moped', price: 7000, speed: 17, accel: 3.5, pose: 'motor',
    seat: lv => .05 + lv.tires * .12,
    parts: {
      engine: { name: 'Bigger engine', prices: [700, 1500, 2800], speed: 1.5 },
      tires: { name: 'Wider tires', prices: [600, 1200], accel: 1 },
      topBox: { name: 'Top box', prices: [1100], carry: 1 },
      sidecar: { name: 'Sidecar', prices: [2000], carry: 2 },
    },
    model(g, lv, paint = 0xe0443a) {
      const r = .38 + lv.tires * .06, lift = lv.tires * .12;
      for (const z of [-.8, .85]) wheel(r, .24 + lv.tires * .08, z, g);
      box(.6, .4, 1.7, paint, 0, .62 + lift, 0, g);
      box(.62, .95, .16, paint, 0, 1.05 + lift, .72, g);
      box(.95, .1, .1, 0x222222, 0, 1.55 + lift, .68, g);
      box(.52, .2, .9, 0x222222, 0, .93 + lift, -.2, g);
      for (let i = 0; i < lv.engine; i++) box(.14, .14, .8, 0xb8bec6, .34 - i * .34, .32 + lift, -.75, g);
      if (lv.topBox) box(.75, .6, .6, 0xffd23f, 0, 1.3 + lift, -.8, g);
      if (lv.sidecar) sidecar(g);
    },
  },
  motorcycle: {
    name: 'Motorcycle', price: 12000, speed: 20, accel: 4, pose: 'motor',
    seat: () => .12,
    parts: {
      engine: { name: 'Racing engine', prices: [2000, 3500], speed: 1.5 },
      bags: { name: 'Saddlebags', prices: [1800], carry: 1 },
    },
    model(g, lv, paint = 0x2b2f36) {
      for (const z of [-.95, 1.05]) wheel(.46, .3, z, g);
      box(.55, .5, 1.5, paint, 0, .85, .1, g);
      box(.5, .35, .7, paint, 0, 1.2, .35, g);
      box(.46, .16, .85, 0x151515, 0, 1.08, -.45, g);
      box(1, .1, .1, 0x222222, 0, 1.55, .75, g);
      box(.12, .7, .12, 0xb8bec6, 0, 1.15, .85, g);
      for (const s of [-1, 1]) {
        box(.14, .14, .9, 0xb8bec6, s * .36, .45, -.5, g);
        if (lv.bags) box(.26, .5, .7, 0x5a4636, s * .44, .85, -.55, g);
      }
    },
  },
  tricycle: {
    name: 'Tricycle', price: 18000, speed: 17.5, accel: 3, carry: 3, pose: 'motor',
    seat: () => .05,
    parts: {
      engine: { name: 'Stronger engine', prices: [2500], speed: 1.5 },
      rack: { name: 'Roof rack', prices: [2200], carry: 1 },
    },
    model(g, lv, paint = 0x2fb5a8) {
      for (const [x, z] of [[0, -.8], [0, .85], [1.3, 0]]) wheel(.36, .24, z, g, x);
      box(.6, .4, 1.7, paint, 0, .62, 0, g);
      box(.62, .95, .16, paint, 0, 1.05, .72, g);
      box(.95, .1, .1, 0x222222, 0, 1.55, .68, g);
      box(.52, .2, .9, 0x222222, 0, .93, -.2, g);
      box(1.4, .9, 1.9, paint, 1.3, 1.05, 0, g);
      box(1.55, .14, 2.2, 0xf1efe9, 1.3, 2.25, 0, g);
      for (const [x, z] of [[.68, -.95], [.68, .95], [1.92, -.95], [1.92, .95]]) box(.08, .8, .08, 0x333333, x, 1.85, z, g);
      if (lv.rack) box(1.1, .4, 1.5, 0xb98a56, 1.3, 2.5, 0, g);
    },
  },
};

const VEHICLE_KEYS = Object.keys(VEHICLES);

export { VEHICLES, VEHICLE_KEYS };
