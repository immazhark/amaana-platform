import { expect, test } from '@playwright/test';
import { settleStyles } from './helpers/settle-styles.mjs';

// AF-R024: rendered text on the public routes never computes below 12px, at
// phone and desktop widths, and the layout survives a 200% root font size
// without horizontal overflow.
const ROUTES = ['/', '/about', '/our-work', '/impact', '/stories', '/appeals', '/donate', '/contact', '/transparency'];

async function smallText(page) {
  return page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.nodeValue?.trim()) continue;
      const el = node.parentElement;
      if (!el || el.closest('[aria-hidden="true"], script, style, noscript')) continue;
      if (el.getClientRects().length === 0) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 12) out.push({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 60), size, text: node.nodeValue.trim().slice(0, 40) });
    }
    return out;
  });
}

for (const width of [390, 1280]) {
  for (const route of ROUTES) {
    test(`no visible text computes below 12px on ${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.ok()).toBeTruthy();
      await page.waitForLoadState('load');
      await settleStyles(page);
      expect(await smallText(page)).toEqual([]);
    });
  }
}

for (const route of ['/', '/appeals', '/donate', '/contact']) {
  test(`${route} has no horizontal overflow at 390px with a 200% root font size`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await page.addStyleTag({ content: 'html:root { font-size: 200% !important; }' });
    await settleStyles(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route} overflows horizontally at 200%`).toBeLessThanOrEqual(1);
  });
}
