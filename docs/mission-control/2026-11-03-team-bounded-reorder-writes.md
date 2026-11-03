# Bounded team reordering database writes — 3 November 2026 IST

## Defect and acceptance
Team member and group reorder actions query an ordered sibling set and rewrite every sibling's `sortOrder` on a single adjacent up/down move. This causes O(n) row updates and unnecessary `updatedAt` changes. Expected: for a pair with exclusive distinct ordering values, update the two affected rows only; retain deterministic full reindex when values tie anywhere in the ordered list, since a swap of shared values can move unrelated rows. Preserve the current permission, serializable transaction retry, audit and redirect boundaries.

## Test-first evidence
Branch `perf/team-reorder-bounded-writes-20261103`, protected main `cd94a21c012ed6afca09f68d0e5017bd976405d0`. RED-first test commit `e070290581e59b390b8a65cc5ba21fa245592a7e`, hosted CI `41658192721`: both unique-position five-row assertions failed (five writes, expected two), while the duplicate-adjacent, non-adjacent tie and edge no-op tests passed. All other 2,599 tests passed; 20 isolated DB tests skipped. This reproduces actual source write amplification, not a payment or privacy exposure.

## Correction and safeguards
Source commit `06f31877e0b5142b4e9b095dc9eb94002af1a779`: one internal plan helper constructs two updates only when selected and neighboring order values are exclusive in their ordered list; otherwise swaps the IDs and normalizes the entire list in increments of ten as before. Both actions read id plus sortOrder and apply plan inside their existing serializable transaction. This does not claim constant-time reads: sibling inventory remains O(n), ordinary writes fall from n to 2. No database migration, auth/RBAC, public media, donations, cron or live infrastructure modification.

## Release boundary
Initial corrected hosted CI `41658754630` and final exact-head full CI/independent review/separate ready-state/protected guarded merge remain gates. The changed runtime actions reside under `src/**` and can trigger Railway website deployment. Independently verify any deployed runtime and readiness. Rollback: revert source/test change through normal guarded PR. This is a targeted technical-debt correction, not closure or a count change to the historic 149.
