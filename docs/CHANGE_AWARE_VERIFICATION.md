# Change-aware verification

This policy governs implementation iterations. Existing factual locks, production approval, payment controls and bundle limits remain in force.

## Decision criteria

| Change | Required checks | Work omitted |
| --- | --- | --- |
| Markdown under docs/ or README only | Planner regression tests | Dependencies, application build, database and browsers |
| BodyCarousel, BodyCard or scroll-carousel component/style only | Existing fast guards, lint/types/unit checks; carousel suites, chrome regression suite and public performance checks | Unrelated browser journeys, Firefox/WebKit and bulk screenshot capture |
| Campaign media gallery component/style only | Existing fast checks; gallery interaction and public performance suites | Unrelated browser journeys and bulk screenshots |
| Multiple mapped components | Union of their suites, deduplicated | Suites outside the explicit map |
| Global CSS, shared shell, API, payments, authentication, migrations, dependencies, configuration, unknown path or unreadable diff | Full functional Chromium and Firefox/WebKit acceptance plus existing guards | Bulk launch capture during ordinary iteration |
| Verified integration merge | Production build, unchanged bundle budgets, coverage and server smoke | Repeated browser suite only when the exact tree matches the second merge parent and its latest PR CI succeeded |
| Direct push, conflict-resolution merge, missing proof or API error | Full acceptance | No speculative reuse |
| Main or manually dispatched release checkpoint | Full acceptance, all launch screenshots, production build/budgets/server smoke and applicable readiness gates | Nothing required by release policy |

The map is intentionally small. Extend it only after identifying affected consumers and adding planner regression cases. A filename being unfamiliar never means it is safe to skip checks.

## Algorithm

1. Read the current base and task head; compare the complete PR diff, not only the last commit. Push events compare the previous revision. Renames include both paths; deletions still select tests.
2. Classify each changed path. Documentation contributes no runtime impact. Mapped components contribute their suite sets. Any unmatched runtime path escalates to full acceptance.
3. Union and deduplicate selected suites. Production and manual release events override the classification to full verification.
4. On integration merges, reuse acceptance only with exact-tree equality and a successful latest CI run for the merged task head. API/diff uncertainty falls back to full checks.
5. Print the plan, selected suites and reason in the GitHub job summary before running checks. Do not manually discard a failing applicable check.
6. Cancel obsolete runs when a new commit supersedes them. Batch related corrections into one tested candidate; avoid publishing every tiny edit.
7. Fix failures locally with the failing test and adjacent mapped tests before publishing another candidate. Rerun broader checks only for new scope or unexplained failures.
8. Verify the served revision and affected live routes after staging deployment. CI fixture success is not live-site verification.

## Agent working algorithm

- Identify changed pages/components and acceptance criteria before editing.
- Run cheap checks first; reuse unchanged local artifacts only when source and configuration are unchanged.
- For UI fixes, inspect actual desktop/mobile rendering, keyboard behavior, reduced motion and relevant edge widths. Geometry alone does not certify appearance.
- Publish one coherent candidate after focused checks pass. The CI planner determines the remote scope.
- Keep status factual: implementation, local verification, PR CI, merge and deployment are separate states. Report failures immediately and avoid repeating unchanged polling updates.
- Record workflow durations after rollout. Do not promise a time saving until measured. Single-worker browser execution remains unchanged because shared-state isolation has not been established.

## Controls

`node scripts/ci-plan.mjs` prints the selection; set CI_BASE, CI_EVENT and CI_TARGET for a local preview. `node --test scripts/test-ci-plan.mjs` checks selection boundaries. GitHub Run workflow forces the release checkpoint. Marking a PR ready does not repeat application acceptance; the production readiness job still runs on that transition.

No new application dependency or rendering behavior is introduced by this workflow change. Production promotion still requires owner approval. Required branch-protection configuration must be checked separately; it is not inferred from workflow source.

## Job separation and expanded mapping

Fast validation, isolated refund database validation, production build/smoke and browser acceptance are separate jobs. The stable `verify` job aggregates selected results and rejects any failure or cancellation. Browser and production jobs may run independently after fast checks. Presentation-only mapped changes skip the database ledger job.

Header/footer, Home/portfolio presentation components, canonical content JSON, approved brand/background assets and informational page components have explicit focused mappings. Shared root layouts, global CSS/motion/navigation, backend and dependency changes retain full acceptance. This is dependency-based path filtering; trigger-level paths-ignore is deliberately avoided because skipping the whole workflow can leave required GitHub checks pending. Documentation still gets a successful lightweight plan and aggregate gate.

The policy reduces unnecessary verification; it does not certify zero latency or guarantee a particular delivery duration. Caching/indexing changes require a measured query or delivery bottleneck and are not applied speculatively to donation or private data routes.

Browser acceptance uses the official mcr.microsoft.com/playwright:v1.55.0-noble image, matching isolated @playwright/test1.55.0. Browsers and OS dependencies are preinstalled; runtime checks verify executable paths. Database uses the isolated postgres service hostname inside the job container. This removes slow Ubuntu mirror installation observed during PR122 (20-minute infrastructure timeout before tests began).
