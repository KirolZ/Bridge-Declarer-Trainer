// The auction of the hand (SPEC §4.5, §8): four columns W N E S with the dealer and the
// vulnerable side marked. Open, it shows the whole table — tap a call for its meaning (the data the
// bidder used, M31) — and what the defenders probably hold; closed, one line of the calls that are
// not passes, which a tap opens again. The caller decides when it is open.

import { useState } from 'react';
import type { Auction, Call, Seat, Vulnerability } from '../../engine';
import { callerAt, strainSymbol } from '../../engine';
import type { Messages } from '../../i18n';
import { useLanguage, useT } from '../gameStore';
import { Rich, TermSheetProvider } from '../learn/Rich';
import { SEAT_NAME } from './labels';
import type { AuctionInfo } from './auctionInfo';
import { callMarkup } from './auctionInfo';
import { inferenceMarkup, meaningMarkup, plainText } from './meaningText';

/** Column order of an auction table, as printed in bridge books. */
const COLUMNS: readonly Seat[] = ['W', 'N', 'E', 'S'];

function isVulnerable(seat: Seat, vulnerability: Vulnerability): boolean {
  return vulnerability === 'ns' && (seat === 'N' || seat === 'S');
}

/** A call as printed: `1♥` (suit in its colour), `3NT`, `Pass`, `X`, `XX`. */
export function CallLabel({ call, t }: { call: Call; t: Messages }) {
  switch (call.kind) {
    case 'bid': {
      const red = call.strain === 'H' || call.strain === 'D';
      const black = call.strain === 'S' || call.strain === 'C';
      return (
        <span className="font-semibold whitespace-nowrap">
          {call.level}
          <span className={red ? 'text-suit-red' : black ? 'text-suit-black' : undefined}>
            {strainSymbol(call.strain)}
          </span>
        </span>
      );
    }
    case 'pass':
      return <span className="text-black/55">{t.auction.pass}</span>;
    case 'double':
      return <span className="font-semibold text-suit-red">{t.auction.double}</span>;
    case 'redouble':
      return <span className="font-semibold text-blue-700">{t.auction.redouble}</span>;
  }
}

/** Plain text of a call for screen readers and titles. */
function callText(call: Call, t: Messages): string {
  switch (call.kind) {
    case 'bid':
      return `${call.level}${strainSymbol(call.strain)}`;
    case 'pass':
      return t.auction.pass;
    case 'double':
      return t.auction.double;
    case 'redouble':
      return t.auction.redouble;
  }
}

type AuctionTableProps = {
  auction: Auction;
  vulnerability: Vulnerability;
  info: AuctionInfo;
  open: boolean;
  onToggle(): void;
  /** Classes of the outer box (default: the bar above the table). */
  className?: string;
};

const BAR = 'border-b border-white/10 bg-black/20 px-2 py-1.5 sm:px-4';

export function AuctionTable({
  auction,
  vulnerability,
  info,
  open,
  onToggle,
  className = BAR,
}: AuctionTableProps) {
  const t = useT();
  const lang = useLanguage();
  const { dealer, calls } = auction;
  /** The call whose meaning is on show (index into `calls`). */
  const [picked, setPicked] = useState<number | null>(null);
  // Empty cells before the dealer's first call, then the calls in order.
  const offset = COLUMNS.indexOf(dealer);
  const cells: (number | null)[] = [...Array<null>(offset).fill(null), ...calls.map((_, i) => i)];
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 4) rows.push(cells.slice(i, i + 4));
  const header = `${t.auction.dealer(dealer)} · ${t.vulnerability[vulnerability]}`;
  const meaningOf = (i: number) => meaningMarkup(info.meanings[i] ?? null, t);

  if (!open) {
    const shown = calls
      .map((call, i) => ({ call, seat: callerAt(dealer, i), i }))
      .filter(({ call }) => call.kind !== 'pass');
    return (
      <div className={className}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          aria-keyshortcuts="A"
          data-testid="auction-toggle"
          className="flex w-full max-w-4xl min-w-0 items-center gap-2 rounded-lg px-1 py-0.5 text-left text-sm hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none sm:mx-auto"
        >
          <span className="shrink-0 text-xs text-white/70">{t.auction.title}</span>
          <span
            className="flex min-w-0 flex-1 gap-1.5 overflow-hidden rounded bg-white px-1.5 text-black"
            data-testid="auction-line"
          >
            {shown.map(({ call, seat, i }) => (
              <span key={i} className="shrink-0 whitespace-nowrap">
                <span className="text-[11px] text-black/55">{seat}</span>{' '}
                <CallLabel call={call} t={t} />
              </span>
            ))}
          </span>
          <span className="shrink-0 text-xs text-white/70" aria-hidden>
            ▾
          </span>
          <span className="sr-only">{t.auction.show}</span>
        </button>
      </div>
    );
  }

  const pickedCall = picked === null ? null : (calls[picked] ?? null);
  const defenders = (['W', 'E'] as const).filter((s) => info.inference[s]);

  return (
    <TermSheetProvider>
      <section
        aria-label={t.auction.title}
        data-testid="auction"
        className={`@container ${className}`}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-1 text-left">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span className="font-semibold text-white">{t.auction.title}</span>
            <span className="min-w-0 flex-1 truncate" data-testid="auction-info">
              {header}
            </span>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded
              aria-keyshortcuts="A"
              data-testid="auction-toggle"
              className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
            >
              {t.auction.hide} ▴
            </button>
          </div>
          <div className="flex flex-col gap-1.5 @2xl:flex-row @2xl:items-start @2xl:gap-6">
            <div className="flex w-full max-w-sm min-w-0 flex-col gap-1.5">
              <table className="w-full table-fixed overflow-hidden rounded-lg bg-white text-center text-sm text-black">
                <thead>
                  <tr className="text-xs">
                    {COLUMNS.map((seat) => (
                      <th
                        key={seat}
                        scope="col"
                        data-dealer={seat === dealer || undefined}
                        className={[
                          'px-1 py-0.5 font-semibold',
                          isVulnerable(seat, vulnerability)
                            ? 'bg-suit-red text-white'
                            : 'bg-black/10 text-black/75',
                          seat === dealer && 'underline decoration-2 underline-offset-2',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {SEAT_NAME[seat]}
                        {isVulnerable(seat, vulnerability) && (
                          <span className="sr-only"> ({t.auction.vulnerableSeat})</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, r) => (
                    <tr key={r} className="border-t border-black/5">
                      {COLUMNS.map((seat, c) => {
                        const i = row[c];
                        const call = i === null || i === undefined ? null : calls[i]!;
                        if (call === null || i === null || i === undefined) {
                          return <td key={seat} className="px-0.5 py-0.5" />;
                        }
                        const label = `${SEAT_NAME[seat]}: ${callText(call, t)} — ${plainText(meaningOf(i), lang)}`;
                        return (
                          <td key={seat} className="p-0.5" data-testid="auction-call">
                            <button
                              type="button"
                              onClick={() => setPicked(picked === i ? null : i)}
                              aria-pressed={picked === i}
                              title={label}
                              aria-label={label}
                              data-testid="auction-call-button"
                              className={[
                                'w-full rounded px-1 py-0.5 hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none',
                                picked === i && 'bg-amber-200 ring-1 ring-amber-500',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <CallLabel call={call} t={t} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <p
                className="min-h-5 text-sm leading-relaxed text-white/90"
                data-testid="auction-meaning"
                aria-live="polite"
              >
                {pickedCall && picked !== null ? (
                  <>
                    <span className="font-semibold text-white">
                      <Rich
                        text={t.meaning.call(callMarkup(pickedCall, t), callerAt(dealer, picked))}
                      />
                    </span>
                    {' — '}
                    <Rich text={meaningOf(picked)} />
                  </>
                ) : (
                  <span className="text-white/60">{t.meaning.pick}</span>
                )}
              </p>
            </div>

            {defenders.length > 0 && (
              <div
                className="min-w-0 flex-1 text-sm leading-relaxed"
                data-testid="auction-inference"
              >
                <p className="text-xs text-white/70">
                  <span className="font-semibold text-white">{t.meaning.inferTitle}</span> (
                  {t.meaning.inferNote})
                </p>
                <ul>
                  {defenders.map((s) => (
                    <li key={s} data-seat={s} className="text-white/90">
                      <span className="font-semibold">{SEAT_NAME[s]}:</span>{' '}
                      <Rich text={inferenceMarkup(info.inference[s]!, t)} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </TermSheetProvider>
  );
}
