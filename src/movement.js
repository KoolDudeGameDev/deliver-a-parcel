// Moves the player each frame.
import { clamp } from './util.js';
import { view, controls, keys, stick, weather } from './state.js';
import { RUN, SPRINT, RIDE_SPRINT, PARCEL_SLOW, JUMP_V, GRAVITY } from './config.js';
import { sun, resolve } from './engine.js';
import { EDGE, HOUSES } from './world.js';
import { sunDir, clock } from './daynight.js';
import { body, headlight, carryFood, carryParcel, blob, player, PLAYER_R, legL, legR, armL, armR } from './player.js';
import { save } from './save.js';
import { orders } from './orders.js';
import { inYard } from './dogs.js';
import { myLot, nearSpot, mountVehicle, parkVehicle, rideNow, rideGroup, parked } from './home.js';

function movePlayer(dt) {
  const p = player;
  p.stun -= dt;

  let ix = stick.x, iz = -stick.y;
  if (keys.KeyW || keys.ArrowUp) iz += 1;
  if (keys.KeyS || keys.ArrowDown) iz -= 1;
  if (keys.KeyD || keys.ArrowRight) ix += 1;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1;
  const mag = Math.hypot(ix, iz);
  if (mag > 1) { ix /= mag; iz /= mag; }
  if (p.stun > 0) ix = iz = 0;

  // Customer yards are on foot: that's where the dogs are.
  const inCustomerYard = HOUSES.some(h => inYard(p.pos, h.yard));
  if (save.equipped && inCustomerYard !== parked) inCustomerYard ? parkVehicle() : mountVehicle();
  const ride = parked ? null : rideNow;

  const moving = Math.hypot(ix, iz) > .05;
  // Run out and you're winded for a bit, or regen would restart the sprint on the very next frame.
  if (p.stamina <= 0) p.winded = true;
  else if (p.stamina >= 25) p.winded = false;
  const sprinting = (keys.ShiftLeft || keys.ShiftRight || controls.sprintHeld) && moving && !p.winded;
  p.stamina = clamp(p.stamina + (sprinting ? -30 : 18) * dt, 0, 100);
  if (myLot() && nearSpot(myLot().step, 3.6)) p.stamina = Math.min(100, p.stamina + 60 * dt);
  const speed = (ride ? ride.speed * (sprinting ? RIDE_SPRINT : 1) : sprinting ? SPRINT : RUN) * (orders.some(o => !o.food && !o.light) ? PARCEL_SLOW : 1);

  // On a phone the left thumb also steers the camera a little, so you can play one-handed.
  if (stick.id !== null && controls.lookId === null) view.yaw -= ix * 1.1 * dt;

  const s = Math.sin(view.yaw), c = Math.cos(view.yaw), grip = Math.min(1, (ride ? ride.accel * weather.grip : 30) * dt);
  p.vx += ((-s * iz + c * ix) * speed - p.vx) * grip;
  p.vz += ((-c * iz - s * ix) * speed - p.vz) * grip;
  const pace = Math.hypot(p.vx, p.vz);

  // Riding forward, the camera swings round behind you, so steering is just pushing sideways.
  if (ride && iz > .2 && pace > 2 && controls.lookId === null) {
    const want = Math.atan2(p.vx, p.vz) + Math.PI;
    view.yaw += Math.atan2(Math.sin(want - view.yaw), Math.cos(want - view.yaw)) * Math.min(1, 1.8 * dt);
  }

  // Small steps, so a fast vehicle at a low frame rate can't skip through a fence.
  const steps = Math.ceil((pace + Math.hypot(p.kx, p.kz)) * dt / .3) || 1;
  for (let i = 0; i < steps; i++) {
    p.pos.x += (p.vx + p.kx) * dt / steps;
    p.pos.z += (p.vz + p.kz) * dt / steps;
    resolve(p.pos, PLAYER_R);
  }
  const fade = Math.exp(-6 * dt);
  p.kx *= fade;
  p.kz *= fade;
  p.pos.x = clamp(p.pos.x, -EDGE + 1, EDGE - 1);
  p.pos.z = clamp(p.pos.z, -EDGE + 1, EDGE - 1);

  const grounded = p.pos.y <= 0;
  if (controls.wantJump && grounded && p.stun <= 0) p.vy = JUMP_V;
  controls.wantJump = false;
  p.vy -= GRAVITY * dt;
  p.pos.y += p.vy * dt;
  if (p.pos.y < 0) { p.pos.y = 0; p.vy = 0; }

  if (ride ? pace > 1 : moving) body.rotation.y = Math.atan2(p.vx, p.vz);
  p.moving += ((moving ? 1 : 0) - p.moving) * Math.min(1, 12 * dt);
  p.phase += speed * dt * (ride?.pose === 'pedal' ? .9 : 1.7);
  animate(ride, sprinting, pace, dt);
  body.position.copy(p.pos);
  if (ride) body.position.y += ride.seat;
  blob.position.set(p.pos.x, .17, p.pos.z);

  // Snapped to whole shadow texels, or shadow edges crawl as you move.
  const texel = 120 / 2048, sx = Math.round(p.pos.x / texel) * texel, sz = Math.round(p.pos.z / texel) * texel;
  sun.target.position.set(sx, 0, sz);
  sun.position.set(sx, 0, sz).addScaledVector(sunDir, 120);
}

// Poses the character for whatever they're doing, and spins the wheels.
function animate(ride, sprinting, pace, dt) {
  const p = player, pose = ride?.pose, wave = Math.sin(p.phase), carrying = orders.length > 0;
  if (pose === 'pedal') {
    legL.rotation.x = -.75 + wave * .45 * p.moving;
    legR.rotation.x = -.75 - wave * .45 * p.moving;
  } else if (pose === 'motor') {
    legL.rotation.x = legR.rotation.x = -1.15;
  } else if (pose === 'blades') {
    // Long gliding strides, with each skate following its foot.
    const glide = Math.sin(p.phase * .55) * .42 * p.moving;
    legL.rotation.x = glide;
    legR.rotation.x = -glide;
    const [l, r] = rideGroup.userData.skates;
    l.position.z = -Math.sin(glide);
    r.position.z = Math.sin(glide);
  } else if (pose === 'board') {
    // Front foot stays planted, back foot pushes off the ground while you're accelerating.
    legL.rotation.x = .12;
    legR.rotation.x = p.moving * (Math.sin(p.phase * .5) * .75 - .1);
  } else {
    legL.rotation.x = wave * .9 * p.moving;
    legR.rotation.x = -wave * .9 * p.moving;
  }

  const bars = pose === 'pedal' ? -.85 : pose === 'motor' ? -.95 : null;
  armL.rotation.x = bars ?? (carrying ? -1.5 : pose ? 0 : -wave * .9 * p.moving);
  armR.rotation.x = bars ?? (carrying ? -1.5 : pose ? 0 : wave * .9 * p.moving);
  // Arms out for balance on a board.
  const balance = (pose === 'board' || pose === 'blades') && !carrying ? .55 : 0;
  armL.rotation.z = -balance;
  armR.rotation.z = balance;
  // Both hands are on the bars, so what you're carrying rides behind you.
  carryFood.position.z = bars ? -.75 : .85;
  carryParcel.position.z = bars ? -.75 : .8;

  // Lean into corners, and rock back on the moped or forward on the rest when sprinting.
  const heading = Math.atan2(p.vx, p.vz), turn = Math.atan2(Math.sin(heading - p.heading), Math.cos(heading - p.heading)) / dt;
  p.heading = heading;
  p.lean += ((ride && pace > 2 ? clamp(-turn * .2, -.4, .4) : 0) - p.lean) * Math.min(1, 8 * dt);
  body.rotation.z = p.lean;
  body.rotation.x = ride && sprinting ? (pose === 'motor' ? -.12 : .1) : 0;

  if (ride) for (const w of rideGroup.userData.wheels ?? []) w.rotation.x += pace * dt / w.userData.r;

  headlight.visible = !!ride && clock.night > .02;
  if (ride) {
    headlight.position.y = .2 - ride.seat;
    headlight.material.opacity = clock.night * .75;
  }
}

export { movePlayer };
