# Amaana Foundation engineering continuation — 14 October 2026

## 12:49 IST continuation — R-025 remaining appeal and Stories leading

Ownership: existing PR #292 / branch `fix/direct-transfer-feedback-20261013`. Verified latest source/tests head before checkpoint: `7f241f72aa0215fa854a52535733fe5bb6989c78`.

The appeals route stylesheet (`src/app/appeals.css`) still declared `line-height:.95` for the shared AppealCard title, empty-state H3 and story detail H2, conflicting with the component and global corrections. Correct all three to `1.12`. Extend the existing synthetic appeals acceptance fixture with an empty state and story detail heading, then assert all three heading ratios at320/390/1440. Commits `b7456ea`, `f7fbc11`, `605db8e`.

The Stories route had three remaining tightly leading multiline display texts: feature-image fallback (`.95`), detail context (`1.05`) and detail no-media fallback (`.98`). Preserve fonts/layout and change only leading to `1.12`. Extend the pre-existing Stories accessibility fixture to check those values at390/1440 and100%/200% text scaling. Commits `d492dc2`, `a914292`.

The current global CSS architecture audit now guards these six route-level heading rules, preventing future route CSS from defeating a component-only accessibility fix; an initially over-escaped audit regex was caught and corrected in `7f241f7`. Independent source-level evaluation confirms six of six heading rule checks and correct regex literal. Audit commits `300cb5a`, `7f241f7`. E2E, TypeScript, lint and the production build have **not been executed** on this head in this continuation. R-025 remains partial; no 95-entry closure count changed. No payment/intake/data/provider operation, main merge, budget increase, deployment or migration.


## Completed source remediation in PR #292

Repository: `immazhark/amaana-platform`. Existing PR: https://github.com/immazhark/amaana-platform/pull/292. Working branch: `fix/direct-transfer-feedback-20261013`. Exact implementation/test head before this checkpoint: `814f23a5a607a46f4b537791c3ae38b00779144d`.

**Homepage live-appeal stylesheet regression:** Earlier CSS ownership isolation put `appeal-card.css` exclusively in `src/app/appeals/layout.tsx`. `src/app/page.tsx` also renders `AppealCard` for active appeals. Root layers do not supply its essential flex/progress declarations. The homepage now independently imports `./appeal-card.css`; the /appeals ownership/import sequence is preserved. `scripts/audit-global-css.mjs` rejects future omission from the homepage. This is a source-level correction, not yet an executed browser certification.

**R-025 incremental accessibility remediation:** `src/app/appeal-card.css` now uses `line-height:1.12` instead of `.95` for the multiline card heading. The heading ratio is asserted in the new responsive browser cases. This advances the partial typography finding but is not evidence of full R-025 closure.

**Isolated test coverage:** New synthetic `e2e/fixtures/browser-acceptance/home-appeals/page.tsx.fixture` with no live database or donor interaction, materialized only under `AMAANA_BROWSER_ACCEPTANCE=true`. New `e2e/home-appeal-style-ownership.spec.mjs` has three Playwright cases (320, 390, 1440px) for flex layout, progress bar, title line-height, link focus and horizontal overflow.

Implementation commits: `80f8900`, `9f959cb`, `32723fd`, `af1e1e7`, `c8d556b`, `2e2490d`, `814f23a`. All seven affected sources/fixtures were re-fetched from GitHub and expected source invariants were verified. **The new Playwright cases, TypeScript, CSS audit, full lint, production build and budgets have not yet run on this exact head**; the local environment cannot resolve github.com to clone the repository. No claim of green CI or production verification is made.

## Additional transaction error-boundary regression

The donation and assistance `error.tsx` screens both use `.v2-error-page`, but unlike the root error and 404 boundaries, they did not import `error-experience.css`; their normal transaction layouts also do not load it. Root polish had partial generic rules, not the required flex/min-height/content layout. Each transactional error boundary now imports `../error-experience.css` directly. The existing CSS architecture audit explicitly rejects either omission.

A second opt-in synthetic acceptance route mounts the **actual** `DonateError` and `AssistanceError` client components, with nonfunctional local reset callbacks and no backend or provider calls. Two new `e2e/transaction-error-style-ownership.spec.mjs` cases assert essential layout at390px/1440px, enabled recovery buttons and no horizontal overflow. The materializer removes this fixture whenever test mode is disabled. Commits: `0d22022`, `406f9c0`, `3469234`, `62d3110`, `d68986d`, `fddf383`, `a367373`.

Additional R-025 correction after the boundary import: the shared error/404 heading declaration and the later root polish authority now both resolve to 1.12 line-height for multiline error and not-found headings. New browser cases check computed line-height ratio; state/receipt/loading headings retain their existing independent styling. Commits: `face42c`, `4a50b42`, `acef1ef`.

These are source corrections with browser cases **authored but not executed**. No security/payment/intake workflow change or false production test claim. The latest verified source/test head at this checkpoint is `acef1efed4b697e6ec90053622c9b03a3eae200f`. The files were re-fetched and twelve expected source/ownership invariants pass; runtime gates remain outstanding.

## Original 95-item register

Unchanged from latest reconciled snapshot: **10 addressed in recorded deployed baseline, 33 source implemented awaiting release verification, 25 partial, 16 open, 11 unverified**. The homepage regression identified here is additional to those 95. R-025 stays partial.

## Safety and continuation

No new PR, main merge, deployment, real payment, email, database mutation, media ingestion, migration, or production configuration change. Existing preview migration remains unapplied and CSP report-only remains off. No increase to JS/CSS budgets. On handover, review this checkpoint and the original register, then continue implementing actionable defects in the same PR. Run the exact-head browser/TypeScript/CSS guards before any release decision; do not substitute a prior green head. Preserve consent, FCRA, provisional tax-registration wording and donation idempotency safeguards.
