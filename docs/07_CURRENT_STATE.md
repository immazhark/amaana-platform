# Amaana Foundation — source and release boundary

**15 November 2026 IST.** Protected `main` currently `d77b1c40110ab12c2492304c184c61f988823e91`. AF-R005 PR #987 merged after RED `43741783095`, complete exact-head GREEN `43741890034` and separate ready-state `43744197664`; new guard rejects six compact `NEXT_PUBLIC_` private credential alias classes. This was a source-level preventative fix; no actual secret leak or rotation was claimed.

**Earlier protected merges:** AF-R013 #985 `f45c963b8d17f2abe08beadaa5e50d44c7ed6709` and AF-R078 #984 `69f7c7c43512c45eddcca4462f65f3a60fcf2d3b`, both script/docs source-only.

**Website last independently verified production:** Railway deployment `56519fd5-b4f9-4200-84b0-3cdfab90c4d4` SUCCESS for source `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`. Public /api/health/version returned this exact SHA and /api/health/ready returned ready on 15 November. Subsequent script/docs commits can be Railway SKIPPED; source and runtime SHAs are not interchangeable.

**Current sole writer:** `CHATGPT_ACTIVE`. Current AF-R012 synthetic appeal cross-role tests [PR #986](https://github.com/immazhark/amaana-platform/pull/986) integrates latest main; must finish fresh exact-head CI, distinct ready-state and guarded merge. AF-R078 #988 and AF-R079 #989 are separate draft lanes awaiting acceptance and potential main integration. The former cannot authorize any historical file deletion; the latter has a reviewed manifest but no branch deletion is claimed before guarded workflow results.

**Financial/infrastructure holds:** #684 official QR and #845 donation synthetic staging still require separately scoped release review, #446 Railway IaC live apply held. No actual payment or donor production data exercised. INR domestic only, no FCRA; tax and identifiable-media constraints preserved.

**149 backlog unchanged:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A. Bounded test/guard sub-scopes do not close complete parent items.

**Next:** Green CI for integrated #986, separate promotion, guarded merge; Railway deployment observation and independent public identity if deployment happens. Review #988/#989 checks without suppressing browser acceptance.
