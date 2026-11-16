# Amaana Foundation — current source and release state

**Checkpoint: 16 November 2026 IST.** One implementation writer `CHATGPT_ACTIVE`. Source, Railway deployment and public runtime are separate acceptance boundaries.

| Boundary | Verified state |
|---|---|
| Protected main | `6d902591b947703df3e07e5813ae4d21681e44de` after exact-head, ready-state, SHA-guarded merge #995 |
| #995 AF-R061 | Merged, Railway website SUCCESS, independent public version exact `6d902591b947703df3e07e5813ae4d21681e44de`, ready |
| #993 AF-R062 | Merged `7f6fb5ed344861fb7ef5b76c7af5c1e58ec2592e`, previous source and runtime accepted |
| Historical retirement | 95 verified absent after #991 (20), #997 (25), #998 (25), #999 (25); merged cleanup task branches absent |
| Ninth cleanup wave | PR #1002, existing manifest of 25 individually checked merged heads #816–#840; **not yet deleted** |
| #1000 AF-R034 | `272f78046eb35ba86683983162eb02d1f105f041`, Contact channel fix, fresh exact-head CI |
| #1001 AF-FIXTURE | `3f012b5e5c1f4afe1e1e98b4cecf96cad0e23dec`, nullable preview synthetic fixture corrected after RED test, fresh CI |
| #1003 AF-N24 | `f7e7a97c48ec647f930c725b29479b37b5d3da24`, isolated acknowledgement disposal coverage, fresh CI |
| Finance/privacy review | #684/#845 held |
| Master 149-item ledger | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A |

The production health response establishes SHA and readiness, not payment-provider behavior, protected financial cases, field Web Vitals or physical accessibility. No FCRA registration; domestic INR only. 12A/12AB provisional; unresolved 80G conflict. Identifiable public faces require reviewed redaction and EXIF/GPS removal. Do not force a rollout for source/runtime SHA parity.

**Next executable task:** complete #1002 full and distinct ready-state gates; merge with expected head SHA; verify guarded historical retirement results. Finish independently tested #1000, #1001 and #1003, keep one branch per issue, update current source after merges. Canonical evidence: [active writer](./AI_ACTIVE_WORK.md), [149-item ledger](./mission-control/149-item-status-2026-11-15.csv), [guarded manifest](./mission-control/af-r079-approved-retirement-batch-20261115.json).
