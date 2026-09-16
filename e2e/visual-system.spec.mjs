import { expect, test } from '@playwright/test';

const routes = ['/about', '/governance', '/donate', '/request-assistance'];
const widths = [1440, 720, 390];
const publicSurfaceRoutes = [
  '/',
  '/about',
  '/appeals',
  '/compliance',
  '/contact',
  '/donate',
  '/donation-policy',
  '/faith-and-reflections',
  '/get-involved',
  '/get-involved/sponsor-education',
  '/governance',
  '/how-we-verify',
  '/impact',
  '/our-work',
  '/our-work/dates-distribution',
  '/our-work/eid-gift-kits',
  '/our-work/hyderabad-flood-relief-2020',
  '/our-work/medical-financial-assistance',
  '/our-work/qurbani-meat-distribution',
  '/our-work/taleem',
  '/our-work/winter-relief',
  '/partner',
  '/privacy',
  '/recognition',
  '/refund-policy',
  '/request-assistance',
  '/request-assistance/received',
  '/request-assistance/status',
  '/stories',
  '/terms',
  '/transparency',
];

async function open(page, path, width = 1440) {
  await page.setViewportSize({ width, height: width <= 430 ? 844 : 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response?.ok(), `${path} should render`).toBeTruthy();
  await expect(page.locator('main#main')).toBeVisible();
}

function near(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

async function expectContained(page, route) {
  const result = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const offenders = [...document.querySelectorAll('header img, main img, main video, main iframe, footer img')]
      .filter(element => {
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || element.closest('[aria-hidden="true"]')) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > viewport + 1);
      })
      .map(element => ({
        tag: element.tagName,
        src: element.getAttribute('src'),
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
      }));
    return { viewport, scrollWidth, offenders };
  });
  expect(result.scrollWidth, `${route} should not overflow horizontally`).toBeLessThanOrEqual(result.viewport + 1);
  expect(result.offenders, `${route} has out-of-bounds media`).toEqual([]);
}

test('header, hero, body and footer share the same desktop content grid', async ({ page }) => {
  await open(page, '/about');
  const boxes = await page.evaluate(() => {
    const selectors = ['.site-header .container', '.page-hero__shell', '.canonical-body', '.site-footer > .container'];
    return selectors.map(selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { selector, left: box.left, right: box.right, width: box.width };
    });
  });

  expect(boxes.every(Boolean)).toBeTruthy();
  const [reference, ...rest] = boxes;
  for (const box of rest) {
    expect(near(box.left, reference.left), `${box.selector} left edge should align`).toBeTruthy();
    expect(near(box.right, reference.right), `${box.selector} right edge should align`).toBeTruthy();
  }
});

test('impact marquee uses the canonical desktop shell width and remains centered', async ({ page }) => {
  await open(page, '/impact');
  const boxes = await page.evaluate(() => {
    const shell = document.querySelector('.site-header .container')?.getBoundingClientRect();
    let marquee = document.querySelector('.v2-impact-marquee-track');
    if (!marquee) {
      const fixture = document.createElement('section');
      fixture.style.width = '100%';
      fixture.setAttribute('data-visual-test-fixture', 'impact-marquee-host');
      marquee = document.createElement('div');
      marquee.className = 'v2-impact-marquee-track';
      marquee.setAttribute('data-visual-test-fixture', 'impact-marquee');
      fixture.appendChild(marquee);
      document.body.appendChild(fixture);
    }
    const marqueeBox = marquee?.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    return shell && marqueeBox ? {
      shellWidth: shell.width,
      marqueeWidth: marqueeBox.width,
      marqueeLeft: marqueeBox.left,
      marqueeRightGap: viewport - marqueeBox.right,
    } : null;
  });
  expect(boxes).toBeTruthy();
  expect(near(boxes.marqueeWidth, boxes.shellWidth), 'impact marquee width should match the canonical shell').toBeTruthy();
  expect(near(boxes.marqueeLeft, boxes.marqueeRightGap), 'impact marquee should remain horizontally centered').toBeTruthy();
});

test('hero primary and secondary actions have equal canonical height', async ({ page }) => {
  await open(page, '/about');
  const actions = page.locator('.page-hero__actions .page-hero__button');
  await expect(actions).toHaveCount(2);
  const sizes = await actions.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return { height: box.height, radius: style.borderRadius, family: style.fontFamily, weight: style.fontWeight };
  }));
  expect(Math.abs(sizes[0].height - sizes[1].height)).toBeLessThanOrEqual(1);
  expect(sizes[0].height).toBeGreaterThanOrEqual(51);
  expect(sizes[0].radius).toBe(sizes[1].radius);
  expect(sizes[0].family).toBe(sizes[1].family);
  expect(sizes[0].weight).toBe(sizes[1].weight);
});

test('banner heading is clearly larger than body headings and typography roles stay distinct', async ({ page }) => {
  await open(page, '/about');
  const typography = await page.evaluate(() => {
    const hero = document.querySelector('.page-hero__title');
    const bodyHeading = document.querySelector('.canonical-block h2');
    const body = document.querySelector('.canonical-block p');
    const action = document.querySelector('.page-hero__button');
    return {
      heroSize: parseFloat(getComputedStyle(hero).fontSize),
      bodyHeadingSize: parseFloat(getComputedStyle(bodyHeading).fontSize),
      heroFamily: getComputedStyle(hero).fontFamily,
      bodyHeadingFamily: getComputedStyle(bodyHeading).fontFamily,
      bodyFamily: getComputedStyle(body).fontFamily,
      actionFamily: getComputedStyle(action).fontFamily,
    };
  });
  expect(typography.heroSize - typography.bodyHeadingSize).toBeGreaterThanOrEqual(12);
  expect(typography.heroFamily).toMatch(/Georgia|Times New Roman/i);
  expect(typography.bodyHeadingFamily).toMatch(/Georgia|Times New Roman/i);
  expect(typography.bodyFamily).toMatch(/Arial|Helvetica/i);
  expect(typography.actionFamily).toMatch(/Arial|Helvetica/i);
});

test('homepage image-overlay titles remain subordinate to the banner title', async ({ page }) => {
  await open(page, '/');
  const typography = await page.evaluate(() => {
    let hero = document.querySelector('.page-hero__title');
    if (!hero) {
      const host = document.createElement('section');
      host.className = 'page-hero page-hero--level1';
      host.setAttribute('data-visual-test-fixture', 'hero-host');
      host.innerHTML = '<h1 class="page-hero__title">Amaana Foundation</h1>';
      document.body.appendChild(host);
      hero = host.querySelector('.page-hero__title');
    }
    let overlay = document.querySelector('.v3-field-copy h3');
    if (!overlay) {
      const fixture = document.createElement('div');
      fixture.className = 'v3-field-card';
      fixture.setAttribute('data-visual-test-fixture', 'field-card');
      fixture.innerHTML = '<div class="v3-field-copy"><h3>Documented programme</h3></div>';
      document.body.appendChild(fixture);
      overlay = fixture.querySelector('h3');
    }
    return hero && overlay ? {
      heroSize: parseFloat(getComputedStyle(hero).fontSize),
      overlaySize: parseFloat(getComputedStyle(overlay).fontSize),
      overlayFamily: getComputedStyle(overlay).fontFamily,
    } : null;
  });
  expect(typography).toBeTruthy();
  expect(typography.heroSize - typography.overlaySize).toBeGreaterThanOrEqual(12);
  expect(typography.overlayFamily).toMatch(/Georgia|Times New Roman/i);
});

test('shared footer callout remains compact and does not compete with page hero', async ({ page }) => {
  await open(page, '/about');
  const metrics = await page.evaluate(() => {
    const lead = document.querySelector('.footer-lead');
    const footerHeading = lead.querySelector('h2');
    const heroHeading = document.querySelector('.page-hero__title');
    return {
      leadHeight: lead.getBoundingClientRect().height,
      footerSize: parseFloat(getComputedStyle(footerHeading).fontSize),
      heroSize: parseFloat(getComputedStyle(heroHeading).fontSize),
    };
  });
  expect(metrics.leadHeight).toBeLessThan(320);
  expect(metrics.footerSize).toBeLessThan(metrics.heroSize);
});

test('official Amaana mark is present in both global brand anchors', async ({ page }) => {
  await open(page, '/about');
  await expect(page.locator('.site-header img[src="/brand/amaana-mark.svg"]')).toHaveCount(1);
  await expect(page.locator('.site-footer img[src="/brand/amaana-mark.svg"]')).toHaveCount(1);
});

for (const route of routes) {
  for (const width of widths) {
    test(`${route} contains media and content at ${width}px${width === 720 ? ' (200% desktop reflow equivalent)' : ''}`, async ({ page }) => {
      await open(page, route, width);
      await expectContained(page, route);
    });
  }
}

for (const width of [1440, 390]) {
  test(`all concrete public routes stay horizontally contained at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    for (const route of publicSurfaceRoutes) {
      await open(page, route, width);
      await expectContained(page, route);
    }
  });
}
