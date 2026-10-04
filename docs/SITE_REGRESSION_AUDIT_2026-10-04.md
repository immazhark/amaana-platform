# Site regression audit — 4 October 2026

Owner requested a complete regression audit and fixes. Integration baseline: `1e1a542c2762d85671473256f022e73d6b610060`, tree `bf096d82867ad52b9a7f48df7d95444fdf490954`. Delivery branch: `fix/site-regression-audit-20261004`. This document distinguishes automated acceptance, screenshot review and live observations; it does not claim that every possible content or operational state is defect free.

## Findings and fixes

| Severity | Finding and evidence | Change |
| --- | --- | --- |
| High | Live private tracking page emitted React hydration error 418: server and browser selected different initial credential states. | Shared client credential store supplies the same initial server/hydration snapshot, captures private credentials before scrubbing and handles same-page fragment/history navigation. Hashchange uses its event URL because a preceding render can already have scrubbed the address. |
| High | Tracking service/network failure was rendered as an invalid link with a new-request action, risking duplicate requests. | Distinct failure state and retry preserve credentials only in the current tab; abort cleanup prevents stale responses. Invalid links retain the privacy boundary. |
| Medium | Opening the received page without a private reference still displayed positive request-received copy. | Missing-reference confirmation explicitly explains that opening the page does not submit a request; valid private-reference behavior remains. |
| Medium | Automatic body carousels repeatedly announced their slide status. | Live announcements are disabled during automatic playback and become polite when paused or reduced motion is selected. |
| Medium | Contact navigation retained arbitrary numbered badges, including “02A”, inconsistent with approved premium functional icons. Live screenshot confirmed the legacy cards. | Six semantic decorative SVG icons use the shared icon grid, retaining the existing full-card labels, links, focus behavior, dimensions and public contact details. |
| Test integrity | Baseline full browser job failed two containment checks on intentionally offscreen carousel images, while document width remained contained. Run `37162099628`, job `111317694469`: 990 passed, 2 failed in 12.4 minutes. | Containment excludes only images inside explicitly bounded clipping carousel viewports. Document overflow and escaping viewport assertions remain; no size tolerance was loosened. |

## Regression coverage

The additional audit suite checks 39 named routes at 390 and 1440 pixels, including primary public pages, programme and individual work details, policies, private tracking/confirmation, admin entry/forbidden and missing/invalid states. It checks one main H1, document overflow, bounded carousel viewports, body H2 ceiling (56px), in-page anchors, runtime errors and mobile serious/critical WCAG 2/2.1 AA violations. Full-page captures scroll through lazy content. Two discovery tests follow published individual links from the work, appeals, stories and reflections indexes. Four targeted tests cover tracking hydration/retry at 320/720/1440 and confirmation/carousel announcements.

Existing seeded CI suites supply the broader keyboard, six-width responsive, zoom, reduced motion, donation, private assistance, webhook/security and protected operational simulation coverage. Real production payments, beneficiary submissions, email sends and staff account writes are not used as test fixtures. Authenticated operational acceptance uses isolated CI data, not production records.

## Validation checkpoints

- Local unit suite: 414 passed; six isolated-database tests skipped as designed in the fast suite.
- CI planner: 28 checks passed. Unknown new audit/hook/workflow paths select full acceptance; release/security/core fallback remains unchanged.
- Initial local focused production-browser batch: 18 passed in 23.4 seconds, including seven static routes on mobile/desktop and four behavioral checks; no retries. Final contact-icon and behavioral confirmation: six passed in 7.6 seconds. Loading-state new-request CTA was subsequently removed; final regression covers the pending request before releasing the mocked failure.
- Production build and TypeScript passed including contact icons. JS 813234/819200 bytes and CSS 344018/348160 bytes; final CI rechecks unchanged ceilings.
- Local full-page review: contact, private status/confirmation and four policy pages at mobile/desktop. No confirmed new layout defect in those captures. Contact icons additionally checked in the final mobile/desktop browser confirmation.
- Baseline 111 MB release artifact could not be transferred through the authorized download path. Its screenshot set was not visually inspected. New mobile/desktop audit artifacts are uploaded separately for supported transfers and final visual review.

## Delivery

Full CI, screenshot review, merge and exact-commit Railway/live verification are pending. Preserve approved gradients/lattice, canonical facts/media, header and body typography, fixed Companion, unchanged bundle ceilings and protected main/draft PR104. No database schema, dependency, payment or email implementation change is included.
