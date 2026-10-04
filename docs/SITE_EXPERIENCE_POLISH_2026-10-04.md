# Sitewide experience polish — 4 October 2026

Owner delegates implementation across all pages, preserving Amaana’s approved photography, patterns and typography. Work is grouped by shared dependency before page families. Integration base ad1a9941f087297235492795f9ac42c82e2cd557; main and draft PR104 remain protected.

## Batch 1: shared interaction and readable contrast

- Replace persistent native hover animations/computed-style reads with Motion’s named mini engine, restrained press/hover/focus feedback, one-time body introduction entrances, route cleanup and live reduced-motion cancellation. Server content remains visible before hydration. No particle canvas or animated factual copy added where it would distract from reading.
- Pin maintained `lenis` 1.3.26 (the former scoped package is unavailable). Load on eligible fine-pointer wheel interaction. Native touch, keyboard, anchors/history, nested carousels, forms/dialogs and admin scrolling remain available. Run RAF only while scrolling; destroy on route changes, reduced motion or hidden documents.
- Darken secondary/gold text ink for enhanced contrast while preserving primary blue/gold assets and backgrounds. Correct assistance descriptions/step numbers and replace Get Involved number markers with functional SVG icons.
- Use named Zod Mini APIs for the existing gallery manifest contract to make room within the unchanged JS budget. Strict fields, exact counts, privacy/publication locks, path safety, pixel/byte ceilings and duplicate guards remain enforced. Added 23 meaningful boundary checks; 440 unit checks pass, six isolated-database fast skips.

New browser acceptance covers wheel activation/settling, runtime reduced motion, focus, route cleanup, carousel keyboard interaction, native touch/menus and enhanced text contrast across 26 routes. Fine-pointer eligibility is explicitly modeled because headless Linux has no physical pointer. Local non-database interaction checks pass; real data routes require seeded CI, and error/fallback pages do not count as route content validation. TypeScript/build and lint pass with one pre-existing importer warning. PR163 merged ascb3cf8b90f2e76044669e500410a2f0c7d3de68d on exact tested tree04797598d2dd5743717193bd1686e7f2a2e896ae. Initial seeded CI found five enhanced text contrast failures and one mobile route failure. The route trace proved Motion stop() committed styles on a hidden menu link, triggering the global error boundary; cancellation now avoids committing hidden targets. Legacy home, donation, recognition and programme metric colors now use the shared contrast tokens. Navigation regression also asserts the destination heading and zero page errors; contrast checks reject the global interruption page. Local 440 unit checks pass (six database skips), lint has no errors and one existing importer warning; production TypeScript/build passes. Static JS818952/819200 and CSS346758/348160 stay within unchanged caps. Additional fine-pointer compact-menu audit reproduced background scroll through a CSS-only body lock; the shared Lenis guard now recognizes the open menu and regression verifies containment plus Escape release. Corrected CI37225113277 SUCCESS:888 Chromium checks in16.5minutes and24 Firefox/WebKit smoke checks in34.2seconds, without retries; fast/database/verify jobs green. Integration build, Railway and live verification pending.

## Page inventory and remaining work

Each source page/template is listed below. Shared polish is inherited; a route is not considered separately reviewed merely because its shared layer changed. Dynamic programme/initiative children, articles and private journey states require their existing seeded suites plus visual checks. Further batches will cover discovery/editorial pages, initiative/detail and campaign journeys, participation/forms/trust pages, and protected operational states. No claim of full WCAG AAA conformance: enhanced text contrast is one criterion; human screen-reader/zoom review remains separate.

| Route | Surface | Status |
| --- | --- | --- |
| `/about` | Public page/template | Shared layer validated; family review tracked |
| `/admin/appeals/[id]` | Protected operations | Shared layer validated; family review tracked |
| `/admin/appeals` | Protected operations | Shared layer validated; family review tracked |
| `/admin/audit` | Protected operations | Shared layer validated; family review tracked |
| `/admin/donations/[id]` | Protected operations | Shared layer validated; family review tracked |
| `/admin/donations` | Protected operations | Shared layer validated; family review tracked |
| `/admin/home-carousel` | Protected operations | Shared layer validated; family review tracked |
| `/admin/media` | Protected operations | Shared layer validated; family review tracked |
| `/admin/notifications` | Protected operations | Shared layer validated; family review tracked |
| `/admin` | Protected operations | Shared layer validated; family review tracked |
| `/admin/requests/[id]` | Protected operations | Shared layer validated; family review tracked |
| `/admin/retention` | Protected operations | Shared layer validated; family review tracked |
| `/admin/forbidden` | Protected operations | Shared layer validated; family review tracked |
| `/admin/login` | Protected operations | Shared layer validated; family review tracked |
| `/appeals/[slug]` | Public page/template | Shared layer validated; family review tracked |
| `/appeals` | Public page/template | Shared layer validated; family review tracked |
| `/browser-acceptance/admin` | Isolated fixture | Shared layer validated; family review tracked |
| `/browser-acceptance/body-carousel` | Isolated fixture | Shared layer validated; family review tracked |
| `/browser-acceptance/direct-donation` | Isolated fixture | Shared layer validated; family review tracked |
| `/browser-acceptance/donation` | Isolated fixture | Shared layer validated; family review tracked |
| `/browser-acceptance/gallery` | Isolated fixture | Shared layer validated; family review tracked |
| `/browser-acceptance/home-hero` | Isolated fixture | Shared layer validated; family review tracked |
| `/browser-acceptance/mobile-support` | Isolated fixture | Shared layer validated; family review tracked |
| `/browser-acceptance/portfolio` | Isolated fixture | Shared layer validated; family review tracked |
| `/browser-acceptance/section-layout` | Isolated fixture | Shared layer validated; family review tracked |
| `/compliance` | Public page/template | Shared layer validated; family review tracked |
| `/contact` | Public page/template | Shared layer validated; family review tracked |
| `/donate/[slug]` | Public page/template | Shared layer validated; family review tracked |
| `/donate` | Public page/template | Shared layer validated; family review tracked |
| `/donation-policy` | Public page/template | Shared layer validated; family review tracked |
| `/donations/[reference]/acknowledgement` | Public page/template | Shared layer validated; family review tracked |
| `/faith-and-reflections/[slug]` | Public page/template | Shared layer validated; family review tracked |
| `/faith-and-reflections` | Public page/template | Shared layer validated; family review tracked |
| `/get-involved` | Public page/template | Shared layer validated; family review tracked |
| `/get-involved/sponsor-education` | Public page/template | Shared layer validated; family review tracked |
| `/governance` | Public page/template | Shared layer validated; family review tracked |
| `/how-we-verify` | Public page/template | Shared layer validated; family review tracked |
| `/impact` | Public page/template | Shared layer validated; family review tracked |
| `/our-work/[slug]` | Public page/template | Shared layer validated; family review tracked |
| `/our-work/dates-distribution` | Public page/template | Shared layer validated; family review tracked |
| `/our-work/eid-gift-kits` | Public page/template | Shared layer validated; family review tracked |
| `/our-work/hyderabad-flood-relief-2020` | Public page/template | Shared layer validated; family review tracked |
| `/our-work/medical-financial-assistance` | Public page/template | Shared layer validated; family review tracked |
| `/our-work` | Public page/template | Shared layer validated; family review tracked |
| `/our-work/qurbani-meat-distribution` | Public page/template | Shared layer validated; family review tracked |
| `/our-work/taleem` | Public page/template | Shared layer validated; family review tracked |
| `/our-work/winter-relief` | Public page/template | Shared layer validated; family review tracked |
| `/` | Public page/template | Shared layer validated; family review tracked |
| `/partner` | Public page/template | Shared layer validated; family review tracked |
| `/privacy` | Public page/template | Shared layer validated; family review tracked |
| `/programmes/[slug]` | Public page/template | Shared layer validated; family review tracked |
| `/recognition` | Public page/template | Shared layer validated; family review tracked |
| `/refund-policy` | Public page/template | Shared layer validated; family review tracked |
| `/request-assistance` | Public page/template | Shared layer validated; family review tracked |
| `/request-assistance/received` | Public page/template | Shared layer validated; family review tracked |
| `/request-assistance/status` | Public page/template | Shared layer validated; family review tracked |
| `/stories/[slug]` | Public page/template | Shared layer validated; family review tracked |
| `/stories` | Public page/template | Shared layer validated; family review tracked |
| `/terms` | Public page/template | Shared layer validated; family review tracked |
| `/transparency` | Public page/template | Shared layer validated; family review tracked |

Error, not-found and loading states inherit the same global motion/contrast policy and retain their dedicated regression suites.

## Batch 2: programme closing alignment (PR164 validating, not deployed)

Captured programme detail pages retain a centered closing title/CTA, inconsistent with the owner's body heading grid. Extract the existing actions into a server-only ProgrammeNext component using SectionHeading, preserving copy/destinations and the continuous page lattice. Desktop title aligns to shell left and actions occupy the right track; at 900px and below they stack with at least19px separation. The actual component is exercised in the existing protected section-layout fixture; seeded initiative narrative tests retain factual/background/containment checks and now assert the intended grid geometry instead of a centered layout. No client dependency, database, payment or factual change. Local static JS818952/819200, CSS346708/348160. Seven responsive fixture checks pass at320,390,768,900,1024,1440,1920px, including axe and actual desktop/mobile visual inspection. All30 planner regressions pass; scoped changes select10 dependency suites, while shared scrolling, auth, API, workflow and unknown changes stay full. Seeded delivery remains pending.

## Bounded audit observations

Initial seeded capture metadata is clean for39 desktop and39 mobile routes: no horizontal overflow, oversized body H2s, escaped tracks, broken anchors or page errors. Visually inspected overview/header, participation/form, programme and footer families through combined sheets; these sheets support hierarchy/alignment review, not a claim that every pixel or private state was manually inspected. Motion route crash, five contrast families and compact fine-pointer menu leakage were reproduced and fixed in batch1. The detector's gradient-statistic and blue-note border warnings preserve established owner-approved styling; legacy quick-link padding transitions remain a minor future performance item. No claim of full AAA certification or whole-site defect freedom.
