import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateMap } from '../src/map/index.js';
import type { GeneratedMap, MapNode } from '../src/map/index.js';
import {
  advanceTurn,
  createInitialState,
  ATTRITION_PER_TURN,
  ENEMY_POWER_GROWTH_PER_TURN,
  REST_HEAL_RANGE,
} from '../src/game/index.js';

// Hand-built line map: 0(start) - 1(battle) - 2(boss)
function lineMap(middle: MapNode['type'] = 'battle'): GeneratedMap {
  const base = generateMap({ seed: 1, nodeCount: 3 });
  return {
    ...base,
    nodes: [
      { id: 0, x: 0, y: 0, type: 'start' },
      { id: 1, x: 1, y: 0, type: middle },
      { id: 2, x: 2, y: 0, type: 'boss' },
    ],
    edges: [
      { from: 0, to: 1, weight: 1 },
      { from: 1, to: 2, weight: 1 },
    ],
    startNodeId: 0,
    bossNodeId: 2,
  };
}

test('rest heals within range, then attrition and enemy growth apply', () => {
  const map = lineMap();
  const state = createInitialState(map, { seed: 5 });
  const next = advanceTurn(map, state, { type: 'rest' });
  const [min, max] = REST_HEAL_RANGE;
  const delta = next.factions.player.power - state.factions.player.power + ATTRITION_PER_TURN;
  assert.ok(delta >= min && delta <= max);
  assert.equal(next.factions.enemy.power, state.factions.enemy.power + ENEMY_POWER_GROWTH_PER_TURN);
  assert.equal(next.turnNumber, 1);
});

test('moving to a non-adjacent node is blocked but still costs a turn', () => {
  const map = lineMap();
  const state = createInitialState(map, { seed: 5 });
  const next = advanceTurn(map, state, { type: 'move', targetNodeId: 2 });
  assert.equal(next.currentNodeId, 0);
  assert.equal(next.lastTurnEvents[0].kind, 'blocked');
  assert.equal(next.turnNumber, 1);
});

test('one-shot nodes only fire on the first visit', () => {
  const map = lineMap('battle');
  let state = createInitialState(map, { seed: 5 });
  state = advanceTurn(map, state, { type: 'move', targetNodeId: 1 });
  assert.ok(state.lastTurnEvents.some((e) => e.kind === 'battle'));
  assert.deepEqual(state.clearedNodeIds, [1]);

  state = advanceTurn(map, state, { type: 'move', targetNodeId: 0 });
  state = advanceTurn(map, state, { type: 'move', targetNodeId: 1 });
  assert.ok(state.lastTurnEvents.some((e) => e.kind === 'nodeAlreadyCleared'));
  assert.ok(!state.lastTurnEvents.some((e) => e.kind === 'battle'));
});

test('reaching the boss with enough power wins; otherwise it counterattacks', () => {
  const map = lineMap('normal');
  let strong = createInitialState(map, { seed: 5, playerStartingPower: 500 });
  strong = advanceTurn(map, strong, { type: 'move', targetNodeId: 1 });
  strong = advanceTurn(map, strong, { type: 'move', targetNodeId: 2 });
  assert.equal(strong.status, 'won');
  assert.equal(advanceTurn(map, strong, { type: 'rest' }), strong, 'finished games ignore commands');

  let weak = createInitialState(map, { seed: 5, playerStartingPower: 50 });
  weak = advanceTurn(map, weak, { type: 'move', targetNodeId: 1 });
  weak = advanceTurn(map, weak, { type: 'move', targetNodeId: 2 });
  assert.equal(weak.status, 'ongoing');
  assert.ok(weak.lastTurnEvents.some((e) => e.kind === 'bossCounterattack'));
});

test('running out of power loses', () => {
  const map = lineMap();
  const state = createInitialState(map, { seed: 5, playerStartingPower: ATTRITION_PER_TURN });
  assert.equal(advanceTurn(map, state, { type: 'move', targetNodeId: 2 }).status, 'lost');
});
