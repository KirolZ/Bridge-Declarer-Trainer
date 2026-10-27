// Solver benchmark (SPEC §5.4): p50 / p95 for solve, analyze and ddTable on seeded deals.
//
//   pnpm bench                       50 full deals, all three jobs
//   pnpm bench --deals 10 --cards 8  10 deals cut down to 8 cards per hand
//   pnpm bench --only solve          one job (solve | analyze | ddTable)
//
// Every job starts from an empty cache (`clear()`), so the numbers are cold-start times.

import type { Deal, Strain } from '../src/engine';
import { STRAINS, dealRandom, mulberry32 } from '../src/engine';
import { Solver } from '../src/solver';

type Job = 'solve' | 'analyze' | 'ddTable';

const TARGETS_MS: Record<Job, number> = { solve: 1000, analyze: 1500, ddTable: 4000 };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const deals = Number(arg('deals') ?? 50);
const cards = Number(arg('cards') ?? 13);
const only = arg('only') as Job | undefined;
const jobs: Job[] = only ? [only] : ['solve', 'analyze', 'ddTable'];

/** Deal `i` of the benchmark set; the strain for solve / analyze cycles through all five. */
function benchDeal(i: number): { deal: Deal; strain: Strain } {
  const full = dealRandom(mulberry32(1000 + i));
  const cut = (seat: keyof Deal) => full[seat].slice(0, cards);
  return {
    deal: { N: cut('N'), E: cut('E'), S: cut('S'), W: cut('W') },
    strain: STRAINS[i % 5] as Strain,
  };
}

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] as number;
}

const fmt = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(1)} ms`);

const solver = new Solver();
console.log(`bench: ${deals} deals × ${cards} cards per hand (Node ${process.version})`);

let failed = false;
for (const job of jobs) {
  const times: number[] = [];
  const nodesBefore = solver.nodes;
  let probes = 0;
  let hits = 0;
  for (let i = 0; i < deals; i++) {
    const { deal, strain } = benchDeal(i);
    const pos = { hands: deal, trump: strain, trick: [], toPlay: 'W' as const };
    solver.clear();
    const t0 = performance.now();
    if (job === 'solve') solver.solve(pos);
    else if (job === 'analyze') solver.analyze(pos);
    else solver.ddTable(deal);
    times.push(performance.now() - t0);
    probes += solver.ttStats.probes;
    hits += solver.ttStats.hits;
  }
  times.sort((a, b) => a - b);
  const p95 = percentile(times, 95);
  const meets =
    cards < 13 ? '' : p95 < TARGETS_MS[job] ? '  ✓ target' : `  ✗ target ${fmt(TARGETS_MS[job])}`;
  if (cards === 13 && p95 >= TARGETS_MS[job]) failed = true;
  const nodes = Math.round((solver.nodes - nodesBefore) / deals);
  const ttInfo = probes > 0 ? `  TT hits ${((100 * hits) / probes).toFixed(0)}%` : '';
  console.log(
    `${job.padEnd(8)} p50 ${fmt(percentile(times, 50)).padStart(9)}  p95 ${fmt(p95).padStart(9)}  ` +
      `max ${fmt(times.at(-1) as number).padStart(9)}  nodes/deal ${nodes.toLocaleString('en')}${ttInfo}${meets}`,
  );
}
if (failed) process.exitCode = 1;
