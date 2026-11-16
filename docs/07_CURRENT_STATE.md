# Amaana Foundation — current release state

**16 November 2026 IST.** Dated checkpoint; one implementation writer `CHATGPT_ACTIVE`. Live main and Railway must be checked independently before release.

| Boundary | Last verified result |
|---|---|
| Protected source main | `5b1ed49c419c0e411df0b4d55d34f1fb15289136` after SHA-guarded #1013 squash merge |
| Prior source fix | #1011 public Unicode boundary merged `edcaf99ff21733c37937e8c326624e8e41a14267`; full and ready-state CI passed |
| AF-R005 scanner hardening | #1012 merged `ec4257e3019100e40bc12b94785588bf9b150c7b`; full CI `43879100931`, separate ready `43903458365`; Railway SKIPPED for scripts-only change |
| AF-R079 wave 12 | #1013 merged `5b1ed49c419c0e411df0b4d55d34f1fb15289136`; full CI `43903831773`, ready `43909188218`; guarded retirement workflow `43909362176` SUCCESS; all 25 manifest refs and #1013 task branch independently absent |
| Website runtime | Last independently fetched public version `edcaf99ff21733c37937e8c326624e8e41a14267`, main/production; readiness `ready`. Out-of-watch subsequent merges SKIPPED; do not force rollout |
| Current cleanup task | `chore/af-r079-reviewed-history-wave13-20261116`: proposed AF-R079 wave 13, 25 new exact-SHA-pinned merged refs from #659–#685 excluding unmerged #679 and held finance #684. No wave-13 deletions before guarded workflow |
| Held PRs | #684 official domestic UPI QR (account/settlement/provider authorization) and #845 staging eligibility/payment scope are unmerged; preserve both |
| 149-item master | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable = **149** |

**Safety:** Manifest is a reviewed proposal, not evidence of deletion. Guard rechecks original merged PR, live branch SHA, current-main ancestry, retain/protected state and open dependent PRs. Domestic INR only, no FCRA; 12A/12AB provisional, 80G unresolved. Redact public identifiable donor/beneficiary faces and remove EXIF/GPS. No unsolicited finance/payment/RBAC/CSP/schema/secret, infrastructure, cron, donor messages or production-data changes.

**Next:** Run #1014 wave-13 exact-head full and separate ready-state CI, protected SHA-guarded merge if green, then independently census actual retirement; continue isolated source hardening after safe boundary.
