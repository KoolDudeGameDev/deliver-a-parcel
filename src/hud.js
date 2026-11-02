// Cash, stamina, the order card and hints.
import { isTouch, $ } from './util.js';
import { view } from './state.js';
import { clock } from './daynight.js';
import { hubRing } from './world.js';
import { player } from './player.js';
import { save } from './save.js';
import { orders, capacity, nearestOrder, beamMaterial } from './orders.js';
import { affordable, actionSpot } from './home.js';

function updateHud(now) {
  $('cash').textContent = `₱${save.cash}`;
  $('staminaBar').firstElementChild.style.transform = `scaleX(${player.stamina / 100})`;
  $('job').style.visibility = orders.length ? 'visible' : 'hidden';
  $('nightTag').style.visibility = clock.night > .5 ? 'visible' : 'hidden';
  $('ratingTag').textContent = save.ratingCount ? `★ ${(save.ratingSum / save.ratingCount).toFixed(1)} rating` : '';
  const spot = actionSpot();
  $('btnAction').classList.toggle('ready', !!spot);
  $('btnAction').textContent = spot || 'ACTION';
  hubRing.scale.setScalar(1 + Math.sin(now / 250) * .04);
  beamMaterial.opacity = .28 + Math.sin(now / 200) * .1;
  const press = isTouch ? 'Tap' : 'Press E:', deal = affordable();
  $('hint').textContent =
    spot === 'ORDER' ? `${press} open the order board${orders.length ? ` (${orders.length} of ${capacity()} carried)` : ''}` :
    spot === 'HOME' ? `${press} open your home` :
    spot === 'DEAL' ? `${press} take the shady package` :
    orders.length ? '' :
    !save.delivered ? (isTouch ? 'Left thumb moves, right thumb looks. Follow the green dot for orders' : 'WASD move · Shift sprint · Space jump · drag to look · follow the green dot for orders') :
    deal ? `You can afford: ${deal.name}. Follow the blue dot home` : '';
  const o = nearestOrder();
  if (!o) return;
  const d = o.house.step, dx = d.x - player.pos.x, dz = d.z - player.pos.z;
  const s = Math.sin(view.yaw), c = Math.cos(view.yaw);
  const ahead = dx * -s + dz * -c, right = dx * c + dz * -s;
  $('arrow').style.transform = `rotate(${Math.atan2(right, ahead)}rad)`;
  $('dist').textContent = `${Math.round(Math.hypot(dx, dz))}m`;
  $('orderName').textContent = o.title;
  $('freshLabel').textContent = o.food ? 'Freshness' : 'Condition';
  $('timeLeft').textContent = `${Math.ceil(o.left)}s`;
  $('timeBar').firstElementChild.style.transform = `scaleX(${o.left / o.max})`;
  $('freshBar').firstElementChild.style.transform = `scaleX(${o.fresh / 100})`;
  $('more').textContent = orders.filter(x => x !== o).map(x => `+ ${x.house.name} ${Math.ceil(x.left)}s`).join('  ');
}

export { updateHud };
