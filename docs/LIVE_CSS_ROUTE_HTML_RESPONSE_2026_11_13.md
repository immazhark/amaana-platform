# Public route CSS audit: require HTML page responses — 13 November 2026 IST

Base: `618bb96e5a5986197ff50e9ce7033a0d9204cd45`. Scope: read-only `scripts/audit-live-route-css.mjs` and its native synthetic tests. No website, payment, database, provider or infrastructure changes.

Previously a successful JSON or plain-text route response was parsed as HTML and returned a valid zero-stylesheet/zero-byte sample. The documented metric observes stylesheet links in initial HTML; a non-HTML response is a missing sample, not zero CSS.

RED test-only commit `05cda4b57db8d4808bd30eaf6fedb4c000cf8ffb`: `node --test scripts/test-live-route-css.mjs` reported 90 passed and one failure (missing expected rejection). The correction validates `text/html` before reading the page body, retaining mixed-case MIME and charset parameters. GREEN: 91 passed, zero skipped; `git diff --check` passes. Tests reject absent/empty, JSON, plain text, HTML-like and unsupported XHTML MIME without reading bodies or fetching CSS.

No new public measurement or performance claim is made. Original 149-item classifications remain unchanged. Fresh exact-head CI, independent review, separate ready-state and guarded merge remain required. Rollback: revert only the route response check and scoped tests.
