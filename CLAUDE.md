# Amaana Foundation — Claude Code instructions

Repository: `immazhark/amaana-platform`. `AGENTS.md` is the binding working agreement (writer ownership, branch/PR, handoff rules) and is loaded separately; this file adds only operating rules and verified hints. Do not duplicate AGENTS.md here.

## Architecture and non-negotiables
- Next.js, React, strict TypeScript, Tailwind, Prisma/PostgreSQL, Railway. Continue it; do not redesign.
- Domestic-INR contributions only (no FCRA); 12A/12AB provisional, 80G unresolved. Finance-held PRs (#684, #845) and the parked notification worker stay untouched.
- Donor/beneficiary privacy: identifiable-face redaction and EXIF/GPS removal; synthetic test data only; verified impact figures only; official cream/blue/gold identity and logo.
- Separately scoped owner approval is required before auth/RBAC, payment/webhook, schema/secret, CSP, cron, recipient messaging or production changes.
- Retain CI, separate ready-state promotion checks and SHA-guarded merges. Never push to `main`.
- PR numbers, SHAs and backlog totals in docs are historical; verify against live Git/PR state before using them.

## Where state lives (plain references, not imports)
- Active writer and current task: `docs/AI_ACTIVE_WORK.md` (canonical). Handoffs: `docs/AI_HANDOFF_LEDGER.md`. Compact startup context: `docs/07_CURRENT_STATE.md`.
- Only one implementation writer. If another agent is `ACTIVE`, do not write to the repo without an explicit owner handoff. If the file and Git/PR state disagree, Git is the truth; fix the file.
- Read the AGENTS.md takeover list once at a real takeover, not per task.

## Verified commands (run from repo root; CI uses Node 22)
- `npm run lint` (eslint, zero warnings, plus governed stylelint) · `npm run typecheck` · `npm test` (vitest) · `npm run build` · `npm run check` = lint + typecheck + build.
- Static guards run as `node --test scripts/test-*.mjs` (see `.github/workflows/ci.yml` for the exact list); `npm run test:coverage` for coverage.
- Browser acceptance: Playwright specs in `e2e/` (`playwright.config.mjs`). Prisma: `npm run prisma:validate`.
- Source: `src/app` (routes), `src/components`, `src/lib`, `src/content`, `prisma/`, `scripts/` (audits/guards).

## Working rules
- Resume the last verified action. Answer status questions briefly. For a coding task, state the observable outcome and the check, then execute.
- Search the named route, symbol, diff or failing test first; expand through callers as evidence requires. Re-read only after modification, lost detail or when verification demands it.
- Use existing code and test infrastructure; implement through the real entry point; handle retries, partial failure and concurrency.
- Default to one writer and no agent teams. Delegate only a bounded independent question worth the extra context. Native tools are a complete valid choice; add a specialist only for a concrete gap.
- Keep output focused: filter large logs to relevant evidence but keep raw failures reachable.
- After two identical failures, change the hypothesis or name the missing prerequisite.
- Verify affected behaviour and required gates; report implementation, tests, merge, deployment and public verification as separate facts.
- Do not create new dated audit/status files per task; update the canonical records and the existing task PR.
- Keep model/tool config stable within a task. Never enable paid overage, API billing or a model gateway without owner authorisation.
- At compaction or handoff preserve branch/worktree, dirty files, decisions, last check, holds and next action.
