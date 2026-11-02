# Deliver a Parcel

A blocky 3D delivery game that runs in your browser, on a computer or a phone. Start with a
cardboard box, deliver food and parcels against the clock, and build it up into a mansion.
Watch out for the dogs.

**Play it now: <https://deliver-a-parcel.vercel.app>**

## How it plays

- Choose an order from the board at the hub, the green dot on the minimap, then follow the yellow
  dot. Each one shows its difficulty, from 1 to 5 stars. Good ratings unlock harder orders.
- Food pays better when it's fast. Parcels are heavy and slow you down.
- Yards have dogs, from a quick little Chihuahua to a Great Dane that hits hard. You always walk
  through a gate, so the chase stays on foot.
- Some parcels go to the cemetery. Park at the gate and find your way between the tombs to the
  right grave.
- Citizens walk the sidewalks. Hit one at speed and it costs you money and damages your orders.
- After dark, deliveries pay 30% more. The graveyard has candles lit, and something else is
  out there too.
- At night, dealers offer shady packages for big money. Police will chase you while you carry one,
  and getting caught costs 25% of your cash and all your orders.
- Spend your cash at home, the blue dot. Upgrade your house for better pay, and upgrade your ride
  with bigger wheels, baskets and sidecars so you can carry more orders.

| Action | Keyboard and mouse | Phone |
| --- | --- | --- |
| Move | WASD or arrow keys | Left thumb |
| Look | Drag | Right thumb |
| Sprint | Shift | SPRINT |
| Jump | Space | JUMP |
| Open the order board, open your home | E | ACTION |
| Mute | M, or the Sound button | Sound button |

Your progress saves in your browser, so it doesn't follow you to another device.

The game is single-player for now. Each person plays their own copy, and nobody sees anyone else.
Multiplayer for up to seven players is the next big goal.

## Run it locally

You need [Node.js](https://nodejs.org). From this folder, run:

```sh
npx serve -l 3000
```

Then open <http://localhost:3000>. On Windows you can double-click `start.bat` instead. Opening
`index.html` directly won't work, because browsers block the module import from `file://`.

## How the code is laid out

There's no build step and no dependencies to install. It's plain JavaScript modules that the
browser loads directly, so you edit a file and refresh.

```text
index.html          page markup: HUD, touch buttons, dialogs
css/style.css       all styling
vendor/             unmodified three.js r170
assets/sfx/         sound clips, with their sources in CREDITS.md
src/
  main.js           starts the game and runs the frame loop
  config.js         tuning numbers, dog sizes and breeds
  data/
    vehicles.js     vehicles, their upgrade parts and models
    homes.js        the house ladder and models
    orderTypes.js   fragile, rush, bulky and normal orders
  engine.js         renderer, scene, lights, and world-building helpers
  world.js          the map: roads, houses, home sites, trees
  daynight.js       the day-to-night cycle
  player.js         the player character
  dogs.js           dog behaviour
  citizens.js       people walking the sidewalks, some with dogs
  ghost.js          the White Lady
  orders.js         taking and delivering orders
  home.js           your home, upgrades, and riding
  board.js          the order board
  hub.js            the conveyor in the orders building
  contraband.js     night jobs
  police.js         police cars and arrests
  audio.js          sound effects
  save.js           saved progress
  input.js          keyboard, mouse and touch
  movement.js       moves the player each frame
  camera.js         the follow camera
  hud.js            cash, stamina, order card, hints
  minimap.js        the minimap
  state.js          the few values several files share
  util.js           small helpers
```

Most new content is one new row in a table. Add an order type in `src/data/orderTypes.js`, or a
sound in `src/audio.js` with a line in `assets/sfx/CREDITS.md`. Add a dog breed in `src/config.js`, then give it to a
house in `src/world.js`. Add a vehicle or part in `src/data/vehicles.js`, or a house level in
`src/data/homes.js`.

## Contributing

Friends and strangers are both welcome.

`main` is protected, so every change goes through a pull request and needs one approval.

1. Fork the repo, or ask for access, and make a branch.
2. Make one change at a time, and keep it to one pull request.
3. Play it at desktop size and at phone size before you open the pull request.
4. Check the browser console has no errors, and say in the pull request what you tested.

Once a pull request is merged, it goes live on its own. Vercel also builds a preview of each pull
request, but previews are private to the project's Vercel team, so test on your own machine.

Keep it simple: no build step, and no new dependency for something a few lines can do.

Good places to start:

- Sound effects, because the game has none yet
- More vehicles and parts
- Cats, geese and other things that chase you
- Balancing prices, timers and pay
- Multiplayer

## License

The code is [MIT](LICENSE). The bundled three.js is also MIT, with its copyright notice kept at the top
of `vendor/three.module.js`. Sound clips have their own terms: see `assets/sfx/CREDITS.md`, because one
of them isn't covered by the MIT license.
