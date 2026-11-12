# AF-R025 — Team hero heading leading, 12 November 2026 IST

## Root cause

The merged route stylesheet `src/app/team/team.css` inherited the original inline Team hero h1 shorthand `font:500 clamp(2.8rem,6.5vw,5.5rem)/1.05 var(--af-font-display)`. The real public h1 `The people behind Amaana` wraps on narrow widths; 1.05 violates the 1.12–1.24 approved editorial multiline heading leading band. This is distinct from the canonical article desktop h2 override in independently scoped PR #791.

## Test-first and correction

RED-source check on protected main `7aa76e515d45ccea673ab6490bd8ae162847b724`: exact `.team-hero h1` shorthand ratio 1.05; new Vitest source assertion requires >=1.12. Mobile Playwright tests for real route `/team` at 320px and 390px check computed heading ratio, wrapped lines and viewport containment.

GREEN: change **only** `.team-hero h1` font shorthand leading 1.05 → 1.14. Keep text, colors, font, size, weight, width, text transform, responsive behavior and approved cream/blue/gold styling. No dependencies.

CI requires exact-head fast/typecheck/lint/browser/database/production/verify, independent review, separate ready-state and expected-head guard. This source CSS change triggers a website Railway rollout; verify SHA/public readiness and responsive visual quality separately. Does not claim other 200%/400% zoom or physical screen-reader acceptance; AF-R025 stays Partial until broader acceptance. Finance #684, privacy #785 and other source PRs remain isolated; no donor, recipient, schema, RBAC, media, CSP, cron or infra mutation.
