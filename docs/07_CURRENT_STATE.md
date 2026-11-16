# Amaana Foundation — current release state

**17 November 2026 IST — CLAUDE_CODE_ACTIVE (single writer, one owner-authorized session).** Dated checkpoint, not a live feed. Incoming writer must independently check GitHub, Railway and public endpoints.

| Boundary | Last verified evidence |
|---|---|
| Protected source `main` | `2e222d876e62c0d196bb55562258ae1ce5877e98` after docs-only handoff #1017 (full CI `43932068073`, ready-state `43937723528`), protected |
| #1014 guarded cleanup | Wave 13: full exact-head `43910196497` and distinct ready-state `43914652760` SUCCESS, merged `eab2d44d5ce1b83f60476aa3dbe142156e4cac3b`; retirement `43914765982` SUCCESS, all 25 historical refs and task branch independently absent |
| #1015 open draft | AF-R024 CSS scanner `fix/af-r024-clamp-additive-font-floor-20261116`, reconciled non-force with main `2e222d876e62c0d196bb55562258ae1ce5877e98` (prior head `e55183c3bfead98e7373a1edfc9bba5f85ce8c32` full CI `43915060143` 7/7 SUCCESS); fresh exact-head CI, separate ready-state and merge pending |
| #1016 open draft | AF-R012 async auth static inventory `test/af-r012-unawaited-permission-guard-20261116`, head `74ce306c42be20cacc45778138e9dd3d9ffd196f`, full CI `43915598906` **7/7 SUCCESS**; separate ready-state and merge not done; reconcile after #1015 moves main |
| Held PRs | #684 official UPI QR receiving/settlement; #845 financial eligibility: unmerged, separate financial gates |
| Production website | Uncached `/api/health/version`: `edcaf99ff21733c37937e8c326624e8e41a14267`, main/production, paymentMode live; `/api/health/ready`: ready |
| Railway latest | Website `81f2dc93-0477-44d5-9f0a-287876d49926` SKIPPED for `eab2d44d5ce1b83f60476aa3dbe142156e4cac3b` (out-of-watch docs); no forced rollout |
| Master 149 | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable |

**Next executable:** Claude Code finishes existing #1015 first under full/ready/expected-SHA gates, then reconciles and completes #1016. Continue new unblocked scoped work only after these source boundaries are safe. Avoid duplicating shipped changes.

**Safety:** Preserve domestic INR/no FCRA; provisional 12A/12AB, unresolved 80G; redact all identifiable public donor/beneficiary faces and strip EXIF/GPS. Do not force-push, delete historical protected/retained/unreviewed refs, weaken CI, publish unsupported impact/medical claims, activate notifications/cron or run live financial/infrastructure/database operations without separate reviewed authorization.
