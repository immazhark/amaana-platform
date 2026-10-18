# Notification worker deployment

This service only calls the production notification endpoint. It does not build
Next.js, install packages, connect directly to PostgreSQL, or expose a web server.

The worker requires `CRON_SECRET`, matching the application's configured job
credential. `NOTIFICATION_JOB_URL` defaults to
`https://amaanafoundation.org/api/jobs/notifications`; other origins and paths are
rejected. Requests time out after 30 seconds and do not follow redirects or log
response bodies. No automatic retry is performed inside the worker.

## Current containment and recovery gate

As inspected on 18 October 2026, Railway's `amaana-notification-cron` has a
`0 0 1 1 *` annual schedule, a failed last deployment, and an **inline**
`node -e ... fetch(...)` start command. The five-minute schedule was disabled,
but an annual trigger or manual run of that existing inline command is **not**
equivalent to safe code-only containment. This repository change alone does not
alter Railway configuration or send/clear any queued notifications.

The reviewed `railway.contained.json` specifies an isolated worker image and
`node --check run.mjs`. A scheduled or manual invocation with this exact
start-command override parses the file without calling the notification API.
It retains the annual dormant schedule and NEVER restart policy; syntax checks
are **not evidence of email delivery readiness**. Do not use `railway.json`,
whose schedule is every five minutes, while delivery remains unapproved.

After this branch is merged, configure only the worker service with root
`/ops/notification-cron` and config file
`/ops/notification-cron/railway.contained.json`. Before committing any
Railway staged changes, verify the effective worker start command is
`node --check run.mjs`, the annual schedule and the isolated Dockerfile;
leave the website service untouched. Never run delivery, drain a queue or
set a five-minute schedule as part of containment. Separate authorization
and verification are required to activate the normal worker later.

## Activate only after an approved main merge

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
