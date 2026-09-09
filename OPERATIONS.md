# Amaana Platform Operations

## Required infrastructure

- Node.js 22 runtime or the included container image
- PostgreSQL with TLS and automated backups
- Private S3-compatible bucket with public access blocked
- Razorpay account with separate test and live credentials
- Transactional email/SMS worker for queued `Notification` records

## Deployment order

1. Configure and validate production secrets from `.env.example`.
2. Back up the database.
3. Run `npx prisma migrate deploy` as a one-off release task.
4. Run `npm run seed:rbac` for the initial staff accounts; rotate initial passwords after first access.
5. Deploy the application container.
6. Verify `/api/health/live` and `/api/health/ready`.
7. Configure Razorpay webhook events: `payment.captured`, `payment.failed`, `refund.processed`.
8. Complete a Razorpay test-mode donation, webhook, acknowledgement and refund exercise.
9. Switch to live credentials only after reconciliation succeeds.

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
- [ ] Mobile, keyboard and screen-reader checks completed
- [ ] Domain, HTTPS, monitoring and alerting verified
- [ ] Google indexing enabled only after final content approval
