import type { NodeType } from '../map/nodeTypes.js';
import type { ActiveEffectType, ItemType } from '../game/types.js';

export interface Messages {
  nodeType: Record<NodeType, string>;
  effectType: Record<ActiveEffectType, string>;
  itemType: Record<ItemType, string>;
  map: {
    seed: (seed: number) => string;
    nodesHeader: (count: number) => string;
    edgesHeader: (count: number) => string;
    startBoss: (startNodeId: number, bossNodeId: number) => string;
  };
  game: {
    unknownNodeType: string;
    turnStatus: (turn: number, nodeId: number, nodeType: string) => string;
    power: (player: number, enemy: number) => string;
    activeEffects: (summary: string) => string;
    moveTo: (options: string) => string;
    events: {
      moved: (from: number, to: number) => string;
      blocked: (attemptedNodeId: number) => string;
      battle: (enemyDamage: number, playerDamage: number) => string;
      bossDefeated: string;
      bossCounterattack: (damage: number) => string;
      event: (powerDelta: number) => string;
      attrition: (powerDelta: number) => string;
      itemAcquired: (itemLabel: string, powerDelta?: number) => string;
      itemEffectTriggered: (itemLabel: string, damageBlocked: number) => string;
    };
  };
  cli: {
    reproduce: (seed: number) => string;
    gameStart: string;
    noMoves: string;
    invalidNodeId: string;
    victory: string;
    gameOver: string;
    gameEnded: string;
  };
  web: {
    title: string;
    seedLabel: string;
    regenerate: string;
    randomSeed: string;
    log: string;
    langLabel: string;
    turnLog: (turn: number) => string;
    startTitle: string;
    startSubtitle: string;
    mapSizeLabel: (count: number, sizeLabel: string) => string;
    sizeSmall: string;
    sizeMedium: string;
    sizeLarge: string;
    seedOptionalLabel: string;
    seedPlaceholder: string;
    startButton: string;
    newGameButton: string;
  };
}
