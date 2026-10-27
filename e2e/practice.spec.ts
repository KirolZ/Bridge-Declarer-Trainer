import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// TASKS M9: hint, undo, play again, claim, study mode. Same fixed deal as play.spec.ts:
// seeded deal 5, South makes 3♥ exactly (9 tricks) with best play.
const HAND = '/#/play/GNA8WobYT233o4lpzA/3H';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

/** Overlapped cards show only their corner index, so click there (as a person would). */
const CORNER = { position: { x: 6, y: 6 } };

const playable = (page: Page) => page.locator('[data-playable="true"]');
const trickCards = (page: Page) => page.locator('[data-trick-card]');
const hintButton = (page: Page) => page.getByRole('button', { name: /^คำใบ้/ });
const undoButton = (page: Page) => page.getByRole('button', { name: 'ย้อน' });

test('following the hint every turn makes the contract', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await page.goto(HAND);
  const result = page.getByTestId('result');

  let turns = 0;
  for (;;) {
    await expect(playable(page).first().or(result)).toBeVisible({ timeout: 15_000 });
    if (await result.isVisible()) break;
    await hintButton(page).click();
    const hinted = page.locator('[data-hint="true"]');
    await expect(hinted.first()).toBeVisible();
    // Best play keeps the 9 tricks the contract needs.
    await expect(page.getByTestId('status')).toContainText('ยังทำได้ 9 trick');
    turns++;
    await expect(page.getByTestId('hints-used')).toHaveText(String(turns));
    await hinted.first().click(CORNER);
  }

  expect(turns).toBe(26);
  await expect(result).toHaveAttribute('data-made', 'true');
  await expect(result).toContainText('ได้ 9 trick (ต้องได้ 9)');
  await expect(page.getByTestId('result-notes')).toContainText('ใช้คำใบ้ 26 ครั้ง');
  expect(errors).toEqual([]);
});

test('H shows a hint, U takes a card back even while the bot is thinking', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(HAND);
  await expect(playable(page).first()).toBeVisible();
  await expect(undoButton(page)).toBeDisabled();

  await page.keyboard.press('h');
  await expect(page.locator('[data-hint="true"]').first()).toBeVisible();
  await expect(page.getByTestId('hints-used')).toHaveText('1');

  const before = await trickCards(page).count();
  const card = await playable(page).first().getAttribute('data-card');
  await playable(page).first().click(CORNER);
  await expect(page.locator(`[data-trick-card="${card}"]`)).toBeVisible();
  // The next defender is still thinking (at least 500 ms per card): take the card back.
  await page.keyboard.press('u');
  await expect(trickCards(page)).toHaveCount(before);
  await expect(page.locator(`[data-card="${card}"][data-playable="true"]`)).toBeVisible();
  await expect(undoButton(page)).toBeDisabled();

  // Play on: the same card brings the same defence as before.
  await page.locator(`[data-card="${card}"]`).click(CORNER);
  await expect(trickCards(page)).toHaveCount(before + 2, { timeout: 15_000 });
  await expect(undoButton(page)).toBeEnabled();
  expect(errors).toEqual([]);
});

test('claim: too many is refused, a fair claim ends the hand, and can be undone', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto(HAND);
  await expect(playable(page).first()).toBeVisible();

  // All 13 tricks: the defence can still take some.
  await page.getByRole('button', { name: 'Claim' }).click();
  const dialog = page.getByTestId('claim-dialog');
  await expect(page.getByTestId('claim-tricks')).toHaveText('13');
  await dialog.getByRole('button', { name: 'Claim 13 trick' }).click();
  await expect(page.getByTestId('claim-rejected')).toContainText('ฝั่งป้องกันยังมีทางกิน');
  await dialog.getByRole('button', { name: 'เล่นต่อ' }).click();
  await expect(dialog).toBeHidden();
  await expect(playable(page).first()).toBeVisible();

  // 9 tricks is what best play makes: accepted.
  await page.getByRole('button', { name: 'Claim' }).click();
  for (let i = 0; i < 4; i++) await dialog.getByRole('button', { name: 'ลด' }).click();
  await dialog.getByRole('button', { name: 'Claim 9 trick' }).click();
  const result = page.getByTestId('result');
  await expect(result).toHaveAttribute('data-made', 'true');
  await expect(result).toContainText('ได้ 9 trick');
  await expect(page.getByTestId('result-notes')).toContainText('จบด้วย claim');

  await result.getByRole('button', { name: /ย้อน claim/ }).click();
  await expect(result).toBeHidden();
  await expect(playable(page).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('menu: play this hand again, and study mode shows the defenders', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(HAND);
  await expect(playable(page).first()).toBeVisible();
  const lead = await trickCards(page).first().getAttribute('data-trick-card');
  await playable(page).first().click(CORNER);
  await expect(trickCards(page)).toHaveCount(3, { timeout: 15_000 });

  const menu = page.getByRole('button', { name: 'เมนู' });
  await menu.click();
  await page.getByRole('menuitem', { name: 'เล่นมือนี้ใหม่' }).click();
  // Back to the opening lead, which is the same card again.
  await expect(trickCards(page)).toHaveCount(1, { timeout: 15_000 });
  await expect(trickCards(page).first()).toHaveAttribute('data-trick-card', lead!);
  await expect(undoButton(page)).toBeDisabled();

  await expect(page.locator('[data-open-hand]')).toHaveCount(0);
  await menu.click();
  await page.getByRole('menuitemcheckbox', { name: /โหมดศึกษา/ }).click();
  await expect(page.locator('[data-open-hand="West"]')).toBeVisible();
  await expect(page.locator('[data-open-hand="East"]')).toBeVisible();
  await menu.click();
  await expect(page.getByRole('menuitemcheckbox', { name: /โหมดศึกษา/ })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  expect(errors).toEqual([]);
});

test.describe('phone width', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('study mode and the practice buttons fit at 360 px', async ({ page }) => {
    await page.goto(HAND);
    await expect(playable(page).first()).toBeVisible();
    await page.getByRole('button', { name: 'เมนู' }).click();
    await page.getByRole('menuitemcheckbox', { name: /โหมดศึกษา/ }).click();
    await expect(page.locator('[data-open-hand="West"]')).toBeVisible();
    const scrolls = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
    for (let turn = 0; turn < 4; turn++) {
      expect(await scrolls()).toBe(false);
      await expect(playable(page).first()).toBeVisible({ timeout: 15_000 });
      await playable(page).first().click(CORNER);
    }
    expect(await scrolls()).toBe(false);
  });
});
