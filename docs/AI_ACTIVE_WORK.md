# Amaana implementation ownership — current checkpoint

**Updated:** 15 November 2026 IST. One active repository implementation writer: `CHATGPT_ACTIVE`. Parallel read-only agents and hosted CI allowed; no competing repo writer or unreviewed historical branch deletion.

**Protected main:** `69f7c7c43512c45eddcca4462f65f3a60fcf2d3b` after AF-R078 [PR #984](https://github.com/immazhark/amaana-platform/pull/984) expected-SHA guarded squash merge. #984 RED `43732739585`, full exact-head GREEN `43734553764`, separate ready-state `43738571009`, no unresolved review threads, successfully merged. Scope was read-only HTML-anchor backlink extraction in dated-document retention report, no deletion or archival approval.

**Previous production release:** AF-R066 [PR #983](https://github.com/immazhark/amaana-platform/pull/983) merged `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`; Railway website deployment `56519fd5-b4f9-4200-84b0-3cdfab90c4d4` SUCCESS. Independently fetched public /api/health/version on 15 November returned exactly this SHA on main/production; /api/health/ready returned ready. Website post-release smoke covered /compliance, /our-work and /stories. #984 only changed scripts/docs, and Railway website/worker correctly SKIPPED that merge.

**Current one-writer task:** AF-R013 local-only admin edge-policy route inventory case variants, [PR #985](https://github.com/immazhark/amaana-platform/pull/985), branch `fix/af-r013-case-variant-admin-inventory-20261115`. RED head `e6b190ece264cd76f7a845c95ada4e8586ecf253`, run `43734840150`: four synthetic case variants failed while previous 12 inventory cases passed. GREEN head `d70fc7029bccbafdfce211392b51ae80e1d5f35b`, full exact-head CI `43734967338` success including browser, database, production and verify. This branch preserves its original head and merged main as two parents without force push, resolving the active-state checkpoint. Its new integrated head must get fresh exact-head CI, then separate ready-state checks and protected expected-SHA merge. This is NOT Cloudflare/WAF activation, actual RBAC change, or evidence of live WAF behavior.

**Hard holds:** #684 and #845 finance PRs; Railway IaC #446 live apply; auth/RBAC activation; real donations, confidential data, schemas, secrets, outbound messages and donor identity/media. Preserve domestic INR only, 80G conflict, provisional 12A/12AB and face redaction.

**Canonical 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A, unchanged. Partial engineering sub-scopes do not close original items.

**Next:** Validate the new integrated #985 head and review, promote only if full accepted, run separate ready-state verification and guarded merge. Inspect Railway SKIPPED vs deployment and independent public identity without forcing rollout. Proceed to next tested independent backlog item; preserve historical/source branch retention rules.
