export type NodeType = 'start' | 'boss' | 'battle' | 'event' | 'normal' | 'treasure';

export const NODE_TYPES: Record<'START' | 'BOSS' | 'BATTLE' | 'EVENT' | 'NORMAL' | 'TREASURE', NodeType> = {
  START: 'start',
  BOSS: 'boss',
  BATTLE: 'battle',
  EVENT: 'event',
  NORMAL: 'normal',
  TREASURE: 'treasure',
};

export interface TypeWeight {
  type: NodeType;
  weight: number;
}

export const DEFAULT_TYPE_WEIGHTS: TypeWeight[] = [
  { type: NODE_TYPES.BATTLE, weight: 0.35 },
  { type: NODE_TYPES.EVENT, weight: 0.2 },
  { type: NODE_TYPES.NORMAL, weight: 0.3 },
  { type: NODE_TYPES.TREASURE, weight: 0.15 },
];
