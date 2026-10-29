import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// TASKS M17: the screens in English. The flag switch on the home page, then every screen of a
// hand (table, menu, claim, result, replay), settings and stats show no Thai — except the
// language names, which are always written in their own language (`lang="th"`). The guide's
// content is still Thai until M18, so its pages are not checked here.
const HAND = '/#/play/GNA8WobYT233o4lpzA/3H';
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
 * The first Thai text on the page (with a little context), or null: visible text, screen-reader
 * text and labels alike. Elements marked `lang="th"` are meant to be Thai.
 */
const thaiOnPage = (page: Page) =>
  page.evaluate(() => {
    const body = document.body.cloneNode(true) as HTMLElement;
    body.querySelectorAll('[lang="th"], script, style').forEach((e) => e.remove());
    const attrs = Array.from(body.querySelectorAll('*')).flatMap((e) =>
      ['aria-label', 'title', 'placeholder', 'alt'].map((a) => e.getAttribute(a) ?? ''),
    );
    const text = [body.textContent ?? '', ...attrs].join('\n');
    return /.{0,30}[฀-๿].{0,30}/.exec(text)?.[0] ?? null;
  });

const noThai = (page: Page) => expect.poll(() => thaiOnPage(page)).toBeNull();

const noSideScroll = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(0);

async function switchToEnglish(page: Page) {
  await page.goto('/');
  const lang = page.getByTestId('language-switch');
  // Flags, not letters (17.10): drawn as SVG, named for screen readers.
  await expect(lang.locator('svg[data-flag="th"]')).toBeVisible();
  await expect(lang.locator('svg[data-flag="en"]')).toBeVisible();
  await expect(lang).not.toContainText(/TH|EN/);
  await expect(lang.getByRole('button', { name: 'ไทย' })).toHaveAttribute('aria-pressed', 'true');
  await lang.getByRole('button', { name: 'English' }).click();
  await expect(lang.getByRole('button', { name: 'English' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
}

test('EN on the home page: a whole hand, settings and stats in English; it stays after a reload', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await switchToEnglish(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Have you played bridge before?' })).toBeVisible();
  await noThai(page);
  await noSideScroll(page);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Have you played bridge before?' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  // The table, its menu and the claim dialog.
  await page.goto(HAND);
  await expect(page.locator('[data-playable="true"]').first()).toBeVisible();
  await expect(page.getByTestId('status')).toHaveText(
    "Dummy's turn — tap one of North's cards at the top",
  );
  await noThai(page);
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('menuitem', { name: 'New deal' })).toBeVisible();
  await noThai(page);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Claim' }).click();
  const dialog = page.getByTestId('claim-dialog');
  await expect(dialog.getByRole('button', { name: 'Claim 13 tricks' })).toBeVisible();
  await noThai(page);
  await dialog.getByRole('button', { name: 'Claim 13 tricks' }).click();
  await expect(page.getByTestId('claim-rejected')).toHaveText(
    'Claim refused — the defenders can still take tricks',
  );
  await dialog.getByRole('button', { name: 'Play on' }).click();

  // A card, then claim one trick short of what best play makes: down one, with a loss line.
  await page.locator('[data-playable="true"]').first().click(CORNER);
  await expect(page.locator('[data-trick-card]')).toHaveCount(3, { timeout: 15_000 });
  await page.getByRole('button', { name: 'Claim' }).click();
  for (let i = 0; i < 5; i++) await dialog.getByRole('button', { name: 'Fewer' }).click();
  await dialog.getByRole('button', { name: 'Claim 8 tricks' }).click();
  const result = page.getByTestId('result');
  await expect(result).toContainText('3♥ down 1');
  await expect(result.getByRole('button', { name: 'New deal' })).toBeVisible();
  await expect(page.getByTestId('review')).toHaveAttribute('data-status', 'ready', {
    timeout: 30_000,
  });
  await noThai(page);
  await noSideScroll(page);
  await result.getByRole('button', { name: '▶ Replay' }).click();
  await expect(page.getByRole('heading', { name: /^Replay · trick 1\// })).toBeVisible();
  await noThai(page);

  await page.goto('/#/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'English' })).toBeChecked();
  await noThai(page);
  await noSideScroll(page);

  await page.goto('/#/stats');
  await expect(page.getByRole('heading', { name: 'Stats' })).toBeVisible();
  await noThai(page);
  expect(errors).toEqual([]);
});

test('beginner mode in English: table tips and the score explained', async ({ page }) => {
  const errors = collectErrors(page);
  await switchToEnglish(page);
  await page.goto('/#/settings');
  await page.getByRole('checkbox', { name: /Beginner mode/ }).check();
  await expect(page.getByRole('group', { name: 'Bot speed' })).toContainText('bots play slowly');
  await noThai(page);

  await page.goto(HAND);
  await expect(page.getByTestId('coach-tip')).toContainText('The contract is 3♥');
  await noThai(page);
  await page.getByTestId('coach-dismiss').click();

  await page.getByRole('button', { name: 'Claim' }).click();
  const dialog = page.getByTestId('claim-dialog');
  for (let i = 0; i < 4; i++) await dialog.getByRole('button', { name: 'Fewer' }).click();
  await dialog.getByRole('button', { name: 'Claim 9 tricks' }).click();
  await expect(page.getByTestId('score-explain')).toContainText('Partscore bonus');
  await expect(page.getByTestId('result')).toContainText('3♥ made!');
  await noThai(page);
  expect(errors).toEqual([]);
});

test('switching back to Thai', async ({ page }) => {
  await switchToEnglish(page);
  await page.getByTestId('language-switch').getByRole('button', { name: 'ไทย' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'th');
  await expect(page.getByRole('heading', { name: 'เคยเล่น bridge ไหม?' })).toBeVisible();

  // The settings page switches too, and names English in English.
  await page.goto('/#/settings');
  // The group is named in the page's language, so it is found by its new name after a pick.
  const option = (group: string, name: string) =>
    page.getByRole('group', { name: group }).locator('label', { hasText: name });
  await option('ภาษา', 'English').click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Language' }).getByRole('radio', { name: 'English' }),
  ).toBeChecked();
  await option('Language', 'ไทย').click();
  await expect(page.getByRole('heading', { name: 'ตั้งค่า' })).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'ภาษา' }).getByRole('radio', { name: 'ไทย' }),
  ).toBeChecked();
});

test.describe('phone width', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('the English table and result fit at 360 px', async ({ page }) => {
    await switchToEnglish(page);
    await noSideScroll(page);
    await page.goto(HAND);
    await expect(page.locator('[data-playable="true"]').first()).toBeVisible();
    await noSideScroll(page);
    await page.getByRole('button', { name: 'Claim' }).click();
    const dialog = page.getByTestId('claim-dialog');
    for (let i = 0; i < 4; i++) await dialog.getByRole('button', { name: 'Fewer' }).click();
    await dialog.getByRole('button', { name: 'Claim 9 tricks' }).click();
    await expect(page.getByTestId('result')).toBeVisible();
    await noSideScroll(page);
    await page.goto('/#/settings');
    await noSideScroll(page);
  });
});
