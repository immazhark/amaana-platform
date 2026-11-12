# Public annual edition index runtime boundary — 12 November 2026 IST

**Scope:** Fail-closed rendering for malformed public annual-edition collection/record inputs. Independent source task based on main `4a2946524948ec2111c2f5634f3f7e7284d5afa6`. The existing React component `PublishedEditionIndex` and pure `approvedEditionTimeline` assume `editions` is a typed array and each row has string `title` and optional string `primaryMetric` and `primaryMetricLabel`. Runtime JSON/DB adapter discrepancies could cause synchronous exceptions, affecting public programme pages. No actual malformed production record has been observed.

**RED-first:** New synthetic Vitest cases at commit `729f80273615be313c29d4d9dc189f5c5ad1488c` require invalid list types and invalid rows to be excluded, and the two approved sample annual links to remain visible in the correct year order. Hosted test failure required before changing behavior.

**Proposed GREEN:** Validate Array.isArray before `flatMap`; reject null/invalid rows or unexpected non-string display fields before calling `.trim`, preserving strict slug/year checks, chronological order, existing metric caveat and no donation totals. No new dependency. Do not change public facts or claim a production incident. This is not a complete backlog item.

**Release:** Fresh exact-head fast, browser, database and production CI, independent review, separate ready-state and guarded merge; inspect Railway by merged SHA, independently check public version/readiness. Rollback: revert test and small component/documentation patch. No private data, payment, bank, UPI, provider secrets, media publication, RBAC, schema, CSP, cron or live infrastructure changes.

## Hosted RED and minimal correction

Test-only head `ec00b5a643166830aea9bfe92b0cb5a054352749` failed hosted exact-head fast CI `43197707755` (job `131112937772`): new published-edition regression threw `TypeError: Cannot read properties of null (reading 'flatMap')` at `src/components/published-edition-index.tsx:30`. The other 2,970 executed tests passed (20 already skipped); database/browser/production were skipped because RED intentionally failed. GREEN source commit `7b35730c9c2f9b460d7d98714ad3283530e7b90e` adds an Array.isArray guard and filters invalid individual display-field shapes before `.trim`. Existing published year, link order, metrics and text are unchanged. Fresh GREEN full CI and separate ready-state must pass before any merge.
