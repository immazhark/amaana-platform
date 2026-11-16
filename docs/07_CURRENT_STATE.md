# Amaana Foundation — current release state

**17 November 2026 IST — CHATGPT_ACTIVE after owner-confirmed Claude Code usage exhaustion.** Source and runtime are separate; this is a dated checkpoint. Refresh GitHub/CI/Railway/public verification before each release.

| Boundary | Latest verified evidence |
|---|---|
| Protected main source | `8b2bed92ef2649fc0d25f0e87b0099de69b11247` after Claude Code #1015 AF-R024 guarded squash merge |
| #1015 | Merged source `8b2bed92ef2649fc0d25f0e87b0099de69b11247`; full CI `43937946004`, ready-state `43943227518` success; branch retirement workflow `43943573431` success |
| Current #1016 | Existing branch `test/af-r012-unawaited-permission-guard-20261116`, previous head `ca12fd8155e46b9585c694c6c68631255f509999`, full CI `43943641280` and separate ready-state `43947721233` success; head changes with ownership claim mean **fresh CI/ready required** before protected merge |
| Other UI/UX PRs | #1018 homepage highlights `ac3a7f4d92b0cc75463b9b5fce4574d50d45bda6` ready; #1019 header-logo `f106d591ed2eff320255c3304d45c75fe8dc644c` draft/browser pending; #1020 streamed-footer `badd5b193d81eadc6472da0a7e043f9ef94e7272` draft/full CI green. Each still requires current-base reconciliation and independent gates |
| Held PRs | #684 domestic UPI QR, #845 staging financial/privacy eligibility: no merge without scoped financial/provider authorization |
| Railway latest | Website `bfca680d-2dbf-48da-a82d-b0c20f7b6057`, SKIPPED for `8b2bed92ef2649fc0d25f0e87b0099de69b11247` because docs/scripts path outside watcher |
| Public runtime | Uncached `/api/health/version` `edcaf99ff21733c37937e8c326624e8e41a14267` main/production, `/api/health/ready` ready |
| 149 classifications | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable = 149 |

**Next:** complete existing #1016 under fresh full CI and distinct ready-state, SHA-guarded squash merge; reconcile one tested low-risk UI PR at a time without force, verify browser/database/production and actual Railway outcome. Protect source, financial and publication/privacy locks. Do not force source/runtime SHA parity.
