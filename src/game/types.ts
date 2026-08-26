export type FactionId = 'player' | 'enemy';

export interface FactionState {
  id: FactionId;
  power: number;
}

export type GameStatus = 'ongoing' | 'won' | 'lost';

export type GameCommand = { type: 'move'; targetNodeId: number };

export type TurnEvent =
  | { kind: 'moved'; fromNodeId: number; toNodeId: number }
  | { kind: 'blocked'; attemptedNodeId: number }
  | { kind: 'battle'; nodeId: number; playerDamage: number; enemyDamage: number }
  | { kind: 'bossDefeated'; nodeId: number }
  | { kind: 'bossCounterattack'; nodeId: number; damage: number }
  | { kind: 'event'; nodeId: number; powerDelta: number }
  | { kind: 'attrition'; powerDelta: number };

export interface GameState {
  currentNodeId: number;
  factions: Record<FactionId, FactionState>;
  turnNumber: number;
  status: GameStatus;
  rngSeed: number;
  lastTurnEvents: TurnEvent[];
}
