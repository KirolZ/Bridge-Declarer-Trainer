// Claim (SPEC §7.4): the player says how many more tricks they will take; the store checks it
// against the solver. Accepted → the hand ends; rejected → "the defence can still take tricks"
// and play goes on.

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { ClaimOutcome } from '../../game/playStore';
import { useT } from '../gameStore';

type ClaimDialogProps = {
  /** Tricks still to play (the current one included). */
  left: number;
  /** NS tricks won so far. */
  won: number;
  needed: number;
  checking: boolean;
  onClaim: (tricks: number) => Promise<ClaimOutcome>;
  onClose: () => void;
};

const STEP =
  'grid size-10 place-items-center rounded-lg bg-white/10 text-xl hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none disabled:opacity-40';

export function ClaimDialog({ left, won, needed, checking, onClaim, onClose }: ClaimDialogProps) {
  const t = useT();
  const [tricks, setTricks] = useState(left);
  const [rejected, setRejected] = useState(false);
  const submit = useRef<HTMLButtonElement>(null);
  const goOn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    (rejected ? goOn : submit).current?.focus();
  }, [rejected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const send = async () => {
    const outcome = await onClaim(tricks);
    if (outcome === 'rejected') setRejected(true);
    else onClose();
  };

  const total = won + tricks;
  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center bg-black/55 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-title"
        data-testid="claim-dialog"
        className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-white/10 bg-felt-dark p-6 text-center shadow-2xl"
      >
        <h2 id="claim-title" className="text-xl font-bold">
          Claim
        </h2>
        {rejected ? (
          <>
            <p className="text-red-200" role="alert" data-testid="claim-rejected">
              {t.claim.rejected}
            </p>
            <p className="text-sm text-white/70">{t.claim.goOnNote}</p>
            <button
              ref={goOn}
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              {t.claim.goOn}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-white/80">{t.claim.question(left)}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={t.claim.fewer}
                className={STEP}
                disabled={tricks <= 0 || checking}
                onClick={() => setTricks((t) => Math.max(0, t - 1))}
              >
                −
              </button>
              <output
                className="w-14 text-4xl font-bold tabular-nums"
                aria-live="polite"
                data-testid="claim-tricks"
              >
                {tricks}
              </output>
              <button
                type="button"
                aria-label={t.claim.more}
                className={STEP}
                disabled={tricks >= left || checking}
                onClick={() => setTricks((t) => Math.min(left, t + 1))}
              >
                +
              </button>
            </div>
            <p className="text-sm text-white/70">{t.claim.total(total, needed)}</p>
            <div className="mt-1 flex w-full gap-2">
              <button
                ref={submit}
                type="button"
                onClick={() => void send()}
                disabled={checking}
                className="flex-1 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-60"
              >
                {checking ? t.claim.checking : t.claim.submit(tricks)}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
              >
                {t.common.cancel}
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
