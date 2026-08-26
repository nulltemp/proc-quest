# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

proc-quest has procedural 2D graph map generation plus a first playable turn/game loop, written in TypeScript (ESM).

- Language/build: TypeScript, compiled with `tsc` per `tsconfig.json` (`module`/`moduleResolution`: `NodeNext`, `target`: `ES2022`, `strict`: true). `package.json` has `"type": "module"`, so relative imports use explicit `.js` extensions even in `.ts` source (Node ESM requirement).
- Commands: `npm install` (installs `typescript`, `@types/node`, `vite` devDependencies), `npm run build` (compiles `index.ts` and `src/**/*.ts` into `dist/`, mirrored under `dist/src/...`), `npm start` or `node dist/index.js [seed]` (prints the generated map, then starts an interactive turn loop in the terminal — type a node id to move, `quit` to exit; passing a seed reproduces the same map *and* game RNG chain deterministically). `npm run dev`/`build:web`/`preview` run the separate Vite-based browser app in `web/`, which is now also a playable client for `src/game` (click a map node to move; a status/log panel and win/lose banner reflect `GameState`), not just a map viewer.
- No test runner is configured yet — `npm test` is still the default `npm init` stub.
- No git repository is initialized. `.gitignore` exists (ignoring `node_modules/` and `dist/`) for whenever one is.
- Source layout:
  - `index.ts` — thin CLI entry point: parses an optional seed arg, calls into `src/map` and `src/game`, prints the map, then runs the interactive per-turn prompt/response loop via `node:readline/promises`. The only file that touches `console.log`/`process.argv`/stdin.
  - `src/map/generateMap.ts` — core algorithm: random point sampling (rejection sampling for min spacing) → minimum spanning tree (Prim's) for guaranteed connectivity → k-nearest-neighbor proximity edges for an organic graph → farthest-pair BFS heuristic to place start/boss nodes → weighted node-type assignment. Exports `generateMap()`, a pure function of `(options)`, plus the `MapNode`/`MapEdge`/`MapConfig`/`GeneratedMap` types.
  - `src/map/rng.ts` — seeded PRNG (mulberry32, inlined since no external deps are used) so a given seed always reproduces the same map.
  - `src/map/nodeTypes.ts` — shared `NodeType` union and `NODE_TYPES`/`DEFAULT_TYPE_WEIGHTS` constants, reused by `src/game`.
  - `src/map/renderMap.ts` — pure string formatters (`formatMapAsText`, `formatMapAsAscii`); no I/O, reusable outside the CLI.
  - `src/map/index.ts` — barrel re-exporting the public API of `src/map`; other modules should import through this rather than reaching into individual files.
  - `src/game/types.ts` — `GameState`/`FactionState`/`GameCommand`/`TurnEvent` types.
  - `src/game/constants.ts` — all tunable numbers (starting power, attrition/turn, battle damage range, boss counter damage, event power range) and `FACTION_IDS`; every number here is a placeholder default, not a spec-derived value (the design spec doesn't define any of this yet — see below).
  - `src/game/movement.ts` — `canMoveTo`/`getAdjacentNodeIds`, adjacency checks over a `GeneratedMap`'s (undirected) edges.
  - `src/game/combat.ts` — `resolveSkirmish` (rng-driven mutual damage for `battle` nodes) and `resolveBossEncounter` (deterministic power-comparison for the `boss` node, no rng).
  - `src/game/nodeEffects.ts` — `resolveNodeArrival`, dispatches the above by the arrived `MapNode`'s `type`.
  - `src/game/state.ts` — `createInitialState(map, options)`, builds the starting `GameState` at `map.startNodeId`.
  - `src/game/turn.ts` — `advanceTurn(map, state, command)`, the pure per-turn orchestrator (movement → node effects → attrition → win/lose check → next rng seed derivation). Only `move` is a supported `GameCommand` today.
  - `src/game/renderGame.ts` — pure string formatters for game state/events (`formatGameStatus`, `formatMoveOptions`, `formatTurnEvents`); no I/O, mirrors `src/map/renderMap.ts`'s role.
  - `src/game/index.ts` — barrel re-exporting the public API of `src/game`.
  - `web/` — a separate Vite app that both visualizes and plays the game in the browser:
    - `web/render.ts` — `renderMapToSvg(map, highlights?: MapHighlights)`, a pure SVG renderer; `MapHighlights` (`currentNodeId`/`reachableNodeIds`) adds `node-current`/`node-reachable` classes to the relevant node circles. No I/O, no click handling — mirrors `src/map/renderMap.ts`'s pure-formatter role.
    - `web/main.ts` — the stateful driver (module-level `map`/`gameState`), the only file with DOM/event-listener code. `regenerate()` builds a new map *and* a new `GameState` (seed input, regenerate/random buttons all start a fresh game); a delegated click listener on `#map-container` reads a clicked node's `data-id` and calls `advanceTurn` — any node is clickable, not just adjacent ones, so a non-adjacent click still consumes a turn via the engine's `blocked` event rather than being pre-validated in the UI. `formatGameStatus`/`formatMoveOptions`/`formatTurnEvents` from `src/game` are reused as-is (dumped into `white-space: pre-line` panels) rather than re-implemented for the DOM.
    - `web/index.html`/`style.css` — status panel, turn log (accumulates every turn, unlike the CLI's scrolling terminal), and a win/lose banner (`#banner.banner-won`/`.banner-lost`), alongside the pre-existing seed controls and legend.
- `docs/specification.md` is the design spec (see below). It only defines the win/lose conditions and the coarse turn-based/graph-map framing — it does **not** specify how faction power should update, what player commands should exist beyond movement, or combat mechanics. `src/game`'s current turn loop, faction model (two factions, `player`/`enemy`, single power scalar each), and combat resolution are all first-pass placeholder assumptions built to make the spec's win/lose conditions concrete and playable; treat the numbers in `src/game/constants.ts` and the mechanics in `src/game/combat.ts`/`nodeEffects.ts` as provisional, not authoritative, until the spec is fleshed out further.

Do not assume commands or architecture beyond what's described above without checking the actual files — this section should be kept in sync as more of the game (richer commands, real combat, factions beyond player/enemy) is implemented.

## Design intent

`docs/specification.md` (written in Japanese) is the source of truth for the intended game design. Summary:

- A command-selection RPG with automatic/procedural map generation.
- The map is a 2D graph structure (nodes/points connected by edges, not a grid) — the player moves between nodes.
- At the end of every turn, all factions'/powers' strength is updated globally.
- Win condition: defeat the enemy boss.
- Lose condition: the player's own faction's power is depleted.

Refer back to `docs/specification.md` for the authoritative (Japanese) spec as the design evolves.
