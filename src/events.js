// Things that happen to the town: rain, brownouts, and the odd fiesta or Undas.
import * as THREE from 'three';
import { isTouch, toast } from './util.js';
import { weather } from './state.js';
import { RAIN_GRIP, RAIN_PAY, FIESTA_PAY, UNDAS_PAY } from './config.js';
import { scene, camera, box, instanced } from './engine.js';
import { HUB, HOUSES } from './world.js';
import { clock } from './daynight.js';
import { player } from './player.js';

const between = (a, b) => a + Math.random() * (b - a);
const DROPS = isTouch ? 140 : 320, RAIN_BOX = 40, CARE_R = 120;

// Rain falls in a box that travels with the camera, so a few hundred drops look like a downpour.
const drops = new Float32Array(DROPS * 3).map(() => (Math.random() - .5) * RAIN_BOX);
const rainGeometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(drops, 3));
const rain = new THREE.Points(rainGeometry, new THREE.PointsMaterial({ color: 0xbfd8f0, size: .16, transparent: true, opacity: .7, depthWrite: false, fog: false }));
rain.frustumCulled = false;
rain.visible = false;
scene.add(rain);

// Fiesta bunting strung around the plaza.
const flags = [];
for (let i = 0; i < 48; i++) {
  const a = i / 48 * Math.PI * 2, r = 14;
  flags.push({ w: .55, h: .5, d: .1, color: [0xe0443a, 0xffd23f, 0x4d8de0, 0x3fae68][i % 4], x: HUB.x + Math.cos(a) * r, y: 4.6 + Math.sin(i * 1.6) * .2, z: Math.sin(a) * r });
}
const bunting = instanced(flags, new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), false);
bunting.visible = false;

// Undas visitors, standing quietly by the graves with candles.
const cemetery = HOUSES.find(h => h.name === 'Cemetery');
const visitors = new THREE.Group();
for (const [x, z, shirt] of [[81, 80, 0x2b2f36], [90, 84, 0xf1efe9], [99, 96, 0x2b2f36], [84, 92, 0x4d5563]]) {
  box(.9, 1.1, .5, shirt, x, 1.55, z, visitors);
  box(.7, .7, .7, 0xc99a6b, x, 2.45, z, visitors);
  box(.8, 1, .46, 0x2b3a55, x, .5, z, visitors);
}
visitors.visible = false;
scene.add(visitors);

const timers = { rain: between(90, 180), blackout: between(40, 90), festival: between(120, 240) };
let rainLeft = 0, blackoutLeft = 0, festivalLeft = 0;

function updateRain(dt) {
  if (rainLeft > 0) {
    rainLeft -= dt;
    const p = rain.geometry.attributes.position;
    for (let i = 0; i < DROPS; i++) {
      const y = p.getY(i) - 30 * dt;
      p.setY(i, y < -RAIN_BOX / 2 ? RAIN_BOX / 2 : y);
    }
    p.needsUpdate = true;
    rain.position.copy(camera.position);
    if (rainLeft <= 0) {
      weather.rain = rain.visible = false;
      timers.rain = between(150, 300);
    }
  } else if ((timers.rain -= dt) <= 0) {
    rainLeft = between(50, 80);
    weather.rain = rain.visible = true;
    toast('Rain! Slippery roads, but better pay');
  }
}

function updateBlackout(dt) {
  if (blackoutLeft > 0) {
    blackoutLeft -= dt;
    if (blackoutLeft <= 0) {
      weather.blackout = false;
      toast('Power is back');
      timers.blackout = between(60, 140);
    }
  } else if (clock.night > .5 && (timers.blackout -= dt) <= 0) {
    blackoutLeft = between(20, 35);
    weather.blackout = true;
    toast('Brownout! The whole town went dark');
  }
}

function updateFestival(dt) {
  if (festivalLeft > 0) {
    festivalLeft -= dt;
    if (festivalLeft <= 0) {
      weather.festival = null;
      timers.festival = between(180, 300);
    }
  } else if ((timers.festival -= dt) <= 0) {
    festivalLeft = 75;
    weather.festival = Math.random() < .5 ? 'fiesta' : 'undas';
    toast(weather.festival === 'fiesta' ? 'Barangay fiesta! Food pays more' : 'Undas! The cemetery pays more');
  }
  bunting.visible = weather.festival === 'fiesta';
  visitors.visible = weather.festival === 'undas' && Math.hypot(player.pos.x - cemetery.x, player.pos.z - cemetery.z) < CARE_R;
}

function updateEvents(dt) {
  weather.grip = weather.rain ? RAIN_GRIP : 1;
  updateRain(dt);
  updateBlackout(dt);
  updateFestival(dt);
}

// Extra pay for this delivery from whatever's going on right now.
function eventBonus(order) {
  if (order.contraband) return 0;
  return (weather.rain ? RAIN_PAY : 0) + (weather.festival === 'fiesta' && order.food ? FIESTA_PAY : 0) + (weather.festival === 'undas' && order.house.name === 'Cemetery' ? UNDAS_PAY : 0);
}

function eventText() {
  return [
    weather.blackout && 'Brownout', weather.rain && `Rain +${Math.round(RAIN_PAY * 100)}%`,
    weather.festival === 'fiesta' && `Fiesta: food +${Math.round(FIESTA_PAY * 100)}%`,
    weather.festival === 'undas' && `Undas: cemetery +${Math.round(UNDAS_PAY * 100)}%`,
  ].filter(Boolean).join(' · ');
}

// For tests, and for anything that wants to start one on purpose.
function startEvent(name) {
  if (name === 'rain') timers.rain = 0;
  if (name === 'blackout') timers.blackout = 0;
  if (name === 'fiesta' || name === 'undas') {
    festivalLeft = 75;
    weather.festival = name;
  }
}

export { updateEvents, eventBonus, eventText, startEvent };
