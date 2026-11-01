import { expect, test } from '@playwright/test';

function linear(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function parseRgb(color) {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) return {
    rgb: [0, 2, 4].map(index => Number.parseInt(hex[1].slice(index, index + 2), 16)),
    alpha: 1,
  };
  const match = /^rgba?\((\d+), (\d+), (\d+)(?:, (\d*\.?\d+))?\)$/.exec(color);
  if (!match) throw new Error(`Unsupported computed color: ${color}`);
  const rgb = match.slice(1, 4).map(Number);
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  if (rgb.some(channel => channel < 0 || channel > 255) || alpha < 0 || alpha > 1) {
    throw new Error(`Invalid computed color: ${color}`);
  }
  return { rgb, alpha };
}

function compositeOver(color, backdrop) {
  const foreground = parseRgb(color);
  const background = parseRgb(backdrop);
  if (background.alpha !== 1) throw new Error('The tested canvas must have an opaque background');
  return foreground.rgb.map((channel, index) =>
    Math.round(channel * foreground.alpha + background.rgb[index] * (1 - foreground.alpha)));
}

function luminance([r, g, b]) {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(foreground, background) {
  const text = parseRgb(foreground);
  if (text.alpha !== 1) throw new Error('Translucent text needs a separate foreground compositing audit');
  const [light, dark] = [luminance(text.rgb), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

function testedSurfaces({ background, backgroundImage, canvas, palette }) {
  // The real Appeals section uses canvas/cream and a 6% blue radial tint.
  // Audit these conservative underlying samples even when the card renders
  // its own gradient, so a later surface-cascade change remains covered.
  const tintedMuted = compositeOver('rgba(70, 111, 170, 0.06)', palette.muted);
  const underlays = [canvas, palette.canvas, palette.muted, `rgb(${tintedMuted.join(', ')})`];
  const surfaces = underlays.map(color => compositeOver(background, color));
  if (backgroundImage === 'none') return surfaces;
  // The Appeals design uses an opaque, two-stop cream gradient. Both endpoint
  // colors are more conservative than any interpolated point in this gradient.
  const match = /^linear-gradient\(150deg, (rgb\(\d+, \d+, \d+\)), (rgb\(\d+, \d+, \d+\)) 145%\)$/
    .exec(backgroundImage);
  if (!match) throw new Error(`Unaudited card background image: ${backgroundImage}`);
  surfaces.push(parseRgb(match[1]).rgb, parseRgb(match[2]).rgb);
  return surfaces;
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

        const cardStyle = getComputedStyle(card);
        const background = cardStyle.backgroundColor;
        const backgroundImage = cardStyle.backgroundImage;
        const canvas = getComputedStyle(document.body).backgroundColor;
        const tokens = getComputedStyle(document.documentElement);
        const palette = {
          canvas: tokens.getPropertyValue('--af-color-canvas').trim(),
          muted: tokens.getPropertyValue('--af-color-surface-muted').trim(),
        };
        const labels = [small, metaValue, foot].map(element => ({
          selector: element.className || element.tagName,
          color: getComputedStyle(element).color,
        }));
        card.remove();
        return { background, backgroundImage, canvas, palette, labels };
      });

      const surfaces = testedSurfaces(colors);
      for (const { selector, color } of colors.labels) {
        for (const surface of surfaces) {
          expect(contrast(color, surface), `${selector} at ${width}px and ${reducedMotion} on ${surface.join(',')}`)
            .toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  }
});
