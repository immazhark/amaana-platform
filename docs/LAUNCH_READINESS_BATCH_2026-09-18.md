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
- Exact Aliza medical-aid metric normalized to `₹482,700`.
- Future CI wired to run the editorial guard.
- Launch rehearsal runbook updated for the unified preflight.

### SEO and accessibility

- Expanded browser SEO coverage for donation/education routes and page-level social images.
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
- Railway notification cron remains intentionally email-disabled in staging.

### Admin operational visibility

- New `notification.view` permission granted to primary and backup approvers, not reviewers.
- New read-only `/admin/notifications` operations page.
- Visibility for PENDING, PROCESSING, FAILED, SENT and CANCELLED states.
- Attempts, next retry/sent time, failure reason and related assistance/donation record links.
- Terminal failures explicitly show “Manual attention required”.
- Unit/browser permission coverage updated.

### Security and authentication

- Shared trusted-client-address resolver:
  - Cloudflare `CF-Connecting-IP` on the configured custom host;
  - Railway `X-Real-IP` on direct Railway hosts;
  - nearest `X-Forwarded-For` hop only as fallback;
  - malformed values fail to `unknown`.
- Public abuse controls and admin login throttling share the same resolver.
- Admin login performs scrypt verification work even for unknown/malformed credentials to reduce account-enumeration timing differences.
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

### Public media

- Managed-public-media proxy fails closed when stored MIME type disagrees with the managed extension.
- Route test added for approved managed PDF delivery.
- Staging public-media acceptance expanded from image-only to image + PDF document lifecycle:
  unpublished denial → publish → exact bytes/type/bounded cache → unpublish revocation → cleanup.

### Database/query hardening

Additive migration `20260918093000_operational_visibility_indexes` adds indexes matching actual operational queries:

- `AuditEvent(createdAt)`
- `Notification(status, createdAt)`
- `DonationAttempt(createdAt)`
- `LoginAttempt(createdAt)`

No business rows are rewritten by this migration.

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
