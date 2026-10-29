// "Dealing…" while a new hand is dealt and solved (SPEC §7.1 step 6), with a cancel button.

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { gameStore, useGame, useT } from './gameStore';

export function DealingOverlay() {
  const dealing = useGame((s) => s.dealing);
  const cancel = useRef<HTMLButtonElement>(null);
  const t = useT();

  useEffect(() => {
    if (!dealing) return;
    cancel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') gameStore.getState().cancelDeal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dealing]);

  return (
    <AnimatePresence>
      {dealing && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dealing-title"
            className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl border border-white/10 bg-felt-dark p-6 text-center shadow-2xl"
          >
            <span
              className="size-10 animate-spin rounded-full border-4 border-white/20 border-t-amber-300"
              aria-hidden="true"
            />
            <p id="dealing-title" className="text-lg font-semibold">
              {t.dealing}
            </p>
            <button
              ref={cancel}
              type="button"
              onClick={() => gameStore.getState().cancelDeal()}
              className="rounded-lg bg-white/10 px-5 py-2 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
            >
              {t.common.cancel}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
