# Amaana Foundation — Public Site Rebuild Execution Log

This file is the durable implementation record for the `phase-public-site-rebuild` branch. It records what was actually changed, the release boundary, and what remains. A phase is not marked release-ready merely because code exists or CI passes.

## Working rules

- Creative direction: **Living Amanah — Faith. Dignity. Action.**
- Authentic Amaana material is preferred over stock or generated beneficiary imagery.
- No invented programmes, statistics, religious claims, compliance claims, donation categories, urgency or beneficiary stories.
- Private verification material stays private; publication requires a separate public-safe decision.
- Amaana currently accepts domestic contributions only and is not FCRA-registered.
- Provisional 80G status must never be represented as final/permanent approval; 12AB/12A remains subject to professional confirmation.
- No merge to `main` until content, media, visual, responsive, accessibility, workflow, privacy and release QA are complete.

## Phase 0 — Safety and content architecture — IMPLEMENTED

- Next.js/TypeScript/Prisma platform retained rather than restarted.
- Dynamic Cause, Initiative, Story, FaithContent and MediaAsset architecture added.
- Privacy-gated public stories and media rendering.
- Religious-review gating for Faith & Reflections.
- Validated Eid Kits evidence parser and tests; inconsistent totals fail closed.
- Donation/payment safety states, assistance abuse controls, private document handling, notification hardening and indexing controls retained/audited.

## Phase 1 — Core public journeys — IMPLEMENTED

- Homepage rebuilt around visitor intent, real work, impact, stories, faith and appeals.
- About / Our Story rebuilt around the documented 2020 origin and continuity.
- Our Work discovery and dynamic initiative detail experience rebuilt.
- Eid Gift Kits rebuilt as the flagship evidence/story experience.
- Impact rebuilt as an evidence journey.
- Stories rebuilt as a privacy-gated field journal.
- Faith & Reflections rebuilt while retaining religious verification gates.
- Get Involved and Contact rebuilt.
- Appeals index/detail rebuilt around verified need and dignity.
- Donation checkout rebuilt around context, domestic-source confirmation and Razorpay handoff.
- Request Assistance rebuilt as a private dignity-first submission journey.
- Donation acknowledgement, assistance receipt and assistance tracking states redesigned.

## Phase 2 — Trust architecture — IMPLEMENTED / CI VERIFIED

- How We Verify rebuilt as a dedicated verification narrative.
- Transparency rebuilt around the evidence chain and the principle **Public evidence. Private proofs.**
- Compliance & Registration rebuilt with explicit domestic/FCRA, provisional 80G and unresolved 12AB/12A boundaries.
- Dedicated trust visual system added.
- CI run #104 passed install, Prisma generation/validation, lint, typecheck, tests/coverage and production build.

## Phase 3 — Policy and utility experience — IMPLEMENTED / CI VERIFIED

- Privacy Policy moved off the generic ContentPage treatment into a dignity/privacy editorial experience.
- Donation Policy rebuilt around domestic-source, captured-payment, reconciliation and acknowledgement rules.
- Refund Policy rebuilt around secure evidence-based review and original-method refunds.
- Terms of Use rebuilt around honesty, platform boundaries and security.
- 404 page rebuilt as a branded recovery journey rather than a dead end.
- Dedicated responsive policy/utility visual system added.
- CI run #111 for head `3958754d346c46f7a0f2e3998a2c3fd24ec13cc3` completed successfully.

## Phase 4 — Team / Governance / organizational trust — IN PROGRESS

Goal: create a public organizational-trust experience only from verified source material.

### Source audit completed

Source used: Government of India NGO DARPAN record supplied for Amaana Foundation.

Verified public facts used in the website:
- Entity name: Amaana Foundation.
- NPO type: Trust.
- DARPAN ID: `TS/2024/0403215`.
- DARPAN registration date: 21-05-2024.
- Registration number: `BK-4, CS No 59/2024`.
- Registered with: Sub-Registrar.
- Act name: Registration Act 1908.
- City / State: Hyderabad, Telangana.
- Entity registration date shown in the DARPAN record: 23-02-2024.
- DARPAN office bearers: Mohammed Ather Khan — Trustee; Mohammed Mazhar Khan — Trustee; Syed Iqba Ali — Trustee.

Sensitive source fields intentionally excluded from the public page:
- street/home/office address detail beyond city/state;
- masked/mobile contact data;
- personal contact email from the registration record;
- signatures, identity numbers or unredacted underlying legal paperwork.

Separate verified tax source retained on the Compliance page:
- Form 10AC names Amaana Foundation and records provisional Section 80G approval dated 26-01-2026 for AY 2026-27 through AY 2028-29.
- This remains described as provisional, not final/permanent.

### Implementation completed so far

- Added `/governance` as a dedicated public organizational-trust page.
- Added a registration snapshot, verified trustees, registration record and role-boundary explanation.
- Explicitly separated legal governance from public operations and internal platform administration.
- Added Governance to footer trust navigation and mobile secondary navigation.
- Added dedicated responsive governance visual system.
- No team biographies or portraits have been fabricated; these remain pending approved source inventory.

### Remaining Phase 4 work

1. Reconcile/update the About-page governance handoff so it links directly to the new verified governance experience.
2. Review any remaining public copy that might confuse software admins with trustees/office bearers.
3. Run CI checkpoint for the governance batch and fix any failure immediately.
4. Mark Phase 4 implemented only after the CI checkpoint; biographies/photos can remain a later content-population enhancement if verified source material is not yet available.

## Phase 5 — Authentic content and media population — PENDING

- Complete file-by-file archive inventory.
- Build Content & Asset Register with campaign, year, source, privacy/public status, captions, discrepancies and intended placement.
- Populate approved real photography/video/documentary media into initiatives, stories and impact.
- Reconcile remaining campaign-stat discrepancies before publication.
- No claim that all archives have been reviewed until enumeration is complete.

## Phase 6 — Whole-site second creative pass — PENDING

- Recompose pages around the actual approved media rather than placeholders.
- Remove remaining generic/repetitive patterns and implementation-facing copy.
- Revisit story detail, faith detail needs, secondary initiative parity and page-to-page visual rhythm.
- Audit legacy hard-coded colours and component leftovers.

## Phase 7 — UX, motion and accessibility refinement — PENDING

- Navigation/mobile navigation, focus states, keyboard flows and skip link.
- Motion/hover/transition consistency with reduced-motion alternatives.
- Form loading/error/success states and touch targets.
- Typography, spacing and responsive breakpoints across representative device widths.

## Phase 8 — Full QA and release hardening — PENDING

- Content/factual/religious/compliance review.
- Privacy and public-media gate review.
- Donation and Razorpay workflow QA.
- Assistance submission/document/tracking QA.
- Desktop/tablet/mobile and browser visual QA.
- Accessibility, performance, SEO/indexing and dead-link review.
- Independent public-site review against the locked design standard.

## Phase 9 — Staging acceptance and merge — PENDING

- Deploy/verify staging candidate.
- User acceptance review.
- Resolve release blockers.
- Merge to `main` only after explicit approval.

## Current checkpoint

- Branch: `phase-public-site-rebuild`.
- Phase 3 CI: green at `3958754d346c46f7a0f2e3998a2c3fd24ec13cc3` (run #111).
- Phase 4 governance page and navigation are now implemented from the verified DARPAN record.
- Next active work: About handoff audit, role-copy audit, then Phase 4 CI checkpoint.
