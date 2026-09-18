# Amaana Transactional Email Delivery Runbook

This runbook covers donor/assistance transactional email delivery only. It does **not** authorize a production launch, live Razorpay activity, beneficiary-media publication, indexing, or a merge to `main`.

## Current staging posture

- Railway service: `amaana-notification-cron`
- Schedule: every 5 minutes
- Worker endpoint: authenticated `POST /api/jobs/notifications`
- Staging policy: `EMAIL_DELIVERY_MODE=disabled`
- Expected staging cron response while disabled: HTTP 200 with `status:"disabled"` plus non-sensitive security-ledger cleanup counts.

Staging must remain disabled because synthetic acceptance data can contain test addresses and must never generate external email.

## Delivery guarantees implemented

- queue rows are claimed atomically before send;
- interrupted `PROCESSING` rows are recovered after a bounded stale interval;
- maximum automatic attempts: 5;
- retry schedule after transient provider/network failure: 5m → 15m → 45m → 135m;
- Resend receives a stable `Idempotency-Key` derived from the notification row id, preventing duplicate provider sends during retry within the provider idempotency window;
- non-retryable provider/configuration failures are parked for manual attention;
- Resend `409 concurrent_idempotent_requests` is retryable, while `409 invalid_idempotent_request` is treated as permanent because it indicates the same key was reused with a different payload;
- approvers can review delivery state in `/admin/notifications`.

## Production activation prerequisites

Do not enable live delivery until all of the following are true:

1. The approved production environment is serving the approved candidate.
2. `EMAIL_FROM` uses a verified Amaana-controlled sending identity/domain.
3. `RESEND_API_KEY` is the production key with the minimum required sending permissions.
4. `CRON_SECRET` is set independently from other application secrets.
5. The production notification cron targets the production job endpoint, not staging.
6. A controlled acceptance recipient owned by the Amaana team is selected.
7. No beneficiary, donor or payment-sensitive production record is used for the first acceptance.

## Controlled activation

1. Record the candidate SHA and current notification queue counts.
2. Confirm the cron service is healthy before changing delivery mode.
3. Set `EMAIL_DELIVERY_MODE=live` only in the approved production application environment.
4. Create one controlled synthetic/operational notification addressed to the approved team recipient.
5. Wait for the scheduled cron invocation.
6. Verify:
   - job response is HTTP 200 with `status=ok`;
   - exactly one queue row transitions to `SENT`;
   - `attempts` reflects the actual send attempt count;
   - `sentAt` is populated;
   - the recipient receives exactly one message;
   - the notification operations page reports the same state.
7. Record non-sensitive evidence in the launch-readiness register.

## Retry acceptance

To verify retry behavior without emailing a beneficiary:

1. Use a controlled non-production/synthetic notification and an intentionally safe provider failure condition.
2. Confirm the row becomes `FAILED` with a future `scheduledFor`.
3. Confirm the retry uses the same notification id / provider idempotency key.
4. Restore the provider configuration.
5. Confirm a later retry transitions the same row to `SENT` without creating a duplicate queue row or duplicate email.

Do not intentionally break production credentials to perform this test.

## Failure operations

Use `/admin/notifications` to inspect:

- `PENDING`: awaiting scheduled delivery;
- `PROCESSING`: currently claimed by a worker;
- `FAILED`: retry scheduled or manual attention required;
- `SENT`: successfully accepted by the provider.

A `FAILED` row displaying **Manual attention required** will not retry automatically. Investigate the stored failure reason and provider configuration before creating or rescheduling another notification.

Never copy API keys, full email payloads, beneficiary documents, payment secrets or private tracking tokens into GitHub issues, readiness evidence or screenshots.

## Launch gate

The `transactional-email-delivery` gate in `docs/launch-readiness.json` remains `PENDING` until a controlled production delivery proves:

- live mode is enabled in the correct environment;
- the cron reaches the production job;
- the provider accepts the message;
- the queue reaches `SENT`;
- the team receives exactly one email;
- operational failure/retry visibility is usable.

A healthy disabled staging cron is infrastructure evidence, not production email-delivery evidence.
