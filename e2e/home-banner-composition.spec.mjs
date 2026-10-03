import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`banner composition at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/browser-acceptance/home-hero');
    const carousel = page.getByRole('region', { name: 'Amaana Foundation story and featured work' });
    const secondary = carousel.locator('.page-hero__button--secondary').first();
    await secondary.hover();
    expect(await secondary.evaluate(node => getComputedStyle(node).color)).toBe('rgb(29, 49, 80)');
    const slide = page.locator('.v3-home-banner-slide').first();
    const geometry = await slide.evaluate(node => {
      const bounds = node.getBoundingClientRect();
      const copy = node.querySelector('.v3-home-banner-copy').getBoundingClientRect();
      const logo = node.querySelector('.v3-home-story-logo img').getBoundingClientRect();
      const description = node.querySelector('.page-hero__description p');
      return {
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        copyInside: copy.top >= bounds.top && copy.bottom <= bounds.bottom,
        logoWidth: logo.width,
        separated: innerWidth > 900 ? logo.left >= copy.right : logo.top >= copy.bottom,
        clamp: getComputedStyle(description).webkitLineClamp,
        readable: description.scrollHeight <= description.clientHeight + 1,
        title: parseFloat(getComputedStyle(node.querySelector('h2')).fontSize),
        body: parseFloat(getComputedStyle(document.querySelector('.v3-eid h2')).fontSize),
        pattern: getComputedStyle(node).backgroundImage,
      };
    });
    expect(geometry.overflow).toBe(false);
    expect(geometry.copyInside).toBe(true);
    expect(geometry.separated).toBe(true);
    expect(geometry.readable).toBe(true);
    expect(geometry.clamp).toBe('none');
    expect(geometry.title).toBeGreaterThan(geometry.body);
    expect(geometry.pattern).toContain('url(');
    if (width >= 1440) expect(geometry.logoWidth).toBeGreaterThan(320);
    await expect(slide.getByRole('link', { name: 'Discover our story' })).toHaveAttribute('href', '/about');
    if ([390, 1440].includes(width)) await page.screenshot({ path: `test-results/banner-story-${width}.png` });
    await carousel.getByRole('button', { name: /next/i }).click();
    await expect(page.locator('[data-active="true"] .v3-home-banner-media')).toBeVisible();
    const photo = page.locator('[data-active="true"] .v3-home-banner-media figure img');
    await expect.poll(() => photo.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    const mask = await page.locator('[data-active="true"] .v3-home-banner-media').evaluate(node => getComputedStyle(node).maskImage);
    expect(mask).toContain('linear-gradient');
    if (width > 900) expect(mask).toContain('90deg');
    else expect(mask).not.toContain('90deg');
    if ([390, 1440].includes(width)) {
      await page.screenshot({ path: `test-results/banner-${width}.png` });
      const results = await new AxeBuilder({ page }).include('.v3-home-banner').analyze();
      expect(results.violations).toEqual([]);
    }
  });
}

test('banner keyboard and automatic playback controls remain available', async ({ page }) => {
  await page.goto('/browser-acceptance/home-hero');
  const carousel = page.getByRole('region', { name: 'Amaana Foundation story and featured work' });
  await carousel.getByRole('button', { name: 'Pause automatic slides' }).click();
  await expect(carousel.getByRole('button', { name: 'Resume automatic slides' })).toBeVisible();
  const viewport = carousel.locator('[aria-label^="Slide viewport"]');
  await viewport.focus();
  await page.keyboard.press('ArrowRight');
  await expect(carousel.getByRole('group', { name: '2 of 5' })).toHaveAttribute('data-active', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(carousel.getByRole('group', { name: '1 of 5' })).toHaveAttribute('data-active', 'true');
});

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`published homepage slides fit their banner at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const slides = page.locator('.v3-home-banner-slide');
    expect(await slides.count()).toBeGreaterThan(1);
    const clipped = await slides.evaluateAll(nodes => nodes.filter(node => {
      const r = node.getBoundingClientRect();
      const c = node.querySelector('.v3-home-banner-copy').getBoundingClientRect();
      return c.top < r.top || c.bottom > r.bottom;
    }).map(node => node.querySelector('h2').textContent));
    expect(clipped).toEqual([]);
    await expect(page.locator('.v3-home-banner h1')).toHaveCount(1);
  });
}

test('five programme slides have usable artwork, centered selectors and container-edge images', async ({page}) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/browser-acceptance/home-hero');
  const carousel=page.getByRole('region',{name:'Amaana Foundation story and featured work'});
  await expect(carousel.locator('.hero-dots button')).toHaveCount(5);
  for(let index=0;index<5;index++){
    const dot=carousel.getByRole('button',{name:`Show slide ${index+1} of 5`});
    await dot.click();await expect(dot).toHaveAttribute('aria-current','true');
    await expect(carousel.getByRole('group',{name:`${index+1} of 5`})).toHaveAttribute('data-active','true');
    await expect(carousel.locator('[inert]')).toHaveCount(4);
    const active=carousel.locator('[data-active="true"]');
    const img=active.locator('figure img');
    if(index){
      await expect.poll(()=>img.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
      const edges=await active.evaluate(node=>({photo:node.querySelector('.v3-home-banner-media').getBoundingClientRect().right,container:node.querySelector('.v3-shell').getBoundingClientRect().right}));
      expect(Math.abs(edges.photo-edges.container)).toBeLessThan(1);
    }else await expect(active.locator('.v3-home-story-logo img')).toBeVisible();
  }
  const center=await carousel.locator('.hero-dots').evaluate(node=>{const r=node.getBoundingClientRect();return r.left+r.width/2;});
  expect(Math.abs(center-720)).toBeLessThan(1);
});

test('homepage carousel editor requires authentication',async({page})=>{
 await page.goto('/admin/home-carousel');await expect(page).toHaveURL(/\/admin\/login/);
});

for(const width of [320,390,768,1024,1440,1920]){
 test(`editable extended banner copy remains unclipped at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/browser-acceptance/home-hero?long=true');
  const clipped=await page.locator('.v3-home-banner-slide').evaluateAll(nodes=>nodes.filter(node=>{const r=node.getBoundingClientRect(),c=node.querySelector('.v3-home-banner-copy').getBoundingClientRect();return c.top<r.top||c.bottom>r.bottom;}).map(node=>node.querySelector('h2').textContent));
  expect(clipped).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 });
}
