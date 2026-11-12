# AF-FUNNEL — Anonymous public discovery page coverage

Date: 12 November 2026 IST. Scope: **three already-public, static routes**, not private lead tracking, donors or new acquisition claims.

## Verified missing coverage and test-first correction

The existing `trackablePublicPath` exact allowlist omitted `/team`, `/get-involved/volunteer` and `/impact/compare`, even though these are already published public static pages. As a result, the shared `normalizePublicAnalyticsPath()` returned null and both first-party page-view and opt-in Web Vitals reporters excluded these routes. An exact source-regex reproduction confirmed all three fail the current allowlist.

RED-first Vitest additions require these routes to normalize to **only their static paths**, to count one non-automated current document visit, to exclude automated probes, and to reject deeper/private or query-bearing forms. The existing Web Vitals path test shares the same allowlist. 

GREEN: Add these three exact route patterns to the existing allowlist. Reuse unchanged `analytics-ingestion.ts`, same-origin and rate-limit checks, private/beneficiary slug scrubbing, automated-browser exclusion, daily aggregate schema and best-effort transport. No names, IP addresses, session IDs, lead emails, query strings or other individual identifiers are newly collected; no new database table or retention behavior. This increments **anonymous daily route counts** on eligible real public visits, not conversion totals.

## Acceptance and limits

Run exact-head fast, isolated tests, TS/lint/browser/production/DB/privacy-security checks, separate ready-state, SHA-guarded merge. As source changes under `src/**`, a website deployment may occur; independently verify live SHA and readiness. Keep AF-FUNNEL Partial: no server-confirmed donation funnel, campaign attribution, form submission tracking, or field Web Vitals report is claimed. The publication of an already-existing page is distinct from tracking any private application/transaction page. No payments, donor communications, auth/RBAC, schema migration, public media, CSP, cron or infrastructure changes. Revert the isolated PR for rollback.
