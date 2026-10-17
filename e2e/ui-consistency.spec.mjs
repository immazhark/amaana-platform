import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`light banners preserve legible confirmation and Home interactions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    for (const path of ['/request-assistance/received', '/donations/invalid/acknowledgement']) {
      await page.goto(path);
      const heading = page.locator('main h1');
      await expect(heading).toBeVisible();
      const style = await heading.evaluate(node => ({ color: getComputedStyle(node).color, size: parseFloat(getComputedStyle(node).fontSize), overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
      expect(style.color).toBe('rgb(18, 34, 57)');
      expect(style.size).toBeLessThanOrEqual(width < 600 ? 61 : 83);
      expect(style.overflow).toBe(false);
      if (path.includes('received')) {
        const steps = page.locator('.v2-state-steps');
        const panel = await steps.evaluate(node => ({ background: getComputedStyle(node).backgroundColor, color: getComputedStyle(node).color }));
        expect(panel.background).not.toMatch(/rgba\(.*0\.04\)/);
        expect(panel.color).toBe('rgb(255, 253, 248)');
        const audit = await new AxeBuilder({ page }).include('.v2-state-hero').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
      }
    }
    await page.goto('/contact');
    const social = page.locator('.v2-contact-social-section');
    expect(await social.evaluate(node => getComputedStyle(node).backgroundImage)).toContain("amaana-lattice-tile.svg");
    const geometry = await social.evaluate(node => {
      const title = node.querySelector('h2').getBoundingClientRect();
      const subtitle = node.querySelector('.v2-section-intro').getBoundingClientRect();
      return { titleRight: title.right, titleBottom: title.bottom, subtitleLeft: subtitle.left, subtitleTop: subtitle.top };
    });
    if (width > 900) expect(geometry.subtitleLeft).toBeGreaterThan(geometry.titleRight);
    else expect(geometry.subtitleTop).toBeGreaterThan(geometry.titleBottom);
    const contactAudit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(contactAudit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    await page.goto('/browser-acceptance/home-hero');
    const action = page.locator('.v3-home-banner-actions .page-hero__button--secondary').first();
    await action.hover();
    await expect.poll(() => action.evaluate(node => getComputedStyle(node).color)).toBe('rgb(29, 49, 80)');
    await action.focus();
    await expect.poll(() => action.evaluate(node => getComputedStyle(node).color)).toBe('rgb(29, 49, 80)');
  });
}

for (const width of [390, 1440]) {
  test(`faith editorial body uses the approved geometric backdrop at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    expect((await page.goto('/faith-and-reflections')).ok()).toBe(true);
    const surface = page.locator('.v2-faith-standard');
    expect(await surface.evaluate(node => getComputedStyle(node).backgroundImage)).toContain('amaana-lattice-tile.svg');
    expect(await surface.evaluate(node => getComputedStyle(node).backgroundRepeat)).toBe('no-repeat, repeat');
    expect(await page.locator('.v2-faith-action').evaluate(node => getComputedStyle(node).backgroundImage)).toMatch(/^url\(.*amaana-lattice-tile/);
  });
}

for (const width of [390, 1440]) {
  test(`evidence closing layouts and section spacing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ['/impact', '/our-work']) {
      expect((await page.goto(path)).ok()).toBe(true);
      const closing = page.locator('main section').filter({ has: page.getByText(path === '/impact' ? 'The evidence chain' : 'Follow the trail', { exact: true }) });
      const geometry = await closing.evaluate(node => {
        const shell = node.querySelector('.v2-shell');
        const first = shell.children[0].getBoundingClientRect();
        const second = shell.children[1].getBoundingClientRect();
        return { firstRight: first.right, firstBottom: first.bottom, secondLeft: second.left, secondTop: second.top, background: getComputedStyle(node).backgroundImage };
      });
      expect(geometry.background).toMatch(/^url\(.*amaana-lattice-tile/);
      if (width > 900) expect(geometry.secondLeft).toBeGreaterThan(geometry.firstRight);
      else expect(geometry.secondTop).toBeGreaterThan(geometry.firstBottom);
      if (path === '/impact') {
        const gap = await page.evaluate(() => document.querySelector('#impact-wall-title').getBoundingClientRect().top - document.querySelector('[data-trust-evidence-boundary]').getBoundingClientRect().bottom);
        expect(gap).toBeGreaterThanOrEqual(48);
        await expect(page.locator('[data-trust-evidence-boundary] .card')).toHaveCount(3);
      }
    }
    expect((await page.goto('/transparency')).ok()).toBe(true);
    const boundary = page.locator('[data-trust-evidence-boundary="transparency"]');
    await expect(boundary.locator('.card')).toHaveCount(3);
    await expect(boundary).toContainText('Proofs that remain outside the public site');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  });
}

for (const width of [390, 1440]) {
  test(`R-026 text actions preserve AA contrast on light and dark contexts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about', { waitUntil: 'domcontentloaded' });
    const samples = await page.evaluate(() => {
      const cases = [
        { context: 'unscoped', selector: '', background: '#fffdf8' },
        { context: 'admin-content', selector: 'admin-content', background: '#f4f6f9' },
        { context: 'admin-sidebar', selector: 'admin-sidebar', background: '#122239' },
      ];
      const channels = color => (color.match(/[0-9.]+/g) ?? []).slice(0, 3).map(Number);
      const luminance = color => {
        const [r, g, b] = channels(color).map(value => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      return cases.map(({ context, selector, background }) => {
        const host = document.createElement('div');
        host.className = selector;
        host.style.backgroundColor = background;
        const button = document.createElement('button');
        button.className = 'text-button';
        button.textContent = 'Test text action';
        host.append(button);
        document.body.append(host);
        const foreground = getComputedStyle(button).color;
        const backdrop = getComputedStyle(host).backgroundColor;
        host.remove();
        const a = luminance(foreground);
        const b = luminance(backdrop);
        return { context, contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
      });
    });
    for (const sample of samples) expect(sample.contrast, sample.context).toBeGreaterThanOrEqual(4.5);
  });
}


for (const width of [390, 1440]) {
  for (const scale of [100, 200]) {
    test(`R-026 single-story archive label meets AA at ${width}px and ${scale}% text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
      await page.addInitScript(percent => {
        const apply = () => {
          const style = document.createElement('style');
          style.textContent = `html:root { font-size: ${percent}% !important; }`;
          document.head.appendChild(style);
        };
        if (document.head) apply();
        else document.addEventListener('DOMContentLoaded', apply, { once: true });
      }, scale);
      expect((await page.goto('/stories', { waitUntil: 'load' }))?.ok()).toBe(true);
      // Exercise the real stylesheet's one-story state even when the seeded archive has zero or multiple stories.
      await page.evaluate(() => {
        const host = document.createElement('section');
        host.dataset.contrastFixture = 'single-story';
        host.style.backgroundColor = 'var(--af-color-canvas)';
        const note = document.createElement('div');
        note.className = 'v2-stories-single-note';
        const label = document.createElement('span');
        label.textContent = 'Archive beginning';
        note.appendChild(label);
        host.appendChild(note);
        document.querySelector('main').appendChild(host);
      });
      await expect.poll(() => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))).toBe(16 * scale / 100);
      const label = page.locator('[data-contrast-fixture="single-story"] span');
      await expect(label).toBeVisible();
      const metrics = await label.evaluate(node => {
        const rgb = value => value.match(/[\d.]+/g).map(Number);
        const composite = (foreground, background) => {
          const alpha = foreground[3] ?? 1;
          return foreground.slice(0, 3).map((channel, index) => channel * alpha + background[index] * (1 - alpha));
        };
        const luminance = color => color.map(channel => {
          const value = channel / 255;
          return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
        }).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
        const style = getComputedStyle(node);
        const host = node.closest('[data-contrast-fixture]');
        const background = composite(rgb(getComputedStyle(node.parentElement).backgroundColor), rgb(getComputedStyle(host).backgroundColor));
        const ink = luminance(composite(rgb(style.color), background));
        const paper = luminance(background);
        return { ratio: (Math.max(ink, paper) + .05) / (Math.min(ink, paper) + .05), size: parseFloat(style.fontSize) };
      });
      expect(metrics.ratio).toBeGreaterThanOrEqual(4.5);
      expect(metrics.size).toBeGreaterThanOrEqual(12 * scale / 100);
    });
  }
}
