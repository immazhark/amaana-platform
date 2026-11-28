import { expect, test } from '@playwright/test';

// Synthetic browser acceptance only: no assistance request may be submitted.
for (const widths of [[320, 360, 390, 430], [576, 768, 1024, 1440]]) {
  test(`assistance progress labels stay legible at ${widths.join(', ')}px`, async ({ page }) => {
    let submissions = 0;
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    await page.route('**/api/assistance', route => { submissions++; return route.abort('failed'); });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: widths[0], height: 900 });
    expect((await page.goto('/request-assistance')).ok()).toBe(true);
    const progress = page.getByRole('navigation', { name: 'Assistance request progress' });
    const buttons = progress.getByRole('button');
    await expect(buttons).toHaveCount(4);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const scale of [1, 2]) {
        await page.evaluate(async scale => {
          const root = document.documentElement;
          root.style.removeProperty('font-size');
          root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * scale}px`;
          await document.fonts.ready;
        }, scale);
        const failures = await buttons.evaluateAll(controls => controls.flatMap(button => {
          const label = Array.from(button.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
          const number = button.querySelector('span');
          if (!label || !number) return ['missing step label or number'];
          const range = document.createRange();
          range.selectNode(label);
          const rects = Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
          const bounds = button.getBoundingClientRect();
          const numberBounds = number.getBoundingClientRect();
          const outside = rects.some(rect => rect.left < numberBounds.right - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1);
          return rects.length !== 1 || outside || bounds.height < 44 || bounds.left < -1 || bounds.right > document.documentElement.clientWidth + 1 ? [button.textContent] : [];
        }));
        expect(failures, `step labels at ${width}px and ${scale * 100}% text`).toEqual([]);
        await expect(buttons.nth(0)).toHaveAttribute('aria-current', 'step');
        await expect(buttons.nth(0)).toBeEnabled();
        for (const index of [1, 2, 3]) await expect(buttons.nth(index)).toBeDisabled();
        await buttons.nth(0).focus();
        await expect(buttons.nth(0)).toBeFocused();
      }
    }
    expect(submissions).toBe(0);
  });
}
