# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

## Integration branch
- `phase-public-site-rebuild`
- Current healthy integration SHA before this quiet batch: `4f7cbafb87e8c7d75fd7191d7bcc7a83c9320a3d`
- Railway deployment `91a6a964-93f7-40df-a437-d43416e15ec5` is SUCCESS on that SHA.
- GitHub hosted Actions are temporarily unavailable because the personal-account monthly minutes were exhausted. Do not interpret zero-step runner failures as code failures.

## Current task branch
- `work/backgrounds-razorpay-readiness-2026-09-18`
- Base: family-review SHA `69b4e2fd5698b050ae8dcf7d712588a1d1167ca4`.
- Purpose: finish the corrected approved background integration, reconcile Razorpay approval/readiness records, and preserve quiet-batch development while family review is ongoing.
- Status: active quiet branch; do not deploy until the six corrected SVGs are landed byte-for-byte and validation is complete.

## Working protocol
1. Keep `main` untouched.
2. Keep indexing disabled.
3. Do not initiate real Razorpay payments/refunds.
4. Do not publish real beneficiary/programme media without human privacy/consent/provenance review.
5. Keep `STAGING_ACCEPTANCE_ON_START=false` and `PUBLIC_MEDIA_ACCEPTANCE_ON_START=false` except during an explicitly controlled same-SHA acceptance.
6. Batch related changes on the quiet branch.
7. At checkpoint: run one consolidated validation path, then one controlled integration merge/deploy.

## Completed before this quiet batch
- Secure gated private-bucket public-media proxy and real synthetic upload/publish/unpublish acceptance.
- Database snapshot/restore recovery drill with matching content digests and clean post-restore application startup.
- Fail-closed staging launch acceptance (32 checks) on exact candidate SHA before public-port activation.
- SEO/social metadata hardening and Docker build-time NEXT_PUBLIC_* injection.
- Bounded Prisma advisory-lock retry for transient P1002 migration contention.
- Separate public-media storage from private assistance storage.

## Quiet-batch work completed/in progress

### Release / editorial quality
- Unified read-only launch preflight commands:
  - `npm run launch:preflight`
  - `npm run launch:preflight:rehearsal`
  - `npm run launch:preflight:production`
- Public editorial/compliance guard with tests for:
  - newborn amount ₹107,520;
  - Winter 234 kits / 234 beneficiaries;
  - Aliza amount ₹482,700;
  - provisional 12A/12AB and 80G wording;
  - domestic-only / non-FCRA boundary.
- Exact Aliza public metric changed from rounded `₹4.82L` to `₹482,700`.
- SEO browser coverage extended to donation/sponsorship routes and page-level social images.
- Document-title regression coverage prevents duplicate Amaana branding.
- Public/private data-boundary guard prevents public publishing surfaces from reading internal beneficiary/verification/token/storage fields.
- Final human launch QA checklist consolidated into one canonical document.

### Accessibility
- Skip-link target is programmatically focusable.
- Browser acceptance verifies skip-link focus transfer, one H1, document language and main landmark.
- Existing axe, responsive, reduced-motion, keyboard, mobile-focus and 200%-reflow-equivalent coverage retained.
- Branded 404 behavior is browser-tested for 404 status, navigation, noindex and mobile containment.

### Security / privacy / operations
- Private-document signed URL ownership binding and private-cache hardening.
- Admin login timing/identity hardening, bounded credential inputs, expired-session pruning and audited logout.
- Trusted proxy/client-address normalization for rate-limit identity.
- Ephemeral login/donation security-ledger retention/pruning.
- Transactional email worker idempotency/retry/stale-processing recovery plus operational runbook.
- Notification operations page and audited manual requeue path using new `notification.manage` permission.
- Destructive media/private-document deletion intent audit records.
- Public-media route MIME mismatch fails closed; managed PDF delivery acceptance added.
- Staging email delivery remains fail-closed/disabled.
- Browser security-header acceptance now covers CSP, HSTS, framing, referrer, permissions, COOP/CORP and no-store sensitive surfaces.

### Data / query integrity
- Additive operational indexes for audit history, notification lists, security-ledger cleanup and media review ordering.
- No destructive schema migration introduced.

## Additional hardening completed in the quiet batch

### Payment / refund correctness
- Refund processing requires INR and bounded paise values.
- Out-of-order refund webhooks reconcile payment → order and reuse the idempotent capture path before refund accounting.
- Refunds can reopen a FUNDED appeal to PUBLISHED only while the fundraising window is still open; otherwise the under-target funded appeal becomes CLOSED.
- Private donation acknowledgement responses are no-store, no-referrer and noindex.
- Critical unmatched payment/refund events are surfaced in admin donation operations.
- Stored webhook evidence is privacy-minimized.
- Exactly one donor refund notification is queued transactionally for each effective unique refund event.
- `docs/PAYMENT_REFUND_OPERATIONS_RUNBOOK.md` documents the controlled live acceptance.
- Webhook route tests now cover invalid signatures, duplicate event idempotency and end-to-end refund reconciliation into donation/appeal/event/notification records.

### Production indexing boundaries
- Indexing now requires explicit opt-in, official HTTPS Amaana host and `APP_ENVIRONMENT=production`.
- Docker builder defaults `APP_ENVIRONMENT=staging`, making preview builds fail closed.
- `/donate` is a public SEO route while `/donate/<appeal>` remains private.
- All admin surfaces have explicit noindex/nofollow/no-referrer metadata.

### Rollback preparation
- `npm run rehearsal:verify-target` validates exact deployed SHA, health/readiness, representative public routes and private no-cache/noindex boundaries.
- Pinned previous-known-good branch remains `rehearsal/rollback-baseline-2026-09-18`.

### Production RBAC correctness
- New notification view/manage permissions are not seed-only.
- Migration `20260918111500_notification_operations_rbac` idempotently creates/grants them to PRIMARY/BACKUP approvers in production.
- Manual email recovery uses an atomic FAILED-only claim and cannot race an active worker into a duplicate send.
- Notification worker tests cover atomic claim, stable provider idempotency, SENT transition, transient retry scheduling and concurrent claim loss.

## Current background correction
- Six corrected approved SVG source files were supplied on 18 September 2026.
- `scripts/verify-approved-backgrounds.mjs` now locks their SHA-256 hashes and launch preflight fails closed if repo assets differ.
- Repository replacement remains pending until the six corrected files are uploaded byte-for-byte to `public/backgrounds/`; do not regenerate, minify or text-reconstruct them.

## Operational note
- The preview service is healthy on the family-review SHA.
- The latest notification-cron build attempt failed on the superseded pre-fix SHA because of the admin-login null-narrowing TypeScript error. The cron service is still configured correctly, but it must be rebuilt on the next controlled deployment after the corrected candidate is ready; do not deploy it separately now.

## Remaining genuine launch gates
- `rollback-rehearsal` — real staging rollback to a previous known-good deployment and restoration still required.
- `transactional-email-delivery` — controlled live production sender acceptance required.
- `manual-rendered-accessibility-review` — final human rendered review required.
- `final-editorial-seo-social-review` — final human copy/social preview review required.
- `public-media-human-review` — individual media privacy/consent/provenance review required.
- Razorpay KYC/account activation is VERIFIED as of 18 September 2026. Remaining payment gates are Test-mode reconciliation, separate Live-mode key/webhook configuration at the controlled production checkpoint, controlled real donation acceptance, and refund/receipt operational verification.
- explicit production indexing decision.
- explicit `main` promotion/production approval.

## Recovery anchors
- Database recovery snapshot evidence is recorded in `docs/DATABASE_RECOVERY_DRILL_2026-09-18.md`.
- Preserved Neon branch: `pre-recovery-original-2026-09-18`.
- Pinned rollback baseline branch: `rehearsal/rollback-baseline-2026-09-18` at healthy SHA `4f7cbafb87e8c7d75fd7191d7bcc7a83c9320a3d`.

## Locked facts
- Newborn medical aid: **₹107,520**.
- Winter Drive 2025–26: **234 Winter Kits distributed to 234 beneficiaries**.
- Aliza critical-care appeal: **₹482,700**.
- Taleem Nazira + Hifdh: **25 students combined as of September 2026**.
- Amaana is **not FCRA-registered**; fundraising remains domestic-only.
- 12A/12AB and known 80G status are **provisional** and must be described that way.
