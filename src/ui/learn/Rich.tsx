// Guide text with its inline markup (src/learn/markup.ts): glossary terms open a sheet with the
// definition without leaving the page, cards show as chips and suits in colour.

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Suit } from '../../engine';
import { SUIT_INFO } from '../../engine';
import type { Inline } from '../../learn';
import { glossaryEntry, parseInline } from '../../learn';
import { useT } from '../gameStore';
import { CardText } from '../table/hands';

/** Opens the term sheet; null outside a `TermSheetProvider` (terms then link to the glossary). */
const OpenTerm = createContext<((id: string) => void) | null>(null);

export function SuitSymbol({ suit }: { suit: Suit }) {
  const info = SUIT_INFO[suit];
  const t = useT();
  return (
    <span
      role="img"
      aria-label={t.suitName[suit]}
      className={info.red ? 'text-red-300' : 'text-white'}
    >
      {info.symbol}
    </span>
  );
}

const TERM_CLASS =
  'font-semibold text-amber-200 underline decoration-amber-200/60 decoration-dotted underline-offset-4 hover:text-amber-100 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none';

function TermLink({ id, label }: { id: string; label: string | null }) {
  const open = useContext(OpenTerm);
  const text = label ?? glossaryEntry(id)?.term ?? id;
  if (!glossaryEntry(id)) return <>{text}</>;
  if (!open) {
    return (
      <Link to={`/learn/glossary?t=${id}`} className={TERM_CLASS}>
        {text}
      </Link>
    );
  }
  return (
    <button
      type="button"
      data-term={id}
      aria-haspopup="dialog"
      onClick={() => open(id)}
      className={`inline ${TERM_CLASS}`}
    >
      {text}
    </button>
  );
}

function Part({ part }: { part: Inline }) {
  switch (part.t) {
    case 'text':
      return <>{part.text}</>;
    case 'strong':
      return <strong className="font-semibold text-white">{part.text}</strong>;
    case 'term':
      return <TermLink id={part.id} label={part.label} />;
    case 'card':
      return <CardText card={part.card} />;
    case 'suit':
      return <SuitSymbol suit={part.suit} />;
  }
}

/** Renders text written with the guide's inline markup. */
export function Rich({ text }: { text: string }) {
  const parts = useMemo(() => parseInline(text), [text]);
  return (
    <>
      {parts.map((p, i) => (
        <Part key={i} part={p} />
      ))}
    </>
  );
}

/** The definition of a term, at the bottom of the screen. Esc, ✕ or a click elsewhere closes it. */
function TermSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const entry = glossaryEntry(id);
  const t = useT();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
      back?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  if (!entry) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-2 sm:p-4">
      <motion.div
        ref={panel}
        key={id}
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="term-sheet"
        className="pointer-events-auto w-full max-w-xl rounded-2xl bg-slate-900/95 p-4 shadow-2xl ring-1 ring-white/15 outline-none"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-start gap-3">
          <h2 id={titleId} className="flex-1 text-lg font-bold">
            {entry.term} <span className="font-normal text-white/70">({entry.thai})</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 leading-relaxed text-white/90">
          <Rich text={entry.text} />
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {entry.chapter !== undefined && (
            <Link to={`/learn/${entry.chapter}`} className="text-amber-200 hover:underline">
              {t.learn.chapter(entry.chapter)}
            </Link>
          )}
          <Link to={`/learn/glossary?t=${entry.id}`} className="text-amber-200 hover:underline">
            {t.learn.allTerms}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

/** Lets glossary terms in `children` open the term sheet. Closes on navigation. */
export function TermSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<string | null>(null);
  const location = useLocation();
  useEffect(() => {
    setOpen(null);
  }, [location.pathname, location.search]);
  const close = useMemo(() => () => setOpen(null), []);
  return (
    <OpenTerm.Provider value={setOpen}>
      {children}
      {open && <TermSheet id={open} onClose={close} />}
    </OpenTerm.Provider>
  );
}
