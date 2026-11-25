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

/**
 * M33: with room beside the table (≥ 1280 px, the desktop project) the auction is a panel there,
 * always open; narrower screens have one line above the table and a sheet the player opens.
 */
const hasPanel = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1280;
const narrow = (page: Page) => !hasPanel(page);

/** Shows the whole auction: on a narrow screen by opening the sheet. */
async function showAuction(page: Page) {
  if (narrow(page)) {
    await expect(page.getByTestId('auction')).toHaveCount(0);
    await page.getByTestId('auction-toggle').click();
  }
  await expect(page.getByTestId('auction')).toBeVisible();
}

/** Closes the sheet so the cards can be played (narrow screens). */
async function closeSheet(page: Page) {
  if (!narrow(page)) return;
  await page.getByTestId('auction-sheet-close').click();
  await expect(page.getByTestId('auction')).toHaveCount(0);
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
  await showAuction(page);
  await expect(page.getByTestId('auction-info')).toHaveText('แจก: South · ไม่มีฝ่ายไหน vul');
  const calls = auction.getByTestId('auction-call');
  await expect(calls).toHaveCount(8);
  // South deals, so the first row starts in the fourth column (W N E S).
  await expect(auction.locator('tbody tr').first().locator('td').nth(3)).toHaveText('1♥');
  await expect(calls.nth(1)).toHaveText('2♦');
  await expect(calls.last()).toHaveText('Pass');
  await noSideScroll(page);
  await closeSheet(page);

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
      // The panel beside the table stays; on a narrower screen the auction is one line.
      if (hasPanel(page)) {
        await expect(auction).toBeVisible();
        await expect(page.getByTestId('auction-line')).toHaveCount(0);
      } else {
        await expect(auction).toBeHidden();
        await expect(page.getByTestId('auction-line')).toHaveText(/S\s*1♥\s*W\s*2♦\s*N\s*2♥/);
      }
      await noSideScroll(page);
    }
  }

  expect(turns).toBe(26);
  await expect(result).toHaveAttribute('data-made', 'true');
  await expect(page.getByTestId('review')).toContainText('เสีย 0 trick');
  expect(errors).toEqual([]);
});

test('the folded auction opens again and closes on demand', async ({ page }) => {
  // A narrower window: the line above the table opens the sheet, and the sheet closes again.
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto(HAND);
  const auction = page.getByTestId('auction');
  await showAuction(page);
  await closeSheet(page);
  await expect(auction).toBeHidden();
  await expect(page.getByTestId('auction-line')).toBeVisible();
  await page.getByTestId('auction-toggle').click();
  await expect(auction).toBeVisible();
  await closeSheet(page);

  await page.goto('/');
  await page.getByTestId('language-switch').getByRole('button', { name: 'English' }).click();
  await page.goto(`${HAND.replace('?', '?v=ns&')}`);
  await showAuction(page);
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
  await showAuction(page);
  await expect(page.getByTestId('auction-call').last()).toHaveText('Pass');
  await noSideScroll(page);
  await closeSheet(page);

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

// TASKS M31: the auction's meanings and what the defenders hold (SPEC §8). The same deal with the
// bidder's own auction: S 1♥, W 2♦ (overcall), N 2♥, all pass — 2♥ by South.
const BID = '/#/play/GNA8WobYT233o4lpzA/2H?d=S&a=1H-2D-2H-P-P-P';

test('tapping a call shows what it means, with what the defenders probably hold', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto(BID);
  const auction = page.getByTestId('auction');
  await showAuction(page);
  const meaning = page.getByTestId('auction-meaning');
  await expect(meaning).toHaveText('แตะ call เพื่อดูความหมาย');
  const button = auction.getByTestId('auction-call-button');
  await button.nth(1).click();
  await expect(button.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(meaning).toHaveText('2♦ (West) — overcall · 10–16 HCP · ♦ 5 ใบขึ้นไป');
  // The words that are terms open the glossary sheet without leaving the table.
  await meaning.locator('[data-term="overcall"]').click();
  await expect(page.getByTestId('term-sheet')).toContainText('ประมูลแทรก');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('term-sheet')).toHaveCount(0);
  // A second tap clears it; hovering a call tells the same in its title.
  await button.nth(1).click();
  await expect(meaning).toHaveText('แตะ call เพื่อดูความหมาย');
  await expect(button.nth(2)).toHaveAttribute(
    'title',
    'North: 2♥ — raise ดอกของคู่ · 6–10 HCP · ♥ 3 ใบขึ้นไป',
  );

  // Dummy is face up once West has led: 20 HCP out of sight, West showed 10–16.
  const inference = page.getByTestId('auction-inference');
  await expect(inference.locator('[data-seat="W"]')).toHaveText('West: 10–16 HCP · ♦ 5 ใบขึ้นไป', {
    timeout: 15_000,
  });
  await expect(inference.locator('[data-seat="E"]')).toHaveText('East: 4–10 HCP · ♦ ไม่เกิน 4 ใบ');
  await noSideScroll(page);

  // A closes and opens the sheet; the panel beside the table is always there.
  await page.keyboard.press('a');
  if (hasPanel(page)) {
    await expect(auction).toBeVisible();
  } else {
    await expect(auction).toBeHidden();
    await expect(page.getByTestId('auction-line')).toBeVisible();
    await page.keyboard.press('a');
    await expect(auction).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('the summary and the replay show the auction too', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(BID);
  await expect(page.locator('[data-playable="true"]').first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Claim' }).click();
  const dialog = page.getByTestId('claim-dialog');
  for (let n = 13; n > 0; n--) await dialog.getByRole('button', { name: 'ลด' }).click();
  await dialog.getByRole('button', { name: 'Claim 0 trick' }).click();

  const result = page.getByTestId('result');
  await expect(result).toBeVisible();
  // Folded at first, like the other extras of the summary.
  await expect(result.getByTestId('auction')).toHaveCount(0);
  await result.getByTestId('auction-toggle').click();
  await result.getByTestId('auction-call-button').first().click();
  await expect(result.getByTestId('auction-meaning')).toContainText('1♥ (South) — เปิดประมูล');
  await expect(result.getByTestId('auction-inference')).toContainText('West: 10–16 HCP');
  await noSideScroll(page);

  await result.getByRole('button', { name: 'ดูย้อนหลัง' }).click();
  const replay = page.getByTestId('replay');
  await expect(replay.getByTestId('auction-line')).toBeVisible();
  await replay.getByTestId('auction-toggle').click();
  await expect(replay.getByTestId('auction-call')).toHaveCount(6);
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('beginner mode starts with the auction folded and a tip about the defender who bid', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem(
      'bridge-trainer.settings.v1',
      JSON.stringify({ beginnerMode: true, cardPlay: 'tap' }),
    );
    localStorage.setItem(
      'bridge-trainer.learn.v1',
      JSON.stringify({ welcomed: true, tips: ['contract', 'north-turn'] }),
    );
  });
  await page.goto(BID);
  if (hasPanel(page)) {
    // The panel beside the table takes none of the table's room: it stays open.
    await expect(page.getByTestId('auction')).toBeVisible();
  } else {
    await expect(page.getByTestId('auction-line')).toBeVisible();
    await expect(page.getByTestId('auction')).toHaveCount(0);
  }
  const tip = page.getByTestId('coach-tip');
  await expect(tip).toHaveAttribute('data-tip', 'auction');
  await expect(tip).toContainText('West ประมูล 2♦ — overcall · 10–16 HCP · ♦ 5 ใบขึ้นไป');
  await noSideScroll(page);
  await tip.getByTestId('coach-dismiss').click();
  await expect(tip).toHaveAttribute('data-tip', 'dummy', { timeout: 15_000 });
  // The tip points at the auction: on a narrower screen the line opens it.
  if (!hasPanel(page)) await page.getByTestId('auction-toggle').click();
  await expect(page.getByTestId('auction')).toBeVisible();
  expect(errors).toEqual([]);
});

// TASKS M33: on a phone the auction never takes the table's room — a sheet the player opens.
test('on a phone the auction opens as a sheet, and closes every way', async ({ page }) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto(BID);
  await expect(page.locator('[data-playable="true"]').first()).toBeVisible({ timeout: 15_000 });
  // Nothing opens on its own: the table keeps the room.
  await expect(page.getByTestId('auction')).toHaveCount(0);
  await expect(page.getByTestId('auction-line')).toBeVisible();
  const sheet = page.getByTestId('auction-sheet');

  await page.getByTestId('auction-toggle').click();
  await expect(sheet).toBeVisible();
  await sheet.getByTestId('auction-call-button').nth(1).click();
  await expect(sheet.getByTestId('auction-meaning')).toHaveText(
    '2♦ (West) — overcall · 10–16 HCP · ♦ 5 ใบขึ้นไป',
  );
  // A glossary term opens over the sheet; Esc closes the term first, then the sheet.
  await sheet.locator('[data-term="overcall"]').click();
  await expect(page.getByTestId('term-sheet')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('term-sheet')).toHaveCount(0);
  await expect(sheet).toBeVisible();
  await noSideScroll(page);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);

  // A tap above the sheet closes it, so does ✕, so does A.
  await page.getByTestId('auction-toggle').click();
  await page.getByTestId('auction-sheet-backdrop').click({ position: { x: 20, y: 20 } });
  await expect(sheet).toHaveCount(0);
  await page.getByTestId('auction-toggle').click();
  await page.getByTestId('auction-sheet-close').click();
  await expect(sheet).toHaveCount(0);
  await page.keyboard.press('a');
  await expect(sheet).toBeVisible();
  await page.keyboard.press('a');
  await expect(sheet).toHaveCount(0);

  // Closed, the cards play as before.
  await page
    .locator('[data-playable="true"]')
    .first()
    .click({ position: { x: 6, y: 6 } });
  expect(errors).toEqual([]);
});

test('with room on the side, the auction is a panel beside the table', async ({ page }) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto(BID);
  const panel = page.locator('[data-testid="auction"][data-layout="panel"]');
  await expect(panel).toBeVisible();
  await expect(page.getByTestId('auction-line')).toHaveCount(0);
  // Beside the table, not above it.
  const table = page.locator('.table-felt');
  const [p, t] = [await panel.boundingBox(), await table.boundingBox()];
  expect(p!.x + p!.width).toBeLessThanOrEqual(t!.x);
  // Still open after the player's first card.
  await expect(page.locator('[data-playable="true"]').first()).toBeVisible({ timeout: 15_000 });
  await page
    .locator('[data-playable="true"]')
    .first()
    .click({ position: { x: 6, y: 6 } });
  await expect(panel).toBeVisible();
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

// TASKS M37 37.7 (the user, a 960 × 1440 tablet): a tall screen without room on the side shows the
// auction open above the table — no line, no sheet over South's hand — and the table still fits.
test('a tall tablet: the auction stays open above the table, South is not covered', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 960, height: 1440 });
  await page.goto(BID);
  const top = page.locator('[data-testid="auction"][data-layout="top"]');
  await expect(top).toBeVisible();
  await expect(page.getByTestId('auction-line')).toHaveCount(0);
  await expect(page.getByTestId('auction-toggle')).toHaveCount(0);
  // Above the table, and grown with the screen.
  const [a, t] = [(await top.boundingBox())!, (await page.locator('.table-felt').boundingBox())!];
  expect(a.y + a.height).toBeLessThanOrEqual(t.y);
  expect(await top.evaluate((el) => getComputedStyle(el).zoom)).toBe('1.2');
  // A call's meaning shows in place.
  await top.getByTestId('auction-call-button').nth(1).click();
  await expect(top.getByTestId('auction-meaning')).toContainText('2♦ (West) — overcall');

  // The whole table fits under it; A opens nothing.
  await expect(page.locator('[data-playable="true"]').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('region', { name: 'South (คุณ)' })).toBeInViewport({ ratio: 1 });
  await page.keyboard.press('a');
  await expect(page.getByTestId('auction-sheet')).toHaveCount(0);
  expect(
    await page.evaluate(() => document.scrollingElement!.scrollHeight - innerHeight),
  ).toBeLessThanOrEqual(0);
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('a tablet that keeps the sheet: the sheet grows and stays on the screen', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(BID);
  await expect(page.locator('[data-playable="true"]').first()).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('auction-toggle').click();
  const sheet = page.getByTestId('auction-sheet');
  await expect(sheet).toBeVisible();
  expect(await sheet.evaluate((el) => getComputedStyle(el).zoom)).toBe('1.2');
  await expect(sheet.getByTestId('auction-sheet-close')).toBeInViewport({ ratio: 1 });
  // A phone keeps the old size.
  await page.setViewportSize({ width: 412, height: 915 });
  await expect.poll(() => sheet.evaluate((el) => getComputedStyle(el).zoom)).toBe('1');
});
