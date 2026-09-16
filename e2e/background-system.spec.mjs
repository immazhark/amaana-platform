import { expect, test } from '@playwright/test';

async function open(page, width) {
  await page.setViewportSize({ width, height: width <= 430 ? 844 : 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.ok(), 'homepage should render').toBeTruthy();
  await expect(page.locator('main#main')).toBeVisible();
}

async function backgrounds(page) {
  return page.evaluate(() => {
    const hero = document.querySelector('.page-hero--level1');
    const body = document.querySelector('.v3-work');
    const footer = document.querySelector('.site-footer');
    return {
      hero: hero ? getComputedStyle(hero).backgroundImage : '',
      body: body ? getComputedStyle(body).backgroundImage : '',
      footer: footer ? getComputedStyle(footer).backgroundImage : '',
      atmosphereCount: document.querySelectorAll('.page-hero__atmosphere').length,
    };
  });
}

test('desktop uses the approved Amaana background assets without the legacy hero layer', async ({ page }) => {
  await open(page, 1440);
  const styles = await backgrounds(page);
  expect(styles.hero).toContain('/backgrounds/Amaana_Website_Header_Banner.svg');
  expect(styles.body).toContain('/backgrounds/Amaana_Website_Body_Background.svg');
  expect(styles.footer).toContain('/backgrounds/Amaana_Website_Footer_Background.svg');
  expect(styles.hero).not.toContain('amaana-architectural-pattern');
  expect(styles.atmosphereCount).toBe(0);
});

test('mobile switches to the approved mobile background assets', async ({ page }) => {
  await open(page, 390);
  const styles = await backgrounds(page);
  expect(styles.hero).toContain('/backgrounds/Amaana_Website_Header_Banner_Mobile.svg');
  expect(styles.body).toContain('/backgrounds/Amaana_Website_Body_Background_Mobile.svg');
  expect(styles.footer).toContain('/backgrounds/Amaana_Website_Footer_Background_Mobile.svg');
});
