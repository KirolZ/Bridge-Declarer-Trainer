// Bug reports and feedback (SPEC §8): a floating button at the bottom right of the home page opens
// a small box with the developer's address (to copy) and a button that starts the email.

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useId, useRef, useState } from 'react';
import { FEEDBACK_EMAIL, feedbackMailto } from '../game/feedback';
import { copyText } from './clipboard';
import { useSettings, useT } from './gameStore';

const FOCUS = 'focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none';

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" strokeWidth="1.6" />
      <path d="m3.5 6 6.5 5 6.5-5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The mailto link, built while the box is open so the page and screen size are current. */
function useMailto(open: boolean): string {
  const t = useT();
  const language = useSettings((s) => s.settings.language);
  if (!open) return `mailto:${FEEDBACK_EMAIL}`;
  return feedbackMailto({
    subject: t.home.feedbackSubject,
    intro: t.home.feedbackIntro,
    details: [
      `page: ${window.location.href}`,
      `language: ${language}`,
      `screen: ${window.innerWidth}x${window.innerHeight}`,
      `browser: ${navigator.userAgent}`,
    ],
  });
}

export function FeedbackWidget() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle');
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const address = useRef<HTMLInputElement>(null);
  const boxId = useId();
  const titleId = useId();
  const href = useMailto(open);

  // Esc or a tap outside closes the box; Esc gives the focus back to the button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      toggle.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  useEffect(() => {
    if (copy === 'failed') address.current?.select();
    if (copy !== 'copied') return;
    const timer = setTimeout(() => setCopy('idle'), 2500);
    return () => clearTimeout(timer);
  }, [copy]);

  const onToggle = () => {
    setCopy('idle');
    setOpen((o) => !o);
  };

  return (
    <div
      ref={root}
      data-testid="contact"
      className="fixed right-3 bottom-3 z-30 flex flex-col items-end gap-3"
    >
      <AnimatePresence>
        {open && (
          <motion.section
            id={boxId}
            role="dialog"
            aria-labelledby={titleId}
            data-testid="contact-box"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="w-[min(20rem,calc(100vw-1.5rem))] origin-bottom-right rounded-2xl bg-stone-100 p-4 text-left text-stone-900 shadow-2xl"
          >
            <h2 id={titleId} className="font-bold">
              {t.home.feedbackTitle}
            </h2>
            <p className="mt-1 text-sm text-stone-600">{t.home.feedbackNote}</p>
            <div className="mt-3 flex items-center gap-1 rounded-xl border border-stone-300 bg-white py-1 pr-1 pl-3">
              <input
                ref={address}
                readOnly
                value={FEEDBACK_EMAIL}
                aria-label={t.home.feedbackEmail}
                data-testid="contact-email"
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-stone-900 outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  void copyText(FEEDBACK_EMAIL).then((ok) => setCopy(ok ? 'copied' : 'failed'))
                }
                className={`shrink-0 rounded-lg px-2 py-1.5 text-sm font-semibold text-[#45694b] hover:bg-stone-100 ${FOCUS}`}
              >
                {copy === 'copied' ? t.home.feedbackCopied : t.home.feedbackCopy}
              </button>
            </div>
            <span className="sr-only" role="status">
              {copy === 'copied' ? t.home.feedbackCopiedStatus : ''}
            </span>
            {copy === 'failed' && (
              <p className="mt-1 text-xs text-stone-600">{t.home.feedbackCopyFailed}</p>
            )}
            <a
              href={href}
              className={`mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#45694b] px-4 py-2.5 font-semibold text-white hover:bg-[#3a5a40] ${FOCUS}`}
            >
              <MailIcon />
              {t.home.feedbackSend}
            </a>
          </motion.section>
        )}
      </AnimatePresence>
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={open ? boxId : undefined}
        onClick={onToggle}
        className={`flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2.5 text-sm font-medium text-stone-900 shadow-lg hover:bg-white ${FOCUS}`}
      >
        {open ? (
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-red-400" />
        ) : (
          <MailIcon />
        )}
        {open ? t.common.close : t.home.feedbackOpen}
      </button>
    </div>
  );
}
