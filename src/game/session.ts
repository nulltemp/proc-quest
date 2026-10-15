import type { GeneratedMap } from '../map/index.js';
import { createInitialState, type CreateGameOptions } from './state.js';
import { advanceTurn } from './turn.js';
import type { GameCommand, GameState } from './types.js';

/**
 * Everything needed to resume or replay a game: the map, the state the game
 * started from, every command issued so far, and the current state. `state`
 * is always equal to replaying `commands` over `initialState` with the engine
 * version that produced it.
 */
export interface GameSession {
  map: GeneratedMap;
  initialState: GameState;
  commands: GameCommand[];
  state: GameState;
}

export function startSession(map: GeneratedMap, options: CreateGameOptions = {}): GameSession {
  const initialState = createInitialState(map, options);
  return { map, initialState, commands: [], state: initialState };
}

/** Advances the session by one turn, recording the command. A no-op once the game is over. */
export function applyCommand(session: GameSession, command: GameCommand): GameSession {
  if (session.state.status !== 'ongoing') return session;
  return {
    ...session,
    commands: [...session.commands, command],
    state: advanceTurn(session.map, session.state, command),
  };
}

/**
 * Replays `commands` from `initialState`, returning the state after each turn
 * (so `result[i].lastTurnEvents` are turn i+1's events). Useful for rebuilding
 * a turn log after loading, or for checking a save against the current engine.
 */
export function replayTurns(map: GeneratedMap, initialState: GameState, commands: GameCommand[]): GameState[] {
  const states: GameState[] = [];
  let state = initialState;
  for (const command of commands) {
    state = advanceTurn(map, state, command);
    states.push(state);
  }
  return states;
}
