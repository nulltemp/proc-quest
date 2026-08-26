import { BATTLE_DAMAGE_RANGE, BOSS_COUNTER_DAMAGE } from './constants.js';

export interface BattleOutcome {
  playerDamage: number;
  enemyDamage: number;
}

export interface BossEncounterOutcome {
  victorious: boolean;
  counterDamage: number;
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function resolveSkirmish(rng: () => number): BattleOutcome {
  const [min, max] = BATTLE_DAMAGE_RANGE;
  return {
    playerDamage: randomInt(rng, min, max),
    enemyDamage: randomInt(rng, min, max),
  };
}

export function resolveBossEncounter(playerPower: number, enemyPower: number): BossEncounterOutcome {
  const victorious = playerPower >= enemyPower;
  return { victorious, counterDamage: victorious ? 0 : BOSS_COUNTER_DAMAGE };
}
