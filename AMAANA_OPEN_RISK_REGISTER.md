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
**Status:** OPEN

- Razorpay UX/security structure exists and checkout script is deferred.
- `/donate/*` responses are now explicitly non-cacheable.
- Staging order creation, checkout, capture verification, acknowledgement, failure, retry, refund/reconciliation and duplicate/idempotency paths still require E2E verification.

### 5. Assistance workflow verification
**Status:** OPEN

- Private upload controls, rate limiting, tracking and accessibility semantics are implemented.
- Full staging submission, file validation, receipt, tracking, reviewer access and error/recovery journeys remain an E2E release gate.

### 6. Real performance certification
**Status:** OPEN

- Source-level work has reduced query payloads, global CSS, third-party startup cost and eager media.
- Core Web Vitals have not yet been measured on representative production-like pages/devices.
- Required final evidence: LCP, INP, CLS, route JS/CSS/image transfer weight and slow-network behaviour.

### 7. Accessibility certification
**Status:** OPEN / ACTIVE

Implemented improvements include skip navigation, focus-visible treatment, mobile menu focus management, semantic progress indicators, labelled forms/live errors, reduced-motion rules and accessible external-link wording.

Still required:
- keyboard traversal across every major journey;
- screen-reader spot checks;
- contrast review;
- 200%/400% zoom and reflow;
- touch-target audit;
- form error announcement review;
- mobile menu focus containment/escape behaviour on real browsers;
- video captions/transcript strategy before publishing meaningful video content.

### 8. Responsive/browser visual QA
**Status:** OPEN

- CSS contains responsive design work, but source inspection is not visual certification.
- Representative iOS/Android widths, tablet, laptop, wide desktop and Chrome/Safari/Firefox must be reviewed for overflow, clipping, line wrapping, image cropping, sticky behaviour and focus visibility.

### 9. SEO/indexing production verification
**Status:** OPEN

- Robots, sitemap, canonicals and structured data are implemented conservatively.
- Request Assistance is now included in the public sitemap while private receipt/status routes stay excluded.
- Production indexing must remain an explicit release action.
- Final crawl, rendered metadata/structured-data validation, Search Console submission and index monitoring remain open.

### 10. Compliance/legal confirmation
**Status:** OPEN WHERE PROFESSIONAL CONFIRMATION IS REQUIRED

- Current site correctly presents provisional 80G and domestic-only/no-FCRA boundaries.
- 12AB/12A position and provisional-80G conversion/renewal requirements still need CA confirmation.
- No functionality or copy may imply a final tax position before that confirmation.

## Active technical hardening risks

### Public-media orphan objects
**Status:** RESIDUAL

Metadata validation occurs before upload, but a storage upload followed by a failed database create can still leave an orphaned object. Add cleanup/compensation or an operational cleanup mechanism before high-volume media use.

### Video accessibility
**Status:** RESIDUAL / PUBLICATION GATE FOR VIDEO

`PublicMedia` can render public video, but the current media model/renderer does not yet guarantee captions or a transcript. Do not treat video accessibility as complete merely because controls and labels exist.

### CSP hardening
**Status:** RESIDUAL

Security headers are present and restrictive in important areas, but Next.js/Razorpay integration currently retains `unsafe-inline` allowances for scripts/styles. A nonce/hash-based CSP can be investigated as a later hardening step, but must not be introduced casually if it breaks checkout or framework rendering.

### Automated E2E coverage
**Status:** OPEN FOR PHASE 8

Current CI covers install, Prisma generation/validation, lint, typecheck, unit/coverage tests and production build. Browser-level E2E tests are not yet part of CI and should be added for release-critical journeys when staging fixtures are stable.

## Continuity corrections made during Phase 6

- Corrected stale execution documentation that still described Phase 6/7 as pending.
- Corrected earlier documentation that called the working blue/gold hex values `official`; they are now explicitly provisional pending master branding inspection.
- Corrected public layout overflow behaviour so vertical content/focus/sticky behaviour is not globally clipped simply to suppress horizontal overflow.
- Added shared focus-visible treatment and fixed-header anchor scroll offset.
- Added checkout `no-store` response policy.
- Added Request Assistance to the sitemap while keeping private receipt/status pages disallowed.
- Added focus transfer into the mobile menu and focus return to the toggle on Escape.

## Rule for closing risks

A risk moves to CLOSED only when the underlying behaviour or source has been verified. Documentation changes, architecture intent, code presence or CI success alone are not sufficient evidence for user-visible, legal, accessibility, payment or performance certification.
