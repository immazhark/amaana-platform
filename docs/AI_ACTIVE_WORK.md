# Amaana Foundation — active implementation writer

**16 November 2026 IST — CHATGPT_ACTIVE.** One repository implementation writer; parallel read-only audits only. Routine protected task merge remains gated by exact-head CI, separate ready-state validation and a SHA guard. Financial and infrastructure activation have separate owner/provider gates.

**Protected source main at wave-12 task start:** `edcaf99ff21733c37937e8c326624e8e41a14267`, after #1011 (Unicode-safe public-copy teaser) merged with full exact-head CI `43874155904`, separate ready-state `43878838986`, and Railway production SUCCESS `d2f140cf-7c87-4dfd-ab5e-113847162445`. The public /api/health/version independently returned exact `edcaf99ff21733c37937e8c326624e8e41a14267` on main/production; /api/health/ready returned ready.

**Current single-writer task:** `chore/af-r079-reviewed-history-wave12-20261116` — AF-R079 historical branch retirement batch 12. Replace the existing 25-entry guarded manifest with exactly 25 different, previously merged task heads from PR #634–#658. All 25 currently exist and their remote tips match original PR head SHAs, none is protected or marked retain-branch, and original merge SHAs each compare as ancestors of the above source main. The guarded workflow must still revalidate original PR, exact ref SHA, current main ancestry, dependent open PRs, exceptions and permissions immediately before actual deletion. The manifest is a proposal, not a deletion claim.

**Independently verified branch state:** 739 unique existing refs in a nine-page remote census; every one of the 25 #1009 batch-11 manifest heads is absent. #1011 merged task branch is absent. Do not equate branch age with deletion permission.

**Other active/held work:** #1012 AF-R005 client-secret scanner parent-symlink correction remains draft, head `f4abe3d0d62f81846f3dde5a0f4512de44654511`, two-file source scope, new exact-head CI `43879100931` in progress at the last check. #684 QR fallback and #845 synthetic staging donation eligibility remain held for separate scoped finance decisions. Preserve all their branches.

**149 master:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable = 149. Branch retirement alone does not change statuses.

**Locks:** Domestic INR only; no FCRA; 12A/12AB provisional; 80G unresolved. No unilateral payment/webhook, RBAC/schema/CSP/secret, live infrastructure/notifications, donor outreach, or public identifiable unredacted faces/EXIF/GPS.

**Next:** Complete guarded retirement manifest exact-head CI and separate ready-state validation; only then SHA-guarded merge and independent branch census. #1012 acceptance can progress independently without a competing implementation writer. Re-verify fresh main, source/runtime and reviews before release.
