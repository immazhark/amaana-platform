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
