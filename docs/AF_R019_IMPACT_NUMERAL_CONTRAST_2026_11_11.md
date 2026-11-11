# AF-R019 — Impact principle numeral contrast

Date: 11 November 2026 IST. Writer: CHATGPT_ACTIVE. PR #770.

## Reproduction and measured discrepancy

The live-source Impact philosophy section `.v2-impact-philosophy` has a pale `linear-gradient(135deg,#f7f3eb,#fffdf8)` background. Its four semantic ordinals (01–04) in `.v2-impact-principles span` used bright brand `--v2-gold` (#E0B318). Computed relative contrast on those two endpoints is **1.78:1 to 1.94:1**, below the WCAG AA 4.5:1 normal-text threshold; even the 3:1 large-text threshold is not met. These are source-color calculations, not observed field Web Vitals or a physical screen-reader test.

The approved `--af-color-gold-ink` (#604407) measures **8.15:1 to 8.88:1** on the same endpoints. The global bright brand gold remains unchanged for dark-surface accents and decorative uses.

## Test-first correction

- Test-only head `3851fe827bf207e49cddb549d769648839f74826`, hosted RED CI `43049687660`, fast job `130623194093`: the new native contrast invariant failed on the actual old `var(--v2-gold)` declaration against expected `var(--af-color-gold-ink)`.
- Correction commit `2611e003ff8f435afbe93e1b67f9867fbb3da7cc`: change just one selector in `src/app/impact.css` to approved `--af-color-gold-ink`, preserving typography, gradient, geometry, content, route and identity.
- Native source test verifies actual gradient endpoints, exact semantic ink, >=4.5:1 contrast at both endpoints and the original bright-gold insufficiency.

## Release and remaining acceptance

Full exact-head source/production/browser/database/final CI, independent review, separate ready-state and expected-head protected merge are required. Actual rendered zoom/physical assistive-tech acceptance remains separate; this does not close full historical AF-R019. Concurrent disjoint #769 scanner tooling PR has its own CI. Financial #684 remains held for independent payee/routing verification and separately scoped activation. No auth, payment, donor data, medical case, media, schema, secret, CSP or Railway configuration changed. Historical 149-item classifications remain unchanged.

Rollback: revert the single CSS declaration and associated test/evidence if incompatible.
