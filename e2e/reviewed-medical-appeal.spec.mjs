import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 1440]) {
  test(`Reviewed medical appeal exposes its story, image and same-page payment choices at ${width}px`, async ({ page }) => {
    const requests = [];
    await page.route('**/api/donations/**', route => { requests.push(route.request().url()); return route.abort(); });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/browser-acceptance/reviewed-medical');
    await expect(page.getByRole('heading', { name: 'Synthetic reviewed medical support', exact: true })).toBeVisible();
    const photo = page.getByRole('img', { name: 'Synthetic reviewed image for acceptance', exact: true });
    await expect(photo).toBeVisible();
    await expect.poll(() => photo.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.locator('#medical-appeal-story')).toContainText('Synthetic public description');
    await expect(page.getByRole('progressbar', { name: 'Appeal funding progress' })).toHaveAttribute('aria-valuenow', '25');
    await expect(page.getByRole('button', { name: 'Secure online payment', exact: true })).toBeVisible();
    const checkoutContrast = await new AxeBuilder({ page }).include('#support-this-appeal').withTags(['wcag2aaa']).analyze();
    expect(checkoutContrast.violations.filter(violation => violation.id === 'color-contrast-enhanced')).toEqual([]);
    await page.getByRole('button', { name: 'Direct UPI / QR', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Verified UPI details' })).toContainText('synthetic-test@upi');
    const qrDisplay = page.getByRole('img', { name: 'Amaana Foundation verified UPI payment QR code', exact: true });
    await expect(qrDisplay).toBeVisible();
    await expect.poll(() => qrDisplay.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await page.getByRole('button', { name: 'Bank transfer', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Verified bank transfer details' })).toContainText('SYNTHETIC ACCEPTANCE ONLY');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    expect(overflow).toBe(false);
    const accessibility = await new AxeBuilder({ page }).include('#main').analyze();
    expect(accessibility.violations).toEqual([]);
    expect(requests).toEqual([]);
  });
}
