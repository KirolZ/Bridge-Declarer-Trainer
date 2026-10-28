// #/ — start a hand, the guide (with progress), settings, stats. On the first visit it asks
// whether the player knows bridge (SPEC §7.7): no → chapter 1 with beginner mode on, yes → play.

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SUIT_INFO, SUITS } from '../../engine/card';
import { CHAPTERS, chapterOf, isFirstVisit } from '../../learn';
import { getSolver } from '../../worker';
import { DealingOverlay } from '../DealingOverlay';
import { learnStore, updateSettings, useDealNew, useGame, useLearn } from '../gameStore';

const SECONDARY =
  'rounded-lg bg-white/10 px-5 py-2 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none';
const PRIMARY =
  'rounded-xl bg-amber-400 px-8 py-3 text-lg font-semibold text-black shadow-lg hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-60';

/** First visit: "have you played bridge?" (SPEC §7.7). */
function Welcome({
  onNew,
  onKnown,
  busy,
}: {
  onNew: () => void;
  onKnown: () => void;
  busy: boolean;
}) {
  return (
    <section
      aria-labelledby="welcome-title"
      data-testid="welcome"
      className="flex w-full flex-col items-center gap-3 rounded-2xl bg-black/25 p-5"
    >
      <h2 id="welcome-title" className="text-xl font-bold">
        เคยเล่น bridge ไหม?
      </h2>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onNew} className={`${PRIMARY} flex-1 px-4 text-base`}>
          ยังไม่เคย
          <span className="block text-sm font-normal">เริ่มจากคู่มือ + โหมดมือใหม่</span>
        </button>
        <button
          type="button"
          onClick={onKnown}
          disabled={busy}
          className={`${SECONDARY} flex-1 py-3 disabled:opacity-60`}
        >
          เคยเล่นแล้ว
          <span className="block text-sm text-white/70">เริ่มเล่นเลย</span>
        </button>
      </div>
      <p className="text-sm text-white/60">
        เปลี่ยนใจได้ทุกเมื่อ: คู่มืออยู่ที่หน้านี้ โหมดมือใหม่อยู่ในตั้งค่า
      </p>
    </section>
  );
}

export function HomePage() {
  const dealNew = useDealNew();
  const dealing = useGame((s) => s.dealing);
  const dealError = useGame((s) => s.dealError);
  const progress = useLearn((s) => s.progress);
  const navigate = useNavigate();
  const first = isFirstVisit(progress);
  const read = progress.read.filter((n) => chapterOf(n)).length;

  const onNew = () => {
    updateSettings({ beginnerMode: true });
    learnStore.getState().markWelcomed();
    navigate('/learn/1');
  };
  const onKnown = () => {
    learnStore.getState().markWelcomed();
    void dealNew();
  };

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
      {first ? (
        <Welcome onNew={onNew} onKnown={onKnown} busy={dealing} />
      ) : (
        <button type="button" onClick={() => void dealNew()} disabled={dealing} className={PRIMARY}>
          เริ่มเล่น
        </button>
      )}
      <nav aria-label="เมนูหลัก" className="flex flex-wrap justify-center gap-3">
        <Link to="/learn" className={`${SECONDARY} flex items-center gap-2`}>
          คู่มือ
          <span
            className="rounded-full bg-black/30 px-2 text-sm tabular-nums text-white/80"
            data-testid="home-guide-progress"
          >
            {read}/{CHAPTERS.length} บท
          </span>
        </Link>
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
      <p
        className="pointer-events-none fixed bottom-2 left-3 text-xs text-white/50"
        data-testid="author"
      >
        Created by 1Cu
      </p>
      <footer className="text-xs text-white/50" data-testid="credits">
        double-dummy solver:{' '}
        <a
          href="https://github.com/dds-bridge/dds"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-white/80"
        >
          DDS
        </a>{' '}
        โดย Bo Haglund, Soren Hein และคณะ ·{' '}
        <a href="LICENSE-DDS.txt" target="_blank" className="underline hover:text-white/80">
          Apache-2.0
        </a>
      </footer>
    </main>
  );
}
