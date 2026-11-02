# Deliver a Parcel

Blocky three.js delivery game. Static site with no build step and no dependencies to install.
Live at <https://deliver-a-parcel.vercel.app>.

## Layout

- `index.html`: the whole game, as styles, HUD markup and one module script.
- `three.module.js`: unmodified three.js r170. Don't edit it.
- `start.bat`: local server on port 3000 for Windows.

## Game script, in order

1. Tuning: `DOG_TYPES`, `VEHICLES` (with `parts`), `HOMES`. New content is usually one table row.
2. Renderer, sky and lights.
3. World: roads, `HOUSES`, towers, lamps, `LOTS` (the seven home sites), trees.
4. Baking: static boxes go through `block()` and become `InstancedMesh`es. Moving things use `box()`.
5. `updateDay`, then player, dogs, save, orders, home and upgrades, input, movement, camera, HUD, minimap.

## Rules

- `rnd()` is seeded so the map is the same for everyone. Inserting a call changes everything after it.
- Keep draw calls near 100 in the phone setup (`?touch` in the URL). Check `renderer.info.render.calls`.
- Vehicles auto-park at customer gates. That keeps the dog chase on foot, so don't remove it.
- `save` is validated in `loadSave()`. A new saved field needs a default and a check there.

## Checking changes

Run `npx serve -l 3000`, then drive the game through `window.game` in a real browser. Wait on
`requestAnimationFrame`, not timers, because the browser can hold frames while a script runs.
Check the console for errors, at desktop size and at 667×375 with `?touch`.
