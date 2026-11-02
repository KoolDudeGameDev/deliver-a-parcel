# Game design

This is the plan for how Deliver a Parcel should grow. It's a living document, so suggest changes
in a pull request. The numbers are starting values, and real play should overrule them.

## What the game is

You start with a cardboard box. You deliver food and parcels against the clock, dodge dogs in
people's yards, and spend what you earn turning the box into a mansion and your skateboard into a
moped with a sidecar.

Three things make it feel like this game and not another delivery simulator:

- **The dog chase.** Vehicles stop at the gate, so the last stretch is always on foot and always
  risky.
- **Upgrades you can see.** Bigger tires, a sidecar and a two-storey house all show up in the world.
- **Filipino flavour.** Sari-sari stores, the apartment tombs, Aspins, the White Lady.

Every new mechanic should strengthen at least one of those.

## The loop today

1. Choose an order from the board at the hub, or a shady job after dark.
2. Ride out, park at the gate, and get past the chaser or the White Lady to the door.
3. Get paid, with a tip for speed and condition, plus any streak, regular or event bonus.
4. Spend at the dealer, the mechanic or home, and go back out faster, carrying more.

## Where the numbers stand

| What | Amount |
| --- | --- |
| A delivery, worked out from the formulas | About ₱50 for an easy one, ₱100 on average, ₱340 for the best night rush |
| Home levels | ₱14,900 |
| The first four vehicles | ₱10,700 |
| Their parts | ₱15,650 |
| The main climb | ₱41,250, about 400 average deliveries, or roughly 4 to 5 hours |
| Motorcycle, tricycle and their parts | ₱42,000 more, for after that |

Paint and garden items are cheap and on sale from the start. Skin and clothes are free, on the intro.

## The plan

### Phase 1: make every delivery a decision (done)

The order board, difficulty stars, star rating, order types, sound, and night jobs with police.

### Phase 2: give players a reason to return (done)

Daily goals, streaks, regular customers, paint, clothes, garden items and pets.

### Phase 3: make the world surprising (done)

Rain, brownouts, fiesta, Undas, traffic, cats and geese.

### Phase 4: play together (first step built)

Seven players can share a world, see each other, see each other's homes, and compare what they're worth and their rating on the order board.
It needs a small always-on server, about US$2–3 a month, and the steps are in the README.

Still to do:

1. **Shared dogs and orders,** so everyone sees the same chase.
2. **Compete for the same order.** First to the door gets the pay.
3. **Team up.** Big parcels that need two riders.

## Balance questions to test with real players

- Is the ₱15 fine for hitting a citizen enough to make you care?
- Is the White Lady scary or just annoying? Try her speed, 3.4 m/s, first.
- Does the 35% vehicle sprint make dogs and timers too easy on the road?
- Does the night bonus actually get people out after dark?
- How long should the climb from box to mansion take?
- Is a shady job worth the risk of losing 25% of your cash?
- Can police be escaped too easily by hiding in a yard?

## Rules for new mechanics

- Keep it playable on a phone: touch controls, and draw calls near 100.
- Prefer one new table row to new code.
- Anything saved needs a check in `loadSave()`.
- Nothing should move the seven home sites. Their places depend on the order of `rnd()` calls.
