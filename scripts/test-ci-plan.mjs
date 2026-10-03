import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planChanges } from './ci-plan.mjs';

test('owner policy and institutional surface polish selects responsive regressions', () => {
  const files = ['src/app/canonical-content.css', 'src/app/policy-experience.css', 'src/components/trust-evidence-boundary.module.css', 'src/app/refund-policy/refund-audit.module.css', 'src/app/compliance/compliance-audit.module.css'];
  const plan = planChanges(files);
  assert.equal(plan.mode, 'focused');
  assert.ok(plan.tests.includes('owner-surface-polish.spec.mjs'));
  assert.ok(plan.tests.includes('policy-navigation.spec.mjs'));
  assert.equal(planChanges([...files, 'src/app/api/assistance/route.ts']).mode, 'full');
  assert.equal(planChanges([...files, 'unknown-module.css']).mode, 'full');
  assert.equal(planChanges(files, {target:'main'}).mode, 'full');
});

test('donation and sponsorship presentation uses focused route acceptance', () => {
  const files = ['src/app/donate/page.tsx', 'src/app/get-involved/sponsor-education/sponsor-education.css', 'e2e/donate-sponsorship-layout.spec.mjs'];
  const plan = planChanges(files);
  assert.equal(plan.mode, 'focused');
  assert.ok(plan.tests.includes('donate-sponsorship-layout.spec.mjs'));
  assert.ok(plan.tests.includes('donation-assistance-journeys.spec.mjs'));
  assert.equal(planChanges([...files, 'src/app/api/donations/order/route.ts']).mode, 'full');
  assert.equal(planChanges(files, {target: 'main'}).mode, 'full');
});

test('expanded Companion presentation selects its keyboard and chrome checks', () => {
  const files = ['src/components/islamic-companion.tsx', 'src/components/islamic-companion-panel.tsx', 'src/components/islamic-companion-panel.module.css', 'e2e/companion-panel.spec.mjs'];
  const plan = planChanges(files);
  assert.equal(plan.mode, 'focused');
  assert.equal(plan.database, false);
  assert.ok(plan.tests.includes('companion-panel.spec.mjs'));
  assert.ok(plan.tests.includes('navigation-resilience.spec.mjs'));
  assert.equal(planChanges([...files, 'src/app/api/public/islamic-companion/route.ts']).mode, 'full');
  assert.equal(planChanges(files, {target: 'main'}).mode, 'full');
});

test('shared menu presentation and interaction select navigation resilience coverage', () => {
  const plan = planChanges(['src/components/site-header.tsx', 'src/components/site-header.module.css', 'e2e/navigation-resilience.spec.mjs']);
  assert.equal(plan.mode, 'focused');
  assert.equal(plan.database, false);
  assert.ok(plan.tests.includes('navigation-resilience.spec.mjs'));
  assert.ok(plan.tests.includes('site-chrome-footer.spec.mjs'));
  assert.ok(plan.tests.includes('page-banner-standardization.spec.mjs'));
  assert.equal(planChanges(['src/components/site-header.tsx', 'src/lib/auth.ts']).mode, 'full');
  assert.equal(planChanges(['src/components/site-header.tsx'], { target: 'main' }).mode, 'full');
});
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


test("owner screenshot acceptance edits retain focused verification", () => {
  const plan = planChanges(["e2e/owner-screenshot-polish.spec.mjs"]);
  assert.equal(plan.mode, "focused");
  assert.equal(plan.database, false);
  assert.equal(plan.crossBrowser, false);
  assert.ok(plan.tests.includes("owner-screenshot-polish.spec.mjs"));
});


test('state and shared participation CSS retain their presentation and journey regressions', () => {
  const p = planChanges(['src/app/state-experience.css', 'src/app/home-experience.css', 'src/app/home-documentary.css', 'e2e/ui-consistency.spec.mjs', 'e2e/body-carousel-new.spec.mjs']);
  assert.equal(p.mode, 'focused');
  assert.equal(p.database, false);
  assert.equal(p.crossBrowser, false);
  for (const name of ['ui-consistency.spec.mjs', 'page-banner-standardization.spec.mjs', 'donation-assistance-journeys.spec.mjs', 'participation-contact.spec.mjs', 'body-carousel-new.spec.mjs']) assert.ok(p.tests.includes(name));
  assert.ok(planChanges(['src/app/home-documentary.css']).tests.includes('ui-consistency.spec.mjs'));
  assert.ok(planChanges(['src/app/faith-and-reflections/page.tsx']).tests.includes('ui-consistency.spec.mjs'));
  assert.equal(planChanges(['src/components/evidence-pathway.module.css']).mode, 'focused');
  assert.equal(planChanges(['src/components/donation-acknowledgement-client.tsx']).mode, 'full');
});


test('audited page and evidence layout paths avoid the whole-site shell matrix', () => {
  const p = planChanges(['src/app/contact/page.tsx', 'src/app/contact/contact-audit.module.css', 'src/app/faith-and-reflections/page.tsx', 'src/app/impact/page.tsx', 'src/app/our-work/page.tsx', 'src/components/trust-evidence-boundary.tsx', 'src/components/evidence-pathway.module.css']);
  assert.equal(p.mode, 'focused');
  assert.ok(!p.tests.includes('public-shell.spec.mjs'));
  for (const t of ['ui-consistency.spec.mjs', 'section-heading.spec.mjs', 'typography-hierarchy.spec.mjs', 'public-seo.spec.mjs', 'participation-contact.spec.mjs', 'initiative-detail.spec.mjs']) assert.ok(p.tests.includes(t));
  assert.equal(planChanges(['src/components/section-heading.module.css']).tests.includes('public-shell.spec.mjs'), true);
  assert.equal(planChanges(['src/app/impact/page.tsx', 'src/lib/public-page-data.ts']).mode, 'full');
  assert.equal(planChanges(['src/app/contact/page.tsx'], {release:true}).mode, 'full');
});

test('private intake presentation selects its surfaces and existing transactional journeys', () => {
  const p = planChanges(['src/app/request-assistance/page.tsx', 'src/app/request-assistance/assistance-surface.module.css', 'src/app/assistance-wow.css', 'src/components/assistance-form.module.css', 'e2e/assistance-surface.spec.mjs']);
  assert.equal(p.mode, 'focused');
  assert.equal(p.database, false);
  assert.equal(p.crossBrowser, false);
  assert.ok(!p.tests.includes('public-shell.spec.mjs'));
  for (const name of ['assistance-surface.spec.mjs', 'donation-assistance-journeys.spec.mjs', 'page-banner-standardization.spec.mjs', 'typography-hierarchy.spec.mjs']) assert.ok(p.tests.includes(name));
  assert.equal(planChanges(['src/app/request-assistance/page.tsx', 'src/app/api/assistance/route.ts']).mode, 'full');
  assert.equal(planChanges(['src/components/assistance-form.tsx']).mode, 'full');
  assert.equal(planChanges(['src/app/request-assistance/page.tsx'], { target: 'main' }).mode, 'full');
});

test('policy navigation styles retain reading and anchor checks without the whole-site matrix', () => {
  const p = planChanges(['src/app/policy-experience.css', 'src/components/policy-toc.module.css', 'e2e/policy-navigation.spec.mjs']);
  assert.equal(p.mode, 'focused');
  assert.equal(p.database, false);
  assert.equal(p.crossBrowser, false);
  assert.ok(!p.tests.includes('public-shell.spec.mjs'));
  for (const name of ['policy-navigation.spec.mjs', 'typography-hierarchy.spec.mjs', 'public-performance.spec.mjs']) assert.ok(p.tests.includes(name));
  assert.equal(planChanges(['src/app/policy-experience.css', 'src/lib/auth.ts']).mode, 'full');
  assert.equal(planChanges(['src/components/policy-toc.module.css'], { target: 'main' }).mode, 'full');
});

test('shared accessibility utility changes retain full global acceptance', () => {
  const p = planChanges(['src/app/policy-experience.css', 'src/app/accessibility.css', 'e2e/policy-navigation.spec.mjs']);
  assert.equal(p.mode, 'full');
  assert.equal(p.database, true);
  assert.equal(p.crossBrowser, true);
});
