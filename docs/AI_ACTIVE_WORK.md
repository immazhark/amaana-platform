# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

## Active implementation owner
ChatGPT — executing Phase 1 audit and corrective implementation with a single repository writer.

## Integration branch
- `phase-public-site-rebuild`
- Verified integration SHA before current audit branch: `7e796ab48b8e08d7c6fbcba7d4ec91ae0c01dc46`
- GitHub Actions CI run #698 passed on that exact SHA.
- Railway deployment `95a41209-9bea-4e13-a981-f9902ff1b849` is SUCCESS on that exact SHA.

## Current task branch
- `audit/phase1-codebase-gap-analysis`
- Base: `7e796ab48b8e08d7c6fbcba7d4ec91ae0c01dc46`
- Goal: complete evidence-based Phase 1 codebase/security/performance/data/UX audit and land focused verified fixes without production cutover.

## Governing directive
Read `docs/AMAANA_PLATFORM_AUDIT_COMPLETION_MASTER_PROMPT.md` and `docs/PHASE1_AUDIT_STATUS_2026-09-17.md` before changing implementation scope.

## State Log

| Component / Module | Status | Last Execution Summary | Next Required Action |
| --- | --- | --- | --- |
| Audit & Gap Analysis | In Progress | Green baseline verified; package scripts, CI, API surface, Prisma schema, payment routes, webhook flow, environment validation and headers inspected. | Complete auth, assistance, storage, notifications, query/index and public-route audit. |
| Security & Payment Hardening | In Progress | Duplicate/concurrent Razorpay failed/refund webhook race fixed on current branch; regression guard tests added. | Run PR CI; continue refund bounds, webhook payload limits and rate-limit atomicity audit. |
| Performance & Algorithms | Pending audit | Existing strict JS/CSS bundle budgets confirmed. | Inspect server queries, N+1 risks, client boundaries, assets and render churn. |
| UX & Accessibility | In Progress | Existing responsive/accessibility/journey CI gate confirmed; manual rendered production review remains pending. | Continue page-family/manual QA and exact-background integration when byte-safe transfer is available. |
| Backend & DB Integrity | In Progress | Prisma schema/indexes inspected at first pass. | Audit migrations, refund invariants, access patterns and recovery readiness. |
| Remaining Feature Build | Pending audit | Public/admin route trees exist; no completeness assumption made. | Derive remaining modules from code and launch-readiness gates. |

## First Phase 1 implementation fix
The Razorpay webhook previously checked `PaymentEvent` before mutating donation/refund state. Two concurrent copies of the same refund event could both pass that check before either unique event row existed. The current audit branch now claims failed/refund events inside the same database transaction as their side effects, so a losing duplicate transaction rolls back entirely. Duplicate P2002 conflicts are acknowledged only after re-reading the exact provider event row. The existing captured-payment transition remains independently idempotent.

## Current priority queue
1. Payment/webhook correctness and idempotency.
2. Atomic abuse/rate-limit enforcement.
3. Refund accounting invariants.
4. Authentication/session/RBAC audit.
5. Assistance privacy/upload/storage audit.
6. Database query/index and migration-safety audit.
7. Public UX/accessibility/manual visual acceptance.
8. Exact approved background artwork installation through byte-safe transport.
9. Recovery/backup/rollback and production cutover evidence.

## Isolated blocker
The six approved SVG background files are locally hash-verified but contain large embedded image payloads. The available GitHub text-content connector altered the first test transfer; that write was immediately rolled back. No altered artwork remains on integration. The background task is isolated and must not block the audit or other implementation work.

## Acceptance constraints
- Do not initiate real donations or external financial transactions without explicit authorization.
- Do not create real beneficiary requests/private evidence in browser fixtures or shared acceptance data.
- Do not infer consent from prior publication, filenames, cropping/blurring or provenance records.
- Do not mark external compliance/payment gates complete without evidence.
- Do not merge to `main`, change production DNS, enable production indexing or perform production cutover without explicit user approval.
- Do not raise bundle budgets to hide regressions.

## Factual and release locks
Read `docs/CURRENT_SOURCE_RECONCILIATION_2026-09-15.md` and `docs/canonical-factual-locks-2026-09-15.md` before content changes. Newborn medical aid = ₹107,520; Winter Drive = 234 kits / 234 beneficiaries; Taleem Nazira + Hifdh = 25 students combined as of September 2026; public taxonomy contains exactly five umbrella categories.
