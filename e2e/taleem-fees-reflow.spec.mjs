import { expect, test } from '@playwright/test';

const programmeRows = [
  ["Qaida", "₹1,000"],
  ["Qur'an Nazira", "₹1,200"],
  ["Hifdh — Day Scholar", "₹1,500"],
];

for (const [slug, rows] of [
  ['taleem', programmeRows],
  ['taleem-nazira-sponsorship', [programmeRows[1]]],
  ['taleem-hifdh-sponsorship', [programmeRows[2]]],
]) {
  test(`public Taleem fees stay readable at enlarged text: ${slug}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    await page.setViewportSize({ width: 390, height: 900 });
    expect((await page.goto(`/our-work/${slug}`)).ok()).toBe(true);
    const section = page.locator('section[aria-labelledby="taleem-fees"]');
    const cards = section.locator('ul > li');
    await expect(section).toBeVisible();
    await expect(cards).toHaveCount(rows.length);
    for (const width of [320, 360, 390, 430, 576, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const scale of [1, 2]) {
        await page.evaluate(async scale => {
          const root = document.documentElement;
          root.style.removeProperty('font-size');
          root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * scale}px`;
          await document.fonts.ready;
        }, scale);
        for (const [index, row] of rows.entries()) {
          await expect(cards.nth(index).locator('span')).toHaveText([...row, 'a month for each student']);
        }
        const failures = await cards.evaluateAll(items => items.flatMap(card => {
          const bounds = card.getBoundingClientRect();
          const shell = card.closest('.v2-shell').getBoundingClientRect();
          const failures = [];
          if (bounds.left < shell.left - 1 || bounds.right > Math.min(shell.right, document.documentElement.clientWidth) + 1) failures.push('card outside shell');
          for (const label of card.querySelectorAll('span')) {
            const range = document.createRange();
            range.selectNodeContents(label);
            const rects = Array.from(range.getClientRects()).filter(rect => rect.width && rect.height);
            if (!rects.length || rects.some(rect => rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)) failures.push(label.textContent);
          }
          return failures;
        }));
        expect(failures, `${width}px / ${scale * 100}%`).toEqual([]);
      }
    }
    await expect(section.locator('p')).toContainText('not a statement of what the Madarsah itself charges');
  });
}
