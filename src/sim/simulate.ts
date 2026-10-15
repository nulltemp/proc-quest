import { generateMap, sizedMapConfig } from '../map/index.js';
import { createRng } from '../map/rng.js';
import { applyCommand, startSession } from '../game/index.js';
import type { Policy } from './policies.js';

export type SimulationOutcome = 'won' | 'lost' | 'timeout';

export interface SimulateGameOptions {
  seed: number;
  nodeCount: number;
  policy: Policy;
  /** Turn cap so a policy that never finishes still terminates. */
  maxTurns: number;
}

export interface GameResult {
  seed: number;
  outcome: SimulationOutcome;
  turns: number;
  finalPlayerPower: number;
  finalEnemyPower: number;
}

/** Plays one full game with `policy`, deterministically for a given seed. */
export function simulateGame({ seed, nodeCount, policy, maxTurns }: SimulateGameOptions): GameResult {
  const map = generateMap({ ...sizedMapConfig(nodeCount), seed });
  let session = startSession(map, { seed });
  const botRng = createRng(seed ^ 0x5eed);

  while (session.state.status === 'ongoing' && session.state.turnNumber < maxTurns) {
    session = applyCommand(session, policy(map, session.state, botRng));
  }

  const { state } = session;
  return {
    seed,
    outcome: state.status === 'ongoing' ? 'timeout' : state.status,
    turns: state.turnNumber,
    finalPlayerPower: state.factions.player.power,
    finalEnemyPower: state.factions.enemy.power,
  };
}

export interface SimulationSummary {
  games: number;
  wins: number;
  losses: number;
  timeouts: number;
  winRate: number;
  /** Mean/median turn count over won games (`undefined` if none were won). */
  avgTurnsToWin?: number;
  medianTurnsToWin?: number;
  avgTurnsToLose?: number;
}

export function summarize(results: GameResult[]): SimulationSummary {
  const turnsOf = (outcome: SimulationOutcome) =>
    results.filter((r) => r.outcome === outcome).map((r) => r.turns).sort((a, b) => a - b);
  const mean = (xs: number[]) => (xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined);
  const median = (xs: number[]) => (xs.length > 0 ? xs[Math.floor(xs.length / 2)] : undefined);

  const winTurns = turnsOf('won');
  const lossTurns = turnsOf('lost');
  return {
    games: results.length,
    wins: winTurns.length,
    losses: lossTurns.length,
    timeouts: turnsOf('timeout').length,
    winRate: results.length > 0 ? winTurns.length / results.length : 0,
    avgTurnsToWin: mean(winTurns),
    medianTurnsToWin: median(winTurns),
    avgTurnsToLose: mean(lossTurns),
  };
}

export interface SimulateManyOptions extends Omit<SimulateGameOptions, 'seed'> {
  games: number;
  /** Games use seeds startSeed, startSeed + 1, ... */
  startSeed: number;
}

export function simulateMany({ games, startSeed, ...options }: SimulateManyOptions): GameResult[] {
  return Array.from({ length: games }, (_, i) => simulateGame({ ...options, seed: startSeed + i }));
}
