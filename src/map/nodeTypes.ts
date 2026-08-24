export type NodeType = 'start' | 'boss' | 'battle' | 'event' | 'normal';

export const NODE_TYPES: Record<'START' | 'BOSS' | 'BATTLE' | 'EVENT' | 'NORMAL', NodeType> = {
  START: 'start',
  BOSS: 'boss',
  BATTLE: 'battle',
  EVENT: 'event',
  NORMAL: 'normal',
};

export interface TypeWeight {
  type: NodeType;
  weight: number;
}

export const DEFAULT_TYPE_WEIGHTS: TypeWeight[] = [
  { type: NODE_TYPES.BATTLE, weight: 0.4 },
  { type: NODE_TYPES.EVENT, weight: 0.2 },
  { type: NODE_TYPES.NORMAL, weight: 0.4 },
];
