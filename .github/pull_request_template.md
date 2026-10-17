## Purpose

<!-- One independent donor, beneficiary or staff outcome. Separate unrelated enhancements, defects and refactors into their own PRs. -->
This PR delivers ...

## Acceptance criteria

- [ ] The complete feature works from entry point to final user-visible result.
- [ ] Failure, privacy, accessibility and mobile states match the specific feature contract.

## Verification

- [ ] Focused RED→GREEN regression tests: command and results recorded below.
- [ ] Exact-head CI (lint, types, relevant tests, production build, budgets and browser journeys) passed.
- [ ] The reviewer inspected actual behavior, not only mock assertions.

<!-- Include exact run URLs, test commands and any explicit unverified gates here. -->

## Release plan

<!-- Feature flag/default state if applicable; data migration and rollback/disable path; post-merge Railway SHA/live verification. No partially functional public releases. -->
Deploy on approved merge to main only, after exact-head gates pass. Rollback: ...

<!-- For >25 changed files, add "## Scope rationale" with a substantive explanation of why all files are inseparable within ONE feature. An exception is not permission to bundle features. -->
