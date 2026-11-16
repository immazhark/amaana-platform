# Amaana Foundation — active implementation writer

**16 November 2026 IST — CHATGPT_ACTIVE.** One repository implementation writer; parallel read-only audits only. Routine protected task merge remains gated by exact-head CI, separate ready-state validation and a SHA guard. Financial and infrastructure activation have separate owner/provider gates.

**Protected source main at wave-12 task start:** `edcaf99ff21733c37937e8c326624e8e41a14267`, after #1011 (Unicode-safe public-copy teaser) merged with full exact-head CI `43874155904`, separate ready-state `43878838986`, and Railway production SUCCESS `d2f140cf-7c87-4dfd-ab5e-113847162445`. The public /api/health/version independently returned exact `edcaf99ff21733c37937e8c326624e8e41a14267` on main/production; /api/health/ready returned ready.

**Current single-writer task:** `chore/af-r079-reviewed-history-wave12-20261116` — AF-R079 historical branch retirement batch 12. Replace the existing 25-entry guarded manifest with exactly 25 different, previously merged task heads from PR #634–#658. All 25 currently exist and their remote tips match original PR head SHAs, none is protected or marked retain-branch, and original merge SHAs each compare as ancestors of the above source main. The guarded workflow must still revalidate original PR, exact ref SHA, current main ancestry, dependent open PRs, exceptions and permissions immediately before actual deletion. The manifest is a proposal, not a deletion claim.

**Independently verified branch state:** 739 unique existing refs in a nine-page remote census; every one of the 25 #1009 batch-11 manifest heads is absent. #1011 merged task branch is absent. Do not equate branch age with deletion permission.

**Current protected main after #1012:** `ec4257e3019100e40bc12b94785588bf9b150c7b`. AF-R005 client-bundle scanner parent-symlink correction merged from existing #1012 after exact-head CI `43879100931` and distinct ready-state `43903458365`, merge `ec4257e3019100e40bc12b94785588bf9b150c7b`; Railway website deployment `393f5551-ba22-4910-896c-2c01f266b1e8` correctly SKIPPED because only `scripts/**` changed. Last public live identity remains the previously verified #1011 SHA.  #684 QR fallback and #845 synthetic staging donation eligibility remain held for separate scoped finance decisions. Preserve all their branches.

**149 master:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable = 149. Branch retirement alone does not change statuses.

**Locks:** Domestic INR only; no FCRA; 12A/12AB provisional; 80G unresolved. No unilateral payment/webhook, RBAC/schema/CSP/secret, live infrastructure/notifications, donor outreach, or public identifiable unredacted faces/EXIF/GPS.

**Next:** Reconcile existing #1013 wave-12 branch with current protected main without force. Run full new exact-head CI and distinct ready-state acceptance on the reconciled SHA; then guarded merge and independently verify retired refs. Do not infer branch deletion from a manifest.

**Additional AF-R024 test-first source task (same sole implementation writer):** `fix/af-r024-clamp-additive-font-floor-20261116`, based on protected `5b1ed49c419c0e411df0b4d55d34f1fb15289136`. New standalone synthetic RED test checks additive constant `calc()` in the lower bound of `clamp()`: reject evaluated sub-12px values and accept evaluated 12px floors. No production source behavior change yet. Existing #1014 AF-R079 wave-13 cleanup CI is independent and remains in review. Reconcile this branch against main after #1014 before a protected merge.

**AF-R024 RED evidence:** PR #1015 test-only commit `4fbaa89029ac8ab597a9e3ce7f3b3bee9994b68c` yielded CI run `43910992881` with fast failure specifically at `Guard public CSS minimum type size`; plan/promotion checks passed and unrelated stages were skipped due to RED. Minimal scanner implementation now targets this proven defect; require fresh exact-head GREEN before ready-state or merge.
