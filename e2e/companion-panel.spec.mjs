import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 900, 1024, 1440, 1920]) {
  for (const height of [320, 900]) {
    test(`Companion tabs and expanded-panel reachability at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/api/public/islamic-companion?*', route => route.fulfill({status:503,json:{error:'Timings are temporarily unavailable.'}}));
      expect((await page.goto('/about')).ok()).toBe(true);
      const dock = page.locator('.amaana-companion-dock button');
      await dock.click();
      const panel = page.getByRole('region', {name:'Today’s reflection',exact:true});
      const readings = page.getByRole('tab', {name:'Ayah & Hadith',exact:true});
      const prayers = page.getByRole('tab', {name:'Salah & Hijri',exact:true});
      const content = page.getByRole('tabpanel');
      await expect(panel).toBeFocused();
      await expect(content).toHaveAccessibleName('Ayah & Hadith');
      await expect(readings).toHaveAttribute('tabindex','0');
      await expect(prayers).toHaveAttribute('tabindex','-1');
      const bounds = await page.evaluate(() => {
        const p = document.querySelector('.amaana-companion-panel').getBoundingClientRect();
        return {top:p.top,bottom:p.bottom,left:p.left,right:p.right,headerBottom:document.querySelector('.site-header').getBoundingClientRect().bottom,dockTop:document.querySelector('.amaana-companion-dock').getBoundingClientRect().top};
      });
      expect(bounds.top).toBeGreaterThanOrEqual(bounds.headerBottom);
      expect(bounds.bottom).toBeLessThanOrEqual(bounds.dockTop);
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(width + 1);
      const tabSizes = await page.getByRole('tab').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height));
      expect(tabSizes.every(h => h >= 44)).toBe(true);
      await readings.focus();
      for (const [key, selected, name] of [['ArrowRight',prayers,'Salah & Hijri'],['ArrowRight',readings,'Ayah & Hadith'],['ArrowLeft',prayers,'Salah & Hijri'],['Home',readings,'Ayah & Hadith'],['End',prayers,'Salah & Hijri']]) {
        await page.keyboard.press(key);
        await expect(selected).toBeFocused();
        await expect(selected).toHaveAttribute('aria-selected','true');
        await expect(content).toHaveAccessibleName(name);
        await expect(page.getByRole('tab',{selected:false})).toHaveAttribute('tabindex','-1');
        const ids = await page.getByRole('tab').evaluateAll(nodes => nodes.map(n => Boolean(document.getElementById(n.getAttribute('aria-controls')))));
        expect(ids.every(Boolean)).toBe(true);
      }
      await page.keyboard.press('Tab');
      await expect(content).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(prayers).toBeFocused();
      await expect(content.getByRole('alert')).toContainText('Timings are temporarily unavailable.');
      const retry = page.getByRole('button',{name:'Try again',exact:true});
      await retry.scrollIntoViewIfNeeded();
      await retry.click();
      await expect(content.getByRole('alert')).toContainText('Timings are temporarily unavailable.');
      await readings.click();
      await expect(content).toHaveAccessibleName('Ayah & Hadith');
      const last = page.getByText('About these readings',{exact:true});
      await last.scrollIntoViewIfNeeded();
      await last.focus();
      const lastBox = await last.boundingBox();
      expect(lastBox.y).toBeGreaterThanOrEqual(bounds.top);
      expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(bounds.bottom + 1);
      const copy = page.getByRole('button',{name:'Copy reading & references',exact:true});
      expect((await copy.boundingBox()).height).toBeGreaterThanOrEqual(44);
      expect((await new AxeBuilder({page}).include('.amaana-companion').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
      if (width === 390 && height === 900 || width === 1440 && height === 900) {
        await page.getByRole('button',{name:'Close companion',exact:true}).scrollIntoViewIfNeeded();
        await page.screenshot({path:`/tmp/companion-after-${width}.png`});
      }
      await page.keyboard.press('Escape');
      await expect(page.locator('.amaana-companion-panel')).toHaveCount(0);
      await expect(dock).toBeFocused();
      expect(await page.locator('.amaana-companion').evaluate(node=>getComputedStyle(node).position)).toBe('fixed');
    });
  }
}
