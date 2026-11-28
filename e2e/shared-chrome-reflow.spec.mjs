import { expect, test } from '@playwright/test';

for (const populated of [false, true]) {
  test(`shared chrome remains readable with ${populated ? 'a live item' : 'fallback content'} at enlarged text`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.setFixedTime(new Date('2026-10-12T05:00:00Z'));
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    await page.route('**/api/public/live-rail', route => route.fulfill({ json: { items: populated ? [{ id: 'chrome-fixture', kind: 'appeal', eyebrow: 'Live appeal', title: 'Verified medical support', detailsHref: '/appeals', supportHref: '/donate', detailsCta: 'View', supportCta: 'Donate' }] : [] } }));
    await page.setViewportSize({ width: 390, height: 900 });
    expect((await page.goto('/about')).ok()).toBe(true);
    await expect(page.locator('.amaana-reminder-source')).toBeVisible();
    await expect(page.locator('.amaana-live-content strong')).toHaveText(populated ? 'Verified medical support' : "Explore Amaana's public work.");
    await expect(page.locator('.amaana-live-actions a')).toHaveCount(populated ? 2 : 1);
    await expect(page.locator('.footer-brand-lockup')).toHaveAttribute('href', '/');
    for (const width of [320, 360, 390, 430, 576, 768, 900, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const scale of [1, 2]) {
        await page.evaluate(async scale => {
          const root = document.documentElement;
          root.style.removeProperty('font-size');
          root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * scale}px`;
          await document.fonts.ready;
        }, scale);
        const failures = await page.evaluate(() => {
          const failures = [];
          for (const [selector, scope] of [['.amaana-reminder-source', '.amaana-reminders'], ['.amaana-live-actions a', '.amaana-reminders'], ['.footer-brand-lockup', '.site-footer'], ['.footer-brand-copy strong,.footer-brand-copy small', '.site-footer']]) {
            for (const element of document.querySelectorAll(selector)) {
              const bounds = element.getBoundingClientRect();
              const container = element.closest(scope).getBoundingClientRect();
              const fits = rect => rect.left >= container.left - 1 && rect.right <= container.right + 1;
              if (!bounds.width || !bounds.height || !fits(bounds)) failures.push(`${selector}: outside containing surface`);
              const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
              for (let text = walker.nextNode(); text; text = walker.nextNode()) {
                if (!text.textContent.trim() || text.parentElement.closest('.sr-only')) continue;
                const range = document.createRange();
                range.selectNodeContents(text);
                const rects = Array.from(range.getClientRects()).filter(rect => rect.width && rect.height);
                if (!rects.length || rects.some(rect => !fits(rect))) failures.push(`${text.textContent}: clipped`);
              }
            }
          }
          const mark = document.querySelector('.footer-brand-mark').getBoundingClientRect();
          const copy = document.querySelector('.footer-brand-copy').getBoundingClientRect();
          if (mark.left < copy.right && mark.right > copy.left && mark.top < copy.bottom && mark.bottom > copy.top) failures.push('footer mark overlaps wordmark');
          return failures;
        });
        expect(failures, `${width}px / ${scale * 100}% text`).toEqual([]);
        if (width === 390 && scale === 1) {
          expect(await page.locator('.amaana-reminders').evaluate(node => node.getBoundingClientRect().height)).toBeLessThanOrEqual(110);
        }
        for (const link of await page.locator('.amaana-reminder-source, .amaana-live-actions a, .footer-brand-lockup').all()) {
          await link.focus();
          await expect(link).toBeFocused();
        }
      }
    }
  });
}
