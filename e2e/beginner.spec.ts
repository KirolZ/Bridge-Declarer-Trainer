import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// TASKS M12 12.7–12.8: the first-visit question, the guide's entry points (home progress, the
// table's `?` panel) and beginner mode on the table. Same fixed deal as play.spec.ts (3♥ by South).
const HAND = '/#/play/GNA8WobYT233o4lpzA/3H';

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

/**
 * Overlapped cards show only their corner index, so click there (as a person would). Cards that
 * cannot be played are `aria-disabled`, which Playwright will not click unless forced.
 */
const BLOCKED_CLICK = { position: { x: 6, y: 6 }, force: true };

test('first visit: "never played" opens chapter 1 with beginner mode on', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByTestId('welcome')).toBeVisible();
  await expect(page.getByRole('button', { name: 'เริ่มเล่น', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('home-guide-progress')).toHaveText('0/14 บท');
  await noSideScroll(page);

  await page.getByRole('button', { name: /ยังไม่เคย/ }).click();
  await expect(page).toHaveURL(/#\/learn\/1$/);
  await expect(page.getByRole('heading', { name: 'Bridge คืออะไร' })).toBeVisible();
  await page.getByTestId('lesson-end').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('lesson-end')).toHaveAttribute('data-read', 'true');

  // Beginner mode is on and decides the contract type, difficulty and bot speed.
  await page.goto('/#/settings');
  await expect(page.getByRole('checkbox', { name: /โหมดมือใหม่/ })).toBeChecked();
  await expect(page.getByRole('group', { name: 'ประเภท contract' })).toHaveAttribute(
    'data-locked',
    'true',
  );
  await expect(
    page.getByRole('group', { name: 'ความเร็วบอท' }).getByRole('radio').first(),
  ).toBeDisabled();

  // Asked only once; home shows the guide progress.
  await page.goto('/');
  await expect(page.getByTestId('welcome')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'เริ่มเล่น', exact: true })).toBeVisible();
  await expect(page.getByTestId('home-guide-progress')).toHaveText('1/14 บท');
  expect(errors).toEqual([]);
});

test('beginner mode: tips, why a card cannot be played, the ? panel, the score explained', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('bridge-trainer.settings.v1', JSON.stringify({ beginnerMode: true }));
    localStorage.setItem('bridge-trainer.learn.v1', JSON.stringify({ welcomed: true }));
  });
  await page.goto(HAND);
  const tip = page.getByTestId('coach-tip');
  await expect(tip).toHaveAttribute('data-tip', 'contract');
  await expect(tip).toContainText('contract คือ 3♥ — ต้องได้ 9 trick โดย ♥ เป็น trump');

  // West leads; North (dummy) plays next: the tip to act on comes first.
  await expect(tip).toHaveAttribute('data-tip', 'north-turn', { timeout: 15_000 });
  const north = page.getByRole('region', { name: 'North (dummy)' });
  const south = page.getByRole('region', { name: 'South (คุณ)' });
  const status = page.getByTestId('status');
  await south.locator('[data-card]').first().click(BLOCKED_CLICK);
  await expect(status).toHaveText('ตอนนี้ถึงตา dummy — กดไพ่ของ North ด้านบน');
  // North can follow West's suit, so any other suit is refused with the reason.
  await north.locator('[data-card]:not([data-playable])').first().click(BLOCKED_CLICK);
  await expect(status).toContainText(/^ต้องลง . เพราะ dummy ยังมี . อยู่$/);
  await noSideScroll(page);

  // `?` opens the chapter about the situation (dummy → chapter 5) beside the table.
  await page.getByTestId('guide-button').click();
  const panel = page.getByTestId('guide-panel');
  await expect(panel).toHaveAttribute('data-chapter', '5');
  await expect(
    panel.getByRole('heading', { name: 'Declarer, dummy และฝั่งป้องกัน' }),
  ).toBeVisible();
  await panel.getByRole('button', { name: 'บทถัดไป →' }).click();
  await expect(panel).toHaveAttribute('data-chapter', '6');
  await noSideScroll(page);
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(page).toHaveURL(/#\/play\//);

  // "เข้าใจแล้ว" hides a tip for good; the next one comes up.
  await tip.getByTestId('coach-dismiss').click();
  await expect(tip).toHaveAttribute('data-tip', 'contract');
  await tip.getByTestId('coach-dismiss').click();
  await expect(tip).toHaveAttribute('data-tip', 'dummy');
  await tip.getByTestId('coach-dismiss').click();
  await expect(tip).toHaveCount(0);

  // Claim nothing more: down 9, and the result explains the score.
  await page.getByRole('button', { name: 'Claim' }).click();
  const dialog = page.getByTestId('claim-dialog');
  for (let n = 13; n > 0; n--) await dialog.getByRole('button', { name: 'ลด' }).click();
  await dialog.getByRole('button', { name: 'Claim 0 trick' }).click();
  const explain = page.getByTestId('score-explain');
  await expect(explain).toContainText('ขาด 9 trick');
  await expect(explain).toContainText('9 × 50');
  await expect(explain).toContainText('−450');

  // Dismissed tips stay dismissed after a reload.
  await page.reload();
  await expect(page.locator('[data-playable="true"]').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('coach-tip')).toHaveCount(0);
  expect(errors).toEqual([]);
});
