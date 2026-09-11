# Amaana Foundation — Phase 7/8 Implementation Log

Status: ACTIVE / SOURCE-HARDENED, REAL-ENVIRONMENT CERTIFICATION OPEN
Branch: `phase-public-site-rebuild`

Purpose: track accessibility, motion, crawl, browser-QA and release-hardening work without confusing source-level safeguards with real-device or staging certification.

## Phase 7 — Motion & accessibility hardening

Implemented in source:
- global `prefers-reduced-motion` safeguard disables smooth scrolling and collapses decorative animation/transition timing across the application rather than relying only on route-specific rules;
- browser text-size adjustment remains enabled, protecting user zoom/text-resize preferences;
- forced-colors mode receives explicit focus and interactive-control borders;
- mobile navigation still derives open state from the current pathname, preserving the earlier hydration/state correction;
- opening the mobile menu transfers focus into the menu;
- Escape closes the menu and returns focus to the toggle;
- Tab/Shift+Tab are contained across the toggle and expanded mobile navigation so keyboard focus cannot move behind the open menu;
- Request Assistance moves focus to the first server-reported invalid field after a rejected submission while retaining field-linked visible errors and ARIA state;
- hosted `VIDEO` media fails the public render/publication gate because synchronized caption-track metadata is not yet modeled. This prevents inaccessible hosted video from being published merely because a safe URL exists;
- image publication still requires meaningful alt text and all public media URLs remain HTTPS/root-relative gated;
- small gold sequence/meaning labels on light trust-page surfaces were moved to the working Amaana blue because the current gold is not suitable for normal-sized light-background text; gold remains in dark-surface/accent roles and forced-colors fallbacks were added to signature trust components.

Still not certified:
- screen-reader behavior on VoiceOver/NVDA/TalkBack;
- keyboard traversal on every public and transactional route in real browsers;
- 200%/400% zoom/reflow;
- real forced-colors/high-contrast review;
- touch-target measurements on representative devices;
- synchronized-caption architecture and real caption quality for hosted video;
- accessibility of content hosted by external video providers.

## Phase 8 — Automated QA / crawl / release hardening

Implemented in source:
- public static sitemap routes and private/transactional route families share a central route-publication policy;
- `robots.ts` derives private disallow rules from that policy instead of maintaining a separate hard-coded list;
- `sitemap.ts` derives its static publication set from the same source of truth;
- private route matching is segment-safe: bare roots and descendants are protected without swallowing similarly named public paths;
- a Vitest guard verifies private/transactional examples remain private, public static routes do not intersect private prefixes, similarly named public routes are not falsely classified, and publication rules contain no duplicates;
- global Next.js headers apply `private, no-store` to `/api/*` as a fail-closed fallback in addition to explicit transactional page families;
- production indexing still requires the existing explicit allow flag on the official HTTPS domain;
- structured data remains intentionally free of an official logo claim while the master branding archive is unresolved;
- donation verification transport/non-JSON failures are caught inside the Razorpay payment handler instead of leaving the UI stuck in a verifying state;
- once Razorpay has returned a payment response, a failed Amaana confirmation moves the form to a reconciliation state that prevents a second payment attempt and instructs the donor to retain the Razorpay confirmation without sharing OTPs, UPI PINs or card credentials;
- CI now starts the built production server after `next build`, verifies liveness, renders `/about` and `/request-assistance`, and checks critical no-store/security headers;
- the post-build server smoke gate passed in CI #340;
- CI now measures aggregate built static JavaScript and CSS after every production build and enforces regression budgets;
- first measured production output was 616,855 bytes of built static JavaScript and 196,210 bytes of built static CSS;
- based on that evidence, budgets were tightened to 800 KiB JavaScript and 256 KiB CSS, preserving roughly one-third growth headroom while failing meaningful bundle regressions.

CI evidence:
- publication-policy tests are passing with the repository's existing relative-import Vitest convention;
- CI #340 passed install, Prisma generation/validation, lint, typecheck, coverage, production build and running-server smoke checks;
- the first measured bundle-budget run passed with 616,855 B JS / 196,210 B CSS before thresholds were tightened;
- the final tightened-budget run remains the active checkpoint and must be green before this source-level batch is treated as verified.

Still open for Phase 8 certification:
- browser-level E2E tests for release-critical journeys using stable production-like fixtures;
- rendered crawl/metadata validation against a production-like deployment;
- representative mobile/tablet/desktop visual review;
- Chrome/Safari/Firefox verification;
- staged Razorpay success/failure/retry/reconciliation/refund journeys;
- staged Request Assistance upload/receipt/tracking/reviewer/cleanup-failure journeys;
- Core Web Vitals (LCP, INP, CLS) and slow-network behavior on production-like hosting;
- route-level transfer profiling beyond the aggregate static bundle regression gate;
- Search Console/index monitoring after an explicit production-indexing release decision.

## Phase 9 boundary

Phase 9 is not started/certified merely because source-level CI is green. A production-like staging URL and access to the deployed Railway/provider environment are required to verify real storage, Razorpay, notifications, database migrations, rendered browser behavior and indexing controls. No staging verification is claimed from repository inspection alone.

`main` remains untouched until explicit approval.

## Certification rule

Source changes, unit tests, aggregate bundle budgets and green CI reduce risk but do not certify visual, browser, assistive-technology, payment, storage or production-indexing behavior. Those gates close only after the corresponding production-like or real-device evidence exists.
