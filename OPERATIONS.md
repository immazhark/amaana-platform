# Amaana Platform Operations

## Required infrastructure

- Node.js 22 runtime or the included container image
- PostgreSQL with TLS and automated backups
- Private S3-compatible bucket with public access blocked
- Razorpay account with separate test and live credentials
- Resend account for queued email notifications. SMS remains disabled until a provider is intentionally configured.

## Deployment order

1. Configure and validate production secrets from `.env.example`.
2. Back up the database.
3. Run `npx prisma migrate deploy` as a one-off release task.
4. Run `npm run seed:rbac` for the initial staff accounts; rotate initial passwords after first access.
5. Deploy the application container. Its startup command applies pending Prisma migrations before serving traffic.
6. Verify `/api/health/live` and `/api/health/ready`.
7. Configure Razorpay webhook events: `payment.captured`, `payment.failed`, `refund.processed`.
8. Complete a Razorpay test-mode donation, webhook, acknowledgement and refund exercise.
9. Switch to live credentials only after reconciliation succeeds.

## Low-cost staging stack

- Railway deploys the repository Dockerfile. Stay on the trial/free allowance until a public launch is approved.
- Neon hosts PostgreSQL in Singapore on its free plan. Use the pooled connection string as `DATABASE_URL` and never paste it into chat, Git, screenshots or logs.
- A private Railway storage bucket stores assistance documents. Reference its `BUCKET`, `ENDPOINT`, `REGION`, `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY` variables from the application service; keep `S3_FORCE_PATH_STYLE=false` for current virtual-hosted-style buckets.
- Resend delivers queued email. Until the official domain is available, use Resend's test sender only with an approved test recipient; do not impersonate `amaanafoundation.org`.
- Trigger `POST /api/jobs/notifications` with `Authorization: Bearer <CRON_SECRET>`. Do not put the secret in a URL.
- Razorpay must remain in test mode until KYC, staging reconciliation and compliance review are complete.

Set provider spending alerts and hard limits where available. Upgrade Railway only immediately before the approved public launch.

## Backup routine on free tiers

1. Before every migration, create a protected Neon branch or export with `pg_dump` over a TLS connection.
2. Weekly after launch, export the database to an encrypted local archive retained by the Managing Trustee.
3. Monthly, test that an export restores into a temporary Neon branch; delete the temporary branch afterward.
4. Record the backup date, operator and restore result without recording credentials or beneficiary data in the log.
5. Never store unencrypted database exports in GitHub, email, public drives or the website bucket.

## Recovery and security

- Never place secrets in Git, screenshots, logs or client-side code except the publishable Razorpay key ID.
- Rotate Razorpay, storage and token-pepper secrets after suspected exposure.
- Keep previous database backups before migrations and rehearse restoration.
- Review failed webhook responses and queued notifications daily after launch.
- Staff access changes must be made through RBAC and retained in the audit trail.
- Do not enable 80G certificates until the CA confirms the required registration and compliance position.

## Launch checklist

- [ ] CA/legal review completed for compliance, privacy, donation and refund pages
- [ ] Official domain email configured in place of the temporary Gmail address
- [ ] PostgreSQL migration applied and backup restoration tested
- [ ] S3 bucket encryption, lifecycle and access controls verified
- [ ] Admin accounts seeded; unique passwords delivered securely and rotated
- [ ] Razorpay KYC/live activation complete; webhook secret configured
- [ ] Domestic test payments, failures and refunds reconciled
- [ ] Notification worker configured and delivery tested
- [ ] Railway, Neon, R2 and Resend usage alerts/limits configured
- [ ] Mobile, keyboard and screen-reader checks completed
- [ ] Domain, HTTPS, monitoring and alerting verified
- [ ] Google indexing enabled only after final content approval
