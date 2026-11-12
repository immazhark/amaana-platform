# Carousel keyboard Resume with retained focus — 13 November 2026 IST

Base: `618bb96e5a5986197ff50e9ce7033a0d9204cd45`. Branch: `fix/carousel-keyboard-resume-20261113`.

The rotation control changes to Pause after keyboard activation of Resume, but the interval also rejected `:focus-within`. Focus intentionally remains on the control, so the requested rotation did not start until focus left. The existing `paused` state already persists focus-entry suspension and is cleared only by explicit Resume. The correction removes only the redundant interval focus selector, retaining hover suppression, document visibility, drag ownership, intersection visibility, reduced-motion gating and the persistent pause state.

Contract: the existing Resume/Pause labels and focus-entry tests require an explicit restart. The WAI-ARIA APG [Carousel keyboard interaction](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) states that the rotation control can restart rotation without moving focus. This is a focused behavior correction, not full accessibility acceptance.

RED: test-only commit `53c7cb5` failed the real interval-handler assertion after explicit keyboard Resume with retained focus; eight other tests passed. GREEN: all 41 carousel rotation, interaction and start-index tests passed, zero skipped. Full TypeScript, scoped ESLint, browser-spec syntax and diff checks passed. The existing real-page restart regression is strengthened to keep/assert rotation-control focus before and after automatic advancement; it no longer blurs away the defect. Hosted browser execution remains required.

Exact scope: `src/components/scroll-carousel.tsx`, `src/components/scroll-carousel-rotation.test.tsx`, `e2e/body-carousel-new.spec.mjs`, this note. No new dependency, design change, media publication, private data, payment, auth, schema, CSP, provider or infrastructure change. Original 149-item totals unchanged. Require independent review, fresh exact-head CI, separate ready-state, protected SHA merge and separate Railway/public verification. Rollback: revert the one selector change and focused regressions.
