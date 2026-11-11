# AF-R024 — CSS constant `calc()` arithmetic font floor

**Date:** 11 November 2026 IST. **Writer:** CHATGPT_ACTIVE (sole implementation writer). **Scope:** improve the existing static accessibility audit; no public CSS values or runtime UI modified.

## Reproduced scanner defect

The existing `scripts/public-font-floor.mjs` enforces a literal 12px / 0.75rem minimum. Before this correction it scanned numeric *operands* inside CSS calculations, so it missed a font size computed below the floor (`font-size: calc(1rem * .5)` or `calc(1rem / 2)`) and falsely rejected a safe larger size (`font-size: calc(11px * 2)`). These are valid fully constant CSS expressions; multiplication and division by unitless numbers are part of the [CSS `calc()` syntax](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/calc).

**Native hosted RED evidence:** test-only head `f33cbb20a9efd998201d989cd1788305a97f1ad7`, run `43021729363`, fast job `130526390625`, failed exactly at `Guard public CSS minimum type size` in `constant CSS calc arithmetic cannot bypass the public 12px font floor` (assertion showed the missing `calc(1rem * .5)` and `calc(1rem / 2)` diagnostics). Existing tests covered literal sizes and clamp bounds; this is an incremental verified regression.

## Minimal correction and explicit limits

Candidate source change `7a3670b6edd93c8f571e8c8ea2c3457afa3ab999` evaluates only standalone **fully constant** `calc()` in `font-size` containing one `px` or `rem` operand and a unitless multiplier or divisor (including inverse-order multiplication). It checks the *computed* value against the same existing 12px / 0.75rem literal guard, and conservatively flags non-finite results such as division by zero. `clamp`, mixed-unit/dynamic calculations, `var()`, font shorthand, computed browser styles, root font customizations, 200%-zoom and field accessibility remain outside this bounded source scanner. All other existing behavior is preserved.

No imported dependencies, public stylesheet edits, donor or beneficiary imagery, authentication, RBAC, payment, webhook, secrets, schema, CSP, build configuration, hosting or outbound communications change. This does **not** fully accept AF-R024 or change the historical 149-item counts.

**Acceptance:** require final-head native GREEN suite and selected exact-head CI, source review, separate ready-state promotion, protected SHA-guarded merge and (if deployment watch rules select it) separate runtime verification. No skipped required check counts as a pass.

**Coordination:** base protected source main `b85ede6c7c51c189fbb7eb0b99dba562e9bd4478`. Independent draft PR #763 AF-R015 CSP tests and PR #764 AF-R052 gallery optimizer run non-overlapping CI. Financial activation PR #684 remains held pending independent payee and transfer-routing review. Rollback the small scanner/test/coordination changes only.
