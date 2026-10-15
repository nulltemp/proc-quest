import type { GeneratedMap } from '../map/index.js';
import { getAdjacentNodeIds, getShortestPath } from '../game/index.js';
import type { GameCommand, GameState, ItemType } from '../game/index.js';

/**
 * A bot: picks the next command from the current state. `rng` is the bot's
 * own randomness, separate from the game's rng chain so bot choices never
 * perturb game outcomes for a given seed.
 */
export type Policy = (map: GeneratedMap, state: GameState, rng: () => number) => GameCommand;

function heldItems(state: GameState): ItemType[] {
  return (Object.entries(state.factions.player.inventory) as [ItemType, number][])
    .filter(([, count]) => count > 0)
    .map(([type]) => type);
}

/** Baseline: mostly wanders to random adjacent nodes, sometimes rests or uses an item. */
export const randomPolicy: Policy = (map, state, rng) => {
  const roll = rng();
  const items = heldItems(state);
  if (roll < 0.1 && items.length > 0) {
    return { type: 'useItem', itemType: items[Math.floor(rng() * items.length)] };
  }
  const adjacent = getAdjacentNodeIds(map, state.currentNodeId);
  if (roll < 0.25 || adjacent.length === 0) return { type: 'rest' };
  return { type: 'move', targetNodeId: adjacent[Math.floor(rng() * adjacent.length)] };
};

/** Max detour (in moves) the greedy bot will take toward an uncleared treasure node. */
const GREEDY_TREASURE_DETOUR = 5;

/**
 * A simple "reasonable player": drinks tonics immediately, heads for the boss
 * once it would arrive strong enough to win (accounting for attrition and
 * enemy growth en route), otherwise detours to nearby treasure or rests.
 */
export const greedyPolicy: Policy = (map, state) => {
  const { player, enemy } = state.factions;
  if ((player.inventory.powerTonic ?? 0) > 0) return { type: 'useItem', itemType: 'powerTonic' };

  const pathToBoss = getShortestPath(map, state.currentNodeId, map.bossNodeId);
  if (pathToBoss && pathToBoss.length > 0) {
    // Arrival resolves before that turn's attrition/growth, so d moves cost d-1 of each.
    const turnsBeforeArrival = pathToBoss.length - 1;
    if (player.power - turnsBeforeArrival >= enemy.power + turnsBeforeArrival) {
      return { type: 'move', targetNodeId: pathToBoss[0] };
    }
  }

  let bestPath: number[] | undefined;
  for (const node of map.nodes) {
    if (node.type !== 'treasure' || state.clearedNodeIds.includes(node.id)) continue;
    const path = getShortestPath(map, state.currentNodeId, node.id);
    if (path && path.length > 0 && path.length <= GREEDY_TREASURE_DETOUR && (!bestPath || path.length < bestPath.length)) {
      bestPath = path;
    }
  }
  if (bestPath) return { type: 'move', targetNodeId: bestPath[0] };

  return { type: 'rest' };
};

export const POLICIES = {
  random: randomPolicy,
  greedy: greedyPolicy,
} as const satisfies Record<string, Policy>;

export type PolicyName = keyof typeof POLICIES;
