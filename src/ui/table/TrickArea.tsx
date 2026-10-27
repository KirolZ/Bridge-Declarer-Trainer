// The trick in the middle of the table (SPEC §8): each card slides in from its seat, and a
// finished trick is gathered towards the side that won it.

import type { Variants } from 'framer-motion';
import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { PlayedCard, Seat } from '../../engine';
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

type TrickAreaProps = {
  /** Changes for every trick, so the previous one animates away. */
  trickNumber: number;
  plays: readonly PlayedCard[];
  /** Set while a finished trick is on show. */
  winner: Seat | null;
  /** Winner of the trick that is being gathered (the last finished trick). */
  gatherTo: Seat | null;
};

export function TrickArea({ trickNumber, plays, winner, gatherTo }: TrickAreaProps) {
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
    </div>
  );
}
