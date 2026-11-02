// What kinds of order the board can offer. A new type is one more row. stars adds to the order's
// difficulty, pay and time multiply it, damage multiplies anything that hurts it, parcelOnly rules
// out food, and minCarry is how much your ride has to carry to take it on.
const ORDER_TYPES = {
  normal: { label: '', weight: 5, stars: 0, pay: 1, time: 1, damage: 1 },
  fragile: { label: 'Fragile', weight: 2, stars: 1, pay: 1.25, time: 1, damage: 2, parcelOnly: true },
  rush: { label: 'Rush', weight: 2, stars: 1, pay: 1.5, time: .55, damage: 1 },
  bulky: { label: 'Bulky', weight: 1, stars: 1, pay: 1.4, time: 1.2, damage: 1, parcelOnly: true, minCarry: 3 },
};
const ORDER_KEYS = Object.keys(ORDER_TYPES);

export { ORDER_TYPES, ORDER_KEYS };
