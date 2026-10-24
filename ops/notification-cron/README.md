# Amaana notification cron — safe containment

This service has its own Docker build. It does **not** build Next.js, connect to PostgreSQL, or need the website's database secrets.

## Current state: delivery disabled

As verified on 24 October 2026, Railway's production `amaana-notification-cron` is isolated under `/ops/notification-cron` with a Dockerfile builder, `node --check run.mjs`, NEVER restart, and an annual dormant `0 0 1 1 *` schedule. Its latest GitHub-triggered deployments are skipped; this state does **not** verify successful delivery.

Both `railway.json` (default) and `railway.contained.json` now deliberately use identical fail-closed settings. Dockerfile's fallback CMD also runs only `node --check run.mjs`. **Neither path can invoke the notification endpoint or drain messages**, even if a future operator resets a Railway start-command override. Do not replace the annual schedule with a null cron field: on Railway, null can mean continuous service execution.

Source-only changes do not mutate the live Railway environment. Recheck both live and staged worker settings before any worker deployment or infrastructure change. Do not change the production website service.

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
