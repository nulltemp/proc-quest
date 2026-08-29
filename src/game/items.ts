import { randomInt } from './combat.js';
import { GUARDIAN_WARD_CHARGES, POWER_TONIC_RANGE } from './constants.js';
import type { ActiveEffect, FactionState, ItemType } from './types.js';

export interface ItemWeight {
  type: ItemType;
  weight: number;
}

export const ITEM_WEIGHTS: ItemWeight[] = [
  { type: 'powerTonic', weight: 0.6 },
  { type: 'guardianWard', weight: 0.4 },
];

export function pickItem(rng: () => number): ItemType {
  const roll = rng();
  let cumulative = 0;
  for (const { type, weight } of ITEM_WEIGHTS) {
    cumulative += weight;
    if (roll < cumulative) return type;
  }
  return ITEM_WEIGHTS[ITEM_WEIGHTS.length - 1].type;
}

export interface ItemPickupResult {
  player: FactionState;
  itemType: ItemType;
  powerDelta?: number;
}

export function applyItemPickup(rng: () => number, player: FactionState): ItemPickupResult {
  const itemType = pickItem(rng);

  if (itemType === 'powerTonic') {
    const [min, max] = POWER_TONIC_RANGE;
    const powerDelta = randomInt(rng, min, max);
    return { player: { ...player, power: player.power + powerDelta }, itemType, powerDelta };
  }

  const shield: ActiveEffect = { type: 'shield', charges: GUARDIAN_WARD_CHARGES };
  return {
    player: { ...player, activeEffects: [...player.activeEffects, shield] },
    itemType,
  };
}

export interface ShieldConsumeResult {
  player: FactionState;
  damageDealt: number;
  absorbed: boolean;
}

export function consumeShieldIfPresent(player: FactionState, incomingDamage: number): ShieldConsumeResult {
  const shieldIndex = player.activeEffects.findIndex((effect) => effect.type === 'shield');
  if (shieldIndex === -1) {
    return { player, damageDealt: incomingDamage, absorbed: false };
  }

  const shield = player.activeEffects[shieldIndex];
  const remainingCharges = shield.charges - 1;
  const activeEffects =
    remainingCharges > 0
      ? player.activeEffects.map((effect, i) =>
          i === shieldIndex ? { ...effect, charges: remainingCharges } : effect,
        )
      : player.activeEffects.filter((_, i) => i !== shieldIndex);

  return { player: { ...player, activeEffects }, damageDealt: 0, absorbed: true };
}
