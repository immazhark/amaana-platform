import { expect, test } from '@playwright/test';

const amounts = ['₹1,26,000', '₹10,00,000.5', '₹99,99,99,999.99'];
for (const widths of [[320, 360, 390, 430], [576, 768, 1024, 1440]]) {
  test(`exact hero amounts and labels fit at ${widths.join(', ')}px`, async ({ page }) => {
    let financialRequests = 0;
    await page.route('**/api/donations/**', route => { financialRequests++; return route.abort('failed'); });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: widths[0], height: 900 });
    expect((await page.goto('/browser-acceptance/hero-amount')).ok()).toBe(true);
    const rows = page.locator('.page-hero__stat-row');
    await expect(rows).toHaveCount(amounts.length);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const scale of [1, 2]) {
        await page.evaluate(async scale => {
          const root = document.documentElement;
          root.style.removeProperty('font-size');
          root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * scale}px`;
          await document.fonts.ready;
        }, scale);
        const geometry = await rows.evaluateAll(items => items.map(row => {
          const bounds = row.getBoundingClientRect();
          const panel = row.closest('.page-hero__visual').getBoundingClientRect();
          const rects = element => {
            const range = document.createRange();
            range.selectNodeContents(element);
            return Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
          };
          const value = row.querySelector('b');
          const label = row.querySelector('small');
          const digits = rects(value);
          const labels = rects(label);
          const fits = rect => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 && rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1 && rect.left >= panel.left - 1 && rect.right <= panel.right + 1;
          return {
            amount: value.textContent,
            whiteSpace: getComputedStyle(value).whiteSpace,
            overflowWrap: getComputedStyle(value).overflowWrap,
            numeric: getComputedStyle(value).fontVariantNumeric,
            label: label.textContent,
            breaks: value.querySelectorAll('wbr').length,
            fits: digits.length > 0 && labels.length > 0 && digits.every(fits) && labels.every(fits) && !digits.some(digit => labels.some(text => digit.left < text.right && digit.right > text.left && digit.top < text.bottom && digit.bottom > text.top)),
          };
        }));
        expect(geometry, `${width}px / ${scale * 100}%`).toEqual(amounts.map(amount => ({ amount, label: 'remaining verified need · domestic INR only', breaks: amount.split(',').length - 1, whiteSpace: 'normal', overflowWrap: 'anywhere', numeric: 'tabular-nums', fits: true })));
      }
    }
    expect(financialRequests).toBe(0);
  });
}
