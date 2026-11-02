// Paint, clothes and garden things. They're all on sale from the start and change only how you
// look. A new colour or garden item is one more row.
import { box } from '../engine.js';

const PAINTS = [
  { name: 'Red', color: 0xe0524d }, { name: 'Orange', color: 0xf0883a }, { name: 'Yellow', color: 0xe8c23c },
  { name: 'Green', color: 0x3fae68 }, { name: 'Teal', color: 0x2fb5a8 }, { name: 'Blue', color: 0x4d8de0 },
  { name: 'Purple', color: 0x8d63d6 }, { name: 'Pink', color: 0xe77fb3 }, { name: 'White', color: 0xf1efe9 },
  { name: 'Black', color: 0x2b2f36 },
];
const PAINT_PRICES = { house: 250, ride: 120, shirt: 60, hat: 40 };

// Each stands in the yard in front of the home. Models face +z, like the home itself.
const DECOR = {
  flowers: {
    name: 'Flower bed', price: 120,
    model(g) {
      box(5, .3, 1.6, 0x6b4a2e, -9, .25, 9, g);
      for (let i = 0; i < 8; i++) box(.4, .55, .4, [0xe0443a, 0xffd23f, 0xe77fb3][i % 3], -11.1 + i * .6, .6, 8.6 + i % 2 * .8, g);
    },
  },
  flag: {
    name: 'Philippine flag', price: 150,
    model(g) {
      box(.2, 7, .2, 0xd6d9de, 12, 3.5, 11, g);
      box(.06, .9, 2.4, 0xd6402b, 12, 5.95, 12.3, g);
      box(.06, .9, 2.4, 0x2f5fc0, 12, 6.85, 12.3, g);
      box(.08, 1.8, .9, 0xf4f1ea, 12, 6.4, 11.5, g);
    },
  },
  gnome: {
    name: 'Garden gnome', price: 200,
    model(g) {
      box(.6, .8, .5, 0x3f7fd6, -5, .55, 12, g);
      box(.45, .4, .45, 0xf0c9a0, -5, 1.15, 12, g);
      box(.5, .6, .5, 0xd6402b, -5, 1.65, 12, g);
    },
  },
  fountain: {
    name: 'Fountain', price: 400,
    model(g) {
      box(3.6, .6, 3.6, 0xbfc3c9, 8, .35, 11, g);
      box(3, .1, 3, 0x3f97d6, 8, .68, 11, g);
      box(.5, 1.6, .5, 0xd6d9de, 8, 1.2, 11, g);
      box(1.2, .25, 1.2, 0xd6d9de, 8, 2, 11, g);
    },
  },
  pet: {
    name: 'Pet dog', price: 350,
    model(g) {
      box(.5, .5, 1.1, 0xb98a56, 4, .65, 12, g);
      box(.48, .45, .48, 0xb98a56, 4, 1, 12.7, g);
      box(.26, .2, .26, 0x333333, 4, .92, 13, g);
      for (const x of [3.8, 4.2]) for (const z of [11.6, 12.4]) box(.14, .42, .14, 0xa87b4a, x, .2, z, g);
    },
  },
  lights: {
    name: 'String lights', price: 180,
    model(g) {
      for (let i = 0; i < 9; i++) box(.22, .22, .22, [0xffd23f, 0xe0443a, 0x4d8de0][i % 3], -14 + i * 3.5, 4 - Math.sin(i * .78) * .5, 13, g);
      for (const x of [-14.5, 14.5]) box(.15, 4.4, .15, 0x4a5058, x, 2.2, 13, g);
    },
  },
};
const DECOR_KEYS = Object.keys(DECOR);

export { PAINTS, PAINT_PRICES, DECOR, DECOR_KEYS };
