## Legacy giving enquiries — information only, not bequest acceptance

`/get-involved/legacy-giving` is a preliminary information and
contact journey. It is **not** a reviewed legal, religious or
financial product. It collects no will, identity, family detail,
estate records, amount or payment credential, provides no template
or inheritance ruling, and accepts no pledge or estate gift.
The only contact entry points lead to Amaana's ordinary
contact/governance pages. No new backend intake is introduced.

The page is reachable through ordinary on-site Get Involved/footer
links, but is absent from the XML sitemap and deliberately carries
`noindex,nofollow,noarchive` in page metadata and the HTTP
`X-Robots-Tag` header. Do not remove these protections or market
an accepted legacy-giving facility until an appropriately qualified
legal/religious adviser, charity-governance owner and privacy
reviewer approve copy, acceptance terms, beneficiary-designation
policy and the legal-document handling procedure.

The Shukr consent mutation must never be reported as failed merely
because non-critical cache revalidation throws after a committed
transaction. In case of invalidation service failure, public
`/shukr` is force-dynamic and no-store and reads the DB directly.
Database transactional or append-only consent audit failures
remain fatal, fail closed, and must not return success.

## Shukr consent event history, cleanup and release gate (OFF by default)

Donor Shukr recognition requires **separate affirmative opt-in** from
the donor's private receipt. The new
`DonorRecognitionConsentEvent` table only records donationId,
REQUESTED/WITHDRAWN and timestamp. These donor actions are NOT
`AuditEvent` staff actions. The public wall must never reveal
contact details, payment amounts or hidden consent-event data.

The receipt-authorized API uses one serializable transaction per
consent mutation and atomically writes the minimal private event.
Donor withdrawals are valid even after refunds or anonymity changes;
stale token-authorized state cannot reverse a newer decision. The
staff console may remove a pending ineligible request only if the
database currently confirms refunded, anonymous or non-CAPTURED
status, using a separate authorized and audited conditional write.
Emergency unpublication of previously approved names remains
available. Bounded queues MUST show when further records exist.

**Do not activate** `AMAANA_DONOR_RECOGNITION_ENABLED` until all
of the following are reviewed and proven:

1. Review consent and event retention/deletion policy with a qualified
   owner, including access requests and how donor withdrawals are
   honored without retaining their prior public display name.
2. Back up the real database; apply the original recognition
   migration (`20261015000000_donor_recognition_consent`) **before**
   `20261015040000_donor_recognition_consent_events` and regenerate
   Prisma client on the exact checkout.
3. Exercise parallel request/withdrawal/moderation races and
   database uniqueness/audit rollback against a migrated isolated
   PostgreSQL instance. Confirm errors fail closed without a
   consent event or a partial data update.
4. Verify valid/invalid receipt token behavior, origin/rate limiting,
   donor anonymity/refunds, independent staff RBAC, moderated
   publication and emergency takedown.
5. Verify Shukr remains HTTP- and metadata-`noindex`, with
   `no-store`, sitemap exclusion, keyboard access and 200% zoom.
   Check withdrawn names are absent from fresh public reads and
   any platform edge caches.
6. Do not put contact details, receipt capabilities, chosen display
   names or sensitive notes in the consent-event ledger or logs.

For emergency takedown or privacy review, disable the feature flag.
Disabling recognition does not alter donations or payment records.

## Private giving-fund planning summary (flag OFF by default)

The fund registry is viewable with `fund.view`; financial data
additionally requires `donation.view`. Allocation planning
summaries and the allocation sidebar link are shown only if the
server-side `AMAANA_ALLOCATION_PLANNING_ENABLED=true` gate has
been explicitly activated after migrations and financial review.

The planner compares all **approved, unreversed internal proposals**
with recorded captured and retained receipts using integer paise.
Pending proposals do not reserve money. On refund conflict,
over-allocation or invalid sum, show a finance warning instead of a
remaining balance. "Unplanned" means only that internal plans have
not consumed those recorded receipts; it is **not cash in bank,
paid expenditure, verified disbursement or programme outcome**.

Prior to activation, verify Prisma groupBy relation filters
(`reversal is null`, donation captured/refunded status), SQL
integer precision and concurrently posted allocations against an
isolated PostgreSQL seed. Verify staff `fund.view` +
`donation.view` RBAC, flag-off absence, admin zoom/accessibility,
and clean rollback. Do not activate based solely on authored tests.

## Shukr search privacy and allocation conflict queues

The optional donor Shukr page at `/shukr` is public for a
**voluntarily consented, moderated, withdrawable on-site name list**,
but must remain `noindex,nofollow,noarchive` and excluded from the
sitemap. Donor recognition consent is not consent to permanent
third-party search indexing. Do not remove this protection without
independently reviewed, explicit consent and removal guarantees.

The private allocation page has three separately bounded queues:
1. Oldest refund or donation-status conflicts against approved,
   un-reversed internal allocation plans, with a total count that
   warns when records exceed the displayed viewport.
2. Oldest pending independent reviews.
3. Most recently reviewed approvals and rejections.

Always reconcile all underlying donation records with approved
non-reversed allocations, not just the visible rows. A historical
planning approval is **not bank liquidity, a verified expenditure,
or proof that a beneficiary was served**. Disable
`AMAANA_ALLOCATION_PLANNING_ENABLED` if the accounting projection,
fund purpose, refund reconciliation or third-party reviewer process
cannot be demonstrated against an isolated real PostgreSQL instance.

## Internal giving-fund allocation planning (OFF by default)

This feature is an **internal allocation proposal and second-reviewer
governance workflow only**, not a disbursement, expense, receipt, provider
payment, fund transfer or beneficiary-verified expenditure record.

- Keep `AMAANA_ALLOCATION_PLANNING_ENABLED` unset or `false` until
  a separate finance/legal approval and controlled release. It must
  remain false on live Railway until both dedicated migrations
  (`20261015020000_donation_allocation_proposals` and
  `20261015030000_allocation_reversal_ledger`) have been reviewed,
  backed up, applied and Prisma client generated in the target environment.
- `fund.manage` may create pending proposals only for approved
  original-purpose INR GENERAL/SADAQAH fund donations with CAPTURED
  status and zero refunds. Another account with `fund.approve` may
  approve or reject. A third independent fund.approve reviewer may
  write a one-time append-only reversal. No actor may self-approve,
  and a reversal must preserve the historical approval.
- Pending proposals never reserve money; approval alone checks all
  already approved and not reversed proposals atomically against
  the original net captured donation. Verify concurrent approval
  isolation and original designation in an isolated test DB.
- Important release blocker: approval is *planning*, not settled
  expenditure. Financial review must specify how later partial/full
  refunds and disbursement voucher records will reconcile with
  earlier approved internal allocations before activation. Never
  treat proposal sums as available bank cash or completed impact.
- Test maker/checker/reverser RBAC, forged form values, concurrency,
  overflow/paise precision, fund revision/original snapshot,
  net retained accounting, ineligible Zakat/appeal/pending claims,
  append-only reversal uniqueness, and audit trails.
- To disable immediately, unset the flag. Neither enabled nor
  disabled modes should initiate any payment or expose a public API.

## Private donor information rights requests (disabled until reviewed)

This new receipt-scoped workflow is NOT a donor account and NOT automatic
statutory disclosure/deletion. Its `/api/donations/data-rights` POST uses
a verified private receipt credential, bounded request types and status
responses; the staff queue is `/admin/donations/rights`.

- Leave `AMAANA_DONOR_RIGHTS_ENABLED` unset/false. Never set it true
  before database migration, Prisma regeneration and acceptance.
- After an approved database backup, apply the earlier
  `20261015000000_donor_recognition_consent` migration and then
  `20261015010000_donor_rights_requests` only in the intended
  environment; review and test the SQL first. Neither was applied
  by source commits.
- Verify synthetic donor receipt authentication and origin/rate/body
  limits, independent donation isolation, stale/duplicate submissions,
  staff `donation.reconcile` RBAC, audit creation, status updates and
  non-disclosure of contact/financial fields. Check other donation
  histories cannot be inferred from an email address.
- Obtain owner/qualified review of data retention, review routing,
  legal communications and closing criteria before activating. There
  is no automatic deletion, guaranteed response time, or all-donations
  export.
- Monitor the private staff review queue explicitly; no email/WhatsApp
  notification is created by this source change. A feature-disable
  rollback must not silently drop previously received requests.
- Run full exact-HEAD TypeScript, Prisma generate/validate, tests
  and E2E on staging with synthetic records before explicit approval.

## Donor Shukr recognition rollout (disabled by default)

The optional donor recognition workflow is **NOT a donation requirement**.
It uses donation receipt tokens for a separate opt-in request, requires staff
`donation.reconcile` moderation, and permits donor withdrawal. Existing
donor records have NULL recognition fields and must never be backfilled.

1. Keep `AMAANA_DONOR_RECOGNITION_ENABLED` unset or `false` in every
   environment until privacy/retention wording is reviewed and approved.
2. Before enabling, back up the database, inspect and apply the dedicated
   `20261015000000_donor_recognition_consent` migration to the intended
   environment, and regenerate Prisma types. Do not apply it merely by
   visiting the public page.
3. Verify receipt token authorization, cross-origin/size/rate controls,
   anonymity and refund exclusions, donor opt-in, staff-only moderation,
   concurrent withdrawal, and names-only public projection with a synthetic
   test donor in an isolated staging database.
4. Confirm the `/shukr` response is not cached, that a previously approved
   name disappears after revocation, and that a refunded/anonymous donation
   cannot reappear. Confirm direct-transfer donors have valid private
   receipts and that no consent fields are inferred from pre-existing data.
5. Only after explicit owner approval, enable the server-only feature flag.
   To disable immediately without removing a record, set the flag false.
   Never expose receipt credentials or original private donor fields in
   `/shukr`, analytics or logs.

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

1. Keep `amaana-rebuild-preview` as the staging/family-review service with Razorpay Test credentials only. Never place Live credentials on this service.
2. Prepare the distinct `amaana-platform` Railway service as the production target after the approved release is promoted to `main`.
3. Configure and validate production secrets from `.env.example`, including the separately generated Razorpay Live Key ID, Live Key Secret and Live webhook secret. Do not reuse Test secrets.
4. Back up the database.
5. Run `npx prisma migrate deploy` as a one-off release task.
6. Run `npm run seed:rbac` for the initial staff accounts and whenever new application permissions are introduced. Rotate initial passwords after first access.
7. Deploy the application container. Its startup command applies pending Prisma migrations before serving traffic.
8. Verify `/api/health/live` and `/api/health/ready`.
9. Open Admin → Media review and verify the public-media preflight. Do not publish uploaded campaign media until all readiness checks are green.
10. Verify the production Razorpay webhook is configured for `payment.captured`, `payment.failed`, and `refund.processed`.
11. Move `amaanafoundation.org` to the production service only after production variables, health checks, human launch gates and rollback readiness are complete.
12. Perform one explicitly approved low-value real donation and reconcile capture, webhook, acknowledgement, settlement visibility and refund behavior before opening normal live donations.

## Railway service and payment-environment separation

- `amaana-rebuild-preview` is the current staging/family-review service. It is attached to the family review URL and currently also serves `amaanafoundation.org` while launch work is incomplete. It must remain on `rzp_test_...` credentials and the Test webhook secret.
- `amaana-platform` is the separate Railway service sourced from `main` and is the intended production target. It must receive only production-approved variables and `rzp_live_...` credentials.
- The Razorpay Live API key and a separate Live webhook were generated/configured on 19 September 2026. Their secret values must remain outside Git and chat.
- A Live webhook pointed at `https://amaanafoundation.org/api/webhooks/razorpay` will not validate correctly while that hostname still routes to the staging service using the Test webhook secret. Therefore no real charge may be initiated before the deliberate domain cutover.
- Moving the official domain, changing production variables, enabling indexing and initiating a real charge are separate controlled launch actions and require explicit approval.

## Public media deployment preflight

Public campaign media and private assistance documents have different trust boundaries and must remain physically separated.

1. Create a dedicated public-media bucket. Set `PUBLIC_MEDIA_S3_BUCKET` to that bucket and **never** point it to the private `S3_BUCKET` used for assistance documents.
2. Configure `PUBLIC_MEDIA_S3_REGION` and `PUBLIC_MEDIA_S3_ENDPOINT` where the public-media provider differs from the private storage provider. When the same provider/account is used, the application may fall back to the `S3_*` region/endpoint and credentials, but the bucket itself must still be separate.
3. Set dedicated `MEDIA_S3_ACCESS_KEY_ID` / `MEDIA_S3_SECRET_ACCESS_KEY` when desired. Shared provider-account credentials are supported as a low-cost convenience; they do not remove the separate-bucket requirement.
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
- Razorpay account activation/KYC is approved. Test-mode capture and full-refund reconciliation were provider-verified on 19 September 2026. Separate Live credentials and a Live webhook now exist but are not installed on staging; they are reserved for the controlled production checkpoint.

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
- Amaana's 80G and 12A/12AB approvals are provisional. Never describe them as final or permanent. Any donor tax-certificate issuance workflow must follow the CA-approved operational/compliance process.
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
- [x] Razorpay account/KYC approval and website verification complete
- [x] Razorpay Test webhook configured; provider-backed capture and full-refund reconciliation completed
- [ ] Provider-backed `payment.failed` evidence completed or formally accepted as a documented Test Checkout limitation with automated route coverage
- [x] Separate Razorpay Live API credentials and Live webhook created and stored securely
- [ ] Live credentials installed only on the production `amaana-platform` service at the controlled cutover
- [ ] Explicitly approved low-value live donation captured, reconciled and refund-verified
- [ ] Notification worker configured and delivery tested
- [ ] Railway, Neon, storage/CDN and Resend usage alerts/limits configured
- [ ] Mobile, keyboard and screen-reader checks completed
- [ ] Domain, HTTPS, monitoring and alerting verified
- [ ] Google indexing enabled only after final content approval
