// The auction of the hand (SPEC §4.5, §8): four columns W N E S with the dealer and the
// vulnerable side marked. Open, it shows the whole table; closed, one line of the calls that are
// not passes, which a tap opens again. The table decides when it is open.

import type { Auction, Call, Seat, Vulnerability } from '../../engine';
import { callerAt, strainSymbol } from '../../engine';
import type { Messages } from '../../i18n';
import { useT } from '../gameStore';
import { SEAT_NAME } from './labels';

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
  open: boolean;
  onToggle(): void;
};

export function AuctionTable({ auction, vulnerability, open, onToggle }: AuctionTableProps) {
  const t = useT();
  const { dealer, calls } = auction;
  // Empty cells before the dealer's first call, then the calls in order.
  const offset = COLUMNS.indexOf(dealer);
  const cells: (number | null)[] = [...Array<null>(offset).fill(null), ...calls.map((_, i) => i)];
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 4) rows.push(cells.slice(i, i + 4));
  const info = `${t.auction.dealer(dealer)} · ${t.vulnerability[vulnerability]}`;

  if (!open) {
    const shown = calls
      .map((call, i) => ({ call, seat: callerAt(dealer, i), i }))
      .filter(({ call }) => call.kind !== 'pass');
    return (
      <div className="border-b border-white/10 bg-black/20 px-2 py-1 sm:px-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
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

  return (
    <section
      aria-label={t.auction.title}
      data-testid="auction"
      className="border-b border-white/10 bg-black/20 px-2 py-1.5 sm:px-4"
    >
      <div className="mx-auto flex max-w-4xl items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline gap-2 text-xs text-white/70">
            <span className="font-semibold text-white">{t.auction.title}</span>
            <span className="truncate" data-testid="auction-info">
              {info}
            </span>
          </div>
          <table className="w-full max-w-sm table-fixed overflow-hidden rounded-lg bg-white text-center text-sm text-black">
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
                    return (
                      <td
                        key={seat}
                        className="px-1 py-0.5"
                        data-testid={call ? 'auction-call' : undefined}
                        title={call ? `${SEAT_NAME[seat]}: ${callText(call, t)}` : undefined}
                      >
                        {call && <CallLabel call={call} t={t} />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded
          data-testid="auction-toggle"
          className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-xs hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
        >
          {t.auction.hide} ▴
        </button>
      </div>
    </section>
  );
}
