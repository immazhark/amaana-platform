import { expect, test } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`published annual edition cards keep one visible year and aligned heights at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto('/our-work/eid-gift-kits');
    expect(response?.ok()).toBe(true);

    const index = page.getByRole('navigation', { name: 'Published programme edition index' });
    await expect(index).toBeVisible();
    const links = index.locator('ol a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const cards = await links.evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return {
        height: rect.height,
        period: node.querySelector('span')?.textContent?.trim() ?? '',
        title: node.querySelector('strong')?.textContent?.trim() ?? '',
      };
    }));

    for (const card of cards) {
      expect(card.period).toMatch(/^20\d{2}$/);
      expect(card.title.length).toBeGreaterThan(3);
      expect(card.title.startsWith(`${card.period} —`)).toBe(false);
      expect(card.title.startsWith(`${card.period} –`)).toBe(false);
      expect(card.title.startsWith(`${card.period}:`)).toBe(false);
    }

    const heights = cards.map(card => card.height);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  });
}
