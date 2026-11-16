# Amaana Foundation — current source and release state

**Checkpoint: 16 November 2026 IST.** Single repository implementation writer: `CHATGPT_ACTIVE`. Source, Railway deployment and independent public runtime are distinct.

| Boundary | Verified result |
|---|---|
| Protected main source | `edfcc40b72aa4139165f83909a75aa5b5331f95f`, guarded squash merge #999 |
| Historic branch retirement | 95 pinned old refs independently absent after #991 (20), #997 (25), #998 (25) and #999 (25); merged task heads absent |
| Latest cleanup implementation | ninth reviewed batch, 25 live merged PR heads #816–#840, `chore/af-r079-reviewed-history-wave9-20261116`; no deletion counted before acceptance |
| #993 AF-R062 | `d127eb9dce4d94cc23fa56f6069269d6304f12f4`; fast/production/database green, browser in progress |
| #995 AF-R061 | `9fd1bfd53136b775b2a473156f60d3e793117602`; fast/production/database green, browser in progress |
| #1000 AF-R034 | `154d7be8a0a544308ed4307f1d3ac2bcb0f99c32`; draft, exact-head CI underway |
| #1001 AF-FIXTURE | `ccdec6cc54f260e66bd0a908e77da11af5c8cc70`; draft test-only nullable media-preview coverage, exact-head CI awaiting verification |
| Finance drafts | #684/#845 held, no activation |
| Railway/public runtime | Website SUCCESS `c481cdf7a2a3de429682c635a595c2ec8816e6c1`; #999 correctly SKIPPED; public version matched runtime and readiness returned ready |
| 149-item ledger | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A |

**Acceptance boundaries:** No arbitrary branch/document purge, unauthorised finance/auth/payment/schema/CSP/infrastructure change, forced deployment, outbound donor communication, or production migration. Domestic INR only; no FCRA; 12A/12AB provisional and 80G unresolved. Identifiable public faces require reviewed redaction and EXIF/GPS removal. Passing source/CI is not proof of production provider behavior or field Core Web Vitals.

**Next:** verify wave-nine full/ready checks, guarded merge and deletion outcomes; finalize each independent frontend PR on an exact clean head, reconcile remaining branches after any merge, and inspect Railway/public readiness after a deployed release. See [active work](./AI_ACTIVE_WORK.md), [149-item status](./mission-control/149-item-status-2026-11-15.csv), and [current retirement manifest](./mission-control/af-r079-approved-retirement-batch-20261115.json).
