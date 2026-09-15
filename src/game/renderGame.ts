import type { GeneratedMap } from '../map/index.js';
import { getAdjacentNodeIds } from './movement.js';
import type { GameState, TurnEvent } from './types.js';
import { DEFAULT_LOCALE, getMessages, type Locale } from '../i18n/index.js';

export function formatGameStatus(map: GeneratedMap, state: GameState, locale: Locale = DEFAULT_LOCALE): string {
  const t = getMessages(locale);
  const node = map.nodes.find((n) => n.id === state.currentNodeId);
  const nodeTypeLabel = node ? t.nodeType[node.type] : t.game.unknownNodeType;
  const lines = [
    t.game.turnStatus(state.turnNumber, state.currentNodeId, nodeTypeLabel),
    t.game.power(state.factions.player.power, state.factions.enemy.power),
  ];
  const effects = state.factions.player.activeEffects;
  if (effects.length > 0) {
    lines.push(t.game.activeEffects(formatActiveEffects(effects, locale)));
  }
  return lines.join('\n');
}

function formatActiveEffects(
  effects: GameState['factions']['player']['activeEffects'],
  locale: Locale,
): string {
  const t = getMessages(locale);
  const counts = new Map<string, number>();
  for (const effect of effects) {
    counts.set(effect.type, (counts.get(effect.type) ?? 0) + 1);
  }
  return [...counts.entries()].map(([type, count]) => `${t.effectType[type as keyof typeof t.effectType]} x${count}`).join(', ');
}

export function formatMoveOptions(map: GeneratedMap, nodeId: number, locale: Locale = DEFAULT_LOCALE): string {
  const t = getMessages(locale);
  return getAdjacentNodeIds(map, nodeId)
    .map((id) => {
      const node = map.nodes.find((n) => n.id === id);
      const typeLabel = node ? t.nodeType[node.type] : t.game.unknownNodeType;
      return `${id}(${typeLabel})`;
    })
    .join(', ');
}

export function formatTurnEvents(events: TurnEvent[], locale: Locale = DEFAULT_LOCALE): string {
  const t = getMessages(locale);
  return events.map((event) => formatEvent(event, t)).join('\n');
}

function formatEvent(event: TurnEvent, t: ReturnType<typeof getMessages>): string {
  switch (event.kind) {
    case 'moved':
      return t.game.events.moved(event.fromNodeId, event.toNodeId);
    case 'blocked':
      return t.game.events.blocked(event.attemptedNodeId);
    case 'battle':
      return t.game.events.battle(event.enemyDamage, event.playerDamage);
    case 'bossDefeated':
      return t.game.events.bossDefeated;
    case 'bossCounterattack':
      return t.game.events.bossCounterattack(event.damage);
    case 'event':
      return t.game.events.event(event.powerDelta);
    case 'attrition':
      return t.game.events.attrition(event.powerDelta);
    case 'itemAcquired':
      return t.game.events.itemAcquired(t.itemType[event.itemType], event.powerDelta);
    case 'itemEffectTriggered':
      return t.game.events.itemEffectTriggered(t.itemType[event.itemType], event.damageBlocked);
  }
}
