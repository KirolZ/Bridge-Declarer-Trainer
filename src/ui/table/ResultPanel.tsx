// End of hand: made / down and the score (SPEC §4.3), hints used (§7.2), and the ways on: new
// hand, play this hand again, undo the last card (§7.3). The full analysis page comes in M10.

import { motion } from 'framer-motion';
import { Fragment, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Contract, Vulnerability } from '../../engine';
import { contractLabel, isDeclarerVulnerable, scoreBreakdown, tricksNeeded } from '../../engine';

type ResultPanelProps = {
  contract: Contract;
  vulnerability: Vulnerability;
  nsTricks: number;
  /** The hand ended with an accepted claim. */
  claimed: boolean;
  hintsUsed: number;
  /** Study mode was on: the hand does not count for the stats. */
  studied: boolean;
  onNewHand: () => void;
  onRestart: () => void;
  onUndo: () => void;
};

const SECONDARY =
  'flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none';

export function ResultPanel(props: ResultPanelProps) {
  const { contract, vulnerability, nsTricks, claimed, hintsUsed, studied } = props;
  const result = scoreBreakdown(contract, nsTricks, isDeclarerVulnerable(vulnerability));
  const needed = tricksNeeded(contract);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);

  const notes = [
    claimed && 'จบด้วย claim',
    hintsUsed > 0 ? `ใช้คำใบ้ ${hintsUsed} ครั้ง` : 'ไม่ได้ใช้คำใบ้',
    studied && 'โหมดศึกษา (ไม่นับสถิติ)',
  ].filter(Boolean);

  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center bg-black/55 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        data-testid="result"
        data-made={result.made}
        className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-white/10 bg-felt-dark p-6 text-center shadow-2xl"
        initial={{ scale: 0.9, y: 16 }}
        animate={{ scale: 1, y: 0 }}
      >
        <h2
          id="result-title"
          className={`text-2xl font-bold ${result.made ? 'text-amber-300' : 'text-red-300'}`}
        >
          {result.made
            ? `ทำ ${contractLabel(contract)} ได้!`
            : `${contractLabel(contract)} ขาด ${-result.result} trick`}
        </h2>
        <p className="text-white/85">
          ได้ {nsTricks} trick (ต้องได้ {needed})
          {result.made && result.result > 0 && ` · เกิน ${result.result}`}
        </p>
        <p className="text-3xl font-bold tabular-nums" data-testid="score">
          {result.total > 0 ? `+${result.total}` : result.total}
          <span className="ml-1 text-base font-normal text-white/70">แต้ม</span>
        </p>
        <p className="text-sm text-white/65" data-testid="result-notes">
          {notes.map((note, i) => (
            <Fragment key={i}>
              {i > 0 && ' · '}
              <span className="whitespace-nowrap">{note}</span>
            </Fragment>
          ))}
        </p>
        <div className="mt-2 flex w-full gap-2">
          <button
            ref={first}
            type="button"
            onClick={props.onNewHand}
            className="flex-1 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            มือใหม่
          </button>
          <button type="button" onClick={props.onRestart} className={SECONDARY}>
            เล่นมือนี้ใหม่
          </button>
        </div>
        <div className="flex w-full gap-2">
          <button type="button" onClick={props.onUndo} aria-keyshortcuts="U" className={SECONDARY}>
            ↶ ย้อน{claimed ? ' claim' : 'ใบล่าสุด'}
          </button>
          <Link to="/" className={SECONDARY}>
            หน้าแรก
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
