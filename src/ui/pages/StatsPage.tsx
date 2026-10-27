// #/stats (SPEC §7.6): hands played, contracts made, tricks lost against double dummy and hints
// used — overall, suit contracts vs NT, and per strain.

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Strain } from '../../engine';
import { SUIT_INFO, strainSymbol } from '../../engine';
import type { StatLine } from '../../game/stats';
import { statTotals } from '../../game/stats';
import { statsStore, useStats } from '../gameStore';
import { NotSavedNotice, PageHeader } from './PageHeader';

const pct = (part: number, whole: number) => `${Math.round((part / whole) * 100)}%`;
const avg = (sum: number, hands: number) => (sum / hands).toFixed(1);

function StrainLabel({ strain }: { strain: Strain }) {
  const red = strain !== 'NT' && SUIT_INFO[strain].red;
  return <span className={red ? 'text-red-300' : undefined}>{strainSymbol(strain)}</span>;
}

type RowProps = { id: string; label: ReactNode; line: StatLine; strong?: boolean };

function Row({ id, label, line, strong }: RowProps) {
  const empty = line.hands === 0;
  return (
    <tr
      data-row={id}
      className={`border-t border-white/10 ${strong ? 'font-semibold' : ''} ${empty ? 'text-white/40' : ''}`}
    >
      <th scope="row" className="py-2 pr-2 text-left font-semibold whitespace-nowrap">
        {label}
      </th>
      <td className="px-1 text-right tabular-nums" data-col="hands">
        {line.hands}
      </td>
      <td className="px-1 text-right tabular-nums" data-col="made">
        {empty ? '—' : pct(line.made, line.hands)}
        {!empty && (
          <span className="block text-[11px] font-normal text-white/60">
            {line.made}/{line.hands}
          </span>
        )}
      </td>
      <td className="px-1 text-right tabular-nums" data-col="lost">
        {line.lost}
        {!empty && (
          <span className="block text-[11px] font-normal text-white/60">
            {avg(line.lost, line.hands)}/มือ
          </span>
        )}
      </td>
      <td className="pl-1 text-right tabular-nums" data-col="hints">
        {line.hints}
        {!empty && (
          <span className="block text-[11px] font-normal text-white/60">
            {avg(line.hints, line.hands)}/มือ
          </span>
        )}
      </td>
    </tr>
  );
}

/** Two presses: the first arms it for a few seconds, the second wipes the stats. */
function ResetButton() {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      onClick={() => {
        if (armed) statsStore.getState().reset();
        setArmed(!armed);
      }}
      className={`self-center rounded-lg px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none ${
        armed ? 'bg-red-600 font-semibold hover:bg-red-500' : 'bg-white/10 hover:bg-white/20'
      }`}
    >
      {armed ? 'กดอีกครั้งเพื่อล้างสถิติทั้งหมด' : 'ล้างสถิติ'}
    </button>
  );
}

export function StatsPage() {
  const stats = useStats((s) => s.stats);
  const persistent = useStats((s) => s.persistent);
  const { all, suit, nt } = statTotals(stats);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 pb-8">
      <PageHeader title="สถิติ" />
      {!persistent && <NotSavedNotice what="สถิติ" />}

      {all.hands === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-black/25 p-6 text-center">
          <p data-testid="stats-empty">ยังไม่มีสถิติ — เล่นให้จบสักมือก่อน</p>
          <Link
            to="/"
            className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
          >
            กลับหน้าแรก
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-black/25 px-3 py-2 sm:px-4">
            <table className="w-full text-sm sm:text-base" data-testid="stats-table">
              <thead>
                <tr className="text-xs text-white/60 sm:text-sm">
                  <th scope="col" className="py-2 text-left font-normal">
                    <span className="sr-only">ประเภท</span>
                  </th>
                  <th scope="col" className="px-1 text-right font-normal">
                    มือ
                  </th>
                  <th scope="col" className="px-1 text-right font-normal">
                    ทำได้
                  </th>
                  <th scope="col" className="px-1 text-right font-normal">
                    เสีย trick
                  </th>
                  <th scope="col" className="pl-1 text-right font-normal">
                    คำใบ้
                  </th>
                </tr>
              </thead>
              <tbody>
                <Row id="all" label="ทั้งหมด" line={all} strong />
                <Row id="suit" label="suit" line={suit} strong />
                {(['S', 'H', 'D', 'C'] as const).map((s) => (
                  <Row
                    key={s}
                    id={s}
                    label={
                      <span className="pl-3">
                        <StrainLabel strain={s} />
                      </span>
                    }
                    line={stats.byStrain[s]}
                  />
                ))}
                <Row id="NT" label="NT" line={nt} strong />
              </tbody>
            </table>
          </div>
          <p className="text-sm text-white/70">
            "เสีย trick" นับเทียบกับการเล่นที่ดีที่สุด (double dummy) ตามหน้าวิเคราะห์หลังจบมือ ·
            นับครั้งแรกที่เล่นจบของแต่ละมือ ส่วนการย้อนหรือเล่นมือเดิมซ้ำไม่นับเพิ่ม ·
            มือที่เปิดโหมดศึกษาไม่นับ
          </p>
          <ResetButton />
        </>
      )}
    </main>
  );
}
