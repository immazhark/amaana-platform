# Amaana implementation ownership — current checkpoint

**Date:** 15 November 2026 IST. Current pointer, not historical log.

**Sole repo writer:** `CHATGPT_ACTIVE`. Read-only audits and independent hosted checks may operate concurrently. Do not permit competing implementation writes.

**Protected source:** `main` at `f45c963b8d17f2abe08beadaa5e50d44c7ed6709` after AF-R013 [PR #985](https://github.com/immazhark/amaana-platform/pull/985) guarded squash merge. Its RED `43734840150`, full GREEN `43738698646`, separate ready GREEN `43741550873` passed. Four synthetically case-varied admin paths are detected by the local read-only edge inventory; no WAF rule or auth behavior was activated. Railway website and parked worker correctly `SKIPPED` the script/CI/doc-only merge.

**Current bounded work:** AF-R012 cross-role admin appeal test [PR #986](https://github.com/immazhark/amaana-platform/pull/986) on `test/af-r012-appeal-cross-role-20261115`. Initial full candidate head `a02f135032056b4a54852d5c3309c068c87a6218` green fast, database and production, browser running at last observation; no readiness promotion. One sole-writer two-parent integration commit reconciles its code with `main` above and refreshes this pointer; fresh exact-head CI and distinct ready-state run then protected expected-head merge required. Only synthetic tests against existing auth/action logic; no production RBAC change, no donor records or money.

**Prior public release:** AF-R066 #983 merged `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`; Railway website deployment `56519fd5-b4f9-4200-84b0-3cdfab90c4d4` SUCCESS and independently public `/api/health/version` matched this SHA, `/api/health/ready` ready. AF-R078 #984 and AF-R013 #985 were scripts/docs and correctly SKIPPED after their merges; deployed and source SHA may differ.

**Hard holds:** Finance-held #684/#845, Railway IaC issue #446 live apply, all real payments/refunds, secret changes, production schema/backfills, notification activation, external donor messaging, identifiable public media. Preserve INR-only, no FCRA, provisional 12A/12AB and unresolved 80G.

**Original 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable. No completion inflation from scoped coverage.

**Next:** Run exact-head CI for reconciled #986 and review results, promote only after full selected acceptance, verify distinct ready check, merge with pinned expected SHA. Inspect Railway and public identity separately; do not force deployment to align SHAs.
