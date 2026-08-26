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
  console.log('--- Game start (type a node id to move, or "quit" to exit) ---');

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

    const answer = (await rl.question('> ')).trim();
    if (answer.toLowerCase() === 'quit') break;

    const targetNodeId = Number(answer);
    if (!Number.isInteger(targetNodeId)) {
      console.log('Please enter a valid node id.');
      continue;
    }

    state = advanceTurn(map, state, { type: 'move', targetNodeId });
    console.log(formatTurnEvents(state.lastTurnEvents));
  }

  console.log();
  if (state.status === 'won') console.log('You defeated the enemy boss! Victory!');
  else if (state.status === 'lost') console.log('Your faction has been depleted. Game over.');
  else console.log('Game ended.');

  rl.close();
}

main();
