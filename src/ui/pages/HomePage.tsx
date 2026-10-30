// #/ — start a hand, the guide (with progress), settings, stats. On the first visit it asks
// whether the player knows bridge (SPEC §7.7): no → chapter 1 with beginner mode on, yes → play.

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SUIT_INFO, SUITS } from '../../engine/card';
import { FEEDBACK_EMAIL, feedbackMailto } from '../../game/feedback';
import { LANGUAGES } from '../../game/settings';
import { LANGUAGE_NAME } from '../../i18n';
import { CHAPTERS, chapterOf, isFirstVisit } from '../../learn';
import { getSolver } from '../../worker';
import { DealingOverlay } from '../DealingOverlay';
import { Flag } from '../Flag';
import {
  learnStore,
  updateSettings,
  useDealNew,
  useGame,
  useLearn,
  useSettings,
  useT,
} from '../gameStore';

const SECONDARY =
  'rounded-lg bg-white/10 px-5 py-2 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none';
const PRIMARY =
  'rounded-xl bg-amber-400 px-8 py-3 text-lg font-semibold text-black shadow-lg hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-60';

/**
 * A flag per language at the top of the page (SPEC §8). Each button is named in its own language
 * (screen readers, tooltip), so a player who switched by mistake can find the way back.
 */
function LanguageSwitch() {
  const t = useT();
  const language = useSettings((s) => s.settings.language);
  return (
    <div
      role="group"
      aria-label={t.common.language}
      data-testid="language-switch"
      className="absolute top-3 right-3 flex gap-1 rounded-lg bg-black/30 p-1"
    >
      {LANGUAGES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={language === l}
          aria-label={LANGUAGE_NAME[l]}
          title={LANGUAGE_NAME[l]}
          onClick={() => updateSettings({ language: l })}
          className={`grid h-9 w-11 place-items-center rounded-md transition focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
            language === l
              ? 'bg-amber-300'
              : 'opacity-55 grayscale-[40%] hover:bg-white/15 hover:opacity-100 hover:grayscale-0'
          }`}
        >
          <Flag language={l} className="h-5 w-7 rounded-[3px] shadow-sm ring-1 ring-black/25" />
        </button>
      ))}
    </div>
  );
}

/**
 * Bug reports and feedback by email (SPEC §8). The address is also shown as text, for devices with
 * no mail app set up, where the link does nothing.
 */
function FeedbackLink() {
  const t = useT();
  const language = useSettings((s) => s.settings.language);
  const href = feedbackMailto({
    subject: t.home.feedbackSubject,
    intro: t.home.feedbackIntro,
    details: [
      `page: ${window.location.href}`,
      `language: ${language}`,
      `screen: ${window.innerWidth}x${window.innerHeight}`,
      `browser: ${navigator.userAgent}`,
    ],
  });
  return (
    <p className="text-sm text-white/70" data-testid="feedback">
      <a
        href={href}
        className="rounded underline hover:text-white focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
      >
        {t.home.feedback}
      </a>
      <span className="block text-xs text-white/50 select-all">{FEEDBACK_EMAIL}</span>
    </p>
  );
}

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
  const t = useT();
  return (
    <section
      aria-labelledby="welcome-title"
      data-testid="welcome"
      className="flex w-full flex-col items-center gap-3 rounded-2xl bg-black/25 p-5"
    >
      <h2 id="welcome-title" className="text-xl font-bold">
        {t.home.welcomeTitle}
      </h2>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onNew} className={`${PRIMARY} flex-1 px-4 text-base`}>
          {t.home.welcomeNew}
          <span className="block text-sm font-normal">{t.home.welcomeNewNote}</span>
        </button>
        <button
          type="button"
          onClick={onKnown}
          disabled={busy}
          className={`${SECONDARY} flex-1 py-3 disabled:opacity-60`}
        >
          {t.home.welcomeKnown}
          <span className="block text-sm text-white/70">{t.home.welcomeKnownNote}</span>
        </button>
      </div>
      <p className="text-sm text-white/60">{t.home.welcomeLater}</p>
    </section>
  );
}

export function HomePage() {
  const t = useT();
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

  // Bottom padding: the fixed "Created by" line must never cover the credits (a long page scrolls).
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-6 px-4 pt-12 pb-10 text-center sm:pt-0">
      <LanguageSwitch />
      <motion.h1
        className="text-3xl font-bold"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Bridge Declarer Trainer
      </motion.h1>
      <p className="text-lg text-white/80">{t.home.tagline}</p>
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
          {t.home.play}
        </button>
      )}
      <nav aria-label={t.home.mainMenu} className="flex flex-wrap justify-center gap-3">
        <Link to="/learn" className={`${SECONDARY} flex items-center gap-2`}>
          {t.common.guide}
          <span
            className="rounded-full bg-black/30 px-2 text-sm tabular-nums text-white/80"
            data-testid="home-guide-progress"
          >
            {t.home.chapters(read, CHAPTERS.length)}
          </span>
        </Link>
        <Link to="/settings" className={SECONDARY}>
          {t.common.settings}
        </Link>
        <Link to="/stats" className={SECONDARY}>
          {t.common.stats}
        </Link>
      </nav>
      {dealError && (
        <p role="alert" className="text-red-300">
          {t.storeMessage(dealError)}
        </p>
      )}
      <FeedbackLink />
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
        {t.home.creditsBy} ·{' '}
        <a href="LICENSE-DDS.txt" target="_blank" className="underline hover:text-white/80">
          Apache-2.0
        </a>
      </footer>
    </main>
  );
}
