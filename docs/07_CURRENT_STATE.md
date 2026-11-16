# Amaana Foundation — current release state

**16 November 2026 IST.** Only one implementation writer: `CHATGPT_ACTIVE`. This is a dated source/runtime checkpoint, not a live feed. Always verify GitHub/Railway before release.

| Boundary | Last verified state |
|---|---|
| Protected source `main` | `895696920eedbbde55421137e0f998e42a1617d8` (#1007 squash), after #1006 `2636473b4c23d057aee15861e0b87a77eb292770`; both exact-head and independent ready-state CI passed |
| Website deployment | Railway SUCCESS for `3efcc02e60f88b7ac9b86d83453cf0e62d55d00a`. Later out-of-watch #1006/#1007 website deployments correctly SKIPPED; no forced rollout |
| Public identity / readiness | Independently verified commit `3efcc02e60f88b7ac9b86d83453cf0e62d55d00a`; `/api/health/ready` status `ready` |
| Historical refs | #1006 guarded workflow completed SUCCESS; 25/25 of its manifest heads absent, both recent task branches absent. Remote inventory 763 existing branches immediately before batch-11 task branch. Prior history is not automatically a safe deletion list |
| Active task | `chore/af-r079-reviewed-history-wave11-20261116`: 25 separately ancestry-verified, SHA-pinned merged public/UI/QA refs from PRs #605–#633. Existing manifest replaced; no batch-11 deletion counted before guarded workflow completes and independent census |
| Open held PRs | #684 reviewed UPI fallback and #845 staging marker/payment eligibility; preserve and do not activate without separately scoped approval |
| 149-item master | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable = **149**; no change from cleanup |

**Safety and interpretation:** source, tested, merged, Railway deployed, live-verified and full provider/manual acceptance are distinct. Domestic INR only, no FCRA; 12A/12AB provisional; 80G pending/provisional conflict unresolved. All public identifiable faces require redaction and EXIF/GPS removal. No production migration, notification/cron activation, sensitive payment/webhook/schema/CSP/RBAC change, or donor outreach without a reviewed scope and separate authorization.

**Next:** complete batch-11 exact-head tests, independent ready-state gates, protected SHA-guarded merge and live branch-retirement verification. Select the next unblocked source fix without starting a second competing implementation writer. Canonical records: [active writer](./AI_ACTIVE_WORK.md), [master 149](./mission-control/149-item-status-2026-11-15.csv), [guarded manifest](./mission-control/af-r079-approved-retirement-batch-20261115.json).
