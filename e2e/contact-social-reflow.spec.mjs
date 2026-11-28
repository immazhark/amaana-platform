import { expect, test } from '@playwright/test';

const channels = [
  ['Instagram', '@amaanafoundation', 'https://www.instagram.com/amaanafoundation/'],
  ['Facebook', 'amaanafoundation24', 'https://www.facebook.com/amaanafoundation24/'],
  ['YouTube', '@amaanafoundation', 'https://www.youtube.com/@amaanafoundation'],
  ['Threads', '@amaanafoundation', 'https://www.threads.com/@amaanafoundation'],
  ['LinkedIn', 'amaanafoundation', 'https://www.linkedin.com/company/amaanafoundation'],
];

test('official social cards reflow without clipping or obscuring text and icons', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  await page.setViewportSize({ width: 390, height: 900 });
  expect((await page.goto('/contact')).ok()).toBe(true);
  const cards = page.locator('.v2-contact-social-links > a');
  await expect(cards).toHaveCount(channels.length);
  for (const [index, [name, handle, url]] of channels.entries()) {
    const card = cards.nth(index);
    await expect(card).toHaveAttribute('href', url);
    await expect(card).toHaveAttribute('target', '_blank');
    await expect(card).toHaveAttribute('rel', /noreferrer/);
    await expect(card).toHaveAccessibleName(`${name} ${handle} — opens Amaana Foundation in a new tab`);
    await expect(card.locator('strong')).toHaveText(handle);
    await expect(card.locator('svg')).toHaveCount(1);
  }
  for (const width of [320, 360, 390, 430, 576, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const scale of [1, 2]) {
      await page.evaluate(async scale => {
        const root = document.documentElement;
        root.style.removeProperty('font-size');
        root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * scale}px`;
        await document.fonts.ready;
      }, scale);
      const failures = await cards.evaluateAll(items => items.flatMap(card => {
        const bounds = card.getBoundingClientRect();
        const shell = card.closest('.v2-shell').getBoundingClientRect();
        const failures = [];
        const icon = card.children[0];
        const copy = card.children[1];
        const arrow = card.children[2];
        if (bounds.left < shell.left - 1 || bounds.right > Math.min(shell.right, document.documentElement.clientWidth) + 1) failures.push('card outside shell');
        if (bounds.height < 44) failures.push('small target');
        const boxes = [icon, copy, arrow].map(node => node.getBoundingClientRect());
        for (const box of boxes) {
          if (!box.width || !box.height || box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1) failures.push('child outside card');
        }
        for (const label of [...copy.children, arrow]) {
          const range = document.createRange();
          range.selectNodeContents(label);
          const rects = Array.from(range.getClientRects()).filter(rect => rect.width && rect.height);
          if (!rects.length || rects.some(rect => rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)) failures.push(label.textContent);
        }
        const overlap = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
        if (overlap(boxes[0], boxes[1]) || overlap(boxes[0], boxes[2]) || overlap(boxes[1], boxes[2])) failures.push('overlap');
        return failures;
      }));
      expect(failures, `${width}px / ${scale * 100}%`).toEqual([]);
    }
  }
});
