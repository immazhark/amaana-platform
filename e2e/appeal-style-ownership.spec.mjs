import { expect, test } from '@playwright/test';

for (const width of [320, 390, 1440]) {
  test(`route-owned appeal styles retain cards and detail progress at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    const response = await page.goto('/browser-acceptance/appeals');
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Appeal stylesheet acceptance' })).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveCount(2);
    const cards = page.locator('.v2-appeal-card');
    await expect(cards).toHaveCount(2);
    await expect(cards.first()).toHaveCSS('display', 'flex');
    // Shared accessibility authority uses 0.01ms to finish transition events.
    const durations = await cards.first().evaluate(el => getComputedStyle(el).transitionDuration.split(',').map(value => Number.parseFloat(value)));
    expect(durations.every(value => value <= 0.00001)).toBe(true);
    await expect(cards.first().locator('.v2-appeal-card-body')).toHaveCSS('display', 'flex');
    for (const heading of [
      cards.first().getByRole('heading', { name: 'Synthetic appeal for style acceptance' }),
      page.getByRole('heading', { name: 'No synthetic public appeal currently open' }),
      page.getByRole('heading', { name: 'A synthetic verified need described across multiple lines' }),
    ]) {
      const leading = await heading.evaluate(el => {
        const style = getComputedStyle(el);
        return Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize);
      });
      expect(leading).toBeGreaterThanOrEqual(1.1);
    }
    for (const bar of await page.locator('.v2-appeal-progress').all()) {
      await expect(bar).toHaveCSS('overflow', 'hidden');
      const dimensions = await bar.evaluate(el => ({ bar: el.getBoundingClientRect().width, fill: el.firstElementChild.getBoundingClientRect().width, height: el.getBoundingClientRect().height }));
      expect(dimensions.height).toBeGreaterThan(0);
      expect(dimensions.fill / dimensions.bar).toBeCloseTo(0.2, 2);
    }
    // Real detail strip uses three nested divs, not direct small/strong/p children.
    // Check that its funding hierarchy is styled and large INR values fit on mobile.
    const funding = page.locator('.v2-appeal-funding-strip .v2-appeal-donation-panel');
    const amount = funding.locator(':scope > div:first-child > strong');
    await expect(amount).toHaveText('₹1,00,00,000');
    const fundingGeometry = await funding.evaluate(panel => {
      const amount = panel.querySelector(':scope > div:first-child > strong');
      const label = panel.querySelector(':scope > div:first-child > small');
      const description = panel.querySelector(':scope > div:first-child > p');
      const style = getComputedStyle(amount);
      return {
        columns: getComputedStyle(panel).gridTemplateColumns.split(' ').filter(Boolean).length,
        fontSize: Number.parseFloat(style.fontSize),
        leading: Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize),
        ink: style.color,
        labelInk: getComputedStyle(label).color,
        descriptionInk: getComputedStyle(description).color,
        amountWidth: amount.getBoundingClientRect().width,
        panelWidth: panel.getBoundingClientRect().width,
        clipped: amount.scrollWidth > amount.clientWidth + 1,
      };
    });
    expect(fundingGeometry.columns).toBe(width <= 620 ? 1 : 3);
    expect(fundingGeometry.fontSize).toBeGreaterThanOrEqual(28);
    expect(fundingGeometry.leading).toBeGreaterThanOrEqual(1.1);
    expect(fundingGeometry.ink).toBe('rgb(18, 34, 57)');
    expect(fundingGeometry.labelInk).toBe('rgb(96, 68, 7)');
    expect(fundingGeometry.descriptionInk).toBe('rgb(67, 80, 99)');
    expect(fundingGeometry.amountWidth).toBeGreaterThan(0);
    expect(fundingGeometry.panelWidth).toBeGreaterThan(0);
    expect(fundingGeometry.clipped).toBe(false);

    const link = cards.first().getByRole('link');
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS('outline-style', 'solid');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
