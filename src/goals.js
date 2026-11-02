// Daily goals, delivery streaks and regular customers: the reasons to come back tomorrow.
import { toast } from './util.js';
import { save } from './save.js';
import { GOAL_COUNT, STREAK_STEP, STREAK_MAX, REGULAR_VISITS, REGULAR_BONUS } from './config.js';

// A new daily goal is one more row. event is what counts towards it, from countGoal below.
const GOAL_TYPES = [
  { event: 'delivered', count: 8, reward: 250, text: n => `Make ${n} deliveries` },
  { event: 'dogYard', count: 4, reward: 300, text: n => `Deliver to ${n} yards with a chaser` },
  { event: 'fiveStar', count: 3, reward: 350, text: n => `Earn 5 stars ${n} times` },
  { event: 'hardOrder', count: 2, reward: 400, text: n => `Finish ${n} orders of 4 stars or more` },
  { event: 'cemeteryNight', count: 1, reward: 350, text: () => 'Deliver to the cemetery at night' },
  { event: 'streak', count: 5, reward: 300, text: n => `Reach a streak of ${n}` },
  { event: 'shady', count: 1, reward: 300, text: () => 'Finish a shady job' },
];

const today = () => new Date().toDateString();
const hash = text => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// Everyone gets the same goals on the same day, picked from the date.
function goalsFor(day) {
  const start = hash(day), step = 3, picks = [];
  for (let i = 0; picks.length < GOAL_COUNT; i++) {
    const n = (start + i * step) % GOAL_TYPES.length;
    if (!picks.includes(n)) picks.push(n);
  }
  return picks.map(n => ({ type: n, progress: 0, done: false }));
}

function currentGoals() {
  if (save.goals.day !== today()) save.goals = { day: today(), list: goalsFor(today()) };
  return save.goals.list.map(g => ({ ...g, ...GOAL_TYPES[g.type], label: GOAL_TYPES[g.type].text(GOAL_TYPES[g.type].count) }));
}

function countGoal(event, by = 1) {
  currentGoals();
  for (const g of save.goals.list) {
    const type = GOAL_TYPES[g.type];
    if (g.done || type.event !== event) continue;
    // A streak goal measures your current streak rather than adding up.
    g.progress = event === 'streak' ? Math.max(g.progress, by) : g.progress + by;
    if (g.progress >= type.count) {
      g.done = true;
      save.cash += type.reward;
      toast(`Goal done! +₱${type.reward}`);
    }
  }
}

const streakBonus = () => Math.min(save.streak * STREAK_STEP, STREAK_MAX);

function growStreak() {
  save.streak++;
  countGoal('streak', save.streak);
}

function breakStreak() {
  if (save.streak >= 3) toast(`Streak of ${save.streak} lost!`);
  save.streak = 0;
}

const isRegular = house => (save.regulars[house.name] || 0) >= REGULAR_VISITS;
const regularBonus = house => (isRegular(house) ? REGULAR_BONUS : 0);

function visit(house) {
  if (!house.yard) return false;
  save.regulars[house.name] = (save.regulars[house.name] || 0) + 1;
  return save.regulars[house.name] === REGULAR_VISITS;
}

export { currentGoals, countGoal, streakBonus, growStreak, breakStreak, isRegular, regularBonus, visit };
