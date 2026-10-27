// #/dev/solver — tries the solver worker by hand (TASKS M5): runs ddTable or plays a whole deal out
// through the worker while the page stays usable. Not linked from the app.
// `#/dev/solver?seed=N` deals from a seeded RNG instead of crypto (e2e uses it).

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Deal, Strain } from '../../engine';
import {
  STRAINS,
  applyPlay,
  cryptoRng,
  dealRandom,
  encodeDeal,
  isComplete,
  mulberry32,
  newPlayState,
  sideOf,
  strainSymbol,
  tricksWon,
} from '../../engine';
import type { DDTable } from '../../solver';
import { positionFromPlayState } from '../../solver/position';
import { getSolver, isAbortError } from '../../worker';

type Status =
  | { kind: 'idle' }
  | { kind: 'busy'; what: string }
  | { kind: 'done'; text: string }
  | { kind: 'error'; text: string };

const solver = getSolver();

/** Plays `deal` out in `trump` with every seat choosing a DD-best card; returns NS tricks. */
async function playOutDd(deal: Deal, trump: Strain, signal: AbortSignal): Promise<number> {
  let state = newPlayState(deal, { level: 1, strain: trump, declarer: 'S' });
  while (!isComplete(state)) {
    const pos = positionFromPlayState(state);
    const lines = await solver.analyze(pos, { signal });
    const ns = sideOf(pos.toPlay) === 'NS';
    const best = lines.reduce((a, b) =>
      (ns ? b.nsTricks > a.nsTricks : b.nsTricks < a.nsTricks) ? b : a,
    );
    state = applyPlay(state, best.card);
  }
  return tricksWon(state).NS;
}

export function DevSolverPage() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [table, setTable] = useState<DDTable | null>(null);
  const [clicks, setClicks] = useState(0);
  const [busyClicks, setBusyClicks] = useState(0);
  const [maxGap, setMaxGap] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const [params] = useSearchParams();
  const seed = params.get('seed');
  const [rng] = useState(() => (seed ? mulberry32(Number(seed)) : cryptoRng()));
  const gap = useRef(0);
  const busy = status.kind === 'busy';

  useEffect(() => solver.warmUp(), []);

  // Longest gap between animation frames while a job runs: stays small if the main thread is free.
  useEffect(() => {
    if (!busy) return;
    gap.current = 0;
    setMaxGap(0);
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      if (now - last > gap.current) {
        gap.current = now - last;
        setMaxGap(Math.round(gap.current));
      }
      last = now;
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [busy]);

  async function run(what: string, job: (signal: AbortSignal) => Promise<string>) {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setStatus({ kind: 'busy', what });
    const t0 = performance.now();
    try {
      const text = await job(ctrl.signal);
      setStatus({ kind: 'done', text: `${text} (${Math.round(performance.now() - t0)} ms)` });
    } catch (err) {
      if (isAbortError(err) && abort.current !== ctrl) return; // replaced by a newer job
      setStatus(
        isAbortError(err)
          ? { kind: 'idle' }
          : { kind: 'error', text: err instanceof Error ? err.message : String(err) },
      );
    }
  }

  const runTables = (count: number) =>
    run(`ddTable ${count} มือ`, async (signal) => {
      setTable(null);
      let code = '';
      for (let i = 0; i < count; i++) {
        const deal = dealRandom(rng);
        code = encodeDeal(deal);
        setTable(await solver.ddTable(deal, { signal }));
      }
      return count === 1
        ? `ddTable ของมือ ${code}`
        : `ddTable ${count} มือ (ตารางของมือสุดท้าย ${code})`;
    });

  const runPlay = () =>
    run('เล่นทั้งมือ', async (signal) => {
      const deal = dealRandom(rng);
      const trump: Strain = 'NT';
      const start = await solver.solve({ hands: deal, trump, trick: [], toPlay: 'W' }, { signal });
      const got = await playOutDd(deal, trump, signal);
      return `เล่นครบ 52 ใบ (analyze ทุกตา): NS ได้ ${got} trick, DD ตอนเริ่ม ${start} ${got === start ? '✓' : '✗'}`;
    });

  const cancel = () => {
    abort.current?.abort();
    abort.current = null;
    setStatus({ kind: 'idle' });
  };

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-bold">ทดลอง solver worker</h1>
      <p className="text-sm text-white/70">
        solver รันใน Web Worker — ระหว่างคำนวณ ปุ่มนับและวงกลมหมุนต้องยังตอบสนอง
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-white/15 px-4 py-2 hover:bg-white/25 disabled:opacity-40"
          onClick={() => runTables(1)}
          disabled={busy}
        >
          ddTable มือสุ่ม
        </button>
        <button
          type="button"
          className="rounded-lg bg-white/15 px-4 py-2 hover:bg-white/25 disabled:opacity-40"
          onClick={() => runTables(10)}
          disabled={busy}
        >
          ddTable 10 มือ
        </button>
        <button
          type="button"
          className="rounded-lg bg-white/15 px-4 py-2 hover:bg-white/25 disabled:opacity-40"
          onClick={runPlay}
          disabled={busy}
        >
          เล่นทั้งมือแบบ DD
        </button>
        <button
          type="button"
          className="rounded-lg bg-red-500/30 px-4 py-2 hover:bg-red-500/45 disabled:opacity-40"
          onClick={cancel}
          disabled={!busy}
        >
          ยกเลิก
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="rounded-lg bg-emerald-500/30 px-4 py-2 hover:bg-emerald-500/45"
          onClick={() => {
            setClicks((n) => n + 1);
            if (busy) setBusyClicks((n) => n + 1);
          }}
        >
          กดนับ: <span data-testid="clicks">{clicks}</span>
        </button>
        <motion.div
          aria-hidden
          className="size-6 rounded-full border-4 border-white/20 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
        <span className="text-sm text-white/70">
          กดระหว่างคำนวณ: <span data-testid="busy-clicks">{busyClicks}</span>
        </span>
        <span className="text-sm text-white/70">
          เฟรมค้างนานสุด: <span data-testid="max-gap">{maxGap}</span> ms
        </span>
      </div>

      <p data-testid="status" data-state={status.kind} className="min-h-6">
        {status.kind === 'busy' && `กำลังคำนวณ ${status.what}...`}
        {status.kind === 'done' && status.text}
        {status.kind === 'error' && `ผิดพลาด: ${status.text}`}
      </p>

      {table && (
        <table data-testid="dd-table" className="w-fit border-collapse text-center">
          <thead>
            <tr>
              {STRAINS.map((s) => (
                <th key={s} className="border border-white/20 px-3 py-1">
                  {strainSymbol(s)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {STRAINS.map((s) => (
                <td key={s} className="border border-white/20 px-3 py-1">
                  {table[s]}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      )}

      <p className="text-xs text-white/50">worker ที่เริ่มไปแล้ว: {solver.workersStarted}</p>
    </main>
  );
}
