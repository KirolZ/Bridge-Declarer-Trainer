// "Pick, then confirm" card play (setting `cardPlay: 'confirm'`): the first click on a card picks
// it, and it is played by the confirm button (ConfirmPlayBar) or by clicking it again; Esc lets
// go of it. With `cardPlay: 'tap'` a click plays the card at once, as before.

import { useCallback, useEffect, useState } from 'react';
import type { Card } from '../../engine';
import { sameCard } from '../../engine';
import { useSettings } from '../gameStore';
import type { PlayHandler } from './hands';

export type CardPick = {
  /** The picked card, or null (also always null with `cardPlay: 'tap'`). */
  picked: Card | null;
  /** Pass to the hands: picks a card, or plays it when picking is off or it is already picked. */
  onPlay: PlayHandler;
  confirm: (viaKeyboard: boolean) => void;
  cancel: () => void;
};

/**
 * `at` names the position the pick belongs to (e.g. epoch and number of cards played), or null
 * when the player is not to play: a pick lapses as soon as it changes.
 */
export function useCardPick(at: string | null, play: PlayHandler): CardPick {
  const enabled = useSettings((s) => s.settings.cardPlay === 'confirm');
  const [pick, setPick] = useState<{ at: string; card: Card } | null>(null);
  const picked = enabled && at !== null && pick?.at === at ? pick.card : null;

  const cancel = useCallback(() => setPick(null), []);
  const onPlay: PlayHandler = (card, viaKeyboard) => {
    if (!enabled || at === null || (picked && sameCard(picked, card))) {
      setPick(null);
      play(card, viaKeyboard);
    } else {
      setPick({ at, card });
    }
  };
  const confirm = (viaKeyboard: boolean) => {
    if (!picked) return;
    setPick(null);
    play(picked, viaKeyboard);
  };

  useEffect(() => {
    if (!picked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picked, cancel]);

  return { picked, onPlay, confirm, cancel };
}
