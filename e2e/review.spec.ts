import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// TASKS M10: post-hand review. Same fixed deal as play.spec.ts: seeded deal 5, South makes 3♥
// exactly (9 tricks) with best play.
const PATH = '#/play/GNA8WobYT233o4lpzA/3H';
const HAND = `/${PATH}`;

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
const hinted = (page: Page) => page.locator('[data-hint="true"]');
const codesOf = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) => els.map((e) => e.getAttribute('data-card')!));

const SYMBOL: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
/** `SK` → `♠K`, `HT` → `♥10` (as the summary writes cards). */
const label = (code: string) => SYMBOL[code[0]!] + (code[1] === 'T' ? '10' : code[1]!);

/** Follows the hint every turn until the summary shows. */
async function playByHints(page: Page, onTurn?: () => Promise<boolean>) {
  const result = page.getByTestId('result');
  for (;;) {
    await expect(playable(page).first().or(result)).toBeVisible({ timeout: 15_000 });
    if (await result.isVisible()) return;
    await page.getByRole('button', { name: /^คำใบ้/ }).click();
    await expect(hinted(page).first()).toBeVisible();
    if (await onTurn?.()) continue;
    await hinted(page).first().click(CORNER);
  }
}

async function claim(page: Page, tricks: number) {
  await expect(playable(page).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Claim' }).click();
  const dialog = page.getByTestId('claim-dialog');
  for (let n = 13; n > tricks; n--) await dialog.getByRole('button', { name: 'ลด' }).click();
  await dialog.getByRole('button', { name: `Claim ${tricks} trick` }).click();
  await expect(page.getByTestId('result')).toBeVisible();
}

test('a deliberate mistake: the summary names the trick and the card to play', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = collectErrors(page);
  await page.goto(HAND);

  // Follow the hints, except once: play a card the hint left out (it loses a trick).
  let mistake: { trick: number; card: string; best: string[] } | null = null;
  await playByHints(page, async () => {
    if (mistake) return false;
    const best = await codesOf(page, '[data-hint="true"]');
    const wrong = (await codesOf(page, '[data-playable="true"]')).find((c) => !best.includes(c));
    if (!wrong) return false;
    const trick = Number((await page.getByTestId('trick-number').textContent())!.split('/')[0]);
    mistake = { trick, card: wrong, best };
    await page.locator(`[data-card="${wrong}"]`).click(CORNER);
    return true;
  });
  expect(mistake).not.toBeNull();
  const m = mistake!;

  const review = page.getByTestId('review');
  await expect(review).toHaveAttribute('data-status', 'ready');
  const lost = Number(await review.getAttribute('data-lost'));
  expect(lost).toBeGreaterThan(0);
  await expect(page.getByTestId('result')).toHaveAttribute('data-made', 'false');
  await expect(page.getByTestId('result-tricks')).toContainText(
    `ได้ ${9 - lost} trick (DD ทำได้ 9)`,
  );

  // One place where tricks were lost: that trick, that card, and the hinted cards instead.
  const losses = page.getByTestId('loss');
  await expect(losses).toHaveCount(1);
  const row = losses.first();
  await expect(row).toHaveAttribute('data-trick', String(m.trick));
  await expect(row).toContainText(`trick ${m.trick}`);
  await expect(row).toContainText(`ลง ${label(m.card)}`);
  await expect(row).toContainText(`−${lost}`);
  const advice = (await row.textContent())!.split('ควรลง')[1]!;
  for (const c of m.best) expect(advice).toContain(label(c));

  // The replay opens at that trick with all four hands, the wrong card and the better ones.
  await row.click();
  const replay = page.getByTestId('replay');
  await expect(replay).toHaveAttribute('data-trick', String(m.trick));
  await expect(replay.locator('[data-open-hand]')).toHaveCount(4);
  await expect(replay.locator(`[data-mark="wrong"][data-hand-card="${m.card}"]`)).toBeVisible();
  await expect(replay.locator('[data-mark="better"]')).toHaveCount(m.best.length);
  await expect(replay.getByTestId('replay-loss')).toContainText(`เสีย ${lost} trick`);
  await expect(replay.locator('[data-trick-card]')).toHaveCount(4);

  // Step through tricks with the keys and buttons.
  if (m.trick < 13) {
    await page.keyboard.press('ArrowRight');
    await expect(replay).toHaveAttribute('data-trick', String(m.trick + 1));
    await replay.getByRole('button', { name: /trick ก่อน/ }).click();
    await expect(replay).toHaveAttribute('data-trick', String(m.trick));
  }
  await replay.getByRole('button', { name: /^trick 1( |$)/ }).click();
  await expect(replay).toHaveAttribute('data-trick', '1');
  await expect(replay.locator('[data-mark]').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('result')).toBeVisible();

  // Play again from that trick, by the hints this time: nothing lost.
  await losses.first().click();
  await replay.getByRole('button', { name: 'ลองเล่นใหม่จากตรงนี้' }).click();
  await expect(replay).toBeHidden();
  await expect(page.getByTestId('result')).toBeHidden();
  await playByHints(page);
  await expect(page.getByTestId('result')).toHaveAttribute('data-made', 'true');
  await expect(review).toHaveAttribute('data-lost', '0');
  await expect(review).toContainText('เสีย 0 trick');
  expect(errors).toEqual([]);
});

test('a short claim counts as tricks lost; share copies the link of the hand', async ({
  page,
  context,
}) => {
  const errors = collectErrors(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(HAND);
  await claim(page, 8);

  const review = page.getByTestId('review');
  await expect(review).toHaveAttribute('data-lost', '1');
  await expect(page.getByTestId('result-tricks')).toContainText('ได้ 8 trick (DD ทำได้ 9)');
  const row = page.getByTestId('loss').first();
  await expect(row).toContainText('Claim รวม 8 trick แต่ยังทำได้ 9');
  await row.click();
  const replay = page.getByTestId('replay');
  await expect(replay).toHaveAttribute('data-trick', '1');
  await expect(replay.getByTestId('replay-claim')).toContainText('NS ได้รวม 8 trick');
  await replay.getByRole('button', { name: 'กลับหน้าสรุป' }).click();

  await page.getByRole('button', { name: /แชร์มือนี้/ }).click();
  await expect(page.getByRole('button', { name: /คัดลอกลิงก์แล้ว/ })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(new RegExp(`^http://[^#]+/${PATH.replace(/[/#]/g, '\\$&')}$`));

  // The link opens the same hand from the start.
  const other = await context.newPage();
  await other.goto(copied);
  await expect(other.getByTestId('contract')).toContainText('3♥');
  await expect(other.locator('[data-playable="true"]').first()).toBeVisible({ timeout: 15_000 });
  expect(errors).toEqual([]);
});

test.describe('phone width', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('summary and replay fit at 360 px', async ({ page }) => {
    const scrolls = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
    await page.goto(HAND);
    await claim(page, 7);
    await expect(page.getByTestId('review')).toHaveAttribute('data-lost', '2');
    expect(await scrolls()).toBe(false);
    await page.getByRole('button', { name: /ดูย้อนหลัง/ }).click();
    const replay = page.getByTestId('replay');
    await expect(replay.locator('[data-open-hand]')).toHaveCount(4);
    expect(await scrolls()).toBe(false);
    // Each hand diagram sits fully inside the screen.
    for (const box of await replay
      .locator('[data-open-hand]')
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect))) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(360);
    }
  });
});
