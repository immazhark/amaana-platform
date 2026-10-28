import { expect, test } from '@playwright/test';

test('mobile header links remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:3000',
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });

  try {
    const page = await context.newPage();
    const response = await page.goto('/terms', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBe(true);

    const fallback = page.locator('header.site-header > noscript > details.mobile-nav-noscript');
    const summary = fallback.locator('summary');
    await expect(summary).toBeVisible();
    await expect(page.locator('button[aria-controls="mobile-navigation"]')).toBeHidden();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(fallback).toHaveAttribute('open', '');

    const work = fallback.getByRole('link', { name: 'Our Work' });
    const contact = fallback.getByRole('link', { name: 'Contact', exact: true });
    await expect(work).toBeVisible();
    await expect(contact).toBeVisible();
    expect(await work.evaluate(link => link.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);

    await contact.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/contact$/);

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('header.site-header > noscript > details.mobile-nav-noscript')).toBeHidden();
    await expect(page.locator('.site-header .nav-links a').first()).toBeVisible();
  } finally {
    await context.close();
  }
});
