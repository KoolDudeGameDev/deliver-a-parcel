# Deliver a Parcel

Blocky three.js delivery game. A static site of native ES modules, with no build step and no
dependencies to install. Live at <https://deliver-a-parcel.vercel.app>.

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
| `orders.js`, `dogs.js` | Orders, then dogs, which damage carried orders |
| `citizens.js`, `ghost.js` | Sidewalk walkers and their leashed dogs (`InstancedMesh`es), the White Lady |
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
- Vehicles auto-park at customer gates. That keeps the dog chase on foot, so don't remove it.
- A new saved field needs a default and a check in `loadSave()` in `save.js`.
- `main` is protected: changes go through a pull request.

## Checking changes

Run `npx serve -l 3000`, then drive the game through `window.game` in a real browser. Wait on
`requestAnimationFrame`, not timers, because the browser can hold frames while a script runs.
Check the console for errors, at desktop size and at 667×375 with `?touch`.
