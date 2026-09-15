import { createInterface } from 'node:readline/promises';
import { generateMap, formatMapAsText, formatMapAsAscii } from './src/map/index.js';
import {
  createInitialState,
  advanceTurn,
  getAdjacentNodeIds,
  formatGameStatus,
  formatMoveOptions,
  formatTurnEvents,
} from './src/game/index.js';
import type { GameCommand, ItemType } from './src/game/index.js';

const ITEM_ALIASES: Record<string, ItemType> = {
  powertonic: 'powerTonic',
  tonic: 'powerTonic',
  guardianward: 'guardianWard',
  ward: 'guardianWard',
};

function parseCommand(input: string): GameCommand | 'quit' | undefined {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'quit') return 'quit';
  if (lower === 'rest') return { type: 'rest' };
  if (lower.startsWith('use ')) {
    const itemType = ITEM_ALIASES[lower.slice(4).trim().replace(/\s+/g, '')];
    return itemType ? { type: 'useItem', itemType } : undefined;
  }

  const targetNodeId = Number(trimmed);
  return Number.isInteger(targetNodeId) ? { type: 'move', targetNodeId } : undefined;
}

async function main(): Promise<void> {
  const seedArg = process.argv[2];
  const overrides = seedArg !== undefined ? { seed: Number(seedArg) } : {};
  const map = generateMap(overrides);

  console.log(formatMapAsText(map));
  console.log();
  console.log(formatMapAsAscii(map));
  console.log();
  console.log(`Reproduce with: node dist/index.js ${map.config.seed}`);

  console.log();
  console.log(
    '--- Game start (type a node id to move, "rest" to recover power, "use <item>" to use an item, or "quit" to exit) ---',
  );

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let state = createInitialState(map, { seed: map.config.seed });

  while (state.status === 'ongoing') {
    console.log();
    console.log(formatGameStatus(map, state));

    const adjacent = getAdjacentNodeIds(map, state.currentNodeId);
    if (adjacent.length === 0) {
      console.log('No moves available. Ending game.');
      break;
    }
    console.log(`Move to: ${formatMoveOptions(map, state.currentNodeId)}`);

    const answer = await rl.question('> ');
    const command = parseCommand(answer);
    if (command === 'quit') break;
    if (command === undefined) {
      console.log('Please enter a node id, "rest", or "use <item>".');
      continue;
    }

    state = advanceTurn(map, state, command);
    console.log(formatTurnEvents(state.lastTurnEvents));
  }

  console.log();
  if (state.status === 'won') console.log('You defeated the enemy boss! Victory!');
  else if (state.status === 'lost') console.log('Your faction has been depleted. Game over.');
  else console.log('Game ended.');

  rl.close();
}

main();
