import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateMap, sizedMapConfig } from '../src/map/index.js';
import { getAdjacentNodeIds, getShortestPath } from '../src/game/index.js';

test('generateMap is deterministic for a given seed', () => {
  assert.deepEqual(generateMap({ seed: 42 }), generateMap({ seed: 42 }));
});

test('generated maps are connected and place start/boss apart', () => {
  for (const nodeCount of [8, 20, 80]) {
    for (let seed = 1; seed <= 20; seed++) {
      const map = generateMap({ ...sizedMapConfig(nodeCount), seed });
      assert.equal(map.nodes.length, nodeCount);
      assert.notEqual(map.startNodeId, map.bossNodeId);
      for (const node of map.nodes) {
        assert.ok(getShortestPath(map, map.startNodeId, node.id), `seed ${seed}: node ${node.id} unreachable`);
      }
    }
  }
});

test('getShortestPath returns a valid fewest-moves path', () => {
  const map = generateMap({ seed: 7 });
  assert.deepEqual(getShortestPath(map, 3, 3), []);

  const path = getShortestPath(map, map.startNodeId, map.bossNodeId)!;
  assert.equal(path.at(-1), map.bossNodeId);
  let at = map.startNodeId;
  for (const step of path) {
    assert.ok(getAdjacentNodeIds(map, at).includes(step));
    at = step;
  }
  // BFS optimality: no neighbor of the start is the boss unless the path has length 1.
  if (path.length > 1) assert.ok(!getAdjacentNodeIds(map, map.startNodeId).includes(map.bossNodeId));
});
