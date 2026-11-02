// Keyboard, mouse and touch controls.
import { $, clamp } from './util.js';
import { view, controls, keys, stick } from './state.js';
import { renderer } from './engine.js';
import { dialogOpen, action } from './actions.js';
import { toggleMute } from './audio.js';

let lastX = 0, lastY = 0;

addEventListener('keydown', e => {
  if (dialogOpen()) return;
  keys[e.code] = true;
  if (e.code === 'Space') { controls.wantJump = true; e.preventDefault(); }
  if (e.code === 'KeyE') action();
  if (e.code === 'KeyM') toggleMute();
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
addEventListener('gesturestart', e => e.preventDefault());
addEventListener('contextmenu', e => e.preventDefault());

// Mouse drag anywhere, or touch drag on the right half (the left half is covered by #leftZone).
const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', e => {
  if (controls.lookId !== null) return;
  controls.lookId = e.pointerId; lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== controls.lookId) return;
  const s = e.pointerType === 'touch' ? .008 : .005;
  view.yaw -= (e.clientX - lastX) * s;
  view.pitch = clamp(view.pitch + (e.clientY - lastY) * s * .8, .12, 1.15);
  lastX = e.clientX; lastY = e.clientY;
});
const endLook = e => { if (e.pointerId === controls.lookId) controls.lookId = null; };
canvas.addEventListener('pointerup', endLook);
canvas.addEventListener('pointercancel', endLook);

// The joystick appears wherever the thumb lands in the left zone.
const zone = $('leftZone'), base = $('base'), knob = $('knob'), STICK_R = 50;
let originX = 0, originY = 0;
const restStick = () => {
  originX = 100;
  originY = innerHeight - 90;
  base.style.left = originX + 'px';
  base.style.top = originY + 'px';
  knob.style.transform = '';
};
restStick();
addEventListener('resize', () => { if (stick.id === null) restStick(); });
const moveStick = e => {
  let dx = e.clientX - originX, dy = e.clientY - originY;
  const d = Math.hypot(dx, dy);
  if (d > STICK_R) { dx *= STICK_R / d; dy *= STICK_R / d; }
  stick.x = dx / STICK_R;
  stick.y = dy / STICK_R;
  knob.style.transform = `translate(${dx}px,${dy}px)`;
};
zone.addEventListener('pointerdown', e => {
  if (stick.id !== null) return;
  stick.id = e.pointerId;
  zone.setPointerCapture(e.pointerId);
  originX = e.clientX; originY = e.clientY;
  base.style.left = originX + 'px';
  base.style.top = originY + 'px';
  moveStick(e);
});
zone.addEventListener('pointermove', e => { if (e.pointerId === stick.id) moveStick(e); });
const endStick = e => {
  if (e.pointerId !== stick.id) return;
  stick.id = null; stick.x = stick.y = 0;
  restStick();
};
zone.addEventListener('pointerup', endStick);
zone.addEventListener('pointercancel', endStick);

function holdButton(el, down, up) {
  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    el.classList.add('down');
    down();
  });
  const release = () => { el.classList.remove('down'); up?.(); };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
}
holdButton($('btnJump'), () => controls.wantJump = true);
holdButton($('btnSprint'), () => controls.sprintHeld = true, () => controls.sprintHeld = false);
holdButton($('btnAction'), action);
