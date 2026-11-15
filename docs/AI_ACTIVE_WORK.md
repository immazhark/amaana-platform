# Amaana implementation ownership — current checkpoint

**Updated:** 15 November 2026 IST. One writer, multiple bounded hosted test jobs. Historical evidence in reviewed PRs and `docs/AI_HANDOFF_LEDGER.md`.

**Writer:** `CHATGPT_ACTIVE` under owner's explicit continuing authority, one GitHub implementation writer only. Concurrent read-only reviews and CI can proceed; do not allow a second implementation writer.

**Protected source:** `main` at `b1a5b71872c201874a25c70d6a2b7dc632ac6e06` after AF-R066 PR #983. RED `43731128736`, full GREEN `43731243191`, separate ready `43734382955` and SHA-guarded merge all passed. Railway website deployment `56519fd5-b4f9-4200-84b0-3cdfab90c4d4` was DEPLOYING at last inspection; public exact runtime identity remains pending. Parked worker SKIPPED.

**Independent in-progress scopes, still one writer:**
- [PR #984](https://github.com/immazhark/amaana-platform/pull/984), AF-R078 read-only dated-doc HTML-anchor backlink guard. RED `43732739585`, corrected candidate integrated non-force with merged main at `c520bf6bd1ed536992a085ae60dacd3be50a8e05`. Fresh exact-head CI `43734553764` underway; not promoted or merged. No archive/deletion permission.
- **Current task branch:** `fix/af-r013-case-variant-admin-inventory-20261115` from verified `main` above, AF-R013 read-only admin edge route inventory. Case-variant `/ADMIN` and `/api/ADMIN` folders are not selected by the present lower-case route filter. Add synthetic failing inventory regression, make minimal fail-closed detection without touching auth/RBAC, Cloudflare WAF, public routing or live access. CI, review, separate ready-state gate and protected merge required. Do not claim actual WAF enforcement.

**Holds:** Finance #684/#845, Railway IaC #446 production apply, live data/schema/credentials/payment/notifications and identifiable public media. Maintain domestic INR, no FCRA, unresolved 80G status and provisional 12A/12AB wording.

**Original 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A. No item reclassification from isolated fixes.

**Next:** Verify green exact-head checks and independent release boundaries; reconcile coordination docs by retaining the other branch's history when source merges move main. Do not force-update or delete preserved refs.
