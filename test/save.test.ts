import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateMap } from '../src/map/index.js';
import {
  applyCommand,
  getAdjacentNodeIds,
  parseSave,
  replayTurns,
  SaveFormatError,
  serializeSave,
  startSession,
} from '../src/game/index.js';
import type { GameSession } from '../src/game/index.js';

function playSome(turns: number): GameSession {
  const map = generateMap({ seed: 99 });
  let session = startSession(map, { seed: 99 });
  for (let i = 0; i < turns && session.state.status === 'ongoing'; i++) {
    const adjacent = getAdjacentNodeIds(map, session.state.currentNodeId);
    session = applyCommand(session, i % 3 === 2 ? { type: 'rest' } : { type: 'move', targetNodeId: adjacent[i % adjacent.length] });
  }
  return session;
}

test('a session round-trips through serializeSave/parseSave', () => {
  const session = playSome(10);
  assert.deepEqual(parseSave(serializeSave(session)), session);
});

test('replaying the recorded commands reproduces the saved state', () => {
  const session = playSome(15);
  const loaded = parseSave(serializeSave(session));
  const states = replayTurns(loaded.map, loaded.initialState, loaded.commands);
  assert.equal(states.length, loaded.commands.length);
  assert.deepEqual(states.at(-1), loaded.state);
});

test('a loaded game continues identically to the original', () => {
  const session = playSome(5);
  const loaded = parseSave(serializeSave(session));
  const command = { type: 'rest' } as const;
  assert.deepEqual(applyCommand(loaded, command).state, applyCommand(session, command).state);
});

test('applyCommand is a no-op once the game is over', () => {
  const session = playSome(0);
  const finished = { ...session, state: { ...session.state, status: 'lost' as const } };
  assert.equal(applyCommand(finished, { type: 'rest' }), finished);
});

test('parseSave rejects malformed saves', () => {
  const valid = JSON.parse(serializeSave(playSome(3)));
  const cases: unknown[] = [
    'not json',
    [],
    { ...valid, version: 999 },
    { ...valid, map: { ...valid.map, nodes: [] } },
    { ...valid, state: { ...valid.state, currentNodeId: valid.map.nodes.length } },
    { ...valid, state: { ...valid.state, status: 'paused' } },
    { ...valid, commands: [{ type: 'fly' }] },
    { ...valid, commands: [{ type: 'useItem', itemType: 'excalibur' }] },
  ];
  for (const bad of cases) {
    const json = typeof bad === 'string' ? bad : JSON.stringify(bad);
    assert.throws(() => parseSave(json), SaveFormatError, json.slice(0, 80));
  }
});
