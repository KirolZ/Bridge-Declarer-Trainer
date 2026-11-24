// Whether a CSS media query matches, kept up to date as the window changes (M33: the auction
// opens in place on wide screens and as a sheet on narrow ones).

import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Wide enough for the auction table to open above the table (Tailwind `lg`). */
export const WIDE_SCREEN = '(min-width: 1024px)';
