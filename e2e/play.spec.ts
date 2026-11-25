import type { Page } from './fixtures';
import { expect, test } from './fixtures';

// TASKS M8: a hand can be played through all 13 tricks against the bots, on desktop and phone.
// The deal is fixed (seeded deal 5): South makes 3♥ exactly with best play.
const HAND = '/#/play/GNA8WobYT233o4lpzA/3H';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

const hasHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

/** Overlapped cards show only their corner index, so click there (as a person would). */
const CORNER = { position: { x: 6, y: 6 } };

/** Plays the hand out, clicking the first playable card whenever it is the player's turn. */
async function playOut(page: Page, onTurn?: () => Promise<void>) {
  const result = page.getByTestId('result');
  const playable = page.locator('[data-playable="true"]');
  for (let turn = 0; turn < 26; turn++) {
    await expect(playable.first().or(result)).toBeVisible({ timeout: 15_000 });
    if (await result.isVisible()) break;
    await onTurn?.();
    await playable.first().click(CORNER);
  }
  await expect(result).toBeVisible({ timeout: 15_000 });
}

test('a hand from a link plays through 13 tricks and shows the result', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await page.goto(HAND);
  await expect(page.getByTestId('contract')).toContainText('3♥');

  // Dummy is face down until West leads, then it is laid out by suit.
  await expect(page.locator('[data-trick-card]')).toHaveCount(1, { timeout: 15_000 });
  await expect(page.locator('section[aria-label="North (dummy)"] [data-card]')).toHaveCount(13);

  let checkedIllegal = false;
  await playOut(page, async () => {
    // Cards that can't be played now are greyed out and do nothing.
    const illegal = page.locator('[data-card][aria-disabled="true"][aria-label$="(ลงไม่ได้)"]');
    if (!checkedIllegal && (await illegal.count()) > 0) {
      const before = await page.locator('[data-trick-card]').count();
      await illegal.first().click({ ...CORNER, force: true });
      await expect(page.locator('[data-trick-card]')).toHaveCount(before);
      checkedIllegal = true;
    }
  });

  const ns = Number(await page.getByTestId('tricks-ns').textContent());
  const ew = Number(await page.getByTestId('tricks-ew').textContent());
  expect(ns + ew).toBe(13);
  await expect(page.getByTestId('result-tricks')).toContainText(`ได้ ${ns} trick (DD ทำได้ 9)`);
  // The defence never errs, so every trick short of 9 shows up in the review.
  await expect(page.getByTestId('review')).toHaveAttribute('data-lost', String(9 - ns));
  await expect(page.getByTestId('score')).toHaveText(/^[+-]?\d+\s*แต้ม$/);
  expect(errors).toEqual([]);
});

test('cards can be played with Tab and Enter', async ({ page }) => {
  await page.goto(HAND);
  const playable = page.locator('[data-playable="true"]');
  await expect(playable.first()).toBeVisible({ timeout: 15_000 });
  const count = await page.locator('[data-trick-card]').count();

  // Tab from the last header button (the menu) lands on the first playable card; Enter plays it.
  await page.getByRole('button', { name: 'เมนู' }).focus();
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-card'));
  expect(focused).toBe(await playable.first().getAttribute('data-card'));
  await page.keyboard.press('Enter');
  await expect(page.locator(`[data-trick-card="${focused}"]`)).toBeVisible();
  expect(await page.locator('[data-trick-card]').count()).toBeGreaterThan(count);
});

test.describe('phone width', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('no horizontal scroll at 360 px through a whole hand', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    await page.goto(HAND);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await playOut(page, async () => {
      expect(await hasHorizontalScroll(page)).toBe(false);
    });
    expect(await hasHorizontalScroll(page)).toBe(false);
    expect(errors).toEqual([]);
  });
});

test('home → start deals a hand and opens it at its link', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  // First visit asks whether the player knows bridge (SPEC §7.7); "yes" goes straight to play.
  await page.getByRole('button', { name: /เคยเล่นแล้ว/ }).click();
  // The board comes with its auction (M30): the link carries the dealer and the calls.
  await expect(page).toHaveURL(
    /#\/play\/[A-Za-z0-9_-]{18}\/[1-7][SHDCN]\?(v=ns&)?d=[NESW]&a=\S+$/,
    {
      timeout: 30_000,
    },
  );
  await expect(page.getByTestId('contract')).toBeVisible();
  await expect(page.locator('[data-trick-card]')).toHaveCount(1, { timeout: 15_000 });
  // Asked once only; beginner mode stays off.
  await expect(page.getByTestId('coach-tip')).toHaveCount(0);
  await page.goto('/');
  await expect(page.getByTestId('welcome')).toHaveCount(0);
  await page.getByRole('button', { name: 'เริ่มเล่น', exact: true }).click();
  await expect(page.getByTestId('contract')).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});

test('a broken link says so', async ({ page }) => {
  await page.goto('/#/play/not-a-deal/4S');
  await expect(page.getByRole('heading', { name: 'ลิงก์มือไพ่ไม่ถูกต้อง' })).toBeVisible();
  await page.goto('/#/play/GNA8WobYT233o4lpzA/8S');
  await expect(page.getByRole('heading', { name: 'ลิงก์มือไพ่ไม่ถูกต้อง' })).toBeVisible();
});

// TASKS M37: cards grow on a large screen (the cap was 80 px) and the whole table still fits;
// phones and short laptop screens keep their size.
test.describe('card size', () => {
  const SIZES = [
    { width: 1032, height: 1376, min: 118, max: 130 }, // iPad Pro 13, portrait
    { width: 1376, height: 1032, min: 100, max: 112 }, // iPad Pro 13, landscape
    { width: 1920, height: 1080, min: 110, max: 120 },
    { width: 1280, height: 720, min: 64, max: 67 }, // as before M37
    { width: 360, height: 740, min: 47, max: 50 }, // as before M37
  ];

  for (const { width, height, min, max } of SIZES) {
    test(`${width} × ${height}: cards ${min}–${max} px, the table fits`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.setViewportSize({ width, height });
      await page.goto(HAND);
      // West has led: dummy is face up and the player picks from it.
      const card = page.locator('[data-playable="true"]').first();
      await expect(card).toBeVisible({ timeout: 15_000 });
      const w = (await card.boundingBox())!.width;
      expect(w).toBeGreaterThanOrEqual(min);
      expect(w).toBeLessThanOrEqual(max);

      const fit = await page.evaluate(() => {
        const se = document.scrollingElement!;
        const cards = Array.from(document.querySelectorAll('.table-cards section'));
        return {
          lowest: Math.max(...cards.map((s) => s.getBoundingClientRect().bottom)),
          scrollY: se.scrollHeight - innerHeight,
        };
      });
      expect(fit.lowest).toBeLessThanOrEqual(height);
      expect(fit.scrollY).toBeLessThanOrEqual(0);
      expect(await hasHorizontalScroll(page)).toBe(false);
      expect(errors).toEqual([]);
    });
  }

  // From 640 px North's name tag sits in the corner beside dummy's columns. Bigger cards must not
  // push the columns under it (they did at 640–700 px even before M37).
  for (const width of [640, 768, 1032]) {
    test(`${width} px: dummy's columns stay clear of North's name tag`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1200 });
      await page.goto(HAND);
      await expect(page.locator('[data-playable="true"]').first()).toBeVisible({ timeout: 15_000 });
      const north = page.locator('section[aria-label="North (dummy)"]');
      const gap = await north.evaluate((n) => {
        const tag = n.firstElementChild!.getBoundingClientRect();
        const left = Math.min(
          ...Array.from(n.querySelectorAll('[data-suit]')).map(
            (c) => c.getBoundingClientRect().left,
          ),
        );
        return left - tag.right;
      });
      expect(gap).toBeGreaterThanOrEqual(8);
    });
  }
});
