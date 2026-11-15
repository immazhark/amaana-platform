# Amaana implementation ownership — current checkpoint

**Updated:** 15 November 2026 IST. This is the replaceable current pointer. Historical evidence belongs in PRs and `docs/AI_HANDOFF_LEDGER.md`.

**Single implementation writer:** `CHATGPT_ACTIVE`, as authorized by the owner. Concurrent read-only review and CI do not establish additional repository writers.

**Protected source:** `main` `69f7c7c43512c45eddcca4462f65f3a60fcf2d3b` after guarded merges of AF-R066 #983 (`b1a5b71872c201874a25c70d6a2b7dc632ac6e06`) and AF-R078 #984 (current main). #983 website deployment `56519fd5-b4f9-4200-84b0-3cdfab90c4d4` SUCCESS, independent public SHA and ready matched #983. #984 was source/docs only and Railway website/worker SKIPPED, correctly leaving deployed and source SHAs different.

**Release in progress:** AF-R013 [PR #985](https://github.com/immazhark/amaana-platform/pull/985), integrated candidate `33da1b4112efaecc2b035f4529a9bd3331974368`. RED `43734840150`; GREEN exact-head fast, database, production PASS in `43738698646`, browser in progress at last inspection; draft, unmerged. Case-variant admin paths fail closed in a local read-only edge inventory; not a live WAF or auth modification. Finish selected browser/verify, separate ready-state checks and protected SHA-guarded merge; reconcile this file with current main again if #985 merges.

**Current independent task:** AF-R012 on branch `test/af-r012-appeal-cross-role-20261115` from verified current main. Add synthetic tests that grant plausible but incorrect permissions to admin appeals action calls and prove they are denied before any protected database/cache side effect. This is **added test coverage of existing behavior**, not a production auth/RBAC change or evidence of a previously exploitable defect. Verify on existing test runner and exact-head CI; one bounded PR; do not adjust live permissions, schema, real donor data, settings or checkout. Under `src/**`, even test-only changes can trigger Railway website build if merged.

**Hard holds:** Finance #684/#845, Railway IaC #446 live apply, donations/refunds, secrets, retention removal, outbound messages, public identifiable media. Domestic INR only, no FCRA, unresolved 80G status and provisional 12A/12AB wording.

**Canonical 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A. No promotion of AF-R012 or AF-R013 from isolated test coverage.

**Next:** Add bounded positive/negative role fixtures without mocking away the actual auth guard; run exact-head tests and all impact-selected CI; merge only after separate ready-state and review. Refresh #985's independently hosted CI concurrently without competing repo writes.
