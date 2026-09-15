export type FactionId = 'player' | 'enemy';

export type ActiveEffectType = 'shield';

export interface ActiveEffect {
  type: ActiveEffectType;
  charges: number;
}

export interface FactionState {
  id: FactionId;
  power: number;
  activeEffects: ActiveEffect[];
  inventory: Inventory;
}

export type ItemType = 'powerTonic' | 'guardianWard';

export type Inventory = Partial<Record<ItemType, number>>;

export type GameStatus = 'ongoing' | 'won' | 'lost';

export type GameCommand =
  | { type: 'move'; targetNodeId: number }
  | { type: 'useItem'; itemType: ItemType }
  | { type: 'rest' };

export type TurnEvent =
  | { kind: 'moved'; fromNodeId: number; toNodeId: number }
  | { kind: 'blocked'; attemptedNodeId: number }
  | { kind: 'battle'; nodeId: number; playerDamage: number; enemyDamage: number }
  | { kind: 'bossDefeated'; nodeId: number }
  | { kind: 'bossCounterattack'; nodeId: number; damage: number }
  | { kind: 'event'; nodeId: number; powerDelta: number }
  | { kind: 'attrition'; powerDelta: number }
  | { kind: 'enemyGrowth'; powerDelta: number }
  | { kind: 'itemAcquired'; nodeId: number; itemType: ItemType }
  | { kind: 'itemEffectTriggered'; nodeId: number; itemType: ItemType; damageBlocked: number }
  | { kind: 'itemUsed'; itemType: ItemType; powerDelta?: number }
  | { kind: 'itemUseFailed'; itemType: ItemType }
  | { kind: 'rested'; powerDelta: number };

export interface GameState {
  currentNodeId: number;
  factions: Record<FactionId, FactionState>;
  turnNumber: number;
  status: GameStatus;
  rngSeed: number;
  lastTurnEvents: TurnEvent[];
}
