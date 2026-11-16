# Amaana Foundation — current release state

**17 November 2026 IST — CHATGPT_ACTIVE.** Dated checkpoint; do not confuse source and deployed runtime.

| Boundary | Verified |
|---|---|
| Protected main | `96a62de3e99ce24168c09980a50a461f5f71f819` after #1022 SHA-guarded squash merge |
| #1022 full acceptance | Exact head `1bc9be30af3168b20e92bd3017df66036a0eb636`, full CI `43956024008` 7/7 SUCCESS; separate ready `43960428982` plan/promotion/verify SUCCESS |
| AF-R079 retirement | Workflow `43960534772` SUCCESS: 10/10 approved historical refs absent in independent census; #1022 task branch also retired via `43960534915` SUCCESS |
| Branch census | 678 refs after wave 14; intentionally preserved disallowed #686 `content/` branch; no blanket deletion |
| Current task | Wave-15 two-ref retirement manifest, branch `chore/af-r079-reviewed-retirement-wave15-20261117`. #698 and #699 independently matched merged PR head, merge ancestry and no retention labels; full CI, separate ready, guarded merge, post-run verification pending |
| Open finance holds | #684 and #845 remain unmerged; no payment activation |
| Public runtime | Last independently verified website `8be5c81ae2bda6ff1a489d3d3bcee122c3998b91`, ready. No current-wave live verification yet; scripts/docs may legitimately skip deployment |
| Original 149 | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable = **149** |

**Next:** Complete full exact-head CI on wave 15, then separate ready-state verification and expected-head guarded squash merge. Verify exact branches absent and Railway outcome. Never delete open, retained, protected, drifted or unmerged refs. Preserve factual/privacy/financial locks and the approved cream/blue/gold brand.
