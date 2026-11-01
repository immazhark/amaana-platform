import { expect, test } from '@playwright/test';

test('shared fallback visuals retain their layout without an important height override', async ({ page }) => {
  test.setTimeout(120_000);
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));

  for (const reducedMotion of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion });

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });

      for (const path of ['/partner', '/contact', '/recognition']) {
        const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
        expect(response?.ok(), `${path} must render`).toBe(true);

        const result = await page.locator('.page-hero__visual > .page-hero__visual-fallback').evaluate(async fallback => {
          await document.fonts.ready;
          const visual = fallback.parentElement;
          const snapshot = () => {
            const visualBox = visual.getBoundingClientRect();
            const fallbackBox = fallback.getBoundingClientRect();
            return {
              visualWidth: visualBox.width,
              visualHeight: visualBox.height,
              fallbackWidth: fallbackBox.width,
              fallbackHeight: fallbackBox.height,
              fallbackTop: fallbackBox.top,
              fallbackLeft: fallbackBox.left,
              contentHeight: fallback.scrollHeight,
            };
          };

          const current = snapshot();
          // Reproduce the previous declaration on this element, then compare used layout.
          fallback.style.setProperty('height', 'auto', 'important');
          const previous = snapshot();
          fallback.style.removeProperty('height');

          return {
            current,
            previous,
            computedHeight: getComputedStyle(fallback).height,
            minHeight: parseFloat(getComputedStyle(fallback).minHeight),
            horizontalOverflow: fallback.scrollWidth > fallback.clientWidth + 1,
            fallbackHidden: getComputedStyle(fallback).visibility === 'hidden',
          };
        });

        expect(result.fallbackHidden, `${path} fallback must be visible`).toBe(false);
        expect(result.computedHeight, `${path} fallback must have used height`).not.toBe('0px');
        expect(result.current.fallbackHeight, `${path} fallback should honor minimum height`).toBeGreaterThanOrEqual(result.minHeight - 1);
        expect(result.horizontalOverflow, `${path} fallback must not overflow horizontally`).toBe(false);

        for (const [metric, value] of Object.entries(result.current)) {
          expect(value, `${path}, ${width}px, ${reducedMotion}: ${metric} differs from previous layout`)
            .toBeCloseTo(result.previous[metric], 1);
        }
      }
    }
  }
});
