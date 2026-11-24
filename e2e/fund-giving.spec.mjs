import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Synthetic fixtures only (/browser-acceptance/give and /browser-acceptance/funds-ledger). No payment or donation is created.
const GIVE = '/browser-acceptance/give';
const LEDGER = '/browser-acceptance/funds-ledger';

async function prepare(page) {
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  // A harmless stand-in so the checkout form reaches its ready state without contacting Razorpay.
  await page.route('https://checkout.razorpay.com/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.Razorpay = function () { this.open = function () {}; };' }));
}

const radio = (page, slug) => page.locator(`input[name="fund"][value="${slug}"]`);
const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

for (const width of [320, 390, 768, 1280]) {
  test(`fund selector fits without horizontal scroll and has one h1 at ${width}px`, async ({ page }) => {
    await prepare(page);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await page.goto(GIVE)).ok()).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('group', { name: /Choose where your gift goes/ })).toBeVisible();
    await expect(page.locator('input[name="fund"]')).toHaveCount(10);
    expect(await noHorizontalScroll(page)).toBe(true);
    // Each card's visible name must not be clipped by the selection check at any width.
    const clipped = await page.locator('label:has(input[name="fund"])').evaluateAll(cards => cards.filter(card => {
      const name = card.querySelector('strong');
      const check = card.querySelector('span[aria-hidden="true"]:last-child');
      if (!name || !check) return false;
      const a = name.getBoundingClientRect();
      const b = check.getBoundingClientRect();
      return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
    }).length);
    expect(clipped).toBe(0);
  });
}

test('General Fund is selected by default and announced', async ({ page }) => {
  await prepare(page);
  await page.goto(GIVE);
  await expect(radio(page, 'general')).toBeChecked();
  await expect(page.getByRole('status').filter({ hasText: 'Selected fund: General Fund.' })).toHaveCount(1);
});

test('keyboard arrows move the selection and update the announcement', async ({ page }) => {
  await prepare(page);
  await page.goto(GIVE);
  await radio(page, 'general').focus();
  await page.keyboard.press('ArrowDown');
  await expect(radio(page, 'taleem')).toBeChecked();
  await expect(radio(page, 'taleem')).toBeFocused();
  await expect(page.getByRole('status').filter({ hasText: 'Selected fund: Taleem Fund.' })).toHaveCount(1);
});

test('a fund that refuses Zakat says so prominently and never offers a Zakat choice', async ({ page }) => {
  await prepare(page);
  await page.goto(GIVE);
  await radio(page, 'eid-kits').check({ force: true });
  await expect(page.getByText('Please note:')).toBeVisible();
  await expect(page.getByText(/Zakat is not accepted for this fund/)).toBeVisible();
  await page.getByRole('button', { name: 'Give to Eid Kits Fund' }).click();
  await expect(page.getByRole('group', { name: 'Choose donation method' })).toBeVisible();
  await expect(page.locator('input[name="givingIntent"][value="GENERAL"]')).toHaveCount(1);
  await expect(page.locator('input[name="givingIntent"][value="SADAQAH"]')).toHaveCount(1);
  await expect(page.locator('input[name="givingIntent"][value="ZAKAT"]')).toHaveCount(0);
});

test('a Zakat-accepting fund offers Zakat, and the General Fund takes a custom request', async ({ page }) => {
  await prepare(page);
  await page.goto(GIVE);
  await radio(page, 'orphan').check({ force: true });
  await page.getByRole('button', { name: 'Give to Orphan Fund' }).click();
  await expect(page.locator('input[name="givingIntent"][value="ZAKAT"]')).toHaveCount(1);
  await expect(page.locator('#donorDirective')).toHaveCount(0);
  await radio(page, 'general').check({ force: true });
  await page.getByRole('button', { name: 'Give to General Fund' }).click();
  await expect(page.locator('#donorDirective')).toBeVisible();
  await expect(page.locator('#donorDirective')).toHaveAttribute('maxlength', '500');
});

test('the optional fee cover previews the exact charge and leaves the donation unchanged', async ({ page }) => {
  await prepare(page);
  await page.goto(GIVE);
  await page.getByRole('button', { name: 'Give to General Fund' }).click();
  const fee = page.locator('input[name="coverProcessingFee"]');
  await expect(fee).not.toBeChecked();
  await page.locator('#amount').fill('5000');
  await fee.check();
  await expect(page.getByText('₹5,000 donation + ₹120.86 fee = ₹5,120.86 charged.')).toBeVisible();
  await fee.uncheck();
  await expect(page.getByText(/charged\./)).toHaveCount(0);
});

test('motion is removed for visitors who prefer reduced motion', async ({ page }) => {
  await prepare(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(GIVE);
  const names = await page.locator('label:has(input[name="fund"])').evaluateAll(cards => cards.map(card => getComputedStyle(card).animationName));
  expect(new Set(names)).toEqual(new Set(['none']));
});

for (const width of [390, 1280]) {
  test(`fund giving page has no accessibility violations at ${width}px in every state`, async ({ page }) => {
    await prepare(page);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(GIVE);
    const scan = async label => {
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(audit.violations.map(v => ({ state: label, id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    };
    await scan('initial');
    await radio(page, 'eid-kits').check({ force: true });
    await scan('non-Zakat fund selected');
    await page.getByRole('button', { name: 'Give to Eid Kits Fund' }).click();
    await expect(page.getByRole('group', { name: 'Choose donation method' })).toBeVisible();
    await scan('payment form open');
  });
}

for (const width of [390, 1280]) {
  test(`public funds ledger is accessible and fits at ${width}px`, async ({ page }) => {
    await prepare(page);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await page.goto(LEDGER)).ok()).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 2, name: 'Financial year 2026-27' })).toBeVisible();
    await expect(page.getByText('₹1,85,000').first()).toBeVisible();
    // A fund with no gifts, spending or held balance is one compact line; the funds with activity keep their full cards.
    await expect(page.getByText('No gifts or published spending in 2026-27 yet.').first()).toBeVisible();
    await expect(page.getByText('Paid from Zakat funds')).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  });
}

test('ledger year switch marks the current year and extra entries sit in a native disclosure', async ({ page }) => {
  await prepare(page);
  await page.goto(LEDGER);
  await expect(page.getByRole('navigation', { name: 'Financial year' }).getByRole('link', { name: '2026-27' })).toHaveAttribute('aria-current', 'page');
  const more = page.locator('details summary', { hasText: 'Show 2 more entries' });
  await expect(more).toBeVisible();
  await more.click();
  await expect(page.getByText('Synthetic spending entry 5')).toBeVisible();
});

test('the give hero leads to the fund choice instead of generic navigation', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await page.goto(GIVE)).ok()).toBe(true);
  const hero = page.locator('.page-hero__actions');
  await expect(hero.getByRole('link', { name: 'Explore Our Work' })).toHaveCount(0);
  const choose = hero.getByRole('link', { name: 'Choose a fund' });
  await expect(choose).toHaveAttribute('href', '#choose-fund');
  await choose.click();
  await expect(page.locator('#choose-fund')).toBeInViewport();
});

// Phones: ten full cards used to stack to about 1,700px. Compact rows must stay scannable without hiding what a fund is for
// or whether it accepts Zakat.
for (const width of [360, 390]) {
  test('the phone fund list is compact, keeps every Zakat label, and only clamps funds that are not selected at ' + width + 'px', async ({ page }) => {
    await prepare(page);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await page.goto(GIVE)).ok()).toBe(true);
    await expect(page.locator('input[name="fund"]')).toHaveCount(10);
    const measure = () => page.locator('label:has(input[name="fund"])').evaluateAll(cards => cards.map(card => {
      const box = card.getBoundingClientRect();
      const tag = card.querySelector('[id^="fund-tag-"]');
      const summary = card.querySelector('strong + span');
      const tagBox = tag?.getBoundingClientRect();
      return {
        selected: card.getAttribute('data-selected') === 'true',
        top: box.top + window.scrollY, bottom: box.bottom + window.scrollY, height: box.height,
        tagText: tag?.textContent?.trim() ?? '',
        tagInside: Boolean(tagBox && tagBox.width > 0 && tagBox.left >= box.left - 1 && tagBox.right <= box.right + 1 && tagBox.bottom <= box.bottom + 1),
        summaryClamped: Boolean(summary) && summary.scrollHeight > summary.clientHeight + 1,
        summaryLines: summary ? Math.round(summary.clientHeight / parseFloat(getComputedStyle(summary).lineHeight)) : 0,
      };
    }));
    const before = await measure();
    expect(before).toHaveLength(10);
    const listHeight = Math.max(...before.map(card => card.bottom)) - Math.min(...before.map(card => card.top));
    expect(listHeight, 'ten funds should not need more than about 1,400px on a phone').toBeLessThan(1400);
    for (const card of before) {
      expect(card.height, 'each card stays a comfortable tap target').toBeGreaterThanOrEqual(44);
      expect(card.tagText.length, 'every card keeps its Zakat label').toBeGreaterThan(0);
      expect(card.tagInside, 'the Zakat label is fully inside its card: ' + card.tagText).toBe(true);
      if (card.selected) expect(card.summaryClamped, 'the selected fund shows its full purpose').toBe(false);
      else expect(card.summaryLines, 'other funds show one line of purpose').toBeLessThanOrEqual(1);
    }
    expect(await noHorizontalScroll(page)).toBe(true);

    // Selecting another fund moves the full purpose to it, and the panel carries the full purpose and Zakat state.
    const target = page.locator('label:has(input[name="fund"]:not(:checked))').nth(2);
    const targetName = (await target.locator('strong').textContent())?.trim() ?? '';
    await target.click();
    const after = await measure();
    expect(after.filter(card => card.selected)).toHaveLength(1);
    expect(after.find(card => card.selected).summaryClamped).toBe(false);
    await expect(page.getByRole('status').filter({ hasText: 'Selected fund: ' + targetName })).toHaveCount(1);
    await expect(page.locator('p', { hasText: targetName }).first()).toBeVisible();
  });
}
