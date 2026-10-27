import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SUIT_INFO, SUITS } from '../../engine/card';
import { getSolver } from '../../worker';
import { DealingOverlay } from '../DealingOverlay';
import { useDealNew, useGame } from '../gameStore';

const SECONDARY =
  'rounded-lg bg-white/10 px-5 py-2 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none';

export function HomePage() {
  const dealNew = useDealNew();
  const dealing = useGame((s) => s.dealing);
  const dealError = useGame((s) => s.dealError);

  // Load the solver while the player reads the page, so the first deal is quicker.
  useEffect(() => getSolver().warmUp(), []);

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <motion.h1
        className="text-3xl font-bold"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Bridge Declarer Trainer
      </motion.h1>
      <p className="text-lg text-white/80">ฝึกเดินไพ่ฝั่ง declarer กับบอทที่เห็นไพ่ทุกมือ</p>
      <p className="text-4xl tracking-widest" aria-hidden="true">
        {SUITS.map((suit) => (
          <span key={suit} className={SUIT_INFO[suit].red ? 'text-red-400' : 'text-white'}>
            {SUIT_INFO[suit].symbol}
          </span>
        ))}
      </p>
      <button
        type="button"
        onClick={() => void dealNew()}
        disabled={dealing}
        className="rounded-xl bg-amber-400 px-8 py-3 text-lg font-semibold text-black shadow-lg hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-60"
      >
        เริ่มเล่น
      </button>
      <nav aria-label="เมนูหลัก" className="flex gap-3">
        <Link to="/settings" className={SECONDARY}>
          ตั้งค่า
        </Link>
        <Link to="/stats" className={SECONDARY}>
          สถิติ
        </Link>
      </nav>
      {dealError && (
        <p role="alert" className="text-red-300">
          {dealError}
        </p>
      )}
      <DealingOverlay />
    </main>
  );
}
