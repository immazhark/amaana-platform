import { expect, test } from '@playwright/test';

// Inject privacy-safe, deterministic text into the actual Stories route so these
// checks do not depend on beneficiary stories being published in the database.
function contrast(foreground, background) {
  const luminance = color => {
    const channels = color.match(/[\\d.]+/g).slice(0, 3).map(Number);
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
          <div class="v2-stories-single-note"><span>ARCHIVE</span></div>
          <div class="v2-story-detail-heading"><h1>A story of continued care</h1></div>
          <div class="v2-story-detail-body-grid"><aside><h2>How support was provided</h2></aside></div>
          <div class="v2-story-detail-ethic"><h2>Privacy comes first</h2></div>
          <div class="v2-story-detail-context"><small>DOCUMENTED IMPACT</small></div>
          <div class="v2-story-source-note"><span>SOURCE NOTE</span></div>
        `;
        document.body.append(container);
        const headingSelectors = [
          '.v2-stories-feature-copy h2',
          '.v2-stories-card-copy h3',
          '.v2-story-detail-heading h1',
          '.v2-story-detail-body-grid>aside h2',
          '.v2-story-detail-ethic h2',
        ];
        const headings = headingSelectors.map(selector => {
          const style = getComputedStyle(container.querySelector(selector));
          return { selector, ratio: parseFloat(style.lineHeight) / parseFloat(style.fontSize) };
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
      }
      for (const item of actual.checks) {
        expect(contrast(item.foreground, item.background), item.selector).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
}
