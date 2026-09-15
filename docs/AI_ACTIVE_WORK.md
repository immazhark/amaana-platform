# Amaana Platform — Active Implementation State

> This file is the current repo-implementation lock and handoff summary. Keep it short and current.

## State

**CHATGPT_ACTIVE**

## Active implementation owner

ChatGPT

## Integration branch

`phase-public-site-rebuild`

## Current integration checkpoint

- PR #15 stopped queueing applicant SMS notifications that have no delivery implementation; squash-merged as `a2fc02c2142cf3869c064f5e2450f3806600c193` after full green CI and successful Railway deployment.
- PR #16 added the structured assistance verification/privacy/Zakat gate and stopped raw private intake copy from becoming public appeal copy; squash-merged as `84397fa331ea263ade725286e4d83884b5c0e3d1` after full green CI. Railway applied `20260915220500_assistance_verification_gate` successfully and started healthy.
- PR #17 aligned assistance, privacy, donation, refund and terms notices with the generated governance masters without overstating review-pending legal wording; squash-merged as `ac5d14c08bef0b70e3b8467c19fb384aa767cef9` after full green CI. Railway deployment is in progress.

## Current implementation task

Align search metadata, structured data, breadcrumb schema, sensitive-case indexing and redirect governance with the generated SEO/Search/Social Sharing Master and Launch Content & Trust QA Checklist while preserving the existing staging noindex safeguards and approved-media gates.

## Current task branch / PR

- Branch: `align/seo-structured-data`
- Base SHA: `ac5d14c08bef0b70e3b8467c19fb384aa767cef9`
- PR: to be opened after this checkpoint update

## Document-led findings

- Staging indexing is already fail-closed: only the official HTTPS Amaana domains can become indexable and only when explicitly enabled.
- Sitemap already derives from published public content; stories require privacy approval and faith content requires religious verification.
- Initiative/story Open Graph images already come only from public, privacy-approved media records.
- Sitewide organization metadata used a generic charitable-organization description instead of the canonical `registered charitable trust` descriptor.
- Dynamic programme, appeal and story pages lacked BreadcrumbList structured data.
- Search metadata had no content-driven privacy response for a future `HIGHLY_SENSITIVE` verified assistance case.
- Known Winter legacy redirects existed at route level but there was no maintained repository redirect map.

## Implemented on current task branch

- Added reusable `BreadcrumbStructuredData` and wired it to programme/initiative, appeal and story detail routes.
- Aligned Organization/WebSite structured-data description with the canonical registered-charitable-trust descriptor and added public contact details without publishing a private street address.
- Aligned root and homepage metadata with the canonical SEO master, including the recommended homepage title/description direction.
- Added a search-privacy lookup for appeal-linked verification records. `HIGHLY_SENSITIVE` cases remain accessible as public accountability pages when intentionally published but receive `noindex`, generic search/social title and generic description rather than sensitive case metadata.
- Preserved the existing rule that initiative/story social images must already be public and privacy-approved.
- Centralized the two known Winter legacy permanent redirects in `next.config.ts`.
- Added `docs/SEO_REDIRECT_MAP.md` so route changes have a durable redirect record instead of ad hoc redirects.
- Corrected an intermediate homepage edit on the task branch so the complete current homepage content is preserved; only its metadata changes in this task.

## Exact next action

1. Open a focused PR for `align/seo-structured-data`.
2. Run full CI and repair any type/build/test/bundle regression.
3. Merge only when fully green and verify Railway deployment.
4. Continue document-led implementation audit with the Beneficiary Dignity/Consent/Media Policy and Admin/Data Governance Blueprint: strengthen media consent/provenance metadata and publication gates without changing the visual direction.
5. Then implement retention/deletion workflow controls from the Data Retention & Access Control Policy and proceed to staging/browser acceptance journeys.

## Repository areas currently sensitive

- private assistance records, verification, consent and appeal conversion
- sensitive-case search/social metadata
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
