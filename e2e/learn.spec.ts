import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// TASKS M12 12.1–12.2: the guide's chapter list and progress, a lesson with glossary terms and
// card examples, and the three kinds of exercise.

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

async function noSideScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test('back from the chapter list goes home, also after opening a chapter', async ({ page }) => {
  // Bug: chapter → "กลับไปรายการบท" → ← went back in history, i.e. into the chapter again.
  await page.goto('/');
  await page.getByRole('link', { name: 'คู่มือ' }).click();
  await page.locator('[data-chapter="1"]').click();
  await page.getByRole('link', { name: 'กลับไปรายการบท' }).first().click();
  await expect(page.getByTestId('learn-progress')).toBeVisible();
  await page.getByRole('button', { name: 'กลับ', exact: true }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('link', { name: 'คู่มือ' })).toBeVisible();
});

test('chapter list, a lesson with terms and examples, progress kept', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'คู่มือ' }).click();
  await expect(page.getByTestId('learn-progress')).toContainText('อ่านแล้ว 0/14 บท');
  await expect(page.locator('[data-chapter]')).toHaveCount(14);
  await noSideScroll(page);

  await page.locator('[data-chapter="2"]').click();
  await expect(page.getByRole('heading', { name: 'Trick และการลงตามดอก' })).toBeVisible();
  // Card examples: two tricks, the engine picks the winner.
  await expect(page.locator('[data-trick-diagram]')).toHaveCount(2);
  await expect(page.locator('[data-trick-diagram]').first()).toHaveAttribute('data-winner', 'E');

  // A glossary term opens its definition without leaving the page.
  await page.locator('[data-term="trick"]').first().click();
  const sheet = page.getByTestId('term-sheet');
  await expect(sheet).toContainText('trick (ตา)');
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await noSideScroll(page);

  // Reading to the end marks the chapter read.
  await page.getByTestId('lesson-end').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('lesson-end')).toHaveAttribute('data-read', 'true');

  // From a term to the glossary, with that term picked out.
  await page.locator('[data-term="discard"]').first().click();
  await sheet.getByRole('link', { name: 'อภิธานศัพท์ทั้งหมด' }).click();
  await expect(page.locator('[data-term-entry="discard"]')).toHaveAttribute('data-focus', 'true');

  await page.goto('/#/learn');
  await expect(page.getByTestId('learn-progress')).toContainText('อ่านแล้ว 1/14 บท');
  await page.reload();
  await expect(page.locator('[data-chapter="2"]')).toHaveAttribute('data-read', 'true');
  expect(errors).toEqual([]);
});

test('pick the legal cards: reasons for a wrong pick, then pass', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#/learn/ex/ch2-follow-suit');
  await page.locator('[data-card="SA"]').click();
  await page.locator('[data-card="HA"]').click();
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click();
  const feedback = page.getByTestId('feedback');
  await expect(feedback).toHaveAttribute('data-tone', 'wrong');
  await expect(feedback.locator('[data-reason="illegal"]')).toContainText(
    'ต้องลง ♥ เพราะยังมี ♥ อยู่',
  );
  await expect(feedback.locator('[data-reason="missing"]')).toHaveCount(1);

  await page.locator('[data-card="SA"]').click();
  await page.locator('[data-card="H8"]').click();
  await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click();
  await expect(feedback).toHaveAttribute('data-tone', 'ok');
  await expect(page.getByTestId('explanation')).toBeVisible();
  await noSideScroll(page);

  await page.getByRole('link', { name: 'ข้อต่อไป →' }).click();
  await expect(page).toHaveURL(/ch2-void-discard$/);
  await page.goto('/#/learn/2');
  await expect(page.locator('[data-exercise="ch2-follow-suit"]')).toHaveAttribute(
    'data-passed',
    'true',
  );
  expect(errors).toEqual([]);
});

test('who wins the trick, and a question', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#/learn/ex/ch2-who-wins');
  await page.getByRole('button', { name: 'East' }).click();
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-tone', 'wrong');
  await page.getByRole('button', { name: 'North' }).click();
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-tone', 'ok');
  await expect(page.locator('[data-trick-diagram]')).toHaveAttribute('data-winner', 'N');

  await page.goto('/#/learn/ex/ch4-3nt-tricks');
  await page.getByRole('button', { name: '6', exact: true }).click();
  await page.getByRole('button', { name: 'ดูเฉลย' }).click();
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-tone', 'info');
  await expect(page.locator('[data-option="2"]')).toHaveAttribute('data-state', 'right');
  expect(errors).toEqual([]);
});

const playable = (page: Page, code: string) =>
  page.locator(`[data-playable="true"][data-card="${code}"]`);

test('play exercise: pass, miss with the mistake named, step through the answer', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await page.goto('/#/learn/ex/ch10-finesse-aq');
  const feedback = page.getByTestId('feedback');

  // The finesse line (NS cards in turn; the bots answer in between).
  for (const code of ['S2', 'SQ', 'SA', 'S3', 'HA', 'C2']) {
    await playable(page, code).click(CORNER);
  }
  await expect(feedback).toHaveAttribute('data-tone', 'ok');
  await expect(feedback).toContainText('ผ่าน! NS ได้ 3 trick');
  await noSideScroll(page);

  // Rise with the ace: the goal is gone, and the page says where.
  await page.getByRole('button', { name: '↺ ลองใหม่' }).click();
  await playable(page, 'S2').click(CORNER);
  await playable(page, 'SA').click(CORNER);
  for (;;) {
    const card = page.locator('[data-playable="true"]').first();
    await expect(card.or(feedback)).toBeVisible({ timeout: 15_000 });
    if (await feedback.isVisible()) break;
    await card.click(CORNER);
  }
  await expect(feedback).toHaveAttribute('data-tone', 'wrong');
  const mistake = page.getByTestId('mistake');
  await expect(mistake).toHaveAttribute('data-card', 'S14');
  await expect(mistake).toContainText('ควรลง');
  await expect(mistake).toContainText('จะกิน');

  await page.getByRole('button', { name: 'ดูเฉลย' }).click();
  const solution = page.getByTestId('solution');
  await expect(solution).toHaveAttribute('data-step', '0');
  const next = page.getByRole('button', { name: 'ถัดไป →' });
  for (let i = 1; i <= 12; i++) {
    await next.click();
    await expect(solution).toHaveAttribute('data-step', String(i));
  }
  await expect(next).toBeDisabled();
  await expect(solution).toContainText('จบแล้ว NS ได้ 3 trick');
  expect(errors).toEqual([]);
});

test('guide pages fit a 360 px phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const path of [
    '/#/learn',
    '/#/learn/2',
    '/#/learn/glossary',
    '/#/learn/ex/ch10-finesse-aq',
  ]) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await noSideScroll(page);
  }
});
