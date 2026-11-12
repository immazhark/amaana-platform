# Public JSON-LD query-bearing route rejection — 12 November 2026 IST

**Single writer:** CHATGPT_ACTIVE. **Base:** `cbb113a1fdc44bc2a9ef7f0bd36eb08ecf5097ac`. This is a narrow public-content JSON-LD privacy and canonical-identity guard, not a new SEO acceptance certification. Separate from sitemap database slug PR #804 and its tests; #803 ledger and #805 mobile footer remain independent; #684 financial activation held.

## Defect and acceptance

The current `normalizeStructuredDataPath` verifies internal origin and private-route boundaries, but returns `url.pathname + url.search + url.hash`. As a result, a public Article/WebPage or breadcrumb path inadvertently containing `?preview=synthetic-private-token`, `?reference=synthetic-record` or tracking query may enter machine-readable public JSON-LD. No real exposure has been observed; the guard is needed so private query strings are never made search-discoverable through this renderer.

**RED-first:** new synthetic `src/lib/structured-data.test.ts` cases require rejection of query-bearing path identities; existing test explicitly requires preserving ordinary `#details` fragments. Prove this exact failure in hosted CI before changing production source. **GREEN:** reject URLs whose `.search` is nonempty before returning the normalized route; keep all other policy and schema behavior unchanged. Do not infer full AF-R080 closure from this sub-scope.

Full exact-head fast/browser/database/production/security checks, separate ready-state and protected expected-head merge required; validate Railway deployment SHA and independent public version/readiness. No auth, donation/payment, tax, schema, private media, origin setting, CSP, secret, worker, or infrastructure change. Rollback reverts scoped source, test and documentation.

## Verified RED and GREEN evidence

Test-only head `374381e78409b79352c9ea71135284785fcea3b2` ran hosted CI `43194661712`: fast job `131102521447` failed **only** the added query-bearing path test, showing `/stories/reviewed?preview=synthetic-private-token` survived normalization; 2,969 other tests passed (20 previously skipped). This establishes the original source defect using synthetic data. GREEN source commit `a21ac83e4cd54ad24e40a50863e85d8e07eb1ba4` adds exactly `url.search` to the existing fail-closed URL guard; prior `#details` fragment behavior, private routes and image validation remain unchanged. Full GREEN CI and separate promotion are still required; do not claim merged/live here.
