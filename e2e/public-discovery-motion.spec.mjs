import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const workspace = process.env.AMAANA_APP_WORKSPACE ?? process.cwd();
const stylesheet = path => readFileSync(join(workspace, path), 'utf8');
const image = '<img alt="Synthetic fixture" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'60\'/%3E">';

test('Stories feature and archive interaction honor both motion preferences', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  const css = stylesheet('src/app/stories.css') + stylesheet('src/app/stories-wow.css');
  await page.setContent(`<style>${css}</style><a href="#feature" class="v2-stories-feature-media" style="display:block"><figure class="v2-media-item">${image}</figure></a><div class="v2-stories-grid">${[1, 2, 3].map(index => `<a href="#story-${index}" class="v2-stories-card"><div class="v2-stories-card-media"><figure class="v2-media-item">${image}</figure></div><div>Story ${index}</div></a>`).join('')}</div>`);
  const cards = page.locator('.v2-stories-feature-media, .v2-stories-card');
  for (const reducedMotion of ['reduce', 'no-preference']) {
    await page.emulateMedia({ reducedMotion });
    for (const card of await cards.all()) {
      await card.hover();
      const photo = card.locator('img');
      if (reducedMotion === 'reduce') {
        await expect(card).toHaveCSS('transform', 'none');
        await expect(photo).toHaveCSS('transform', 'none');
        await expect(card).toHaveCSS('transition-property', 'none');
        await expect(photo).toHaveCSS('transition-property', 'none');
      } else {
        await expect.poll(() => card.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
        await expect.poll(() => photo.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
      }
      await page.mouse.move(0, 0);
      await page.keyboard.press('Tab');
      await card.focus();
      await expect.poll(() => card.evaluate(element => element.matches(':focus-visible'))).toBe(true);
      if (reducedMotion === 'reduce') await expect(card).toHaveCSS('transform', 'none');
      else await expect.poll(() => card.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
    }
  }
});

test('Gallery thumbnail hover honors both motion preferences', async ({ page }) => {
  await page.setContent(`<style>${stylesheet('src/components/campaign-media-gallery.module.css')}</style><div class="grid"><figure class="card"><button class="trigger" type="button">${image}</button></figure></div>`);
  const trigger = page.getByRole('button');
  const photo = trigger.locator('img');
  for (const reducedMotion of ['reduce', 'no-preference']) {
    await page.emulateMedia({ reducedMotion });
    await trigger.hover();
    if (reducedMotion === 'reduce') {
      await expect(photo).toHaveCSS('transform', 'none');
      await expect(photo).toHaveCSS('transition-property', 'none');
    } else await expect.poll(() => photo.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
  }
});

test('Shared controls honor reduced motion on hover, focus and expanded state', async ({ page }) => {
  const css = ['src/app/world-class-polish.css', 'src/app/islamic-companion.css', 'src/app/experience-finish.css', 'src/app/site-chrome.css'].map(stylesheet).join('\n');
  await page.setViewportSize({ width: 700, height: 900 });
  await page.setContent(`<style>${css}.motion-control{display:block!important;position:static!important;margin:1rem!important;width:12rem!important;min-height:3rem!important}</style><header class="site-header"><button class="menu-toggle motion-control">Menu</button><a href="#donate" class="nav-donate motion-control">Donate</a></header><nav><div class="mobile-menu-primary"><a class="motion-control" href="#work">Our Work</a></div><div class="mobile-menu-secondary"><a class="motion-control" href="#contact">Contact</a></div></nav><a class="af-support-cta motion-control" href="#support">Support</a><a class="amaana-live-cta motion-control" href="#live">Live</a><div class="amaana-companion-dock"><button class="motion-control" aria-expanded="false">Companion</button></div>`);
  for (const reducedMotion of ['reduce', 'no-preference']) {
    await page.emulateMedia({ reducedMotion });
    for (const control of await page.locator('.motion-control').all()) {
      await control.hover();
      if (reducedMotion === 'reduce') await expect(control).toHaveCSS('transform', 'none');
      else await expect.poll(() => control.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
    }
    await page.mouse.move(0, 0);
    for (const control of await page.locator('.af-support-cta, .nav-donate').all()) {
      await page.keyboard.press('Tab');
      await control.focus();
      await expect.poll(() => control.evaluate(element => element.matches(':focus-visible'))).toBe(true);
      if (reducedMotion === 'reduce') await expect(control).toHaveCSS('transform', 'none');
      else await expect.poll(() => control.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
    }
    const dock = page.locator('.amaana-companion-dock>button');
    await dock.evaluate(element => element.setAttribute('aria-expanded', 'true'));
    if (reducedMotion === 'reduce') await expect(dock).toHaveCSS('transform', 'none');
    else await expect.poll(() => dock.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
    await dock.evaluate(element => element.setAttribute('aria-expanded', 'false'));
  }
});


test('Donation detail hover and Back focus honor reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.setContent(`<style>html{font-size:16px}${stylesheet('src/app/donate-wow.css')}</style><a href="#back" class="v2-donate-back" style="display:inline-block">Back</a><div class="v2-donate-guide-list"><article><h3>Choose your amount</h3></article></div>`);
  const article = page.locator('article');
  const back = page.getByRole('link', { name: 'Back' });
  for (const reducedMotion of ['reduce', 'no-preference']) {
    await page.emulateMedia({ reducedMotion });
    await article.hover();
    await expect(article).toHaveCSS('padding-left', reducedMotion === 'reduce' ? '0px' : '11.2px');
    await back.hover();
    if (reducedMotion === 'reduce') await expect(back).toHaveCSS('transform', 'none');
    else await expect.poll(() => back.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    await back.focus();
    await expect.poll(() => back.evaluate(element => element.matches(':focus-visible'))).toBe(true);
    if (reducedMotion === 'reduce') await expect(back).toHaveCSS('transform', 'none');
    else await expect.poll(() => back.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
  }
});


test('Assistance follow-up and enabled carousel controls honor reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const css = stylesheet('src/app/assistance-wow.css') + stylesheet('src/components/scroll-carousel.module.css');
  await page.setContent(`<style>:root{--af-color-focus:#466faa}${css}</style><div class="v2-assistance-after-flow"><div>Received</div></div><div class="controls"><button type="button">Next</button><button type="button" disabled>Previous</button></div>`);
  const step = page.locator('.v2-assistance-after-flow>div');
  const enabled = page.getByRole('button', { name: 'Next' });
  const disabled = page.getByRole('button', { name: 'Previous' });
  for (const reducedMotion of ['reduce', 'no-preference']) {
    await page.emulateMedia({ reducedMotion });
    for (const target of [step, enabled]) {
      await target.hover();
      if (reducedMotion === 'reduce') {
        await expect(target).toHaveCSS('transform', 'none');
        await expect(target).toHaveCSS('transition-property', 'none');
      } else await expect.poll(() => target.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
    }
    await disabled.hover();
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveCSS('transform', 'none');
    await page.keyboard.press('Tab');
    await enabled.focus();
    await expect.poll(() => enabled.evaluate(element => element.matches(':focus-visible'))).toBe(true);
    await expect(enabled).toHaveCSS('outline-style', 'solid');
  }
});


test('Impact nested media and action honor reduced motion on hover and focus', async ({ page }) => {
  const css = stylesheet('src/app/impact/impact-refinement.module.css').replace(/:global\((.*?)\)(?=[{,])/gs, '$1');
  await page.setContent(`<style>${css}</style><a href="#impact" class="v2-impact-tile"><div class="v2-impact-tile-media">${image}<video></video></div><span class="v2-impact-tile-action">Explore impact</span></a>`);
  const tile = page.getByRole('link');
  for (const reducedMotion of ['reduce', 'no-preference']) {
    await page.emulateMedia({ reducedMotion });
    for (const state of ['hover', 'focus']) {
      await page.mouse.move(0, 0);
      if (state === 'hover') await tile.hover();
      else { await page.keyboard.press('Tab'); await tile.focus(); await expect.poll(() => tile.evaluate(element => element.matches(':focus-visible'))).toBe(true); }
      for (const target of await tile.locator('img, video, .v2-impact-tile-action').all()) {
        if (reducedMotion === 'reduce') await expect(target).toHaveCSS('transform', 'none');
        else await expect.poll(() => target.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
      }
    }
  }
});
