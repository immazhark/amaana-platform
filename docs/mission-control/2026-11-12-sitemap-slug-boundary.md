# AF-R080 — Public sitemap database slug boundary (12 November 2026 IST)

**Writer:** CHATGPT_ACTIVE, sole repository implementation writer. **Scope:** this one source hardening task, separate from docs-only #803, financial #684 and merged discovery #802. Starting main `cbb113a1fdc44bc2a9ef7f0bd36eb08ecf5097ac`.

**Reproduction:** `src/app/sitemap.ts` maps Published/verified DB rows directly to `/our-work/${slug}`, `/stories/${slug}`, `/faith-and-reflections/${slug}`, and `/appeals/${slug}`. Existing status, consent and confidentiality filters are important but do not validate the string value of a historical/imported slug. Mocked published records with query delimiter, `../`, fragment delimiter, or encoded slash would produce malformed, misleading discovery URLs. This is a potential source guard gap, not a claim that such records currently exist or have been indexed.

**RED first:** `src/app/crawl-metadata.test.ts` adds a synthetic fixture with four malformed published slugs and four valid counterparts. Guard must exclude invalid while retaining valid, retaining existing indexing-disabled behavior. **GREEN to implement only after RED is verified:** add a strict canonical hyphenated slug predicate with the same format already used by existing public routing/structured-data guards, and filter DB sitemap entries before interpolation. No DB migration, schema, taxpayer/payment logic, publication toggles, media, production state or private record access. Keep appeal and faith review gates unchanged.

**Acceptance:** exact-head fast/typecheck/lint, browser, production, database and security CI; independent review, separate ready-state, expected-head protected merge, then Railway SHA and public readiness. AF-R080 remains Not started/Partial pending complete rich-results live acceptance; do not close the original backlog row for this narrow guard. Rollback only this predicate, filtered maps and isolated tests/documentation.

## Hosted RED and scoped correction

The test-only head `c0e1ca04f5160dd457200d49d8c72b7595f7692a` failed exact-head CI `43191746635`: fast job `131092609923`, one new `crawl-metadata.test.ts` failure. It directly observed `/our-work/bad?token=private` in emitted sitemap URLs. All other 2,969 executed tests passed, with 20 pre-existing skips. The run intentionally did not enter browser/database/production jobs after the RED failure.

After that failure, code head `f29f59f688cfbee1e4a7f7598a86414def26f587` added one `isCanonicalSitemapSlug` format predicate in `src/lib/sitemap-privacy.ts` and filtered four database-derived collections before URL interpolation in `src/app/sitemap.ts`. Pattern matches existing strict hyphenated public slug formats and caps at 200 chars. The statuses, appeal confidentiality checks, faith reviews, and published route list are unmodified. Full GREEN exact-head CI, ready-state and live verification are **not** presumed.

