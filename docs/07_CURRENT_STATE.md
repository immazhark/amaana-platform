# Amaana current state — 11 November 2026 IST

**Current sole implementation writer: CHATGPT_ACTIVE.** Owner explicitly confirmed Codex stopped and transferred responsibility. The former CODEX_ACTIVE checkpoint below is historical, not active.

**Verified protected source main before this task:** `c48dc48fe4d4e3eedc35f101ea765a5c3b714e1e`, guarded merge of #755. #755 tested head `bd75862833ca2064675be333ac4bf09920b6289e`; full exact-head CI `42895470277` all jobs succeeded, separate ready-state CI `42983481414` plan/readiness/verify succeeded. #754 closed superseded after exact scanner and test blob preservation; historical branch retained. #753 previously merged `df956b1a5ce16a465503f6d19c57ac1bb0d37c81`; #756 coordination/external adoption review merged `4172a02756182cce70348cdf5fe1177bb016f48f`.

**Railway production:** #755 website deployment `9ede88d2-a220-42d8-9097-511c8049a556` SKIPPED, as were #753/#756; latest observed website SUCCESS deployment `aeccc2f8-eb93-4ba4-8da7-3445e89df5c6` at runtime source `03667a783ac1f42db4f880f29a6b864421c4e6ec`. SKIPPED is expected for changes outside watched paths, not a failed release. Public runtime version and readiness not independently verified. Do not force a rollout for SHA equality.

**Current work:** AF-R077 on `fix/web-vitals-exact-document-attribution-20261111`, base `c48dc48fe4d4e3eedc35f101ea765a5c3b714e1e`, draft PR #757. Reproduced initial normalized public slug route incorrectly admitting a different raw document pathname for Web Vitals recording; synthetic RED returned true rather than required false. Narrow source fix keeps the anonymous analytics bucket but requires current pathname to equal original raw pathname; Vitest regressions added. Local isolated Node/TypeScript recreation green; hosted exact-head CI and independent review pending. Same-path leave-and-return navigation lifecycle remains a separate unverified case. No auth, payment, data, external provider, schema, secret, or infrastructure changes. #684 domestic QR payment-destination activation remains draft/held until independent bank/payee/routing evidence plus scoped approval. Historical 149 classifications unchanged.

---

## Preserved prior Codex checkpoint

# Amaana implementation ownership — 11 November 2026 IST

State: CODEX_ACTIVE. Owner Mohammed Mazhar Khan explicitly transferred implementation from ChatGPT Work. One implementation writer; parallel agents are read-only reviewers. Integration target: protected main.

Source main: 03667a783ac1f42db4f880f29a6b864421c4e6ec, guarded merge of #751 after #748 merge 10cb4f23decb6c82a3ff2b9bbb052bb0cc6fd1ac.

#748 tested head c619b5740cfa5e388648728135fe0d7331537a3e: full CI 42816796479, separate ready-state 42886747730. #751 tested head ef4fa982a52802e097cbd529d1dbd89f1da33a67: full CI 42817103649, separate ready-state 42886846561. Full runs passed fast/browser/database/production/final verification; promotion runs passed plan/readiness/verify with other jobs intentionally skipped. Independent read-only review found no blocker; no unresolved review threads observed. Earlier hosted RED evidence retained in the PRs.

Delivered: minimal Assistance document and linked Appeal reads, retention document listing, Donation detail scalar read. No auth/RBAC policy, payment/provider behavior, schema, real data, public media, infrastructure or notifications changed. Closed superseded #740/#742/#745/#746/#747/#750; preserved branches and commits. Snapshot: 775 remote branches, 539 tips contained in main including main, 236 unmatched; no bulk deletion without retained-history review.

Railway: prior website deployment fbceb0fb-5b36-40d2-bf81-e839c6160f8d SUCCESS at 4c1a1e30b97090ac98efb9f42a621dbaf6c61171. #748 deployment 12d3f4da-c1e8-44d8-bdd8-20efca4c79e4 last observed BUILDING. #751 rollout and independent live readiness remain pending. Direct workspace HTTP request returned 403; do not infer runtime SHA from main.

Next: inspect latest Railway website deployment and independently verify version/readiness; retain #684 financial activation hold. Then select the next bounded current-main task after checking overlap. Historical 149 classifications unchanged. Rollback: separately reviewed narrow revert of the four read projections and tests.

Prior coordination records are preserved byte-for-byte under docs/archive/*-before-codex-20261111.md and in Git history. Their dated ownership and release claims are historical, not current.

## 11 November 2026 IST — AF-R047 route attribution and static inventory integrity

Sole implementation writer CODEX_ACTIVE; branch fix/route-js-unmatched-attribution-20261111, base 8118c02422dace83cdbb00c77af376a1d0f9507f. Two reproduced reporter defects: nonempty JS assignment maps containing only unrelated routes falsely succeeded using shared runtime; aggregate walker silently omitted symlinked files/directories or followed a symlink root. Native test-first evidence: 54 tests / 48 passed / 6 expected failures for unmatched maps; after first correction 54 passed. Added CLI synthetic symlink cases: 58 tests / 54 passed / 4 expected failures. Corrected combined suite: 58 passed, zero skipped. Empty JS maps, matching empty ancestors, real build fixtures and canonical asset handling preserved. Source changes limited to scripts; no runtime/dependency/infrastructure/data/payment/RBAC change. Independent review and exact-head selected CI/promotion required before guarded merge. Historical 149 classifications and #684 financial hold unchanged. Rollback reporter and regression changes.
