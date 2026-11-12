# Public ScrollCarousel initial-index boundary — 12 November 2026 IST

**Single writer:** CHATGPT_ACTIVE. **Task branch:** fix/scroll-carousel-nonfinite-start-20261112, base main 99fef460d493d21629f83f9612c33808e8ca8ec8. Independent from draft #814 public participation-link scheme protection. These branches modify disjoint source and test files. The existing active-writer ownership is unchanged.

**Observed source defect hypothesis:** ScrollCarousel initializes its state with Math.min(Math.max(startAt, 0), lastIndex). NaN remains NaN, producing invalid accessible progress and no active slide; Infinity selects the last slide even though it is not a valid requested index, and fractions leak fractional progress. Inputs are statically typed numbers but runtime calculations can yield invalid values. No claim is made that production currently passes these values.

**RED:** New synthetic server-rendered component test covers non-finite inputs, fractional input and normal bounded integer behavior. The test must fail on current code before production-source changes. Existing positive integer semantics must remain.

**GREEN proposal:** Clamp a finite, truncated index; fall back to first slide for non-finite input. No changes to keyboard navigation, carousel drag, auto-rotation, accessibility copy, styling, media, privacy, donors, payments, schemas or infrastructure. No new dependencies. Require exact-head full CI, separate ready-state, protected SHA merge, Railway and independent public version/ready checks. Rollback only the isolated source/test/documentation changes. Original 149-item counts unchanged.
