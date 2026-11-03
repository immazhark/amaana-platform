# AF-R025 — shared multiline SectionHeading leading (4 November 2026 IST)

**Scope:** Existing public overview SectionHeading uses `.heading.heading :global(.v2-section-title)` with line-height 1.04, a tight ratio for titles which wrap at 320/390px. Existing PageHero was separately corrected to 1.14. Change this one shared component declaration to 1.14; do not redesign or alter typography scale, fonts, color, content, assets, routing, breakpoints, permissions or data.

**Fail-first evidence:** Draft PR #639 on branch `fix/shared-section-heading-leading-20261104`, accepted main `a9692b2246f2dd86f9ae76a1e0f81eed9b3a8828`. RED source head `79c4ffce657124a6a77b521f92615ba031cff8a3`, hosted CI `41702386991`: new native assertion expected >=1.12, received 1.04; one expected failure, 2,601 other Vitest passes and 20 isolated DB skips. Four browser cases on actual /our-work and /stories at 320px/390px added before source correction; tests assert visible, wrapped, readable multiline heading and no horizontal title escape.

**Implementation:** `a852c93e0f0138e740f61c68f1848ae6e9e8b6c7` changes `src/components/section-heading.module.css` line-height from 1.04 to 1.14. No TypeScript, CSS cascade elsewhere, backend, media or dependency change. No invented accessibility certification. A measured browser check is still required.

**Release gates:** final exact-head CI (plan, fast, production, database, browser, verify); resolve reviews; promote draft and obtain separate ready-state CI; protected expected-head merge; Railway outcome and independent public version/readiness. This is a bounded AF-R025 source correction, not full 149-item closure or physical assistive-technology approval. Rollback by reverting this PR.
