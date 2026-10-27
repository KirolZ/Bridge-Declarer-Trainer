// The four hands on the table (SPEC §8): South fanned sideways, dummy in suit columns, the
// defenders face down with a card count.

import { motion } from 'framer-motion';
import type { MouseEvent } from 'react';
import type { Card, Strain } from '../../engine';
import { SUIT_INFO, cardCode, rankLabel } from '../../engine';
import type { IndexLayout } from './PlayingCard';
import { cardName } from './labels';
import { PlayingCard } from './PlayingCard';
import { displaySuits, dummyStep, sortForDisplay } from './layout';

/** `playable`: may be played now; `illegal`: this hand is to play but not this card. */
export type CardMode = 'playable' | 'illegal' | 'idle';

export type PlayHandler = (card: Card, viaKeyboard: boolean) => void;

type CardButtonProps = {
  card: Card;
  mode: CardMode;
  /** One of the best cards of a hint (SPEC §7.2). */
  hinted: boolean;
  layout: IndexLayout;
  onPlay: PlayHandler;
  flipInDelay?: number;
};

function CardButton({ card, mode, hinted, layout, onPlay, flipInDelay }: CardButtonProps) {
  const playable = mode === 'playable';
  const onClick = (e: MouseEvent) => {
    // `detail` is 0 when the click came from the keyboard (Enter / Space).
    if (playable) onPlay(card, e.detail === 0);
  };
  let label = cardName(card);
  if (mode === 'illegal') label += ' (ลงไม่ได้)';
  else if (hinted) label += ' (คำใบ้)';
  return (
    <button
      type="button"
      data-card={cardCode(card)}
      data-playable={playable ? 'true' : undefined}
      data-hint={hinted ? 'true' : undefined}
      aria-disabled={!playable}
      tabIndex={playable ? 0 : -1}
      aria-label={label}
      onClick={onClick}
      className={[
        'block rounded-[6px] transition duration-150 outline-none',
        // Lifted as well as outlined, so a hint does not rely on colour alone.
        hinted && '-translate-y-[9%] shadow-[0_0_0_3px_#34d399,0_0_16px_4px_rgba(52,211,153,0.6)]',
        playable &&
          'cursor-pointer hover:-translate-y-[9%] focus-visible:-translate-y-[9%] focus-visible:ring-4 focus-visible:ring-amber-300',
        // Dimmed but opaque: overlapped cards must not show through each other.
        mode === 'illegal' && 'cursor-not-allowed brightness-60 saturate-50',
        mode === 'idle' && 'cursor-default',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <PlayingCard card={card} layout={layout} flipInDelay={flipInDelay} />
    </button>
  );
}

type HandProps = {
  cards: readonly Card[];
  trump: Strain;
  modeOf: (card: Card) => CardMode;
  hintOf: (card: Card) => boolean;
  onPlay: PlayHandler;
};

/**
 * Cards fanned sideways and overlapped just enough to fit the width (`100cqw` of the wrapper):
 * each step shows at least the corner index.
 */
export function FannedHand({ cards, trump, modeOf, hintOf, onPlay }: HandProps) {
  const sorted = sortForDisplay(cards, trump);
  const gaps = Math.max(sorted.length - 1, 1);
  const step = `min(calc(var(--card-w) * 0.62), calc((100cqw - var(--card-w)) / ${gaps}))`;
  return (
    <div className="w-full" style={{ containerType: 'inline-size' }}>
      <div
        className="relative mx-auto"
        style={{
          width: `calc(var(--card-w) + ${sorted.length - 1} * ${step})`,
          height: 'calc(var(--card-w) * 1.4 + var(--card-w) * 0.16)',
        }}
      >
        {sorted.map((card, i) => (
          <motion.div
            key={cardCode(card)}
            layout="position"
            className="absolute bottom-0"
            style={{ left: `calc(${i} * ${step})` }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          >
            <CardButton
              card={card}
              mode={modeOf(card)}
              hinted={hintOf(card)}
              layout="stack"
              onPlay={onPlay}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Dummy laid out as on a real table: one column per suit, cards running downwards. */
export function DummyHand({ cards, trump, modeOf, hintOf, onPlay }: HandProps) {
  const columns = displaySuits(trump)
    .map((suit) => sortForDisplay(cards, trump).filter((c) => c.suit === suit))
    .filter((col) => col.length > 0);
  const longest = Math.max(1, ...columns.map((col) => col.length));
  const step = dummyStep(longest);
  let order = 0;
  return (
    <div className="flex justify-center" style={{ gap: 'calc(var(--card-w) * 0.14)' }}>
      {columns.map((col) => (
        <div
          key={col[0]!.suit}
          className="relative"
          style={{
            width: 'var(--card-w)',
            height: `calc(var(--card-w) * 1.4 * (1 + ${step * (col.length - 1)}) + var(--card-w) * 0.12)`,
          }}
        >
          {col.map((card, i) => (
            <motion.div
              key={cardCode(card)}
              layout="position"
              className="absolute left-0"
              style={{ top: `calc(var(--card-w) * 0.12 + var(--card-w) * 1.4 * ${step * i})` }}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            >
              <CardButton
                card={card}
                mode={modeOf(card)}
                hinted={hintOf(card)}
                layout="row"
                onPlay={onPlay}
                flipInDelay={0.03 * order++}
              />
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** A face-down hand: a few stacked backs and the number of cards left. */
export function HiddenHand({ count, label }: { count: number; label: string }) {
  const shown = Math.min(count, 5);
  return (
    <div className="flex flex-col items-center gap-1" aria-label={`${label}: ${count} ใบ`}>
      <div
        className="relative"
        style={{ width: 'calc(var(--card-w) * 0.72)', height: 'calc(var(--card-w) * 1.2)' }}
      >
        {Array.from({ length: shown }, (_, i) => (
          <div
            key={i}
            className="absolute left-0"
            style={{ top: `calc(${i} * var(--card-w) * 0.05)` }}
          >
            <PlayingCard card={null} scale={0.72} />
          </div>
        ))}
      </div>
      <span className="rounded-full bg-black/40 px-2 text-xs tabular-nums text-white/90">
        {count} ใบ
      </span>
    </div>
  );
}

/**
 * A defender's hand face up (study mode, SPEC §7.6), as in a bridge diagram: one line per suit.
 * Compact so it fits beside the trick on a 360 px phone.
 */
export function OpenHand({
  cards,
  trump,
  label,
}: {
  cards: readonly Card[];
  trump: Strain;
  label: string;
}) {
  const sorted = sortForDisplay(cards, trump);
  return (
    <div
      data-open-hand={label}
      aria-label={`${label}: ${cards.map(cardName).join(', ') || 'ไม่มีไพ่'}`}
      className="max-w-[27cqw] rounded-lg bg-white/95 px-1.5 py-1 text-[11px] leading-snug font-semibold text-black shadow sm:px-2 sm:text-sm"
    >
      {displaySuits(trump).map((suit) => {
        const ranks = sorted.filter((c) => c.suit === suit);
        return (
          <div key={suit} className="flex gap-1" aria-hidden="true">
            <span className={SUIT_INFO[suit].red ? 'text-suit-red' : 'text-suit-black'}>
              {SUIT_INFO[suit].symbol}
            </span>
            <span className="flex flex-wrap gap-x-[0.2em] tabular-nums">
              {ranks.length > 0
                ? ranks.map((c) => <span key={c.rank}>{rankLabel(c.rank)}</span>)
                : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Dummy before the opening lead: still face down, in one overlapped row. */
export function FaceDownRow({ count }: { count: number }) {
  return (
    <div className="flex justify-center" aria-label={`dummy ยังคว่ำอยู่: ${count} ใบ`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : 'calc(var(--card-w) * -0.78)' }}>
          <PlayingCard card={null} />
        </div>
      ))}
    </div>
  );
}
