import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Setting "การลงไพ่": tap to play at once (default) or pick a card first; it waits in its trick
// slot and is played by tapping it there or by clicking the card in hand again.
// Same fixed deal as play.spec.ts (seeded deal 5, 3♥ by South).
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
const picked = (page: Page) => page.locator('[data-picked="true"]');
const bar = (page: Page) => page.getByTestId('confirm-play');
const onTrick = (page: Page, code: string) => page.locator(`[data-trick-card="${code}"]`);

function seedSettings(page: Page, settings: object) {
  return page.addInitScript((value) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('bridge-trainer.settings.v1', value);
  }, JSON.stringify(settings));
}

test('confirm mode: pick, change, cancel, then play with the button or a second click', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await seedSettings(page, { cardPlay: 'confirm' });
  await page.goto(HAND);
  // West leads, then North (dummy) is to play.
  await expect(playable(page).first()).toBeVisible({ timeout: 15_000 });
  const codes = await playable(page).evaluateAll((els) =>
    els.map((e) => e.getAttribute('data-card')!),
  );
  const first = codes[0]!;
  const last = codes.at(-1)!;

  // The first click only picks the card.
  await page.locator(`[data-card="${first}"]`).click(CORNER);
  await expect(picked(page)).toHaveAttribute('data-card', first);
  await expect(bar(page)).toBeVisible();
  await expect(onTrick(page, first)).toHaveCount(0);
  const box = (await bar(page).boundingBox())!;
  const width = page.viewportSize()!.width;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(width);

  // ✕ lets go of it; Esc as well.
  await bar(page).getByRole('button', { name: 'ยกเลิก' }).click();
  await expect(picked(page)).toHaveCount(0);
  await expect(bar(page)).toHaveCount(0);
  await page.locator(`[data-card="${first}"]`).click(CORNER);
  await page.keyboard.press('Escape');
  await expect(bar(page)).toHaveCount(0);

  // Picking another card moves the pick; tapping it on the table plays it.
  await page.locator(`[data-card="${first}"]`).click(CORNER);
  await page.locator(`[data-card="${last}"]`).click(CORNER);
  await expect(picked(page)).toHaveCount(1);
  await expect(picked(page)).toHaveAttribute('data-card', last);
  await page.getByTestId('confirm-play-button').click();
  await expect(onTrick(page, last)).toBeVisible();
  await expect(bar(page)).toHaveCount(0);

  // Next turn: clicking the same card twice plays it too.
  await expect(playable(page).first()).toBeVisible({ timeout: 15_000 });
  const next = (await playable(page).first().getAttribute('data-card'))!;
  const card = page.locator(`[data-card="${next}"]`);
  await card.click(CORNER);
  await expect(card).toHaveAttribute('data-picked', 'true');
  await card.click(CORNER);
  await expect(onTrick(page, next)).toBeVisible();
  expect(errors).toEqual([]);
});

test('confirm mode with the keyboard: Enter picks, Enter again plays', async ({ page }) => {
  await seedSettings(page, { cardPlay: 'confirm' });
  await page.goto(HAND);
  await expect(playable(page).first()).toBeVisible({ timeout: 15_000 });
  const code = (await playable(page).first().getAttribute('data-card'))!;
  await playable(page).first().focus();
  await page.keyboard.press('Enter');
  await expect(picked(page)).toHaveAttribute('data-card', code);
  await expect(onTrick(page, code)).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect(onTrick(page, code)).toBeVisible();
});

test('the setting switches between confirm and tap-to-play', async ({ page }) => {
  await page.goto('/#/settings');
  const group = page.getByRole('group', { name: 'การลงไพ่' });
  await expect(group.getByRole('radio', { name: 'แตะแล้วลงเลย' })).toBeChecked();
  await group.getByText('แตะเลือก แล้วยืนยัน').click();
  await expect(group.getByRole('radio', { name: 'แตะเลือก แล้วยืนยัน' })).toBeChecked();

  await page.goto(HAND);
  await expect(playable(page).first()).toBeVisible({ timeout: 15_000 });
  await playable(page).first().click(CORNER);
  await expect(bar(page)).toBeVisible();

  await page.goto('/#/settings');
  await group.getByText('แตะแล้วลงเลย').click();
  await page.goto(HAND);
  await expect(playable(page).first()).toBeVisible({ timeout: 15_000 });
  const code = (await playable(page).first().getAttribute('data-card'))!;
  await playable(page).first().click(CORNER);
  await expect(onTrick(page, code)).toBeVisible();
  await expect(bar(page)).toHaveCount(0);
});
