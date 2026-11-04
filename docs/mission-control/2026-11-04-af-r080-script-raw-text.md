# AF-R080 — Ignore inert script raw text in public entity-schema measurement

**Date:** 2026-11-04 IST. **Risk:** read-only audit false positive. In a valid public HTML document, an ordinary inline script string containing `<link` is raw text. The current `neutralizeQuotedMarkup` treats it as an unclosed active HTML tag, rejecting the complete public schema report. This is not evidence of a malformed actual organization or rich result.

**RED:** test-only commit cd3e115e496a6c4e71bb7202a02b2ad77fc3712b, GitHub Actions run 41744717000. The native public schema audit suite had 18 passing existing cases and one intentional new failure with exact error `Unclosed public HTML tag` from neutralizeQuotedMarkup. Other jobs were skipped after red fast check; do not report them as passed.

**Correction:** Within the already parsed script opening tag, copy raw content through the next real `</script>` without interpreting tag-shaped JavaScript text. Keep unclosed script fail-closed. Existing active canonical, organization/website identity, JSON-LD parsing, private-link, markup spoofing and noindex assertions remain intact.

**Release:** require full CI on resulting head, independent scoped review, separate ready-state promotion, SHA-guarded merge and Railway disposition. No site runtime, donor, payment, schema, media, secret, live notification or infrastructure mutation; no Google rich-result approval implied. AF-R080 historical state remains Not started/partial acceptance pending, canonical 149 denominator unchanged. Rollback by reverting narrow PR.
