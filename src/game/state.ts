import type { GeneratedMap } from '../map/index.js';
import { DEFAULT_STARTING_POWER, FACTION_IDS } from './constants.js';
import type { GameState } from './types.js';

export interface CreateGameOptions {
  seed?: number;
  playerStartingPower?: number;
  enemyStartingPower?: number;
}

export function createInitialState(map: GeneratedMap, options: CreateGameOptions = {}): GameState {
  return {
    currentNodeId: map.startNodeId,
    factions: {
      [FACTION_IDS.PLAYER]: {
        id: FACTION_IDS.PLAYER,
        power: options.playerStartingPower ?? DEFAULT_STARTING_POWER,
        activeEffects: [],
      },
      [FACTION_IDS.ENEMY]: {
        id: FACTION_IDS.ENEMY,
        power: options.enemyStartingPower ?? DEFAULT_STARTING_POWER,
        activeEffects: [],
      },
    },
    turnNumber: 0,
    status: 'ongoing',
    rngSeed: options.seed ?? Math.floor(Math.random() * 2 ** 31),
    lastTurnEvents: [],
  };
}
