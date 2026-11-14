# Operational state — 14 November 2026 IST (current safe-boundary checkpoint)

Protected main at this checkpoint: `a4d3c00a65deb48ec37f28451037832444d83a80`. Implementation writer `CHATGPT_ACTIVE`; one authorized GitHub implementation writer, no autonomous detached coding agents. Scope limited to Amaana Foundation.

**Merged with exact-head CI, separate ready-state and SHA guard:** #874 public asset inventory symlinks (full `43541827125`, ready `43544957355`, merge `d92f243c75a00231feb97cea99a5737e1306b882`, Railway SKIPPED); #876 public gallery metadata fail-closed (full `43543147308`, ready `43545149079`, merge `d0f3ce008e622773b5d193040ee78002c81c864a`); #877 homepage no-open-appeals Contact route (full `43543477188`, ready `43545930565`, merge `a4d3c00a65deb48ec37f28451037832444d83a80`).

**Isolated draft code PRs, all unmerged:** #878 local admin-edge scan-root symlink guard head `6162996484adc75c69980699dc6e45f9ddb1b45f` (RED `43543768667`, GREEN full run `43544072544` pending browser); #880 public media identity/gallery selectors guard head `0c6bfb426fa947e98b5209f4469664676e6e1c58` (RED `43544896987`, GREEN `43545197351` pending browser); #881 gallery keyboard selection invalid IDs head `b719eab9c357f981715c0c8ac8266d7c816644ed` (RED `43545040907`, GREEN `43545479680` pending browser); #882 AF-R047 bundle reporter aggregate path labels head `5d801be7cec2cc62ea04d3d8df607f209f4646a3` (RED `43545410695`, first GREEN `43545568393` failed an over-escaped regex; corrected GREEN `43545757371` pending browser). The draft status and required checks must be reverified before promotion and merge.

**Railway:** website deployment `990f4c08-7413-4925-bc80-dd5c97b710da` is SUCCESS for #877 source `a4d3c00a65deb48ec37f28451037832444d83a80`, site online 1/1 replica; notification worker SKIPPED. Later scripts/docs merges may show SKIPPED correctly. Independent public HTTP version/readiness inaccessible from available web fetch, so LIVE_HTTP_UNVERIFIED. Do not force redeploy.

**Holds:** #684 independent bank payee and credited UTR attestation plus scoped production finance authorization; #845 donation staging eligibility plan. No payment, schema, auth/RBAC, checkout CSP, donor identities, public media approvals, secret, cron, notification or live infrastructure activation. 149-item classification unchanged: 12 Completed / 48 Implemented / 63 Partial / 24 Not started / 1 Superseded / 1 N/A. AF-R047 is still Partial. Next: continue disjoint coding while CI runs; for each qualifying PR inspect exact-head full verify and review, promote ready, verify separate run, SHA-guard merge, and inspect Railway result. Narrow atomic PR revert is rollback.


---

# Current operational state — 14 November 2026 IST (continued source execution checkpoint)

**Active writer:** CHATGPT_ACTIVE under AGENTS.md and the #862 ownership handoff. One repository integration writer; independent, disjoint branches and CI run concurrently, but detached autonomous coding agents have not been launched. Current protected main at checkpoint: `2c9230cd9797e28e77a1a962c002805946a15441`.

**Protected code merges completed in this continuation:** #871 public teaser decimal boundary, full exact-head CI `43539874379`, separate ready-state `43542853239`, merge `1f31c7e109d5a2fe5b9d1d2cd1aedca6d4f4d3a9`; #873 homepage multiline heading AF-R025, hosted RED `43540988337`, full CI `43541312803`, ready-state `43543927252`, guarded merge `2c9230cd9797e28e77a1a962c002805946a15441`. Neither is a full master-item closure.

**Four isolated draft changes await exact-head acceptance:**
- #874 public asset inventory symlinks, head `236b76ec137145ac81c5067b0141a3b2bcf30d1b`, RED `43541686637`, GREEN `43541827125` browser pending.
- #876 malformed public gallery metadata, head `0f05ad93d1ddff332972cf9fa0fb36b9d2dd95f6`, RED `43542812216` (one intentional new test failure), GREEN `43543147308` browser pending.
- #877 homepage no-appeals Contact recovery, head `8e7a29d19cdf433892caf775b6f1ff09da6d8fdc`, controlled source RED recorded; original test-only CI `43543296741` was cancelled by new push, GREEN `43543477188` browser pending.
- #878 local admin-edge linked App Router scan-root guard, head `6162996484adc75c69980699dc6e45f9ddb1b45f`, RED production prebuild `43543768667` confirmed Missing expected exception, GREEN `43544072544` pending. This does NOT modify/activate auth, RBAC or Cloudflare controls; AF-R013 still PLAN_ONLY_UNVERIFIED.

**Railway source/runtime separation:** #871 website deployment `10a5cedf-a6d1-498f-9ae3-b08191eac6de` SUCCESS with source `1f31c7e109d5a2fe5b9d1d2cd1aedca6d4f4d3a9`, online 1/1; #873 website deployment `9405932a-05da-48b5-9407-9472d9faa346` BUILDING at checkpoint. Worker SKIPPED. Public version/ready endpoints not independently accessible by web tool and remain HTTP_UNVERIFIED. No rollouts forced.

**Finance holds:** #684 external Axis/NPCI payee and credited UTR proof and separately approved production scope; #845 staging eligibility policy. No payment activation, donor data, secrets, cron, notification, schema, checkout CSP or infrastructure changes. 149-item canonical classifications unchanged (12 Completed / 48 Implemented / 63 Partial / 24 Not started / 1 Superseded / 1 N/A). Next: full checks, independent review, separate ready-state and SHA-guard merges for #874/#876/#877/#878; Railway deployed SHA/health; preserve blockers. Narrow PR revert is rollback.

---

# Current operational state — 14 November 2026 IST (five-track source checkpoint)

**Technical source at checkpoint:** protected main `350b8cca959ca122176d6513be80bfdbd1815280`, after three independent guarded merges: #868 `e2bb6ec17607394a1506314c0b42c60c6afb2eca` (route-error native recovery; full CI `43538398199`, ready `43540498812`), #870 `10c7be255684af541f8c5bb8bd1b58b0bdea4873` (malformed participation cards; full `43539647661`, ready `43540502893`) and #869 `350b8cca959ca122176d6513be80bfdbd1815280` (404 Contact recovery; full `43538811800`, ready `43541875785`). Source integrity and SHA-guarded merge completed for all three.

**One repository implementation writer:** CHATGPT_ACTIVE per the #862 handoff and AGENTS coordination. There is no authorized autonomous subagent writer/dispatcher. Five independent code tracks were processed through isolated branches and serialized protected merges, not fictitious detached agents.

**Four distinct draft source PRs remain:**
- #871 public teaser decimal sentence boundary, head `831e81dd4a88b9f72c92786ad1bf15a2d2fb4998`, hosted RED `43539577674`, full GREEN `43539874379` browser pending.
- #872 linked repo-root CSS font audit, head `ffc47452bd90f3fa8e73674eada7ef341bdee1d5`, RED `43540106733`, GREEN `43540249694` browser pending.
- #873 AF-R025 homepage multiline heading leading, head `70367735cd99017bd5854769fce677f0afbb0501`, RED `43540988337`, GREEN `43541312803` browser pending.
- #874 public asset inventory symlink boundary, head `236b76ec137145ac81c5067b0141a3b2bcf30d1b`, RED `43541686637`, GREEN `43541827125` pending.

No one may merge those drafts without successful full exact-head CI, review, separate ready-state promotion and protected expected-head SHA guard.

**Railway source/runtime:** website `744ef045-038b-4e7e-bdca-761076bb137e` SUCCESS for #870 SHA `10c7be255684af541f8c5bb8bd1b58b0bdea4873`, production online 1/1; newer #869 website deployment `c94f4052-5c51-48d7-84f7-c3424b116de9` BUILDING at checkpoint. Worker SKIPPED for both. Independent HTTP health/version access UNVERIFIED; BUILDING is not SUCCESS. No notification activation/secret changes.

#684 verified bank-payee/credited UTR and separate finance approval pending; #845 donation staging-eligibility plan pending. Canonical 149 remains 12 Completed / 48 Implemented / 63 Partial / 24 Not started / 1 Superseded / 1 N/A (135 active). No entire item relabeled. Next: finish qualifying exact-head checks and promotion, serial guarded merges, Railway SHA verification; leave financial holds isolated. Revert only narrow atomic PRs as rollback.

---

# Current operational state — 14 November 2026 IST (three-workstream checkpoint)

**Writer:** CHATGPT_ACTIVE, owner takeover completed in #862. One implementation writer coordinates isolated task branches and serialized merges. Actual autonomous external coding agents were not launched. Read-only work may proceed independently.

**Protected main at checkpoint:** `3bc7b085c008c3037edd53b71459df614085b58c`, following #855 public-media symlink audit merge; #855 head `07ba9ef2f0c901603c66ea51f95181bbcda9237b`, full CI `43528573595` success, separate ready-state `43532663380` success, protected SHA-guarded merge. Docs-only #863 merged earlier at `ea030d765ba0525b737696d46a324011d46a04a7`.

**Isolated draft fixes in progress:** #864 artwork audit symlinked scan root, head `0c5e8a8a3cd741ed8aa067bc168d743b4b9254f8`, RED `43533148239`, GREEN fast/db/production, full CI `43533355070` browser outstanding; #865 X-Robots-Tag complete noindex directive, head `a13e132e94b08e3dcb4d72fcc22a256636456b3e`, RED `43533153839`, GREEN fast/db/production, full CI `43533359690` browser outstanding; #866 local-only synthetic profiler private reads, head `dc6cc8ddf978a125afcba0c2abbf1322538c0974`, RED `43533880459` and expanded RED `43534855944`, corrected source/test pending exact-head CI `43535301936`. No draft is merge-certified at this checkpoint. Each PR touches two disjoint audit-only files.

**Runtime:** latest settled Railway website deployment `43d96cd5-5e76-47c9-a5cf-561328567868` for source `fe6249e380c6e00c52af874a51caf41a7ed01119`, healthy online 1/1 at last environment-status check. Later docs/scripts commits were Railway SKIPPED as watched paths were unchanged. Independent public HTTP readiness/version remains UNVERIFIED. Preview offline; notification worker not activated. No force-deploy, secrets, real funds, donor data, cron or live payment changes.

**Finance holds:** #684 external Axis Bank/NPCI beneficiary and credited UTR attestation plus separately scoped production approval; #845 unapproved staging donation eligibility behavior with intentional RED evidence. Do not merge either as routine maintenance. Original ledger remains 149: 12 Completed / 48 Implemented / 63 Partial / 24 Not started / 1 Superseded / 1 N/A; 135 active. Next: continue unrelated safe source code while full browser checks run; for each successful exact head, inspect reviews, ready-state CI and SHA-guarded merge; then verify Railway watch outcome. Rollback by narrow atomic PR revert.

---

# Current operational state — 14 November 2026 IST (ChatGPT release checkpoint)

**Writer:** CHATGPT_ACTIVE, owner-directed takeover recorded through protected #862. This is the current checkpoint; older CODEX_ACTIVE sections below are retained as history, not present ownership. One shared-repository integration writer and serialized protected merges; independent source/QA tracks remain disjoint.

**Protected main:** `fe6249e380c6e00c52af874a51caf41a7ed01119` after exact-head, reviewed, ready-state-verified SHA-guarded merges #858 `3df2c58e96292f03fdf1fbffdf127c4c60568dee` (HTML ASCII stylesheet rel), #859 `7b00012f60f136d6bb211098979505354d0a9133` (HTML MIME essence), #861 `be78644b7d4de39350193bc5f3940d1eec2efe6d` (descendant-cancelled carousel drag) and #853 `fe6249e380c6e00c52af874a51caf41a7ed01119` (fatal root error recovery). Earlier this continuation merged #856 `3fa72b66b349b5924a79da0d8bcd87ad1d23e3f5` (route metadata symlink safety) and owner handoff #862 `3fc5bd02e29277fe09f9f0b3f4574700bd5a226b`. No protected-main direct writes, force history or branch deletion.

**Acceptance:** #858 full CI `43526456265`, separate ready `43530640322`; #859 full `43526459595`, ready `43530646681`; #861 full `43527256698`, ready `43530896723`; #853 full `43527167593`, ready `43530911175`: successful selected jobs and expected skips in promotion. #856 and #862 exact evidence remain in their PRs and preceding handoff. No item-level reclassification from these bounded fixes.

**Railway production:** #861 website deployment `c0e01178-2396-4752-9d34-90d214575ebd` SUCCESS at `be78644b7d4de39350193bc5f3940d1eec2efe6d`; #853 website deployment `43d96cd5-5e76-47c9-a5cf-561328567868` BUILDING at latest observation. Worker watch outcome SKIPPED and worker parked; historic preview offline. Fresh public version/readiness HTTP identity not independently obtained: LIVE_UNVERIFIED. Do not conflate source main with runtime SHA or trigger a forced rollout.

**Open isolated source:** #855 media symlink scanner rewritten as two-file effective diff at candidate `07ba9ef2f0c901603c66ea51f95181bbcda9237b`; hosted full CI `43528573595` fast/production/database successful, browser still in progress, final verify/promotion pending. Keep draft until full exact-head acceptance. Any changed head restarts acceptance. No conflicting source paths from other open PRs observed at this checkpoint.

**Financial holds:** #684 QR fallback remains draft/not live for independent Axis Bank/NPCI payee ownership attestation, credited transfer/UTR reconciliation and separately approved production activation; #845 retains deliberate failing donation-eligibility evidence, not release-ready. Do not perform live payments, refunds, donor delivery, secret/config/schema changes or activate cron. Domestic INR only; unresolved 80G classification and all public-media privacy gates preserved.

**Backlog:** canonical `docs/mission-control/149-item-status-2026-11-12.csv` verified 149 unique IDs: 12 Completed + 48 Implemented + 63 Partial + 24 Not started + 1 Superseded + 1 N/A; active 135 (P0 28 / P1 72 / P2 35). This is ledger consistency, not live reacceptance of 149 features.

**Next independent executable task:** inspect final #855 exact-head browser/verify, then promote/merge only after separate ready run and review; independently verify #853 Railway SUCCESS plus fresh public identity/readiness; continue isolated P1 source work and finance evidence without activating protected payments. Rollback each atomic PR separately; no production infrastructure apply authorized.

---

## 14 November 2026 IST — coordinated audit corrections and protected font audit merge

Coordinator CODEX_ACTIVE under explicit owner-directed parallel coding. Base a936835dd58c210e21dc3bed52a122b1d657c3fc; #854 protected merge dd0fa90d2d367cdaf8909c2fa5e2c9d4ff4e4d15 after full CI 43522240927 and separate promotion 43526227816. Independent review found no blocker. Railway d21709b4-6a0e-48ff-9cbd-abc321427315 SKIPPED; previous a936835 deployment SLEEPING. Public Cloudflare 403 blocks independent runtime certification.

Two isolated agents reproduced and corrected audit-only defects: #858 CSS rel ASCII whitespace, head 4b7ada43a0a9eb5ffc1b8dfddbb7bc12294abe5f, RED vertical-tab case then 92/92 native GREEN; #859 exact HTML MIME essence, head d704b2ff3a8cfa88a5728eda44261bd6e30e0322, RED 29 pass/1 fail then 30/30 GREEN. Both independently reviewed/rerun, published drafts; hosted exact-head acceptance and separate promotion pending. Local full Vitest unavailable without dependencies. Connector publication used after Git HTTPS push lacked credentials; remote heads differ from local commits but preserve exact trees.

#853 held for review of next/link versus native full-document fatal recovery. Preserve #855–857 in-flight candidates. #684 financial activation remains held for independent payee attestation, credited UTR matching and scoped approval; #845 retained RED finance evidence. No payments, secrets, donor data, auth, schema, infrastructure or worker activation. Canonical repository ledger verified 149 unique IDs: 12 Completed / 48 Implemented / 63 Partial / 24 Not started / 1 Superseded / 1 Not applicable; 135 active. Uploaded October CSV is stale. No new full-item closure. Next: finish draft exact-head gates; correct fatal recovery after regression; preserve provider/manual holds. Rollback each narrow two-file correction independently.

# Current operational state — 12 November 2026 IST

## Ownership and execution

Owner Mohammed Mazhar Khan transferred implementation to **CODEX_ACTIVE** and explicitly authorized independent parallel coding agents. Each task has a separate worktree/branch and disjoint declared files; Codex coordinates shared records and serialized protected integration. This owner directive supersedes older single-writer wording within this coordinated team. Other sessions must not write concurrently. Routine PR/merge authority and existing acceptance protections remain in force.

## Verified source and release boundaries

- Protected main: `247259a6d1ec43fadfa2091e8a446ab37aa062ef`, guarded merge of #818 after #817 `49214ea6fa2f70408a1bf9fe4814af5f22ccce23`.
- #817 tested head `119c78f0faae0aac335642067375583d28d8138d`: full CI `43263276109`, separate ready-state `43277980642` SUCCESS; independent review found no blocker or unresolved review thread.
- #818 tested head `ae6a6ed919bd6c42c3ae3dcca0fe7342ee083288`: full CI `43264368415`, separate ready-state `43277990006` SUCCESS; same review boundary. These are synthetic missing-relation resilience fixes, not an observed malformed live record.
- Railway #818 deployment `3d115e3d-f132-4b35-9bcb-c1ad4cfe5386` BUILDING at last read; prior successful website deployment `87b78136-8781-47f2-9a71-d9933b0dc344` at `6bd58c74252227dbce68ed35fa3d160f5f423078`. Direct public version/readiness requests returned 403 here. Source merge, provider success and independent public readiness remain separate.

## Independent implementation tracks

- #820 schema-audit tag boundaries: native RED 21 pass/2 fail; GREEN 23/23, zero skips; independently rerun. Exact canonical/robots tags only; no app runtime change.
- #821 Our Work invalid ranges: RED 30 pass/1 fail; GREEN 54 focused tests; independent review. Invalid reversed/oversized range contributes no year options; published records remain unfiltered.
- #822 current-route mobile menu focus: RED three failures; GREEN 32 focused tests plus TypeScript/scoped ESLint. Two actual-page browser regressions await hosted acceptance. Restore visible toggle focus when current destination closes menu.
- Each has a dedicated evidence note, draft PR, fresh exact-head CI, separate ready-state and guarded merge requirements. Rollback is narrow source/test revert. CI waits do not block independent implementation.

## Backlog and holds

Current register integrity independently checked at `6bd58c74252227dbce68ed35fa3d160f5f423078`: **149 unique original IDs = 12 Completed + 48 Implemented + 62 Partial + 25 Not started + 1 Superseded + 1 Not applicable**. Active export has exactly **135 nonterminal IDs** (28 P0 / 72 P1 / 35 P2). No item reclassified by this batch. This is register reconciliation, not a comprehensive renewed live audit of every item.

#684 remains draft/unmerged: independent account ownership, credited UTR matching and reviewed production activation scope remain outstanding. Existing Razorpay/UPI/bank-transfer source paths do not certify successful live transactions, automated recurring mandates or statutory certificates. No real payment, donor communications, notification/cron activation, infrastructure apply, secret change, schema or auth/RBAC change performed. Preserve domestic INR/FCRA safeguards, unresolved 80G wording, privacy #785 and qualified acceptance gates.

## Next executable work

Finish independent review and exact-head checks for #820–#822, promote separately, merge with expected head guards and inspect Railway/public outcomes. Keep finance activation isolated. Prior checkpoint history remains in Git and the handoff ledger; this compact checkpoint supersedes older startup snapshots.
