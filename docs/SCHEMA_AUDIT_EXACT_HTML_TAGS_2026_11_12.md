# Exact canonical and robots tag observation — 12 November 2026 IST

Base: `6bd58c74252227dbce68ed35fa3d160f5f423078`. Scope: read-only `scripts/audit-public-schema.mjs` and its native synthetic regression suite. No application, database, payment, provider or infrastructure behavior changes.

The HTML observer used a word boundary after `link` and `meta`. Hyphenated or colon-prefixed custom elements therefore supplied false canonical URLs or false noindex observations. Synthetic HTML reproduced structure-valid output from `<link-card rel="canonical">` and a NOINDEX result from `<meta-note name="robots" content="noindex">`.

RED: test-only commit `d8181c0`; `node --test scripts/test-public-schema-audit.mjs` reported 21 passes and two failures. GREEN: replace only these two tag boundaries with HTML tag-name delimiters. The same command passes all 23 tests, zero skipped; genuine newline-separated and self-closing tags remain accepted. `git diff --check` passes.

This corrects local observation, not website schema or external search-engine acceptance. No original 149-item classification changes. Exact-head CI, independent review, separate ready-state and protected merge remain required. Rollback: revert the two regular expressions and scoped regression additions.
