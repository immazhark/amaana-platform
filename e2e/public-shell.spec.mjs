import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const representativeRoutes = [
  { path: '/', family: 'Home' },
  { path: '/about', family: 'About' },
  { path: '/our-work', family: 'Our Work' },
  { path: '/our-work/eid-gift-kits', family: 'Eid Gift Kits' },
  { path: '/our-work/qurbani-meat-distribution', family: 'Qurbani' },
  { path: '/our-work/winter-relief', family: 'Winter Relief' },
  { path: '/our-work/taleem', family: 'Taleem' },
  { path: '/our-work/dates-distribution', family: 'Dates Distribution' },
  { path: '/our-work/hyderabad-flood-relief-2020', family: 'Flood Relief' },
  { path: '/our-work/medical-financial-assistance', family: 'Medical & Financial Assistance' },
  { path: '/impact', family: 'Impact' },
  { path: '/stories', family: 'Stories' },
  { path: '/appeals', family: 'Appeals' },
  { path: '/donate', family: 'Donate' },
  { path: '/request-assistance', family: 'Request Assistance' },
  { path: '/how-we-verify', family: 'How We Work' },
  { path: '/get-involved', family: 'Get Involved' },
  { path: '/get-involved/sponsor-education', family: 'Sponsor Education' },
  { path: '/partner', family: 'Partner' },
  { path: '/faith-and-reflections', family: 'Faith & Reflections' },
  { path: '/transparency', family: 'Transparency' },
  { path: '/governance', family: 'Governance' },
  { path: '/compliance', family: 'Compliance' },
  { path: '/recognition', family: 'Recognition' },
  { path: '/contact', family: 'Contact' },
  { path: '/privacy', family: 'Privacy' },
  { path: '/terms', family: 'Terms' },
  { path: '/donation-policy', family: 'Donation Policy' },
  { path: '/refund-policy', family: 'Refund Policy' },
];

const acceptanceWidths = [1440, 1024, 768, 430, 390, 360];

async function openPublicPage(page, path) {
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response, `Expected a document response for ${path}`).not.toBeNull();
  expect(response?.ok(), `Expected ${path} to render successfully`).toBeTruthy();
  await expect(page.locator('main#main')).toBeVisible();
}

function rectanglesOverlap(first, second) {
  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  );
}

test.describe('representative public accessibility', () => {
  for (const route of representativeRoutes) {
    test(`${route.family}: ${route.path} has no serious or critical axe violations`, async ({ page }) => {
      await openPublicPage(page, route.path);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations
        .filter(violation => violation.impact === 'critical' || violation.impact === 'serious')
        .map(violation => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          nodes: violation.nodes.map(node => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary,
          })),
        }));

      expect(blocking, `Blocking accessibility violations on ${route.path}`).toEqual([]);
    });
  }
});


test('unknown public routes return a branded, navigable and noindex 404', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto('/definitely-not-an-amaana-route', { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: "We Couldn't Find That Page" })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
  const recoveryActions = page.locator('main#main');
  await expect(recoveryActions.getByRole('link', { name: /Explore our work/ })).toHaveAttribute('href', '/our-work');
  await expect(recoveryActions.getByRole('link', { name: /Current appeals/ })).toHaveAttribute('href', '/appeals');

  const robots = page.locator('meta[name="robots"]');
  expect(await robots.count()).toBeGreaterThan(0);
  const robotValues = await robots.evaluateAll(nodes => nodes.map(node => node.getAttribute('content') ?? ''));
  expect(robotValues.every(value => /noindex/i.test(value))).toBe(true);

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test.describe('responsive containment', () => {
  for (const route of representativeRoutes) {
    for (const width of acceptanceWidths) {
      test(`${route.family}: ${route.path} contains content at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
        await openPublicPage(page, route.path);

        const dimensions = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        }));

        expect(
          dimensions.scrollWidth,
          `${route.path} overflowed horizontally at ${width}px`,
        ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
      });
    }
  }
});

test.describe('200 percent zoom reflow', () => {
  for (const path of ['/', '/donate', '/request-assistance', '/our-work/eid-gift-kits']) {
    test(`${path} remains horizontally contained at 200 percent zoom equivalent`, async ({ page }) => {
      // WCAG reflow at 200% on a 1280 CSS-pixel viewport is equivalent to a 640 CSS-pixel layout viewport.
      await page.setViewportSize({ width: 640, height: 900 });
      await openPublicPage(page, path);
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      }));
      expect(dimensions.scrollWidth, `${path} overflowed at 200% zoom equivalent`).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    });
  }
});

test('skip link moves focus to the main content landmark', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPublicPage(page, '/about');

  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  const main = page.locator('main#main');
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(main).toBeFocused();
});

test('representative public pages expose one primary heading and an English document language', async ({ page }) => {
  for (const route of representativeRoutes) {
    await openPublicPage(page, route.path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main#main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
  }
});

test('desktop keyboard order starts with the skip link and primary home link', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPublicPage(page, '/about');

  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });
  const homeLink = primaryNav.getByRole('link', { name: 'Amaana Foundation home' });

  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(homeLink).toBeFocused();
});

test('mobile navigation opens, moves focus inside, closes with Escape and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPublicPage(page, '/about');

  const toggle = page.locator('button[aria-controls="mobile-navigation"]');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.focus();
  await page.keyboard.press('Enter');

  const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(mobileNav).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(mobileNav.getByRole('link', { name: 'Our Work' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(mobileNav).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('navigation marks current primary, support and secondary routes consistently', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPublicPage(page, '/our-work/eid-gift-kits');

  const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(primaryNav.getByRole('link', { name: 'Our Work' })).toHaveAttribute('aria-current', 'page');
  await expect(primaryNav.getByRole('link', { name: 'Impact' })).not.toHaveAttribute('aria-current', 'page');

  await openPublicPage(page, '/appeals');
  await expect(primaryNav.getByRole('link', { name: 'Support a need' })).toHaveAttribute('aria-current', 'page');

  await page.setViewportSize({ width: 390, height: 844 });
  await openPublicPage(page, '/transparency');
  const toggle = page.locator('button[aria-controls="mobile-navigation"]');
  await toggle.click();

  const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
  const transparency = mobileNav.getByRole('link', { name: 'Transparency' });
  await expect(transparency).toHaveAttribute('aria-current', 'page');
  await expect(transparency).toHaveClass(/active/);
  await expect(mobileNav.getByRole('link', { name: 'Governance' })).not.toHaveAttribute('aria-current', 'page');
});

test('canonical continuation routes expose unique internal destinations on partner and recognition pages', async ({ page }) => {
  const expected = {
    '/partner': ['/how-we-verify', '/transparency', '/get-involved'],
    '/recognition': ['/governance', '/transparency', '/our-work'],
  };

  for (const [path, destinations] of Object.entries(expected)) {
    await openPublicPage(page, path);

    const continuation = page.getByRole('navigation', { name: 'Continue exploring Amaana' });
    await expect(continuation).toBeVisible();

    const hrefs = await continuation.locator('a').evaluateAll(links =>
      links.map(link => link.getAttribute('href')).filter(Boolean),
    );

    expect(hrefs, `${path} should expose the expected continuation routes`).toEqual(destinations);
    expect(new Set(hrefs).size, `${path} continuation routes must be unique`).toBe(hrefs.length);
    expect(
      hrefs.every(href => href.startsWith('/') && !href.startsWith('//') && !/\s/.test(href)),
      `${path} continuation routes must remain safe internal paths`,
    ).toBe(true);
  }
});

test('mobile navigation backdrop dismisses the menu without entering keyboard order', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPublicPage(page, '/about');

  const toggle = page.locator('button[aria-controls="mobile-navigation"]');
  await toggle.click();
  const backdrop = page.locator('.mobile-menu-backdrop');
  await expect(backdrop).toBeVisible();
  await expect(backdrop).toHaveAttribute('tabindex', '-1');

  const clickPoint = await page.evaluate(() => {
    const backdropElement = document.querySelector('.mobile-menu-backdrop');
    const menuElement = document.querySelector('#mobile-navigation');
    if (!(backdropElement instanceof HTMLElement) || !(menuElement instanceof HTMLElement)) return null;

    const backdropRect = backdropElement.getBoundingClientRect();
    const menuRect = menuElement.getBoundingClientRect();
    const x = Math.max(backdropRect.left + 8, Math.min(backdropRect.right - 8, backdropRect.left + backdropRect.width / 2));
    const availableBelow = backdropRect.bottom - Math.max(backdropRect.top, menuRect.bottom);
    const availableAbove = Math.min(backdropRect.bottom, menuRect.top) - backdropRect.top;
    const y = availableBelow >= 16
      ? Math.max(backdropRect.top + 8, menuRect.bottom + Math.min(24, availableBelow / 2))
      : availableAbove >= 16
        ? Math.min(backdropRect.bottom - 8, menuRect.top - Math.min(24, availableAbove / 2))
        : null;

    return y === null ? null : { x, y };
  });

  expect(clickPoint, 'Open mobile navigation must leave a pointer-accessible backdrop region').not.toBeNull();
  const topmostClass = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.className ?? '', clickPoint);
  expect(String(topmostClass), 'The exposed dismiss region must belong to the mobile navigation backdrop').toContain('mobile-menu-backdrop');
  await page.mouse.click(clickPoint.x, clickPoint.y);
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('reduced-motion preference disables reminder autoplay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPublicPage(page, '/donate');

  expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const autoplay = page.locator('.amaana-reminder-controls button').first();
  await expect(autoplay).toBeDisabled();
  await expect(autoplay).toHaveText('Motion off');
});

test('mobile floating companion and Back to top controls do not overlap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPublicPage(page, '/about');

  await page.evaluate(() => window.scrollTo(0, Math.max(1000, document.body.scrollHeight)));

  const backToTop = page.getByRole('button', { name: 'Back to top' });
  const companion = page.locator('.amaana-companion-dock');
  await expect(backToTop).toBeVisible();
  await expect(companion).toBeVisible();

  const backBox = await backToTop.boundingBox();
  const companionBox = await companion.boundingBox();
  expect(backBox).not.toBeNull();
  expect(companionBox).not.toBeNull();
  expect(rectanglesOverlap(backBox, companionBox), 'Floating controls overlap at 390px').toBe(false);

  await backToTop.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
});


test('client navigation uses a full-screen branded blocking overlay without collapsing the page shell', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPublicPage(page, '/');

  await page.route('**/about?*', async route => {
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.continue();
  });

  const before = await page.locator('main#main').boundingBox();
  expect(before).not.toBeNull();

  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'About' }).click({ noWaitAfter: true });

  const overlay = page.locator('.amaana-navigation-loading');
  await expect(overlay).toBeVisible();
  await expect(overlay.locator('.amaana-loading-logo')).toBeVisible();
  await expect(overlay.locator('.amaana-loading-dots i')).toHaveCount(3);

  const geometry = await overlay.boundingBox();
  expect(geometry).not.toBeNull();
  expect(geometry.x).toBeLessThanOrEqual(1);
  expect(geometry.width).toBeGreaterThanOrEqual(389);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

  const during = await page.locator('main#main').boundingBox();
  expect(during).not.toBeNull();
  expect(during.height).toBeGreaterThan(0);

  await page.waitForURL('**/about');
  await expect(overlay).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});


test('mobile navigation traps keyboard focus while open and does not expose the page behind it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPublicPage(page, '/about');

  const toggle = page.locator('button[aria-controls="mobile-navigation"]');
  await toggle.click();
  const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(mobileNav).toBeVisible();

  const focusables = await mobileNav.locator('a[href], button:not([disabled])').count();
  expect(focusables).toBeGreaterThan(1);

  for (let index = 0; index < focusables + 2; index += 1) {
    await page.keyboard.press('Tab');
    const insideMenu = await page.evaluate(() => {
      const nav = document.querySelector('#mobile-navigation');
      const toggleButton = document.querySelector('button[aria-controls="mobile-navigation"]');
      return Boolean(nav?.contains(document.activeElement) || toggleButton === document.activeElement);
    });
    expect(insideMenu, 'Keyboard focus escaped the open mobile navigation').toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(mobileNav).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('reduced motion disables smooth document scrolling and keeps navigation usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPublicPage(page, '/about');

  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});
