import { expect, test } from '@playwright/test';

const routes = [
  '/browser-acceptance/give',
  '/browser-acceptance/give-sponsorship',
  '/browser-acceptance/reviewed-donation',
  '/browser-acceptance/donation',
];

test.describe('giving recovery without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });

  for (const route of routes) {
    test(`explains unavailable interactions and offers native help at ${route}`, async ({ page }) => {
      const financialRequests = [];
      page.on('request', request => {
        if (/\/api\/donations\//.test(request.url())) financialRequests.push(request.url());
      });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const notice = page.locator('noscript').filter({ hasText: 'Interactive payment options require JavaScript.' });
      await expect(notice).toHaveCount(1);
      await expect(notice).toContainText('currently approved donation options');
      await expect(notice).toContainText('before paying again');
      await expect(notice.locator('form, input, button')).toHaveCount(0);
      const contact = notice.getByRole('link', { name: 'Contact Amaana', exact: true });
      await expect(contact).toHaveAttribute('href', '/contact');
      await expect(notice.getByRole('link', { name: 'Read donation policy', exact: true })).toHaveAttribute('href', '/donation-policy');
      await contact.focus();
      await expect(contact).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/contact$/);
      expect(financialRequests).toEqual([]);
    });
  }
});

test('JavaScript-enabled giving retains its existing interactive path without the fallback notice', async ({ page }) => {
  await page.route('**/checkout.razorpay.com/**', route => route.abort());
  await page.goto('/browser-acceptance/give');
  await expect(page.getByText('Interactive payment options require JavaScript.', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Give to General Fund', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Choose donation method', exact: true })).toBeVisible();
});
