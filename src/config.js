// Tuning numbers for the player, orders and dogs. Everything worth playing with lives here.

const RUN = 6, SPRINT = 9.5, RIDE_SPRINT = 1.35, PARCEL_SLOW = 0.75, JUMP_V = 9, GRAVITY = 26;
const FOOD_TIME = 8, PARCEL_TIME = 14, FOOD_PAY = 30, PARCEL_PAY = 25, FAR_PAY = .4;
const DOG_TYPES = {
  tiny:   { scale: .45, speed: 8.2, knock: 3,  stun: .05, damage: 5,  color: 0xe8d0a9, name: 'Tiny dog' },
  small:  { scale: .65, speed: 7.5, knock: 5,  stun: .15, damage: 10, color: 0xc9915a, name: 'Small dog' },
  medium: { scale: 1,   speed: 6.3, knock: 8,  stun: .35, damage: 18, color: 0x9a6a45, name: 'Medium dog' },
  big:    { scale: 1.35, speed: 5.4, knock: 13, stun: .7, damage: 30, color: 0x5f5f6b, name: 'Big dog' },
  giant:  { scale: 1.9, speed: 4.6, knock: 19, stun: 1.1, damage: 45, color: 0x2f2f38, name: 'Giant dog' },
};

export { RUN, SPRINT, RIDE_SPRINT, PARCEL_SLOW, JUMP_V, GRAVITY, FOOD_TIME, PARCEL_TIME, FOOD_PAY, PARCEL_PAY, FAR_PAY, DOG_TYPES };
