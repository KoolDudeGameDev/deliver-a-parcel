# Deliver a Parcel

A blocky 3D delivery game that runs in your browser, on a computer or a phone. Start with a
cardboard box, deliver food and parcels against the clock, and build it up into a mansion.
Watch out for the dogs.

**Play it now: <https://deliver-a-parcel.vercel.app>**

## How it plays

- Take orders at the hub, marked by the green dot on the minimap, then follow the yellow dot.
- Food pays better when it's fast. Parcels are heavy and slow you down.
- Yards have dogs in five sizes. Tiny ones are quick, and giant ones hit hard. You always walk
  through a gate, so the chase stays on foot.
- Spend your cash at home, the blue dot. Upgrade your house for better pay, and upgrade your ride
  with bigger wheels, baskets and sidecars so you can carry more orders.

| Action | Keyboard and mouse | Phone |
| --- | --- | --- |
| Move | WASD or arrow keys | Left thumb |
| Look | Drag | Right thumb |
| Sprint | Shift | SPRINT |
| Jump | Space | JUMP |
| Take an order, open your home | E | ACTION |

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

There's no build step and no dependencies to install. Everything is in `index.html`, apart from
`three.module.js`, an unmodified copy of [three.js](https://threejs.org) r170.

The tuning lives at the top of the game script. Dogs, vehicles, parts and homes are plain tables,
so a new dog size or vehicle upgrade is usually one new row.

## Contributing

Friends and strangers are both welcome.

1. Fork the repo, or ask for access, and make a branch.
2. Make one change at a time, and keep it to one pull request.
3. Play it at desktop size and at phone size before you open the pull request.
4. Check the browser console has no errors, and say in the pull request what you tested.

Keep it simple: no build step, and no new dependency for something a few lines can do.

Good places to start:

- Sound effects, because the game has none yet
- More vehicles and parts
- Cats, geese and other things that chase you
- Balancing prices, timers and pay
- Multiplayer

## License

[MIT](LICENSE). The bundled three.js is also MIT, with its copyright notice kept at the top of
`three.module.js`.
