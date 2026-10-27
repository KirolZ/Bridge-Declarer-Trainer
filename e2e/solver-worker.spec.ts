import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// TASKS M5: the solver runs in a Web Worker, so the page keeps responding while it works.
// Seed 4 deals ten tables that take about 1.3 s together in Node (none over 0.25 s).

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

const maxGap = async (page: Page) => Number(await page.getByTestId('max-gap').textContent());

// Longest pause between animation frames allowed while the solver works. Idle runs show one
// frame (~17 ms); the slack is for CI machines running several browsers at once.
const MAX_FRAME_GAP_MS = 500;

test('the page stays usable while the solver worker computes', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#/dev/solver?seed=4');
  const status = page.getByTestId('status');
  const counter = page.getByRole('button', { name: /กดนับ/ });

  // Ten full-deal tables in a row: long enough to click around while it runs.
  await page.getByRole('button', { name: 'ddTable 10 มือ' }).click();
  await expect(status).toHaveAttribute('data-state', 'busy');
  expect(page.workers().map((w) => w.url())).toContainEqual(
    expect.stringContaining('solver.worker'),
  );
  await counter.click();
  await counter.click();
  await expect(page.getByTestId('busy-clicks')).toHaveText('2');
  await expect(status).toHaveAttribute('data-state', 'busy');
  await expect(status).toHaveAttribute('data-state', 'done', { timeout: 45_000 });
  await expect(page.getByTestId('dd-table').locator('td')).toHaveCount(5);
  expect(await maxGap(page)).toBeLessThan(MAX_FRAME_GAP_MS);

  // A deal played out through the worker (1 solve + 52 analyze) ends as solve predicted.
  await page.getByRole('button', { name: 'เล่นทั้งมือแบบ DD' }).click();
  await expect(status).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
  await expect(status).toContainText('✓');
  expect(await maxGap(page)).toBeLessThan(MAX_FRAME_GAP_MS);

  expect(errors).toEqual([]);
});

test('cancelling a running job leaves the solver ready for the next one', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#/dev/solver?seed=4');
  const status = page.getByTestId('status');
  await page.getByRole('button', { name: 'ddTable 10 มือ' }).click();
  await expect(status).toHaveAttribute('data-state', 'busy');
  await page.getByRole('button', { name: 'ยกเลิก' }).click();
  await expect(status).toHaveAttribute('data-state', 'idle');

  await page.getByRole('button', { name: 'ddTable มือสุ่ม' }).click();
  await expect(status).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
  await expect(page.getByTestId('dd-table').locator('td')).toHaveCount(5);
  expect(errors).toEqual([]);
});
