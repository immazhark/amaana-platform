import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const appWorkspace = process.env.AMAANA_APP_WORKSPACE ?? process.cwd();
const before = readFileSync(new URL('./fixtures/donation-form-before.css', import.meta.url), 'utf8');
const after = readFileSync(join(appWorkspace, 'src/components/donation-form.module.css'), 'utf8');
const globals = readFileSync(join(appWorkspace, 'src/app/globals.css'), 'utf8');
const normalize = css => css.replace(/:global\(([^)]+)\)/g, '$1');
const markup = `<div class="v2-premium-form"><div class="checkoutShell"><label class="checkoutLabel">Synthetic amount</label><div class="checkoutControl amountControl"><b>₹</b><input aria-label="Synthetic amount" value="500"></div><small class="hint">Synthetic hint</small></div><div class="choice"><label><input type="checkbox"><span><strong>Domestic contribution</strong><small>Synthetic confirmation</small></span></label></div><fieldset class="intentGroup"><legend>Giving intention</legend><p class="intentIntro">Synthetic context</p><div class="intentGrid"><label class="intentOption"><input type="radio" name="intent"><span><strong>General</strong><small>Synthetic intention</small></span></label></div><small class="intentNote">Synthetic note</small></fieldset><div class="status">Synthetic status</div></div>`;
for (const width of [390, 620, 621, 760, 761, 1440]) {
  for (const reducedMotion of ['reduce', 'no-preference']) {
    test(`donation CSS preserves cascade at ${width}px ${reducedMotion}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1100 });
      await page.emulateMedia({ reducedMotion });
      await page.goto('/robots.txt');
      await page.setContent(`<style>${globals}</style><style id="subject">${normalize(before)}</style>${markup}`);
      const snapshot = () => page.locator('.v2-premium-form, .v2-premium-form *').evaluateAll(nodes => nodes.map(node => {
        const style = getComputedStyle(node);
        const values = Object.fromEntries(Array.from(style).filter(key => !key.startsWith('--')).map(key => [key, style.getPropertyValue(key)]));
        const rect = node.getBoundingClientRect();
        return { values, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
      }));
      for (const state of ['normal', 'amount-focus', 'checked-focus']) {
        await page.locator('#subject').evaluate((node, css) => { node.textContent = css; }, normalize(before));
        if (state === 'normal') await page.locator('body').click({ position: { x: 1, y: 1 } });
        if (state === 'amount-focus') await page.getByRole('textbox', { name: 'Synthetic amount' }).focus();
        if (state === 'checked-focus') { await page.getByRole('radio').check(); await page.getByRole('radio').focus(); }
        await page.waitForTimeout(400);
        const original = await snapshot();
        await page.locator('#subject').evaluate((node, css) => { node.textContent = css; }, normalize(after));
        await page.waitForTimeout(400);
        expect(await snapshot(), state).toEqual(original);
      }
    });
  }
}
