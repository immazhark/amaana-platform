# First-party Core Web Vitals rollout

**Status:** Code-only candidate. Disabled until explicitly enabled in production.

## Purpose and data minimization

- Records only LCP, INP and CLS on allowlisted **public page paths**.
- No query string, assistance tracking path, donation receipt path, admin page, client IP,
  browser fingerprint, unique metric ID, raw timing entry or personal information is retained
  in the aggregates.
- A page load is sampled at 10%; repeated updates of one metric ID are collapsed in the browser.
- Browser reports send only `{path, name, value}`; the server validates every field,
  classifies the metric into coarse performance buckets, and retains only daily counters.
- Same-origin requirement and the existing anonymous analytics hourly abuse limit apply.
- A 90-day aggregate retention window is enforced during the authenticated notification job.
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
3. Enable `NEXT_PUBLIC_ENABLE_WEB_VITALS=true` **only in production** after privacy and
   hosting-cost review; redeploy so Next.js injects the public build-time flag.
4. Verify three daily aggregate metrics on known public paths using real browser visits;
   do not synthesize production metric traffic as a passing performance result.
5. Monitor daily aggregate row growth, database write rate, error budget, LCP/INP/CLS
   bucket distribution, and Railway usage.
6. To disable, set `NEXT_PUBLIC_ENABLE_WEB_VITALS=false` and redeploy. Already collected
   aggregate rows expire through 90-day maintenance.

## Privacy and reliability

No identifiers are stored by `DailyWebVital`. Aggregate counts are not a way to
identify donors, beneficiaries, administrators or other individuals. This is an
observability instrument, not a legal/compliance or performance certification.
Keep the feature opt-in until the live deployment checks are complete.
