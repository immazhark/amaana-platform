# Story index published-cause projection fail-closed boundary — 12 November 2026 IST

**Scope:** public Stories discovery filtered programme labels only. At current main `6bd58c74252227dbce68ed35fa3d160f5f423078`, `publishedStoryProgrammeContext()` checks published parent initiative status and then dereferences `story.initiative.cause.status` unguarded. A malformed runtime projection with an absent nested cause can throw and disrupt public story listing even if the story itself is approved. This is a synthetic scenario, not an observed live null relation.

**RED-first:** synthetic cases added to `src/lib/story-discovery.test.ts` at `9b249a736bb5b843a0f86abd94191c41b19dfbd8`. An approved visible story with a missing nested initiative cause must remain in results; draft direct cause names stay excluded, while a separate approved direct cause may be used as the safe fallback. Hosted CI must first verify these cases fail at the original source before any source correction.

**Minimal GREEN scope:** one null-safe nested cause status check. No changes to user search, pagination, approved status logic, story copy, share links or media selection. No donor records, payment/UTR, tax, private media, auth/RBAC, schema, CSP, secrets, worker or infrastructure changes. Preserve existing public story approvals and privacy locks. The historical 149 classifications remain unchanged.

**Release:** full exact-head fast/database/browser/production/final CI, independent review, separate ready-state verification, protected expected-head merge; verify Railway merged SHA and public version/readiness separately. A narrow scoped revert is the rollback. Only one repository writer; parallel review/test jobs may run independently.
