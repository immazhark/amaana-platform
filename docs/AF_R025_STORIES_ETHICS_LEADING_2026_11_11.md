# AF-R025 — Stories editorial ethics heading leading

Date: 11 November 2026 IST. Writer: CHATGPT_ACTIVE. Draft PR #774.

## Verified source defect

The public /stories page renders three h3 ethic headings. Its `.ethicList article h3` CSS explicitly used line-height 1.08 against the project-established direct editorial multiline range 1.12–1.24. Direct read of the unchanged test-only branch reproduced 1.08. This establishes a source-level typography inconsistency and narrow-screen reflow risk, not a confirmed field visual collision.

## Test first

Test-only head `f87a1077eaea3fa7dfcbe5cae103f2be6f468538` adds `src/app/stories-ethic-heading-leading.test.ts`. Hosted GitHub CI `43057295964` fast job `130650165801`: RED with the new `AF-R025 stories editorial ethics heading reflow` assertion failing. No user/beneficiary record was generated.

## Scoped correction

Commit `c73e132da9385ddd63d700611b7922f6ca45b953` changes only the `.ethicList article h3` line-height from 1.08 to 1.16; all copy, numbering, size, privacy statements and media remain identical. Browser regression `762b95f9c7941b0ebfcfa3a1542f90d667a86d6c` checks the three actual public headings at 320px and 390px for computed line-height ratios and viewport bounds.

## Acceptance

Require fresh full exact-head CI (fast, production, database, browser, final verify), independent review, separate ready-state CI and protected expected-head merge. Browser simulation does not certify physical screen-reader or 200–400% zoom acceptance. #771–#773 remain separate disjoint review branches; held financial #684 is not activated. No payment, auth, schema, secret, media or infrastructure changes. Historical 149-item backlog classifications unchanged.

Rollback: revert the single CSS leading declaration and associated focused tests/evidence.