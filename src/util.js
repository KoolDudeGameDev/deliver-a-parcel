// Small helpers used everywhere.

const isTouch = matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).has('touch');
document.body.classList.toggle('touch', isTouch);
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

let toastTimer;
function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

export { isTouch, $, clamp, toast };
