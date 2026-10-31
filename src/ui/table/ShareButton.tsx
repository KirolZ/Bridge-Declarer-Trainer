// Share this hand (SPEC §4.4, §7.5): copies the link of the hand (deal + contract + vulnerability).
// If the clipboard is blocked, the link is shown selected so it can be copied by hand.

import { useEffect, useRef, useState } from 'react';
import type { HandSetup } from '../../game/playStore';
import { handPath } from '../../game/playStore';
import { copyText } from '../clipboard';
import { useT } from '../gameStore';

/** Absolute link of `hand` for the page this app is served from. */
function shareUrl(hand: HandSetup): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#${handPath(hand)}`;
}

type ShareButtonProps = { hand: HandSetup; className: string };

export function ShareButton({ hand, className }: ShareButtonProps) {
  const t = useT();
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const input = useRef<HTMLInputElement>(null);
  const url = shareUrl(hand);

  useEffect(() => {
    if (state === 'failed') input.current?.select();
    if (state !== 'copied') return;
    const t = setTimeout(() => setState('idle'), 2500);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => void copyText(url).then((ok) => setState(ok ? 'copied' : 'failed'))}
      >
        {state === 'copied' ? t.share.copied : t.share.share}
      </button>
      <span className="sr-only" role="status">
        {state === 'copied' ? t.share.copiedStatus : ''}
      </span>
      {state === 'failed' && (
        <label className="flex w-full basis-full flex-col gap-1 text-left text-xs text-white/75">
          {t.share.failed}
          <input
            ref={input}
            readOnly
            value={url}
            data-testid="share-url"
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded bg-black/40 px-2 py-1 font-mono text-xs text-white"
          />
        </label>
      )}
    </>
  );
}
