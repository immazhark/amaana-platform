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
