import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateMap } from '../src/map/index.js';
import { applyCommand, startSession } from '../src/game/index.js';
import { POLICIES, simulateGame, simulateMany, summarize } from '../src/sim/index.js';

test('simulations are deterministic per seed and always terminate', () => {
  for (const policy of Object.values(POLICIES)) {
    const options = { games: 20, startSeed: 1, nodeCount: 20, maxTurns: 300, policy };
    const results = simulateMany(options);
    assert.deepEqual(simulateMany(options), results);
    for (const r of results) assert.ok(r.turns <= 300);

    const summary = summarize(results);
    assert.equal(summary.wins + summary.losses + summary.timeouts, summary.games);
  }
});

test('the greedy policy never attempts an illegal move', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const map = generateMap({ seed });
    let session = startSession(map, { seed });
    while (session.state.status === 'ongoing' && session.state.turnNumber < 1000) {
      session = applyCommand(session, POLICIES.greedy(map, session.state, Math.random));
      assert.ok(!session.state.lastTurnEvents.some((e) => e.kind === 'blocked' || e.kind === 'itemUseFailed'));
    }
  }
});

test('the greedy policy beats random play', () => {
  const run = (policy: (typeof POLICIES)[keyof typeof POLICIES]) =>
    summarize(simulateMany({ games: 50, startSeed: 1, nodeCount: 20, maxTurns: 1000, policy })).winRate;
  assert.ok(run(POLICIES.greedy) > run(POLICIES.random));
});

test('simulateGame reports the final state', () => {
  const result = simulateGame({ seed: 11, nodeCount: 12, maxTurns: 1000, policy: POLICIES.greedy });
  assert.equal(result.seed, 11);
  assert.notEqual(result.outcome, 'timeout');
});
