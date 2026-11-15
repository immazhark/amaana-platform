# Amaana implementation ownership — current checkpoint

**15 November 2026 IST. Sole repository implementation writer:** `CHATGPT_ACTIVE`. Parallel read-only audits/CI only; no competing code writers.

**Protected source:** `main` at `f45c963b8d17f2abe08beadaa5e50d44c7ed6709` after AF-R013 #985 accepted through full tests, separate ready run and SHA-guarded merge. Railway SKIPPED that script-only change. Last independent live public SHA `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`, ready.

**Current independent task:** AF-R078 existing local read-only Markdown dated-audit backlink inventory fails to record valid unquoted HTML `<a href=./file.md>` anchors embedded in Markdown, after the earlier quoted-attribute PR #984. Branch `fix/af-r078-unquoted-html-backlinks-20261115` from current main. Add synthetic RED test, minimal bounded source parser correction, exact-head CI and protected PR release gates. Never delete historical documents, infer retention approval or alter public media, money/auth/schema.

**Queued source work from same sole writer:** [PR #986](https://github.com/immazhark/amaana-platform/pull/986) AF-R012 synthetic appeal cross-role tests at reconciled head `edc0e820b7317e405baa456c9144162321bb0d11`, full exact-head run `43741654296` underway. [PR #987](https://github.com/immazhark/amaana-platform/pull/987) AF-R005 public NEXT_PUBLIC credential compact-name guard, RED `43741783095`, GREEN candidate `3a9342e71a51cc2d4c932047f3cd5c89e96b684f`, exact-head `43741890034` underway. Coordinate and reconcile from main if either merges before this branch; never force-push or discard history.

**Hard holds:** Finance #684/#845, Railway IaC live apply #446, payments/refunds, schema, secrets/rotation, outbound messages, live donor records and identifiable face media; no FCRA, INR domestic only, unresolved 80G, 12A/12AB provisional.

**Canonical 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A unchanged. AF-R078 remains Partial.

**Next:** prove RED with hosted deterministic regression; minimal GREEN; protected CI/ready/expected-head checks. No website rollout for scripts/docs-only task; independently inspect Railway SKIPPED.
