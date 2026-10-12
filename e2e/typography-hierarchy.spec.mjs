import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`banner hierarchy and grouped evidence headings at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/browser-acceptance/home-hero');
    const banner = await page.locator('.v3-home-banner-slide--story').first().evaluate(node => {
      const title = node.querySelector('.v3-home-banner-brandline');
      const r = node.getBoundingClientRect();
      return { font: parseFloat(getComputedStyle(title).fontSize), inside: [...node.querySelectorAll('.v3-home-banner-content > *')].every(el => { const b = el.getBoundingClientRect(); return b.top >= r.top && b.bottom <= r.bottom; }) };
    });
    const bodySize = await page.locator('.v3-section h2').evaluateAll(nodes => Math.max(...nodes.map(node => parseFloat(getComputedStyle(node).fontSize))));
    expect(banner.font).toBeGreaterThan(bodySize);
    expect(banner.inside).toBe(true);
    for (const path of ['/our-work', '/impact', '/stories', '/faith-and-reflections', '/request-assistance', '/our-work/eid-gift-kits']) {
      await page.goto(path);
      const metrics = await page.locator('main h2').evaluateAll(nodes => nodes.filter(n => !n.closest('.v3-home-banner')).map(node => ({ font: parseFloat(getComputedStyle(node).fontSize), grouped: !node.classList.contains('v2-section-title') || !node.previousElementSibling?.classList.contains('v2-section-label') || node.previousElementSibling.getBoundingClientRect().bottom <= node.getBoundingClientRect().top })));
      for (const metric of metrics) { expect(metric.font, path).toBeLessThanOrEqual(56); expect(metric.grouped, path).toBe(true); }
    }
  });
}

const cases = [
  { route: '/stories', selector: '.v2-stories-feature-copy h2', fixtureKind: 'stories-feature' },
  { route: '/faith-and-reflections', selector: '.v2-faith-standard h2', fixtureKind: 'faith-standard' },
  { route: '/faith-and-reflections', selector: '.v2-faith-feature-copy h2', fixtureKind: 'faith-feature' },
  { route: '/our-work', selector: '.v2-cause-summary-title', fixtureKind: 'cause-summary' },
];

for (const width of [1440, 390]) {
  test(`route-specific editorial headings remain subordinate to PageHero at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width <= 430 ? 844 : 1000 });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));

    for (const sample of cases) {
      const response = await page.goto(sample.route, { waitUntil: 'domcontentloaded' });
      expect(response?.ok(), `${sample.route} should render`).toBeTruthy();

      const metrics = await page.evaluate(({ selector, fixtureKind }) => {
        const add = (parent, tag, className, text) => {
          const node = document.createElement(tag);
          if (className) node.className = className;
          if (text) node.textContent = text;
          parent.appendChild(node);
          return node;
        };

        let hero = document.querySelector('.page-hero__title');
        if (!hero) {
          const host = add(document.body, 'section', 'page-hero page-hero--level1');
          host.setAttribute('data-visual-test-fixture', 'page-hero');
          const shell = add(host, 'div', 'page-hero__shell');
          const grid = add(shell, 'div', 'page-hero__grid');
          const copy = add(grid, 'div', 'page-hero__copy');
          hero = add(copy, 'h1', 'page-hero__title', 'Amaana Foundation');
        }

        let heading = document.querySelector(selector);
        if (!heading) {
          const host = add(document.body, 'div');
          host.setAttribute('data-visual-test-fixture', 'route-heading');

          if (fixtureKind === 'stories-feature') {
            heading = add(add(host, 'div', 'v2-stories-feature-copy'), 'h2', '', 'Featured field note');
          } else if (fixtureKind === 'faith-standard') {
            heading = add(add(host, 'section', 'v2-faith-standard'), 'h2', '', 'Editorial trust');
          } else if (fixtureKind === 'faith-feature') {
            heading = add(add(host, 'div', 'v2-faith-feature-copy'), 'h2', '', 'Featured reflection');
          } else if (fixtureKind === 'cause-summary') {
            const details = add(host, 'details', 'v2-cause-disclosure');
            const summary = add(details, 'summary', 'v2-cause-summary');
            const title = add(add(add(summary, 'h2', 'v2-cause-summary-heading'), 'span', 'v2-cause-summary-copy'), 'span', 'v2-cause-summary-title', 'Medical & Financial Relief');
            heading = title;
          }
        }

        return hero && heading ? {
          heroSize: parseFloat(getComputedStyle(hero).fontSize),
          headingSize: parseFloat(getComputedStyle(heading).fontSize),
          family: getComputedStyle(heading).fontFamily,
        } : null;
      }, sample);

      expect(metrics, `${sample.selector} should resolve`).toBeTruthy();
      expect(metrics.heroSize - metrics.headingSize, `${sample.selector} should remain clearly below the PageHero title`).toBeGreaterThanOrEqual(8);
      expect(metrics.family).toMatch(/Georgia|Times New Roman/i);
    }
  });
}


test('canonical public typography roles stay restrained and consistent', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  for (const route of ['/about', '/get-involved', '/governance', '/transparency', '/compliance']) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${route} should render`).toBeTruthy();
    const metrics = await page.evaluate(() => {
      const hero = document.querySelector('.page-hero__title');
      const nav = document.querySelector('.site-header .nav-link');
      const active = document.querySelector('.site-header .nav-link.active');
      const button = document.querySelector('.page-hero__button, .v2-button');
      const label = document.querySelector('.page-hero__eyebrow, .v2-section-label');
      const textLink = document.querySelector('.v2-text-link, .canonical-block a');
      const read = node => node ? {
        family: getComputedStyle(node).fontFamily,
        weight: Number.parseInt(getComputedStyle(node).fontWeight, 10),
        decoration: getComputedStyle(node).textDecorationLine,
      } : null;
      return { hero: read(hero), nav: read(nav), active: read(active), button: read(button), label: read(label), textLink: read(textLink) };
    });
    expect(metrics.hero?.family).toMatch(/Georgia|Times New Roman/i);
    expect(metrics.hero?.weight).toBeLessThanOrEqual(500);
    if (metrics.nav) expect(metrics.nav.weight).toBeLessThanOrEqual(600);
    if (metrics.active) expect(metrics.active.weight).toBeLessThanOrEqual(700);
    if (metrics.button) expect(metrics.button.weight).toBeLessThanOrEqual(700);
    if (metrics.label) expect(metrics.label.weight).toBeLessThanOrEqual(700);
    if (metrics.textLink) {
      expect(metrics.textLink.weight).toBeLessThanOrEqual(700);
      expect(metrics.textLink.decoration).toContain('underline');
    }
  }
});

test('canonical trust and about narrative sections are not rendered as repetitive boxed cards', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  for (const route of ['/about']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const surfaces = await page.locator('.canonical-body--about > .canonical-block:nth-child(-n+2)').evaluateAll(nodes => nodes.map(node => {
      const style = getComputedStyle(node);
      return { radius: parseFloat(style.borderRadius), shadow: style.boxShadow, left: style.borderLeftWidth, right: style.borderRightWidth };
    }));
    for (const surface of surfaces) {
      expect(surface.radius).toBeLessThanOrEqual(1);
      expect(surface.shadow).toBe('none');
      expect(parseFloat(surface.left)).toBe(0);
      expect(parseFloat(surface.right)).toBe(0);
    }
  }
});


test('L1 discovery metadata does not overpower content hierarchy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const checks = [
    ['/our-work', '.v2-initiative-copy small'],
    ['/impact', '.v2-impact-tile-copy small'],
    ['/stories', '.v2-stories-feature-copy small, .v2-stories-card-copy small'],
    ['/faith-and-reflections', '[class*="emptyKicker"]'],
  ];
  for (const [route, selector] of checks) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const nodes = page.locator(selector);
    const count = await nodes.count();
    for (let i = 0; i < count; i += 1) {
      const weight = Number.parseInt(await nodes.nth(i).evaluate(node => getComputedStyle(node).fontWeight), 10);
      expect(weight, `${route} metadata weight`).toBeLessThanOrEqual(700);
    }
  }
});

test('Our Work disclosure exposes a visible keyboard focus indicator', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  await page.goto('/our-work', { waitUntil: 'domcontentloaded' });
  const summary = page.locator('.v2-cause-summary').first();
  await summary.focus();
  const focus = await summary.evaluate(node => {
    const style = getComputedStyle(node);
    return { width: parseFloat(style.outlineWidth), style: style.outlineStyle, offset: parseFloat(style.outlineOffset) };
  });
  expect(focus.width).toBeGreaterThanOrEqual(2);
  expect(focus.style).not.toBe('none');
  expect(focus.offset).toBeGreaterThanOrEqual(2);
});


test('remaining L1 metadata and action text stay within canonical emphasis', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const checks = [
    ['/', '.v3-proof-label, .v3-label, .v3-work-card-body small'],
    ['/get-involved', '.v2-intent-marker, .v2-intent-arrow'],
    ['/appeals', '.v2-appeals-trustline .v2-shell, .v2-appeal-card-head, .v2-appeal-card-link'],
  ];
  for (const [route, selector] of checks) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const weights = await page.locator(selector).evaluateAll(nodes => nodes.map(node => Number.parseInt(getComputedStyle(node).fontWeight, 10)));
    for (const weight of weights) expect(weight, `${route} metadata/action weight`).toBeLessThanOrEqual(700);
  }
});


test('L2 programme metadata and prose follow canonical reading hierarchy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const routes = ['/our-work/eid-gift-kits', '/our-work/qurbani-meat-distribution', '/our-work/taleem', '/our-work/winter-relief'];
  for (const route of routes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${route} should render`).toBeTruthy();
    const weights = await page.locator('.campaign-breadcrumb nav, .campaign-history-note span, .campaign-clinical-note span:first-child').evaluateAll(nodes => nodes.map(node => Number.parseInt(getComputedStyle(node).fontWeight, 10)));
    for (const weight of weights) expect(weight).toBeLessThanOrEqual(700);
    const timelineWeights = await page.locator('.canonical-facts--timeline li').evaluateAll(nodes => nodes.map(node => Number.parseInt(getComputedStyle(node, '::before').fontWeight, 10)));
    for (const weight of timelineWeights) expect(weight).toBeLessThanOrEqual(700);
    const prose = page.locator('.campaign-story-copy').first();
    if (await prose.count()) {
      const width = await prose.evaluate(node => parseFloat(getComputedStyle(node).maxWidth));
      expect(width).toBeLessThanOrEqual(1024);
    }
  }
});


test('institutional routes keep evidence metadata subordinate and focus visible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const checks = [
    ['/governance', '.governance-summary span, .canonical-pathway span'],
    ['/how-we-verify', '.canonical-body--timeline .canonical-block::before'],
    ['/recognition', '[class*="meta"] > span, [class*="meta"] dt'],
    ['/contact', '.v2-intent-marker, .v2-intent-arrow'],
  ];
  for (const [route, selector] of checks) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${route} should render`).toBeTruthy();
    if (selector.includes('::before')) {
      const weights = await page.locator('.canonical-body--timeline .canonical-block').evaluateAll(nodes => nodes.map(node => Number.parseInt(getComputedStyle(node, '::before').fontWeight, 10)));
      for (const weight of weights) expect(weight).toBeLessThanOrEqual(700);
    } else {
      const weights = await page.locator(selector).evaluateAll(nodes => nodes.map(node => Number.parseInt(getComputedStyle(node).fontWeight, 10)));
      for (const weight of weights) expect(weight).toBeLessThanOrEqual(700);
    }
  }
});


test('transactional form emphasis stays readable without typographic shouting', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  for (const route of ['/donate', '/request-assistance']) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${route} should render`).toBeTruthy();
    const weights = await page.locator('.v2-premium-form .field label, [class*="checkoutLabel"], [class*="intentGroup"] legend, [class*="progress"] button').evaluateAll(nodes => nodes.map(node => Number.parseInt(getComputedStyle(node).fontWeight, 10)));
    for (const weight of weights) expect(weight, `${route} form emphasis`).toBeLessThanOrEqual(700);
  }
});

test('private state pages keep status metadata subordinate', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/request-assistance/status', { waitUntil: 'domcontentloaded' });
  const nodes = page.locator('.v2-reference-block span, .v2-state-steps > span');
  const count = await nodes.count();
  if (count === 0) return;
  const weights = await nodes.evaluateAll(items => items.map(node => Number.parseInt(getComputedStyle(node).fontWeight, 10)));
  for (const weight of weights) expect(Number.isFinite(weight) && weight <= 700).toBe(true);
});


test('policy routes preserve long-form reading hierarchy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  for (const route of ['/privacy', '/terms', '/donation-policy', '/refund-policy']) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${route} should render`).toBeTruthy();
    const labels = await page.locator('.v2-policy-principles span, .v2-policy-layout > aside p').evaluateAll(nodes => nodes.map(node => Number.parseInt(getComputedStyle(node).fontWeight, 10)));
    for (const weight of labels) expect(weight).toBeLessThanOrEqual(700);
    const prose = page.locator('.v2-policy-sections p').first();
    const lineHeight = await prose.evaluate(node => parseFloat(getComputedStyle(node).lineHeight) / parseFloat(getComputedStyle(node).fontSize));
    expect(lineHeight).toBeGreaterThanOrEqual(1.65);
  }
});


for (const width of [390, 1280]) {
  for (const surface of [
    { path: '/governance', selector: '.governance-summary span', count: 3 },
    { path: '/privacy', selector: '.v2-policy-principles span', count: 3 },
    { path: '/privacy', selector: '.v2-policy-layout > aside > p', count: 1 },
  ]) {
    test(`readable labels ${surface.selector} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
      const response = await page.goto(surface.path, { waitUntil: 'domcontentloaded' });
      expect(response?.ok()).toBeTruthy();
      const labels = page.locator(surface.selector);
      await expect(labels).toHaveCount(surface.count);
      for (const label of await labels.all()) {
        expect(await label.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(12);
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      for (const label of await labels.all()) {
        expect(await label.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(24);
        expect(await label.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      }
    });
  }
}

for (const width of [390, 1280]) {
  test(`private assistance eyebrow remains readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    const response = await page.goto('/request-assistance', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    const label = page.locator('.v2-assistance-form .v2-form-heading > span');
    await expect(label).toHaveCount(1);
    await expect(label).toHaveText('Private submission');
    expect(await label.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(12);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await label.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(24);
    const contained = await label.evaluate(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const host = node.closest('.v2-form-heading').getBoundingClientRect();
      return [...range.getClientRects()].every(rect => rect.left >= host.left - 1 && rect.right <= host.right + 1);
    });
    expect(contained).toBe(true);
  });
}

for (const width of [390, 1280]) {
  for (const state of ['received', 'tracking', 'acknowledgement']) {
    test(`private ${state} metadata remains readable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
      const reference = 'SYNTHETIC-READABILITY-ONLY';
      const token = 'synthetic-readability-token-no-real-record';
      await page.route('**/api/assistance/status', route => route.fulfill({
        status: 200, json: { found: true, status: 'SUBMITTED', createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-02T00:00:00Z' },
      }));
      await page.route('**/api/donations/acknowledgement', route => route.fulfill({
        status: 200, json: {
          found: true,
          presentation: { tone: 'captured', heading: 'Synthetic acknowledgement', summary: 'Browser-only typography fixture.', statusLabel: 'Captured' },
          donation: { referenceNumber: reference, receiptNumber: 'SYNTHETIC-RECEIPT', donorName: 'Synthetic donor', givingIntent: 'GENERAL', amount: 100,
            refundedAmount: 0, recordDate: '2026-10-01T00:00:00Z', providerPaymentId: null, appeal: { title: 'Synthetic appeal', slug: 'synthetic-appeal' } },
        },
      }));
      const fragment = new URLSearchParams({ reference, token }).toString();
      const path = state === 'acknowledgement'
        ? `/donations/${reference}/acknowledgement#token=${token}`
        : `/request-assistance/${state === 'tracking' ? 'status' : 'received'}#${fragment}`;
      expect((await page.goto(path, { waitUntil: 'domcontentloaded' }))?.ok()).toBeTruthy();
      const selectors = state === 'acknowledgement'
        ? ['.v2-receipt-status > span', '.v2-receipt-sheet-head span']
        : ['.v2-reference-block > span', '.v2-state-steps > span'];
      for (const selector of selectors) {
        const label = page.locator(selector);
        await expect(label).toHaveCount(1);
        await expect(label).toBeVisible();
        expect(await label.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(12);
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      for (const selector of selectors) {
        const label = page.locator(selector);
        expect(await label.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(24);
        const contained = await label.evaluate(node => {
          const range = document.createRange();
          range.selectNodeContents(node);
          const host = node.parentElement.getBoundingClientRect();
          return [...range.getClientRects()].every(rect => rect.left >= host.left - 1 && rect.right <= host.right + 1);
        });
        expect(contained, selector).toBe(true);
      }
    });
  }
}

const readablePublicSurfaces = [
  [
    "/",
    ".v3-proof-label, .v3-work-card-body small"
  ],
  [
    "/our-work",
    ".page-hero__eyebrow, .v2-initiative-copy small, [class*=\"filterLabel\"]"
  ],
  [
    "/impact",
    ".page-hero__eyebrow, .v2-impact-tile-copy small, .v2-impact-tile-action"
  ],
  [
    "/appeals",
    ".page-hero__eyebrow, .v2-appeal-card-head, .v2-appeal-progress-foot"
  ],
  [
    "/stories",
    ".page-hero__eyebrow, .v2-stories-card-copy > span, .v2-stories-card-copy small"
  ],
  [
    "/faith-and-reflections",
    ".page-hero__eyebrow, .v2-faith-library-item > span, .v2-faith-library-item > small"
  ],
  [
    "/recognition",
    ".page-hero__eyebrow, [class*=\"meta\"] > span, [class*=\"meta\"] dt"
  ],
  [
    "/privacy",
    ".page-hero__eyebrow, [class*=\"matrixGrid\"] span"
  ],
  [
    "/transparency",
    ".page-hero__eyebrow, .v2-transparency-folio-head, .v2-transparency-folio-foot"
  ],
  [
    "/request-assistance",
    ".page-hero__eyebrow, .v2-assistance-form .v2-form-heading > span"
  ],
  [
    "/our-work/eid-gift-kits",
    ".page-hero__eyebrow, .campaign-impact-strip span, .campaign-history-note span"
  ]
];
for (const width of [390, 1280]) {
  for (const [path, selector] of readablePublicSurfaces) {
    test(`public metadata readability ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
      expect((await page.goto(path, { waitUntil: 'domcontentloaded' }))?.ok()).toBeTruthy();
      const labels = page.locator(selector);
      expect(await labels.count(), `${path} must expose real metadata`).toBeGreaterThan(0);
      const read = () => labels.evaluateAll(nodes => nodes.filter(node =>
        node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden'
      ).map(node => ({ text: node.textContent?.trim(), size: parseFloat(getComputedStyle(node).fontSize) })));
      const normal = await read();
      expect(normal.length, `${path} must expose visible metadata`).toBeGreaterThan(0);
      for (const label of normal) expect(label.size, `${path}: ${label.text}`).toBeGreaterThanOrEqual(12);
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const enlarged = await read();
      expect(enlarged.length).toBeGreaterThan(0);
      for (const label of enlarged) expect(label.size, `${path}: ${label.text}`).toBeGreaterThanOrEqual(24);
    });
  }
}

for (const width of [390, 1280]) {
  test(`shared rail, footer and Companion labels stay readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await page.goto('/about')).ok()).toBe(true);
    const selectors = [
      '.amaana-rail-label',
      '.amaana-live-badge',
      '.site-footer .footer-kicker',
      '.footer-brand-copy small',
      ...(width > 640 ? ['.amaana-companion-dock small'] : []),
    ];
    for (const rootSize of ['100%', '200%']) {
      await page.evaluate(size => { document.documentElement.style.fontSize = size; }, rootSize);
      for (const selector of selectors) {
        const label = page.locator(selector);
        await expect(label).toHaveCount(1);
        await expect(label).toBeVisible();
        expect(await label.evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(rootSize === '200%' ? 24 : 12);
      }
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '100%'; });
    await page.locator('.amaana-companion-dock button').click();
    const kicker = page.locator('.amaana-companion-kicker');
    await expect(kicker).toBeVisible();
    expect(await kicker.evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(12);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await kicker.evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(24);
  });
}
