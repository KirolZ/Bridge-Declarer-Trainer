import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';
export type { Page } from '@playwright/test';

// The card-play setting defaults to "pick, then confirm" (TASKS M24), but most specs are about
// something else and play a card with a single click. They start as a player who chose "tap to
// play": the page gets `cardPlay` in its saved settings when none is there yet. Specs about the
// setting itself turn this off with `test.use({ cardPlay: null })` and seed what they need.
//
// A spec that writes the settings itself (e.g. `{ beginnerMode: true }`) replaces what this wrote,
// so it must include `cardPlay: 'tap'` when it clicks cards.

const SETTINGS_KEY = 'bridge-trainer.settings.v1';

export const test = base.extend<{ cardPlay: 'tap' | 'confirm' | null }>({
  cardPlay: ['tap', { option: true }],
  page: async ({ page, cardPlay }, use) => {
    if (cardPlay) {
      await page.addInitScript(
        ([key, value]) => {
          try {
            const raw = localStorage.getItem(key);
            const saved: unknown = raw ? JSON.parse(raw) : {};
            if (typeof saved === 'object' && saved !== null && !('cardPlay' in saved))
              localStorage.setItem(key, JSON.stringify({ ...saved, cardPlay: value }));
          } catch {
            // Storage blocked (a spec tests that): the app falls back to its defaults.
          }
        },
        [SETTINGS_KEY, cardPlay] as const,
      );
    }
    await use(page);
  },
});
