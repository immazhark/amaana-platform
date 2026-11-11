# Amaana current state — 11 November 2026 IST

**Writer:** CHATGPT_ACTIVE, sole implementation writer after owner-confirmed Codex stop. Read-only parallel analysis is permitted; one implementation writer remains enforced.

**Protected source main:** `e25987dd2223bfa459e15a1f9f0b4d99760237a9` after #759 docs-only disposition merge. #759 full impact-selected CI `43007742949` and ready-state `43007847436` passed, merged `e25987dd2223bfa459e15a1f9f0b4d99760237a9`. #757 (AF-R077 Web Vitals exact-document guard) merged `fc202afab220a37008dc6743b4e9576d55178f3c` after full CI `42984439842` and separate ready-state `43006637137`. #758 (AF-R047 legacy manifest symlink rejection) merged `86135173653dcbdfb601be8c0dc7633f9bafab8e` after full CI `42985701286` and separate ready-state `43006643958`. All seven full CI jobs passed for each, including fast/browser/database/production/verify. No required review threads observed. Original #754 closed superseded by merged #755, history preserved. Open financial PR #684 remains **DRAFT/HOLD**, requiring independent bank/payee/routing verification plus separately scoped activation approval.

**Railway production website:** latest observed deployment `e63a6a67-f5f7-46e3-a68e-65a22cabef08` **SUCCESS** at `fc202afab220a37008dc6743b4e9576d55178f3c` (#757). The next docs/tooling-only #758 deployment `ce00b19d-4f2a-465e-b777-c494a9fda46d` **SKIPPED**, correct for unwatched changes. Thus main source SHA and deployed runtime SHA differ, deliberately; do not force a rollout. Public `/api/health/version` and `/api/health/ready` remain inaccessible from independent verification tool, so live identity/readiness **UNVERIFIED**, notwithstanding Railway SUCCESS.

**Current bounded task:** AF-R079 non-destructive local branch retention report, branch `tools/read-only-branch-retention-20261111`, base main `e25987dd2223bfa459e15a1f9f0b4d99760237a9`. Live GitHub branch-name search found **784 unique names** (9 pages), but no current ancestry/retention approval. Implemented native read-only tool, synthetic Git fixture tests (4/4 local green after initial missing-module RED), and CI fast gate; no fetch/reset/delete operations. New draft PR and exact-head hosted CI pending. All contained branches remain review-only; no branch deleted. AF-N13 withdrawn advisory record merged #759; AF-N14 awaits a genuine early-closed stream reproduction. #684 remains a financial activation HOLD. Historical 149 backlog classifications unchanged.

**Other operating boundaries:** Domestic INR only/no FCRA; 80G and 12AB wording remain subject to qualified review. No unredacted public identifiable faces or metadata; no live-payment, cron, donor communication, secret, RBAC or production migration activation under this task.

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
