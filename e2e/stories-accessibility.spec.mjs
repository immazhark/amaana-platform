import { expect, test } from '@playwright/test';

// Inject privacy-safe, deterministic text into the actual Stories route so these
// checks do not depend on beneficiary stories being published in the database.
function contrast(foreground, background) {
  const luminance = color => {
    const channels = color.startsWith('#')
      ? [1, 3, 5].map(index => Number.parseInt(color.slice(index, index + 2), 16))
      : color.match(/[0-9.]+/g).slice(0, 3).map(Number);
    const linear = channels.map(value => {
      const normalized = value / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

for (const width of [390, 1440]) {
  for (const scale of [1, 2]) {
    test(`Stories audited text remains legible at ${width}px and ${scale * 100}% text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
      const response = await page.goto('/stories', { waitUntil: 'load' });
      expect(response?.ok()).toBe(true);
      const actual = await page.evaluate(scale => {
        document.documentElement.style.fontSize = `${16 * scale}px`;
        const container = document.createElement('div');
        container.className = 'v2-home';
        container.setAttribute('data-a11y-stories-fixture', '');
        container.innerHTML = `
          <section class="v2-stories-feature">
            <div class="v2-stories-feature-copy"><small>FIELD JOURNAL</small><h2>Stories shared with dignity</h2><p>Every account is reviewed before it is shared with the community.</p></div>
          </section>
          <div class="v2-stories-card-copy"><span>FIELD ACCOUNT</span><h3>Our community work</h3><small>READ THE STORY</small></div>
          <div class="v2-stories-feature-placeholder"><strong>Community stories shared with care</strong></div>
          <div class="v2-stories-single-note"><span>ARCHIVE</span></div>
          <div class="v2-story-detail-heading"><h1>A story of continued care</h1></div>
          <div class="v2-story-detail-body-grid"><aside><h2>How support was provided</h2></aside></div>
          <div class="v2-story-detail-ethic"><h2>Privacy comes first</h2></div>
          <div class="v2-story-detail-context"><small>DOCUMENTED IMPACT</small><strong>Documented community assistance</strong></div>
          <div class="v2-story-detail-no-media"><strong>Support stories without revealing faces</strong></div>
          <div class="v2-story-source-note"><span>SOURCE NOTE</span></div>
        `;
        document.body.append(container);
        const headingSelectors = [
          '.v2-stories-feature-copy h2',
          '.v2-stories-card-copy h3',
          '.v2-story-detail-heading h1',
          '.v2-story-detail-body-grid>aside h2',
          '.v2-story-detail-ethic h2',
          '.v2-stories-feature-placeholder strong',
          '.v2-story-detail-context>strong',
          '.v2-story-detail-no-media strong',
        ];
        const headings = headingSelectors.map(selector => {
          const style = getComputedStyle(container.querySelector(selector));
          return { selector, ratio: parseFloat(style.lineHeight) / parseFloat(style.fontSize), fontFamily: style.fontFamily };
        });
        const checks = [
          ['.v2-stories-feature-copy small', '#f3ecdf'],
          ['.v2-stories-feature-copy p', '#f3ecdf'],
          ['.v2-stories-card-copy>span', '#fffdf8'],
          ['.v2-stories-card-copy small', '#fffdf8'],
          ['.v2-stories-single-note span', '#fffdf8'],
          ['.v2-story-source-note span', '#fffdf8'],
        ].map(([selector, background]) => {
          const style = getComputedStyle(container.querySelector(selector));
          return { selector, foreground: style.color, background };
        });
        container.remove();
        document.documentElement.style.removeProperty('font-size');
        return { headings, checks };
      }, scale);
      for (const heading of actual.headings) {
        expect(heading.ratio, heading.selector).toBeGreaterThanOrEqual(1.11);
        expect(heading.ratio, heading.selector).toBeLessThanOrEqual(1.13);
        expect(heading.fontFamily, heading.selector).not.toBe('"Times New Roman"');
      }
      for (const item of actual.checks) {
        expect(contrast(item.foreground, item.background), item.selector).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
}


test('Stories motion respects reduced-motion preference even after late polish styles', async ({ page }) => {
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto('/stories', { waitUntil: 'load' });
  expect(response?.ok()).toBe(true);
  await page.evaluate(() => {
    const fixture = document.createElement('div');
    fixture.className = 'v2-home';
    fixture.dataset.storiesMotionFixture = 'true';
    fixture.innerHTML = '<div class="v2-stories-card">Card</div><div class="v2-stories-feature-media"><figure class="v2-media-item"><img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="><video muted></video></figure></div><div class="v2-stories-card-media"><figure class="v2-media-item"><img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="><video muted></video></figure></div>';
    document.body.append(fixture);
  });
  const read = () => page.evaluate(() => {
    const fixture = document.querySelector('[data-stories-motion-fixture]');
    return [...fixture.querySelectorAll('.v2-stories-card, .v2-stories-feature-media img, .v2-stories-feature-media video, .v2-stories-card-media img, .v2-stories-card-media video')]
      .map(element => getComputedStyle(element).transitionDuration);
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await read()).length === 5 && (await read()).every(value =>
    value.split(',').every(duration => Number.parseFloat(duration.trim()) === 0)
  )).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(async () => (await read()).length === 5 && (await read()).every(value =>
    value.split(',').some(duration => Number.parseFloat(duration.trim()) > 0)
  )).toBe(true);
});

test('Stories card geometry keeps late cascade winners at desktop and mobile widths', async ({ page }) => {
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto('/stories', { waitUntil: 'load' });
  expect(response?.ok()).toBe(true);
  await page.evaluate(() => {
    const fixture = document.createElement('div');
    fixture.className = 'v2-home';
    fixture.dataset.storiesGeometryFixture = 'true';
    fixture.innerHTML = '<div class="v2-stories-grid"><article class="v2-stories-card"><div class="v2-stories-card-media"></div></article><article class="v2-stories-card wide"><div class="v2-stories-card-media"></div></article></div>';
    document.body.append(fixture);
  });
  for (const width of [390, 620, 900, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const measured = await page.evaluate(() => {
      const fixture = document.querySelector('[data-stories-geometry-fixture]');
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const card = fixture.querySelector('.v2-stories-card');
      const wide = fixture.querySelector('.v2-stories-card.wide');
      const media = fixture.querySelector('.v2-stories-card-media');
      return {
        rem,
        cardMin: parseFloat(getComputedStyle(card).minHeight),
        wideMin: parseFloat(getComputedStyle(wide).minHeight),
        mediaMin: getComputedStyle(media).minHeight,
      };
    });
    expect(measured.cardMin / measured.rem, `ordinary card at ${width}px`).toBeCloseTo(20, 2);
    expect(measured.wideMin / measured.rem, `wide card at ${width}px`).toBeCloseTo(25, 2);
    if (width <= 620) {
      expect(parseFloat(measured.mediaMin) / measured.rem, `media at ${width}px`).toBeCloseTo(15, 2);
    }
  }
});
