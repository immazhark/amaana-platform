# Amaana Foundation — current release state

**16 November 2026 IST.** Dated checkpoint, not a live feed. Single writer: `CHATGPT_ACTIVE`. Always recheck GitHub, Railway and public endpoints before release.

| Boundary | Last verified result |
|---|---|
| Protected source main | `edcaf99ff21733c37937e8c326624e8e41a14267` after guarded #1011 squash merge |
| #1011 release | Full exact-head CI `43874155904` and separate ready-state CI `43878838986` succeeded; Railway website `d2f140cf-7c87-4dfd-ab5e-113847162445` SUCCESS |
| Public runtime | Fresh public version endpoint reported `edcaf99ff21733c37937e8c326624e8e41a14267`, branch main, environment production, paymentMode live; independent readiness returned ready |
| Branch cleanup | 739 existing remote refs in complete nine-page census; 25/25 prior #1009 batch-11 manifest refs absent, #1011 task head absent |
| Active cleanup task | `chore/af-r079-reviewed-history-wave12-20261116`, batch-12 proposal: 25 merged, exact-SHA-pinned unprotected refs from PR #634–#658. No batch-12 deletions yet; guard must revalidate before deletion |
| Open source PR | #1012 draft, head `f4abe3d0d62f81846f3dde5a0f4512de44654511`, full exact-head CI `43879100931` pending last observation |
| Held financial PRs | #684 (receiving-account/UPI settlement and activation), #845 (payment eligibility) remain unmerged |
| 149 canonical total | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable |

**Infrastructure:** Railway project `amaana-platform-staging` contains environment `production`, with website, historical preview and parked annual notification worker, plus three buckets and zero volumes; no staged change at inspection. Do not activate parked worker or make an infrastructure apply.

**Safety:** Distinguish source, tested, merged, deployed, live-verified and full acceptance. Domestic INR only, no FCRA; provisional 12A/12AB, unresolved 80G evidence; redact identifiable faces and remove metadata for public derivatives. No arbitrary historical-branch or document purge. No unapproved live finance, donor messaging, secret, payment/RBAC/schema/CSP or infrastructure mutation.

**Next:** Test and review batch-12 guarded manifest, complete separate ready-state on unchanged head, then protected SHA-guarded merge if accepted. Independently verify actual removed refs. Continue #1012 only after its own full and ready-state gates.
