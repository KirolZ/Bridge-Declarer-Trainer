// The trick in the middle of the table (SPEC §8): each card slides in from its seat, and a
// finished trick is gathered towards the side that won it.

import type { Variants } from 'framer-motion';
import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Card, PlayedCard, Seat } from '../../engine';
import { cardCode } from '../../engine';
import { SEAT_NAME, cardName } from './labels';
import { PlayingCard } from './PlayingCard';

/** Trick cards are a little smaller than the hands, to keep the table short. */
const TRICK_SCALE = 0.85;
const TW = `calc(var(--card-w) * ${TRICK_SCALE})`;

const SLOT: Record<Seat, CSSProperties> = {
  N: { top: 0, left: `calc(50% - ${TW} / 2)` },
  S: { bottom: 0, left: `calc(50% - ${TW} / 2)` },
  W: { left: 0, top: `calc(50% - ${TW} * 0.7)` },
  E: { right: 0, top: `calc(50% - ${TW} * 0.7)` },
};

/** Where a card comes from (relative to its own size). */
const FROM: Record<Seat, { x: string; y: string }> = {
  N: { x: '0%', y: '-130%' },
  S: { x: '0%', y: '130%' },
  W: { x: '-160%', y: '0%' },
  E: { x: '160%', y: '0%' },
};

const TOWARDS: Record<Seat, { x: string; y: string }> = {
  N: { x: '0%', y: '-60%' },
  S: { x: '0%', y: '60%' },
  W: { x: '-60%', y: '0%' },
  E: { x: '60%', y: '0%' },
};

const gather: Variants = {
  shown: { opacity: 1, x: '0%', y: '0%', scale: 1 },
  gone: (winner: Seat | null) => ({
    opacity: 0,
    scale: 0.6,
    ...(winner ? TOWARDS[winner] : {}),
    transition: { duration: 0.35, ease: 'easeIn' },
  }),
};

/** A card picked to play (setting `cardPlay: 'confirm'`), waiting in its seat's slot. */
export type PendingPlay = {
  seat: Seat;
  card: Card;
  onConfirm: (viaKeyboard: boolean) => void;
};

/**
 * The picked card, faded in its slot with a gold outline like the rest of the table's highlights:
 * tap it to play it (a tap elsewhere on the table lets go, see cardPick.ts). The slot of the hand to
 * play is always empty.
 */
function PendingCard({ seat, card, onConfirm }: PendingPlay) {
  return (
    <motion.div
      data-testid="confirm-play"
      className="absolute z-20"
      style={SLOT[seat]}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
    >
      <button
        type="button"
        data-testid="confirm-play-button"
        aria-label={`ลง ${cardName(card)}`}
        title="แตะเพื่อลง"
        // `detail` is 0 when the click came from the keyboard (Enter / Space).
        onClick={(e) => onConfirm(e.detail === 0)}
        className="group relative block cursor-pointer rounded-[6px] outline-none focus-visible:ring-4 focus-visible:ring-white"
      >
        <motion.span
          className="block rounded-[6px]"
          animate={{
            boxShadow: [
              '0 0 0 2px #fcd34d, 0 0 6px 1px rgba(252,211,77,0.35)',
              '0 0 0 3px #fcd34d, 0 0 18px 5px rgba(252,211,77,0.7)',
            ],
          }}
          transition={{ duration: 0.9, repeat: Infinity, repeatType: 'reverse' }}
        >
          <span className="block opacity-80 transition-opacity group-hover:opacity-100">
            <PlayingCard card={card} scale={TRICK_SCALE} />
          </span>
        </motion.span>
        <span className="pointer-events-none absolute inset-x-0 -bottom-2.5 flex justify-center">
          <span className="rounded-full bg-amber-300 px-2 py-px text-[11px] font-semibold sm:text-xs whitespace-nowrap text-black shadow-[0_0_10px_rgba(252,211,77,0.6)]">
            แตะเพื่อลง
          </span>
        </span>
      </button>
    </motion.div>
  );
}

type TrickAreaProps = {
  /** Changes for every trick, so the previous one animates away. */
  trickNumber: number;
  plays: readonly PlayedCard[];
  /** Set while a finished trick is on show. */
  winner: Seat | null;
  /** Winner of the trick that is being gathered (the last finished trick). */
  gatherTo: Seat | null;
  pending?: PendingPlay | null;
};

export function TrickArea({ trickNumber, plays, winner, gatherTo, pending }: TrickAreaProps) {
  return (
    <div
      className="relative"
      role="group"
      aria-label={`trick ที่ ${trickNumber}`}
      style={{ width: `calc(${TW} * 3.15)`, height: `calc(${TW} * 1.4 * 2.05)` }}
    >
      <AnimatePresence custom={gatherTo} initial={false}>
        <motion.div
          key={trickNumber}
          className="absolute inset-0"
          custom={gatherTo}
          variants={gather}
          initial="shown"
          animate="shown"
          exit="gone"
        >
          {plays.map((p) => (
            <motion.div
              key={cardCode(p.card)}
              data-trick-card={cardCode(p.card)}
              aria-label={`${SEAT_NAME[p.seat]}: ${cardName(p.card)}`}
              className={[
                'absolute rounded-[6px] transition-shadow',
                winner === p.seat &&
                  'shadow-[0_0_0_3px_#fcd34d,0_0_18px_4px_rgba(252,211,77,0.55)]',
              ]
                .filter(Boolean)
                .join(' ')}
              style={SLOT[p.seat]}
              initial={{ opacity: 0, ...FROM[p.seat] }}
              animate={{ opacity: 1, x: '0%', y: '0%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            >
              <PlayingCard card={p.card} scale={TRICK_SCALE} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      {pending && <PendingCard key={cardCode(pending.card)} {...pending} />}
    </div>
  );
}
