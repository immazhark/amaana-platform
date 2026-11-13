# Gallery dialog-root keyboard containment — 12 November 2026 IST

Base: `247259a6d1ec43fadfa2091e8a446ab37aa062ef`. Branch: `fix/gallery-dialog-root-focus-20261112`.

The gallery dialog already has `tabIndex={-1}`. When that container receives focus, backwards Tab must remain in the modal. The existing trap wrapped only from the first control or from outside the dialog; since a DOM element contains itself, the root was omitted and Shift+Tab could leave the modal. The focus fixture now models `contains(self)` correctly. One condition adds the dialog root to the existing backwards wrapping boundary. Forward Tab remains native.

RED: test-only commit `7b065fc` reported one failing Shift+Tab containment assertion and 14 passes. GREEN: 26 focused gallery tests passed, with zero skipped. Full TypeScript, scoped ESLint, browser-spec syntax and diff checks passed. Two actual-page browser cases focus the real dialog root, press Tab/Shift+Tab, assert Close/Next focus, close with Escape and verify opener restoration. Hosted browser execution remains pending; syntax validity is not a browser pass.

Exact files: `src/components/campaign-media-gallery.tsx`, `src/components/campaign-gallery-focus.test.tsx`, `e2e/campaign-gallery.spec.mjs`, this note. No filtering/publication, assets, private data, auth, payments, schema, CSP, provider or infrastructure changes. Original 149-item totals unchanged; no full AF-R042 accessibility acceptance is inferred. Require independent review, full exact-head CI, separate ready-state, protected SHA merge and separate Railway/public identity checks. Rollback: revert the narrow trap condition and scoped regressions.
