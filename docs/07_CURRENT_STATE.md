# Amaana Foundation — current source and release state

**Checkpoint:** 15 November 2026 IST. Source, Railway deployment and public runtime are distinct verification boundaries.

| Boundary | Last verified observation |
|---|---|
| Protected source trunk | `main` merged AF-R078 PR #984 at `69f7c7c43512c45eddcca4462f65f3a60fcf2d3b`; full exact-head CI `43734553764` and separate ready-state `43738571009` passed |
| AF-R066 source release | PR #983 merged `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`; full CI `43731243191` and separate ready-state `43734382955` passed |
| Railway deployed website | `56519fd5-b4f9-4200-84b0-3cdfab90c4d4` SUCCESS for `b1a5b71872c201874a25c70d6a2b7dc632ac6e06` |
| Independently live-verified website | Public `/api/health/version`: `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`, branch `main`, environment `production`; `/api/health/ready`: `ready`; fresh public /compliance, /our-work, /stories content loaded |
| AF-R078 merge rollout | Railway website and worker both SKIPPED for docs/script-only source `69f7c7c43512c45eddcca4462f65f3a60fcf2d3b`; do not force a rollout to equalize SHAs |
| Sole implementation writer | `CHATGPT_ACTIVE`; one writer, no parallel repository implementation |
| Current task | AF-R013 [PR #985](https://github.com/immazhark/amaana-platform/pull/985), synthetic admin route casing regression; RED `43734840150`; GREEN full CI `43734967338` for pre-integration head `d70fc7029bccbafdfce211392b51ae80e1d5f35b`; new integrated head awaiting exact-head CI |
| Finance/infrastructure holds | PRs #684 and #845, issue #446 live Railway IaC apply, all payment/auth/secret/data/notification activation |
| Canonical 149 classifications | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A = 149, unchanged |

**Limits:** AF-R078 identifies HTML backlinks in static local Markdown files; it does not approve deleting or archiving any historical document. AF-R013 improves local planning audit; actual Cloudflare enforcement and recovery are separately scoped. Current live payment mode is provider-controlled; no real funds were tested. The parked notification worker remains unchanged and historical preview remains offline. Finance, legal, religious and public-media privacy constraints remain binding.

**Next:** finish #985 integrated-head full CI, distinct ready-state run, review and protected expected-head merge, then verify Railway outcome. Keep older archived references and identity-media constraints; do not inflate full backlog completion from test-only sub-scopes. See [active coordination](./AI_ACTIVE_WORK.md) and [handoff history](./AI_HANDOFF_LEDGER.md).
