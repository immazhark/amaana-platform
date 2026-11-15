# Amaana Foundation — active implementation ownership

**16 November 2026 IST.** Sole repo implementation writer: `CHATGPT_ACTIVE`. Independent read-only analyses/hosted CI may run concurrently.

**Protected source:** `main` `56e926dee8e776df9507b92f6b2445ce4ed8c62b`, after [PR #988](https://github.com/immazhark/amaana-platform/pull/988) accepted via full exact-head CI `43744356382`, separate ready-state CI `43748038625` and expected-head protected merge. Previous #987 protected merge `d77b1c40110ab12c2492304c184c61f988823e91`.

**Current task:** AF-R024 static font-floor audit [PR #990](https://github.com/immazhark/amaana-platform/pull/990), `fix/af-r024-nested-min-additive-chain-20261115`. RED `43744521856`, fixed min(calc()) same-unit arithmetic, corrected positive fixtures. Original head `f34cf6cf2982a0aeb103c2f9c00537210b7858f1` has full green `43744795563`. Normal non-force two-parent integration with merged main above means **fresh full exact-head CI is required**, followed by separate ready-state, zero unresolved reviews, expected-SHA protected merge. Static script only; actual public CSS, accessibility/browser zoom and deployed code unchanged by the intended diff.

**Other pending:** AF-R012 synthetic cross-role appeal action tests [PR #986](https://github.com/immazhark/amaana-platform/pull/986) original integrated head `c53a9a102f3e543d45114a8e3accfb22d0243127`; AF-R079 exact-SHA 25-head retirement manifest [PR #989](https://github.com/immazhark/amaana-platform/pull/989) original head `cf791670eed45aff63a509ea066e9fa97c598a97`. Both need reconciliation to new main before protected merge. Financial #684/#845 and live Railway IaC #446 remain held.

**Railway:** website last independently public-verified SHA `b1a5b71872c201874a25c70d6a2b7dc632ac6e06` ready; scripts-only merges SKIPPED, not failed. Worker parked; no forced production rollout.

**Hard limits:** no real payment/refund, financial routing, RBAC activation, live secrets or schema/data migration, cron/messages, public identifiable face. Domestic INR only, no FCRA, unresolved 80G, provisional 12A/12AB.

**Original 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A (unchanged). Do not inflate sub-scopes to complete items.

**Next:** finish #990 and the other independently tracked PRs' exact-head checks/ready/guarded merges. Capture Railway outcomes and protected source SHA separately.
