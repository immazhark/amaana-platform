# Atomic Feature PR Workflow — Implementation Plan

> **For agentic workers:** Use Superpowers / Agent Skills test-driven development, incremental implementation, code review, and verification-before-completion for each checked task.

**Goal:** Make one independently releasable feature or fix per PR the default, with mechanical metadata/scope safeguards and no duplicate heavyweight CI.

**Architecture:** Reuse the existing GitHub Actions `plan` job and branch protection/release readiness checks. Add a dependency-free PR contract validator and its Node tests, a standard PR description template, and concise contributor/agent rules. Do not change production deployment activation or finance flows.

**Tech Stack:** GitHub Actions, Node.js 22, JavaScript ESM, Next.js/TypeScript production project.

**Spec:** User directive on 17 October 2026: independent PR per feature; small atomic commits; complete tests before merge/release; 80% development, 20% validation/automation.

## Global Constraints

- `main` is the only production promotion branch; never push directly to `main`.
- Do not bypass existing production-readiness, payment, privacy, browser, CSS/JS budget or database gates.
- No credentials or new dependencies for PR governance.
- A 25-file review threshold prompts a documented exception; it never silently splits a coherent feature.
- A scope validator is **not** semantic proof: human review still checks PR independence, acceptance and regressions.
- The historic oversized PR #292 is quarantined for decomposition, not merged wholesale.
- Draft PRs may contain unchecked acceptance boxes; ready/merge require actual evidence.

## Tasks

- [ ] **Test-first contract:** `scripts/test-pr-contract.mjs` covers valid atomic PR; malformed title/branch; absent purpose/acceptance/verification/release; broad scope without a reason; documented single-feature exceptions.
- [ ] **Minimal validation:** `scripts/check-pr-contract.mjs` exports a pure validator and reads GitHub PR event + git diff only in PR context. No network.
- [ ] **Integrate once:** Add `node --test scripts/test-pr-contract.mjs` and `node scripts/check-pr-contract.mjs` to the existing `plan` job, cancel superseded PR workflows but never cancel `main` checks.
- [ ] **Default authoring:** Add `.github/pull_request_template.md` and `CONTRIBUTING.md`; align `AGENTS.md` with one-writer and one-feature/one-PR policy.
- [ ] **Verify:** Observe exact-head `plan`, CI checks, and PR status; keep this tooling PR unmerged until verified. No deployment or branch deletion.

## Release Review Focus

- Existing historic multi-feature PRs must not be silently treated as compliant.
- Missing GITHUB_EVENT_PATH or invalid event must fail closed on PR runs, skip only on non-PR events.
- Spaces, mixed case, and branch naming must not allow accidental `main` direct write semantics.
- A metadata gate cannot replace E2E execution or manual classification of feature scope.
- Git checkout should have enough history for merge-base comparison; avoid PR API calls.
