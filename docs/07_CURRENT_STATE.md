# Amaana Foundation — current release state

**16 November 2026 IST.** Dated checkpoint, not a live feed. Single writer: `CHATGPT_ACTIVE`. Always recheck GitHub, Railway and public endpoints before release.

| Boundary | Last verified result |
|---|---|
| Protected source main | `ec4257e3019100e40bc12b94785588bf9b150c7b` after reviewed #1012 scanner hardening squash merge |
| #1011 release | Full exact-head CI `43874155904` and separate ready-state CI `43878838986` succeeded; Railway website `d2f140cf-7c87-4dfd-ab5e-113847162445` SUCCESS |
| #1012 release | Exact-head CI `43879100931` and separate ready-state `43903458365` SUCCESS; merged `ec4257e3019100e40bc12b94785588bf9b150c7b`; Railway website `393f5551-ba22-4910-896c-2c01f266b1e8` SKIPPED correctly for out-of-watch scripts |
| Public runtime | Fresh public version endpoint reported `edcaf99ff21733c37937e8c326624e8e41a14267`, branch main, environment production, paymentMode live; independent readiness returned ready |
| Branch cleanup | 739 existing remote refs in complete nine-page census; 25/25 prior #1009 batch-11 manifest refs absent, #1011 task head absent |
| Active cleanup task | `chore/af-r079-reviewed-history-wave12-20261116`, batch-12 proposal: 25 merged, exact-SHA-pinned unprotected refs from PR #634–#658. No batch-12 deletions yet; guard must revalidate before deletion |
| Open cleanup PR | #1013 existing branch `chore/af-r079-reviewed-history-wave12-20261116` reconciled to new main, exact-head and ready-state need fresh verification before merge |
| Held financial PRs | #684 (receiving-account/UPI settlement and activation), #845 (payment eligibility) remain unmerged |
| 149 canonical total | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable |

**Infrastructure:** Railway project `amaana-platform-staging` contains environment `production`, with website, historical preview and parked annual notification worker, plus three buckets and zero volumes; no staged change at inspection. Do not activate parked worker or make an infrastructure apply.

**Safety:** Distinguish source, tested, merged, deployed, live-verified and full acceptance. Domestic INR only, no FCRA; provisional 12A/12AB, unresolved 80G evidence; redact identifiable faces and remove metadata for public derivatives. No arbitrary historical-branch or document purge. No unapproved live finance, donor messaging, secret, payment/RBAC/schema/CSP or infrastructure mutation.

**Next:** Run fresh exact-head CI for reconciled #1013 and its separate ready-state validation; protected SHA-guarded merge only after acceptance. Independently verify actually removed refs and preserve financial/unmerged/recovery branches.
