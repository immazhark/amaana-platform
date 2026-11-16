# Amaana Foundation — active implementation writer

**17 November 2026 IST — CHATGPT_ACTIVE.** Sole implementation writer; parallel read-only QA permitted. Owner standing authorization covers routine task commits and qualifying guarded merges. No concurrent repository implementation writers.

**Protected main:** `96a62de3e99ce24168c09980a50a461f5f71f819` after #1022 (AF-R079 manifest-validation regression). Tested exact PR head `1bc9be30af3168b20e92bd3017df66036a0eb636` passed full CI `43956024008` (7/7) and independent ready-state `43960428982` (plan/promotion/verify). Squash merged with expected SHA. Guarded retirement workflows `43960534915` and `43960534772` SUCCESS: #1022 head and all ten approved historical refs independently absent. Last complete branch census: 678. Previously invalid #686 `content/` retained.

**Current bounded implementation task:** AF-R079 wave 15, branch `chore/af-r079-reviewed-retirement-wave15-20261117` from `96a62de3e99ce24168c09980a50a461f5f71f819`. Replace the already-executed manifest with only original merged PR #698 `fix/admin-donation-list-ist-date-20261108` and #699 `fix/admin-assistance-review-ist-timeline-20261108`. Both are closed/merged into main, exact current branch heads match original head SHA with zero divergence, merge commit `f8ca478bff063fc64537abf3a59ae2dec4a73012` is ancestor of main (0 behind), and neither has retention labels. Other observed PRs #700–#757 have absent branch refs or failed eligibility; no bulk deletions. The pre-existing validator and lifecycle workflow must revalidate all conditions before deletion. Full exact-head and separate ready-state CI needed before merge; verify both refs and task head afterward.

**Open PR holds:** #684 official domestic UPI QR and #845 synthetic staging donation-eligibility, both unmerged and outside this task. No payment, secrets, auth/RBAC, database, provider, donor messaging, cron or live infrastructure changes.

**Runtime:** Previous independently observed production website SHA `8be5c81ae2bda6ff1a489d3d3bcee122c3998b91` was ready; subsequent scripts/docs-only source changes can be Railway SKIPPED. Fresh Railway/public identity for current main has not been independently verified in this wave. Do not force a rollout.

**Original 149 unchanged:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable. Preserve domestic-INR-only/no FCRA, provisional 12A/12AB and unresolved 80G, face redaction and EXIF removal, official brand, historic evidence and protected branch constraints.
