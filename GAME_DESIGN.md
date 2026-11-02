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
2. Ride out, park at the gate, and get past the dog or the White Lady to the door.
3. Get paid, with a tip for speed and condition.
4. Go home, spend, and go back out faster, carrying more.

## Where the numbers stand

| What | Amount |
| --- | --- |
| A delivery, worked out from the formulas | About ₱66 for an easy one, up to about ₱780 for a far 5-star rush at night with a mansion |
| All five home levels | ₱13,300 |
| All three vehicles | ₱2,150 |
| All vehicle parts | ₱11,130 |
| Everything | ₱26,580 |

That's far too quick. Tips, star pay, order types, home bonus and night pay all multiply together, so about 35 top orders can buy everything. Rebalancing this is the next job.

## What's missing

- **Nothing to do after the mansion.** Once you've bought everything, cash means nothing.
- **Little reason to come back tomorrow.**

## The plan

### Phase 1: make every delivery a decision (done)

- **Order board.** The hub offers three orders with their difficulty, pay and time.
- **Difficulty stars.** 1 is a nearby house with no dog, and 5 is the hardest, from distance, dog
  size and night risk. Harder orders pay more.
- **Star rating.** Each delivery earns one to five stars, and a good average unlocks harder orders.
- **Order types.** Fragile parcels take double damage, rush orders pay double with little time, and
  bulky parcels need a sidecar.
- **Sound.** Free-to-use clips and a generated siren, with a mute button.
- **Night jobs.** After dark, dealers offer shady packages for high pay. Police patrol the rings and
  chase anyone carrying one, and an arrest costs 25% of your cash and every order.

### Phase 2: give players a reason to return

1. **Daily goals.** Three small goals a day, such as "deliver to the cemetery at night" or "get
   past five giant dogs."
2. **Streaks.** Deliveries in a row with no bites pay a growing bonus, which a dog can break.
3. **Things to buy after the mansion.** Paint for your house and vehicles, garden decorations,
   character outfits, and pets that wait at your home.
4. **Regular customers.** People who remember you and tip better over time.

### Phase 3: make the world surprising

1. **Rain.** Slippery roads, less grip and better pay.
2. **Brownouts.** The streetlights go out across town for a minute, and only your headlight helps.
3. **Events.** Undas fills the graveyard with visitors and candles, and a barangay fiesta closes
   off a street.
4. **More chasers.** Geese, cats and a tiyanak at the graveyard.
5. **Traffic.** Tricycles and jeepneys on the roads, to dodge at speed.

### Phase 4: play together

Multiplayer needs a small always-on server, about US$2–3 a month. See the README for the status.

1. **See each other.** Names, positions, vehicles and the seven homes.
2. **Compete for the same order.** First to the door gets the pay.
3. **Team up.** Big parcels that need two riders, and shared dog distractions.
4. **Visit homes and compare.** Show off your mansion, with a weekly leaderboard.

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
