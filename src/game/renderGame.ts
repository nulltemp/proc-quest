import type { GeneratedMap } from '../map/index.js';
import { getAdjacentNodeIds } from './movement.js';
import type { GameState, TurnEvent } from './types.js';

export function formatGameStatus(map: GeneratedMap, state: GameState): string {
  const node = map.nodes.find((n) => n.id === state.currentNodeId);
  return [
    `Turn ${state.turnNumber} — at node ${state.currentNodeId} (${node?.type ?? 'unknown'})`,
    `Player power: ${state.factions.player.power}  |  Enemy power: ${state.factions.enemy.power}`,
  ].join('\n');
}

export function formatMoveOptions(map: GeneratedMap, nodeId: number): string {
  return getAdjacentNodeIds(map, nodeId)
    .map((id) => `${id}(${map.nodes.find((n) => n.id === id)?.type ?? '?'})`)
    .join(', ');
}

export function formatTurnEvents(events: TurnEvent[]): string {
  return events.map(formatEvent).join('\n');
}

function formatEvent(event: TurnEvent): string {
  switch (event.kind) {
    case 'moved':
      return `  Moved from node ${event.fromNodeId} to node ${event.toNodeId}.`;
    case 'blocked':
      return `  Cannot move to node ${event.attemptedNodeId} — not adjacent.`;
    case 'battle':
      return `  Battle! You dealt ${event.enemyDamage}, took ${event.playerDamage} damage.`;
    case 'bossDefeated':
      return `  The boss has been defeated! Victory!`;
    case 'bossCounterattack':
      return `  The boss counterattacks for ${event.damage} damage!`;
    case 'event':
      return `  Event: power ${event.powerDelta >= 0 ? '+' : ''}${event.powerDelta}.`;
    case 'attrition':
      return `  Attrition: ${event.powerDelta} power.`;
  }
}
