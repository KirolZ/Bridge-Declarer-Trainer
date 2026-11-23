import type { Page } from './fixtures';
import { expect, test } from './fixtures';

// TASKS M27: a hand link with an auction (SPEC §4.4, §4.5) shows the auction above the table —
// open until the player's first card, then one line that opens again — and plays as before.

// The acceptance deal (South makes 3♥ exactly), bid: S 1♥, W 2♦, N 2♥, E 3♦, S 3♥, all pass.
const PLAIN = '/#/play/GNA8WobYT233o4lpzA/3H';
const HAND = `${PLAIN}?d=S&a=1H-2D-2H-3D-3H-P-P-P`;

/** Overlapped cards show only their corner index, so click there (as a person would). */
const CORNER = { position: { x: 6, y: 6 } };

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

const noSideScroll = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(0);

test('a link with an auction shows it, and the hand still plays out with 0 tricks lost', async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await page.goto(HAND);

  const auction = page.getByTestId('auction');
  await expect(auction).toBeVisible();
  await expect(page.getByTestId('auction-info')).toHaveText('แจก: South · ไม่มีฝ่ายไหน vul');
  const calls = auction.getByTestId('auction-call');
  await expect(calls).toHaveCount(8);
  // South deals, so the first row starts in the fourth column (W N E S).
  await expect(auction.locator('tbody tr').first().locator('td').nth(3)).toHaveText('1♥');
  await expect(calls.nth(1)).toHaveText('2♦');
  await expect(calls.last()).toHaveText('Pass');
  await noSideScroll(page);

  const result = page.getByTestId('result');
  const playable = page.locator('[data-playable="true"]');
  let turns = 0;
  for (;;) {
    await expect(playable.first().or(result)).toBeVisible({ timeout: 15_000 });
    if (await result.isVisible()) break;
    await page.getByRole('button', { name: /^คำใบ้/ }).click();
    const hinted = page.locator('[data-hint="true"]');
    await expect(hinted.first()).toBeVisible();
    await expect(page.getByTestId('status')).toContainText('ยังทำได้ 9 trick');
    turns++;
    await hinted.first().click(CORNER);
    if (turns === 1) {
      // After the player's first card the auction folds into one line…
      await expect(auction).toBeHidden();
      await expect(page.getByTestId('auction-line')).toHaveText(/S\s*1♥\s*W\s*2♦\s*N\s*2♥/);
      await noSideScroll(page);
    }
  }

  expect(turns).toBe(26);
  await expect(result).toHaveAttribute('data-made', 'true');
  await expect(page.getByTestId('review')).toContainText('เสีย 0 trick');
  expect(errors).toEqual([]);
});

test('the folded auction opens again and closes on demand', async ({ page }) => {
  await page.goto(HAND);
  const auction = page.getByTestId('auction');
  await expect(auction).toBeVisible();
  await page.getByTestId('auction-toggle').click();
  await expect(auction).toBeHidden();
  await expect(page.getByTestId('auction-line')).toBeVisible();
  await page.getByTestId('auction-toggle').click();
  await expect(auction).toBeVisible();

  await page.goto('/');
  await page.getByTestId('language-switch').getByRole('button', { name: 'English' }).click();
  await page.goto(`${HAND.replace('?', '?v=ns&')}`);
  await expect(page.getByTestId('auction-info')).toHaveText('Dealer: South · NS vul');
  await noSideScroll(page);
});

test('old links have no auction, and a link whose auction does not fit is refused', async ({
  page,
}) => {
  await page.goto(PLAIN);
  await expect(page.getByTestId('contract')).toBeVisible();
  await expect(page.getByTestId('auction')).toHaveCount(0);
  await expect(page.getByTestId('auction-toggle')).toHaveCount(0);

  // 4♥ is not what this auction contracts for.
  await page.goto('/#/play/GNA8WobYT233o4lpzA/4H?d=S&a=1H-2D-2H-3D-3H-P-P-P');
  await expect(page.getByRole('heading', { name: 'ลิงก์มือไพ่ไม่ถูกต้อง' })).toBeVisible();
  // West would declare 3♦.
  await page.goto('/#/play/GNA8WobYT233o4lpzA/3D?d=S&a=1H-2D-2H-3D-P-P-P');
  await expect(page.getByRole('heading', { name: 'ลิงก์มือไพ่ไม่ถูกต้อง' })).toBeVisible();
});

// TASKS M30: new boards come with their auction (SPEC §7.1.1) unless the setting is off.
test('a new deal comes with its auction, and the hints make the contract', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByRole('button', { name: /เคยเล่นแล้ว/ }).click();
  await expect(page).toHaveURL(/\?(v=ns&)?d=[NESW]&a=\S+$/, { timeout: 30_000 });
  await expect(page.getByTestId('auction')).toBeVisible();
  await expect(page.getByTestId('auction-call').last()).toHaveText('Pass');
  await noSideScroll(page);

  const result = page.getByTestId('result');
  const playable = page.locator('[data-playable="true"]');
  for (let turn = 0; turn < 26; turn++) {
    await expect(playable.first().or(result)).toBeVisible({ timeout: 20_000 });
    if (await result.isVisible()) break;
    await page.getByRole('button', { name: /^คำใบ้/ }).click();
    const hinted = page.locator('[data-hint="true"]');
    await expect(hinted.first()).toBeVisible({ timeout: 20_000 });
    await hinted.first().click(CORNER);
  }
  await expect(result).toBeVisible({ timeout: 20_000 });
  await expect(result).toHaveAttribute('data-made', 'true');
  await expect(page.getByTestId('review')).toContainText('เสีย 0 trick');
  expect(errors).toEqual([]);
});

test('with "แสดงการประมูล" off, new deals have no auction', async ({ page }) => {
  await page.goto('/#/settings');
  const toggle = page.getByRole('checkbox', { name: /แสดงการประมูล/ });
  await expect(toggle).toBeChecked(); // on for everyone by default
  await toggle.uncheck();
  await noSideScroll(page);
  await page.goto('/');
  await page.getByRole('button', { name: /เคยเล่นแล้ว/ }).click();
  await expect(page).toHaveURL(/#\/play\/[A-Za-z0-9_-]{18}\/[1-7][SHDCN]$/, { timeout: 30_000 });
  await expect(page.getByTestId('contract')).toBeVisible();
  await expect(page.getByTestId('auction')).toHaveCount(0);
  await page.goto('/#/settings');
  await expect(page.getByRole('checkbox', { name: /แสดงการประมูล/ })).not.toBeChecked();
});
