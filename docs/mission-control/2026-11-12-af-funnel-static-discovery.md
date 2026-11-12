# AF-FUNNEL — four additional public discovery routes (12 November 2026 IST)

## Exact scope and RED/GREEN evidence

Existing public sitemap routes `/recognition`, `/partner`, `/get-involved/sponsor-education`, and `/get-involved/monthly-giving` all have actual application pages, but the centralized `trackablePublicPath` in `src/lib/public-analytics.ts` did not accept them. This caused legitimate page views and Web Vitals using the common normalizer to omit these discovery visits. No assertion about real current conversion rates is made.

**RED-first:** commit `1db2c2df7ad33f74267da1225b34e8492b5dbdfa` extends `src/lib/public-analytics.test.ts` with positive checks on every exact path, no automated-browser recording, and negative checks on four nested/sensitive routes. A direct read-only evaluation of the actual baseline regular expression (blob `d7f8d95d0468b66402d75beec9ad7d43a3159a67`) confirmed all four public paths were excluded, while nested ones were already rejected.

**GREEN:** source commit `8355a88ca1357b422137b1b7fa93dbf79a87db63` adds only four bounded alternatives to the original allowlist. The resulting regex (source blob `e61c21e2d15c6ee839c78cb79f8e1404d4002f7b`) accepts all four exact routes and rejects their nested variants, /donate, /request-assistance, /admin and query-string variants. Existing dynamic programme/appeal/story slugs remain aggregated as `/:slug`; no raw detail URLs are stored.

## Release and rollback

This is an extension of the previous #797 public-route analytics subset, not a complete AF-FUNNEL conversion report or an analytics vendor integration. No new visitor IDs, cookies, IP tracking, case slugs, donor details, payload columns, schemas, payments, auth, media, notifications, infrastructure or consent-mode changes. It may increase aggregate counts for genuine anonymous visits to these routes using the existing endpoint. Synthetic acceptance visits remain excluded.

Require full exact-head fast, browser, production and database/security checks; independent review; separate ready-state CI; expected-head protected merge; Railway deployment identity and public readiness. Rollback reverts the exact allowlist alternatives and tests, without altering historical aggregate records. AF-FUNNEL remains Partial pending complete source-to-confirmed-contribution acceptance and privacy review.
