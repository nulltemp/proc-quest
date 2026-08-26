import type { MapNode } from '../map/index.js';
import { resolveSkirmish, resolveBossEncounter, randomInt } from './combat.js';
import { EVENT_POWER_RANGE } from './constants.js';
import type { FactionState, TurnEvent } from './types.js';

export interface NodeEffectResult {
  player: FactionState;
  enemy: FactionState;
  events: TurnEvent[];
}

export function resolveNodeArrival(
  node: MapNode,
  rng: () => number,
  player: FactionState,
  enemy: FactionState,
): NodeEffectResult {
  switch (node.type) {
    case 'battle': {
      const outcome = resolveSkirmish(rng);
      return {
        player: { ...player, power: Math.max(0, player.power - outcome.playerDamage) },
        enemy: { ...enemy, power: Math.max(0, enemy.power - outcome.enemyDamage) },
        events: [
          {
            kind: 'battle',
            nodeId: node.id,
            playerDamage: outcome.playerDamage,
            enemyDamage: outcome.enemyDamage,
          },
        ],
      };
    }
    case 'boss': {
      const outcome = resolveBossEncounter(player.power, enemy.power);
      if (outcome.victorious) {
        return {
          player,
          enemy: { ...enemy, power: 0 },
          events: [{ kind: 'bossDefeated', nodeId: node.id }],
        };
      }
      return {
        player: { ...player, power: Math.max(0, player.power - outcome.counterDamage) },
        enemy,
        events: [{ kind: 'bossCounterattack', nodeId: node.id, damage: outcome.counterDamage }],
      };
    }
    case 'event': {
      const [min, max] = EVENT_POWER_RANGE;
      const powerDelta = randomInt(rng, min, max);
      return {
        player: { ...player, power: Math.max(0, player.power + powerDelta) },
        enemy,
        events: [{ kind: 'event', nodeId: node.id, powerDelta }],
      };
    }
    case 'start':
    case 'normal':
    default:
      return { player, enemy, events: [] };
  }
}
