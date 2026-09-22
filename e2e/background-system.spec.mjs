import { expect, test } from '@playwright/test';

const widths = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];

async function open(page, width) {
  await page.setViewportSize({ width, height: width <= 430 ? 844 : 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.ok(), 'homepage should render').toBeTruthy();
  await expect(page.locator('main#main')).toBeVisible();
}

async function backgrounds(page) {
  return page.evaluate(() => {
    let hero = document.querySelector('.page-hero--level1');
    if (!hero) {
      hero = document.createElement('section');
      hero.className = 'page-hero page-hero--level1';
      hero.setAttribute('data-background-test-fixture', 'hero');
      document.body.appendChild(hero);
    }
    let body = document.querySelector('.v3-work');
    if (!body) {
      body = document.createElement('section');
      body.className = 'v3-work';
      body.setAttribute('data-background-test-fixture', 'body');
      document.body.appendChild(body);
    }
    const footer = document.querySelector('.site-footer');
    const heroStyle = getComputedStyle(hero);
    const bodyStyle = getComputedStyle(body);
    const footerStyle = footer ? getComputedStyle(footer) : null;
    return {
      hero: heroStyle.backgroundImage,
      body: bodyStyle.backgroundImage,
      footer: footerStyle?.backgroundImage ?? '',
      heroPosition: heroStyle.backgroundPosition,
      bodyPosition: bodyStyle.backgroundPosition,
      footerPosition: footerStyle?.backgroundPosition ?? '',
      heroSize: heroStyle.backgroundSize,
      bodySize: bodyStyle.backgroundSize,
      footerSize: footerStyle?.backgroundSize ?? '',
      heroRepeat: heroStyle.backgroundRepeat,
      bodyRepeat: bodyStyle.backgroundRepeat,
      footerRepeat: footerStyle?.backgroundRepeat ?? '',
      atmosphereCount: document.querySelectorAll('.page-hero__atmosphere').length,
    };
  });
}

function expectTopRight(position) {
  expect(position).toMatch(/^100% (?:0|0%|0px)$/);
}

for (const width of widths) {
  test(`approved background system resolves correctly at ${width}px`, async ({ page }) => {
    await open(page, width);
    const styles = await backgrounds(page);
    const mobile = width <= 768;
    const suffix = mobile ? '_Mobile.svg' : '.svg';

    expect(styles.hero).toContain(`/backgrounds/Amaana_Website_Header_Banner${suffix}`);
    expect(styles.body).toContain(`/backgrounds/Amaana_Website_Body_Background${suffix}`);
    expect(styles.footer).toContain(`/backgrounds/Amaana_Website_Footer_Background${suffix}`);
    expect(styles.hero).not.toContain('amaana-architectural-pattern');
    expect(styles.atmosphereCount).toBe(0);

    expect(styles.heroSize).toBe('cover');
    expect(styles.bodySize.split(',').map(value => value.trim()).every(value => value === 'cover')).toBe(true);
    expect(styles.footerSize).toBe('cover');
    expect(styles.heroRepeat).toBe('no-repeat');
    expect(styles.bodyRepeat.split(',').map(value => value.trim()).every(value => value === 'no-repeat')).toBe(true);
    expect(styles.footerRepeat).toBe('no-repeat');

    if (mobile) {
      expectTopRight(styles.heroPosition);
      expect(styles.bodyPosition).toBe('50% 50%');
      expectTopRight(styles.footerPosition);
    } else {
      expect(styles.heroPosition).toBe('50% 50%');
      expect(styles.bodyPosition).toBe('50% 50%');
      expect(styles.footerPosition).toBe('50% 50%');
    }
  });
}
