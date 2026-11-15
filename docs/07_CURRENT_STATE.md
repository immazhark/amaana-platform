# Amaana Foundation — current source and release state

**Verified checkpoint:** 15 November 2026 IST. GitHub source, Railway deployment and public runtime require separate checks.

| Boundary | Observation |
|---|---|
| Protected main | `f45c963b8d17f2abe08beadaa5e50d44c7ed6709`, AF-R013 PR #985 guarded merge |
| Recent CI + merge | PR #985 RED `43734840150`, full CI `43738698646` GREEN, separate ready CI `43741550873` GREEN, 0 unresolved review threads, expected-head guarded squash merge |
| Prior accepted merges | AF-R078 PR #984 `69f7c7c43512c45eddcca4462f65f3a60fcf2d3b`; AF-R066 PR #983 `b1a5b71872c201874a25c70d6a2b7dc632ac6e06` |
| Railway website | SUCCESS deployment `56519fd5-b4f9-4200-84b0-3cdfab90c4d4` at AF-R066 SHA; scripts/docs-only PR #984 and #985 website/worker deployments SKIPPED |
| Independent public version/readiness | Last freshly verified public SHA `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`, branch main, environment production, ready; basic /compliance, /our-work, /stories smoke loaded |
| Active writer | `CHATGPT_ACTIVE`, one writer |
| Current task | AF-R012 [PR #986](https://github.com/immazhark/amaana-platform/pull/986), synthetic cross-role appeal actions test coverage; pre-reconciliation head `a02f135032056b4a54852d5c3309c068c87a6218`, full selected browser acceptance underway; integrated branch will need new exact-head CI |
| P0 infrastructure hold | Railway Config as Code #446 needs separate authenticated review/plan and separately scoped authorization for live apply |
| Other holds | Finance PRs #684/#845; no real money, RBAC modification, donor data, media identity exposure, secrets or notification activation |
| Canonical 149 | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A = 149 |

**Limits:** AF-R013 only secures a local route-proposal inventory; live WAF/Cloudflare enforcement remains unverified. AF-R012 is added synthetic regression coverage, not a runtime vulnerability fix. No source/runtime parity is implied when Railway marks a merge SKIPPED. Maintain public face redaction and metadata removal, India INR-only, no FCRA and unresolved tax status wording.

**Next:** Finish #986 exact-head selected tests, separate ready checks, guarded merge; verify Railway result. Keep active PR writer checkpoint and historical handoffs concise, never prune unreviewed refs.
