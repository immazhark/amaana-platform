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
 expect(peek).toBeGreaterThan(.15);expect(peek).toBeLessThan(.21);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 const visual=first.locator('.canonical-pathway-visual');const image=await visual.boundingBox();expect(image.width/image.height).toBeCloseTo(16/9,1);
 await carousel.getByRole('button',{name:'Pause automatic slides'}).click();
 await carousel.getByRole('button',{name:'Next slide',exact:true}).click();
 await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow','2');
 await page.waitForTimeout(700);
 const second=await carousel.getByRole('group',{name:'2 of 7',exact:true}).boundingBox();expect(Math.abs(v.x-second.x)).toBeLessThan(2);
 await viewport.focus();await page.keyboard.press('End');await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow','7');
 await page.waitForTimeout(700);const last=await carousel.getByRole('group',{name:'7 of 7',exact:true}).boundingBox();expect(Math.abs(v.x-last.x)).toBeLessThan(2);
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
