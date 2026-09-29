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

  await page.waitForLoadState('load');
  await expect(page.locator('main#main')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);

  await expect.poll(
    () => page.evaluate(() => {
      const footerNote = document.querySelector('.footer-note');
      return {
        bodyMargin: getComputedStyle(document.body).margin,
        footerDisplay: footerNote ? getComputedStyle(footerNote).display : null,
      };
    }),
    {
      message: `Expected the canonical CSS cascade to be applied before measuring ${path} at ${width}px`,
    },
  ).toEqual({
    bodyMargin: '0px',
    footerDisplay: 'grid',
  });
}

function formatOverflowDiagnostics({ clientWidth, scrollWidth, offenders }) {
  return JSON.stringify({
    clientWidth,
    scrollWidth,
    offenders,
  }, null, 2);
}

async function readGeometry(page) {
  return page.evaluate(() => {
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
            overflowX: style.overflowX,
            whiteSpace: style.whiteSpace,
            transform: style.transform,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aOverflow = Math.max(
          a.rect.right - clientWidth,
          a.rect.width - clientWidth,
          a.box.scrollWidth - a.box.clientWidth,
        );
        const bOverflow = Math.max(
          b.rect.right - clientWidth,
          b.rect.width - clientWidth,
          b.box.scrollWidth - b.box.clientWidth,
        );
        return bOverflow - aOverflow;
      })
      .slice(0, 12);

    return {
      clientWidth,
      scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      offenders,
    };
  });
}

test.describe('cross-browser public-surface smoke', () => {
  for (const width of [375, 1440]) {
    for (const path of routes) {
      test(`${path} stays contained and navigable at ${width}px`, async ({ page }) => {
        await open(page, path, width);

        const geometry = await readGeometry(page);
        expect(
          geometry.scrollWidth,
          `${path} overflowed horizontally at ${width}px\n${formatOverflowDiagnostics(geometry)}`,
        ).toBeLessThanOrEqual(geometry.clientWidth + 1);

        if (width === 375) {
          const footerGeometry = await page.locator('.footer-note').evaluate(note => {
            const noteRect = note.getBoundingClientRect();
            const spanRects = Array.from(note.querySelectorAll(':scope > span')).map(span => span.getBoundingClientRect());
            return {
              noteClientWidth: note.clientWidth,
              noteScrollWidth: note.scrollWidth,
              maxSpanRight: Math.max(...spanRects.map(rect => rect.right)),
              noteRight: noteRect.right,
            };
          });

          expect(
            footerGeometry.noteScrollWidth,
            `${path} footer note must wrap inside its mobile grid`,
          ).toBeLessThanOrEqual(footerGeometry.noteClientWidth + 1);
          expect(
            footerGeometry.maxSpanRight,
            `${path} footer note span escaped the mobile grid`,
          ).toBeLessThanOrEqual(footerGeometry.noteRight + 1);
        }

        const skip = page.getByRole('link', { name: 'Skip to content' });
        await page.keyboard.press('Tab');
        await expect(skip).toBeFocused();
      });
    }
  }
});
