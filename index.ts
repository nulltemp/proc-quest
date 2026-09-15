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
import { resolveLocale, getMessages } from './src/i18n/index.js';

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

    const answer = (await rl.question('> ')).trim();
    if (answer.toLowerCase() === 'quit') break;

    const targetNodeId = Number(answer);
    if (!Number.isInteger(targetNodeId)) {
      console.log(t.cli.invalidNodeId);
      continue;
    }

    state = advanceTurn(map, state, { type: 'move', targetNodeId });
    console.log(formatTurnEvents(state.lastTurnEvents, locale));
  }

  console.log();
  if (state.status === 'won') console.log(t.cli.victory);
  else if (state.status === 'lost') console.log(t.cli.gameOver);
  else console.log(t.cli.gameEnded);

  rl.close();
}

main();
