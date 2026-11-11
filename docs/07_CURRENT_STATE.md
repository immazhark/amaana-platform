# Amaana current state — 12 November 2026 IST

Sole implementation writer CHATGPT_ACTIVE; parallel reviewers are read-only. Integration target protected main. Inspected main **b18e1518e938049f12876a069ebfa8e8cfee39cb** (#780). Railway website **f9058056-1c6e-4dc3-96b0-1aa312389330 SUCCESS**; independent uncached public version/readiness HTTP 200 match this SHA/main/production and ready. paymentMode live is configuration evidence, not transaction certification.

Current branch **fix/branch-inventory-canonical-refs-20261112**, base above: correct AF-R079 branch inventory failure on normal origin/HEAD symbolic alias. RED 4/5, GREEN 5/5 native synthetic tests, zero skipped. Corrected read-only full-clone ancestry snapshot: 806 remote branch refs, 567 contained/review-only, 238 unmerged/preserved, 1 main; no deletion approved. Exact-head CI/review/promotion/merge pending.

Only pre-existing open PR **#684**, draft head 1d2918c211a5795202b24614b7b8a6e6131158e9. Preserve financial activation hold: independent recipient ownership, credited-transfer reconciliation, reviewed exact activation scope and release acceptance. General fund ledger/automatic recurring mandates/statutory certificates are not delivered by existing appeal checkout/reminders/ordinary acknowledgements. No live payment tested.

Current canonical accounting: **4 Completed / 56 Implemented / 62 Partial / 25 Not started / 1 Superseded / 1 Not applicable =149**; 143 actionable remaining. No new full-item closures inferred. Sequential exports and detailed bounded audit: [reconciliation](mission-control/2026-11-12-reconciliation.md). Next: finish candidate gates, then R002/R003 advisory/platform verification and R004/R006 focused build/config acceptance. Entire historical branch/source/live audit remains incomplete.

---

## Preserved prior checkpoint (historical)

# Amaana current state — 11 November 2026 IST

**Implementation writer:** CHATGPT_ACTIVE (owner-confirmed sole writer). Preserve all existing safety/release gates. Read-only external inspections and review may operate independently.

**Protected source main:** `b85ede6c7c51c189fbb7eb0b99dba562e9bd4478`. PR #760 (AF-R079 local-only no-delete branch report) full exact-head CI `43009853794`, ready-state `43013484450`, guarded merge `3fb9cbfce4f941ab0dd34565b882a9155e496b7b`. PR #761 (AF-R076 canonical email-link regression) full CI `43011832173`, ready-state `43015166590`, merge `ac3e13353da445d4a4924a3974d5d15213d0898e`. PR #762 (AF-R077 permanently invalidate Web Vitals after SPA departure) RED `43013392531`, GREEN full CI `43014046360`, ready-state `43018514792`, merge `b85ede6c7c51c189fbb7eb0b99dba562e9bd4478`. All mandatory browser/database/production/verify acceptance succeeded for the merged implementation PRs.

**Railway production:** #762 website deployment `4dc61c76-a77e-4dd5-a55e-48cd92f04bbf` reports **SUCCESS** at runtime commit `b85ede6c7c51c189fbb7eb0b99dba562e9bd4478` and Railway service **Online**. This is *not* independent public HTTP readiness/version verification; those endpoints remain inaccessible in this tool environment. Recent tooling/docs-only merges correctly SKIPPED website rollouts. Do not force deployments for cosmetic SHA equality.

**Current bounded implementation:** AF-R052 first-party absolute gallery image optimization branch `fix/campaign-gallery-absolute-first-party-optimization-20261111`, base main `b85ede6c7c51c189fbb7eb0b99dba562e9bd4478`, draft PR #764. Test-first RED hosted CI `43020388034` fast job `130521920259` reproduced raw `<img>` for an approved same-origin `https://amaanafoundation.org/media/...` direct gallery prop; one focused test failed, unrelated eight passed. Implementation commit `bbdc142d52820c048373f24e1a621389c37aff81` reuses existing privacy-safe `getPublicImageOptimizationUrl` for thumbnail and modal. Full exact-head GREEN CI and ready-state still pending. Independently PR #763 AF-R015 test-only Cloudflare beacon CSP guard is in full CI (final candidate head `fbcd5f45f0b0fd4f456225a18a44f0d873e3b3d8`, run `43019639101` after RED for unsafe-inline review); no production CSP mutation. Payment fallback PR #684 remains **DRAFT/HOLD** pending independent bank/payee/routing verification and separately scoped financial activation.

**Safety:** Preserve INR domestic-only/no FCRA, provisional 12AB/80G wording boundary, identifiable public faces redacted with metadata removed, no production payments/notifications/migrations/secret rotation without independent authorization. Historical 149 backlog classes unchanged; added coverage is not automatically full acceptance.

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
