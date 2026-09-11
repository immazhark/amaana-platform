# Amaana Foundation — Open Risk Register

Status: ACTIVE
Branch: `phase-public-site-rebuild`

Purpose: prevent unresolved quality, privacy, accessibility, performance or source-integrity issues from disappearing inside implementation progress. A green build does not close a risk unless the actual condition has been verified.

## Hard release gates

### 1. Official brand certification
**Status:** OPEN / BLOCKED BY ARCHIVE EXTRACTION

- `Branding & Logo.zip` exists and has been materialized.
- Current runtime still times out while enumerating/extracting it.
- Current blue/gold hex values are working approximations from supplied branded material, not certified master source values.
- Exact logo artwork, source colours, logo variants and production identity must be verified before launch.
- Do not add final logo structured data or claim official master colours until this is closed.

### 2. Authentic media population
**Status:** OPEN

- Media architecture, privacy gate, admin review and separate public-media storage boundary are implemented.
- Selected original Eid/Qurbani candidates still require target storage configuration, explicit public-use approval and actual publication.
- Documentary slots must never be filled with generated/stock beneficiary imagery merely to remove placeholders.

### 3. Source/archive completeness
**Status:** OPEN

- Several campaign archives remain incompletely enumerated because of runtime ZIP/file-access failures.
- No campaign history, count, expenditure or media claim may be expanded from memory/assumption where the retrievable source set is incomplete.
- `reviewed everything` remains prohibited until file-by-file inventory is real.

### 4. Payment workflow verification
**Status:** OPEN / SOURCE-HARDENED

- Razorpay UX/security structure exists and checkout script is deferred.
- Donation order/confirmation responses are explicitly `no-store, private`, including validation/authentication/failure responses.
- Transactional donation checkout and private acknowledgement routes are explicitly excluded from indexing; token-bearing acknowledgement pages also apply a `no-referrer` policy so receipt tokens are not propagated through subsequent navigation.
- Donation order creation, confirmation, capture reconciliation and acknowledgement use deliberately lean database projections rather than loading unrelated donor/payment fields.
- Global `/api/*` responses receive a `private, no-store` header fallback so a future endpoint does not become cacheable merely because its handler omitted a local header.
- Razorpay-handler confirmation failures are caught inside the asynchronous payment callback so the UI cannot remain indefinitely stuck in `verifying` after a transport/JSON failure.
- After Razorpay has returned a payment response, a failed Amaana confirmation moves the form into a locked reconciliation state rather than enabling another checkout attempt. Donors are instructed to retain the Razorpay confirmation and not to submit another payment or share OTPs, UPI PINs or card credentials.
- Staging order creation, checkout, capture verification, acknowledgement, failure, reconciliation, refund and duplicate/idempotency paths still require E2E verification.

### 5. Assistance workflow verification
**Status:** OPEN / SOURCE-HARDENED

- Private upload controls, rate limiting, tracking and accessibility semantics are implemented.
- Receipt/tracking routes are explicitly `noindex,nofollow`, assistance submission/tracking API responses are explicitly `no-store, private`, and token-bearing receipt/tracking pages apply `no-referrer` to prevent tracking-token propagation through navigation.
- Field-level server validation reaches the matching form controls with visible messages plus `aria-invalid`/descriptions instead of collapsing into a generic banner.
- After server-side field rejection, focus is moved to the first invalid control for keyboard/screen-reader recovery.
- Successfully uploaded private documents are tracked and compensated with narrowly scoped deletion if a later upload, recipient lookup or request database write fails.
- Full staging submission, file validation, cleanup failure-path verification, receipt, tracking, reviewer access and error/recovery journeys remain an E2E release gate.

### 6. Real performance certification
**Status:** OPEN / AUTOMATED REGRESSION GATE ACTIVE

- Source-level work has reduced query payloads, global CSS, third-party startup cost and eager media.
- Production-build static asset measurement is now part of CI. The first measured checkpoint was 616,855 bytes aggregate built JavaScript and 196,210 bytes aggregate built CSS.
- CI budgets were tightened from temporary ceilings to 800 KiB JavaScript and 256 KiB CSS so meaningful bundle growth now fails the build while leaving controlled headroom.
- The budget is an aggregate regression safeguard, not a substitute for route-level transfer analysis or real Core Web Vitals.
- Core Web Vitals have not yet been measured on representative production-like pages/devices.
- Required final evidence: LCP, INP, CLS, route JS/CSS/image transfer weight and slow-network behaviour.

### 7. Accessibility certification
**Status:** OPEN / ACTIVE / SOURCE-HARDENED

Implemented improvements include skip navigation, focus-visible treatment, mobile menu focus management, semantic progress indicators, labelled forms/live errors, field-associated assistance validation, global reduced-motion safeguards, accessible external-link wording and narrow-screen reflow safeguards that preserve the established 3rem interaction-height baseline.

Additional Phase 7 hardening now in source:
- reduced-motion collapses smooth scrolling plus animation/transition timing globally rather than relying on individual route styles;
- forced-colors mode receives explicit focus/control boundaries;
- expanded mobile navigation contains Tab/Shift+Tab focus across the menu and toggle while retaining Escape-to-close and focus return;
- Request Assistance focuses the first server-reported invalid field after submission rejection;
- hosted `VIDEO` media fails closed at the public render/publication gate until synchronized caption-track support is modeled and verified;
- small gold informational labels on light trust-page surfaces were shifted to the accessible working Amaana blue while gold remains in dark-surface/accent roles.

Still required:
- keyboard traversal across every major journey in real browsers;
- screen-reader spot checks;
- rendered contrast review;
- 200%/400% zoom and reflow in real browsers;
- touch-target audit beyond source-level safeguards;
- form error announcement review on real assistive technology;
- mobile menu focus containment/escape behaviour verification on real browsers;
- synchronized-caption architecture/content verification before hosted video is enabled, plus review of external-provider video accessibility.

### 8. Responsive/browser visual QA
**Status:** OPEN / SERVER-SMOKE GATE ACTIVE

- CSS contains responsive design work and additional narrow-screen wrapping/gutter safeguards, but source inspection is not visual certification.
- CI now starts the built production server and verifies liveness, rendering of `/about` and `/request-assistance`, and critical cache/security response headers. This post-build smoke gate passed in CI #340 and remains part of every subsequent build.
- Representative iOS/Android widths, tablet, laptop, wide desktop and Chrome/Safari/Firefox still require actual visual review for overflow, clipping, line wrapping, image cropping, sticky behaviour and focus visibility.

### 9. SEO/indexing production verification
**Status:** OPEN / HARDENED IN SOURCE

- Robots, sitemap, canonicals and structured data are implemented conservatively.
- Public static sitemap routes and private/transactional route families share one central publication policy instead of separate hard-coded route lists.
- Private route matching is segment-safe, covering bare roots and descendants without incorrectly classifying similarly named public paths.
- CI includes a guard that fails if the static publication set intersects a known private route family, route boundaries regress or duplicate publication rules are introduced.
- Request Assistance is included in the public sitemap while private receipt/status routes stay excluded and explicitly noindexed.
- Private donation acknowledgement routes are explicitly noindexed rather than relying on obscurity/tokenized URLs.
- Structured data still does not publish an official logo claim while master branding remains unresolved.
- Production indexing remains an explicit release action and is still gated by the official HTTPS-domain allow flag.
- Final rendered crawl, metadata/structured-data validation, Search Console submission and index monitoring remain open.

### 10. Compliance/legal confirmation
**Status:** OPEN WHERE PROFESSIONAL CONFIRMATION IS REQUIRED

- Current site correctly presents provisional 80G and domestic-only/no-FCRA boundaries.
- 12AB/12A position and provisional-80G conversion/renewal requirements still need CA confirmation.
- No functionality or copy may imply a final tax position before that confirmation.

## Active technical hardening risks

### Public-media orphan objects
**Status:** MITIGATED IN CODE / STAGING VERIFICATION OPEN

- Metadata validation occurs before storage upload.
- Managed public-media uploads have a compensation path: if the subsequent `MediaAsset` database create fails, the just-uploaded managed object is deleted from the public bucket before the original database error is re-thrown.
- Cleanup accepts only the application's managed `YEAR/UUID.ext` key pattern so it cannot be used as a general arbitrary-object deletion primitive.
- If both DB creation and cleanup fail, the cleanup failure is logged without hiding the original creation failure.

Remaining verification: exercise the failure path against the configured staging S3-compatible provider and confirm object deletion behavior before calling this risk CLOSED.

### Private assistance orphan documents
**Status:** MITIGATED IN CODE / STAGING VERIFICATION OPEN

- Assistance documents are uploaded sequentially so each successfully persisted object is known before the request transaction proceeds.
- If a later upload, staff-recipient lookup or assistance-request database create fails, the application attempts to delete every private object already stored for that request before rethrowing the original failure.
- Cleanup accepts only the managed `assistance/<request-id>/<UUID>.(pdf|jpg|png|webp)` key shape and requires the matching request id, avoiding an arbitrary private-bucket deletion primitive.
- Cleanup failures are logged without replacing the original submission failure.

Remaining verification: deliberately exercise a post-upload failure against staging storage and confirm the private objects are removed before closing this risk.

### Video accessibility
**Status:** FAIL-CLOSED IN CODE / CAPTION ARCHITECTURE STILL OPEN

- Hosted `VIDEO` assets cannot pass `canRenderPublicMedia`, and the admin publication action gives a specific caption-support error rather than allowing an inaccessible hosted video to become public.
- The existing renderer still contains video support, but the publication/render gate prevents it from receiving an approved hosted `VIDEO` record under the current model.
- Re-enabling hosted video requires modeled synchronized-caption metadata, safe caption-track rendering and real caption-quality verification.
- External video links remain subject to separate provider/content accessibility review.

### CSP hardening
**Status:** RESIDUAL

Security headers are present and restrictive in important areas, but Next.js/Razorpay integration currently retains `unsafe-inline` allowances for scripts/styles. A nonce/hash-based CSP can be investigated as a later hardening step, but must not be introduced casually if it breaks checkout or framework rendering.

### Automated E2E coverage
**Status:** PARTIAL / STAGING BROWSER COVERAGE OPEN

Current CI covers install, Prisma generation/validation, lint, typecheck, unit/coverage tests, production build, aggregate static bundle budgets and a running-server HTTP/header smoke gate. Deterministic route-publication/crawl boundaries are also tested.

Browser-level E2E for release-critical donation, assistance, media/admin and responsive interactions is still not part of CI. A production-like staging environment and stable fixtures are required before those tests can become a trustworthy release gate.

## Continuity corrections made during Phase 6/7/8

- Corrected stale execution documentation that still described Phase 6/7 as pending.
- Corrected earlier documentation that called the working blue/gold hex values `official`; they are now explicitly provisional pending master branding inspection.
- Corrected public layout overflow behaviour so vertical content/focus/sticky behaviour is not globally clipped simply to suppress horizontal overflow.
- Added shared focus-visible treatment and fixed-header anchor scroll offset.
- Added checkout `no-store` response policy and later strengthened sensitive donation/assistance API responses to `no-store, private` consistently.
- Added a global `/api/*` no-store fallback in Next.js headers.
- Added Request Assistance to the sitemap while keeping private receipt/status pages disallowed and explicitly noindexed.
- Added `no-referrer` protection to token-bearing assistance receipt/tracking and donation acknowledgement pages.
- Added private donation acknowledgement noindex handling and lean payment-path projections across order creation, confirmation, capture reconciliation and acknowledgement.
- Added donation reconciliation lockout after a Razorpay payment response when Amaana confirmation cannot complete, preventing a browser retry from becoming a second payment attempt.
- Added assistance field-associated validation recovery plus first-invalid-field focus.
- Added scoped compensation cleanup for private assistance documents when post-upload submission work fails.
- Added focus transfer into the mobile menu, focus return on Escape and source-level Tab/Shift+Tab containment while the mobile menu is expanded.
- Added global reduced-motion and forced-colors safeguards.
- Centralized sitemap/robots public-private route policy and added a CI publication-boundary guard.
- Added running-production-server smoke/header checks to CI.
- Added measured aggregate JavaScript/CSS regression budgets to CI.
- Remapped legacy shared green tokens/gradients to the working Amaana blue/gold/editorial-neutral system so untouched shared states cannot silently regress to the old generic NGO palette.
- Added narrow-screen wrapping/gutter safeguards while explicitly preserving the existing 3rem button/touch-target baseline.

## Rule for closing risks

A risk moves to CLOSED only when the underlying behaviour or source has been verified. Documentation changes, architecture intent, code presence or CI success alone are not sufficient evidence for user-visible, legal, accessibility, payment, storage or production performance certification.
