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
import { resolveLocale, getMessages } from './src/i18n/index.js';

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
  const args = process.argv.slice(2);
  const langArg = args.find((arg) => arg.startsWith('--lang='));
  const locale = resolveLocale(langArg?.slice('--lang='.length) ?? process.env.PROC_QUEST_LANG);
  const t = getMessages(locale);

  const seedArg = args.find((arg) => !arg.startsWith('--lang='));
  const overrides = seedArg !== undefined ? { seed: Number(seedArg) } : {};
  const map = generateMap(overrides);

  console.log(formatMapAsText(map, locale));
  console.log();
  console.log(formatMapAsAscii(map));
  console.log();
  console.log(t.cli.reproduce(map.config.seed));

  console.log();
  console.log(t.cli.gameStart);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let state = createInitialState(map, { seed: map.config.seed });

  while (state.status === 'ongoing') {
    console.log();
    console.log(formatGameStatus(map, state, locale));

    const adjacent = getAdjacentNodeIds(map, state.currentNodeId);
    if (adjacent.length === 0) {
      console.log(t.cli.noMoves);
      break;
    }
    console.log(t.game.moveTo(formatMoveOptions(map, state.currentNodeId, locale)));

    const answer = await rl.question('> ');
    const command = parseCommand(answer);
    if (command === 'quit') break;
    if (command === undefined) {
      console.log(t.cli.invalidCommand);
      continue;
    }

    state = advanceTurn(map, state, command);
    console.log(formatTurnEvents(state.lastTurnEvents, locale));
  }

  console.log();
  if (state.status === 'won') console.log(t.cli.victory);
  else if (state.status === 'lost') console.log(t.cli.gameOver);
  else console.log(t.cli.gameEnded);

  rl.close();
}

main();
