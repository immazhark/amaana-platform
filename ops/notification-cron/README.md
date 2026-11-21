# Amaana notification cron

This service has its own Docker build. It does **not** build Next.js, connect to PostgreSQL, or need the website's database secrets.

## Current state: running, email delivery still gated by the website

Owner approval to run the worker was given on 22 November 2026. The service runs `node run.mjs` every five minutes (`*/5 * * * *`), NEVER restart. Each run makes one authenticated POST to the website's `/api/jobs/notifications`.

**What actually runs.** Railway does not read `railway.json` for this service (its config-as-code path does not follow the root directory and cannot be enabled for it), and it did not apply a custom start command to this Dockerfile build: with the start command set to `node run.mjs`, containers started every five minutes but printed nothing and made no request, because the image's own `CMD` ran. The Dockerfile `CMD` is therefore the source of truth for what runs, and the schedule is set on the Railway service itself. `railway.json` and `railway.contained.json` record the intended values and are checked by tests, but changing them does not change the live service.

What a run does depends on the **website's** variables, not on this service:

- **Delivery off** (the default: `EMAIL_DELIVERY_MODE` not exactly `live`, or `NOTIFICATION_SEND_NOT_BEFORE` missing or malformed): the endpoint answers HTTP 200 `status: "disabled"` and runs only retention maintenance (ephemeral security-ledger pruning and the 90-day aggregates). **No email is sent.**
- **Delivery on** (both variables set; see `docs/TRANSACTIONAL_EMAIL_RUNBOOK.md`, "Go-live guard"): only notifications created at or after `NOTIFICATION_SEND_NOT_BEFORE` are sent, so the old queue is never drained.

To park the worker again: set the Railway service's cron schedule back to the annual `0 0 1 1 *` (never a null cron field, which on Railway can mean continuous execution) and, if you also want the image to stop calling the endpoint, change the Dockerfile `CMD` back to `["node", "--check", "run.mjs"]` in a reviewed change. `railway.contained.json` holds those parked values.

Source changes here redeploy this service only (watch pattern `ops/notification-cron/**`). Do not change the production website service from this directory.

## Explicitly separate eventual delivery activation

The `run.mjs` module contains a production notification client, but default startup **never executes it**. Do not manually run `node run.mjs`, drain queued notifications, send a test request with live credentials, or change to a five-minute schedule as part of containment.

Later activation requires specific owner approval **in addition to** this safe containment change, an independent deployment review, and a separate protected source/config change. Before enabling delivery:

1. Verify the website notification job endpoint, idempotency and queue handling, approved privacy boundaries, and Resend/recipient readiness.
2. Verify `CRON_SECRET` is configured on both ends without reading or logging its value; do not supply `DATABASE_URL` to this worker.
3. Change startup and schedule together in a new, explicitly reviewed release. Validate its exact effective Railway settings before deploying; do not rely on implicit Dockerfile defaults.
4. Observe the resulting worker build, scheduled HTTP 200, bounded retries/failures, and Railway resource usage. HTTP 401 or non-200 is a failure, not evidence of delivery. Verify actual delivery separately before closing issue #264.

## Client safeguards and testing

`run.mjs` allows only `https://amaanafoundation.org/api/jobs/notifications` with no query, fragment, credentials or redirects. It sends one POST with an authorization header and a 30-second timeout, makes no automatic retry, and never logs server response bodies or secrets.

Run `node --test scripts/test-notification-cron.mjs` from the repository root. Tests verify that the default and contained configuration cannot send mail, the Dockerfile fallback is non-delivering, and the isolated client preserves endpoint, HTTP and timeout safeguards. No external requests or real secrets are needed for these tests.
