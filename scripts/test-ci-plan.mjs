import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planChanges } from './ci-plan.mjs';
test('docs skip application checks', () => { const p = planChanges(['docs/guide.md']); assert.equal(p.app,false); assert.equal(p.mode,'none'); });
test('carousel selects dependency and performance tests', () => { const p = planChanges(['src/components/body-carousel.tsx']); assert.equal(p.mode,'focused'); assert.ok(p.tests.includes('carousel-acceptance.spec.mjs')); assert.ok(p.tests.includes('public-performance.spec.mjs')); });
test('gallery CSS selects gallery suite', () => assert.ok(planChanges(['src/components/campaign-media-gallery.module.css']).tests.includes('campaign-gallery.spec.mjs')));
test('mixed shared changes widen coverage', () => assert.equal(planChanges(['src/components/body-carousel.tsx','src/app/globals.css']).mode,'full'));
test('security/payment/config/unknown and empty diffs fail closed', () => { for (const f of ['src/app/api/webhooks/razorpay/route.ts','prisma/schema.prisma','.github/workflows/ci.yml','package-lock.json','unknown']) assert.equal(planChanges([f]).mode,'full'); assert.equal(planChanges([]).mode,'full'); });
test('integration avoids duplicate acceptance but keeps application checks', () => { const p = planChanges(['src/app/globals.css'],{event:'push',validatedMerge:true}); assert.equal(p.mode,'none'); assert.equal(p.app,true); });
test('production and manual release enforce all checks even for docs', () => { for (const opts of [{target:'main'},{release:true},{target:'main',event:'push'}]) { const p = planChanges(['docs/a.md'],opts); assert.equal(p.mode,'full'); assert.equal(p.app,true); assert.equal(p.visual,true); assert.equal(p.crossBrowser,true); } });

test('direct or unverified integration pushes retain acceptance', () => assert.equal(planChanges(['src/app/globals.css'], {event:'push'}).mode,'full'));

test('routine chrome, portfolio, content and approved assets use focused verification', () => {
  for (const file of ['src/components/site-header.tsx','src/components/work-portfolio.tsx','src/content/master-copy.json','public/backgrounds/body.svg','src/app/about/page.tsx']) assert.equal(planChanges([file]).mode,'focused');
});
test('global motion, navigation, auth and dependencies keep full acceptance', () => {
  for (const file of ['src/components/site-motion.tsx','src/components/navigation-progress.tsx','src/app/layout.tsx','src/lib/auth.ts','package.json']) assert.equal(planChanges([file]).mode,'full');
});
test('mixed mapped changes union tests without duplicates', () => {
  const p = planChanges(['src/components/body-carousel.tsx','src/components/campaign-media-gallery.module.css']);
  assert.equal(p.mode,'focused'); assert.ok(p.tests.includes('campaign-gallery.spec.mjs')); assert.equal(new Set(p.tests).size,p.tests.length);
});

test('presentation changes skip database ledger checks; core changes and releases retain them', () => {
  assert.equal(planChanges(['src/components/site-header.tsx']).database,false);
  assert.equal(planChanges(['src/app/api/webhooks/razorpay/route.ts']).database,true);
  assert.equal(planChanges(['docs/a.md']).database,false);
  assert.equal(planChanges(['docs/a.md'],{release:true}).database,true);
});


test('participation and contact presentation changes use focused browser checks', () => {
  const plan = planChanges(['src/components/participation-card.tsx', 'src/app/contact/page.tsx', 'src/app/get-involved/get-involved-audit.module.css', 'src/components/work-visual-placeholder.module.css', 'e2e/participation-contact.spec.mjs', 'scripts/ci-plan.mjs']);
  assert.equal(plan.mode, 'focused');
  assert.equal(plan.database, false);
  assert.equal(plan.crossBrowser, false);
  assert.ok(plan.tests.includes('participation-contact.spec.mjs'));
});


test('shared public heading and footer styles use comprehensive focused presentation checks', () => {
  const plan = planChanges(['src/components/section-heading.module.css', 'src/components/canonical-article.tsx', 'src/app/site-chrome.css', 'src/app/our-work/[slug]/page.tsx', 'src/app/get-involved/sponsor-education/page.tsx']);
  assert.equal(plan.mode, 'focused');
  assert.equal(plan.database, false);
  assert.equal(plan.crossBrowser, false);
  assert.ok(plan.tests.includes('section-heading.spec.mjs'));
  assert.ok(plan.tests.includes('public-shell.spec.mjs'));
  assert.ok(plan.tests.includes('initiative-detail.spec.mjs'));
  assert.equal(planChanges(['src/app/api/webhooks/razorpay/route.ts']).mode, 'full');
});
