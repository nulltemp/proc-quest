import type { GeneratedMap } from '../map/index.js';
import { ITEM_WEIGHTS } from './items.js';
import type { GameSession } from './session.js';
import type { GameCommand, GameState } from './types.js';

/**
 * Bump when the save shape changes incompatibly; `parseSave` rejects other
 * versions rather than guessing (add a migration here when that happens).
 */
export const SAVE_FORMAT_VERSION = 1;

/**
 * The full map is stored (not just its config/seed) so a save stays loadable
 * even after the map generator changes. `state` is authoritative on load;
 * `initialState`/`commands` are kept for replays and turn-log rebuilding,
 * which only match `state` while the turn rules are unchanged.
 */
export interface SaveData {
  version: typeof SAVE_FORMAT_VERSION;
  savedAt: string;
  map: GeneratedMap;
  initialState: GameState;
  commands: GameCommand[];
  state: GameState;
}

export class SaveFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaveFormatError';
  }
}

export function serializeSave(session: GameSession, savedAt: Date = new Date()): string {
  const data: SaveData = {
    version: SAVE_FORMAT_VERSION,
    savedAt: savedAt.toISOString(),
    map: session.map,
    initialState: session.initialState,
    commands: session.commands,
    state: session.state,
  };
  return JSON.stringify(data);
}

/** Parses and validates a save string, throwing `SaveFormatError` if it isn't a usable save. */
export function parseSave(json: string): GameSession {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new SaveFormatError('not valid JSON');
  }

  if (!isObject(data)) throw new SaveFormatError('save is not an object');
  if (data.version !== SAVE_FORMAT_VERSION) {
    throw new SaveFormatError(`unsupported save version: ${String(data.version)}`);
  }

  const map = data.map;
  if (!isMap(map)) throw new SaveFormatError('invalid map');
  if (!isGameState(data.initialState, map)) throw new SaveFormatError('invalid initialState');
  if (!isGameState(data.state, map)) throw new SaveFormatError('invalid state');
  if (!Array.isArray(data.commands) || !data.commands.every(isCommand)) {
    throw new SaveFormatError('invalid commands');
  }

  return { map, initialState: data.initialState, commands: data.commands, state: data.state };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInt(value: unknown): value is number {
  return Number.isInteger(value);
}

function isMap(value: unknown): value is GeneratedMap {
  if (!isObject(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) return false;
  const nodeCount = value.nodes.length;
  const isNodeId = (id: unknown) => isInt(id) && id >= 0 && id < nodeCount;
  return (
    nodeCount > 0 &&
    value.nodes.every(
      (n, i) => isObject(n) && n.id === i && typeof n.x === 'number' && typeof n.y === 'number' && typeof n.type === 'string',
    ) &&
    value.edges.every((e) => isObject(e) && isNodeId(e.from) && isNodeId(e.to)) &&
    isNodeId(value.startNodeId) &&
    isNodeId(value.bossNodeId) &&
    isObject(value.config)
  );
}

function isFaction(value: unknown): boolean {
  return (
    isObject(value) &&
    typeof value.power === 'number' &&
    Array.isArray(value.activeEffects) &&
    isObject(value.inventory)
  );
}

function isGameState(value: unknown, map: GeneratedMap): value is GameState {
  return (
    isObject(value) &&
    isInt(value.currentNodeId) &&
    value.currentNodeId >= 0 &&
    value.currentNodeId < map.nodes.length &&
    isObject(value.factions) &&
    isFaction(value.factions.player) &&
    isFaction(value.factions.enemy) &&
    isInt(value.turnNumber) &&
    (value.status === 'ongoing' || value.status === 'won' || value.status === 'lost') &&
    isInt(value.rngSeed) &&
    Array.isArray(value.lastTurnEvents) &&
    Array.isArray(value.clearedNodeIds) &&
    value.clearedNodeIds.every(isInt)
  );
}

function isCommand(value: unknown): value is GameCommand {
  if (!isObject(value)) return false;
  switch (value.type) {
    case 'move':
      return isInt(value.targetNodeId);
    case 'useItem':
      return ITEM_WEIGHTS.some(({ type }) => type === value.itemType);
    case 'rest':
      return true;
    default:
      return false;
  }
}
