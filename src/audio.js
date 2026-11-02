// Sound effects. A new or replacement sound is one row in SOUNDS, plus a line in
// assets/sfx/CREDITS.md. Browsers won't play audio until the player taps or presses something.
import { $ } from './util.js';
import { save, saveGame } from './save.js';

const SOUNDS = {
  hit: { file: 'fahhh_KcgAXfs.mp3', volume: 3.5 }, // A quiet clip, so it's boosted to match the rest.
  arrest: { file: 'please-dont-say-goodbye_UbYftpG.mp3', volume: .8 },
  tip: { file: 'tip.mp3', volume: .7 },
  order: { file: 'order.mp3', volume: .8 },
  bark: { file: 'bark.mp3', volume: .55 },
  bite: { file: 'bite.mp3', volume: .8 },
  ghost: { file: 'ghost.mp3', volume: .9 },
};

const sounds = {};
let context = null, master = null, siren = null;

async function load(name) {
  const data = await (await fetch(`assets/sfx/${SOUNDS[name].file}`)).arrayBuffer();
  sounds[name] = await context.decodeAudioData(data);
}

function start() {
  if (context) {
    context.resume();
    return;
  }
  context = new AudioContext();
  master = context.createGain();
  master.gain.value = save.muted ? 0 : 1;
  master.connect(context.destination);
  Object.keys(SOUNDS).forEach(load);
}
addEventListener('pointerdown', start);
addEventListener('keydown', start);

function play(name) {
  if (!sounds[name]) return;
  const source = context.createBufferSource(), gain = context.createGain();
  source.buffer = sounds[name];
  gain.gain.value = SOUNDS[name].volume;
  source.connect(gain).connect(master);
  source.start();
}

// The siren is generated, not a clip: two tones wailing for as long as a chase lasts.
function setSiren(on) {
  if (!context || on === !!siren) return;
  if (!on) {
    siren.tone.stop();
    siren.wail.stop();
    siren = null;
    return;
  }
  const tone = context.createOscillator(), wail = context.createOscillator(), depth = context.createGain(), gain = context.createGain();
  tone.type = 'square';
  tone.frequency.value = 760;
  wail.frequency.value = 1.6;
  depth.gain.value = 240;
  gain.gain.value = .045;
  wail.connect(depth).connect(tone.frequency);
  tone.connect(gain).connect(master);
  tone.start();
  wail.start();
  siren = { tone, wail };
}

function showMute() {
  $('btnMute').textContent = save.muted ? 'Sound off' : 'Sound on';
}

function toggleMute() {
  save.muted = !save.muted;
  if (master) master.gain.value = save.muted ? 0 : 1;
  saveGame();
  showMute();
}
$('btnMute').addEventListener('click', toggleMute);
showMute();

export { play, setSiren, toggleMute, sounds };
