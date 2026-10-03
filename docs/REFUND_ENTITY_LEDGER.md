# Durable refund identity

One Razorpay refund ID may affect financial totals once, independent of event IDs.
RefundLedger is the durable identity record; PaymentEvent remains the privacy-safe
delivery audit. The ledger claim, event, donation/appeal changes and notification
commit together in the existing serializable retry transaction.

Distinct concurrent deliveries use the database primary key and createMany with
skipDuplicates. A replay must match the stored payment, donation, amount and INR
currency before being acknowledged. Different refund IDs still apply separately.
Malformed refund identities return 400; unmatched donations and identity conflicts
are not acknowledged as successfully accounted and require reconciliation.

## Upgrade and rollback

The additive migration backfills associated refund.processed events from both
sanitized and original payload shapes. Duplicate matching identities collapse to
one ledger entry. Missing/conflicting identities abort the transaction for review.
Existing donation/appeal totals and notification history are never rewritten.
Previously duplicated accounting, if any, requires operator reconciliation against
provider records; this change must not be used to claim old totals were audited.

Before a production migration (separately approval-gated), pause/drain webhook
writers and verify backup/reconciliation evidence. Deploy the migration and new
writer together, then resume ingestion. Do not run old refund writers concurrently
with this upgrade: they do not consult the ledger. A code rollback must retain the
new refund handler or pause ingestion. Never drop the ledger to roll back code.

Staging has no live-payment authorization. Railway applies migrations before the
new application starts. Production promotion, real refunds and accounting repairs
remain prohibited without explicit approval.

The ledger contains only provider IDs and monetary identity, not donor PII. Do not
prune it with ephemeral logs. Donation deletion is restricted by the ledger FK.

## Verification

- Route unit tests: entity replay/conflict, malformed identity, unknown donation,
  event collision races, signature rejection and existing amount validation.
- Opt-in loopback-only PostgreSQL suite: same/different entity concurrency,
  event replay, failed-transaction retry, out-of-order capture/refund, unique PK.
- PostgreSQL upgrade fixtures: both historic payload formats, duplicate backfill,
  incomplete/conflicting records fail closed with transactional rollback.

