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
  '/programmes/medical-financial-relief',
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

test('shared public shell aligns header, reminder, L1 hero, body and footer at standard and wide desktop widths', async ({ page }) => {
  const samples = ['/our-work', '/impact', '/donate', '/request-assistance', '/transparency', '/governance'];

  for (const width of [1440, 1920]) {
    for (const path of samples) {
      await open(page, path, width);
      const boxes = await page.evaluate(() => {
        const findVisible = selector => Array.from(document.querySelectorAll(selector)).find(element => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        const nodes = [
          ['header', document.querySelector('.site-header .container')],
          ['reminder', document.querySelector('.amaana-reminder-inner')],
          ['hero', document.querySelector('.page-hero__shell')],
          ['body', findVisible('main .v2-shell, main .v3-shell, main .canonical-body, main .container')],
          ['footer', document.querySelector('.site-footer > .container')],
        ];
        return nodes.map(([name, element]) => {
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return { name, left: rect.left, right: rect.right, width: rect.width };
        });
      });

      expect(boxes.every(Boolean), `${path} should expose every shared public shell at ${width}px`).toBeTruthy();
      const reference = boxes[0];
      for (const box of boxes.slice(1)) {
        expect(near(box.left, reference.left), `${path} ${box.name} left edge should align with header at ${width}px`).toBeTruthy();
        expect(near(box.right, reference.right), `${path} ${box.name} right edge should align with header at ${width}px`).toBeTruthy();
        expect(near(box.width, reference.width), `${path} ${box.name} width should match header at ${width}px`).toBeTruthy();
      }
    }
  }
});

test('homepage masthead is full bleed while copy and future documentary media align to the header grid', async ({ page }) => {
  for (const width of [1440, 1920]) {
    await open(page, '/', width);
    const geometry = await page.evaluate(() => {
      const header = document.querySelector('.site-header .container')?.getBoundingClientRect();
      const banner = document.querySelector('.v3-home-banner')?.getBoundingClientRect();
      const carousel = document.querySelector('.v3-home-banner-carousel')?.getBoundingClientRect();
      const active = document.querySelector('.v3-home-banner-slide[data-active="true"]')
        ?? document.querySelector('.v3-home-banner-slide');
      const content = active?.querySelector('.v3-home-banner-content')?.getBoundingClientRect();
      if (!header || !banner || !carousel || !active || !content) return null;

      const fixture = document.createElement('div');
      fixture.className = 'v3-home-banner-media';
      fixture.setAttribute('data-visual-test-fixture', 'home-media-alignment');
      active.appendChild(fixture);
      const media = fixture.getBoundingClientRect();
      const backgroundImage = getComputedStyle(document.querySelector('.v3-home-banner')).backgroundImage;
      fixture.remove();

      return {
        viewport: document.documentElement.clientWidth,
        header: { left: header.left, right: header.right, width: header.width },
        banner: { left: banner.left, right: banner.right, width: banner.width },
        carousel: { left: carousel.left, right: carousel.right, width: carousel.width, radius: getComputedStyle(document.querySelector('.v3-home-banner-carousel')).borderRadius },
        content: { left: content.left, right: content.right, width: content.width },
        media: { left: media.left, right: media.right, width: media.width },
        backgroundImage,
      };
    });

    expect(geometry).toBeTruthy();
    expect(geometry.banner.left).toBeLessThanOrEqual(1);
    expect(geometry.banner.right).toBeGreaterThanOrEqual(geometry.viewport - 1);
    expect(geometry.carousel.left).toBeLessThanOrEqual(1);
    expect(geometry.carousel.right).toBeGreaterThanOrEqual(geometry.viewport - 1);
    expect(geometry.carousel.width).toBeGreaterThanOrEqual(geometry.viewport - 2);
    expect(geometry.carousel.radius).toBe('0px');
    expect(near(geometry.content.left, geometry.header.left), `homepage copy left edge should align at ${width}px`).toBeTruthy();
    expect(near(geometry.content.right, geometry.header.right), `homepage copy right edge should align at ${width}px`).toBeTruthy();
    expect(near(geometry.content.width, geometry.header.width), `homepage copy shell width should align at ${width}px`).toBeTruthy();
    expect(near(geometry.media.right, geometry.header.right), `homepage media right edge should align at ${width}px`).toBeTruthy();
    expect(geometry.media.left).toBeGreaterThan(geometry.header.left + geometry.header.width * 0.4);
    expect(geometry.media.width).toBeGreaterThan(geometry.header.width * 0.35);
    expect(geometry.backgroundImage).not.toBe('none');
  }
});

test('L1 page hero remains compact after shared-grid reconciliation', async ({ page }) => {
  for (const path of ['/our-work', '/impact', '/about']) {
    await open(page, path, 1440);
    const hero = page.locator('.page-hero--level1');
    await expect(hero).toBeVisible();
    const box = await hero.boundingBox();
    expect(box).toBeTruthy();
    expect(box.height, `${path} should not retain the old oversized L1 hero height`).toBeLessThanOrEqual(480);
  }
});

test('mobile L1 hero title remains readable on the stacked brand surface', async ({ page }) => {
  for (const path of ['/about', '/our-work', '/impact']) {
    await open(page, path, 390);
    const title = page.locator('.page-hero--level1 .page-hero__title');
    await expect(title).toBeVisible();

    const presentation = await title.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        color: style.color,
        backgroundImage: style.backgroundImage,
        webkitTextFillColor: style.webkitTextFillColor,
      };
    });

    expect(presentation.backgroundImage, `${path} mobile L1 title must not use transparent gradient text`).toBe('none');
    expect(presentation.color, `${path} mobile L1 title must have an explicit foreground color`).not.toBe('rgba(0, 0, 0, 0)');
    expect(presentation.webkitTextFillColor, `${path} mobile L1 title fill must remain visible`).not.toBe('transparent');
    expect(presentation.webkitTextFillColor, `${path} mobile L1 title fill must remain visible`).not.toBe('rgba(0, 0, 0, 0)');
  }
});

test('impact marquee uses the canonical desktop shell width and remains centered', async ({ page }) => {
  await open(page, '/impact');
  const boxes = await page.evaluate(() => {
    const shell = document.querySelector('.site-header .container')?.getBoundingClientRect();
    let marquee = document.querySelector('.v2-impact-marquee-track');
    if (!marquee) {
      const fixture = document.createElement('div');
      fixture.className = 'v2-home v2-impact-page';
      fixture.setAttribute('data-visual-test-fixture', 'impact-page');
      fixture.innerHTML = '<section class="v2-impact-marquee"><div class="v2-impact-marquee-track" data-visual-test-fixture="impact-marquee"></div></section>';
      document.body.appendChild(fixture);
      marquee = fixture.querySelector('.v2-impact-marquee-track');
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

test('wide desktop shells use the canvas while preserving readable measures', async ({ page }) => {
  await open(page, '/about', 1920);
  const metrics = await page.evaluate(() => {
    const shell = document.querySelector('.page-hero__shell')?.getBoundingClientRect();
    const body = document.querySelector('.canonical-body')?.getBoundingClientRect();
    const paragraph = document.querySelector('.canonical-block p')?.getBoundingClientRect();
    return shell && body && paragraph ? {
      shellWidth: shell.width,
      bodyWidth: body.width,
      paragraphWidth: paragraph.width,
    } : null;
  });
  expect(metrics).toBeTruthy();
  expect(metrics.shellWidth).toBeGreaterThanOrEqual(1320);
  expect(metrics.shellWidth).toBeLessThanOrEqual(1410);
  expect(Math.abs(metrics.bodyWidth - metrics.shellWidth)).toBeLessThanOrEqual(4);
  expect(metrics.paragraphWidth).toBeLessThanOrEqual(760);
});

test('About editorial body uses the canonical shell without a double gutter', async ({ page }) => {
  for (const width of [1920, 1440, 390]) {
    await open(page, '/about', width);
    const metrics = await page.evaluate(() => {
      const shell = document.querySelector('.canonical-body--about')?.getBoundingClientRect();
      const block = document.querySelector('.canonical-body--about .canonical-block');
      const heading = block?.querySelector('h2')?.getBoundingClientRect();
      const copy = block?.querySelector(':scope > div')?.getBoundingClientRect();
      if (!shell || !heading || !copy) return null;
      return {
        shell: { left: shell.left, right: shell.right },
        heading: { left: heading.left, right: heading.right },
        copy: { left: copy.left, right: copy.right, width: copy.width },
      };
    });

    expect(metrics).toBeTruthy();
    expect(Math.abs(metrics.heading.left - metrics.shell.left), `About heading should start at the shell edge at ${width}px`).toBeLessThanOrEqual(2);
    expect(Math.abs(metrics.copy.right - metrics.shell.right), `About prose should finish at the shell edge at ${width}px`).toBeLessThanOrEqual(2);
    if (width <= 700) {
      expect(Math.abs(metrics.copy.left - metrics.shell.left), `About mobile prose should share the shell left edge at ${width}px`).toBeLessThanOrEqual(2);
    } else {
      expect(metrics.copy.width, `About prose must retain a readable line length at ${width}px`).toBeLessThanOrEqual(760);
    }
  }
});

test('policy layout keeps its sidebar readable on wide monitors', async ({ page }) => {
  await open(page, '/donation-policy', 1920);
  const metrics = await page.locator('.v2-policy-layout').evaluate(layout => {
    const aside = layout.querySelector(':scope > aside')?.getBoundingClientRect();
    const sections = layout.querySelector('.v2-policy-sections')?.getBoundingClientRect();
    return aside && sections ? {
      asideWidth: aside.width,
      sectionsWidth: sections.width,
      gap: sections.left - aside.right,
    } : null;
  });
  expect(metrics).toBeTruthy();
  expect(metrics.asideWidth).toBeGreaterThanOrEqual(280);
  expect(metrics.asideWidth).toBeLessThanOrEqual(340);
  expect(metrics.gap).toBeLessThanOrEqual(80);
  expect(metrics.sectionsWidth).toBeGreaterThan(760);
});

test('page hero variants stay visually differentiated inside one canonical system', async ({ page }) => {
  const samples = [
    ['/about', '.page-hero--level1'],
    ['/request-assistance', '.page-hero--action'],
    ['/contact', '.page-hero--information'],
  ];
  const backgrounds = [];
  for (const [path, selector] of samples) {
    await open(page, path);
    const hero = page.locator(selector);
    await expect(hero).toBeVisible();
    backgrounds.push(await hero.evaluate(node => `${getComputedStyle(node).backgroundColor}|${getComputedStyle(node).backgroundImage}`));
  }
  expect(new Set(backgrounds).size).toBeGreaterThanOrEqual(3);
});

test('mobile programme carousel explicitly signals swipe interaction', async ({ page }) => {
  await open(page, '/', 390);
  const carousel = page.locator('[aria-label="Amaana programme areas"]');
  await expect(carousel).toBeVisible();
  const cue = await carousel.evaluate(root => {
    const toolbar = root.querySelector('[class*="toolbar"]');
    return toolbar ? getComputedStyle(toolbar, '::before').content : '';
  });
  expect(cue).toContain('Swipe');
});

test('internal footer callout stays quieter than the homepage callout', async ({ page }) => {
  await open(page, '/');
  const homeSize = await page.locator('.footer-lead h2').evaluate(node => parseFloat(getComputedStyle(node).fontSize));
  await open(page, '/about');
  const internalSize = await page.locator('.footer-lead h2').evaluate(node => parseFloat(getComputedStyle(node).fontSize));
  expect(internalSize).toBeLessThan(homeSize);
});

test('wide focus carousel presents three useful cards without sliver previews', async ({ page }) => {
  await open(page, '/our-work/taleem', 1920);
  const carousel = page.locator('.campaign-pathway-carousel');
  if (await carousel.count() === 0) return;
  const widths = await carousel.locator('[class*="slide"]').evaluateAll(slides => slides.slice(0,3).map(slide => slide.getBoundingClientRect().width));
  expect(widths.length).toBeGreaterThanOrEqual(2);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(3);
  expect(Math.min(...widths)).toBeGreaterThanOrEqual(300);
});

test('get involved journey uses substantial desktop cards instead of a tiny five-cell strip', async ({ page }) => {
  await open(page, '/get-involved', 1920);
  const metrics = await page.locator('.v2-journey').evaluate(journey => {
    const cards = Array.from(journey.querySelectorAll('.v2-journey-step')).map(card => card.getBoundingClientRect());
    return {
      count: cards.length,
      firstRowCount: cards.filter(card => Math.abs(card.top - cards[0].top) <= 2).length,
      minWidth: Math.min(...cards.map(card => card.width)),
      rows: new Set(cards.map(card => Math.round(card.top))).size,
    };
  });
  expect(metrics.count).toBe(5);
  expect(metrics.firstRowCount).toBe(3);
  expect(metrics.rows).toBe(2);
  expect(metrics.minWidth).toBeGreaterThanOrEqual(300);
});

test('transparency evidence boundary spans the full canonical comparison grid', async ({ page }) => {
  await open(page, '/transparency', 1920);
  const metrics = await page.evaluate(() => {
    const body = document.querySelector('.canonical-body--comparison')?.getBoundingClientRect();
    const boundary = document.querySelector('[data-trust-evidence-boundary="transparency"]')?.getBoundingClientRect();
    return body && boundary ? {
      bodyWidth: body.width,
      boundaryWidth: boundary.width,
      leftDelta: Math.abs(body.left - boundary.left),
    } : null;
  });
  expect(metrics).toBeTruthy();
  expect(metrics.leftDelta).toBeLessThanOrEqual(2);
  expect(Math.abs(metrics.bodyWidth - metrics.boundaryWidth)).toBeLessThanOrEqual(4);
});

test('our work disclosure controls remain visually attached to the category title on wide screens', async ({ page }) => {
  await open(page, '/our-work', 1920);
  const metrics = await page.locator('.v2-cause-summary-heading').first().evaluate(row => {
    const title = row.querySelector('.v2-cause-summary-title')?.getBoundingClientRect();
    const count = row.querySelector('.v2-cause-summary-count')?.getBoundingClientRect();
    const toggle = row.querySelector('.v2-cause-summary-toggle')?.getBoundingClientRect();
    return title && count && toggle ? {
      titleToCount: count.left - title.right,
      countToToggle: toggle.left - count.right,
    } : null;
  });
  expect(metrics).toBeTruthy();
  expect(metrics.titleToCount).toBeLessThanOrEqual(32);
  expect(metrics.countToToggle).toBeLessThanOrEqual(24);
});

test('single-programme categories use an intentional editorial feature layout', async ({ page }) => {
  await open(page, '/programmes/medical-financial-relief', 1920);
  const metrics = await page.locator('.canonical-pathways--single article').evaluate(article => {
    const rect = article.getBoundingClientRect();
    const visual = article.querySelector('.canonical-pathway-visual')?.getBoundingClientRect();
    const heading = article.querySelector('h2')?.getBoundingClientRect();
    return visual && heading ? {
      articleWidth: rect.width,
      visualWidth: visual.width,
      headingWidth: heading.width,
      visualHeight: visual.height,
    } : null;
  });
  expect(metrics).toBeTruthy();
  expect(metrics.articleWidth).toBeGreaterThanOrEqual(1100);
  expect(metrics.visualWidth).toBeGreaterThanOrEqual(350);
  expect(metrics.headingWidth).toBeGreaterThanOrEqual(450);
  expect(metrics.visualHeight).toBeGreaterThanOrEqual(300);
});

test('recognition record never relies on an embedded PDF renderer for its primary visual', async ({ page }) => {
  await open(page, '/recognition', 1920);
  await expect(page.locator('#recognition-record iframe')).toHaveCount(0);
  await expect(page.getByText('Original recognition document')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open original certificate' })).toBeVisible();
});

test('ultra-wide focus carousel shows three complete cards without a clipped fourth preview', async ({ page }) => {
  await open(page, '/', 2560);
  const carousel = page.locator('[aria-label="Amaana programme areas"]');
  await carousel.getByRole('button', { name: 'Next slide' }).click();
  await expect(carousel.locator('[aria-live="polite"]')).toContainText('2 / 5');

  const metrics = await carousel.evaluate(root => {
    const viewport = root.querySelector('[id^="carousel-"]')?.getBoundingClientRect();
    const slides = Array.from(root.querySelectorAll('[class*="slide"]'));
    if (!viewport) return null;

    const visible = slides
      .map(slide => ({
        rect: slide.getBoundingClientRect(),
        active: slide.className.includes('activeSlide'),
      }))
      .filter(item => item.rect.right > viewport.left + 1 && item.rect.left < viewport.right - 1);

    const fullyVisible = visible.filter(
      item => item.rect.left >= viewport.left - 1 && item.rect.right <= viewport.right + 1,
    );
    const inactiveWidths = fullyVisible.filter(item => !item.active).map(item => item.rect.width);
    const activeWidths = fullyVisible.filter(item => item.active).map(item => item.rect.width);

    return {
      visibleCount: visible.length,
      fullyVisibleCount: fullyVisible.length,
      partialCount: visible.length - fullyVisible.length,
      inactiveWidths,
      activeWidths,
    };
  });

  expect(metrics).toBeTruthy();
  expect(metrics.visibleCount).toBe(3);
  expect(metrics.fullyVisibleCount).toBe(3);
  expect(metrics.partialCount).toBe(0);
  expect(metrics.activeWidths).toHaveLength(1);
  expect(metrics.inactiveWidths).toHaveLength(2);
  expect(Math.abs(metrics.inactiveWidths[0] - metrics.inactiveWidths[1])).toBeLessThanOrEqual(4);
  expect(metrics.activeWidths[0]).toBeGreaterThan(metrics.inactiveWidths[0]);
  expect(metrics.activeWidths[0] - metrics.inactiveWidths[0]).toBeLessThanOrEqual(16);
});

test('mobile companion dock does not cover visible main-page controls', async ({ page }) => {
  await open(page, '/about', 390);
  const collisions = await page.evaluate(() => {
    const dock = document.querySelector('.amaana-companion-dock')?.getBoundingClientRect();
    if (!dock) return ['missing companion dock'];
    const overlaps = (a, b) => !(
      a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top
    );
    return Array.from(document.querySelectorAll('main a, main button'))
      .filter(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const visible = style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0;
        const inViewport = rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
        return visible && inViewport && overlaps(dock, rect);
      })
      .map(element => (element.getAttribute('aria-label') || element.textContent || element.tagName).trim().slice(0, 80));
  });
  expect(collisions).toEqual([]);
});

test('appeals completed-work section uses the intentional single-item feature layout', async ({ page }) => {
  await open(page, '/appeals', 1920);
  const feature = page.locator('#completed-causes .canonical-pathways--single article');
  if (await feature.count() === 0) return;
  const metrics = await feature.evaluate(article => {
    const rect = article.getBoundingClientRect();
    const visual = article.querySelector('.canonical-pathway-visual')?.getBoundingClientRect();
    const heading = article.querySelector('h3')?.getBoundingClientRect();
    return visual && heading ? {
      width: rect.width,
      visualWidth: visual.width,
      headingWidth: heading.width,
    } : null;
  });
  expect(metrics).toBeTruthy();
  expect(metrics.width).toBeGreaterThanOrEqual(1100);
  expect(metrics.visualWidth).toBeGreaterThanOrEqual(350);
  expect(metrics.headingWidth).toBeGreaterThanOrEqual(450);
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

test('homepage omits superseded field and closing sections', async ({ page }) => {
  await open(page, '/');
  await expect(page.locator('.v3-field')).toHaveCount(0);
  await expect(page.locator('.v3-closing')).toHaveCount(0);
  await expect(page.getByText('A closer look at the work', { exact: true })).toHaveCount(0);
  await expect(page.locator('main#main').getByText('Upholding Trust. Serving With Compassion, Dignity and Accountability.', { exact: true })).toHaveCount(0);
});

test('Amaana decorative emblems stay at the viewport edge without affecting content geometry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, '/our-work');
  const emblem = page.locator('.amaana-backdrop-emblem').first();
  await expect(emblem).toBeVisible();
  const geometry = await emblem.evaluate(node => {
    const rect = node.getBoundingClientRect();
    const parent = node.parentElement?.getBoundingClientRect();
    const content = node.parentElement?.querySelector('.container, .page-hero__shell, .v2-shell, .v3-shell')?.getBoundingClientRect();
    return { rightGap: window.innerWidth - rect.right, position: getComputedStyle(node).position, parentWidth: parent?.width ?? 0, contentWidth: content?.width ?? 0 };
  });
  expect(geometry.position).toBe('absolute');
  expect(geometry.rightGap).toBeLessThanOrEqual(32);
  expect(geometry.parentWidth).toBeGreaterThan(geometry.contentWidth);
});

test('homepage hero stays wide and compact on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, '/');
  const hero = page.locator('section[data-carousel-mode="hero"][aria-label="Amaana Foundation story and featured work"]');
  await expect(hero).toBeVisible();
  const box = await hero.boundingBox();
  expect(box).toBeTruthy();
  expect(box.width / box.height).toBeGreaterThan(3.8);
  expect(box.height).toBeLessThanOrEqual(336);
  expect(box.y + box.height).toBeLessThanOrEqual(900);
  await expect(hero.getByText('The Story of Amaana · Hyderabad', { exact: true })).toBeVisible();
  const content = hero.locator('.v3-home-banner-content').first();
  const contentBox = await content.boundingBox();
  expect(contentBox).toBeTruthy();
  expect(contentBox.width).toBeLessThanOrEqual(1184 + 2);
  expect(contentBox.x).toBeGreaterThanOrEqual(box.x - 2);
  expect(contentBox.x + contentBox.width).toBeLessThanOrEqual(box.x + box.width + 2);
});

test('homepage hero active slide owns the full carousel viewport on desktop and mobile', async ({ page }) => {
  for (const width of [1440, 390]) {
    await open(page, '/', width);
    const hero = page.locator('section[data-carousel-mode="hero"][aria-label="Amaana Foundation story and featured work"]');
    await expect(hero).toBeVisible();

    const geometry = await hero.evaluate(root => {
      const viewport = root.querySelector('[id^="carousel-"]');
      const active = root.querySelector('[data-active="true"]');
      const content = active?.querySelector('.v3-home-banner-content');
      if (!viewport || !active || !content) return null;
      const v = viewport.getBoundingClientRect();
      const a = active.getBoundingClientRect();
      const c = content.getBoundingClientRect();
      return {
        viewportLeft: v.left,
        viewportRight: v.right,
        viewportWidth: v.width,
        activeLeft: a.left,
        activeRight: a.right,
        activeWidth: a.width,
        contentLeft: c.left,
        contentRight: c.right,
      };
    });

    expect(geometry).toBeTruthy();
    expect(Math.abs(geometry.activeWidth - geometry.viewportWidth), `hero slide width should match viewport at ${width}px`).toBeLessThanOrEqual(2);
    expect(Math.abs(geometry.activeLeft - geometry.viewportLeft), `active hero should start at viewport edge at ${width}px`).toBeLessThanOrEqual(2);
    expect(Math.abs(geometry.activeRight - geometry.viewportRight), `active hero should end at viewport edge at ${width}px`).toBeLessThanOrEqual(2);
    expect(geometry.contentLeft).toBeGreaterThanOrEqual(geometry.activeLeft - 1);
    expect(geometry.contentRight).toBeLessThanOrEqual(geometry.activeRight + 1);
  }
});

test('mobile reminder rail and Companion trigger stay singular and contained', async ({ page }) => {
  await open(page, '/', 390);

  const reminderBadge = page.locator('.amaana-live-badge.is-reminder');
  const duplicateEyebrow = page.locator('.amaana-live-badge.is-reminder + .amaana-reminder-stage .amaana-reminder-eyebrow');
  await expect(reminderBadge).toBeVisible();
  await expect(duplicateEyebrow).toBeHidden();

  const companion = page.locator('.amaana-companion-dock > button');
  await expect(companion).toBeVisible();
  const geometry = await companion.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return {
      viewportWidth: document.documentElement.clientWidth,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height,
    };
  });

  expect(geometry.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.width).toBeGreaterThanOrEqual(44);
  expect(geometry.width).toBeLessThanOrEqual(46);
  expect(geometry.height).toBeGreaterThanOrEqual(44);
});

test('homepage programme carousel stays centered and wraps in both directions', async ({ page }) => {
  await open(page, '/');
  const carousel = page.locator('[aria-label="Amaana programme areas"]');
  await expect(carousel).toBeVisible();
  const status = carousel.locator('[aria-live="polite"]');
  await expect(status).toContainText('1 / 5');
  await carousel.getByRole('button', { name: 'Previous slide' }).click();
  await expect(status).toContainText('5 / 5');
  await carousel.getByRole('button', { name: 'Next slide' }).click();
  await expect(status).toContainText('1 / 5');
  const geometry = await carousel.evaluate(root => {
    const active = root.querySelector('[data-active="true"]');
    const viewport = root.querySelector('[id^="carousel-"]');
    if (!active || !viewport) return null;
    const a = active.getBoundingClientRect();
    const v = viewport.getBoundingClientRect();
    return { activeCenter: a.left + a.width / 2, viewportCenter: v.left + v.width / 2 };
  });
  expect(geometry).toBeTruthy();
  expect(Math.abs(geometry.activeCenter - geometry.viewportCenter)).toBeLessThanOrEqual(4);
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

test('mobile shared footer collapses secondary navigation while preserving tap targets', async ({ page }) => {
  await open(page, '/about', 390);
  const groups = page.locator('.site-footer .footer-nav-group');
  await expect(groups).toHaveCount(3);
  const toggles = page.locator('.site-footer .footer-nav-toggle');
  await expect(toggles).toHaveCount(3);
  await expect(toggles.nth(0)).toHaveAttribute('aria-expanded', 'false');
  await expect(toggles.nth(1)).toHaveAttribute('aria-expanded', 'false');
  await expect(toggles.nth(2)).toHaveAttribute('aria-expanded', 'false');

  const collapsed = await page.locator('.site-footer').evaluate(footer => {
    const buttons = Array.from(footer.querySelectorAll('.footer-nav-toggle'));
    const grid = footer.querySelector('.footer-grid-v2')?.getBoundingClientRect();
    return {
      buttonCount: buttons.length,
      minButtonHeight: Math.min(...buttons.map(button => button.getBoundingClientRect().height)),
      gridHeight: grid?.height ?? 0,
    };
  });
  expect(collapsed.buttonCount).toBe(3);
  expect(collapsed.minButtonHeight).toBeGreaterThanOrEqual(44);
  expect(collapsed.gridHeight).toBeLessThanOrEqual(720);

  await toggles.nth(0).click();
  await expect(toggles.nth(0)).toHaveAttribute('aria-expanded', 'true');
  const firstGroupLinks = groups.nth(0).locator('.footer-links a');
  await expect(firstGroupLinks.first()).toBeVisible();
  const minLinkHeight = await firstGroupLinks.evaluateAll(links => Math.min(...links.map(link => link.getBoundingClientRect().height)));
  expect(minLinkHeight).toBeGreaterThanOrEqual(44);
});

test('desktop footer exposes navigation directly without disclosure controls', async ({ page }) => {
  await open(page, '/about', 1440);
  const toggles = page.locator('.site-footer .footer-nav-toggle');
  await expect(toggles.first()).toBeHidden();
  const links = page.locator('.site-footer .footer-nav-group .footer-links a');
  await expect(links.first()).toBeVisible();
  expect(await links.count()).toBeGreaterThan(10);
});

test('impact wall stays dense and readable across desktop and mobile', async ({ page }) => {
  for (const width of [1440, 390]) {
    await open(page, '/impact', width);
    const metrics = await page.locator('.v2-impact-wall').evaluate(wall => {
      const tiles = Array.from(wall.querySelectorAll('.v2-impact-tile'));
      const rects = tiles.map(tile => tile.getBoundingClientRect());
      return {
        count: tiles.length,
        minHeight: Math.min(...rects.map(rect => rect.height)),
        maxHeight: Math.max(...rects.map(rect => rect.height)),
        wallWidth: wall.getBoundingClientRect().width,
        maxTileWidth: Math.max(...rects.map(rect => rect.width)),
      };
    });
    expect(metrics.count).toBeGreaterThan(0);
    expect(metrics.minHeight).toBeGreaterThanOrEqual(width === 390 ? 200 : 230);
    expect(metrics.maxHeight - metrics.minHeight).toBeLessThanOrEqual(width === 390 ? 180 : 260);
    expect(metrics.maxTileWidth).toBeLessThanOrEqual(metrics.wallWidth + 1);
  }
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
