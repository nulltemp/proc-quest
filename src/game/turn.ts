import type { GeneratedMap } from '../map/index.js';
import { createRng } from '../map/rng.js';
import { ATTRITION_PER_TURN, ENEMY_POWER_GROWTH_PER_TURN, FACTION_IDS, REST_HEAL_RANGE } from './constants.js';
import { randomInt } from './combat.js';
import { useItem } from './items.js';
import { canMoveTo } from './movement.js';
import { resolveNodeArrival } from './nodeEffects.js';
import type { FactionState, GameCommand, GameState, TurnEvent } from './types.js';

export function advanceTurn(map: GeneratedMap, state: GameState, command: GameCommand): GameState {
  if (state.status !== 'ongoing') return state;

  const rng = createRng(state.rngSeed);
  const events: TurnEvent[] = [];

  let currentNodeId = state.currentNodeId;
  let player: FactionState = state.factions[FACTION_IDS.PLAYER];
  let enemy: FactionState = state.factions[FACTION_IDS.ENEMY];

  switch (command.type) {
    case 'move': {
      if (canMoveTo(map, currentNodeId, command.targetNodeId)) {
        events.push({ kind: 'moved', fromNodeId: currentNodeId, toNodeId: command.targetNodeId });
        currentNodeId = command.targetNodeId;

        const node = map.nodes.find((n) => n.id === currentNodeId);
        if (node) {
          const result = resolveNodeArrival(node, rng, player, enemy);
          player = result.player;
          enemy = result.enemy;
          events.push(...result.events);
        }
      } else {
        events.push({ kind: 'blocked', attemptedNodeId: command.targetNodeId });
      }
      break;
    }
    case 'useItem': {
      const result = useItem(command.itemType, rng, player);
      player = result.player;
      events.push(
        result.success
          ? { kind: 'itemUsed', itemType: command.itemType, powerDelta: result.powerDelta }
          : { kind: 'itemUseFailed', itemType: command.itemType },
      );
      break;
    }
    case 'rest': {
      const [min, max] = REST_HEAL_RANGE;
      const powerDelta = randomInt(rng, min, max);
      player = { ...player, power: player.power + powerDelta };
      events.push({ kind: 'rested', powerDelta });
      break;
    }
  }

  player = { ...player, power: Math.max(0, player.power - ATTRITION_PER_TURN) };
  events.push({ kind: 'attrition', powerDelta: -ATTRITION_PER_TURN });

  if (enemy.power > 0) {
    enemy = { ...enemy, power: enemy.power + ENEMY_POWER_GROWTH_PER_TURN };
    events.push({ kind: 'enemyGrowth', powerDelta: ENEMY_POWER_GROWTH_PER_TURN });
  }

  const status = enemy.power <= 0 ? 'won' : player.power <= 0 ? 'lost' : 'ongoing';
  const nextRngSeed = Math.floor(rng() * 2 ** 31);

  return {
    currentNodeId,
    factions: {
      [FACTION_IDS.PLAYER]: player,
      [FACTION_IDS.ENEMY]: enemy,
    },
    turnNumber: state.turnNumber + 1,
    status,
    rngSeed: nextRngSeed,
    lastTurnEvents: events,
  };
}
