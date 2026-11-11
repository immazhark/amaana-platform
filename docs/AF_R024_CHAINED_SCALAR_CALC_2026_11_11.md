# AF-R024 — Chained literal CSS calc scalar floor audit

Date: 11 November 2026 IST
Writer: CHATGPT_ACTIVE; draft PR #768.

## Reproduced defect

The native public-font-size scanner folds standalone constant CSS calculations, but its operand fallback misses chained scalar products/quotients that compute to under 12px. CSS calc accepts multiple product operands (MDN calc formal grammar, consulted on 11 November 2026).

Test-only head `f32ab2699910bfd757c93945c60248433b25bb81` triggered GitHub CI run `43041939848`, fast job `130595839426`: the dedicated new regression failed. The scanner reported `[]` instead of four computed violations. Older additive and standalone assertions remained green.

## Minimal correction

Source commit `326239d081391b0f55499a18595cdf333b47f808` folds only literal length-first `calc()` chains with two or more `*` and `/` scalar operations. It checks final px/rem values against existing 12px/0.75rem floors and rejects non-finite results, including division by zero. The tests include safe large computed values and underfloor products. Mixed-unit, nested, variables and dynamic expressions retain the older fallback. No app CSS, public imagery, donor records, auth/RBAC, payment provider, CSP, schema or infrastructure change.

## Release and acceptance

A corrected-head full GitHub CI (fast, browser, production, database, final verify), independent source review, separate ready-state CI and protected expected-head merge are required before release. A successful scanner test is not proof of full accessibility or physical-device zoom. Do not reclassify the historical 149-item ledger. Financial PR #684 remains held for independent verified payee/routing and separately scoped activation.

Rollback: narrow revert of scanner, test, coordination and evidence changes.
