// Replay of the hand, one trick at a time (SPEC §7.5): all four hands as they stood before the
// trick, the trick itself, where the player lost tricks in it, and "play again from here".

import { useEffect, useRef } from 'react';
import type { Card, PlayState, Seat } from '../../engine';
import { completedTricks, remainingHands, sameCard, toPlay, tricksWon } from '../../engine';
import type { CardAnalysis } from '../../solver';
import type { HandReview } from '../../game/review';
import { ddValueAt, replayTrickCount } from '../../game/review';
import type { Messages } from '../../i18n';
import { useT } from '../gameStore';
import type { CardMark } from './hands';
import { OpenHand } from './hands';
import { SEAT_NAME } from './labels';
import { LossText } from './ResultPanel';
import { TrickArea } from './TrickArea';

type ReplayViewProps = {
  play: PlayState;
  analyses: Readonly<Record<number, readonly CardAnalysis[]>>;
  review: HandReview;
  /** NS tricks of an accepted claim, or null. */
  claimed: number | null;
  /** Trick on show (1-based). */
  trick: number;
  onTrick: (trick: number) => void;
  onClose: () => void;
  /** Rewinds play to the start of `trick` and goes back to the table. */
  onPlayFrom: (trick: number) => void;
};

const NAV =
  'flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm whitespace-nowrap hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/10';

type ReplayWords = Messages['replay'];

const LEGEND: { mark: CardMark; text: (w: ReplayWords) => string; className: string }[] = [
  { mark: 'played', text: (w) => w.legendPlayed, className: 'bg-amber-300 text-black' },
  { mark: 'wrong', text: (w) => w.legendWrong, className: 'bg-red-600 text-white' },
  { mark: 'better', text: (w) => w.legendBetter, className: 'outline-2 outline-emerald-500' },
];

export function ReplayView(props: ReplayViewProps) {
  const { play, analyses, review, claimed, trick, onTrick, onClose, onPlayFrom } = props;
  const t = useT();
  const count = replayTrickCount(play, claimed !== null);
  const start = (trick - 1) * 4;
  const before: PlayState = { ...play, plays: play.plays.slice(0, start) };
  const hands = remainingHands(before);
  const cards = play.plays.slice(start, start + 4);
  const winner = cards.length === 4 ? (completedTricks(play)[trick - 1]?.winner ?? null) : null;
  const leader = toPlay(before);
  const won = tricksWon(before);
  const dd = ddValueAt(play, analyses, start);
  const losses = review.losses.filter((l) => l.trick === trick);
  const isClaim = claimed !== null && trick === count;
  const trump = play.contract.strain;
  const lossTricks = new Set(review.losses.map((l) => l.trick));

  const next = useRef<HTMLButtonElement>(null);
  useEffect(() => next.current?.focus({ preventScroll: true }), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowLeft' && trick > 1) onTrick(trick - 1);
      else if (e.key === 'ArrowRight' && trick < count) onTrick(trick + 1);
      else if (e.key === 'Escape') onClose();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trick, count, onTrick, onClose]);

  const markOf =
    (seat: Seat) =>
    (card: Card): CardMark | undefined => {
      for (const l of losses) {
        if (l.seat !== seat) continue;
        if (l.kind === 'card' && sameCard(l.card, card)) return 'wrong';
        if (l.best.some((c) => sameCard(c, card))) return 'better';
      }
      if (cards.some((p) => p.seat === seat && sameCard(p.card, card))) return 'played';
      return undefined;
    };
  const used = new Set(
    (['N', 'E', 'S', 'W'] as const).flatMap((s) =>
      hands[s].map((c) => markOf(s)(c)).filter((m) => m !== undefined),
    ),
  );
  const diagram = (seat: Seat) => (
    <div className="flex flex-col items-center gap-1">
      <span className="rounded-full bg-black/35 px-2 text-xs font-semibold text-white/85">
        {t.seatRole[seat]}
      </span>
      <OpenHand cards={hands[seat]} trump={trump} label={SEAT_NAME[seat]} markOf={markOf(seat)} />
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="replay-title"
      data-testid="replay"
      data-trick={trick}
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-felt-dark"
    >
      <header className="flex items-center gap-2 border-b border-white/10 bg-black/25 px-2 py-1.5 sm:px-4">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.replay.back}
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-lg hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
        >
          ←
        </button>
        <h2 id="replay-title" className="flex-1 text-lg font-bold">
          {t.replay.title(trick, count)}
        </h2>
        <span className="text-sm whitespace-nowrap text-white/75 tabular-nums">
          NS {won.NS} · EW {won.EW}
        </span>
      </header>

      <nav
        aria-label={t.replay.pickTrick}
        className="flex flex-wrap justify-center gap-1 px-2 pt-2 sm:px-4"
      >
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
          const lossy = lossTricks.has(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onTrick(n)}
              aria-current={n === trick ? 'true' : undefined}
              aria-label={t.replay.trick(n, lossy)}
              className={[
                'relative grid size-8 place-items-center rounded-md text-sm tabular-nums focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none',
                n === trick ? 'bg-amber-300 font-bold text-black' : 'bg-white/10 hover:bg-white/20',
                lossy && n !== trick && 'text-red-200 ring-1 ring-red-400',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {n}
              {lossy && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 size-2.5 rounded-full bg-red-500"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="flex flex-1 flex-col gap-2 p-2 sm:p-4">
        <div
          className="table-felt mx-auto flex w-full max-w-3xl flex-col"
          style={{ containerType: 'inline-size' }}
        >
          <div className="table-cards flex flex-col items-center gap-2 p-2 sm:gap-3 sm:p-4">
            {diagram('N')}
            <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-1">
              <div className="flex justify-start">{diagram('W')}</div>
              <TrickArea
                key={trick}
                trickNumber={trick}
                plays={cards}
                winner={winner}
                gatherTo={null}
              />
              <div className="flex justify-end">{diagram('E')}</div>
            </div>
            {diagram('S')}
          </div>
        </div>

        <div
          className="mx-auto flex w-full max-w-3xl flex-col gap-1.5 text-sm text-white/85"
          data-testid="replay-notes"
        >
          <p>
            {leader && t.replay.led(leader)}
            {winner && ` · ${t.table.wonTrick(winner)}`}
            {dd !== null && ` · ${t.replay.ddBefore(dd)}`}
          </p>
          {isClaim && <p data-testid="replay-claim">{t.replay.claimHere(claimed)}</p>}
          {losses.map((l) => (
            <p
              key={`${l.kind}${l.index}`}
              data-testid="replay-loss"
              className="rounded-lg bg-red-950/60 px-3 py-2 leading-relaxed"
            >
              <span className="font-semibold text-red-200">{t.replay.lost(l.lost)}</span>
              <LossText loss={l} />
            </p>
          ))}
          {used.size > 0 && (
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/70">
              {LEGEND.filter((m) => used.has(m.mark)).map((m) => (
                <span key={m.mark} className="inline-flex items-center gap-1">
                  <span className={`inline-block size-3 rounded-sm ${m.className}`} />
                  {m.text(t.replay)}
                </span>
              ))}
            </p>
          )}
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-2">
          <button
            type="button"
            className={NAV}
            disabled={trick <= 1}
            onClick={() => onTrick(trick - 1)}
          >
            {t.replay.prev}
          </button>
          <button
            ref={next}
            type="button"
            className={NAV}
            disabled={trick >= count}
            onClick={() => onTrick(trick + 1)}
          >
            {t.replay.next}
          </button>
          <button
            type="button"
            onClick={() => onPlayFrom(trick)}
            className="w-full rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:w-auto sm:flex-1"
          >
            {t.replay.playFromHere}
          </button>
        </div>
      </main>
    </div>
  );
}
