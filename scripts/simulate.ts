// Balance-check harness: plays many seeded games with bot policies and prints
// win rates / game lengths. Developer tool, so output is English-only.
//
//   npm run sim -- [--games=200] [--policy=all|random|greedy] [--size=20] [--seed=1] [--max-turns=1000] [--json]
import { POLICIES, simulateMany, summarize } from '../src/sim/index.js';
import type { PolicyName } from '../src/sim/index.js';

function parseArgs(argv: string[]): Map<string, string> {
  const args = new Map<string, string>();
  for (const arg of argv) {
    const match = /^--([^=]+)(?:=(.*))?$/.exec(arg);
    if (match) args.set(match[1], match[2] ?? 'true');
  }
  return args;
}

function intArg(args: Map<string, string>, name: string, fallback: number): number {
  const raw = args.get(name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new Error(`--${name} must be an integer, got "${raw}"`);
  return value;
}

const fmt = (n: number | undefined, digits = 1) => (n === undefined ? '-' : n.toFixed(digits));

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const games = intArg(args, 'games', 200);
  const nodeCount = intArg(args, 'size', 20);
  const startSeed = intArg(args, 'seed', 1);
  const maxTurns = intArg(args, 'max-turns', 1000);
  const policyArg = args.get('policy') ?? 'all';

  const policyNames = policyArg === 'all' ? (Object.keys(POLICIES) as PolicyName[]) : [policyArg as PolicyName];
  for (const name of policyNames) {
    if (!(name in POLICIES)) throw new Error(`unknown --policy "${name}" (expected all|${Object.keys(POLICIES).join('|')})`);
  }

  const summaries = policyNames.map((name) => ({
    policy: name,
    ...summarize(simulateMany({ games, startSeed, nodeCount, maxTurns, policy: POLICIES[name] })),
  }));

  if (args.has('json')) {
    console.log(JSON.stringify({ games, nodeCount, startSeed, maxTurns, summaries }, null, 2));
    return;
  }

  console.log(`${games} games/policy, ${nodeCount} nodes, seeds ${startSeed}..${startSeed + games - 1}, max ${maxTurns} turns`);
  console.table(
    summaries.map((s) => ({
      policy: s.policy,
      'win %': fmt(s.winRate * 100),
      wins: s.wins,
      losses: s.losses,
      timeouts: s.timeouts,
      'avg turns (win)': fmt(s.avgTurnsToWin),
      'median turns (win)': s.medianTurnsToWin ?? '-',
      'avg turns (loss)': fmt(s.avgTurnsToLose),
    })),
  );
}

main();
