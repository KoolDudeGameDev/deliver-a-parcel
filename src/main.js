// Starts the game and runs the frame loop.
import { view } from './state.js';
import { DOG_TYPES } from './config.js';
import { renderer, scene, camera, blocks, walls } from './engine.js';
import { VEHICLES } from './data/vehicles.js';
import { HOMES } from './data/homes.js';
import { HOUSES, LOTS } from './world.js';
import { clock, updateDay } from './daynight.js';
import { player } from './player.js';
import { save, rideStats } from './save.js';
import { orders, capacity, takeOrder, updateOrder } from './orders.js';
import { dogs, updateDog } from './dogs.js';
import { myLot, showHome, goHome, claimLot, claimBox, buyHome, buyVehicle, buyPart, actionSpot, action, setVehicle, parked } from './home.js';
import { movePlayer } from './movement.js';
import { updateCamera } from './camera.js';
import { updateHud } from './hud.js';
import { updateMini } from './minimap.js';
import { citizens, updateCitizens } from './citizens.js';
import './input.js';

// Back home if there's a home to come back to. First timers get a name prompt, then a box.
setVehicle(save.equipped);
if (myLot()) {
  showHome();
  goHome();
} else {
  claimBox.showModal();
}

let last = performance.now();
renderer.setAnimationLoop(now => {
  const dt = Math.min((now - last) / 1000, .05);
  last = now;
  movePlayer(dt);
  dogs.forEach(d => updateDog(d, dt));
  updateCitizens(dt);
  updateOrder(dt);
  updateCamera(dt);
  updateDay(dt);
  updateHud(now);
  updateMini(now);
  renderer.render(scene, camera);
});

// Handle for scripted checks from the console.
window.game = {
  player, dogs, citizens, HOUSES, takeOrder, renderer, walls, blocks,
  get dayTime() { return clock.time; }, set dayTime(v) { clock.time = v; },
  LOTS, HOMES, VEHICLES, DOG_TYPES, orders, save, action, actionSpot, capacity, rideStats,
  buyVehicle, buyPart, buyHome, setVehicle, claimLot, showHome, get order() { return orders[0]; }, get cash() { return save.cash; }, get delivered() { return save.delivered; },
  get parked() { return parked; },
  get yaw() { return view.yaw; }, set yaw(v) { view.yaw = v; },
};
