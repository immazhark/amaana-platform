# Amaana Foundation — current source and release state

**Checkpoint:** 15 November 2026 IST. Re-check GitHub and deployed health endpoints before new production claims; source SHA and runtime SHA are distinct.

| Boundary | Last verified observation |
|---|---|
| Protected source trunk | `main` at `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`, AF-R066 PR #983 protected expected-head merge |
| AF-R066 code/test acceptance | RED `43731128736`; GREEN full CI `43731243191`; separate ready-state verification `43734382955`; merged |
| Railway website deployment | `56519fd5-b4f9-4200-84b0-3cdfab90c4d4` BUILDING for `b1a5b71872c201874a25c70d6a2b7dc632ac6e06` at this checkpoint; prior SUCCESS `ffa8dcea-d24a-4783-b672-194390915840` |
| Independently live-verified public runtime | `83072e44e74c785f51f2b9213a3820fee7a34d8e`, branch `main`, environment `production`, readiness `ready` before the new rollout |
| Implementation writer | `CHATGPT_ACTIVE`, sole repository writer |
| Open implementation task | AF-R078 [PR #984](https://github.com/immazhark/amaana-platform/pull/984), read-only HTML-anchor backlink extraction, corrected candidate being reconciled to current main and requiring new exact-head acceptance |
| Financial and infrastructure holds | PRs #684/#845 held; issue #446 IaC preview/plan and separately approved apply pending; no live money/notifications/config changes |
| Canonical 149 classifications | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A = 149, unchanged |

**Proof and limits:** AF-R066 changed CSS literal notation to equal RGB values and extended existing pinned Stylelint coverage; this does not certify all CSS debt. AF-R078 adds a synthetic regression and read-only historical-document link extraction, not deletion approval or external-link inventory completeness. The parked notification worker did not deploy new code. No real donor records, payment provider activation, schema changes, secrets or publication of personal media.

**Next:** finish PR #984 exact-head full CI, separate ready-state verification and guarded merge; confirm new Railway deployment's exact source SHA and independent public version/ready before calling AF-R066 deployed/live. Preserve older branches and legal/privacy/finance gates. See [active writer](./AI_ACTIVE_WORK.md) and [handoff history](./AI_HANDOFF_LEDGER.md).
