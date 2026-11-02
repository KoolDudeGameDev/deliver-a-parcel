// The player character and their state.
import * as THREE from 'three';
import { scene, box, canvasTexture } from './engine.js';

function limb(w, h, d, color, x, pivotY, parent) {
  const pivot = new THREE.Group();
  pivot.position.set(x, pivotY, 0);
  box(w, h, d, color, 0, -h / 2, 0, pivot);
  parent.add(pivot);
  return pivot;
}

const body = new THREE.Group();
body.rotation.order = 'YXZ'; // Turn first, so leaning into a corner rolls around the way you face.
scene.add(body);
const SKIN = 0xf6c945, SHIRT = 0x2f7de0, HAT = 0xe0443a, PANTS = 0x2b3a55;
const shirtMaterial = box(.95, 1, .5, SHIRT, 0, 1.5, 0, body).material;
box(.72, .72, .72, SKIN, 0, 2.38, 0, body);
const hatMaterials = [box(.78, .22, .78, HAT, 0, 2.8, 0, body).material, box(.78, .1, .3, HAT, 0, 2.72, .5, body).material];
box(.12, .12, .05, 0x222222, -.17, 2.45, .37, body);
box(.12, .12, .05, 0x222222, .17, 2.45, .37, body);
const legL = limb(.42, 1, .45, PANTS, -.24, 1, body), legR = limb(.42, 1, .45, PANTS, .24, 1, body);
const armL = limb(.32, 1, .4, SKIN, -.66, 2, body), armR = limb(.32, 1, .4, SKIN, .66, 2, body);
const carryFood = box(.9, .18, .9, 0xffffff, 0, 1.75, .85, body);
box(.92, .04, .92, 0xe0443a, 0, .1, 0, carryFood);
const carryParcel = box(.95, .75, .75, 0xb98a56, 0, 1.75, .8, body);
box(.97, .77, .14, 0xe7d7b2, 0, 0, 0, carryParcel);
carryFood.visible = carryParcel.visible = false;

const blob = new THREE.Mesh(new THREE.CircleGeometry(.65, 18),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .25 }));
blob.rotation.x = -Math.PI / 2;
scene.add(blob);

// A fake headlight: a soft cone on the ground, because a real light would cost too much on phones.
const headlight = new THREE.Mesh(
  new THREE.PlaneGeometry(9, 16).rotateX(-Math.PI / 2).translate(0, 0, 9),
  new THREE.MeshBasicMaterial({
    map: canvasTexture(64, 128, x => {
      const g = x.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, 'rgba(255,240,190,.95)');
      g.addColorStop(1, 'rgba(255,240,190,0)');
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(26, 0);
      x.lineTo(38, 0);
      x.lineTo(64, 128);
      x.lineTo(0, 128);
      x.fill();
    }),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, fog: false,
  }));
headlight.visible = false;
body.add(headlight);

const player = { pos: new THREE.Vector3(0, 0, 9), vx: 0, vz: 0, vy: 0, kx: 0, kz: 0, lean: 0, heading: 0, stun: 0, stamina: 100, phase: 0, moving: 0 };
const PLAYER_R = .55;

export { shirtMaterial, hatMaterials, SHIRT, HAT, limb, body, headlight, carryFood, carryParcel, blob, player, PLAYER_R, legL, legR, armL, armR };
