// The four hands on the table (SPEC §8): South fanned sideways, dummy in suit columns, the
// defenders face down with a card count.

import { motion } from 'framer-motion';
import type { MouseEvent } from 'react';
import type { Card, Strain } from '../../engine';
import { SUIT_INFO, cardCode, rankLabel, sameCard } from '../../engine';
import { useSuitOrder, useT } from '../gameStore';
import type { IndexLayout } from './PlayingCard';
import { FramePlate, PlayingCard } from './PlayingCard';
import { displaySuits, dummyStep, sortForDisplay } from './layout';

/** `playable`: may be played now; `illegal`: this hand is to play but not this card. */
export type CardMode = 'playable' | 'illegal' | 'idle';

export type PlayHandler = (card: Card, viaKeyboard: boolean) => void;

/** A card that cannot be played now was clicked (beginner mode explains why). */
export type BlockedHandler = (card: Card) => void;

/** Frame colours (`FramePlate`). */
const FRAME = { picked: '#fcd34d', hinted: '#34d399' } as const;

type CardButtonProps = {
  card: Card;
  mode: CardMode;
  /** One of the best cards of a hint (SPEC §7.2). */
  hinted: boolean;
  /** Picked, waiting for the player to confirm it (setting `cardPlay: 'confirm'`). */
  picked: boolean;
  layout: IndexLayout;
  onPlay: PlayHandler;
  onBlocked?: BlockedHandler;
  flipInDelay?: number;
};

function CardButton(props: CardButtonProps) {
  const { card, mode, hinted, picked, layout, onPlay, onBlocked, flipInDelay } = props;
  const playable = mode === 'playable';
  const frame = picked ? FRAME.picked : hinted ? FRAME.hinted : undefined;
  const t = useT();
  const onClick = (e: MouseEvent) => {
    // `detail` is 0 when the click came from the keyboard (Enter / Space).
    if (playable) onPlay(card, e.detail === 0);
    else onBlocked?.(card);
  };
  let label = t.cardName(card);
  if (mode === 'illegal') label += t.table.cardIllegal;
  else if (picked) label += t.table.cardPicked;
  else if (hinted) label += t.table.cardHinted;
  return (
    <button
      type="button"
      data-card={cardCode(card)}
      data-playable={playable ? 'true' : undefined}
      data-hint={hinted ? 'true' : undefined}
      data-picked={picked ? 'true' : undefined}
      aria-disabled={!playable}
      tabIndex={playable ? 0 : -1}
      aria-label={label}
      onClick={onClick}
      className={[
        // Same corner as the card face (rx 9 + half the 2-unit stroke, out of 100), so rings fit at any size.
        'relative block rounded-[calc(var(--card-w)*0.1)] transition duration-150 outline-none',
        // A picked card glows gold like its copy waiting on the table: South's lifted (within the room the hand
        // keeps above it); dummy's slid sideways into the gap, as lifting it hides the card above.
        // The glow is the button's; the solid frame is the `FramePlate` under the card.
        picked && 'shadow-[0_0_18px_5px_rgba(252,211,77,0.65)]',
        picked && (layout === 'stack' ? '-translate-y-[11%]' : 'translate-x-[12%]'),
        // Lifted as well as outlined, so a hint does not rely on colour alone.
        !picked && hinted && '-translate-y-[9%] shadow-[0_0_16px_4px_rgba(52,211,153,0.6)]',
        playable && 'cursor-pointer focus-visible:ring-4 focus-visible:ring-amber-300',
        playable && !picked && 'hover:-translate-y-[9%] focus-visible:-translate-y-[9%]',
        // Dimmed but opaque: overlapped cards must not show through each other.
        mode === 'illegal' && 'cursor-not-allowed brightness-60 saturate-50',
        mode === 'idle' && 'cursor-default',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {frame && <FramePlate color={frame} />}
      <PlayingCard card={card} layout={layout} flipInDelay={flipInDelay} shadow={!frame} />
    </button>
  );
}

type HandProps = {
  cards: readonly Card[];
  trump: Strain;
  modeOf: (card: Card) => CardMode;
  hintOf: (card: Card) => boolean;
  /** The card picked for confirmation, if any. */
  picked?: Card | null;
  onPlay: PlayHandler;
  onBlocked?: BlockedHandler;
};

/**
 * Cards fanned sideways and overlapped just enough to fit the width (`100cqw` of the wrapper):
 * each step shows at least the corner index.
 */
export function FannedHand(props: HandProps) {
  const { cards, trump, modeOf, hintOf, picked, onPlay, onBlocked } = props;
  const order = useSuitOrder();
  const sorted = sortForDisplay(cards, trump, order);
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
              picked={!!picked && sameCard(picked, card)}
              layout="stack"
              onPlay={onPlay}
              onBlocked={onBlocked}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Dummy laid out as on a real table: one column per suit, cards running downwards. */
export function DummyHand(props: HandProps) {
  const { cards, trump, modeOf, hintOf, picked, onPlay, onBlocked } = props;
  const suitOrder = useSuitOrder();
  const columns = displaySuits(trump, suitOrder)
    .map((suit) => sortForDisplay(cards, trump, suitOrder).filter((c) => c.suit === suit))
    .filter((col) => col.length > 0);
  const longest = Math.max(1, ...columns.map((col) => col.length));
  const step = dummyStep(longest);
  let order = 0;
  return (
    <div className="flex justify-center" style={{ gap: 'calc(var(--card-w) * 0.14)' }}>
      {columns.map((col) => (
        <div
          key={col[0]!.suit}
          data-suit={col[0]!.suit}
          className="relative"
          style={{
            width: 'var(--card-w)',
            height: `calc(var(--card-w) * 1.4 * (1 + ${step * (col.length - 1)}) + var(--card-w) * 0.12)`,
            // A picked card slides into the gap: lift its whole column (not the card, which would hide the
            // cards below it) so its glow is not drawn under the next column.
            zIndex: picked && col.some((c) => sameCard(c, picked)) ? 1 : undefined,
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
                picked={!!picked && sameCard(picked, card)}
                layout="row"
                onPlay={onPlay}
                onBlocked={onBlocked}
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
  const t = useT();
  return (
    <div
      className="flex flex-col items-center gap-1"
      aria-label={`${label}: ${t.table.cardCount(count)}`}
    >
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
        {t.table.cardCount(count)}
      </span>
    </div>
  );
}

/** How a card stands out in an open hand (replay, SPEC §7.5). */
export type CardMark = 'played' | 'wrong' | 'better';

const MARK_CLASS: Record<CardMark, string> = {
  played: 'rounded-sm bg-amber-300 px-0.5',
  wrong: 'rounded-sm bg-red-600 px-0.5 text-white',
  better: 'rounded-sm px-0.5 outline-2 outline-emerald-500',
};

/**
 * A hand face up as in a bridge diagram, one line per suit: the defenders in study mode
 * (SPEC §7.6) and all four hands in the replay. Compact so it fits beside the trick on a
 * 360 px phone.
 */
export function OpenHand({
  cards,
  trump,
  label,
  markOf,
}: {
  cards: readonly Card[];
  trump: Strain;
  label: string;
  markOf?: (card: Card) => CardMark | undefined;
}) {
  const order = useSuitOrder();
  const t = useT();
  const sorted = sortForDisplay(cards, trump, order);
  return (
    <div
      data-open-hand={label}
      aria-label={`${label}: ${cards.map(t.cardName).join(', ') || t.table.noCards}`}
      className="max-w-[27cqw] rounded-lg bg-white/95 px-1.5 py-1 text-[11px] leading-snug font-semibold text-black shadow sm:px-2 sm:text-sm"
    >
      {displaySuits(trump, order).map((suit) => {
        const ranks = sorted.filter((c) => c.suit === suit);
        return (
          <div key={suit} className="flex gap-1" aria-hidden="true">
            <span className={SUIT_INFO[suit].red ? 'text-suit-red' : 'text-suit-black'}>
              {SUIT_INFO[suit].symbol}
            </span>
            <span className="flex flex-wrap gap-x-[0.2em] tabular-nums">
              {ranks.length > 0
                ? ranks.map((c) => {
                    const mark = markOf?.(c);
                    return (
                      <span
                        key={c.rank}
                        data-mark={mark}
                        data-hand-card={markOf ? cardCode(c) : undefined}
                        className={mark ? MARK_CLASS[mark] : undefined}
                      >
                        {rankLabel(c.rank)}
                      </span>
                    );
                  })
                : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** A card written inline, e.g. ♠K on a white chip (readable on the dark panels). */
export function CardText({ card }: { card: Card }) {
  const t = useT();
  return (
    <span
      className="inline-flex items-center rounded bg-white px-1 leading-tight font-semibold whitespace-nowrap text-black"
      aria-label={t.cardName(card)}
    >
      <span className={SUIT_INFO[card.suit].red ? 'text-suit-red' : 'text-suit-black'}>
        {SUIT_INFO[card.suit].symbol}
      </span>
      {rankLabel(card.rank)}
    </span>
  );
}

/** Dummy before the opening lead: still face down, in one overlapped row. */
export function FaceDownRow({ count }: { count: number }) {
  const t = useT();
  return (
    <div className="flex justify-center" aria-label={t.table.dummyFaceDown(count)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : 'calc(var(--card-w) * -0.78)' }}>
          <PlayingCard card={null} />
        </div>
      ))}
    </div>
  );
}
