import type { MapNode } from '../map/index.js';
import { resolveSkirmish, resolveBossEncounter, randomInt } from './combat.js';
import { EVENT_POWER_RANGE } from './constants.js';
import { pickUpItem, consumeShieldIfPresent } from './items.js';
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
      const shieldResult = consumeShieldIfPresent(player, outcome.playerDamage);
      const events: TurnEvent[] = [
        {
          kind: 'battle',
          nodeId: node.id,
          playerDamage: shieldResult.damageDealt,
          enemyDamage: outcome.enemyDamage,
        },
      ];
      if (shieldResult.absorbed) {
        events.push({
          kind: 'itemEffectTriggered',
          nodeId: node.id,
          itemType: 'guardianWard',
          damageBlocked: outcome.playerDamage,
        });
      }
      return {
        player: { ...shieldResult.player, power: Math.max(0, shieldResult.player.power - shieldResult.damageDealt) },
        enemy: { ...enemy, power: Math.max(0, enemy.power - outcome.enemyDamage) },
        events,
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
      const shieldResult = consumeShieldIfPresent(player, outcome.counterDamage);
      const events: TurnEvent[] = [
        { kind: 'bossCounterattack', nodeId: node.id, damage: shieldResult.damageDealt },
      ];
      if (shieldResult.absorbed) {
        events.push({
          kind: 'itemEffectTriggered',
          nodeId: node.id,
          itemType: 'guardianWard',
          damageBlocked: outcome.counterDamage,
        });
      }
      return {
        player: { ...shieldResult.player, power: Math.max(0, shieldResult.player.power - shieldResult.damageDealt) },
        enemy,
        events,
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
    case 'treasure': {
      const pickup = pickUpItem(rng, player);
      return {
        player: pickup.player,
        enemy,
        events: [{ kind: 'itemAcquired', nodeId: node.id, itemType: pickup.itemType }],
      };
    }
    case 'start':
    case 'normal':
    default:
      return { player, enemy, events: [] };
  }
}
