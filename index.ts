import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { generateMap, formatMapAsText, formatMapAsAscii } from './src/map/index.js';
import {
  startSession,
  applyCommand,
  serializeSave,
  parseSave,
  getAdjacentNodeIds,
  formatGameStatus,
  formatMoveOptions,
  formatTurnEvents,
} from './src/game/index.js';
import type { GameCommand, GameSession, ItemType } from './src/game/index.js';
import { resolveLocale, getMessages } from './src/i18n/index.js';

const ITEM_ALIASES: Record<string, ItemType> = {
  powertonic: 'powerTonic',
  tonic: 'powerTonic',
  guardianward: 'guardianWard',
  ward: 'guardianWard',
};

const DEFAULT_SAVE_PATH = 'proc-quest-save.json';

type CliCommand = GameCommand | { type: 'quit' } | { type: 'save'; path: string };

function parseCommand(input: string): CliCommand | undefined {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'quit') return { type: 'quit' };
  if (lower === 'save' || lower.startsWith('save ')) {
    return { type: 'save', path: trimmed.slice(4).trim() || DEFAULT_SAVE_PATH };
  }
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

  const loadPath = args.find((arg) => arg.startsWith('--load='))?.slice('--load='.length);
  let session: GameSession;
  if (loadPath !== undefined) {
    try {
      session = parseSave(readFileSync(loadPath, 'utf8'));
    } catch (error) {
      console.log(t.cli.loadFailed(loadPath, error instanceof Error ? error.message : String(error)));
      process.exitCode = 1;
      return;
    }
  } else {
    const seedArg = args.find((arg) => !arg.startsWith('--'));
    const map = generateMap(seedArg !== undefined ? { seed: Number(seedArg) } : {});
    session = startSession(map, { seed: map.config.seed });
  }
  const { map } = session;

  console.log(formatMapAsText(map, locale));
  console.log();
  console.log(formatMapAsAscii(map));
  console.log();
  console.log(t.cli.reproduce(map.config.seed));

  if (loadPath !== undefined) console.log(t.cli.loaded(loadPath, session.state.turnNumber));

  console.log();
  console.log(t.cli.gameStart);

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  while (session.state.status === 'ongoing') {
    const { state } = session;
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
    if (command === undefined) {
      console.log(t.cli.invalidCommand);
      continue;
    }
    if (command.type === 'quit') break;
    if (command.type === 'save') {
      try {
        writeFileSync(command.path, serializeSave(session));
        console.log(t.cli.saved(command.path));
      } catch (error) {
        console.log(t.cli.saveFailed(error instanceof Error ? error.message : String(error)));
      }
      continue;
    }

    session = applyCommand(session, command);
    console.log(formatTurnEvents(session.state.lastTurnEvents, locale));
  }

  const { state } = session;
  console.log();
  if (state.status === 'won') console.log(t.cli.victory);
  else if (state.status === 'lost') console.log(t.cli.gameOver);
  else console.log(t.cli.gameEnded);

  rl.close();
}

main();
