# AF-R082 — indexability requires canonical root origin

Date: 12 November 2026 IST. Bounded indexing-safety improvement; **not** a search-ranking claim.

RED: Existing `shouldAllowIndexing` permits a configured official-host URL with `/preview`, `?preview=true` or `#draft`; it checks scheme, host, environment, flag, credentials and port but not path, query or hash. An isolated Node reproduction using the same condition returned `true` for all three bad cases and `false` after adding the new condition. Test-first Vitest cases add these and a www/path variant to existing valid official-root/default-443 coverage.

GREEN: one condition `url.pathname === "/" && !url.search && !url.hash` before the existing host test, no new dependency, no staging indexing activation. Valid canonical root URLs retain their prior values.

Acceptance: exact-head fast/type/build/browser/DB/security per plan, independent review, separate ready-state and expected-head merge. Source change under src may deploy; verify Railway SHA/public readiness and preview robots/sitemap. This is a *subset* of AF-R082: external Google/Bing ownership, live crawl and preview acceptance remain open. No donor/payment/recipient/media/schema/auth/CSP/cron/provider/infra change. Revert the small PR for rollback.
