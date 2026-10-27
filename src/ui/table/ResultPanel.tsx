// End of hand: made / down and the score (SPEC §4.3). The full analysis page comes in M10.

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Contract, Vulnerability } from '../../engine';
import { contractLabel, isDeclarerVulnerable, scoreBreakdown, tricksNeeded } from '../../engine';

type ResultPanelProps = {
  contract: Contract;
  vulnerability: Vulnerability;
  nsTricks: number;
  onNewHand: () => void;
};

export function ResultPanel({ contract, vulnerability, nsTricks, onNewHand }: ResultPanelProps) {
  const result = scoreBreakdown(contract, nsTricks, isDeclarerVulnerable(vulnerability));
  const needed = tricksNeeded(contract);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);

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
        <div className="mt-2 flex w-full gap-2">
          <button
            ref={first}
            type="button"
            onClick={onNewHand}
            className="flex-1 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            มือใหม่
          </button>
          <Link
            to="/"
            className="flex-1 rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
          >
            หน้าแรก
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
