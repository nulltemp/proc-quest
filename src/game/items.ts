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
}

export function pickUpItem(rng: () => number, player: FactionState): ItemPickupResult {
  const itemType = pickItem(rng);
  const inventory = { ...player.inventory, [itemType]: (player.inventory[itemType] ?? 0) + 1 };
  return { player: { ...player, inventory }, itemType };
}

export interface UseItemResult {
  player: FactionState;
  success: boolean;
  powerDelta?: number;
}

export function useItem(itemType: ItemType, rng: () => number, player: FactionState): UseItemResult {
  const held = player.inventory[itemType] ?? 0;
  if (held <= 0) {
    return { player, success: false };
  }

  const inventory = { ...player.inventory, [itemType]: held - 1 };
  const withUpdatedInventory: FactionState = { ...player, inventory };

  if (itemType === 'powerTonic') {
    const [min, max] = POWER_TONIC_RANGE;
    const powerDelta = randomInt(rng, min, max);
    return {
      player: { ...withUpdatedInventory, power: withUpdatedInventory.power + powerDelta },
      success: true,
      powerDelta,
    };
  }

  const shield: ActiveEffect = { type: 'shield', charges: GUARDIAN_WARD_CHARGES };
  return {
    player: { ...withUpdatedInventory, activeEffects: [...withUpdatedInventory.activeEffects, shield] },
    success: true,
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
