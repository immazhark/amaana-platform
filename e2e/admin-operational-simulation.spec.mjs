import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function openProfile(page, profile) {
  const response = await page.goto(`/browser-acceptance/admin?profile=${profile}`, { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Synthetic operations console' })).toBeVisible();
  await expect(page.getByText('Synthetic acceptance session — no shared records')).toBeVisible();
  return page.getByRole('navigation', { name: 'Admin navigation' });
}

async function expectLinks(navigation, visible, hidden) {
  for (const name of visible) await expect(navigation.getByRole('link', { name })).toBeVisible();
  for (const name of hidden) await expect(navigation.getByRole('link', { name })).toHaveCount(0);
}

function adminBrand(page) {
  return page.locator('.admin-sidebar > a.brand');
}

test.describe('admin operational simulation without shared records', () => {
  test('admin sign-in surface preserves secure credential semantics', async ({ page }) => {
    const response = await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'username');
    await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'current-password');
    await expect(page.getByLabel('Email')).toHaveAttribute('required', '');
    await expect(page.getByLabel('Password')).toHaveAttribute('required', '');
    await expect(page.getByLabel('Email')).toHaveAttribute('maxlength', '254');
    await expect(page.getByLabel('Password')).toHaveAttribute('maxlength', '256');
    await expect(page.getByRole('button', { name: 'Sign in securely' })).toBeVisible();
  });

  test('case reviewer sees case and retention operations but no editorial or finance areas', async ({ page }) => {
    const navigation = await openProfile(page, 'case');
    await expectLinks(navigation,
      ['Assistance queue', 'Retention review'],
      ['Appeals', 'Media review', 'Donations', 'Notification delivery']);
    await expect(adminBrand(page)).toHaveAttribute('href', '/admin');
    await expect(page.getByText('Fail-closed landing:')).toBeVisible();
    await expect(page.locator('code')).toHaveText('/admin');
  });

  test('editorial reviewer sees appeal and media review only', async ({ page }) => {
    const navigation = await openProfile(page, 'editorial');
    await expectLinks(navigation,
      ['Appeals', 'Media review'],
      ['Assistance queue', 'Retention review', 'Donations', 'Notification delivery']);
    await expect(adminBrand(page)).toHaveAttribute('href', '/admin/appeals');
    await expect(page.locator('code')).toHaveText('/admin/appeals');
  });

  test('finance reviewer is isolated to donation review', async ({ page }) => {
    const navigation = await openProfile(page, 'finance');
    await expectLinks(navigation,
      ['Donations'],
      ['Assistance queue', 'Appeals', 'Media review', 'Retention review', 'Notification delivery']);
    await expect(adminBrand(page)).toHaveAttribute('href', '/admin/donations');
    await expect(page.locator('code')).toHaveText('/admin/donations');
  });

  test('unrecognized permissions fail closed to forbidden with no operational links', async ({ page }) => {
    const navigation = await openProfile(page, 'none');
    await expect(navigation.getByRole('link')).toHaveCount(0);
    await expect(adminBrand(page)).toHaveAttribute('href', '/admin/forbidden');
    await expect(page.locator('code')).toHaveText('/admin/forbidden');
  });

  test('full administrator keeps canonical operations order and serious accessibility clean', async ({ page }) => {
    const navigation = await openProfile(page, 'full');
    await expect(navigation.getByRole('link')).toHaveText([
      'Assistance queue',
      'Appeals',
      'Media review',
      'Retention review',
      'Donations',
      'Notification delivery',
    ]);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  });
});
