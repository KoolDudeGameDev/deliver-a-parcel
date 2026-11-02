// The follow camera.
import * as THREE from 'three';
import { view } from './state.js';
import { camera, solids } from './engine.js';
import { player } from './player.js';

const ray = new THREE.Raycaster(), camDir = new THREE.Vector3(), focus = new THREE.Vector3();
function updateCamera(dt) {
  focus.copy(player.pos);
  focus.y += 2;
  camDir.set(Math.sin(view.yaw) * Math.cos(view.pitch), Math.sin(view.pitch), Math.cos(view.yaw) * Math.cos(view.pitch));
  // Pull the camera in when a building gets between it and the player.
  ray.set(focus, camDir);
  ray.far = 10;
  const hit = ray.intersectObjects(solids, false)[0];
  camera.position.copy(focus).addScaledVector(camDir, hit ? Math.max(1.5, hit.distance - .4) : 10);
  if (view.shake > 0) {
    view.shake -= dt;
    camera.position.x += (Math.random() - .5) * view.shake * 2;
    camera.position.y += (Math.random() - .5) * view.shake * 2;
  }
  camera.lookAt(focus);
}

export { updateCamera };
