// The conveyor in the orders building. Boxes ride it all the time, and taking an order sends yours
// down the belt, where it hops into your hands.
import * as THREE from 'three';
import { scene, box, canvasTexture } from './engine.js';
import { isTouch } from './util.js';
import { BELT_Z, BELT_Y, BELT_HALF } from './world.js';
import { player } from './player.js';

const IDLE_SPEED = 1.5, RUSH_SPEED = 7, HOP_TIME = .45, CRATES = 6;

const beltTexture = canvasTexture(64, 16, x => {
  x.fillStyle = '#2b2f36'; x.fillRect(0, 0, 64, 16);
  x.fillStyle = '#4a505a';
  for (let i = 0; i < 64; i += 16) x.fillRect(i, 0, 6, 16);
});
beltTexture.repeat.set(10, 1);
const belt = new THREE.Mesh(new THREE.PlaneGeometry(BELT_HALF * 2, .9).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: beltTexture }));
belt.position.set(0, BELT_Y, BELT_Z);
belt.receiveShadow = !isTouch;
scene.add(belt);

// Spare boxes, always passing through.
const crates = new THREE.InstancedMesh(new THREE.BoxGeometry(.62, .5, .62), new THREE.MeshLambertMaterial({ color: 0xb98a56 }), CRATES);
crates.castShadow = !isTouch;
crates.frustumCulled = false;
scene.add(crates);
const place = new THREE.Object3D();
let along = 0, rush = 0;

// The one box that's yours. Food and parcels look different.
const parcelBox = box(.8, .6, .8, 0xc99a5e, 0, 0, 0), foodBox = box(.85, .22, .85, 0xffffff, 0, 0, 0);
box(.87, .05, .87, 0xe0443a, 0, .02, 0, foodBox);
parcelBox.visible = foodBox.visible = false;
let sending = null, sendX = 0, hop = 0;

function sendBox(food) {
  if (sending) sending.visible = false;
  sending = food ? foodBox : parcelBox;
  sendX = -BELT_HALF;
  hop = 0;
  rush = 1.4;
  sending.visible = true;
}

function updateHub(dt) {
  rush = Math.max(0, rush - dt);
  const speed = rush > 0 ? RUSH_SPEED : IDLE_SPEED;
  along = (along + speed * dt) % (BELT_HALF * 2);
  beltTexture.offset.x = -along / 2;
  for (let i = 0; i < CRATES; i++) {
    const x = (along + i / CRATES * BELT_HALF * 2) % (BELT_HALF * 2) - BELT_HALF;
    place.position.set(x, BELT_Y + .25, BELT_Z);
    place.updateMatrix();
    crates.setMatrixAt(i, place.matrix);
  }
  crates.instanceMatrix.needsUpdate = true;

  if (!sending) return;
  if (sendX < 0) {
    sendX += RUSH_SPEED * 1.6 * dt;
    sending.position.set(Math.min(0, sendX), BELT_Y + .35, BELT_Z);
    return;
  }
  // At the counter it hops out in an arc to whoever ordered it.
  hop = Math.min(1, hop + dt / HOP_TIME);
  const from = sending.position, to = player.pos;
  const x = hop * to.x, z = BELT_Z + hop * (to.z - BELT_Z), y = BELT_Y + .35 + (to.y + 1.75 - BELT_Y - .35) * hop + Math.sin(hop * Math.PI) * 1.2;
  from.set(x, y, z);
  if (hop >= 1) {
    sending.visible = false;
    sending = null;
  }
}

export { sendBox, updateHub };
