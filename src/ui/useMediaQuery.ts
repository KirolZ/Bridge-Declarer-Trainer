// Whether a CSS media query matches, kept up to date as the window changes (M33: the auction is
// a panel beside the table on wide screens and a sheet on the others).

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

/** Room beside the table (56rem) for the auction panel (20rem) and the gaps (Tailwind `xl`). */
export const SIDE_SCREEN = '(min-width: 1280px)';
