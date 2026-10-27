// Solver benchmark (SPEC §5.4): p50 / p95 for solve, analyze and ddTable on seeded deals.
//
//   pnpm bench                       50 full deals, all three jobs, DDS (wasm) solver
//   pnpm bench --engine ts           the pure-TS solver instead (too slow for 13 cards)
//   pnpm bench --deals 10 --cards 8  10 deals cut down to 8 cards per hand
//   pnpm bench --only solve          one job (solve | analyze | ddTable)
//
// Every TS job starts from an empty cache (`clear()`), so the numbers are cold-start times. DDS
// resets its own table on every call.

import type { Deal, Strain } from '../src/engine';
import { STRAINS, dealRandom, mulberry32 } from '../src/engine';
import type { CardAnalysis, DDTable, Position } from '../src/solver';
import { Solver, loadDds } from '../src/solver';

type Job = 'solve' | 'analyze' | 'ddTable';

const TARGETS_MS: Record<Job, number> = { solve: 1000, analyze: 1500, ddTable: 4000 };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const deals = Number(arg('deals') ?? 50);
const cards = Number(arg('cards') ?? 13);
const only = arg('only') as Job | undefined;
const engine = arg('engine') ?? 'dds';
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

/** What the bench needs from a solver, plus optional search statistics. */
type Engine = {
  solve(pos: Position): number;
  analyze(pos: Position): CardAnalysis[];
  ddTable(deal: Deal): DDTable;
  reset(): void;
  stats(): { nodes: number; probes: number; hits: number } | null;
};

async function makeEngine(): Promise<Engine> {
  if (engine === 'dds') {
    const dds = await loadDds();
    return {
      solve: (p) => dds.solve(p),
      analyze: (p) => dds.analyze(p),
      ddTable: (d) => dds.ddTable(d),
      reset: () => {},
      stats: () => null,
    };
  }
  if (engine !== 'ts') throw new Error(`unknown engine "${engine}" (dds | ts)`);
  const ts = new Solver();
  let probes = 0;
  let hits = 0;
  return {
    solve: (p) => ts.solve(p),
    analyze: (p) => ts.analyze(p),
    ddTable: (d) => ts.ddTable(d),
    reset: () => {
      probes += ts.ttStats.probes;
      hits += ts.ttStats.hits;
      ts.clear();
    },
    stats: () => ({
      nodes: ts.nodes,
      probes: probes + ts.ttStats.probes,
      hits: hits + ts.ttStats.hits,
    }),
  };
}

const solver = await makeEngine();
console.log(`bench: ${engine}, ${deals} deals × ${cards} cards per hand (Node ${process.version})`);

let failed = false;
for (const job of jobs) {
  const times: number[] = [];
  const before = solver.stats();
  for (let i = 0; i < deals; i++) {
    const { deal, strain } = benchDeal(i);
    const pos = { hands: deal, trump: strain, trick: [], toPlay: 'W' as const };
    solver.reset();
    const t0 = performance.now();
    if (job === 'solve') solver.solve(pos);
    else if (job === 'analyze') solver.analyze(pos);
    else solver.ddTable(deal);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const p95 = percentile(times, 95);
  const meets =
    cards < 13 ? '' : p95 < TARGETS_MS[job] ? '  ✓ target' : `  ✗ target ${fmt(TARGETS_MS[job])}`;
  if (cards === 13 && p95 >= TARGETS_MS[job]) failed = true;
  const after = solver.stats();
  let extra = '';
  if (before && after) {
    const probes = after.probes - before.probes;
    const hits = after.hits - before.hits;
    extra = `  nodes/deal ${Math.round((after.nodes - before.nodes) / deals).toLocaleString('en')}`;
    if (probes > 0) extra += `  TT hits ${((100 * hits) / probes).toFixed(0)}%`;
  }
  console.log(
    `${job.padEnd(8)} p50 ${fmt(percentile(times, 50)).padStart(9)}  p95 ${fmt(p95).padStart(9)}  ` +
      `max ${fmt(times.at(-1) as number).padStart(9)}${extra}${meets}`,
  );
}
if (failed) process.exitCode = 1;
