# AF-R047 — Reject malformed App Router page asset lists

**Observed 4 November 2026 IST.** The Next.js route bundle measurement `summarizeAppRouteBundles` silently filtered a `/page` manifest entry when its asset list was not an array, provided another valid page existed. The resulting report falsely appeared complete. This is a read-only measurement defect, not runtime website JavaScript loading evidence.

**Test-first RED:** PR #644 synthetic native test, head `c3fe36774c6f16cb85f023aa588d6fc710846dd3`, hosted CI `41739252156`: 56 existing native route-bundle reporter tests passed; exactly one added assertion failed with `Missing expected exception`. Selected downstream CI jobs were skipped after fast failed.

**Smallest repair:** Collect all App Router `/page` entries first, then reject non-array asset lists. Preserve unchanged file/path filtering, size checking, inherited layout attribution and legitimate empty arrays.

**Release:** New candidate reconciled onto main `2c1db4e8e526d193291f0f31cdf6bcfc37b60619`. Run complete exact-head CI, independent scoped review and separate ready-state promotion, followed by expected-head guarded merge. The audit is uncompressed build-file attribution only; no network transfer, LCP, INP, CLS or real user CWV claim. No runtime application, donor, payment, schema, public media, private data, Railway settings, cron or secret change. AF-R047 remains Partial; total historic 149 classifications unchanged. Revert this PR for rollback.
