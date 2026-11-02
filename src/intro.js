// The intro, every time the game opens: pick a name and a look, then press Play to join the world.
import { $, toast } from './util.js';
import { view } from './state.js';
import { HOMES } from './data/homes.js';
import { PAINTS, SKINS } from './data/cosmetics.js';
import { LOTS } from './world.js';
import { SKIN, SHIRT, HAT, PANTS } from './player.js';
import { save, saveGame } from './save.js';
import { myLot, showHome, showStyle, goHome } from './home.js';

const introBox = $('introBox');
const paints = PAINTS.map(p => p.color);
// Each row: its label, the saved field, the colours on offer, and the colour when nothing's picked yet.
const LOOKS = [['Skin', 'skin', SKINS, SKIN], ['Shirt', 'shirt', paints, SHIRT], ['Pants', 'pants', paints, PANTS], ['Cap', 'hat', paints, HAT]];

function looksRow([label, field, colors, fallback]) {
  const row = document.createElement('div'), name = document.createElement('span'), strip = document.createElement('div');
  row.className = 'look';
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', label);
  name.textContent = label;
  strip.className = 'swatches';
  const current = save.style[field] ?? fallback;
  colors.forEach((color, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = `#${color.toString(16).padStart(6, '0')}`;
    b.setAttribute('aria-label', field === 'skin' ? `Skin tone ${i + 1}` : PAINTS[i].name);
    b.setAttribute('aria-pressed', color === current);
    b.classList.toggle('picked', color === current);
    b.onclick = () => {
      save.style[field] = color;
      showStyle();
      for (const s of strip.children) {
        s.classList.toggle('picked', s === b);
        s.setAttribute('aria-pressed', s === b);
      }
    };
    strip.append(b);
  });
  row.append(name, strip);
  return row;
}

let firstVisit = false, onPlay = () => {};

// A first-timer is shown standing at their new cardboard box. It's only kept once they press Play.
function openIntro(then) {
  onPlay = then;
  firstVisit = !myLot();
  if (firstVisit) save.slot = Math.floor(Math.random() * LOTS.length);
  showHome();
  goHome();
  $('nameInput').value = save.name;
  $('introNote').textContent = firstVisit
    ? 'You start with a cardboard box somewhere in town. Deliver food and parcels, dodge the dogs, and build it into a mansion.'
    : `₱${save.cash} · ${save.delivered} deliveries · ${HOMES[save.homeLevel].name}`;
  $('looks').replaceChildren(...LOOKS.map(looksRow));
  view.intro = true;
  document.body.classList.add('intro');
  introBox.showModal();
}

introBox.addEventListener('close', () => {
  view.intro = false;
  document.body.classList.remove('intro');
  save.name = $('nameInput').value.trim() || 'Rider';
  saveGame();
  showHome();
  goHome();
  toast(firstVisit ? `Welcome home, ${save.name}!` : `Welcome back, ${save.name}!`);
  onPlay();
});

export { openIntro };
