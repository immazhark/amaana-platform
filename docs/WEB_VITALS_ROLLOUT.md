# First-party Core Web Vitals rollout

**Status:** Code-only candidate. Disabled until explicitly enabled in production.

## Purpose and data minimization

- Records only LCP, INP and CLS on allowlisted **public page paths**.
- No query string, assistance tracking path, donation receipt path, admin page, client IP,
  browser fingerprint, unique metric ID, raw timing entry or personal information is retained
  in the aggregates.
- Automated browser visits are excluded from page-view and Web Vitals reporting when `navigator.webdriver` is set, reducing CI/AI-audit database writes (not comprehensive bot detection).
- A page load is sampled at 10%; repeated updates of one metric ID are collapsed in the browser.
- Both the browser reporter **and the ingest endpoint** reject collection unless the opt-in build flag is enabled.
- The root layout also omits the reporter subtree entirely for disabled builds to avoid unnecessary browser observers.
- Individual published appeal/story/initiative slugs are reduced to a page-family key **before transmission and again on server ingestion** for Web Vitals and page views, e.g. `/appeals/:slug`, lowering privacy and database-cardinality risk.
- Historical `DailyPageView` records from previous deployments may still contain individual slugs. Inventory and privacy-review these existing rows before calling retention/privacy remediation complete; this code change does not rewrite old data.
- Browser reports send only `{path, name, value}`; the server validates every field,
  classifies the metric into coarse performance buckets, and retains only daily counters.
- Same-origin requirement and the existing anonymous analytics hourly abuse limit apply.
- A 90-day aggregate retention window is **implemented** in the authenticated
  maintenance job; enforcement depends on that job actually running.
  If notification maintenance is suspended, these records will **not**
  be automatically pruned. Keep collection disabled until an active,
  reliable maintenance schedule is verified.
- Client reporting uses Beacon when accepted, falling back to a same-origin, keepalive fetch if Beacon declines or throws. Failed transport never interrupts a public or donation journey.
- Page-view idle callbacks recheck the current route to avoid counting a superseded navigation.
- An empty 204 response is deliberately returned for malformed, rejected or unavailable telemetry.
  Reporting failures never block donations or public navigation.

## Metric thresholds

| Metric | Excellent (Amaana target) | Standard good | Needs improvement | Poor |
|---|---:|---:|---:|---:|
| LCP (ms) | <= 1200 | <= 2500 | <= 4000 | > 4000 |
| INP (ms) | <= 50 | <= 200 | <= 500 | > 500 |
| CLS (unitless) | <= 0.05 | <= 0.10 | <= 0.25 | > 0.25 |

Bucket totals do **not** measure exact p75, page-transfer bytes, or visitor counts.
A sample under 75 observations for a metric+route+period is not enough for reliable conclusions;
avoid treating small samples as definitive.

## Release sequence

1. Deploy the database migration and application together. Confirm `prisma migrate deploy`
   succeeded before enabling collection.
2. Keep `NEXT_PUBLIC_ENABLE_WEB_VITALS=false` in preview and automated browser acceptance.
3. Confirm the authenticated notification/retention maintenance job is actually
   scheduled and succeeds; **do not enable** Web Vitals while this job is suspended.
4. Enable `NEXT_PUBLIC_ENABLE_WEB_VITALS=true` **only in production** after privacy and
   hosting-cost review; redeploy so Next.js injects the public build-time flag.
5. Verify three daily aggregate metrics on known public paths using real browser visits;
   do not synthesize production metric traffic as a passing performance result.
6. Monitor daily aggregate row growth, database write rate, error budget, LCP/INP/CLS
   bucket distribution, and Railway usage.
7. To disable, set `NEXT_PUBLIC_ENABLE_WEB_VITALS=false` and redeploy. Already collected
   aggregate rows expire through 90-day maintenance.

## Privacy and reliability

No identifiers are stored by `DailyWebVital`. Aggregate counts are not a way to
identify donors, beneficiaries, administrators or other individuals. This is an
observability instrument, not a legal/compliance or performance certification.
Keep the feature opt-in until the live deployment checks are complete.
