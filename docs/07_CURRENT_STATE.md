# Amaana Foundation — current source and release state

**Checkpoint:** 15 November 2026 IST. Refresh GitHub, Railway and public endpoints before any new release. Keep this as one compact current-state document; historical decisions and CI evidence remain in Git/PR history.

| Boundary | Last independently checked state |
|---|---|
| Protected source trunk | `main` at `b68936e012641976605e3ce74f338ad0f0e32008` (merged AF-R079 PR #981) |
| Last successful website deployment | Railway `ffa8dcea-d24a-4783-b672-194390915840`, deployed SHA `83072e44e74c785f51f2b9213a3820fee7a34d8e` |
| Public version and readiness | Fresh `/api/health/version`: commit `83072e44e74c785f51f2b9213a3820fee7a34d8e`, branch `main`, environment `production`; `/api/health/ready`: `ready` |
| Source/runtime SHA difference | #979 and #981 were correctly Railway `SKIPPED` (out-of-watch script/docs paths). Do not force a deploy to align hashes |
| Current implementation writer | `CHATGPT_ACTIVE`, working only on [PR #982](https://github.com/immazhark/amaana-platform/pull/982) |
| Branch inventory | 1,004 before cleanup; 983 after first pilot; **957 after second pilot**, before temporary third-wave task branch |
| Previous retirement results | 20 + 25 historical heads retired by guarded jobs, plus eligible merged PR source heads. No force-push or indiscriminate deletion |
| Current cleanup candidate | PR #982, next 25 exact merged PR heads pinned in existing `docs/mission-control/af-r079-approved-retirement-batch-20261115.json`, unmerged and not deleted as of this checkpoint |

**Release queue:** PR #982 requires full selected exact-head plan/fast/database/production/browser/verify, promotion after ready-state, zero unresolved reviews and protected expected-head merge. PR #979 and the earlier #974/#975/#977 are merged. Finance-held #684/#845 remain isolated; historical `phase-public-site-rebuild` and unreviewed refs remain preserved.

**Backlog denominator (unchanged):** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A = **149**. Task-branch retirement and isolated test fixes do not promote full original items.

**Hard locks:** Domestic INR only, no FCRA; 80G conflict unresolved; 12A/12AB wording provisional pending qualified evidence; public identifiable faces require reviewed redaction and EXIF/GPS removal. Never touch real donors, secret values, live payments, notifications, schema migrations or infrastructure without separately scoped authorization. Preserve official logo, cream/blue/gold styling, server safeguards and strict TypeScript.

**Next action:** Recheck #982 head, CI and review; if fully green, promote, verify separate ready run, SHA-guarded merge, and inspect actual retirement job logs and post-merge ref count. Do not create per-PR documentation snapshots. [Active ownership](./AI_ACTIVE_WORK.md); [historical handoffs](./AI_HANDOFF_LEDGER.md).
