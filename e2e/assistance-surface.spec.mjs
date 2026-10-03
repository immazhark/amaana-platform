import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`private intake has continuous artwork and aligned guidance at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    expect((await page.goto('/request-assistance')).ok()).toBe(true);
    const before = page.locator('.v2-assistance-before');
    const surface = await before.evaluate(node => {
      const style = getComputedStyle(node);
      const heading = node.querySelector('h2').getBoundingClientRect();
      const copy = node.querySelector('.v2-section-intro').getBoundingClientRect();
      return { image: style.backgroundImage, repeat: style.backgroundRepeat, size: style.backgroundSize, heading: { right: heading.right, bottom: heading.bottom }, copy: { left: copy.left, top: copy.top } };
    });
    // A repeated colour gradient created visible square bands; only the lattice may tile.
    expect(surface.image).toMatch(/^url\(.*amaana-lattice-tile/);
    expect(surface.repeat).toBe('repeat, no-repeat');
    expect(surface.size).toBe('104px 104px, 100% 100%');
    if (width > 900) expect(surface.copy.left).toBeGreaterThan(surface.heading.right);
    else expect(surface.copy.top).toBeGreaterThan(surface.heading.bottom);
    await expect(before).toContainText('Uploads remain private.');
    const after = await page.locator('.v2-assistance-after').evaluate(node => ({ image: getComputedStyle(node).backgroundImage, repeat: getComputedStyle(node).backgroundRepeat }));
    expect(after.image).toContain('amaana-lattice-tile.svg');
    expect(after.repeat).toBe('no-repeat, repeat');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  });
}

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`intake progress stays readable and actions align through every step at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    expect((await page.goto('/request-assistance')).ok()).toBe(true);
    const progress = page.getByRole('navigation', { name: 'Assistance request progress' });
    for (let step = 1; step <= 4; step++) {
      const fieldset = page.locator(`[data-assistance-step="${step}"]`);
      await expect(fieldset).toBeVisible();
      await expect(progress.locator('[aria-current="step"]')).toHaveText(new RegExp(`0${step}`));
      const labels = await progress.locator('button').evaluateAll(nodes => nodes.map(node => ({
        font: parseFloat(getComputedStyle(node).fontSize), opacity: getComputedStyle(node).opacity,
        height: node.getBoundingClientRect().height,
        fits: node.scrollWidth <= node.clientWidth + 1,
      })));
      expect(labels.every(label => label.font >= 14 && label.opacity === '1' && label.height >= 44 && label.fits)).toBe(true);
      if (step < 4) {
        const forward = fieldset.locator('button.v2-button');
        const alignment = await forward.evaluate(node => {
          const button = node.getBoundingClientRect(), row = node.parentElement.getBoundingClientRect();
          return { rightGap: row.right - button.right, widthGap: row.width - button.width };
        });
        expect(Math.abs(alignment.rightGap)).toBeLessThanOrEqual(1);
        if (width <= 620) expect(Math.abs(alignment.widthGap)).toBeLessThanOrEqual(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
      expect((await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
      if (step === 1) {
        await page.getByLabel('Applicant name').fill('Responsive Acceptance Applicant');
        await page.getByLabel('Phone number').fill('9000000000');
        await page.getByLabel('City').fill('Hyderabad');
        await page.getByRole('button', { name: 'Continue to need →' }).click();
      } else if (step === 2) {
        await page.getByLabel('Type of assistance').selectOption('MEDICAL');
        await page.getByLabel('Describe the need').fill('Synthetic layout verification: a family requests help with medical care and follow-up.');
        await page.getByRole('button', { name: 'Continue to evidence →' }).click();
      } else if (step === 3) {
        await page.getByRole('button', { name: 'Continue to confirm →' }).click();
      }
    }
    await page.getByRole('button', { name: '← Back', exact: true }).click();
    await expect(page.locator('[data-assistance-step="3"]')).toBeFocused();
    for (let tab = 0; tab < 4; tab++) await page.keyboard.press('Shift+Tab');
    const contact = progress.getByRole('button', { name: '01 Contact', exact: true });
    await expect(contact).toBeFocused();
    await expect.poll(() => contact.evaluate(node => getComputedStyle(node).outlineWidth)).toBe('3px');
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Applicant name')).toHaveValue('Responsive Acceptance Applicant');
  });
}
