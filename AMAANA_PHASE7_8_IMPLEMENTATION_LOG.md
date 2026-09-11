# Amaana Foundation — Phase 7/8 Implementation Log

Status: ACTIVE
Branch: `phase-public-site-rebuild`

Purpose: track accessibility, motion, crawl, browser-QA and release-hardening work without confusing source-level safeguards with real-device or staging certification.

## Phase 7 — Motion & accessibility hardening

Implemented in source:
- global `prefers-reduced-motion` safeguard now disables smooth scrolling and collapses decorative animation/transition timing across the application rather than relying only on route-specific rules;
- browser text-size adjustment remains enabled, protecting user zoom/text-resize preferences;
- forced-colors mode receives explicit focus and interactive-control borders;
- mobile navigation still derives open state from the current pathname, preserving the earlier hydration/state correction;
- opening the mobile menu transfers focus into the menu;
- Escape closes the menu and returns focus to the toggle;
- Tab/Shift+Tab are now contained across the toggle and expanded mobile navigation so keyboard focus cannot move behind the open menu;
- hosted `VIDEO` media now fails the public render/publication gate because synchronized caption-track metadata is not yet modeled. This prevents inaccessible hosted video from being published merely because a safe URL exists;
- image publication still requires meaningful alt text and all public media URLs remain HTTPS/root-relative gated.

Still not certified:
- screen-reader behavior on VoiceOver/NVDA/TalkBack;
- keyboard traversal on every public and transactional route in real browsers;
- 200%/400% zoom/reflow;
- real forced-colors/high-contrast review;
- touch-target measurements on representative devices;
- synchronized-caption architecture and real caption quality for hosted video;
- accessibility of content hosted by external video providers.

## Phase 8 — Automated QA / crawl hardening

Implemented in source:
- public static sitemap routes and private/transactional route families now share a central route-publication policy;
- `robots.ts` derives private disallow rules from that policy instead of maintaining a separate hard-coded list;
- `sitemap.ts` derives its static publication set from the same source of truth;
- a Vitest guard verifies that private/transactional route examples remain private, public static routes do not intersect private prefixes, and publication rules contain no duplicates;
- global Next.js headers now apply `private, no-store` to `/api/*` as a fail-closed fallback in addition to the explicit transactional page families;
- production indexing still requires the existing explicit allow flag on the official HTTPS domain;
- structured data remains intentionally free of an official logo claim while the master branding archive is unresolved.

CI note:
- the first publication-policy test run exposed that Vitest does not resolve the application `@` alias; the test was corrected to the repository's existing relative-import convention instead of expanding runner configuration unnecessarily.

Still open for Phase 8 certification:
- browser-level E2E tests for release-critical journeys;
- rendered crawl/metadata validation against a production-like deployment;
- representative mobile/tablet/desktop visual regression review;
- Chrome/Safari/Firefox verification;
- staged Razorpay success/failure/retry/reconciliation journeys;
- staged Request Assistance upload/receipt/tracking/reviewer journeys;
- Core Web Vitals and route transfer budgets;
- Search Console/index monitoring after an explicit production-indexing release decision.

## Certification rule

Source changes, unit tests and green CI reduce risk but do not certify visual, browser, assistive-technology, payment, storage or production-indexing behavior. Those gates close only after the corresponding production-like or real-device evidence exists.
