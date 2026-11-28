import { expect, test } from '@playwright/test';

// Existing isolated acceptance fixture; no checkout, provider, or real donor record.
const GIVE = '/browser-acceptance/give';

for (const widths of [[320, 360, 390, 430], [576, 768, 1024, 1440]]) {
  test(`fund names, policy and selection reflow with enlarged text at ${widths.join(', ')}px`, async ({ page }) => {
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: widths[0], height: 900 });
    expect((await page.goto(GIVE)).ok()).toBe(true);
    const cards = page.locator('label:has(input[name="fund"])');
    const radios = page.locator('input[name="fund"]');
    await expect(cards).toHaveCount(10);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(async () => {
        const root = document.documentElement;
        root.style.removeProperty('font-size');
        root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * 2}px`;
        await document.fonts.ready;
      });
      const target = page.locator('input[name="fund"][value="foundation-operations"]');
      await target.check({ force: true });
      await target.focus();
      await expect(target).toBeFocused();
      await expect(page.locator('input[name="fund"]:checked')).toHaveCount(1);
      await expect(page.getByRole('status').filter({ hasText: 'Selected fund: Foundation Operations Fund.' })).toHaveCount(1);
      const failures = await cards.evaluateAll(items => {
        const failures = [];
        const rects = element => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
        };
        for (const card of items) {
          const bounds = card.getBoundingClientRect();
          const name = card.querySelector('strong');
          const policy = card.querySelector('[id^="fund-tag-"]');
          const check = card.querySelector('span[aria-hidden="true"]:last-child');
          if (!name || !policy || !check) { failures.push('Missing card content'); continue; }
          if (bounds.left < -1 || bounds.right > document.documentElement.clientWidth + 1) failures.push(`${name.textContent}: card outside viewport`);
          if (bounds.height < 44) failures.push(`${name.textContent}: target too small`);
          const checkBounds = check.getBoundingClientRect();
          if (!checkBounds.width || !checkBounds.height) failures.push(`${name.textContent}: no visible selection indicator`);
          const content = [name, policy];
          if (card.dataset.selected === 'true') {
            const summary = card.querySelector('strong + span');
            if (!summary) failures.push(`${name.textContent}: missing selected description`);
            else content.push(summary);
          }
          for (const element of content) {
            const textRects = rects(element);
            if (!textRects.length || textRects.some(r => r.left < bounds.left - 1 || r.right > bounds.right + 1 || r.top < bounds.top - 1 || r.bottom > bounds.bottom + 1)) failures.push(`${element.textContent}: text outside card`);
            if (textRects.some(r => r.right > checkBounds.left && r.left < checkBounds.right && r.bottom > checkBounds.top && r.top < checkBounds.bottom)) failures.push(`${element.textContent}: selection indicator overlap`);
            // A font's line-box metrics can extend beyond its client height without clipping.
            // Keep horizontal overflow detection, and check vertical overflow where paint is clipped.
            if (element.scrollWidth > element.clientWidth + 1) failures.push(`${element.textContent}: horizontal text overflow`);
            for (let ancestor = element; ancestor && ancestor !== card; ancestor = ancestor.parentElement) {
              const style = getComputedStyle(ancestor);
              const clipX = style.overflowX !== 'visible';
              const clipY = style.overflowY !== 'visible';
              if (!clipX && !clipY) continue;
              const box = ancestor.getBoundingClientRect();
              const left = box.left + ancestor.clientLeft;
              const top = box.top + ancestor.clientTop;
              if (textRects.some(r => (clipX && (r.left < left - 1 || r.right > left + ancestor.clientWidth + 1)) ||
                (clipY && (r.top < top - 1 || r.bottom > top + ancestor.clientHeight + 1)))) {
                failures.push(`${element.textContent}: clipped text`);
                break;
              }
            }
          }
        }
        return failures;
      });
      expect(failures, `enlarged text at ${width}px`).toEqual([]);
      await page.keyboard.press('ArrowUp');
      await expect(radios).toHaveCount(10);
      await expect(page.locator('input[name="fund"]:checked')).toHaveAttribute('value', 'madarsa-operations');
      await expect(page.getByRole('status').filter({ hasText: 'Selected fund: Madarsa Operations Fund.' })).toHaveCount(1);
    }
  });
}
