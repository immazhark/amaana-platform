# Notification worker deployment

This service only calls the production notification endpoint. It does not build
Next.js, install packages, connect directly to PostgreSQL, or expose a web server.

The worker requires `CRON_SECRET`, matching the application's configured job
credential. `NOTIFICATION_JOB_URL` defaults to
`https://amaanafoundation.org/api/jobs/notifications`; other origins and paths are
rejected. Requests time out after 30 seconds and do not follow redirects or log
response bodies. No automatic retry is performed inside the worker.

## Current containment

On 12 October 2026 the failing Railway worker's five-minute schedule was removed
and its job URL was corrected with deployment skipped. Scheduled notification
processing is suspended until the isolated worker is deployed. Do not add the
website's database credentials to this service to make the root website build.

## Activate only after an approved main merge

For build recovery while delivery remains contained, use source root
`/ops/notification-cron` with config file
`/ops/notification-cron/railway.contained.json`. This selects the isolated image
and preserves the existing year-only schedule; it does not validate delivery or
disable execution forever. Do not manually start this image merely to test the
build: its entrypoint calls the authenticated endpoint and may send queued mail.
The image workflow tests with networking disabled and synthetic responses.
Confirm the selected config in Railway before deploying. Switch to the normal
config only when scheduled production email processing is explicitly authorized.

1. Independently review this change and merge through the approved release path
   into `main`. Task-branch pushes must not deploy to Railway.
2. Keep the worker source repository `immazhark/amaana-platform`, branch `main`.
3. For **amaana-notification-cron only**, set source root directory to
   `/ops/notification-cron` and config file to
   `/ops/notification-cron/railway.json`. Do not alter the website service.
4. Use its isolated Dockerfile and `node run.mjs`; no website pre-deploy command
   or HTTP healthcheck. Watch only `ops/notification-cron/**`.
5. The worker config restores the existing five-minute job schedule and NEVER
   restart policy. Scheduled execution calls the endpoint; it should reuse the
   built worker image rather than rebuild the website.
6. Observe a successful build and scheduled `notification-job 200` result before
   declaring recovery. A 401 requires credential reconciliation; a non-200
   result remains a genuine failure. Do not suppress failure alerts.

The live website currently follows `main`; preview is pinned to its existing
commit. The seven-day usage monitor is read-only. Removing the worker schedule
does not change the application's queued notifications, secret, or live website.
