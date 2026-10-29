// The confirm button for a picked card (see cardPick.ts): floats over the empty trick slot the
// card will go to, with a ✕ to let go of it.

import { motion } from 'framer-motion';
import type { Card } from '../../engine';
import { CardText } from './hands';

type ConfirmPlayBarProps = {
  card: Card;
  /** `above`: over the trick, from South's hand; `below`: under North's hand. */
  side: 'above' | 'below';
  onConfirm: (viaKeyboard: boolean) => void;
  onCancel: () => void;
};

/**
 * Floats next to the hand that is to play, over its own trick slot (empty while that hand is to
 * play), so it covers no card that matters. Touch-sized buttons.
 */
export function ConfirmPlayBar({ card, side, onConfirm, onCancel }: ConfirmPlayBarProps) {
  return (
    <div
      className={[
        'pointer-events-none absolute inset-x-0 z-20 flex justify-center',
        side === 'above' ? 'bottom-full mb-1' : 'top-full mt-1',
      ].join(' ')}
    >
      <motion.div
        role="group"
        aria-label="ยืนยันการลงไพ่"
        data-testid="confirm-play"
        className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/80 p-1 shadow-lg ring-1 ring-white/25"
        initial={{ opacity: 0, scale: 0.85, y: side === 'above' ? 8 : -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 520, damping: 32 }}
      >
        <button
          type="button"
          data-testid="confirm-play-button"
          title="ลงใบนี้ (Enter บนไพ่ใบเดิม)"
          // `detail` is 0 when the click came from the keyboard (Enter / Space).
          onClick={(e) => onConfirm(e.detail === 0)}
          className="flex min-h-10 items-center gap-1.5 rounded-full bg-sky-400 px-4 font-semibold text-black shadow hover:bg-sky-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none active:scale-95"
        >
          ลง <CardText card={card} />
        </button>
        <button
          type="button"
          aria-label="ยกเลิก"
          title="ยกเลิก (Esc)"
          onClick={onCancel}
          className="flex size-10 items-center justify-center rounded-full text-lg text-white/85 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none active:scale-95"
        >
          ✕
        </button>
      </motion.div>
    </div>
  );
}
