import { expect, test } from '@playwright/test';

// Isolated acceptance route. Navigation must not open payment or send a financial request.
for (const width of [320, 390, 768, 1440]) {
  test(`native selected-fund review shortcut preserves selection and focus at ${width}px`, async ({ page }) => {
    let requests = 0;
    await page.route('**/api/donations/**', route => { requests++; return route.abort('failed'); });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 900 });
    expect((await page.goto('/browser-acceptance/give')).ok()).toBe(true);
    const shortcut = page.getByRole('link', { name: 'Review selected fund', exact: true });
    const target = page.locator('#fund-review');
    await expect(shortcut).toHaveAttribute('href', '#fund-review');
    await expect(target).toHaveCount(1);
    const size = await shortcut.boundingBox();
    expect(size?.height).toBeGreaterThanOrEqual(44);
    await expect(target).toHaveText('General Fund');
    await shortcut.focus();
    await page.keyboard.press('Enter');
    await expect(target).toBeFocused();
    await expect(target).toBeInViewport();
    await expect(page.locator('#fund-payment')).toBeEmpty();
    const general = page.locator('input[name="fund"][value="general"]');
    const taleem = page.locator('input[name="fund"][value="taleem"]');
    await general.focus();
    await page.keyboard.press('ArrowDown');
    await expect(taleem).toBeChecked();
    await expect(taleem).toBeFocused();
    await expect(target).toHaveText('Taleem Fund');
    await page.keyboard.press('Shift+Tab');
    await expect(shortcut).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(target).toBeFocused();
    await expect(target).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Give to Taleem Fund', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#fund-payment')).toBeEmpty();
    expect(requests).toBe(0);
  });
}
