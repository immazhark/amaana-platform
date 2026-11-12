# Current mobile navigation link focus — 12 November 2026 IST

Base: `6bd58c74252227dbce68ed35fa3d160f5f423078`. Branch: `fix/mobile-current-link-focus-20261112`.

Selecting an already-current destination in the mobile menu calls `closeMenu()`, hiding the link that owns keyboard focus. The pathname does not change, so this path has no new-route focus destination. The correction restores focus to the visible menu toggle for an unmodified primary activation of the current pathname. Other route transitions retain Next.js focus management; modified, non-primary and previously handled activations do not receive new focus behavior. Desktop and no-JavaScript navigation are unchanged.

RED: test-only commit `c0a46a9` reproduced three missing focus restorations (primary, secondary and Donate link), while seven route/modifier boundary cases passed. GREEN: the corrected actual handlers pass all ten new tests and the combined 32 header/navigation tests. Scoped ESLint and browser-spec syntax checks passed. Full TypeScript check passed. Hosted release acceptance remains separate.

Two actual-page browser regressions exercise keyboard Enter on current About and Contact links, menu closure, toggle focus and scroll-lock release. They require hosted browser execution; syntax validity is not a browser pass. Full exact-head CI, independent review, separate ready-state, protected SHA-guarded merge and separate Railway/public verification remain required. This narrow AF-R042 improvement does not close its physical assistive-technology/zoom acceptance or reclassify the 149-item ledger. No payment, auth, schema, CSP, data, media, provider or infrastructure changes. Rollback: revert this component change and its focused tests.
