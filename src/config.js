// Tuning numbers for the player, orders and dogs. Everything worth playing with lives here.

const RUN = 6, SPRINT = 9.5, RIDE_SPRINT = 1.35, PARCEL_SLOW = 0.75, JUMP_V = 9, GRAVITY = 26;
const FOOD_TIME = 8, PARCEL_TIME = 14, FOOD_PAY = 30, PARCEL_PAY = 25, FAR_PAY = .4, NIGHT_PAY = 1.15;
const STAR_PAY = .2, OFFER_COUNT = 3, OFFER_LIFE = 30; // Pay per difficulty star, and how the board refreshes.
const HIT_SPEED = 7, HIT_FINE = 15, HIT_DAMAGE = 10; // Hitting a citizen: speed it takes, cost, order damage.
const GHOST_SPEED = 3.4, GHOST_DAMAGE = 40;
const CONTRABAND_PAY = 170, CONTRABAND_FAR_PAY = .8, ARREST_COST = .25; // Night jobs: pay, and what an arrest takes.
// Police speeds, then how close they spot you, how far you must get, and for how many seconds.
const POLICE_PATROL = 8, POLICE_CHASE = 19, POLICE_SEE = 32, POLICE_LOSE = 55, POLICE_GIVE_UP = 3;
const DOG_TYPES = {
  tiny:   { scale: .45, speed: 8.2, knock: 3,  stun: .05, damage: 5, danger: .5 },
  small:  { scale: .65, speed: 7.5, knock: 5,  stun: .15, damage: 10, danger: 1 },
  medium: { scale: 1,   speed: 6.3, knock: 8,  stun: .35, damage: 18, danger: 1.5 },
  big:    { scale: 1.35, speed: 5.4, knock: 13, stun: .7, damage: 30, danger: 2 },
  giant:  { scale: 1.9, speed: 4.6, knock: 19, stun: 1.1, damage: 45, danger: 3 },
};

// A size sets how a dog plays, and a breed sets how it looks. A new breed is one more row, then
// give it to a house in world.js. coat is the main colour, and the rest are optional: mark is the
// patch on its back, muzzle its nose, ears 'up' or 'flop', tail 'up', 'curl' or 'long', len and
// legs stretch its body and legs, and fluffy bulks it out.
const DOG_BREEDS = {
  chihuahua: { name: 'Chihuahua', size: 'tiny', coat: 0xe8d0a9, ears: 'up', legs: 1.1, tail: 'up' },
  pomeranian: { name: 'Pomeranian', size: 'tiny', coat: 0xe89a4a, ears: 'up', fluffy: true, len: .8, tail: 'curl' },
  shihTzu: { name: 'Shih Tzu', size: 'small', coat: 0xf1ece0, mark: 0x9a6a45, ears: 'flop', fluffy: true, len: .85, legs: .7, tail: 'curl' },
  dachshund: { name: 'Dachshund', size: 'small', coat: 0x7a3f22, ears: 'flop', len: 1.6, legs: .55, tail: 'long' },
  aspin: { name: 'Aspin', size: 'medium', coat: 0xb98a56, muzzle: 0x4a3a2c, ears: 'up', tail: 'up' },
  beagle: { name: 'Beagle', size: 'medium', coat: 0xf1ece0, mark: 0x8a5a30, muzzle: 0x2b2b2b, ears: 'flop', legs: .85, tail: 'up' },
  germanShepherd: { name: 'German Shepherd', size: 'big', coat: 0xb9803f, mark: 0x1f1c1a, muzzle: 0x1f1c1a, ears: 'up', len: 1.1, tail: 'long' },
  husky: { name: 'Husky', size: 'big', coat: 0xdfe4ea, mark: 0x4f5560, ears: 'up', fluffy: true, tail: 'curl' },
  greatDane: { name: 'Great Dane', size: 'giant', coat: 0x8f7f6e, muzzle: 0x1f1c1a, ears: 'flop', legs: 1.35, len: 1.1, tail: 'long' },
  saintBernard: { name: 'Saint Bernard', size: 'giant', coat: 0xf1ece0, mark: 0x8a4a22, ears: 'flop', fluffy: true, tail: 'long' },
  mastiff: { name: 'Mastiff', size: 'giant', coat: 0x4a4038, muzzle: 0x141210, ears: 'flop', fluffy: true, legs: .95, tail: 'long' },
};

export { RUN, SPRINT, RIDE_SPRINT, PARCEL_SLOW, JUMP_V, GRAVITY, FOOD_TIME, PARCEL_TIME, FOOD_PAY, PARCEL_PAY, FAR_PAY, NIGHT_PAY, STAR_PAY, OFFER_COUNT, OFFER_LIFE, HIT_SPEED, HIT_FINE, HIT_DAMAGE, GHOST_SPEED, GHOST_DAMAGE, CONTRABAND_PAY, CONTRABAND_FAR_PAY, ARREST_COST, POLICE_PATROL, POLICE_CHASE, POLICE_SEE, POLICE_LOSE, POLICE_GIVE_UP, DOG_TYPES, DOG_BREEDS };
