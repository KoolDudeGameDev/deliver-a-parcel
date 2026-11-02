// The follow camera.
import * as THREE from 'three';
import { view } from './state.js';
import { camera, solids } from './engine.js';
import { body, player } from './player.js';

const ray = new THREE.Raycaster(), camDir = new THREE.Vector3(), focus = new THREE.Vector3(), side = new THREE.Vector3();
const introBox = document.getElementById('introBox');
const INTRO_PITCH = .16, INTRO_FAR = 6.5, INTRO_SWAY = .45;
let introTime = 0, introTurn = null;

const blocked = yaw => [-INTRO_SWAY, 0, INTRO_SWAY].some(s => {
  ray.set(focus, camDir.set(Math.sin(yaw + s) * Math.cos(INTRO_PITCH), Math.sin(INTRO_PITCH), Math.cos(yaw + s) * Math.cos(INTRO_PITCH)));
  ray.far = INTRO_FAR;
  return ray.intersectObjects(solids, false).length > 0;
});

function updateCamera(dt) {
  focus.copy(player.pos);
  focus.y += 2;
  let pitch = view.pitch, far = 10;
  // The intro looks at the rider from the front, or as near the front as the view is clear,
  // swaying a little so the clothes catch the light.
  if (view.intro) {
    focus.y -= .6;
    introTurn ??= [0, .8, -.8, 1.6, -1.6].find(t => !blocked(body.rotation.y + t)) ?? 0;
    introTime += dt;
    view.yaw = body.rotation.y + introTurn + Math.sin(introTime * .4) * INTRO_SWAY;
    pitch = INTRO_PITCH;
    far = INTRO_FAR;
  } else introTurn = null;
  camDir.set(Math.sin(view.yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(view.yaw) * Math.cos(pitch));
  // Pull the camera in when a building gets between it and the player.
  ray.set(focus, camDir);
  ray.far = far;
  const hit = ray.intersectObjects(solids, false)[0];
  camera.position.copy(focus).addScaledVector(camDir, hit ? Math.max(1.5, hit.distance - .4) : far);
  if (view.shake > 0) {
    view.shake -= dt;
    camera.position.x += (Math.random() - .5) * view.shake * 2;
    camera.position.y += (Math.random() - .5) * view.shake * 2;
  }
  // The intro panel sits on the left, so the rider stands in the middle of the space it leaves.
  // Seen on screen, that middle is as far right of centre as the panel's edge is from the left.
  if (view.intro) {
    const edge = introBox.getBoundingClientRect().right / innerWidth;
    const halfWidth = camera.position.distanceTo(focus) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    if (edge < .8) focus.addScaledVector(side.set(Math.cos(view.yaw), 0, -Math.sin(view.yaw)), -edge * halfWidth);
  }
  camera.lookAt(focus);
}

export { updateCamera };
