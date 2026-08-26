export { createInitialState } from './state.js';
export type { CreateGameOptions } from './state.js';
export { advanceTurn } from './turn.js';
export { canMoveTo, getAdjacentNodeIds } from './movement.js';
export { resolveSkirmish, resolveBossEncounter } from './combat.js';
export type { BattleOutcome, BossEncounterOutcome } from './combat.js';
export { resolveNodeArrival } from './nodeEffects.js';
export type { NodeEffectResult } from './nodeEffects.js';
export {
  FACTION_IDS,
  DEFAULT_STARTING_POWER,
  ATTRITION_PER_TURN,
  BATTLE_DAMAGE_RANGE,
  BOSS_COUNTER_DAMAGE,
  EVENT_POWER_RANGE,
} from './constants.js';
export type { FactionId, FactionState, GameState, GameCommand, GameStatus, TurnEvent } from './types.js';
