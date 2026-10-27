// The app's play store, wired to the solver worker.

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from 'zustand';
import type { PlayStoreState } from '../game/playStore';
import { createPlayStore, handPath } from '../game/playStore';
import { DEFAULT_DEAL_SETTINGS } from '../game/settings';
import { getSolver } from '../worker';

export const gameStore = createPlayStore({ solver: getSolver() });

export function useGame<T>(selector: (state: PlayStoreState) => T): T {
  return useStore(gameStore, selector);
}

/** Deals a new hand (default settings until M11) and opens it at its link. */
export function useDealNew(): () => Promise<void> {
  const navigate = useNavigate();
  return useCallback(async () => {
    const ok = await gameStore.getState().dealNew(DEFAULT_DEAL_SETTINGS);
    const { hand } = gameStore.getState();
    if (ok && hand) navigate(handPath(hand));
  }, [navigate]);
}
