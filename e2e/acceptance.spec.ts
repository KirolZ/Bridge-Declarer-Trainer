import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// SPEC §10 — the two end-to-end journeys, on desktop and phone, with no console error (the CSP of
// docker/security-headers.conf is sent by `vite preview` as well as nginx, so a violation fails here).
// Run against the Docker image with E2E_BASE_URL=http://localhost:8081.

// Seeded deal 5: South makes 3♥ exactly (9 tricks) with best play.
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

const noSideScroll = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(0);

test('a new player: "never played" → reads chapter 1 → passes the chapter 2 exercises', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByTestId('welcome')).toBeVisible();
  await page.getByRole('button', { name: /ยังไม่เคย/ }).click();

  // Chapter 1, read to the end.
  await expect(page).toHaveURL(/#\/learn\/1$/);
  await expect(page.getByRole('heading', { name: 'Bridge คืออะไร' })).toBeVisible();
  await page.getByTestId('lesson-end').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('lesson-end')).toHaveAttribute('data-read', 'true');
  await noSideScroll(page);

  // On to chapter 2 and its exercises, one after the other.
  await page.getByRole('link', { name: /บทถัดไป/ }).click();
  await expect(page).toHaveURL(/#\/learn\/2$/);
  await page.locator('[data-exercise="ch2-follow-suit"]').click();

  const feedback = page.getByTestId('feedback');
  const check = page.getByRole('button', { name: 'ตรวจคำตอบ' });
  await page.locator('[data-card="HA"]').click();
  await page.locator('[data-card="H8"]').click();
  await check.click();
  await expect(feedback).toHaveAttribute('data-tone', 'ok');
  await noSideScroll(page);

  await page.getByRole('link', { name: 'ข้อต่อไป →' }).click();
  await expect(page).toHaveURL(/ch2-void-discard$/);
  for (const code of ['SA', 'HQ', 'CJ']) await page.locator(`[data-card="${code}"]`).click();
  await check.click();
  await expect(feedback).toHaveAttribute('data-tone', 'ok');

  await page.getByRole('link', { name: 'ข้อต่อไป →' }).click();
  await expect(page).toHaveURL(/ch2-who-wins$/);
  await page.getByRole('button', { name: 'North' }).click();
  await expect(feedback).toHaveAttribute('data-tone', 'ok');

  await page.goto('/#/learn/2');
  for (const id of ['ch2-follow-suit', 'ch2-void-discard', 'ch2-who-wins']) {
    await expect(page.locator(`[data-exercise="${id}"]`)).toHaveAttribute('data-passed', 'true');
  }
  expect(errors).toEqual([]);
});

test('a hand from a link, following the hint every turn: contract made, 0 tricks lost', async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await page.goto(HAND);
  const result = page.getByTestId('result');
  const playable = page.locator('[data-playable="true"]');

  let turns = 0;
  for (;;) {
    await expect(playable.first().or(result)).toBeVisible({ timeout: 15_000 });
    if (await result.isVisible()) break;
    await page.getByRole('button', { name: /^คำใบ้/ }).click();
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
  await expect(page.getByTestId('result-tricks')).toContainText('ได้ 9 trick (DD ทำได้ 9)');
  await expect(page.getByTestId('review')).toContainText('เสีย 0 trick');
  await expect(page.getByTestId('result-notes')).toContainText('ใช้คำใบ้ 26 ครั้ง');
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('the server sends the security headers', async ({ request }) => {
  const res = await request.get('/');
  const csp = res.headers()['content-security-policy'] ?? '';
  expect(csp).toContain("worker-src 'self'");
  expect(csp).toContain("'wasm-unsafe-eval'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
});

test('the DDS license ships with the app and the home page credits it', async ({
  page,
  request,
}) => {
  const license = await request.get('/LICENSE-DDS.txt');
  expect(license.ok()).toBe(true);
  expect(await license.text()).toContain('Apache License');
  await page.goto('/');
  await expect(page.getByTestId('credits')).toContainText('DDS');
  await expect(
    page.getByTestId('credits').getByRole('link', { name: 'Apache-2.0' }),
  ).toHaveAttribute('href', 'LICENSE-DDS.txt');
});
