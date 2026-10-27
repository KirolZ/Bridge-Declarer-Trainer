// The four hands on the table (SPEC §8): South fanned sideways, dummy in suit columns, the
// defenders face down with a card count.

import { motion } from 'framer-motion';
import type { MouseEvent } from 'react';
import type { Card, Strain } from '../../engine';
import { cardCode } from '../../engine';
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
  layout: IndexLayout;
  onPlay: PlayHandler;
  flipInDelay?: number;
};

function CardButton({ card, mode, layout, onPlay, flipInDelay }: CardButtonProps) {
  const playable = mode === 'playable';
  const onClick = (e: MouseEvent) => {
    // `detail` is 0 when the click came from the keyboard (Enter / Space).
    if (playable) onPlay(card, e.detail === 0);
  };
  return (
    <button
      type="button"
      data-card={cardCode(card)}
      data-playable={playable ? 'true' : undefined}
      aria-disabled={!playable}
      tabIndex={playable ? 0 : -1}
      aria-label={mode === 'illegal' ? `${cardName(card)} (ลงไม่ได้)` : cardName(card)}
      onClick={onClick}
      className={[
        'block rounded-[6px] transition duration-150 outline-none',
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
  onPlay: PlayHandler;
};

/**
 * Cards fanned sideways and overlapped just enough to fit the width (`100cqw` of the wrapper):
 * each step shows at least the corner index.
 */
export function FannedHand({ cards, trump, modeOf, onPlay }: HandProps) {
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
            <CardButton card={card} mode={modeOf(card)} layout="stack" onPlay={onPlay} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Dummy laid out as on a real table: one column per suit, cards running downwards. */
export function DummyHand({ cards, trump, modeOf, onPlay }: HandProps) {
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
