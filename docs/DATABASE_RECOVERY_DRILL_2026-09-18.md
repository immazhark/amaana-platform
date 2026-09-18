# Database Recovery Drill — 2026-09-18

## Scope

Staging/rehearsal database only. This record does not authorize production cutover, a merge to `main`, live payment activity, indexing changes, or beneficiary-data mutation.

## Snapshot evidence

- Neon project: `amaana-platform-staging`
- Source branch at snapshot time: primary/default staging database branch
- Snapshot: `amaana-pre-rehearsal-2026-09-18`
- Snapshot id: `snap-blue-unit-b3rt8psa`
- Created: 2026-09-18T01:09:55Z
- Retained until: 2026-10-18T00:00:00Z

## Restore verification

A restore from the snapshot was executed and the restored database reached `ready`.

The restore command's default behavior for a newly created branch finalized the restore immediately. The runbook has therefore been corrected to require `finalize: false` for future isolated restore drills.

No application-data loss was detected. The restored database and the preserved original branch matched on:

- row counts and latest update timestamps for Appeal, Donation, AssistanceRequest, MediaAsset, User, AuditEvent and Notification;
- exact content digests for Appeal, Donation, AssistanceRequest, MediaAsset, User and `_prisma_migrations`.

This is sufficient evidence that the snapshot was recoverable at the time of the rehearsal. The separate application deployment rollback gate remains open until Railway rollback/recovery is rehearsed and verified.
