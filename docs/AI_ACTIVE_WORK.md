# Amaana implementation ownership — current checkpoint

**Updated:** 15 November 2026 IST. This is a replaceable current pointer, not a historical log.

**Writer:** `CHATGPT_ACTIVE`, sole implementation writer; repository remains owner-controlled. Verify no competing session before writing. Protected integration/release trunk: `main`. Latest merged source: `b68936e012641976605e3ce74f338ad0f0e32008`; source and runtime SHAs differ intentionally when Railway correctly SKIPs docs/scripts-only commits.

**Task in progress:** AF-R079 short-lived branch hygiene; existing workflow and manifest. Working branch `chore/af-r079-reviewed-history-wave3-20261115`; [PR #982](https://github.com/immazhark/amaana-platform/pull/982) is a draft third 25-ref retirement wave. PR #982 must pass exact-head selected CI, separate ready-state workflow, review and expected-head guarded merge; recheck head in GitHub, never rely on a copied candidate SHA.

**Already verified:** #980 merged `ee7d90fb1687b6bd73b711f6751dfaf84872ad4c` and enabled future automatic head retirement. First historical wave: 20/20 retired; #980 head also retired. #979 merged `ee7f6361f9a4f99d2d2f5b204b92ed06aa0e9f5e`, source head absent. #981 merged `b68936e012641976605e3ce74f338ad0f0e32008`; second historical wave 25/25 retired, #981 head absent. Fresh post-wave GitHub census **957 branches**; creation of the #982 task branch adds one temporary ref until merge.

**Production:** Railway last successful website deployment `ffa8dcea-d24a-4783-b672-194390915840` at `83072e44e74c785f51f2b9213a3820fee7a34d8e`; fresh public version/ready reports the same `main` production SHA and `ready`. Later script/docs merges were correctly `SKIPPED`; no forced rollout or live payment operation.

**Held:** #684 domestic giving QR and #845 finance staging guard require independent scoped acceptance. Historical `phase-public-site-rebuild`, protected/finance/infrastructure refs and unreviewed history are not deletion targets. Original 149-item register remains **35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A**.

**Next:** Accept PR #982 only after all required exact-head and ready-state gates; verify automatic deletion log and complete ref census after merge. Continue classifying archived branch refs, but never bulk-delete by age/name alone. Keep this pointer concise; full evidence is in GitHub PRs, workflows and the existing [handoff ledger](./AI_HANDOFF_LEDGER.md).
