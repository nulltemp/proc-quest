export { createInitialState } from './state.js';
export type { CreateGameOptions } from './state.js';
export { advanceTurn } from './turn.js';
export { canMoveTo, getAdjacentNodeIds } from './movement.js';
export { resolveSkirmish, resolveBossEncounter } from './combat.js';
export type { BattleOutcome, BossEncounterOutcome } from './combat.js';
export { resolveNodeArrival } from './nodeEffects.js';
export type { NodeEffectResult } from './nodeEffects.js';
export { pickItem, pickUpItem, useItem, consumeShieldIfPresent, ITEM_WEIGHTS } from './items.js';
export type { ItemWeight, ItemPickupResult, UseItemResult, ShieldConsumeResult } from './items.js';
export { formatGameStatus, formatMoveOptions, formatTurnEvents } from './renderGame.js';
export {
  FACTION_IDS,
  DEFAULT_STARTING_POWER,
  ATTRITION_PER_TURN,
  ENEMY_POWER_GROWTH_PER_TURN,
  REST_HEAL_RANGE,
  BATTLE_DAMAGE_RANGE,
  BOSS_COUNTER_DAMAGE,
  EVENT_POWER_RANGE,
  POWER_TONIC_RANGE,
  GUARDIAN_WARD_CHARGES,
} from './constants.js';
export type {
  FactionId,
  FactionState,
  ActiveEffect,
  ActiveEffectType,
  ItemType,
  Inventory,
  GameState,
  GameCommand,
  GameStatus,
  TurnEvent,
} from './types.js';
