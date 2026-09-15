# Amaana Platform — Active Implementation State

> This file is the current repo-implementation lock and handoff summary. Keep it short and current.

## State

**CHATGPT_ACTIVE**

## Active implementation owner

ChatGPT

## Integration branch

`phase-public-site-rebuild`

## Current integration checkpoint

- PR #16 added the structured assistance verification/privacy/Zakat gate; squash-merged as `84397fa331ea263ade725286e4d83884b5c0e3d1` after full green CI. Railway applied the migration successfully.
- PR #17 aligned assistance/privacy/donation/refund/terms notices with the generated governance masters; squash-merged as `ac5d14c08bef0b70e3b8467c19fb384aa767cef9` after full green CI and successful Railway deployment.
- PR #18 aligned SEO metadata, structured breadcrumbs, sensitive-case indexing and redirect governance; squash-merged as `b8271d1c1d5adae2972266371ea7377a3cd865a4` after full green CI. Railway deployment is in progress.

## Current implementation task

Strengthen the media publication gate using the generated Beneficiary Dignity, Consent & Media Policy, Media Reconciliation Manifest, Operational Forms and Admin/Data Governance Blueprint without disrupting already-published pages or the current visual direction.

## Current task branch / PR

- Branch: `feat/media-consent-governance`
- Base SHA: `b8271d1c1d5adae2972266371ea7377a3cd865a4`
- PR: to be opened after CI-ready checkpoint

## Document-led gap

The existing media model records `isPublic` and `privacyApprovedAt`, and publication previously required only a safe URL plus meaningful image alt text. That is not enough to capture the generated governance requirements around consent, child/patient context, private-document presence, source provenance, approved usage channels or hero suitability.

A database schema expansion is intentionally deferred in this focused step because existing published media must not be silently reclassified or broken. The first gate records structured review decisions in the existing immutable audit trail, keeps legacy public assets visible, and marks them for explicit governance review before reuse or hero promotion.

## Implemented on current task branch

- Added reusable fail-closed media publication validation.
- General website publication requires GREEN public-use classification, confirmed provenance and explicit website-channel approval.
- AMBER/RED material cannot pass the broad website publication gate.
- Media containing private identity/medical/bank/loan/document data cannot pass publication.
- Identifiable child or patient media requires documented publication consent.
- Consent/provenance/privacy/hero decisions and reviewer identity are recorded in `AuditEvent` as `media.privacy_reviewed` before `media.published`.
- Admin media review now exposes the consent/privacy/provenance checklist and distinguishes publication permission from hero eligibility.
- Existing public assets without a structured review event are labelled as legacy public assets needing re-review rather than being silently blessed or automatically removed.
- Added regression tests for the publication gate.

## Exact next action

1. Open focused PR for `feat/media-consent-governance`.
2. Run complete CI and repair any lint/type/test/build regression.
3. Merge only when fully green and verify Railway.
4. Audit/review legacy public media against the generated reconciliation manifest inside the admin workflow.
5. Then implement retention/deletion workflow controls from the Data Retention & Access Control Policy.
6. Proceed to browser/mobile/accessibility/SEO/payment/assistance acceptance journeys against staging.

## Repository areas currently sensitive

- private assistance records, verification, consent and appeal conversion
- public media consent/provenance/privacy review
- sensitive-case search/social metadata
- donation/payment/refund lifecycle
- public policy/compliance copy awaiting professional review where noted
- canonical programme/factual sources
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
