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
}

export type ItemType = 'powerTonic' | 'guardianWard';

export type GameStatus = 'ongoing' | 'won' | 'lost';

export type GameCommand = { type: 'move'; targetNodeId: number };

export type TurnEvent =
  | { kind: 'moved'; fromNodeId: number; toNodeId: number }
  | { kind: 'blocked'; attemptedNodeId: number }
  | { kind: 'battle'; nodeId: number; playerDamage: number; enemyDamage: number }
  | { kind: 'bossDefeated'; nodeId: number }
  | { kind: 'bossCounterattack'; nodeId: number; damage: number }
  | { kind: 'event'; nodeId: number; powerDelta: number }
  | { kind: 'attrition'; powerDelta: number }
  | { kind: 'itemAcquired'; nodeId: number; itemType: ItemType; powerDelta?: number }
  | { kind: 'itemEffectTriggered'; nodeId: number; itemType: ItemType; damageBlocked: number };

export interface GameState {
  currentNodeId: number;
  factions: Record<FactionId, FactionState>;
  turnNumber: number;
  status: GameStatus;
  rngSeed: number;
  lastTurnEvents: TurnEvent[];
}
