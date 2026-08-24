# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

proc-quest has an initial implementation: procedural 2D graph map generation, written in TypeScript (ESM).

- Language/build: TypeScript, compiled with `tsc` per `tsconfig.json` (`module`/`moduleResolution`: `NodeNext`, `target`: `ES2022`, `strict`: true). `package.json` has `"type": "module"`, so relative imports use explicit `.js` extensions even in `.ts` source (Node ESM requirement).
- Commands: `npm install` (installs `typescript` and `@types/node` devDependencies), `npm run build` (compiles `index.ts` and `src/**/*.ts` into `dist/`), `npm start` or `node dist/index.js [seed]` (runs the map generator demo — prints a node/edge text listing and an ASCII scatter plot to the console; passing a seed reproduces the same map deterministically).
- No test runner is configured yet — `npm test` is still the default `npm init` stub.
- No git repository is initialized. `.gitignore` exists (ignoring `node_modules/` and `dist/`) for whenever one is.
- Source layout:
  - `index.ts` — thin CLI entry point (parses an optional seed arg, calls into `src/map`, prints output). The only file that touches `console.log`/`process.argv`.
  - `src/map/generateMap.ts` — core algorithm: random point sampling (rejection sampling for min spacing) → minimum spanning tree (Prim's) for guaranteed connectivity → k-nearest-neighbor proximity edges for an organic graph → farthest-pair BFS heuristic to place start/boss nodes → weighted node-type assignment. Exports `generateMap()`, a pure function of `(options)`, plus the `MapNode`/`MapEdge`/`MapConfig`/`GeneratedMap` types.
  - `src/map/rng.ts` — seeded PRNG (mulberry32, inlined since no external deps are used) so a given seed always reproduces the same map.
  - `src/map/nodeTypes.ts` — shared `NodeType` union and `NODE_TYPES`/`DEFAULT_TYPE_WEIGHTS` constants, meant to be imported by future turn/faction modules instead of re-typing string literals.
  - `src/map/renderMap.ts` — pure string formatters (`formatMapAsText`, `formatMapAsAscii`); no I/O, reusable outside the CLI.
  - `src/map/index.ts` — barrel re-exporting the public API of `src/map`; other modules should import through this rather than reaching into individual files.
- `docs/specification.md` is the design spec (see below). Turn logic, faction power updates, and combat are not implemented yet — only map generation.

Do not assume commands or architecture beyond what's described above without checking the actual files — this section should be kept in sync as more of the game (turns, factions, combat) is implemented.

## Design intent

`docs/specification.md` (written in Japanese) is the source of truth for the intended game design. Summary:

- A command-selection RPG with automatic/procedural map generation.
- The map is a 2D graph structure (nodes/points connected by edges, not a grid) — the player moves between nodes.
- At the end of every turn, all factions'/powers' strength is updated globally.
- Win condition: defeat the enemy boss.
- Lose condition: the player's own faction's power is depleted.

Refer back to `docs/specification.md` for the authoritative (Japanese) spec as the design evolves.
