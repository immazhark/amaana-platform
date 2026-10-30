import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page, route = '/about', fine = true) {
  // Headless Linux has no physical pointer. Exercise the fine-pointer policy explicitly.
  if (fine) await page.addInitScript(() => {
    const native = window.matchMedia.bind(window);
    window.matchMedia = query => {
      const result = native(query);
      if (query === '(pointer: fine)') Object.defineProperty(result, 'matches', { value: true });
      return result;
    };
  });
  await page.route('**/api/analytics/page-view', r => r.fulfill({ status: 204, body: '' }));
  const response = await page.goto(route, { waitUntil: 'load' });
  expect(response?.ok()).toBe(true);
  if (!route.startsWith('/browser-acceptance/')) await expect(page.locator('main h1')).toHaveCount(1);
}

test('fine-pointer smoothing loads on demand, settles and releases reduced-motion immediately', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await page.mouse.move(700, 600);
  await page.mouse.wheel(0, 200);
  await expect(page.locator('html')).toHaveClass(/lenis/);
  const start = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 350);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(start + 300);
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('lenis-scrolling'))).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await page.keyboard.press('Home');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  expect(errors).toEqual([]);
});

test('compact fine-pointer menus contain wheel scrolling and release it on dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1000 });
  await open(page);
  await page.mouse.move(700, 650);
  await page.mouse.wheel(0, 180);
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await page.keyboard.press('Home');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
  await expect(page.locator('#mobile-navigation')).toBeVisible();
  await page.mouse.move(10, 990);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-navigation')).toBeHidden();
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(250);
});

test('a short compact menu scrolls natively while background wheel stays contained and zoom works', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 480 });
  await open(page, '/browser-acceptance/mobile-support');
  await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
  const menu = page.locator('#mobile-navigation');
  await expect(menu).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/af-menu-lock/);
  const prevented = await menu.evaluate(node => [true, false].map(ctrlKey => {
    const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100, ctrlKey });
    node.dispatchEvent(event);
    return event.defaultPrevented;
  }));
  // Synthetic input checks cancellation policy, not an actual browser zoom.
  expect(prevented).toEqual([false, false]);
  const backgroundPrevented = await page.locator('.mobile-menu-backdrop').evaluate(node => {
    const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 });
    node.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(backgroundPrevented).toBe(true);
  const dimensions = await menu.evaluate(node => ({ height: node.clientHeight, content: node.scrollHeight }));
  expect(dimensions.content).toBeGreaterThan(dimensions.height);
  const box = await menu.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 100));
  await page.mouse.wheel(0, 500);
  await expect.poll(() => menu.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/af-menu-lock/);
  await page.mouse.move(180, 410);
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
});

test('composing Home and End do not force document navigation or destroy active wheel enhancement', async ({ page }) => {
  await open(page);
  await page.mouse.move(700, 600);
  await page.mouse.wheel(0, 200);
  await expect(page.locator('html')).toHaveClass(/lenis/);
  const result = await page.evaluate(() => {
    const original = window.scrollTo;
    const calls = [];
    window.scrollTo = (...args) => { calls.push(args); };
    try {
      for (const key of ['Home', 'End']) {
        document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, isComposing: true }));
      }
      return { calls, enhanced: document.documentElement.classList.contains('lenis') };
    } finally { window.scrollTo = original; }
  });
  // Synthetic composition input verifies the handler boundary, not an IME UI.
  expect(result).toEqual({ calls: [], enhanced: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
});

test('Motion feedback restores styles and responds to live preference changes', async ({ page }) => {
  await open(page);
  const action = page.locator('.nav-donate');
  await action.hover();
  await expect.poll(() => action.evaluate(n => getComputedStyle(n).translate)).toBe('0px -1px');
  await page.mouse.move(500, 400);
  await expect.poll(() => action.evaluate(n => { const value = getComputedStyle(n).translate; return value === 'none' || value === '0px 0px' ? '' : value; })).toBe('');
  await action.focus();
  await expect(action).toBeFocused();
  await expect.poll(() => action.evaluate(n => getComputedStyle(n).translate)).toBe('0px -1px');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => action.evaluate(n => ({ translate: n.style.translate, scale: n.style.scale, animations: n.getAnimations().length }))).toEqual({ translate: '', scale: '', animations: 0 });
  await expect(action).toBeFocused();
});

for (const scenario of [
  { name: 'pointer cancellation without a primary button code', event: 'pointercancel', button: -1, disabled: false },
  { name: 'release after the action becomes disabled', event: 'pointerup', button: 0, disabled: true },
  { name: 'pointer exit after the action becomes disabled', event: 'pointerout', button: -1, disabled: true },
  { name: 'focus exit after the action becomes disabled', event: 'focusout', button: -1, disabled: true },
]) {
  test(`motion press recovers from ${scenario.name}`, async ({ page }) => {
    await open(page);
    const action = page.locator('.nav-donate');
    // Confirm the delegated effect is installed before dispatching the edge case.
    await action.hover();
    await expect.poll(() => action.evaluate(n => getComputedStyle(n).translate)).toBe('0px -1px');
    await action.evaluate(n => n.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, pointerType: 'mouse', button: 0, buttons: 1,
    })));
    await expect.poll(() => action.evaluate(n => getComputedStyle(n).scale)).toBe('0.98');
    await action.evaluate((n, input) => {
      if (input.disabled) n.setAttribute('aria-disabled', 'true');
      n.dispatchEvent(input.event === 'focusout'
        ? new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body })
        : new PointerEvent(input.event, {
          bubbles: true, pointerType: 'mouse', button: input.button, buttons: 0,
        }));
    }, scenario);
    await expect.poll(() => action.evaluate(n => ['none', '1'].includes(getComputedStyle(n).scale))).toBe(true);
    if (scenario.disabled) {
      await expect.poll(() => action.evaluate(n => n.getAnimations().length)).toBe(0);
      await action.evaluate(n => n.removeAttribute('aria-disabled'));
    }
    await expect(page).toHaveURL(/\/about$/);
  });
}

test('window blur clears pressed motion and a later interaction still works', async ({ page }) => {
  await open(page);
  const action = page.locator('.nav-donate');
  await action.hover();
  await expect.poll(() => action.evaluate(n => getComputedStyle(n).translate)).toBe('0px -1px');
  const press = () => action.evaluate(n => n.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, pointerType: 'mouse', button: 0, buttons: 1,
  })));
  await press();
  await expect.poll(() => action.evaluate(n => getComputedStyle(n).scale)).toBe('0.98');
  // Verify the actual lifecycle handler without claiming an OS window-switch test.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect.poll(() => action.evaluate(n => n.getAnimations().length)).toBe(0);
  await expect.poll(() => action.evaluate(n => ['none', '1'].includes(getComputedStyle(n).scale))).toBe(true);
  await press();
  await expect.poll(() => action.evaluate(n => getComputedStyle(n).scale)).toBe('0.98');
  await action.evaluate(n => n.dispatchEvent(new PointerEvent('pointercancel', {
    bubbles: true, pointerType: 'mouse', button: -1,
  })));
  await expect.poll(() => action.evaluate(n => ['none', '1'].includes(getComputedStyle(n).scale))).toBe(true);
  await expect(page).toHaveURL(/\/about$/);
});

test('a touch press recovers when its terminal pointer event targets the page instead of the action', async ({ page }) => {
  await open(page);
  const action = page.locator('.nav-donate');
  await action.hover();
  await expect.poll(() => action.evaluate(n => getComputedStyle(n).translate)).toBe('0px -1px');

  const press = pointerId => action.evaluate((node, id) => node.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: id, button: 0, buttons: 1 }),
  ), pointerId);
  const releaseOutside = (type, pointerId) => page.evaluate(({ type: eventType, pointerId: id }) => {
    document.body.dispatchEvent(new PointerEvent(eventType, {
      bubbles: true, pointerType: 'touch', pointerId: id, button: -1, buttons: 0,
    }));
  }, { type, pointerId });

  await press(42);
  await expect.poll(() => action.evaluate(n => getComputedStyle(n).scale)).toBe('0.98');
  // Synthetic touch pointerout is not treated as a mouse hover exit.
  await action.evaluate(node => node.dispatchEvent(new PointerEvent('pointerout', {
    bubbles: true, pointerType: 'touch', pointerId: 42, button: -1,
  })));
  await releaseOutside('pointerup', 42);
  await expect.poll(() => action.evaluate(n => ['none', '1'].includes(getComputedStyle(n).scale))).toBe(true);

  await press(43);
  await expect.poll(() => action.evaluate(n => getComputedStyle(n).scale)).toBe('0.98');
  await releaseOutside('pointercancel', 43);
  await expect.poll(() => action.evaluate(n => ['none', '1'].includes(getComputedStyle(n).scale))).toBe(true);
  await expect(page).toHaveURL(/\/about$/);
});

test('background visibility releases a pressed action even without a window blur event', async ({ page }) => {
  await open(page);
  const action = page.locator('.nav-donate');
  await action.hover();
  await expect.poll(() => action.evaluate(n => getComputedStyle(n).translate)).toBe('0px -1px');
  await action.evaluate(n => n.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, pointerType: 'touch', pointerId: 81, button: 0, buttons: 1,
  })));
  await expect.poll(() => action.evaluate(n => getComputedStyle(n).scale)).toBe('0.98');

  // Synthetic visibilitychange checks the registered handler, not an OS tab switch.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    try {
      document.dispatchEvent(new Event('visibilitychange'));
    } finally {
      delete document.hidden;
    }
  });
  await expect.poll(() => action.evaluate(n => n.getAnimations().length)).toBe(0);
  await expect.poll(() => action.evaluate(n => ['none', '1'].includes(getComputedStyle(n).scale))).toBe(true);
  await expect(page).toHaveURL(/\/about$/);
});

test('delegated keyboard press ignores IME completion and releases owned modified keyups', async ({ page }) => {
  await open(page);
  const action = page.locator('.nav-donate');
  await action.hover();
  await expect.poll(() => action.evaluate(n => getComputedStyle(n).translate)).toBe('0px -1px');
  await page.mouse.move(500, 400);
  await expect.poll(() => action.evaluate(n => n.getAnimations().length)).toBe(0);

  // Synthetic events test handler semantics, not a physical IME.
  await action.evaluate(n => {
    n.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true, key: 'Enter', isComposing: true,
    }));
    n.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
  });
  await expect.poll(() => action.evaluate(n => n.getAnimations().length)).toBe(0);

  await action.evaluate(n => n.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true, key: 'Enter',
  })));
  await expect.poll(() => action.evaluate(n => getComputedStyle(n).scale)).toBe('0.98');
  await action.evaluate(n => n.dispatchEvent(new KeyboardEvent('keyup', {
    bubbles: true, key: 'Enter', ctrlKey: true,
  })));
  await expect.poll(() => action.evaluate(n => ['none', '1'].includes(getComputedStyle(n).scale))).toBe(true);
  await expect(page).toHaveURL(/\/about$/);
});

test('route navigation destroys old scrolling and leaves the new page readable', async ({ page }) => {
  await open(page);
  await page.mouse.move(700, 500);
  await page.mouse.wheel(0, 200);
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await page.locator('.nav-links').getByRole('link', { name: 'Our Work', exact: true }).click();
  await expect(page).toHaveURL(/\/our-work$/);
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await expect(page.locator('.amaana-navigation-loading')).toHaveCount(0);
});

test('nested carousel controls retain horizontal navigation while Lenis is active', async ({ page }) => {
  await open(page, '/browser-acceptance/body-carousel');
  await page.mouse.move(10, 20);
  await page.mouse.wheel(0, 100);
  await expect(page.locator('html')).toHaveClass(/lenis/);
  const carousel = page.locator('[data-carousel-mode]').first();
  const track = carousel.locator('[id^="carousel-"]');
  await track.scrollIntoViewIfNeeded();
  await track.focus();
  const start = await track.evaluate(n => n.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => track.evaluate(n => n.scrollLeft)).toBeGreaterThan(start);
  await expect(track).toBeFocused();
});

for (const route of ['/about', '/contact', '/request-assistance', '/donate', '/privacy', '/our-work/eid-gift-kits', '/admin/login']) {
  test(`reduced-motion content and keyboard skip link remain native: ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, route);
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 300);
    await expect(page.locator('html')).not.toHaveClass(/lenis/);
    const skip = page.locator('.v2-skip-link');
    await skip.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
    expect(await page.locator('#main').evaluate(n => getComputedStyle(n).opacity)).toBe('1');
    expect(await page.locator('#main').evaluate(n => n.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0);
  });
}

test.describe('native touch', () => {
test.use({ hasTouch: true, isMobile: true });
test('touch layout keeps native scrolling and an accessible mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/about', false);
  await page.mouse.move(150, 600);
  await page.mouse.wheel(0, 200);
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.locator('#mobile-navigation')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeFocused();
});
});

for (const route of ['/', '/about', '/our-work', '/impact', '/stories', '/faith-and-reflections', '/contact', '/get-involved', '/get-involved/sponsor-education', '/partner', '/donate', '/request-assistance', '/privacy', '/terms', '/donation-policy', '/refund-policy', '/governance', '/transparency', '/compliance', '/recognition', '/how-we-verify', '/appeals', '/our-work/eid-gift-kits', '/our-work/taleem', '/our-work/winter-relief', '/programmes/medical-financial-relief']) {
  test(`enhanced text contrast: ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, route, false);
    await expect(page.locator('main h1')).not.toContainText(/Something went wrong|temporarily unavailable|could not|not found/i);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2aaa']).analyze();
    expect(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  });
}
