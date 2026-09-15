# Amaana Platform — Active Implementation State

> This file is the current repo-implementation lock and handoff summary. Keep it short and current.

## State

**CHATGPT_ACTIVE**

## Active implementation owner

ChatGPT

## Integration branch

`phase-public-site-rebuild`

## Current integration checkpoint

- PR #10 hardened appeal target/expiry closure; squash-merged as `df2ec8ed60c85ecf4402cea9080f6f3e31bb80f7` after full green CI.
- PR #11 capped new designated donations to the current remaining need; squash-merged as `7f8eba057ddeec511bd4088cfece91a2e58d9eac` after full green CI.
- PR #12 corrected private acknowledgement semantics for captured, pending, failed and refunded payment states; squash-merged as `dd5bddf8960ca2b5f638103b4ad8d82deab6a2d5` after full green CI.
- PR #13 hardened assistance status transitions, assignment eligibility and conversion permissions; squash-merged as `547eacbafc15d9c1b98749e30f165b11a45df17f` after full green CI.
- PR #14 added auditable, no-store/no-referrer private-document access; squash-merged as `4a598acf16b7635387e44ff964a92f5efcc2c949` after full green CI.
- PR #15 stopped queueing applicant SMS notifications that have no delivery implementation while preserving browser tracking and supported email notifications; squash-merged as `a2fc02c2142cf3869c064f5e2450f3806600c193` after full green CI and successful Railway deployment.

## Current implementation task

Add a structured assistance verification/privacy/Zakat gate before an approved case can become a public appeal. The implementation is grounded in the generated Appeal Verification-to-Closure SOP, Admin & Data Governance Blueprint and Admin Operational Workflow Simulation Pack rather than inferred ad hoc from the existing UI.

## Current task branch / PR

- Branch: `feat/assistance-verification-gate`
- Base SHA: `a2fc02c2142cf3869c064f5e2450f3806600c193`
- PR: to be opened after this checkpoint update

## Problem found during document-to-implementation alignment

The current assistance model had status and free-form internal notes but no structured verification record for verified need, target, payment destination, duplicate funding, disclosure permissions or Zakat review. A request could be marked approved and converted to a draft appeal without those operational gates. The conversion action also copied the private intake description directly into public appeal summary/story fields, contrary to Amaana's rule that public copy must not be auto-generated from raw sensitive notes.

## Implemented on current task branch

- Added an `AssistanceVerification` one-to-one record with explicit verification decision, verified need, approved public target, payment destination, other-funding review, confidentiality, disclosure permissions, Zakat review, approving reviewer and completion timestamp.
- Added a forward-only Prisma migration for the new verification record and enums.
- Added reusable publication-gate validation in `src/lib/assistance.ts`.
- Generic request approval now requires a completed approved verification; rejection requires a completed declined verification.
- Public appeal conversion requires a completed `APPROVED_PUBLIC` verification with all public disclosure/Zakat fields resolved.
- The public fundraising target is taken from the approved verification record and cannot exceed verified need.
- Raw private intake text is no longer copied into public appeal copy. Conversion requires new privacy-safe public title, summary and story fields.
- Beneficiary location is no longer copied automatically from intake into the public appeal.
- The admin request screen now contains a private verification/publication gate, records reviewer/completion state, shows public-appeal readiness issues, and keeps non-public support decisions out of the public appeal workflow.
- Added regression tests covering target bounds, unresolved privacy/Zakat state and approval readiness.

## Exact next action

1. Open a focused PR for `feat/assistance-verification-gate`.
2. Run the complete CI pipeline and repair any Prisma/type/build/test regression.
3. Merge only when fully green.
4. Confirm Railway applies the new migration non-destructively and the preview healthcheck succeeds.
5. Continue document-led implementation audit: policy routes → SEO/privacy metadata → media consent/provenance → retention/deletion workflow → browser acceptance journeys.

## Repository areas currently sensitive

- private assistance records, verification, consent and appeal conversion
- donation/payment reconciliation and appeal lifecycle
- canonical programme/factual sources
- public programme/media provenance data
- governance/compliance copy
- current visual/colour direction — do not redesign without explicit user request

## Locked facts relevant to implementation

- Winter Drive 2025–26: **234 Winter Kits distributed to 234 beneficiaries**.
- 8-day-old newborn case: **₹107,520**.
- Qurbani 2025: **15 animals; 150+ families**.
- Qurbani 2026: **28 sheep; 350 boxes; 350+ families; ~380 kg handled overall**.
- Eid Gift Kits 2026: **710**.
- Taleem Nazira + Hifdh: **25 students combined** as of Sep 2026.
- 80G remains **provisional**; 12A/12AB remains pending CA confirmation in public copy.
- Amaana is not FCRA-registered; public fundraising remains domestic only.

## Handoff instruction

When the user switches repo implementation back to Codex, ChatGPT must stop repo writes, update this file to `HANDOFF_PENDING`, append the transition to `AI_HANDOFF_LEDGER.md`, and leave the exact current branch/PR/SHA/CI/next-action summary.

When Codex limits are exhausted again, ChatGPT must inspect GitHub first and continue from the recorded boundary rather than recreating work.
