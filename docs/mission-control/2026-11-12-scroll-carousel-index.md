# Public ScrollCarousel initial-index boundary — 12 November 2026 IST

**Single writer:** CHATGPT_ACTIVE. **Task branch:** fix/scroll-carousel-nonfinite-start-20261112, base main 99fef460d493d21629f83f9612c33808e8ca8ec8. Independent from draft #814 public participation-link scheme protection. These branches modify disjoint source and test files. The existing active-writer ownership is unchanged.

**Observed source defect hypothesis:** ScrollCarousel initializes its state with Math.min(Math.max(startAt, 0), lastIndex). NaN remains NaN, producing invalid accessible progress and no active slide; Infinity selects the last slide even though it is not a valid requested index, and fractions leak fractional progress. Inputs are statically typed numbers but runtime calculations can yield invalid values. No claim is made that production currently passes these values.

**RED:** New synthetic server-rendered component test covers non-finite inputs, fractional input and normal bounded integer behavior. The test must fail on current code before production-source changes. Existing positive integer semantics must remain.

**GREEN proposal:** Clamp a finite, truncated index; fall back to first slide for non-finite input. No changes to keyboard navigation, carousel drag, auto-rotation, accessibility copy, styling, media, privacy, donors, payments, schemas or infrastructure. No new dependencies. Require exact-head full CI, separate ready-state, protected SHA merge, Railway and independent public version/ready checks. Rollback only the isolated source/test/documentation changes. Original 149-item counts unchanged.

## Hosted RED and scoped GREEN

- Test-only head `9d51c2e97fdacbcb0aed1d0b919715828c4f074f` failed hosted CI `43221542173`: exactly two added SSR cases for NaN and positive Infinity failed. The markup showed `NaN / 2`, `aria-valuenow="NaN"`, and no active slide for NaN; positive Infinity incorrectly selected the second slide. Six existing/new compatible cases passed.
- The initial fractional test with only two slides was insufficiently sensitive because max-index clamping incidentally produced an integer. Test commit `2ef8f9f92fb21de9763f0b16235a48dcea6ce35a` added a third slide for the fractional case; at baseline, 1.75 with three slides gives progress 2.75 instead of slide 2.
- GREEN source commit `7b39d40577ffdd307cd296e476d4d20ef7b5a879` changes only the initial state calculation to finite truncated input or zero. Integer clamping and keyboard/drag/rotation logic remain unchanged. The new complete exact-head checks and separate ready-state are still mandatory.
