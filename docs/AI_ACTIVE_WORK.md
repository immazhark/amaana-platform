# Amaana Foundation — current implementation writer

**16 November 2026 IST — CHATGPT_ACTIVE.** One implementation writer. Owner retains authority; concurrent research and QA are read-only.

**Source main:** `8f21c4ea4cd826e0494b1e8b8618f0ca34a25b78`, protected squash merge of #991. #991 full exact-head CI `43761954665` and distinct ready run `43765182047` passed. Guarded historical-retirement workflow `43765237668` returned 20 RETIRED and independent name queries confirmed all 20 refs absent; #991's source branch was also absent. Railway recorded SKIPPED for the #991 source SHA on both watched services, not a deployment.

**Current atomic cleanup task:** AF-R079 sixth reviewed history wave on `chore/af-r079-reviewed-history-wave6-20261116`. The existing JSON manifest is replaced with **exactly 25** merged main-PR heads selected from #720–#755. Every selected branch was observed at its exact PR head SHA and the recorded merge SHA is an ancestor of main. Unmerged PRs #738–#740, #742–#743, #745–#747, #750 and #754 were excluded. PR #726 was excluded because the manifest's approved prefix allowlist omits `refactor/`; no guard was relaxed. The existing guarded executor must independently revalidate labels, open dependents, protections, ancestry, and exact refs before deleting anything. These 25 are candidates, NOT completed deletions. Full CI + separate ready-state + reviews + expected-head squash merge required.

**Parallel same-writer engineering PRs (no simultaneous writer):** #992 AF-R047 current head `fa4da1fcd7afbd3b37835e3918c346bdfff3fa61` on main above, exact-head full CI running; #993 AF-R062 `9263c89e5a468374ae4eb1977942fee47b96a3e9`; #994 AF-R066 `6348bc94c9d631cbd54723f785816f1b940d9895`; #995 AF-R061 `2182034ecde616cf015959af82110f06b7abb34a`; #996 AF-R069 `66482b23a30bf2c1c310b9dee39f84311207f17b`, confirmed hosted RED under `43764851066`, narrowed to a safe share UI after reviewing earlier #544 rule-scoping rationale; new exact-head GREEN CI running. No untested release merge.

**Runtime:** #991 SHA triggered correct Railway SKIPPED events; last independently verified production website runtime `75d61443d2955e04495f5b51a6cca996ddc573b7` with readiness ready. Runtime and source SHAs remain distinct. Do not force rollout. src/** tests can trigger deployment under current watches.

**Holds/locks:** financial drafts #684 and #845 remain HELD; no high-risk auth/payment/schema/secret/CSP behavior activation, migration, notification cron, public identifiable faces or donor outreach. Domestic INR only, no FCRA; 80G conflict unresolved, 12A/12AB provisional.

**Original 149 classifications:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A. Do not inflate for bounded scope.

**Next:** review sixth-wave manifest diff; run exact-head checks and separate ready-state before merge, then verify each retirement outcome. Independently accept and release #992; reconcile subsequent PR heads to updated main sequentially without force-push.
