# Amaana Platform — Active Implementation State

> This file is the current repo-implementation lock and handoff summary. Keep it short and current.

## State

**CHATGPT_ACTIVE**

## Active implementation owner

ChatGPT

## Integration branch

`phase-public-site-rebuild`

## Current integration checkpoint

- PR #8 locked the corrected Winter/newborn facts with regression protection; squash-merged as `2a7a4cd0bb454fb0d8e8380188bab6647b03672e` after full green CI.
- PR #9 reconciled official brand/media/governance source state; squash-merged as `bcc7246a8c9a90d02f76991ac980747647f41df9` after full green CI.
- PR #10 hardened appeal target/expiry closure; squash-merged as `df2ec8ed60c85ecf4402cea9080f6f3e31bb80f7` after full green CI.
- PR #11 capped new designated donations to the current remaining need; squash-merged as `7f8eba057ddeec511bd4088cfece91a2e58d9eac` after full green CI.
- PR #12 corrected private acknowledgement semantics for captured, pending, failed and refunded payment states; squash-merged as `dd5bddf8960ca2b5f638103b4ad8d82deab6a2d5` after full green CI.
- PR #13 hardened assistance status transitions, assignment eligibility and conversion permissions; squash-merged as `547eacbafc15d9c1b98749e30f165b11a45df17f` after full green CI.

## Current implementation task

Harden access to private beneficiary-supporting documents so each authorized retrieval is auditable and the redirect response itself is explicitly private/non-cacheable.

## Current task branch / PR

- Branch: `fix/private-document-access-audit`
- Base SHA: `547eacbafc15d9c1b98749e30f165b11a45df17f`
- PR: not opened yet at this checkpoint

## Problem found during privacy/admin audit

The private-document route correctly required `assistance.view` and generated a 60-second signed storage URL, but it did not record that a staff member accessed a sensitive document. The redirect response also did not explicitly carry `private, no-store`, no-referrer or noarchive headers.

## Implemented on current task branch

- Replaced the opaque `redirect()` response with an explicit `NextResponse.redirect` so privacy headers can be attached.
- Added `Cache-Control: private, no-store`.
- Added `Referrer-Policy: no-referrer`.
- Added `X-Robots-Tag: noindex, nofollow, noarchive`.
- Added an `assistance.document_viewed` audit event before releasing the signed URL.
- Attached the audit event to the parent `AssistanceRequest` with the document id in metadata so the access appears in the request's existing audit history.
- Preserved the existing permission check and short-lived 60-second private-storage URL.

## Exact next action

1. Open a focused PR for `fix/private-document-access-audit`.
2. Run full CI and repair any regression found.
3. Merge only when green.
4. Continue private-data/admin/source audit, then move into staging/browser E2E release gates.

## Repository areas currently sensitive

- private assistance records/documents and appeal conversion
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
