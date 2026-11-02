// The order board at the hub: a few offers to choose from, so every trip starts with a decision.
import { $ } from './util.js';
import { keys } from './state.js';
import { sendBox } from './hub.js';
import { orders, capacity, currentOffers, acceptOffer, offerProblem, starText, renewOffers, isRegular } from './orders.js';
import { currentGoals } from './goals.js';
import { net, worldBoard } from './net.js';

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
  // Only in a shared world: everyone in it right now, by what they're worth.
  $('topRiders').hidden = !net.online;
  $('topList').replaceChildren(...(net.online ? worldBoard() : []).map((e, i) => {
    const line = document.createElement('div');
    line.className = e.me ? 'goal me' : 'goal';
    line.textContent = `${i + 1}. ${e.name}${e.me ? ' (you)' : ''}: ₱${e.worth.toLocaleString()}${e.rating ? ` · ★ ${e.rating.toFixed(1)}` : ''}`;
    return line;
  }));
}

function openBoard() {
  for (const k in keys) keys[k] = false;
  renderBoard();
  boardBox.showModal();
}

export { boardBox, openBoard };
