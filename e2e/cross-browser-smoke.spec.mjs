import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/our-work',
  '/impact',
  '/donate',
  '/request-assistance',
  '/privacy',
];

async function open(page, path, width) {
  await page.setViewportSize({ width, height: width <= 375 ? 812 : 900 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response, `Expected a document response for ${path}`).not.toBeNull();
  expect(response?.ok(), `Expected ${path} to render successfully`).toBeTruthy();
  await expect(page.locator('main#main')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
}

function formatOverflowDiagnostics({ clientWidth, scrollWidth, offenders }) {
  return JSON.stringify({
    clientWidth,
    scrollWidth,
    offenders,
  }, null, 2);
}

test.describe('cross-browser public-surface smoke', () => {
  for (const width of [375, 1440]) {
    for (const path of routes) {
      test(`${path} stays contained and navigable at ${width}px`, async ({ page }) => {
        await open(page, path, width);

        const geometry = await page.evaluate(() => {
          const root = document.documentElement;
          const clientWidth = root.clientWidth;
          const tolerance = 1;

          const selectorFor = element => {
            if (element.id) return `#${CSS.escape(element.id)}`;

            const parts = [];
            let current = element;
            while (current && current !== document.body && parts.length < 4) {
              let part = current.tagName.toLowerCase();
              if (current.classList.length) {
                part += `.${Array.from(current.classList).slice(0, 3).map(value => CSS.escape(value)).join('.')}`;
              }
              parts.unshift(part);
              current = current.parentElement;
            }
            return parts.join(' > ');
          };

          const pseudoSnapshot = (element, pseudo) => {
            const style = getComputedStyle(element, pseudo);
            if (!style || style.content === 'none' || style.display === 'none') return null;
            return {
              content: style.content,
              display: style.display,
              position: style.position,
              width: style.width,
              minWidth: style.minWidth,
              maxWidth: style.maxWidth,
              left: style.left,
              right: style.right,
              insetInlineStart: style.insetInlineStart,
              insetInlineEnd: style.insetInlineEnd,
              transform: style.transform,
              overflowX: style.overflowX,
            };
          };

          const offenders = Array.from(document.querySelectorAll('*'))
            .map(element => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              const scrollOverflow = element.scrollWidth > element.clientWidth + tolerance;
              const viewportOverflow =
                rect.left < -tolerance ||
                rect.right > clientWidth + tolerance ||
                rect.width > clientWidth + tolerance;

              if (!scrollOverflow && !viewportOverflow) return null;

              return {
                selector: selectorFor(element),
                tag: element.tagName.toLowerCase(),
                id: element.id || null,
                className: typeof element.className === 'string' ? element.className : null,
                rect: {
                  left: Number(rect.left.toFixed(2)),
                  right: Number(rect.right.toFixed(2)),
                  width: Number(rect.width.toFixed(2)),
                },
                box: {
                  clientWidth: element.clientWidth,
                  scrollWidth: element.scrollWidth,
                },
                computed: {
                  display: style.display,
                  position: style.position,
                  width: style.width,
                  minWidth: style.minWidth,
                  maxWidth: style.maxWidth,
                  left: style.left,
                  right: style.right,
                  insetInlineStart: style.insetInlineStart,
                  insetInlineEnd: style.insetInlineEnd,
                  overflowX: style.overflowX,
                  whiteSpace: style.whiteSpace,
                  transform: style.transform,
                },
                before: pseudoSnapshot(element, '::before'),
                after: pseudoSnapshot(element, '::after'),
              };
            })
            .filter(Boolean)
            .sort((a, b) => {
              const aOverflow = Math.max(a.rect.right - clientWidth, a.rect.width - clientWidth, a.box.scrollWidth - a.box.clientWidth);
              const bOverflow = Math.max(b.rect.right - clientWidth, b.rect.width - clientWidth, b.box.scrollWidth - b.box.clientWidth);
              return bOverflow - aOverflow;
            })
            .slice(0, 20);

          return {
            clientWidth,
            scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
            offenders,
          };
        });

        expect(
          geometry.scrollWidth,
          `${path} overflowed horizontally at ${width}px\n${formatOverflowDiagnostics(geometry)}`,
        ).toBeLessThanOrEqual(geometry.clientWidth + 1);

        const skip = page.getByRole('link', { name: 'Skip to content' });
        await page.keyboard.press('Tab');
        await expect(skip).toBeFocused();
      });
    }
  }
});
