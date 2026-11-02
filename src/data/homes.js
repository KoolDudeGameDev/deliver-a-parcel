// The house ladder, from cardboard box to mansion.
import * as THREE from 'three';
import { isTouch } from '../util.js';
import { box } from '../engine.js';

function pitchedRoof(w, h, d, color, y, g, x = 0) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4), new THREE.MeshLambertMaterial({ color }));
  m.scale.set(w, h, d);
  m.position.set(x, y + h / 2, 0);
  m.castShadow = !isTouch;
  g.add(m);
}

// Every player starts on the first row. size is half the footprint, before scale. scale sets it
// against the town: a bungalow matches a medium customer house, and a mansion beats a large one.
const HOMES = [
  {
    name: 'Cardboard box', price: 0, bonus: 0, scale: 1.25, size: [2, 1.8],
    model(g, paint = 0xb98a56) {
      box(3.6, 2.6, 3.2, paint, 0, 1.3, 0, g);
      box(3.64, .2, .5, 0xd9c79a, 0, 2.5, 0, g);
      box(3.6, .1, 1.2, 0xa87b4a, 0, 2.75, 1.85, g).rotation.x = -.5;
      box(1.3, 1.7, .06, 0x3a2a1c, 0, .85, 1.62, g);
    },
  },
  {
    name: 'Wooden shack', price: 400, bonus: .03, scale: 1.45, size: [3.2, 2.7],
    model(g, paint = 0x9a7350) {
      box(6, 3.2, 5, paint, 0, 1.6, 0, g);
      box(6.9, .3, 5.9, 0x8f9aa6, 0, 3.35, 0, g);
      box(1.3, 2.2, .08, 0x4a3323, -1, 1.1, 2.52, g);
      box(1.4, 1, .08, 0x7fa6c9, 1.5, 1.8, 2.52, g);
    },
  },
  {
    name: 'Bungalow', price: 1500, bonus: .06, scale: 1.7, size: [4.2, 3.4],
    model(g, paint = 0xe8dcc4) {
      box(8, 3.6, 6.5, paint, 0, 1.8, 0, g);
      pitchedRoof(9.4, 3, 7.9, 0x8a4b38, 3.6, g);
      box(1.5, 2.5, .08, 0x5a3a28, 0, 1.25, 3.27, g);
      for (const x of [-2.5, 2.5]) box(1.6, 1.2, .08, 0x7fa6c9, x, 2, 3.27, g);
    },
  },
  {
    name: 'Two-storey house', price: 4000, bonus: .09, scale: 1.55, size: [7.5, 4],
    model(g, paint = 0xd8e0ea) {
      box(10, 6.6, 7.5, paint, -2, 3.3, 0, g);
      pitchedRoof(11.4, 3.2, 8.9, 0x56606e, 6.6, g, -2);
      box(1.6, 2.6, .08, 0x5a3a28, -2, 1.3, 3.77, g);
      for (const x of [-5, 1]) {
        for (const y of [2, 5]) box(1.7, 1.3, .08, 0x7fa6c9, x, y, 3.77, g);
      }
      box(1.7, 1.3, .08, 0x7fa6c9, -2, 5, 3.77, g);
      box(5, 3.6, 7, paint, 5.5, 1.8, 0, g);
      box(5.6, .3, 7.6, 0x56606e, 5.5, 3.75, 0, g);
      box(4, 2.8, .08, 0x6a6f78, 5.5, 1.4, 3.52, g);
    },
  },
  {
    name: 'Mansion', price: 9000, bonus: .12, scale: 1.5, size: [11, 4.2],
    model(g, paint = 0xf4efe4) {
      box(10, 8, 8, paint, 0, 4, 0, g);
      pitchedRoof(11.6, 3.4, 9.6, 0x2f3b52, 8, g);
      for (const s of [-1, 1]) {
        box(6, 5, 7.4, paint, s * 8, 2.5, 0, g);
        pitchedRoof(7.4, 2.4, 8.6, 0x2f3b52, 5, g, s * 8);
        for (const x of [-1.6, 1.6]) box(1.6, 1.6, .08, 0x7fa6c9, s * 8 + x, 2.8, 3.74, g);
      }
      for (const x of [-3.6, -1.2, 1.2, 3.6]) box(.5, 6.4, .5, 0xffffff, x, 3.2, 4.3, g);
      box(8.6, .5, 1.6, 0xffffff, 0, 6.5, 3.9, g);
      box(2, 3, .08, 0x6b3e2e, 0, 1.5, 4.04, g);
      box(1.4, .14, .14, 0xffd23f, 0, 7.1, 4.08, g);
    },
  },
];

export { HOMES };
