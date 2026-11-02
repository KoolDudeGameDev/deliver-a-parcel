// The order board at the hub: a few offers to choose from, so every trip starts with a decision.
import { $ } from './util.js';
import { keys } from './state.js';
import { sendBox } from './hub.js';
import { orders, capacity, currentOffers, acceptOffer, offerProblem, starText, renewOffers, isRegular } from './orders.js';
import { currentGoals } from './goals.js';
import { net } from './net.js';

const boardBox = $('boardBox');

function renderBoard() {
  $('boardNote').textContent = `Carrying ${orders.length} of ${capacity()}`;
  $('boardList').replaceChildren(...currentOffers().map(offer => {
    const row = document.createElement('div'), button = document.createElement('button');
    const problem = offerProblem(offer);
    row.className = 'veh';
    row.append(document.createElement('b'), document.createElement('span'), button);
    row.children[0].textContent = offer.title;
    row.children[1].textContent = `${starText(offer.stars)} · ₱${offer.pay} · ${Math.round(offer.max)}s${isRegular(offer.house) ? ' · Regular' : ''}${problem ? ` · ${problem}` : ''}`;
    button.textContent = 'Take';
    button.disabled = !!problem;
    button.onclick = () => {
      if (acceptOffer(offer)) sendBox(offer.food);
      renewOffers();
      boardBox.close();
    };
    return row;
  }));
  $('goalList').replaceChildren(...currentGoals().map(g => {
    const line = document.createElement('div');
    line.className = g.done ? 'goal done' : 'goal';
    line.textContent = g.done ? `${g.label}: done` : `${g.label}: ${g.progress} of ${g.count}, ₱${g.reward}`;
    return line;
  }));
  // The leaderboard only exists when there's a server to keep it.
  $('topRiders').hidden = !net.online;
  $('topList').replaceChildren(...net.board.map((e, i) => {
    const line = document.createElement('div');
    line.className = 'goal';
    line.textContent = `${i + 1}. ${e.name}: ${e.delivered} deliveries`;
    return line;
  }));
}

function openBoard() {
  for (const k in keys) keys[k] = false;
  renderBoard();
  boardBox.showModal();
}

export { boardBox, openBoard };
