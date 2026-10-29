// "Pick, then confirm" card play (setting `cardPlay: 'confirm'`): the first click on a card picks
// it and shows it waiting in its trick slot (TrickArea); tapping it there or clicking the card again
// plays it, and ✕ / Esc / a click elsewhere on the table lets go of it. With `cardPlay: 'tap'` a click plays the card at once, as before.

import type { MouseEvent } from 'react';
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
  /** Put on the table (felt): a click anywhere on it but a card to play or the waiting card cancels. */
  onTableClick: (e: MouseEvent) => void;
};

/** What a click on the table may hit without letting go of the pick. */
const KEEPS_PICK = '[data-playable="true"], [data-testid="confirm-play"]';

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

  const onTableClick = (e: MouseEvent) => {
    if (picked && !(e.target as Element).closest(KEEPS_PICK)) setPick(null);
  };

  return { picked, onPlay, confirm, cancel, onTableClick };
}
