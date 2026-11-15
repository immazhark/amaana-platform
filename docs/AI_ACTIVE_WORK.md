# Amaana implementation ownership — current checkpoint

**Updated:** 15 November 2026 IST. Current pointer only; detailed history remains in GitHub PRs and `docs/AI_HANDOFF_LEDGER.md`.

**Writer:** `CHATGPT_ACTIVE`. The owner explicitly directed ChatGPT to take implementation ownership in this session. One implementation writer only; other agents may perform read-only research/review, not competing repository writes.

**Protected base:** `main` at `f03f9a7df181e5451471d998da2a8f668a6cf47e` (PR #982 merged). Current task branch: `fix/af-r066-evidence-stylelint-20261115`, created from that exact SHA. No PR yet at this checkpoint.

**Atomic task:** AF-R066 — extend existing CSS token/duplicate-selector governance to `src/components/evidence-pathway.module.css` without redesigning the approved public component. Write a failing scope-and-color regression first; replace the one unchanged-color hex literal with the same RGB value, add the component to the pinned existing Stylelint command, then run focused/exact-head CI and open one draft PR. No new runtime dependencies.

**Previous task:** AF-R079 PR #982 is merged at `f03f9a7df181e5451471d998da2a8f668a6cf47e`. Do not repeat historical branch retirement or delete unreviewed refs. Review exact retirement-job evidence independently before claiming final census.

**Railway:** production website service online, latest SUCCESS deployment `ffa8dcea-d24a-4783-b672-194390915840`; earlier independently verified deployed SHA `83072e44e74c785f51f2b9213a3820fee7a34d8e`. Later out-of-watch source commits were SKIPPED. Public version/readiness were not freshly re-fetched during this task. Worker is parked; historical preview offline.

**Holds:** #684 UPI QR payment activation and #845 mixed-case synthetic appeal eligibility remain draft/finance-held; no changes to payment logic, RBAC, provider secrets, real donors, schema, infrastructure or notifications. Preserve approved brand and factual/privacy locks.

**Canonical 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A; no reclassification from this sub-scope without full acceptance.

**Next:** Prove RED test on the task branch, implement minimal GREEN, inspect CI on exact head, then follow draft-ready/separate-ready-state/protected SHA-guarded merge sequence only after all required checks and review. If a gate blocks, leave the draft and record the exact head/blocker.
