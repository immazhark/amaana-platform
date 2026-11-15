# Amaana implementation ownership — current checkpoint

**15 November 2026 IST. Sole writer:** `CHATGPT_ACTIVE`; research/review and CI may run concurrently, but no second repository implementation writer.

**Protected source:** `main` `f45c963b8d17f2abe08beadaa5e50d44c7ed6709`, after protected AF-R013 #985 merge with full exact-head and distinct ready checks. Railway website and parked worker correctly SKIPPED this script/CI change. Independently verified website remains at earlier successful SHA `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`, ready.

**Current task:** AF-R079 fourth exact-SHA historical branch retirement wave, `chore/af-r079-reviewed-history-wave4-20261115`. An existing `docs/mission-control/af-r079-approved-retirement-batch-20261115.json` now contains only 25 individually matched same-repo merged PR heads #873–#897. Before write, each PR's merged main, unprotected branch exact head, absence of `retain-branch`, unique ref, valid merge SHA and unchanged protected main were checked. The existing guarded GitHub workflow must independently recheck open/dependent PRs, merge-commit ancestry, protection and head SHA before deleting any branch. No direct ref delete, no archival/release refs, no sweeping stale-name pruning; exact-head full CI, separate ready-state and guarded merge first. The original 149-item AF-R079 stays Partial until comprehensive branch retention acceptance.

**Other independently owned task PRs under same writer:** [#986](https://github.com/immazhark/amaana-platform/pull/986) AF-R012 synthetic cross-role appeal tests, head `edc0e820b7317e405baa456c9144162321bb0d11` CI `43741654296`; [#987](https://github.com/immazhark/amaana-platform/pull/987) AF-R005 public env secret alias preflight, head `3a9342e71a51cc2d4c932047f3cd5c89e96b684f` CI `43741890034`; [#988](https://github.com/immazhark/amaana-platform/pull/988) AF-R078 unquoted static HTML anchor inventory, head `b16af9dc4dd0b6c4d6d9e8c9b9e03118413fb713` CI `43742157766`. All remain draft/unmerged unless current GitHub status proves otherwise. Reconcile each to main after any intervening merge, without force push; rerun checks.

**Hard holds:** finance #684/#845, Railway Config as Code live apply #446, no live payment/refund/notification/secret/schema/data changes, no public identifiable face without redaction and GPS/EXIF removal, no FCRA, INR domestic, 80G unresolved and provisional 12A/12AB.

**Original 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A. Unchanged.

**Next:** open exact-pinned wave4 PR, full CI, separate ready-state, guarded merge. Inspect actual workflow retirement outcomes (RETIRED/PRESERVE) and independently count branches; never infer success from manifest alone.
