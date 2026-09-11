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

### Eid Gift Kits 2026 original-media inventory

- Located and visually inspected a set of original native 2026 photographs separately from the designed social graphics.
- Inspected images include kit contents, packed branded bags, room-scale preparation, car transport and vehicle-load logistics.
- The inspected set contains no visible beneficiaries or identifiable people. These are therefore strong public-safe candidates, while still requiring explicit provenance/public-use approval.
- Preferred narrative sequence recorded in the Content & Asset Register:
  1. `IMG_0138.jpg` — flagship hero / preparation scale.
  2. `IMG_0252.JPG.jpeg` — physical kit contents.
  3. `IMG_0238.jpg` — branded 2026 kit detail.
  4. `IMG_0134.jpg` or `IMG_0165.jpg` — preparation / scale.
  5. `IMG_0182.jpg` — transport transition.
  6. `IMG_0160.jpg` — delivery logistics / closing gallery.
- Draft descriptive alt text is recorded for each candidate. Captions remain evidence-limited and do not infer beneficiaries, destinations or outcomes that the image itself does not establish.
- Near-duplicate preparation frames are intentionally not all selected; the target is a concise editorial sequence, not a file dump.

### Media review and publication workflow implemented

- Added dedicated admin `Media review` workspace.
- Added `content.view`, `content.update` and `content.approve` permissions.
- Primary and backup approvers can publish; reviewers can prepare metadata but cannot make material public.
- New media records always start unpublished.
- Images require meaningful alt text before publication.
- Public URLs are restricted to HTTPS or safe root-relative paths.
- Publishing sets `privacyApprovedAt` and is a separate explicit approval action.
- Audit events record media creation, metadata changes, publication and unpublication.
- Public pages continue to render only `MediaAsset` records where `isPublic=true` and `privacyApprovedAt` is present.

### Storage boundary hardened

- Assistance-document storage remains on the existing private S3 bucket and must never be publicly exposed.
- Public campaign media now requires a **separate** `PUBLIC_MEDIA_S3_BUCKET`.
- Public-media credentials may reuse the same provider account, but the bucket itself is deliberately mandatory and separate.
- `PUBLIC_MEDIA_BASE_URL` must be HTTPS before uploaded objects receive a renderable public URL.
- Media upload validates type, size and file signature.
- User metadata validation now occurs before object upload to avoid preventable orphaned files when a record is rejected.
- A file upload without public delivery configuration can remain stored/unpublished; the publication gate will reject it until a safe public URL exists.

### Deployment requirement introduced by Phase 5

- `npm run seed:rbac` must be rerun in the target environment after deployment so the three new content permissions are created and assigned to existing roles.
- Configure a separate public-media bucket and `PUBLIC_MEDIA_BASE_URL` before using admin file uploads for live public media.
- Do **not** make the existing assistance-document bucket public as a shortcut.

### Active Phase 5 sequence

1. **Eid Gift Kits media batch:** original discovered 2026 preparation/content/logistics set is inventoried; next step is population through the reviewed media workflow once public-media storage is configured.
2. **Qurbani 2025/2026 batch:** separate original documentary photography from designed posts and reconcile animal/sheep terminology before final copy.
3. **Taleem, Winter, Dates, Flood/COVID, Medical/Financial batches:** inventory each campaign independently, with stricter privacy rules for children and medical cases.
4. **Brand/social/contact batch:** confirm official logo asset and current public handles/contact data before replacing text-only brand substitutes or exposing social/contact information.
5. Populate only approved material through the existing `MediaAsset` publication/privacy gates.

Important boundary: Phase 5 is not complete until the archives are actually enumerated file-by-file and selected media is approved/populated. The register is a controlled source record, not a claim that every source has been reviewed.

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
- Phase 5 Content & Asset Register introduced and expanded with original 2026 Eid photography.
- Reviewed-media admin workflow and separate public-media storage boundary are implemented; CI verification is the next checkpoint.
- After that checkpoint, active content work moves to Qurbani original-media/source inventory while public-media infrastructure is prepared for actual Eid population.
