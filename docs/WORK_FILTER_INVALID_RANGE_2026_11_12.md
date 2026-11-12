# Our Work invalid range filters — 12 November 2026 IST

Branch `fix/work-filter-invalid-range-20261112`, base `6bd58c74252227dbce68ed35fa3d160f5f423078`.

The year extractor explicitly rejects reversed or over-100-year ranges, but returned the start year as a fabricated single-year classification. This exposed a year option and accepted its filter despite the range having failed validation. The published-edition timeline already rejects reversed periods. No malformed live record was observed.

Test-only commit `24fc281` reproduced the issue: 30 passed, one failed; expected `[2025]`, received `[2026, 2025, 1900]`. The correction returns no dates for the invalid range, while preserving the published record in the unfiltered portfolio. Explicit year precedence, start-only/end-only endpoints and ordinary inclusive ranges remain supported.

Focused validation: `vitest run src/lib/work-filters.test.ts src/lib/discovery-query-normalization.test.ts src/lib/discovery-raw-query-length.test.ts`. Exact-head hosted CI, separate ready-state promotion, independent review, protected merge and deployment/public checks remain required. No media, finance, permissions, schema, infrastructure or canonical 149-row classifications changed. Rollback: revert this scoped source/test change.
