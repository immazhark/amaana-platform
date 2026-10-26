import { expect, test } from '@playwright/test';

function linear(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb) {
  const [r, g, b] = rgb.match(/\d+/g).slice(0, 3).map(Number);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

test('real appeal-card CSS retains readable metadata at mobile and desktop widths', async ({ page }) => {
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto('/appeals', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBe(true);

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const reducedMotion of ['reduce', 'no-preference']) {
      await page.emulateMedia({ reducedMotion });
      const colors = await page.evaluate(() => {
        const card = document.createElement('article');
        card.className = 'v2-appeal-card';
        card.setAttribute('aria-hidden', 'true');
        const head = document.createElement('div');
        head.className = 'v2-appeal-card-head';
        const small = document.createElement('small');
        small.textContent = 'Location withheld';
        head.append(small);
        const meta = document.createElement('div');
        meta.className = 'v2-appeal-progress-meta';
        const metaValue = document.createElement('span');
        metaValue.textContent = 'of synthetic goal';
        meta.append(metaValue);
        const foot = document.createElement('div');
        foot.className = 'v2-appeal-progress-foot';
        foot.textContent = 'Verified appeal';
        card.append(head, meta, foot);
        document.body.append(card);

        const background = getComputedStyle(card).backgroundColor;
        const labels = [small, metaValue, foot].map(element => ({
          selector: element.className || element.tagName,
          color: getComputedStyle(element).color,
        }));
        card.remove();
        return { background, labels };
      });

      expect(colors.background).toBe('rgb(255, 253, 248)');
      for (const { selector, color } of colors.labels) {
        expect(contrast(color, colors.background), `${selector} at ${width}px and ${reducedMotion}`)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
  }
});
