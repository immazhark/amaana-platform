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

## Phase 4 — Team / Governance / organizational trust — IMPLEMENTED / CI VERIFIED

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

### Implementation completed

- Added `/governance` as a dedicated public organizational-trust page.
- Added a registration snapshot, verified trustees, registration record and role-boundary explanation.
- Explicitly separated legal governance from public operations and internal platform administration.
- Added Governance to footer trust navigation and mobile secondary navigation.
- Added dedicated responsive governance visual system.
- Updated About so its governance handoff points directly to the verified governance experience.
- No team biographies or portraits were fabricated; these remain future content enhancements only when approved source material exists.
- CI run #119 for head `7ecf89c6b7b84ce91401a9e895415618606a484b` passed install, Prisma generation/validation, lint, typecheck, tests/coverage and production build.

## Phase 5 — Authentic content and media population — IN PROGRESS

### Documentation foundation

- Created `AMAANA_CONTENT_ASSET_REGISTER.md` as the durable source/media register.
- The register records source, campaign/year, factual support, privacy status, discrepancy notes, media suitability and intended website placement.
- Initial entries cover governance/compliance, Eid Gift Kits, Qurbani, brand/contact material, payment material and faith-content review boundaries.
- The register explicitly excludes model-generated media from documentary evidence slots and prevents historical QR/payment details from becoming current donation methods.

### Initial content findings recorded

- Eid Gift Kits source documents support the 2020 COVID/Ramadan origin, first 85-family distribution, annual continuity and 2020–2025 historical figures.
- The 2026 Eid graphic contains a category discrepancy (17 medical/disability) relative to the approved validated web evidence (18); graphics therefore cannot override canonical data.
- Several Eid/Qurbani designed posts contain embedded real campaign photographs and are candidates for historical/campaign collateral after privacy and quality review.
- A Library asset marked model-generated is excluded from documentary use even though its subject is relevant.
- Faith graphics remain gated for independent religious verification before publication.

### Active Phase 5 sequence

1. **Eid Gift Kits media batch:** locate original 2026 photographs separately from designed carousel composites; classify hero/preparation/contents/distribution/gallery candidates; assign captions, alt text, year and privacy status.
2. **Qurbani 2025/2026 batch:** separate original documentary photography from designed posts and reconcile animal/sheep terminology before final copy.
3. **Taleem, Winter, Dates, Flood/COVID, Medical/Financial batches:** inventory each campaign independently, with stricter privacy rules for children and medical cases.
4. **Brand/social/contact batch:** confirm official logo asset and current public handles/contact data before replacing text-only brand substitutes or exposing social/contact information.
5. Populate only approved material through the existing `MediaAsset` publication/privacy gates.

Important boundary: Phase 5 is not complete until the archives are actually enumerated file-by-file. The initial register is a controlled starting point, not a claim that every source has been reviewed.

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
- Phase 4 governance CI: green at `7ecf89c6b7b84ce91401a9e895415618606a484b` (run #119).
- Phase 5 Content & Asset Register introduced at `3b20724649a9c2bb845297c1bca0f40ba05fca0d`.
- Next active work: Eid Gift Kits original-media inventory and classification.
