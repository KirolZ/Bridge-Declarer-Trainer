// The guide beside the table (SPEC §7.7): the `?` button opens the chapter about the situation in
// a side panel (full screen on phones), so the player reads it without leaving the game.

import { motion } from 'framer-motion';
import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { chapterOf, chaptersIn } from '../../learn';
import { useLanguage, useT } from '../gameStore';
import { Blocks } from './examples';
import { TermSheetProvider } from './Rich';

const NAV =
  'rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none disabled:opacity-40';

type GuidePanelProps = {
  chapter: number;
  onChapter: (n: number) => void;
  onClose: () => void;
};

export function GuidePanel({ chapter: n, onChapter, onClose }: GuidePanelProps) {
  const lang = useLanguage();
  const chapters = chaptersIn(lang);
  const chapter = chapterOf(n, lang) ?? chapters[0]!;
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const t = useT();

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // A term sheet open on top closes first (it listens for Escape too).
      if (e.key === 'Escape' && !document.querySelector('[data-testid="term-sheet"]')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      back?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  useEffect(() => {
    body.current?.scrollTo(0, 0);
  }, [n]);

  return (
    <TermSheetProvider>
      <motion.div
        ref={panel}
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="guide-panel"
        data-chapter={chapter.n}
        className="fixed inset-y-0 right-0 z-30 flex w-full flex-col border-l border-white/10 bg-felt-dark shadow-2xl outline-none sm:max-w-md"
        initial={{ x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <label className="flex min-w-0 flex-1 flex-col text-xs text-white/60">
            {t.common.guide}
            <select
              value={chapter.n}
              onChange={(e) => onChapter(Number(e.target.value))}
              aria-label={t.learn.pickChapter}
              className="mt-0.5 w-full truncate rounded-md bg-black/30 px-2 py-1 text-sm text-white"
            >
              {chapters.map((c) => (
                <option key={c.n} value={c.n}>
                  {t.learn.chapter(c.n)}: {c.title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.learn.closeGuide}
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
          >
            ✕
          </button>
        </header>
        <div ref={body} className="flex-1 overflow-y-auto px-4 pt-3 pb-6">
          <p className="text-sm text-white/60">{t.learn.chapter(chapter.n)}</p>
          <h2 id={titleId} className="mb-3 text-xl font-bold">
            {chapter.title}
          </h2>
          <Blocks blocks={chapter.blocks} />
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={NAV}
              disabled={!chapterOf(n - 1)}
              onClick={() => onChapter(n - 1)}
            >
              {t.learn.prevChapter}
            </button>
            <button
              type="button"
              className={NAV}
              disabled={!chapterOf(n + 1)}
              onClick={() => onChapter(n + 1)}
            >
              {t.learn.nextChapter}
            </button>
            <Link
              to={`/learn/${chapter.n}`}
              className="ml-auto text-sm text-amber-200 hover:underline"
            >
              {t.learn.openInGuide}
            </Link>
          </div>
        </div>
      </motion.div>
    </TermSheetProvider>
  );
}
