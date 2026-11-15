# Amaana implementation ownership — current checkpoint

**Updated:** 15 November 2026 IST. This file is the current implementation pointer; historical facts belong in `docs/AI_HANDOFF_LEDGER.md` and merged PRs.

**Writer:** `CHATGPT_ACTIVE` only. The user has explicitly continued ownership. Parallel CI and read-only research are allowed; no second GitHub writer is authorized.

**Protected base:** `main` at `f03f9a7df181e5451471d998da2a8f668a6cf47e` at task-branch creation. Source and Railway runtime SHAs are deliberately separate.

**Release queue:** [PR #983](https://github.com/immazhark/amaana-platform/pull/983) AF-R066, branch `fix/af-r066-evidence-stylelint-20261115`, head `a0f32690bfd46068bc2b8072cde527515162126d`. Verified hosted RED `43731128736` and exact-head GREEN fast/database/production in `43731243191`; browser selected and still in progress at last inspection; draft, unmerged. Must complete browser and final verify, independent ready-state workflow, zero unresolved reviews and expected-SHA protected merge. Never mark uncompleted checks passed.

**Current independent atomic task:** AF-R078 static backlinks, branch `fix/af-r078-html-backlink-inventory-20261115` created from the protected base. Existing read-only `scripts/draft-dated-doc-retention.mjs` omits HTML `<a href>` links embedded in Markdown files. Write a synthetic failing test, make the smallest correction preserving project-root and symlink guards, then verify and open one draft PR. No archived files will be deleted or reclassified as safe-to-delete. This branch does not modify application routes or financial behavior. Keep AF-R078 Partial until its full retention end state is accepted.

**Production baseline:** Railway last inspected website deployment `ffa8dcea-d24a-4783-b672-194390915840` SUCCESS; independently observed public runtime `83072e44e74c785f51f2b9213a3820fee7a34d8e` ready. Held finance PRs #684/#845 remain untouched. #446 Railway IaC needs reviewed read-only CLI plan and a separately scoped live apply decision.

**149-row totals:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable. No full-item promotion from partial tests or reports.

**Next:** Finish #983 gates independently; in the meantime progress AF-R078 through RED/GREEN, CI and bounded PR. Refresh both PR heads and protected main before any merge, handle any coordination conflict without overwriting the merged current state. Do not force a Railway rollout.
