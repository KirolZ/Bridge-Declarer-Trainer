import type { Page } from './fixtures';
import { expect, test } from './fixtures';

// TASKS M11: settings and stats survive closing the browser, and the app still works when the
// browser blocks storage. Same fixed deal as play.spec.ts: seeded deal 5, 3♥ makes 9 tricks.
const HAND = '/#/play/GNA8WobYT233o4lpzA/3H';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

/** Picks an option of a settings group (the radios are drawn as buttons). */
async function choose(page: Page, group: string, option: string) {
  const set = page.getByRole('group', { name: group });
  await set.locator('label', { hasText: option }).click();
  await expect(set.getByRole('radio', { name: option })).toBeChecked();
}

/** Ends the hand at the player's first turn with "claim 0 more" (always accepted). */
async function claimNothing(page: Page) {
  await expect(page.locator('[data-playable="true"]').first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Claim' }).click();
  const dialog = page.getByTestId('claim-dialog');
  for (let n = 13; n > 0; n--) await dialog.getByRole('button', { name: 'ลด' }).click();
  await dialog.getByRole('button', { name: 'Claim 0 trick' }).click();
  await expect(page.getByTestId('result')).toBeVisible();
  // Recorded once the review is complete: West's lead and the claim point lose 9 tricks.
  await expect(page.getByTestId('review')).toHaveAttribute('data-status', 'ready');
}

const cell = (page: Page, row: string, col: string) =>
  page.locator(`[data-row="${row}"] [data-col="${col}"]`);

async function expectOneHeartHandDown(page: Page) {
  await expect(cell(page, 'all', 'hands')).toHaveText('1');
  await expect(cell(page, 'all', 'made')).toContainText('0%');
  await expect(cell(page, 'all', 'lost')).toContainText('9');
  await expect(cell(page, 'H', 'hands')).toHaveText('1');
  await expect(cell(page, 'NT', 'hands')).toHaveText('0');
}

test('settings and stats are still there after closing and reopening the browser', async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'สถิติ' }).click();
  await expect(page.getByTestId('stats-empty')).toBeVisible();
  await page.getByRole('button', { name: 'กลับ' }).click();

  await page.getByRole('link', { name: 'ตั้งค่า' }).click();
  await expect(page.getByTestId('not-saved')).toHaveCount(0);
  await choose(page, 'ความเร็วบอท', 'เร็ว');
  await choose(page, 'การเรียงดอก', '♠ ♥ ♦ ♣');
  await choose(page, 'ประเภท contract', 'NT เท่านั้น');

  // Suit order applies on the table: ♠ ♥ ♦ ♣ even in a heart contract (default: ♥ first).
  await page.goto(HAND);
  const columns = page.locator('section[aria-label="North (dummy)"] [data-suit]');
  await expect(columns.first()).toBeVisible({ timeout: 15_000 });
  const suits = await columns.evaluateAll((els) => els.map((e) => e.getAttribute('data-suit')));
  expect(suits).toEqual(['S', 'H', 'D', 'C'].filter((s) => suits.includes(s)));

  await claimNothing(page);
  await page.goto('/#/stats');
  await expectOneHeartHandDown(page);
  expect(errors).toEqual([]);

  // "Close the browser": a new context that only has what was stored.
  const storageState = await page.context().storageState();
  await page.context().close();
  const reopened = await browser.newContext({
    storageState,
    baseURL: testInfo.project.use.baseURL,
  });
  const again = await reopened.newPage();
  await again.goto('/#/stats');
  await expectOneHeartHandDown(again);
  await again.goto('/#/settings');
  for (const [group, option] of [
    ['ความเร็วบอท', 'เร็ว'],
    ['การเรียงดอก', '♠ ♥ ♦ ♣'],
    ['ประเภท contract', 'NT เท่านั้น'],
  ] as const) {
    await expect(
      again.getByRole('group', { name: group }).getByRole('radio', { name: option }),
    ).toBeChecked();
  }
  await reopened.close();
});

test('the app still works when the browser blocks storage', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });
  });
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'ตั้งค่า' }).click();
  await expect(page.getByTestId('not-saved')).toBeVisible();
  await choose(page, 'ความเร็วบอท', 'เร็ว');

  await page.goto(HAND);
  await claimNothing(page);
  // In-app navigation (no reload), so the session's stats are still in memory.
  await page.evaluate(() => {
    window.location.hash = '#/stats';
  });
  await expect(page.getByTestId('not-saved')).toBeVisible();
  await expectOneHeartHandDown(page);
  expect(errors).toEqual([]);
});

test('a hand finished again after undo is not counted twice', async ({ page }) => {
  test.setTimeout(120_000);
  // Undo is for beginner mode only (M22).
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem(
      'bridge-trainer.settings.v1',
      JSON.stringify({ beginnerMode: true, cardPlay: 'tap' }),
    );
  });
  await page.goto(HAND);
  await claimNothing(page);
  await page.getByTestId('result').getByRole('button', { name: 'ย้อน claim' }).click();
  await claimNothing(page);
  await page.goto('/#/stats');
  await expect(cell(page, 'all', 'hands')).toHaveText('1');
});
