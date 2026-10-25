# Amaana Foundation Release Status

## Current operational checkpoint — 25 October 2026 (IST)

**Source of truth:** protected GitHub `main`, exact GitHub Actions runs, Railway deployment records, and the live health endpoints. This checkpoint supersedes the **8 October** state below; older values remain historical evidence only. It is not a new deployment authorization, statutory sign-off, payment certification, or substitute for required launch gates.

| Boundary | Verified evidence |
| --- | --- |
| Repository `main` | `95bd57982b8b968f77cd095b2703edbf295dedd2` (PR #438 merged); GitHub branch API reports `protected=true` |
| Production application | Public `/api/health/version` returned HTTP 200 with runtime SHA `b033e99982caaeb295726bf19df64ca1ffa7f7a3`, branch `main`, environment `production`, and `paymentMode=live` |
| Runtime readiness | Public `/api/health/ready` returned HTTP 200 and `{"status":"ready"}` |
| Latest GitHub-only merges | #436 public exposure regression `29c382f4ec7c721b549a94519967e0896845eaa0`; #437 CSS audit redirect guard `e1a1ef81d848c54a8a36ccd79f133a0b6bd23349`; #438 evidence checkpoint `95bd57982b8b968f77cd095b2703edbf295dedd2` |
| Railway release decision | These three source/test/docs-only merges have website deployments marked `SKIPPED` by configured runtime watch patterns. **No new production website build** is implied by the newer GitHub `main` SHA |
| Pending work | Draft PR #439 indexes public `llms.txt` (test-only) and draft PR #440 guards anonymous admin test coverage (test-only); each requires successful exact-head full CI, ready-state promotion, and a guarded merge. The authoritative status is always the current GitHub PR and CI, not this dated row |

### Operational controls

- Do not conflate **source SHA** with **deployed runtime SHA**. Verify both independently before declaring a website release.
- Preserve `main` branch protection and fail-closed CI. A passing documentation workflow is not a substitute for application browser, database or deployment acceptance.
- The official site is in **Razorpay live mode**; do not test with real donations, refunds, beneficiary records or financial transfers.
- Do not enable outbound notification deliveries from the historical cron reference. Notification worker activation, provider DNS and privacy gating require separate owner/operator acceptance.
- Do not treat the archived 8 October preview or PR #104 instructions as the active release procedure. Preview is not a verified current staging sign-off.
- The canonical 149-row status remains **1 Completed / 59 Implemented / 61 Partial / 26 Not Started / 1 Superseded / 1 Not Applicable**; this status report does not change a row classification.

**Detailed current provenance:** [Mission Control checkpoint](mission-control/2026-10-25-acceleration-checkpoint.md) and [149-item audit](AMAANA_MISSION_CONTROL_AUDIT_2026-10-25.md).

---


> **Historical release-status snapshot (8 October 2026).** This file is not an up-to-date operational approval or deploy instruction. The current remediation integration branch is `fix/p0-security-remediation-20261010`; use the latest GitHub commits, PR checks and actual Railway state for release decisions. References below to `phase-public-site-rebuild`, PR #104, historical SHAs and deployments describe the checkpoint when recorded and must not be treated as verified current state. No merge to `main` or production deployment is authorized by this document.

Updated: 8 October 2026

This is the single living release-status document for the public platform. Do not store credentials, tokens, private beneficiary information or full database URLs here.

## Branch and deployment contract

- `main` is the production source of truth and the only production branch.
- `phase-public-site-rebuild` is the integration/release-candidate branch.
- PR #104 is the formal promotion boundary from integration to `main`.
- The Railway `amaana-rebuild-preview` service is isolated from the official domain, non-indexable, email-disabled and Razorpay Test-only.
- The production web service and notification cron follow `main` during normal operation.
- Production must not be promoted merely because CI is green; the readiness register remains fail-closed for genuine operator gates.

## 8 October 2026 — verified exact-head preview checkpoint

- Live integration head: `974e925f0c53366e6525bfd7d7763b18d067692c` (PR #201 typography merged).
- PR #104 remains OPEN and DRAFT; production `main` stays at `29c7627ed3bffd0b581935c5b934ad903aeca2cd`.
- Current preview deployment: `c3938ff1-9156-43a6-966b-1e549e9c9eca` — **SUCCESS**, exact integration SHA `974e925f0c53366e6525bfd7d7763b18d067692c`.
- Compared with prior preview `9bd04887cb57c28a73f201f8a5c7002657f2b427`, the 14-commit delta affects release/docs and canonical display typography/test; no payment, database schema, API, Docker, package or deployment config changes.
- CI #2394: SUCCESS on exact SHA (plan, fast, production, database, verify); browser skipped by workflow selection.
- CI #2395: SUCCESS on exact SHA (production-promotion readiness, plan, fast, browser, database, verify); production skipped by workflow selection.
- CI #2395 browser: **1,322 Chromium checks passed** plus **24 Firefox/WebKit smoke checks passed**, including typography/reflow and route containment checks.
- CI #2394 production build: JavaScript **806090 / 819200 bytes** and CSS **345726 / 348160 bytes**; unchanged budgets pass.
- Production-only npm audit and pruned Railway runtime audit: **zero vulnerabilities**. Full development install still reports five High advisories in non-runtime dependencies.
- Railway exact-head pre-deploy: staging contract passed, **15 migrations present / none pending**, canonical-content/RBAC/staging fixture preparation completed; Next.js 16.3.8 ready; Railway status SUCCESS.
- Preview HTTP sampled 12×2xx / 0×4xx / 0×5xx across the observed hour; this is a limited traffic sample, not proof of whole-site latency targets.
- Resend domain verification **FAILED** (DKIM TXT, Return-Path MX, SPF TXT, CNAME all FAILED) on repeated provider reads; verification was retriggered once with no successful confirmation afterward. Do not send controlled production email until VERIFIED.
- `main` remains unprotected and has no repository rulesets. Production web and cron stayed on old main; the neutral Railway staged patch remains uncommitted.
- Historical release-register totals remain **11 VERIFIED / 6 PENDING / 3 NOT_APPLICABLE**; this documentation checkpoint is *not* an assertion that external/human gates have passed.
- The rest of this document retains 7 October historical frozen-candidate details for traceability. **This section supersedes older 'current' preview/Resend labels below.** Do not promote from historical SHA `9bd04887...`.

## Current production baseline

Production remains intentionally untouched on the known-good main SHA:

`29c7627ed3bffd0b581935c5b934ad903aeca2cd`

Railway production deployment:

`b7f9f2e2-9234-4a64-8085-a9fdb326944a` — SUCCESS

The official domain `https://amaanafoundation.org` remains attached to production. The notification cron still follows `main` and its last verified execution succeeded.

No production deployment has been triggered by the 7 October hardening work.

## Frozen integration candidate

Final integration SHA:

`9bd04887cb57c28a73f201f8a5c7002657f2b427`

Git tree:

`7c42f5b8b452b16f2aea698a8068baf57a969009`

The final merge tree is identical to the fully browser-tested PR #199 head `37c5df534e70f4a32975df14ab9529f485400e67`.

The delta from the prior rendered application candidate `52063ad7ab7d9b0127023c17096284ca18681ab8` contains **no `src/` application files**. It is limited to release documentation/readiness, CI, Docker/runtime packaging and dependency manifests/lockfile.

### Security/runtime hardening delivered

- PR #197 — `source-map-js` 1.2.1 → 1.2.2 for CVE-2026-93749.
- PR #198 — current `brace-expansion` patched lines, Sharp 0.35.5, and fail-closed production dependency audit.
- PR #199 — Node-24 GitHub first-party actions, Prisma CLI retained as a legitimate runtime dependency, dev tooling pruned from the final Docker runtime, and CI proof of the pruned-runtime contract.
- Production-only audit: `npm audit --omit=dev --audit-level=high` → 0 vulnerabilities.
- Generic npm warnings that remain are dev/tooling-only and are not hidden; upstream-unpatched lint-tool chains remain outside the deployable runtime.

### Fixed performance budgets

Unchanged and passing:

- JavaScript: `806040 / 819200` bytes
- CSS: `346301 / 348160` bytes

No bundle ceiling was raised.

## Final CI evidence

### PR #199 full acceptance

CI run `37647013360` (#2382), tested head `37c5df534e70f4a32975df14ab9529f485400e67`:

- plan — SUCCESS
- fast — SUCCESS
- database — SUCCESS
- browser — SUCCESS
- verify — SUCCESS
- production job — skipped as expected for pull-request event

This run includes the full Chromium responsive/accessibility/journey matrix and Firefox/WebKit public-surface smoke.

### Exact final merge push

CI run `37650880241` (#2383), exact final SHA `9bd04887cb57c28a73f201f8a5c7002657f2b427`:

- plan — SUCCESS
- fast — SUCCESS
- database — SUCCESS
- production — SUCCESS
- verify — SUCCESS
- browser — skipped by change-aware planning because the exact merge tree is identical to the already browser-tested #199 tree

The production job compiled Next.js 16.3.8 successfully and passed the fixed JS/CSS budgets.

### PR #104 exact-head confirmation

PR #104 CI run `37650889150` (#2384) is fully SUCCESS on exact final SHA `9bd04887cb57c28a73f201f8a5c7002657f2b427`.

- Production promotion readiness — SUCCESS
- plan — SUCCESS
- fast — SUCCESS
- database — SUCCESS
- browser — SUCCESS
- Firefox/WebKit public-surface smoke — SUCCESS
- screenshot artifact uploads — SUCCESS
- verify — SUCCESS
- production — skipped as expected for pull-request event

PR #104 remains Draft because green CI does not replace the six genuine operator/external readiness gates.

## Exact Railway preview

Service: `amaana-rebuild-preview`

Exact successful deployment:

`c2b5327d-94ee-49f6-b10c-d7f70673a1fa`

Commit:

`9bd04887cb57c28a73f201f8a5c7002657f2b427`

Verified evidence:

- SUCCESS
- 1/1 replica online
- zero active warning/critical notifications
- zero recent failed deployments
- source pinned to the exact candidate
- pre-deploy: `node prisma/railway-predeploy.mjs`
- pre-deploy timeout: 300 seconds
- staging environment contract passed
- 15 migrations detected
- no pending migrations
- canonical-content/RBAC/staging-acceptance release preparation completed
- `Railway pre-deploy release preparation verified`
- Next.js 16.3.8 started successfully
- `/api/health/ready` succeeded
- Railway HTTP metrics observed 12 requests in the verification window: 12×2xx, 0×4xx, 0×5xx

A redundant identical deployment request `c1f46a6e-9ed6-4396-9007-b9e12da66a11` was safely SKIPPED because the same exact SHA was already deployed.

## Readiness register

After release-scope normalization:

- VERIFIED: 11
- PENDING: 6
- NOT_APPLICABLE: 3

### Genuine pending gates

1. Transactional email delivery — Resend domain verification + one controlled synthetic delivery/retry/idempotency acceptance.
2. Human rendered accessibility review — actual 200% zoom, screen-reader/form-announcement spot checks, keyboard/reduced-motion visual judgement.
3. Final human editorial/SEO/social rendered judgement.
4. Real Railway **Rollback** rehearsal on preview, followed by forward restoration.
5. Enforced GitHub `main` protection/ruleset.
6. Formal main promotion/production approval.

### Release-scoped NOT_APPLICABLE gates

These are not fabricated successes:

- public-media human review — no new unreviewed public programme media is introduced by this release; future media reactivates the gate;
- controlled live donation acceptance — no legitimate live appeal exists; do not create a dummy appeal or unnecessary real-money charge;
- live refund/receipt operational observation — Test-mode refund/receipt path is provider-verified, but there is no legitimate live captured donation to refund.

## Resend status

On 7 October 2026 a fresh provider verification was triggered.

Current domain status: `pending`

Current record status: all pending

- DKIM TXT `resend._domainkey`
- Return-Path MX `send`
- SPF TXT `send`
- CNAME `rsend`

Production application email remains disabled until verification and controlled acceptance succeed.

## GitHub main protection

Current `main`:

`29c7627ed3bffd0b581935c5b934ad903aeca2cd`

Current protection evidence:

- `protected=false`
- required status-check enforcement off
- repository ruleset collection empty
- connected GitHub App cannot administer protection

This remains an explicit manual operator gate.

## Railway staged-change note

Environment patch `45c0bc6c-46db-4ed8-82cb-3a8f02dfb483` is a non-destructive no-op:

- production preDeployCommand current → identical current
- production preDeployTimeoutSeconds `60 → 60`

It has no live effect. The connected Railway API exposes no discard operation. Remove/discard it in the Railway dashboard before cutover. Do **not** Accept & Deploy merely to clear the no-op metadata.

## Production cutover rule

Follow `docs/OPERATOR_PRELAUNCH_ACTIONS_2026-09-24.md`.

Key safety properties:

1. Clear the neutral staged patch before any cutover.
2. Protect `main`.
3. Complete true preview Rollback + restore.
4. Finish Resend/email acceptance.
5. Record the human review.
6. Only then, with explicit production authorization, freeze current production triggers, configure the new pre-deploy wrapper, merge PR #104, deploy the exact new main SHA deliberately, verify web production, then promote/verify the notification cron.
7. Do not manufacture live payment/refund activity.

## Rollback rule

Rollback production to the most recent known-good production SHA if a promoted release fails health, privacy, payment integrity, accessibility or public-surface verification.

A rollback rehearsal is VERIFIED only after Railway's real **Rollback** action is executed on preview and the target SHA, health, noindex, Razorpay Test posture, private boundaries, forward restoration and acceptance rerun are evidenced. Generic Redeploy is not equivalent.
