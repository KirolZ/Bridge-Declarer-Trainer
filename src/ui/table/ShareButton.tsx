// "แชร์มือนี้" (SPEC §4.4, §7.5): copies the link of the hand (deal + contract + vulnerability).
// If the clipboard is blocked, the link is shown selected so it can be copied by hand.

import { useEffect, useRef, useState } from 'react';
import type { HandSetup } from '../../game/playStore';
import { handPath } from '../../game/playStore';

/** Absolute link of `hand` for the page this app is served from. */
function shareUrl(hand: HandSetup): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#${handPath(hand)}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers, or no permission: fall back to a hidden textarea.
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

type ShareButtonProps = { hand: HandSetup; className: string };

export function ShareButton({ hand, className }: ShareButtonProps) {
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
        {state === 'copied' ? '✓ คัดลอกลิงก์แล้ว' : '🔗 แชร์มือนี้'}
      </button>
      <span className="sr-only" role="status">
        {state === 'copied' ? 'คัดลอกลิงก์ของมือนี้แล้ว' : ''}
      </span>
      {state === 'failed' && (
        <label className="flex w-full basis-full flex-col gap-1 text-left text-xs text-white/75">
          คัดลอกอัตโนมัติไม่ได้ — คัดลอกลิงก์นี้เอง
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
