# Amaana Platform Operations

## Required infrastructure

- Node.js 22 runtime or the included container image
- PostgreSQL with TLS and automated backups
- Private S3-compatible bucket with public access blocked for assistance documents
- Separate public-media S3-compatible bucket for approved campaign assets
- HTTPS public/CDN origin for approved public media
- Razorpay account with separate test and live credentials
- Resend account for queued email notifications. SMS remains disabled until a provider is intentionally configured.

## Deployment order

1. Configure and validate production secrets from `.env.example`.
2. Back up the database.
3. Run `npx prisma migrate deploy` as a one-off release task.
4. Run `npm run seed:rbac` for the initial staff accounts and whenever new application permissions are introduced. Rotate initial passwords after first access.
5. Deploy the application container. Its startup command applies pending Prisma migrations before serving traffic.
6. Verify `/api/health/live` and `/api/health/ready`.
7. Open Admin → Media review and verify the public-media preflight. Do not publish uploaded campaign media until all three readiness checks are green.
8. Configure Razorpay webhook events: `payment.captured`, `payment.failed`, `refund.processed`.
9. Complete a Razorpay test-mode donation, webhook, acknowledgement and refund exercise.
10. Switch to live credentials only after reconciliation succeeds.

## Public media deployment preflight

Public campaign media and private assistance documents have different trust boundaries and must remain physically separated.

1. Create a dedicated public-media bucket. Set `PUBLIC_MEDIA_S3_BUCKET` to that bucket and **never** point it to the private `S3_BUCKET` used for assistance documents.
2. Configure `PUBLIC_MEDIA_S3_REGION` and `PUBLIC_MEDIA_S3_ENDPOINT` where the public-media provider differs from the private storage provider. When the same provider/account is used, the application may fall back to the `S3_*` region/endpoint and credentials, but the bucket itself must still be separate.
3. Set dedicated `PUBLIC_MEDIA_S3_ACCESS_KEY_ID` / `PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY` when desired. Shared provider-account credentials are supported as a low-cost convenience; they do not remove the separate-bucket requirement.
4. Configure `PUBLIC_MEDIA_BASE_URL` as the HTTPS CDN or public object origin, without a trailing slash. HTTP origins are intentionally not publication-ready.
5. Deploy, then open `/admin/media`. The preflight must show:
   - Separate public bucket ✓
   - Upload credentials ✓
   - HTTPS public delivery ✓
6. Upload one non-sensitive test image through Media review with descriptive alt text. The record must start unpublished.
7. Confirm the generated public asset URL loads successfully over HTTPS and does not expose private assistance paths or credentials.
8. Approve the test image, verify it becomes eligible for public rendering, then unpublish it again. Remove the test object from storage through the provider console if it is not needed.
9. Only after this exercise should the reviewed Eid/Qurbani/Taleem/Winter/Dates campaign assets be populated.

Never make the private assistance-document bucket public as a shortcut. Never place secrets in a media URL. Uploaded media is still subject to content approval, privacy approval and meaningful-alt-text requirements even when storage preflight is green.

## Low-cost staging stack

- Railway deploys the repository Dockerfile. Stay on the trial/free allowance until a public launch is approved.
- Neon hosts PostgreSQL in Singapore on its free plan. Use the pooled connection string as `DATABASE_URL` and never paste it into chat, Git, screenshots or logs.
- A private Railway storage bucket stores assistance documents. Reference its `BUCKET`, `ENDPOINT`, `REGION`, `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY` variables from the application service; keep `S3_FORCE_PATH_STYLE=false` for current virtual-hosted-style buckets.
- Public campaign media uses a different bucket and an HTTPS delivery origin. It may use the same provider account only when the bucket remains distinct from assistance storage.
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
- If public-media credentials are compromised, rotate them without changing the private assistance bucket's public-access policy.

## Launch checklist

- [ ] CA/legal review completed for compliance, privacy, donation and refund pages
- [ ] Official domain email configured in place of the temporary Gmail address
- [ ] PostgreSQL migration applied and backup restoration tested
- [ ] Private assistance bucket encryption, lifecycle and public-access block verified
- [ ] Separate public-media bucket and HTTPS `PUBLIC_MEDIA_BASE_URL` verified
- [ ] Admin Media review preflight fully green and non-sensitive upload/publish/unpublish test completed
- [ ] `npm run seed:rbac` rerun after the content/media permissions deployment
- [ ] Admin accounts seeded; unique passwords delivered securely and rotated
- [ ] Razorpay KYC/live activation complete; webhook secret configured
- [ ] Domestic test payments, failures and refunds reconciled
- [ ] Notification worker configured and delivery tested
- [ ] Railway, Neon, storage/CDN and Resend usage alerts/limits configured
- [ ] Mobile, keyboard and screen-reader checks completed
- [ ] Domain, HTTPS, monitoring and alerting verified
- [ ] Google indexing enabled only after final content approval
