# Amaana implementation ownership — current checkpoint

**Updated:** 15 November 2026 IST. One replaceable source-of-truth pointer; historical evidence belongs in GitHub PRs and `docs/AI_HANDOFF_LEDGER.md`.

**Writer:** `CHATGPT_ACTIVE` (single repository implementation writer under the owner's continuing instruction). Concurrent research and hosted checks may be read-only; no competing implementation writer.

**Protected source:** `main` merged AF-R066 [PR #983](https://github.com/immazhark/amaana-platform/pull/983) at `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`. Its RED run `43731128736`, full exact-head CI `43731243191` and distinct ready-state run `43734382955` were inspected and passed before expected-head guarded merge; no full 149-item reclassification. The new website Railway deployment `56519fd5-b4f9-4200-84b0-3cdfab90c4d4` was BUILDING when last inspected, not yet independently live-verified.

**Current atomic task:** AF-R078 read-only historical-document backlink accuracy, [PR #984](https://github.com/immazhark/amaana-platform/pull/984), branch `fix/af-r078-html-backlink-inventory-20261115`. Synthetic HTML-anchor test RED at head `a6d47754b562d7604e74599ecd2f205485a19d02` (run `43732739585`, one expected failure); corrected pre-reconciliation head `b3f176320e1054f72c9ba925db9be1a73e793344` passed the focused regression and fast checks. This branch contains no file deletion, retention approval, application route or financial change. A two-parent non-force integration commit retains both this head and latest main while resolving the competing ownership checkpoint; require full exact-head CI on the resulting head, separate ready-state verification, review, SHA-guarded merge.

**Runtime identity:** Last independently fresh public SHA `83072e44e74c785f51f2b9213a3820fee7a34d8e`, branch main, ready. New Railway website rollout is a separate boundary; do not claim it live until deployment SUCCESS and fresh public version/readiness match the merged commit. The parked notification worker's irrelevant commit was correctly SKIPPED; historical preview remains offline.

**Hard holds:** Draft finance PRs #684 and #845, Railway IaC production apply #446, live donor communications, real money, secret changes, schema/data migrations and public identity-media are outside this task. Maintain domestic INR, FCRA, legal/tax provisional wording and face-redaction requirements.

**Canonical 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A (unchanged). AF-R078 remains Partial until historical retention acceptance and live/external references are reviewed.

**Next executable step:** inspect exact reconciled #984 head CI, reviews and current main; if all selected checks pass, promote and verify separate ready-state run, expected-SHA guarded merge, verify Railway SKIPPED vs BUILD semantics and refresh public identity. Preserve all archived/historical branch refs until independently certified.
