import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Companion preserves browser shortcuts and Escape used by composition or a child control', async ({ page }) => {
  await page.route('**/api/public/islamic-companion?*', route => route.fulfill({ status: 503, json: { error: 'Timings are temporarily unavailable.' } }));
  await page.goto('/browser-acceptance/home-hero');
  await page.locator('.amaana-companion-dock button').click();
  const readings = page.getByRole('tab', { name: 'Ayah & Hadith', exact: true });
  await readings.focus();
  for (const options of [
    { key: 'ArrowRight', altKey: true }, { key: 'End', ctrlKey: true },
    { key: 'End', metaKey: true }, { key: 'ArrowRight', shiftKey: true },
    { key: 'ArrowRight', isComposing: true }, { key: 'End', handled: true },
    { key: 'Escape', isComposing: true }, { key: 'Escape', handled: true },
  ]) {
    const prevented = await readings.evaluate((node, { handled, ...input }) => {
      const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...input });
      if (handled) event.preventDefault();
      node.dispatchEvent(event);
      return event.defaultPrevented;
    }, options);
    expect(prevented).toBe(Boolean(options.handled));
    await expect(readings).toBeFocused();
    await expect(readings).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveAccessibleName('Ayah & Hadith');
  }
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Salah & Hijri', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.amaana-companion-panel')).toHaveCount(0);
});


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
      const metadata = panel.locator('.amaana-companion-kicker, [role="tab"]');
      expect(await metadata.count()).toBe(3);
      const metadataSizes = await metadata.evaluateAll(nodes => nodes.map(node => Number.parseFloat(getComputedStyle(node).fontSize)));
      expect(metadataSizes.every(size => size >= 12)).toBe(true);
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


test('malformed live update is skipped while a valid update renders', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/public/live-rail', route => route.fulfill({ status: 200, json: { items: [
    { title: { invalid: true } },
    { id: 'valid-after-malformed', kind: 'initiative', eyebrow: 'Foundation update', title: 'Reviewed update remains available', detailsHref: '/our-work', supportHref: '/contact', detailsCta: 'Explore', supportCta: 'Contact' },
  ] } }));
  await page.goto('/browser-acceptance/home-hero', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.amaana-live-content strong')).toHaveText('Reviewed update remains available');
  await page.locator('.amaana-companion-dock button').click();
  await expect(page.getByRole('tab', { name: 'Ayah & Hadith', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('optional malformed moon and tomorrow data retain the current timetable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-25T23:00:00+05:30') });
  await page.route('**/api/public/islamic-companion?*', route => route.fulfill({ json: {
    today: { date: '2026-10-25', timings: { Fajr: '05:00', Sunrise: '06:15', Dhuhr: '12:30', Asr: '16:00', Maghrib: '18:00', Isha: '20:00' } },
    tomorrow: { date: '2026-10-26' }, school: '1', method: 'Reviewed method', asr: 'Hanafi', note: 'Synthetic browser acceptance timetable.',
    moon: { label: { invalid: true } }, eveningMoon: { label: { invalid: true } },
  } }));
  await page.goto('/browser-acceptance/home-hero', { waitUntil: 'domcontentloaded' });
  await page.locator('.amaana-companion-dock button').click();
  await page.getByRole('tab', { name: 'Salah & Hijri', exact: true }).click();
  await expect(page.getByText('Today’s prayers have passed. Tomorrow’s Fajr is not available yet.', { exact: true })).toBeVisible();
  await expect(page.locator('.amaana-salah-times time')).toHaveText(['05:00', '06:15', '12:30', '16:00', '18:00', '20:00']);
  await expect(page.getByText('Calculated estimate · Hyderabad moon-sighting not yet confirmed.', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});


test('Escape dismisses mobile navigation before the underlying Companion panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/public/islamic-companion?*', route => route.fulfill({ status: 503, json: { error: 'Timings are temporarily unavailable.' } }));
  await page.goto('/browser-acceptance/home-hero');
  const dock = page.locator('.amaana-companion-dock button');
  await dock.click();
  const panel = page.getByRole('region', { name: 'Today’s reflection', exact: true });
  await expect(panel).toBeVisible();
  const toggle = page.getByRole('button', { name: 'Open navigation menu', exact: true });
  await toggle.click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'Mobile navigation', exact: true })).toBeHidden();
  await expect(panel).toBeVisible();
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(dock).toBeFocused();
});


for (const latestSucceeds of [true, false]) {
  test(`Companion copy feedback belongs to the latest attempt, success=${latestSucceeds}`, async ({ page }) => {
    await page.addInitScript(() => {
      window.__companionCopies = [];
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: () => new Promise((resolve, reject) => window.__companionCopies.push({ resolve, reject })),
      } });
    });
    await page.goto('/browser-acceptance/home-hero');
    await page.locator('.amaana-companion-dock button').click();
    const panel = page.locator('.amaana-companion-panel');
    const copy = panel.getByRole('button', { name: 'Copy reading & references', exact: true });
    await copy.click();
    await copy.click();
    expect(await page.evaluate(() => window.__companionCopies.length)).toBe(2);
    await page.evaluate(success => {
      const latest = window.__companionCopies[1];
      if (success) latest.resolve(); else latest.reject(new Error('Synthetic latest denial'));
    }, latestSucceeds);
    const status = panel.getByRole('status');
    const expected = latestSucceeds ? 'Reading and references copied.' : 'Copy is unavailable. You can select the text or open its source link.';
    await expect(status).toHaveText(expected);
    await page.evaluate(async success => {
      const older = window.__companionCopies[0];
      if (success) older.reject(new Error('Synthetic older denial')); else older.resolve();
      await new Promise(resolve => requestAnimationFrame(() => resolve()));
    }, latestSucceeds);
    await expect(status).toHaveText(expected);
  });
}
