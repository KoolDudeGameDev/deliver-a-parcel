// The day-to-night cycle.
import * as THREE from 'three';
import { clamp } from './util.js';
import { weather } from './state.js';
import { scene, camera, hemi, sun, skyUniforms, skyDome } from './engine.js';
import { wallMaterial, bulbMaterial, cloudMaterial, cloudMesh, glowMaterial, poolMaterial, lampGlow, lampPools, candleMaterial, candleGlow } from './world.js';

const DAY_LENGTH = 360, SUN_INTENSITY = 2.1, MOON_INTENSITY = .35;
const DAY_TOP = new THREE.Color(0x2f86e8), DAY_HOR = new THREE.Color(0xa9dcff), DUSK = new THREE.Color(0xff9a5c);
const NIGHT_TOP = new THREE.Color(0x0b1433), NIGHT_HOR = new THREE.Color(0x2a3a5e), RAIN_SKY = new THREE.Color(0x5b6673);
const SUN_COLOR = new THREE.Color(0xfff0da), MOON_COLOR = new THREE.Color(0x9db8ff);
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const sunDir = new THREE.Vector3();
const clock = { time: .36, night: 0 };
let rainLook = 0;

function updateDay(dt) {
  clock.time = (clock.time + dt / DAY_LENGTH) % 1;
  // height is 1 at noon and -1 at midnight. The light itself stays above the horizon: at night
  // it's the moon, so it never has to jump across the sky.
  const height = Math.sin((clock.time - .25) * Math.PI * 2);
  const day = smooth(-.1, .3, height), dusk = clamp(1 - Math.abs(height - .05) / .3, 0, 1);
  rainLook += ((weather.rain ? 1 : 0) - rainLook) * Math.min(1, dt);
  skyUniforms.top.value.copy(NIGHT_TOP).lerp(DAY_TOP, day).lerp(RAIN_SKY, rainLook * .75);
  skyUniforms.hor.value.copy(NIGHT_HOR).lerp(DAY_HOR, day).lerp(DUSK, dusk * .7).lerp(RAIN_SKY, rainLook * .6);
  scene.fog.color.copy(skyUniforms.hor.value);
  hemi.intensity = (.5 + .85 * day) * (1 - rainLook * .25);
  sun.intensity = (MOON_INTENSITY + (SUN_INTENSITY - MOON_INTENSITY) * day) * (1 - rainLook * .6);
  sun.color.copy(MOON_COLOR).lerp(SUN_COLOR, day).lerp(DUSK, dusk * .55);
  const az = clock.time * Math.PI * 2;
  sunDir.set(Math.cos(az) * .8, Math.max(.45, height), Math.sin(az) * .8).normalize();

  const night = clock.night = 1 - smooth(.0, .25, height), lit = weather.blackout ? 0 : night;
  wallMaterial.emissiveIntensity = lit * 1.1;
  bulbMaterial.color.setRGB(.25 + lit * .75, .25 + lit * .7, .25 + lit * .45);
  glowMaterial.opacity = lit * .9;
  poolMaterial.opacity = lit * .4;
  lampGlow.visible = lampPools.visible = lit > .01;
  // A brownout doesn't touch candles, and at Undas they burn all day.
  candleMaterial.opacity = Math.max(night, weather.festival === 'undas' ? .8 : 0) * (.75 + Math.sin(performance.now() / 90) * .15 + Math.sin(performance.now() / 37) * .1);
  candleGlow.visible = candleMaterial.opacity > .01;
  cloudMaterial.color.setRGB(.2 + .8 * day, .23 + .77 * day, .32 + .68 * day).lerp(DUSK, dusk * .35);
  cloudMesh.position.x = Math.sin(performance.now() / 90000) * 120;
  skyDome.position.copy(camera.position);
}

export { clock, sunDir, updateDay };
