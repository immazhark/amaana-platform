# Amaana Platform — Active Implementation State

> This file is the current repo-implementation lock and handoff summary. Keep it short and current.

## State

**CHATGPT_ACTIVE**

## Active implementation owner

ChatGPT

## Integration branch

`phase-public-site-rebuild`

## Current integration checkpoint

- PR #14 added auditable, no-store/no-referrer private-document access; squash-merged as `4a598acf16b7635387e44ff964a92f5efcc2c949` after full green CI.
- PR #15 stopped queueing applicant SMS notifications that have no delivery implementation; squash-merged as `a2fc02c2142cf3869c064f5e2450f3806600c193` after full green CI and successful Railway deployment.
- PR #16 added the structured assistance verification/privacy/Zakat gate and stopped raw private intake copy from becoming public appeal copy; squash-merged as `84397fa331ea263ade725286e4d83884b5c0e3d1` after full green CI. Railway deployment/migration verification is in progress.

## Current implementation task

Align public operational notices and the assistance-form acknowledgement with the generated Privacy & Data Protection draft, Assistance Request Terms draft, Donation Experience & Giving Rules Master and Donation Refund & Cancellation draft, without presenting unreviewed legal language as final law.

## Current task branch / PR

- Branch: `align/policy-assistance-notices`
- Base SHA: `84397fa331ea263ade725286e4d83884b5c0e3d1`
- PR: to be opened after this checkpoint update

## Document-led gaps found

- The assistance checkbox was broadly correct but did not link the privacy/terms notices or explicitly state that public name/photo/story publication requires a separate consent decision.
- The refund page stated that approved refunds always return through the original payment method, while the working policy intentionally says preferably to the original source where supported and avoids a guaranteed provider timeline.
- The donation policy omitted designated-purpose non-reallocation, funded/closed appeal handling and explicit Zakat designation boundaries.
- The general terms did not explain private verification, parallel fundraising, separate public consent or the distinction between verified private support and public fundraising.
- The privacy page did not fully describe the implemented separation between private evidence and public campaign content or the new separate disclosure review.

## Implemented on current task branch

- Assistance form acknowledgement now follows the working assistance-terms language, warns against unrelated secrets, states that uploaded proof is not publication permission, and links privacy/terms notices.
- Public photo/name/sensitive-story consent remains separate from basic intake consent.
- Refund wording now uses traceable/original-source-where-supported language, avoids fixed timelines, adds debit-without-confirmation guidance, and preserves designated/Zakat review boundaries.
- Donation policy now states domestic-only/FCRA limits, donor-designation rules, automatic closure of fully funded appeals, server-confirmed payment semantics, explicit Zakat review and provisional-80G acknowledgement boundaries.
- Terms now describe private verification, no automatic public appeal, disclosure consent, duplicate funding, Zakat and medical/emergency boundaries.
- Privacy notice now reflects implemented private document storage/access audit, separate publication decision, actual analytics/security behavior and review-pending legal status rather than asserting unverified statutory certainty.

## Exact next action

1. Open a focused PR for `align/policy-assistance-notices`.
2. Run full CI and merge only when green.
3. Verify PR #16 Railway migration and then the policy-alignment deployment.
4. Continue document-led implementation audit: SEO/indexing/structured data → media consent/provenance schema → retention/deletion workflow → staging/browser acceptance journeys.

## Repository areas currently sensitive

- private assistance records, verification, consent and appeal conversion
- donation/payment/refund lifecycle
- public policy/compliance copy awaiting professional review where noted
- canonical programme/factual sources
- public programme/media provenance data
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
