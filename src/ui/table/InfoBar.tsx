// Contract, tricks needed and tricks taken (SPEC §8 info panel), plus the practice buttons
// (`actions`): inline on wider screens, a row of their own on phones.

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Contract, TrickCount, Vulnerability } from '../../engine';
import { contractLabel, tricksNeeded } from '../../engine';
import { useT } from '../gameStore';

type InfoBarProps = {
  contract: Contract;
  vulnerability: Vulnerability;
  won: TrickCount;
  /** Trick being played (1-based), or the total when the hand is over. */
  trickNumber: number;
  totalTricks: number;
  actions?: ReactNode;
};

function Stat({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="text-[11px] text-white/60">{label}</span>
      <span className="font-semibold tabular-nums" data-testid={testId}>
        {value}
      </span>
    </div>
  );
}

export function InfoBar(props: InfoBarProps) {
  const { contract, vulnerability, won, trickNumber, totalTricks, actions } = props;
  const red = contract.strain === 'H' || contract.strain === 'D';
  const t = useT();
  return (
    <header className="relative z-20 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-white/10 bg-black/25 px-2 py-1.5 sm:gap-x-4 sm:px-4">
      <Link
        to="/"
        aria-label={t.common.backHome}
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-lg hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
      >
        ←
      </Link>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-lg font-bold whitespace-nowrap sm:text-xl" data-testid="contract">
          <span className="rounded bg-white px-1.5 py-0.5 text-black">
            {contract.level}
            <span className={red ? 'text-suit-red' : 'text-suit-black'}>
              {contractLabel(contract).slice(1)}
            </span>
          </span>{' '}
          <span className="text-sm font-normal text-white/80 sm:text-base">
            {t.table.byDeclarer}
          </span>
        </span>
        <span className="truncate text-[11px] text-white/60 sm:text-xs">
          {t.table.needed(tricksNeeded(contract))} · {t.vulnerability[vulnerability]}
        </span>
      </div>
      <Stat label="NS" value={String(won.NS)} testId="tricks-ns" />
      <Stat label="EW" value={String(won.EW)} testId="tricks-ew" />
      <Stat label="trick" value={`${trickNumber}/${totalTricks}`} testId="trick-number" />
      {actions}
    </header>
  );
}
