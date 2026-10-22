import {test,expect} from '@playwright/test';
for(const width of [375,600,768,1024,1440,1920])test(`left alignment and controls at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 await page.goto('/browser-acceptance/body-carousel');
 const carousel=page.getByRole('region',{name:'Body carousel acceptance'});
 await expect(carousel).toBeVisible();
 const viewport=carousel.locator('[id^="carousel-"]');
 const first=carousel.getByRole('group',{name:'1 of 7',exact:true});
 const v=await viewport.boundingBox(),f=await first.boundingBox();
 expect(Math.abs(v.x-f.x)).toBeLessThan(2);
 const nextIndex=width<700?1:width<1200?2:3;
 const peekBox=await carousel.getByRole('group',{name:`${nextIndex+1} of 7`,exact:true}).boundingBox();
 const peek=(v.x+v.width-peekBox.x)/peekBox.width;
 if(width<700){expect(peek).toBeGreaterThan(.15);expect(peek).toBeLessThan(.21);}
 else{expect(peek).toBeGreaterThan(.25);expect(peek).toBeLessThan(.31);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 const visual=first.locator('.canonical-pathway-visual');const image=await visual.boundingBox();expect(image.width/image.height).toBeCloseTo(16/9,1);
 await carousel.getByRole('button',{name:'Pause automatic slides'}).click();
 await carousel.getByRole('button',{name:'Next slide',exact:true}).click();
 await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow','2');
 await expect.poll(async()=>Math.abs(v.x-(await carousel.getByRole('group',{name:'2 of 7',exact:true}).boundingBox()).x)).toBeLessThan(2);
 await viewport.focus();await page.keyboard.press('End');await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow','7');
 await expect.poll(async()=>Math.abs(v.x-(await carousel.getByRole('group',{name:'7 of 7',exact:true}).boundingBox()).x)).toBeLessThan(2);
});

test('reordering slides preserves their keyed interactive state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/browser-acceptance/body-carousel');
  const carousel = page.getByRole('region', { name: 'Body carousel acceptance' });
  await carousel.getByRole('button', { name: 'Pause automatic slides' }).click();

  const flag = carousel.getByRole('button', { name: 'Mark programme 1', exact: true });
  await flag.click();
  await expect(flag).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Reverse programme order' }).click();
  await expect(carousel.getByRole('group', { name: '1 of 7', exact: true }))
    .toContainText('Programme 7');
  await expect(flag).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Reverse programme order' }).click();
  await expect(flag).toHaveAttribute('aria-pressed', 'true');
});

test('a shrinking carousel clamps selected position and progress to the remaining slides', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/browser-acceptance/body-carousel');

  const carousel = page.getByRole('region', { name: 'Body carousel acceptance' });
  await carousel.getByRole('button', { name: 'Pause automatic slides' }).click();
  const viewport = carousel.locator('[id^="carousel-"]');
  await viewport.focus();
  await page.keyboard.press('End');
  const progress = carousel.getByRole('progressbar');
  await expect(progress).toHaveAttribute('aria-valuenow', '7');

  await page.getByRole('button', { name: 'Show two records' }).click();
  await expect(carousel.getByRole('group', { name: '2 of 2', exact: true })).toBeVisible();
  await expect(progress).toHaveAttribute('aria-valuemax', '2');
  await expect(progress).toHaveAttribute('aria-valuenow', '2');

  await carousel.getByRole('button', { name: 'Previous slide' }).click();
  await expect(progress).toHaveAttribute('aria-valuenow', '1');
  // Simulate a carousel consumer with no trailing track pad: the last
  // slide starts beyond the maximum scrollLeft the browser will accept.
  await viewport.locator(':scope > div').evaluate(track => { track.style.paddingRight = '0px'; });
  const bounds = await viewport.evaluate(node => ({
    last: node.querySelectorAll('[aria-roledescription="slide"]')[1].offsetLeft,
    max: node.scrollWidth - node.clientWidth,
  }));
  expect(bounds.last).toBeGreaterThan(bounds.max + 5);
  await carousel.getByRole('button', { name: 'Next slide' }).click();
  await expect(progress).toHaveAttribute('aria-valuenow', '2');

  // The final slide may start beyond the maximum reachable scroll offset.
  // Its smooth-navigation target must settle so subsequent native scrolling
  // can update the active index again.
  await expect.poll(() => viewport.evaluate(node => Math.abs(
    node.scrollLeft - (node.scrollWidth - node.clientWidth),
  ))).toBeLessThan(3);
  await viewport.hover();
  await page.mouse.wheel(-1200, 0);
  await expect.poll(() => viewport.evaluate(node => node.scrollLeft)).toBeLessThan(2);
  await expect(progress).toHaveAttribute('aria-valuenow', '1');

  // A separate browser-managed scroll (e.g. focus navigation or script)
  // can interrupt a smooth carousel transition without a wheel event.
  // Its final physical position must still become the selected slide.
  await carousel.getByRole('button', { name: 'Next slide' }).click();
  await expect.poll(() => viewport.evaluate(node =>
    Math.abs(node.scrollLeft - (node.scrollWidth - node.clientWidth))
  )).toBeLessThan(3);
  await viewport.evaluate(node => node.scrollTo({ left: 0, behavior: 'instant' }));
  await expect.poll(() => viewport.evaluate(node => node.scrollLeft)).toBeLessThan(2);
  await expect(progress).toHaveAttribute('aria-valuenow', '1');

  await page.getByRole('button', { name: 'Restore seven records' }).click();
  await expect(progress).toHaveAttribute('aria-valuemax', '7');
  await expect(progress).toHaveAttribute('aria-valuenow', '1');
});

test('restored carousel viewport resumes resize alignment after all slides disappear', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/browser-acceptance/body-carousel');

  const carousel = page.getByRole('region', { name: 'Body carousel acceptance' });
  await page.getByRole('button', { name: 'Clear records' }).click();
  await expect(carousel).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore seven records' }).click();
  await expect(carousel).toBeVisible();
  await carousel.getByRole('button', { name: 'Pause automatic slides' }).click();

  await carousel.locator('[id^="carousel-"]').focus();
  await page.keyboard.press('End');
  await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '7');

  await page.setViewportSize({ width: 768, height: 844 });
  await expect.poll(() => carousel.evaluate(root => {
    const viewport = root.querySelector('[id^="carousel-"]');
    const last = root.querySelector('[aria-label="7 of 7"]');
    return Math.abs(viewport.getBoundingClientRect().left - last.getBoundingClientRect().left);
  })).toBeLessThan(3);
});

test('releasing outside before pointer capture does not permanently pause carousel autoplay', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/browser-acceptance/body-carousel');

  const carousel = page.getByRole('region', { name: 'Body carousel acceptance' });
  const viewport = carousel.locator('[id^="carousel-"]');
  const box = await viewport.boundingBox();
  await page.mouse.move(box.x + 5, box.y + box.height - 5);
  await page.mouse.down();
  // Move directly outside without a pointermove inside the viewport:
  // pointer capture has not started, so pointerup is delivered elsewhere.
  await page.mouse.move(0, 0, { steps: 1 });
  await page.mouse.up();
  // Keyboard focus intentionally pauses autoplay; isolate pointer cleanup.
  await viewport.evaluate(node => node.blur());
  await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2', { timeout: 5500 });
});

test('manual pause survives pointer exit and reduced motion disables autoplay',async({page})=>{
 await page.goto('/browser-acceptance/body-carousel');
 const carousel=page.getByRole('region',{name:'Body carousel acceptance'});
 await carousel.getByRole('button',{name:'Pause automatic slides'}).click();
 await page.mouse.move(0,0);
 await page.waitForTimeout(3300);
 await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow','1');
 await expect(carousel.getByRole('button',{name:'Resume automatic slides'})).toBeVisible();
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(carousel.getByRole('button',{name:/automatic slides/})).toHaveCount(0);
 await carousel.getByRole('button',{name:'Next slide',exact:true}).click();
 await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow','2');
});

test('mouse drag scrolls cards and a normal card-link click opens directly',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('/browser-acceptance/body-carousel');
 const carousel=page.getByRole('region',{name:'Body carousel acceptance'});
 await carousel.getByRole('button',{name:'Pause automatic slides'}).click();
 const viewport=carousel.locator('[id^="carousel-"]');const box=await viewport.boundingBox();
 await page.mouse.move(box.x+500,box.y+100);await page.mouse.down();
 await page.mouse.move(box.x+80,box.y+100,{steps:12});await page.mouse.up();
 await expect.poll(()=>viewport.evaluate(n=>n.scrollLeft)).toBeGreaterThan(200);
 await expect(page).toHaveURL(/body-carousel$/);
 await viewport.focus();await page.keyboard.press('Home');
 await page.waitForTimeout(700);
 await carousel.getByRole('link',{name:'Explore programme'}).first().click();
 await expect(page).toHaveURL(/\/about$/);
});


test('rapid end-to-start controls finish at the requested card', async ({page}) => {
 await page.goto('/browser-acceptance/body-carousel');
 const carousel=page.getByRole('region',{name:'Body carousel acceptance'});
 await carousel.getByRole('button',{name:'Pause automatic slides'}).click();
 const viewport=carousel.locator('[id^="carousel-"]');
 await viewport.focus();
 await page.keyboard.press('End');
 await carousel.getByRole('button',{name:'Next slide',exact:true}).click();
 await expect.poll(()=>viewport.evaluate(n=>n.scrollLeft)).toBeLessThan(2);
 await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow','1');
 await carousel.getByRole('button',{name:'Previous slide',exact:true}).click();
 await expect.poll(()=>carousel.evaluate(root=>{
  const v=root.querySelector('[id^="carousel-"]');
  const last=root.querySelector('[aria-label="7 of 7"]');
  return Math.abs(v.getBoundingClientRect().left-last.getBoundingClientRect().left);
 })).toBeLessThan(2);
 await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow','7');
});


test('keyboard focus keeps autoplay paused after the pointer leaves',async({page})=>{
 await page.goto('/browser-acceptance/body-carousel');
 const root=page.getByRole('region',{name:'Body carousel acceptance'});
 const viewport=root.locator('[id^="carousel-"]');
 await viewport.focus();await page.mouse.move(0,0);
 await page.waitForTimeout(3300);
 await expect(root.getByRole('progressbar')).toHaveAttribute('aria-valuenow','1');
 await viewport.evaluate(n=>n.blur());
 await expect(root.getByRole('progressbar')).toHaveAttribute('aria-valuenow','2',{timeout:4000});
});

async function openPausedCarousel(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/browser-acceptance/body-carousel');
  const carousel = page.getByRole('region', { name: 'Body carousel acceptance' });
  await carousel.getByRole('button', { name: 'Pause automatic slides' }).click();
  return { carousel, viewport: carousel.locator('[id^="carousel-"]'), progress: carousel.getByRole('progressbar') };
}

async function expectSelectedProgramme(carousel, programme) {
  const selected = carousel.locator('[data-active="true"]');
  await expect(selected.getByRole('heading', { name: `Programme ${programme}`, exact: true })).toBeVisible();
  await expect.poll(() => carousel.evaluate(root => {
    const viewport = root.querySelector('[id^="carousel-"]');
    const active = root.querySelector('[data-active="true"]');
    return Math.abs(viewport.getBoundingClientRect().left - active.getBoundingClientRect().left);
  })).toBeLessThan(3);
}

test('reordering the collection keeps the selected programme and its next neighbour', async ({ page }) => {
  const { carousel, progress } = await openPausedCarousel(page);
  await carousel.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expectSelectedProgramme(carousel, 2);
  await page.getByRole('button', { name: 'Reverse programme order' }).click();
  await expectSelectedProgramme(carousel, 2);
  await expect(progress).toHaveAttribute('aria-valuenow', '6');
  await carousel.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expectSelectedProgramme(carousel, 1);
});

test('removing an earlier record keeps the selected programme instead of selecting its neighbour', async ({ page }) => {
  const { carousel, progress } = await openPausedCarousel(page);
  await carousel.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expectSelectedProgramme(carousel, 2);
  await page.getByRole('button', { name: 'Remove first programme' }).click();
  await expectSelectedProgramme(carousel, 2);
  await expect(progress).toHaveAttribute('aria-valuenow', '1');
  await expect(progress).toHaveAttribute('aria-valuemax', '6');
});

test('resizing an interrupted smooth move releases its stale target without scrollend support', async ({ page }) => {
  // Supported older browsers do not emit scrollend. A resize must settle
  // pending navigation itself before the next native scroll is reconciled.
  await page.addInitScript(() => {
    const add = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, ...args) {
      if (type !== 'scrollend') return add.call(this, type, ...args);
    };
  });
  const { carousel, viewport, progress } = await openPausedCarousel(page);
  await viewport.evaluate(node => {
    const scroll = node.scrollTo.bind(node);
    node.scrollTo = options => { if (options.behavior !== 'smooth') scroll(options); };
  });
  await carousel.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expect(progress).toHaveAttribute('aria-valuenow', '2');
  await page.setViewportSize({ width: 768, height: 844 });
  await expectSelectedProgramme(carousel, 2);
  await viewport.evaluate(node => node.scrollTo({ left: 0, behavior: 'instant' }));
  await expect.poll(() => viewport.evaluate(node => node.scrollLeft)).toBeLessThan(2);
  await expect(progress).toHaveAttribute('aria-valuenow', '1');
});

test('emptying during a drag releases autoplay when records return', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/browser-acceptance/body-carousel');
  const carousel = page.getByRole('region', { name: 'Body carousel acceptance' });
  const viewport = carousel.locator('[id^="carousel-"]');
  const box = await viewport.boundingBox();
  await page.mouse.move(box.x + 180, box.y + 90);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 90, { steps: 4 });
  // Remove the viewport while it owns the pointer; this is a data update,
  // not a click that would deliver pointerup to the old viewport first.
  await page.getByRole('button', { name: 'Clear records' }).evaluate(button => button.click());
  await expect(carousel).toHaveCount(0);
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await page.getByRole('button', { name: 'Show two records' }).evaluate(button => button.click());
  await expect(carousel).toBeVisible();
  await expectSelectedProgramme(carousel, 1);
  await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '2');
  await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2', { timeout: 5500 });
});

test('a collection reorder during pending navigation keeps the requested programme selected', async ({ page }) => {
  const { carousel, viewport, progress } = await openPausedCarousel(page);
  await viewport.evaluate(node => {
    const scroll = node.scrollTo.bind(node);
    node.scrollTo = options => { if (options.behavior !== 'smooth') scroll(options); };
  });
  await carousel.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expect(progress).toHaveAttribute('aria-valuenow', '2');
  await page.getByRole('button', { name: 'Reverse programme order' }).click();
  await expectSelectedProgramme(carousel, 2);
  await expect(progress).toHaveAttribute('aria-valuenow', '6');
});

test('offscreen carousels stay still and resume only when visible', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const { carousel, progress } = await openPausedCarousel(page);
  await carousel.getByRole('button', { name: 'Resume automatic slides' }).click();
  await carousel.getByRole('button', { name: 'Pause automatic slides' }).evaluate(button => button.blur());
  await carousel.evaluate(root => {
    const spacer = document.createElement('div');
    spacer.style.height = '2000px';
    root.after(spacer);
    window.scrollTo(0, root.getBoundingClientRect().bottom + window.scrollY + 100);
  });
  await page.mouse.move(0, 0);
  await expect.poll(() => carousel.evaluate(root => root.getBoundingClientRect().bottom)).toBeLessThan(0);
  await page.waitForTimeout(3300);
  await expect(progress).toHaveAttribute('aria-valuenow', '1');
  await carousel.scrollIntoViewIfNeeded();
  await expect(progress).toHaveAttribute('aria-valuenow', '2', { timeout: 5500 });
  await carousel.getByRole('button', { name: 'Pause automatic slides' }).click();
  await carousel.evaluate(root => window.scrollTo(0, root.getBoundingClientRect().bottom + window.scrollY + 100));
  await carousel.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(3300);
  await expect(progress).toHaveAttribute('aria-valuenow', '2');
  expect(errors).toEqual([]);
});

test('keyboard activation survives a drag with no generated pointer click', async ({ page }) => {
  await page.goto('/browser-acceptance/body-carousel');
  const carousel = page.getByRole('region', { name: 'Body carousel acceptance' });
  await carousel.getByRole('button', { name: 'Pause automatic slides' }).click();
  const viewport = carousel.locator('[id^="carousel-"]');
  await viewport.evaluate(node => {
    // A cancelled browser gesture may produce pointerup without a click.
    // Synthetic pointer IDs are not registered for browser capture.
    const capture = node.setPointerCapture;
    node.setPointerCapture = () => {};
    try {
      node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0, buttons: 1, clientX: 100, pointerId: 1 }));
      node.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', buttons: 1, clientX: 70, pointerId: 1 }));
      node.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse', button: 0, pointerId: 1 }));
    } finally {
      node.setPointerCapture = capture;
    }
  });
  const flag = carousel.getByRole('button', { name: 'Mark programme 1', exact: true });
  await flag.focus();
  await page.keyboard.press('Enter');
  await expect(flag).toHaveAttribute('aria-pressed', 'true');
});
