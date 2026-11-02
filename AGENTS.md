# Deliver a Parcel

Blocky three.js delivery game. A static site of native ES modules, with no build step and no
dependencies to install. `server/` holds the optional multiplayer server, which uses `ws`. Live at <https://deliver-a-parcel.vercel.app>.

## Layout

- `index.html`: page markup and the import map. `css/style.css`: styles.
- `vendor/three.module.js`: unmodified three.js r170. Don't edit it.
- `start.bat`: local server on port 3000 for Windows.

## Modules in `src/`, lowest level first

Imports only point up this list. There are no circular imports, so keep it that way.

| File | Owns |
| --- | --- |
| `util.js`, `state.js`, `config.js` | Helpers, values several files write, tuning numbers, `DOG_TYPES` and `DOG_BREEDS` |
| `engine.js` | Renderer, scene, sky, `box`, `block`, `instanced`, colliders, `sign` |
| `data/vehicles.js`, `data/homes.js` | `VEHICLES` with `parts`, `HOMES` |
| `world.js` | `ROADS`, `HOUSES`, `LOTS` (the seven home sites), trees, baking |
| `daynight.js`, `player.js` | Day cycle, the player and their model |
| `save.js` | `save`, `loadSave`, `rideStats` |
| `data/orderTypes.js`, `audio.js` | Order types, and `SOUNDS` with `play()` |
| `orders.js`, `dogs.js` | Offers and orders, then dogs, which call `hurtOrders` |
| `citizens.js`, `ghost.js` | Walkers, leashed dogs and pickleball players (`InstancedMesh`es), the White Lady |
| `hub.js`, `board.js`, `contraband.js`, `police.js` | Conveyor, order board, night jobs, police |
| `goals.js`, `events.js`, `traffic.js` | Daily goals and streaks, weather and festivals, road traffic |
| `shop.js`, `actions.js` | Shop panel, and what the action button does at each place |
| `net.js` | Multiplayer client, off unless `MULTIPLAYER_URL` or `?server=` is set |
| `home.js` | Upgrade panel, `action`, mounting and parking vehicles |
| `input.js`, `movement.js`, `camera.js` | Controls and per-frame movement |
| `hud.js`, `minimap.js` | On-screen display |
| `main.js` | Boot, the frame loop, the `window.game` test handle |

A value written from more than one file goes in `state.js`. A value only read elsewhere stays in
its owner, because ES module exports are read-only to importers.

## Rules

- `rnd()` in `world.js` is seeded so the map is the same for everyone. Inserting a call changes
  everything after it, including the home sites.
- Static boxes go through `block()` and become `InstancedMesh`es. Moving things use `box()`.
- Keep draw calls near 100 in the phone setup (`?touch` in the URL). Check `renderer.info.render.calls`.
  Far signs and homes are hidden through `distant` in `engine.js`, and chasers beyond 90m in `dogs.js`.
- Treat everything the server receives as untrusted, as `server/server.js` does.
- Vehicles auto-park at customer gates. That keeps the dog chase on foot, so don't remove it.
- A new saved field needs a default and a check in `loadSave()` in `save.js`.
- Prefer sound clips with a confirmed free licence. Every clip goes in `assets/sfx/CREDITS.md`, with
  anything not free listed under "Not CC0".
- `main` is protected: changes go through a pull request.

## Checking changes

Run `npx serve -l 3000`, then drive the game through `window.game` in a real browser. Wait on
`requestAnimationFrame`, not timers, because the browser can hold frames while a script runs.
Check the console for errors, at desktop size and at 667×375 with `?touch`.
