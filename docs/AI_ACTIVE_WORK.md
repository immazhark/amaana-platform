# Amaana implementation ownership — current checkpoint

**15 November 2026 IST · Sole implementation writer: `CHATGPT_ACTIVE`.** Read-only agents and hosted CI may run concurrently. No second repository implementation writer.

**Protected main:** `d77b1c40110ab12c2492304c184c61f988823e91` after AF-R005 PR #987. Hosted fail-first RED `43741783095`, GREEN exact-head `43741890034`, separate ready-state `43744197664` all verified; protected expected-head guarded squash merge. AF-R013 #985 merged earlier at `f45c963b8d17f2abe08beadaa5e50d44c7ed6709`. Source SHA and website deployment SHA differ when Railway correctly SKIPs scripts/docs changes.

**Current bounded implementation task:** AF-R012 [PR #986](https://github.com/immazhark/amaana-platform/pull/986), `test/af-r012-appeal-cross-role-20261115`. Added synthetic wrong-role and positive-control appeal action tests against **existing behavior**, no production auth/RBAC changes. Earlier head `edc0e820b7317e405baa456c9144162321bb0d11` had fast, database and production SUCCESS, browser incomplete. This task branch now integrates `main` through a normal two-parent commit; new exact-head selected CI, separate ready-state, zero unresolved reviews and protected expected-head SHA merge required. src/** test-only may trigger Railway deployment; verify actual rollout after merge.

**Independent work queued under same sole writer:** AF-R078 [PR #988](https://github.com/immazhark/amaana-platform/pull/988), read-only inventory of unquoted HTML links (RED `43742054677`; GREEN head `b16af9dc4dd0b6c4d6d9e8c9b9e03118413fb713`), and AF-R079 [PR #989](https://github.com/immazhark/amaana-platform/pull/989), reviewed wave of 25 exact-SHA merged ref retirement manifest (head `58e6aef569d9ebfc4c7000d20aaa0c85a407dec1`). Both remain drafts pending full acceptance, and require main reconciliation if it moves.

**Railway/public:** Website last independent confirmed deployed SHA `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`, /api/health/ready ready. Parked notification worker unchanged; do not force rollout merely to equalize source/runtime.

**Hard holds:** finance #684/#845, Railway IaC #446 production apply, real payments/refunds/notifications, secrets/schema/data changes, public identifiable faces, disputed 80G, provisional 12A/12AB, no FCRA; INR only.

**Original 149 totals unchanged:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A.

**Next:** Finish #986 new-head acceptance, ready-state and protected guarded merge; inspect Railway/public. Keep backlog progress evidence scoped, do not inflate total closure.
