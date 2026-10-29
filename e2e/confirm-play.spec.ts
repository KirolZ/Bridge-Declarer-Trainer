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

  // Esc lets go of it.
  await page.keyboard.press('Escape');
  await expect(picked(page)).toHaveCount(0);
  await expect(bar(page)).toHaveCount(0);

  // A tap anywhere else on the table lets go of it too, and plays nothing.
  await page.locator(`[data-card="${first}"]`).click(CORNER);
  await expect(bar(page)).toBeVisible();
  await page.getByRole('region', { name: 'West' }).click();
  await expect(bar(page)).toHaveCount(0);
  await expect(picked(page)).toHaveCount(0);
  await expect(onTrick(page, first)).toHaveCount(0);

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

test('a picked dummy card: its gold frame fits the card, stays above the next column, hides nothing', async ({
  page,
}) => {
  await seedSettings(page, { cardPlay: 'confirm' });
  await page.goto(HAND);
  await expect(playable(page).first()).toBeVisible({ timeout: 15_000 });
  // Dummy's top spade: more spades below it, and another column to its right.
  await playable(page).first().click(CORNER);
  await expect(picked(page)).toHaveCount(1);
  const fit = await picked(page).evaluate((el) => {
    const box = el.getBoundingClientRect();
    const column = el.closest('[data-suit]')!;
    const nextColumn = column.nextElementSibling!;
    const below = column.querySelectorAll('[data-card]')[1]!.getBoundingClientRect();
    const zOf = (e: Element) => Number(getComputedStyle(e).zIndex) || 0;
    return {
      radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
      width: box.width,
      right: box.right,
      nextLeft: nextColumn.getBoundingClientRect().left,
      above: zOf(column) > zOf(nextColumn),
      // The next card down in the column still shows its corner index.
      belowOnTop: document
        .elementFromPoint(below.left + 6, below.top + 6)
        ?.closest('[data-card]')
        ?.getAttribute('data-card'),
      belowCode: column.querySelectorAll('[data-card]')[1]!.getAttribute('data-card'),
    };
  });
  // The card face's corner is 10% of its width (SVG rx 9 + half the stroke, out of 100).
  expect(fit.radius).toBeCloseTo(fit.width * 0.1, 0);
  expect(fit.above).toBe(true);
  expect(fit.belowOnTop).toBe(fit.belowCode);
  // Slid into the gap without covering the next column's cards.
  expect(fit.right).toBeLessThanOrEqual(fit.nextLeft + 0.5);
});

test('framed cards: a frame ring under the card, no drop shadow, and a glow that pulses by opacity only', async ({
  page,
}) => {
  await seedSettings(page, { cardPlay: 'confirm' });
  await page.goto(HAND);
  await expect(playable(page).first()).toBeVisible({ timeout: 15_000 });
  await playable(page).first().click(CORNER);
  await expect(bar(page)).toBeVisible();

  // The frame lies under the card, 3px out and 2px in under its edge, so the card's edge blends into
  // gold rather than the table; the card's shadow (3px down) would darken the frame, so it goes.
  const framed = (button: string) =>
    page.locator(button).evaluate((el) => {
      const frame = el.querySelector('[data-frame]')!;
      const svg = el.querySelector('svg')!;
      const f = frame.getBoundingClientRect();
      const c = svg.getBoundingClientRect();
      const style = getComputedStyle(frame);
      return {
        out: [c.left - f.left, c.top - f.top, f.right - c.right, f.bottom - c.bottom].map(
          Math.round,
        ),
        border: style.borderTopWidth,
        colour: style.borderTopColor,
        radius: parseFloat(style.borderTopLeftRadius) - c.width * 0.1,
        cardOnTop: !!(frame.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING),
        filter: getComputedStyle(svg.parentElement!).filter,
      };
    });
  for (const button of ['[data-picked="true"]', '[data-testid="confirm-play-button"]']) {
    const f = await framed(button);
    expect(f.out).toEqual([3, 3, 3, 3]);
    expect(f.border).toBe('5px');
    expect(f.colour).toBe('rgb(252, 211, 77)');
    expect(f.radius).toBeCloseTo(3, 0);
    expect(f.cardOnTop).toBe(true);
    expect(f.filter).toBe('none');
  }
  // The waiting card is faded by a veil, not by opacity: a see-through card shows the frame under its edge.
  const opaque = await page.getByTestId('confirm-play-button').evaluate((el) => {
    let node: Element | null = el.querySelector('svg');
    for (; node && node !== el; node = node.parentElement) {
      if (Number(getComputedStyle(node).opacity) < 1) return false;
    }
    return !!el.querySelector('[data-veil]');
  });
  expect(opaque).toBe(true);
  // Cards without a frame keep their shadow.
  const plain = await page
    .locator('[data-card]:not([data-picked])')
    .first()
    .evaluate((el) => getComputedStyle(el.querySelector('svg')!.parentElement!).filter);
  expect(plain).not.toBe('none');

  // The waiting card: the frame stays put while only the glow layer's opacity moves.
  const sample = () =>
    page.getByTestId('confirm-play-button').evaluate((el) => {
      const glow = el.querySelector('[data-glow]')!;
      const frame = el.querySelector('[data-frame]')!;
      return {
        frame: getComputedStyle(frame).border,
        glowShadow: getComputedStyle(glow).boxShadow,
        glowOpacity: Number(getComputedStyle(glow).opacity),
      };
    });
  const a = await sample();
  await page.waitForTimeout(450);
  const b = await sample();
  expect(b.frame).toBe(a.frame);
  expect(b.glowShadow).toBe(a.glowShadow);
  expect(b.glowOpacity).not.toBe(a.glowOpacity);
});
