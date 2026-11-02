// The order board at the hub: a few offers to choose from, so every trip starts with a decision.
import { $ } from './util.js';
import { keys } from './state.js';
import { sendBox } from './hub.js';
import { orders, capacity, currentOffers, acceptOffer, offerProblem, starText, renewOffers } from './orders.js';

const boardBox = $('boardBox');

function renderBoard() {
  $('boardNote').textContent = `Carrying ${orders.length} of ${capacity()}`;
  $('boardList').replaceChildren(...currentOffers().map(offer => {
    const row = document.createElement('div'), button = document.createElement('button');
    const problem = offerProblem(offer);
    row.className = 'veh';
    row.append(document.createElement('b'), document.createElement('span'), button);
    row.children[0].textContent = offer.title;
    row.children[1].textContent = `${starText(offer.stars)} · ₱${offer.pay} · ${Math.round(offer.max)}s${problem ? ` · ${problem}` : ''}`;
    button.textContent = 'Take';
    button.disabled = !!problem;
    button.onclick = () => {
      if (acceptOffer(offer)) sendBox(offer.food);
      renewOffers();
      boardBox.close();
    };
    return row;
  }));
}

function openBoard() {
  for (const k in keys) keys[k] = false;
  renderBoard();
  boardBox.showModal();
}

export { boardBox, openBoard };
