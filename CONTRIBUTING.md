# Contributing to Amaana Foundation

## Shipping principle

**One concrete feature or independently releasable fix = one task branch + one PR.**
`main` is the production source; only a reviewed and validated merge to `main` may trigger production deployment. Never push directly to `main`. No half-built feature may become visible or accept real payments. Every task has one implementation owner at a time; see `AGENTS.md` for agent handoffs.

Prefer shipping an already-complete vertical slice over starting multiple new ideas. Treat `fix/direct-transfer-feedback-20261013` / PR #292 as a historical integration source for **selective extraction**, never as a release candidate to merge wholesale. Do not rewrite or delete someone else's branch to make the queue look clean.

## Feature delivery, from idea to production

1. **Intake and decide:** identify the user outcome, beneficiary/privacy boundaries, owner-approved facts, what must stay out of scope, and one acceptance journey. Use the reconciled 149-item register to link the work, not to inflate closure counts.
2. **Plan only the real dependencies:** for a substantial feature, record a short spec and incremental tasks under `docs/superpowers/plans/`. Name the scope, failure states, tests, and rollback. A simple change can use the PR body as its bounded plan.
3. **Branch from the latest `main`:** `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, etc. Avoid working on a giant shared feature branch. Isolate other parallel investigations in read-only tools or separate worktrees; **never allow simultaneous repository writers**.
4. **Implement a vertical slice:** test the behavior that does not exist yet (RED), implement the minimum safe behavior (GREEN), refactor without weakening validation, and keep commits descriptive and atomic. Reuse native/stdlib code and established components before adding dependencies.
5. **Open a draft PR early:** fill in the template, explain a *single* independently reviewable outcome, link affected backlog IDs, list targeted tests, and state whether payment/consent/migration/flag behavior changes. Do not claim unexecuted checks pass. Scope above 25 files requires a substantive explanation.
6. **Verify the exact commit:** use focused tests during coding, then the existing CI gates for lint/TypeScript/unit, isolated PostgreSQL, production build, bundle/security budgets and browser/E2E. Review the rendered experience at relevant breakpoints and keyboard/screen-reader interactions. Handle real failures; never simply raise budgets or skip tests.
7. **Review for release, not code volume:** check correctness, simplicity, architecture, privacy/security, accessibility, performance and truthful public copy. Mark ready only when the complete feature is acceptable. Sensitive payment and private-data flows require explicit end-to-end reconciliation evidence.
8. **Merge and deploy:** only the intended reviewed PR merges to `main` after all required status checks and the production readiness gate pass. Production deployment must be tied to that merge; never deploy from a development push. Preserve existing backup/migration preflight, rollback and signed-provider safety controls.
9. **Verify live:** record the merged SHA, Railway deployment ID and successful deployed SHA, affected public/private user journeys, and any rollback decision. Only then mark a feature **Deployed verified**. A green GitHub build alone is not proof of live availability.
10. **Close and hand off:** update the canonical roadmap and handoff with exact status (implemented / tested / merged / deployed / live-verified). Delete obsolete *merged* task branches only after reconciliation. Never delete others' unmerged work or sensitive evidence.

## Automation, without duplicate bureaucracy

- `scripts/check-pr-contract.mjs` runs inside the existing GitHub CI **plan** job; it uses the PR event and local git diff without a token or third-party API.
- The PR template captures one-slice scope and acceptance. A file-count threshold asks for explanation; it cannot replace review of semantic scope.
- CI change-aware selection remains fail-closed for financial/security/shared code. Superseded PR runs may cancel; integration and `main` checks must never be cancelled this way.
- Repository branch protection should require PR review and the exact-head **CI verify** and **Production promotion readiness** checks, restrict direct `main` pushes, and disallow bypass/force-push. Configure rulesets through repository Settings and verify them—workflow files alone cannot enforce a merge restriction.
- No automation may initiate donor charges, send real notifications, activate FCRA-prohibited donation modes, alter production secrets, run destructive migrations or deploy an unfinished feature without the appropriate approval.

## Developer commands

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
node --test scripts/test-pr-contract.mjs
```

For a focused code change, run its closest Vitest/Node tests first; CI owns the exact-head matrix. For evidence-driven reporting, use the master 149-item register; never infer completion from a commit count.

## Reference skills

Use **Superpowers** for ideation/specification, test-first implementation and verification; **Agent Skills/ECC** for decomposition, security, code quality, and incremental delivery; **Ponytail** for minimal safe solutions; and UI/accessibility/security plugins only when their specialized evidence will improve the task. Do not run all plugins mechanically or create speculative architecture.
