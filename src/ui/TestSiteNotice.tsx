// A short notice at the top of the home page on test hosts (SPEC §8): the address may change.
// The close button hides it for good in this browser.

import { useState } from 'react';
import { STORAGE_KEYS, browserStorage } from '../game/storage';
import { isTestSite } from '../game/testSite';
import { useT } from './gameStore';

const storage = browserStorage();

function shouldShow(): boolean {
  if (typeof window === 'undefined' || !isTestSite(window.location.hostname)) return false;
  return storage.read(STORAGE_KEYS.testNotice) !== true;
}

export function TestSiteNotice() {
  const t = useT();
  const [show, setShow] = useState(shouldShow);
  if (!show) return null;
  const dismiss = () => {
    storage.write(STORAGE_KEYS.testNotice, true);
    setShow(false);
  };
  return (
    <div
      role="note"
      data-testid="test-site-notice"
      className="flex max-w-full items-center gap-1 rounded-2xl bg-amber-300/15 py-1 pr-1 pl-4 text-sm text-amber-100 ring-1 ring-amber-300/40"
    >
      <span>{t.home.testSiteNotice}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t.home.testSiteDismiss}
        title={t.home.testSiteDismiss}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-amber-100/80 hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
