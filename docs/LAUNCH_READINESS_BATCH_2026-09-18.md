# Launch-readiness quiet batch — 2026-09-18

Branch: `work/launch-readiness-batch-2026-09-18`

Base integration checkpoint: `phase-public-site-rebuild` at `4f7cbafb87e8c7d75fd7191d7bcc7a83c9320a3d`.

This branch intentionally has no pull request and is not connected to Railway. It exists to batch launch-readiness work without consuming GitHub Actions minutes or triggering repeated staging deployments.

## Implemented in this batch

### Release preflight and editorial controls

- Unified read-only launch preflight:
  - `npm run launch:preflight`
  - `npm run launch:preflight:rehearsal`
  - `npm run launch:preflight:production`
- Public editorial/compliance guard for canonical factual values and fail-closed regulatory wording.
- Public/private data-boundary guard prevents storytelling/appeal surfaces from reading internal beneficiary, verification, token-hash or private-storage fields.
- Exact Aliza medical-aid metric normalized to `₹482,700`.
- Future CI wired to run the editorial guard.
- Launch rehearsal runbook updated for the unified preflight.

### SEO and accessibility

- Expanded browser SEO coverage for donation/education routes and page-level social images.
- Donation document title de-duplicated against the root Amaana title template; browser acceptance now rejects repeated Amaana branding in titles.
- Security-header browser acceptance covers CSP, HSTS, referrer policy, no-sniff, frame denial, permissions policy, COOP/CORP and no-store boundaries.
- Branded 404 acceptance checks status, navigation, noindex and mobile containment.
- Skip-link target made programmatically focusable.
- Browser coverage for actual skip-link focus transfer, one H1, English document language and main landmark.

### Transactional email reliability

- Email delivery defaults to disabled and activates only with explicit `EMAIL_DELIVERY_MODE=live`.
- Stable Resend idempotency key per notification row.
- Retry backoff: 5m → 15m → 45m → 135m, max five attempts.
- Precise Resend 409 handling: concurrent idempotent requests retry; invalid same-key/different-payload conflicts park.
- Stale PROCESSING recovery retained.
- Production launch gate added for controlled transactional-email acceptance.
- Transactional-email operations runbook added.
- Notification worker tests now cover atomic claim, provider idempotency key, successful SENT transition, transient 429 rescheduling and concurrent-worker claim loss.
- Railway notification cron remains intentionally email-disabled in staging.

### Admin operational visibility

- New `notification.view` permission granted to primary and backup approvers, not reviewers.
- New `notification.manage` permission enables audited manual recovery only for primary/backup approvers.
- New `/admin/notifications` operations page.
- Visibility for PENDING, PROCESSING, FAILED, SENT and CANCELLED states.
- Attempts, next retry/sent time, failure reason and related assistance/donation record links.
- Terminal failures explicitly show “Manual attention required”.
- Manual requeue is FAILED-only, requires an operational reason and uses an atomic status claim so it cannot race an active worker into a duplicate send.
- Unit/browser permission and race coverage updated.

### Security and authentication

- Shared trusted-client-address resolver:
  - Cloudflare `CF-Connecting-IP` on the configured custom host;
  - Railway `X-Real-IP` on direct Railway hosts;
  - nearest `X-Forwarded-For` hop only as fallback;
  - malformed values fail to `unknown`.
- Public abuse controls and admin login throttling share the same resolver.
- Valid-format unknown admin accounts still follow the dummy-scrypt verification path to reduce account-enumeration timing differences; structurally invalid/oversized credentials are rejected before expensive password work.
- Admin login email/password inputs are server-bounded (254/256 chars) before user lookup or scrypt, while invalid attempts still participate in the rate-limit ledger.
- Expired sessions are pruned when a new admin session is created.
- Explicit admin logout is written to the audit trail.
- Password verification tests expanded.

### Ephemeral security-ledger retention

- Hashed public rate-limit attempts retained 24 hours; enforcement window remains one hour.
- Hashed login attempts retained seven days; lockout window remains 15 minutes.
- Cleanup runs through the existing authenticated maintenance cron even when email delivery is disabled.
- Cleanup failure does not block live transactional-email processing.
- Maintenance route failure-domain behavior has unit coverage.
- Created-at indexes added for efficient cleanup.

### Private evidence and destructive operations

- Private assistance document signed URLs are bound to both the managed object key and the owning request id.
- Private evidence uploads and signed downloads explicitly use `private, no-store`.
- Managed-key traversal/wrong-owner/malformed-extension tests added.
- Private evidence and public media deletion write a durable `deletion_started` audit event before irreversible object deletion.
- Destructive ordering tests added.
- Retention action coverage explicitly proves raw evidence cannot be deleted while the request/linked appeal is still active.

### Public media

- Managed-public-media proxy fails closed when stored MIME type disagrees with the managed extension.
- Route test added for approved managed PDF delivery.
- Staging public-media acceptance expanded from image-only to image + PDF document lifecycle:
  unpublished denial → publish → exact bytes/type/bounded cache → unpublish revocation → cleanup.

### Database/query hardening

Additive migration `20260918093000_operational_visibility_indexes` adds indexes matching actual operational queries:

- `AuditEvent(createdAt)`
- `AuditEvent(entityType, action, createdAt)`
- `Notification(status, createdAt)`
- `DonationAttempt(createdAt)`
- `LoginAttempt(createdAt)`
- `MediaAsset(isPublic, sourceYear, sortOrder, createdAt)`

Production RBAC migration `20260918111500_notification_operations_rbac` idempotently creates `notification.view` and `notification.manage` and grants them only to PRIMARY/BACKUP approvers. Production launch therefore does not depend on running the staging seed.

No business rows are rewritten by these migrations.

### Payment/refund reconciliation

- Private donation acknowledgement API now uses no-store, no-referrer and noindex headers.
- Refund webhook processing requires INR and bounded integer paise values.
- Funded appeals automatically return to PUBLISHED when a verified refund drops retained funds below target while the fundraising window remains open.
- If the same refund happens after the fundraising deadline, the appeal becomes CLOSED instead of silently reopening.
- Out-of-order `refund.processed` delivery resolves Razorpay payment → order and runs the existing idempotent capture path before refund accounting.
- Unrelated provider payments remain unmatched rather than being force-linked.
- Critical unmatched payment/refund events are surfaced in the admin donations screen for reconciliation.
- Stored Razorpay webhook audit payloads are privacy-minimized to provider ids/order linkage/amount/currency/status instead of retaining the full provider payload.
- Refund processing queues exactly one transactional refund notification inside the same unique-event transaction.
- Payment/refund operations runbook added.
- Razorpay webhook route-level tests cover invalid signatures, duplicate event idempotency, refund accounting, appeal-total reconciliation and donor notification.
- Read-only rollback target verifier added for exact-SHA health/private-boundary checks.

### Production indexing and private-route boundaries

- Indexing now requires all three conditions: explicit flag, official HTTPS Amaana host, and `APP_ENVIRONMENT=production`.
- Docker build stage receives `APP_ENVIRONMENT`; its default is staging/fail-closed.
- The public `/donate` landing page is indexable after approved production indexing.
- `/donate/<appeal>` checkout paths remain private/noindex.
- A top-level admin layout explicitly keeps all admin surfaces noindex/nofollow/no-referrer.
- Public-routing and browser SEO tests cover these boundaries.

### Human review preparation

- Structured manual launch-review checklist added for real 200% zoom, keyboard-only navigation, reduced motion, visual hierarchy, CTA destinations, social previews, factual/compliance reading and per-asset media consent/provenance review.
- Readiness evidence now distinguishes automated proof from the remaining human/external judgement instead of overstating automation.

## Intentionally not changed

- No merge to `main`.
- No production indexing.
- No live Razorpay charge or controlled real donation.
- No Razorpay KYC assumption.
- No real beneficiary media approval/publication.
- No FCRA claim; fundraising remains domestic-only.
- No transactional email activation in staging.
- No Railway source/service/domain/bucket changes.
- No deletion of the stray Railway bucket.
- No attempt to mark the rollback rehearsal verified.
- No human accessibility/media/editorial gate converted to automated approval.

## Validation still required before integration

Because GitHub-hosted Actions on the current repository owner are unavailable at this checkpoint, this batch has deliberately not been promoted.

Before merging into `phase-public-site-rebuild`:

1. Run `npm ci`.
2. Run `npm run launch:preflight`.
3. Run the Playwright browser acceptance suite.
4. Confirm Prisma schema/migration validation.
5. Review the quiet-batch diff for permission and migration scope.
6. Perform one controlled integration merge.
7. Require one successful Railway build/startup on the exact merge SHA.
8. Run the fail-closed staging acceptance once.
9. Run public-media staging acceptance once to prove both image and PDF lifecycle.
10. Return all one-shot acceptance flags to false and verify ordinary startup.

## External/human gates that remain pending

- manual rendered accessibility review;
- final human editorial/social preview judgement;
- public-media consent/provenance review;
- transactional email live acceptance;
- Razorpay live/KYC readiness;
- controlled live donation acceptance;
- operational refund/receipt check;
- true application rollback rehearsal;
- production indexing decision;
- explicit `main` promotion/production approval.
