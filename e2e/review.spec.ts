import type { Page } from './fixtures';
import { expect, test } from './fixtures';

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

// TASKS M35: the summary is never taller than the screen (the buttons stay in view while the
// content scrolls), and it grows on a large screen.
test.describe('summary size', () => {
  const AUCTION_HAND = `${HAND}?d=S&a=1H-2D-2H-3D-3H-P-P-P`;

  /** Beginner mode adds the score explanation: the longest summary. */
  async function beginnerSummary(page: Page) {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem(
        'bridge-trainer.settings.v1',
        JSON.stringify({ beginnerMode: true, cardPlay: 'tap' }),
      );
      localStorage.setItem('bridge-trainer.learn.v1', JSON.stringify({ welcomed: true }));
    });
    await page.goto(AUCTION_HAND);
    await claim(page, 7);
    await expect(page.getByTestId('review')).toHaveAttribute('data-lost', '2');
    await expect(page.getByTestId('score-explain')).toBeVisible();
  }

  test('a short phone: the buttons stay in view, the content scrolls', async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 360, height: 640 });
    await beginnerSummary(page);
    const result = page.getByTestId('result');
    await result.getByTestId('auction-toggle').click();
    await expect(result.getByRole('table')).toBeVisible();

    await expect(result).toHaveAttribute('data-scrollable', 'true');
    const body = page.getByTestId('result-body');
    expect(await body.evaluate((b) => b.scrollHeight > b.clientHeight)).toBe(true);
    // No scrollbar (35.5, the user). Headless Chromium hides scrollbars anyway, so check the style.
    expect(await body.evaluate((b) => getComputedStyle(b).scrollbarWidth)).toBe('none');
    // The popup and every button fit the screen without scrolling the page.
    const box = (await result.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(640);
    for (const name of ['แจกไพ่ใหม่', 'เล่นมือนี้ใหม่', 'หน้าแรก', /ดูย้อนหลัง/]) {
      await expect(
        result.getByRole('button', { name }).or(result.getByRole('link', { name })),
      ).toBeInViewport({ ratio: 1 });
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    ).toBe(false);
    // The content scrolls to its end; the buttons stay where they are.
    const before = (await result.getByRole('button', { name: 'แจกไพ่ใหม่' }).boundingBox())!;
    await body.evaluate((b) => b.scrollTo(0, b.scrollHeight));
    await expect(result.getByText(/ฝั่งป้องกันน่าจะมี/)).toBeInViewport();
    expect((await result.getByRole('button', { name: 'แจกไพ่ใหม่' }).boundingBox())!.y).toBe(
      before.y,
    );

    // Hide the buttons to read with the whole height (35.6, the user), then bring them back.
    const toggle = page.getByTestId('result-buttons-toggle');
    const tall = await body.evaluate((b) => b.clientHeight);
    await expect(toggle).toHaveAccessibleName('ซ่อนปุ่ม');
    await toggle.click();
    await expect(result.getByRole('button', { name: 'แจกไพ่ใหม่' })).toHaveCount(0);
    await expect(toggle).toHaveAccessibleName('แสดงปุ่ม');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeInViewport({ ratio: 1 });
    expect(await body.evaluate((b) => b.clientHeight)).toBeGreaterThan(tall + 100);
    await toggle.click();
    await expect(result.getByRole('button', { name: 'แจกไพ่ใหม่' })).toBeInViewport({ ratio: 1 });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(errors).toEqual([]);
  });

  test('a large screen: the summary is bigger and still fits', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await beginnerSummary(page);
    const result = page.getByTestId('result');
    await expect.poll(async () => (await result.boundingBox())!.width).toBeGreaterThan(540);
    const box = (await result.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(1080);
    await expect(result.getByRole('button', { name: 'แจกไพ่ใหม่' })).toBeInViewport({ ratio: 1 });
  });

  test('a phone summary that fits has no line above the buttons', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(AUCTION_HAND);
    await claim(page, 7);
    const result = page.getByTestId('result');
    await expect(page.getByTestId('review')).toHaveAttribute('data-lost', '2');
    await expect(result).toHaveAttribute('data-scrollable', 'false');
    // Nothing to gain from hiding the buttons.
    await expect(page.getByTestId('result-buttons-toggle')).toHaveCount(0);
    // Full width less the margins, as before M35 (polled: the popup scales in).
    await expect.poll(async () => (await result.boundingBox())!.width).toBe(328);
  });
});

// TASKS M36: the replay keeps its buttons on the screen, and North / South are not squeezed.
test.describe('replay size', () => {
  const AUCTION_HAND = `${HAND}?d=S&a=1H-2D-2H-3D-3H-P-P-P`;

  /** Claim 7 (the loss is at trick 1, North's spades marked), then open the replay there. */
  async function openReplay(page: Page) {
    await page.goto(AUCTION_HAND);
    await claim(page, 7);
    await expect(page.getByTestId('review')).toHaveAttribute('data-lost', '2');
    await page.getByTestId('loss').first().click();
    const replay = page.getByTestId('replay');
    await expect(replay).toHaveAttribute('data-trick', '1');
    return replay;
  }

  test('a short phone: the buttons stay in view, North is one line a suit', async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 360, height: 640 });
    const replay = await openReplay(page);
    await replay.getByTestId('auction-toggle').click();
    await expect(replay.getByRole('table')).toBeVisible();

    await expect(replay).toHaveAttribute('data-scrollable', 'true');
    const playFrom = replay.getByRole('button', { name: 'ลองเล่นใหม่จากตรงนี้' });
    await expect(playFrom).toBeInViewport({ ratio: 1 });
    await expect(replay.getByRole('button', { name: /trick ถัดไป/ })).toBeInViewport({ ratio: 1 });
    expect(await replay.evaluate((r) => getComputedStyle(r).scrollbarWidth)).toBe('none');
    // Scroll to the end: the notes come into view, the buttons stay where they are.
    const y = (await playFrom.boundingBox())!.y;
    await replay.evaluate((r) => r.scrollTo(0, r.scrollHeight));
    await expect(replay.getByTestId('replay-loss').first()).toBeInViewport({ ratio: 1 });
    // Within half a pixel: a sticky bar can land on a sub-pixel at the end of the scroll.
    expect((await playFrom.boundingBox())!.y).toBeCloseTo(y, 0);
    expect(await replay.evaluate((r) => r.scrollWidth > r.clientWidth)).toBe(false);

    // North's spades carry the "better" rings; each suit stays on one line.
    const north = replay.locator('[data-open-hand="North"]');
    await expect(north.locator('[data-mark="better"]').first()).toBeVisible();
    const tops = await north.evaluate((hand) =>
      Array.from(hand.children).map(
        (row) =>
          new Set(
            Array.from(row.querySelectorAll('[data-hand-card]')).map(
              (c) => c.getBoundingClientRect().top,
            ),
          ).size,
      ),
    );
    expect(tops.every((n) => n <= 1)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('a screen where it fits: the buttons sit right below the notes', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const replay = await openReplay(page);
    await expect(replay).toHaveAttribute('data-scrollable', 'false');
    const notes = (await replay.getByTestId('replay-notes').boundingBox())!;
    const actions = (await replay.getByTestId('replay-actions').boundingBox())!;
    expect(actions.y - (notes.y + notes.height)).toBeLessThan(24);
    // Clear of the bottom edge (not stuck there). M37 made the replay 1.3× at this size, so the
    // buttons end near 1005 px — still well above the screen's 1080.
    expect(actions.y + actions.height).toBeLessThan(1080 - 48);
  });
});

// TASKS M37: on a large screen the replay grows by the summary's steps (from 900 px tall): wider
// felt, bigger hand text and trick cards; smaller screens keep the old sizes.
test.describe('replay on a large screen', () => {
  const AUCTION_HAND = `${HAND}?d=S&a=1H-2D-2H-3D-3H-P-P-P`;

  async function openReplay(page: Page) {
    await page.goto(AUCTION_HAND);
    await claim(page, 7);
    await page.getByTestId('loss').first().click();
    const replay = page.getByTestId('replay');
    await expect(replay).toHaveAttribute('data-trick', '1');
    return replay;
  }

  const sizesOf = (replay: ReturnType<Page['getByTestId']>) =>
    replay.evaluate((r) => ({
      font: parseFloat(getComputedStyle(r.querySelector('[data-open-hand="North"]')!).fontSize),
      cardW: parseFloat(
        getComputedStyle(r.querySelector('.table-cards')!).getPropertyValue('--card-w'),
      ),
      felt: r.querySelector('.table-felt')!.getBoundingClientRect().width,
    }));

  test('1920 × 1080: 1.3 times, still fits', async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    const replay = await openReplay(page);
    const s = await sizesOf(replay);
    expect(s.font).toBeCloseTo(18.2, 0);
    expect(s.cardW).toBeCloseTo(104, 0);
    expect(s.felt).toBeGreaterThan(990);
    await expect(replay).toHaveAttribute('data-scrollable', 'false');
    await expect(replay.getByRole('button', { name: 'ลองเล่นใหม่จากตรงนี้' })).toBeInViewport({
      ratio: 1,
    });
    expect(await replay.evaluate((r) => r.scrollWidth > r.clientWidth)).toBe(false);
    expect(errors).toEqual([]);
  });

  test('iPad Pro 13 landscape: 1.2 times, still fits', async ({ page }) => {
    await page.setViewportSize({ width: 1376, height: 1032 });
    const replay = await openReplay(page);
    const s = await sizesOf(replay);
    expect(s.font).toBeCloseTo(16.8, 0);
    expect(s.cardW).toBeCloseTo(96, 0);
    await expect(replay).toHaveAttribute('data-scrollable', 'false');
  });

  test('1280 × 800 and an iPad mini keep the old sizes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    let replay = await openReplay(page);
    let s = await sizesOf(replay);
    expect(s.font).toBe(14);
    expect(s.felt).toBeLessThanOrEqual(768);
    await expect(replay).toHaveAttribute('data-scrollable', 'false');

    // 768 px wide: the table's cards grow (M37) but the replay's stay at the old 80 px cap.
    await page.setViewportSize({ width: 768, height: 1024 });
    replay = page.getByTestId('replay');
    await expect.poll(async () => (await sizesOf(replay)).cardW).toBe(80);
    s = await sizesOf(replay);
    expect(s.font).toBe(14);
  });
});
