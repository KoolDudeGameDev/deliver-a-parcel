// What the action button does at each place on the map.
import { claimBox, myLot, nearSpot } from './home.js';
import { SHOPS } from './world.js';
import { orders, nearHub, capacity } from './orders.js';
import { boardBox, openBoard } from './board.js';
import { shopBox, openShop } from './shop.js';
import { nearDealer, takePackage } from './contraband.js';

const dialogOpen = () => claimBox.open || shopBox.open || boardBox.open;

function actionSpot() {
  if (orders.length < capacity() && nearHub()) return 'ORDER';
  if (nearDealer()) return 'DEAL';
  if (myLot() && nearSpot(myLot().step, 3.6)) return 'HOME';
  if (nearSpot(SHOPS.dealer.step, 3.6)) return 'DEALER';
  if (nearSpot(SHOPS.mechanic.step, 3.6)) return 'MECHANIC';
  return null;
}

function action() {
  const spot = actionSpot();
  if (spot === 'ORDER') openBoard();
  else if (spot === 'DEAL') takePackage();
  else if (spot === 'HOME') openShop('home');
  else if (spot === 'DEALER') openShop('dealer');
  else if (spot === 'MECHANIC') openShop('mechanic');
}

export { dialogOpen, actionSpot, action };
