import type { FactionId } from './types.js';

export const FACTION_IDS = {
  PLAYER: 'player',
  ENEMY: 'enemy',
} as const satisfies Record<'PLAYER' | 'ENEMY', FactionId>;

export const DEFAULT_STARTING_POWER = 100;
export const ATTRITION_PER_TURN = 1;
export const BATTLE_DAMAGE_RANGE: readonly [number, number] = [5, 15];
export const BOSS_COUNTER_DAMAGE = 30;
export const EVENT_POWER_RANGE: readonly [number, number] = [-10, 10];
export const POWER_TONIC_RANGE: readonly [number, number] = [15, 25];
export const GUARDIAN_WARD_CHARGES = 1;
