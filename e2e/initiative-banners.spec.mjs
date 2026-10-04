import { createRequire } from 'node:module';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// CI owns a disposable PostgreSQL container. Never seed an external/live database.
let prisma;
const fixturePrefix = 'initiative-banner-geometry-';
test.beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!process.env.CI || !url || new URL(url).hostname !== 'postgres') return;
  const require = createRequire(path.join(process.env.AMAANA_APP_WORKSPACE ?? process.cwd(), 'package.json'));
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  for (const slug of ['auto-rickshaw-livelihood-support', 'winter-relief', 'eid-gift-kits-2026']) {
    const record = await prisma.initiative.findUnique({ where: { slug }, select: { id:true, mediaAssets:{ where:{isPublic:true,privacyApprovedAt:{not:null}},select:{id:true} } } });
    if (!record || record.mediaAssets.length) continue;
    await prisma.mediaAsset.create({data:{id:fixturePrefix+slug,initiativeId:record.id,kind:'IMAGE',title:'Banner geometry fixture image',publicUrl:'/brand/amaana-mark.svg',altText:'Isolated banner geometry fixture image',width:800,height:600,isPublic:true,privacyApprovedAt:new Date(),sortOrder:0}});
  }
});
test.afterAll(async () => {
  if (!prisma) return;
  try { await prisma.mediaAsset.deleteMany({where:{id:{startsWith:fixturePrefix}}}); }
  finally { await prisma.$disconnect(); }
});

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`individual photo banners and story alignment at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    for (const slug of ['auto-rickshaw-livelihood-support', 'winter-relief', 'eid-gift-kits-2026']) {
      expect((await page.goto(`/our-work/${slug}`)).ok()).toBe(true);
      const photo = page.locator('.page-hero__visual img');
      await expect(photo).toHaveCount(1);
      await expect.poll(() => photo.evaluate(n => n.complete && n.naturalWidth > 0)).toBe(true);
      expect(await photo.getAttribute('alt')).not.toMatch(/collage/i);
      const geometry = await page.evaluate(() => {
        const visual = document.querySelector('.page-hero__visual');
        const copy = document.querySelector('.campaign-story-copy');
        const shell = copy.closest('.v2-shell');
        const heading = shell.querySelector('h2');
        const cards = [...document.querySelectorAll('.campaign-impact-strip>.v2-shell>div')];
        return {
          gap: Math.abs(copy.getBoundingClientRect().right - shell.getBoundingClientRect().right),
          mask: getComputedStyle(visual).maskImage,
          border: getComputedStyle(visual).borderTopWidth,
          font: getComputedStyle(heading).fontFamily,
          size: parseFloat(getComputedStyle(heading).fontSize),
          cards: cards.map(n => getComputedStyle(n).backgroundImage),
          pattern: getComputedStyle(document.querySelector('.canonical-programme')).backgroundImage,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        };
      });
      expect(geometry.gap).toBeLessThanOrEqual(1);
      expect(geometry.mask).toContain('linear-gradient');
      expect(geometry.border).toBe('0px');
      expect(geometry.font).toMatch(/Georgia|serif/i);
      expect(geometry.size).toBeLessThanOrEqual(56);
      expect(geometry.cards).toHaveLength(2);
      expect(geometry.cards.every(s => s.includes('linear-gradient'))).toBe(true);
      expect(geometry.cards[0]).not.toBe(geometry.cards[1]);
      expect(geometry.pattern).toContain('amaana-lattice-tile');
      expect(geometry.overflow).toBe(false);
      if (width === 390) {
        const result = await new AxeBuilder({ page }).include('.page-hero,.campaign-impact-strip,.campaign-story').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(result.violations.map(v => v.id)).toEqual([]);
      }
    }
  });
}

test('umbrella collage and no-media fallback stay distinct', async ({ page }) => {
  await page.goto('/our-work/eid-gift-kits');
  await expect(page.locator('.page-hero__visual img')).toHaveAttribute('alt', /collage/i);
  await page.goto('/our-work/jewellery-loan-intervention');
  await expect(page.locator('.page-hero__visual .work-visual-placeholder')).toHaveCount(1);
  await expect(page.locator('.page-hero__visual img[src*="/media/"]')).toHaveCount(0);
});
