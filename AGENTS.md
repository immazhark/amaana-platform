# Amaana Platform — Agent Working Agreement

This repository may be implemented alternately by Codex and ChatGPT. Only **one implementation agent may write to the repository at a time**.

Before making any repo change, every agent MUST read:

1. `docs/AI_CONTINUITY_PROTOCOL.md`
2. `docs/AI_ACTIVE_WORK.md`
3. `docs/AI_HANDOFF_LEDGER.md`
4. `docs/CURRENT_SOURCE_RECONCILIATION_2026-09-15.md`

## Hard rules

- Do not begin repo writes if another agent is marked `ACTIVE` in `docs/AI_ACTIVE_WORK.md` unless the user has explicitly handed implementation ownership over.
- ChatGPT and Codex may work in parallel on research, copy, planning, QA, or analysis, but **not on repository implementation**.
- `main` is the only production promotion target. Legacy `phase-public-site-rebuild` and PR #292 are integration sources, not a wholesale release candidate. Extract a coherent feature slice into its own PR.
- Do not make direct implementation commits to `main`.
- **One concrete feature or independently releasable fix per branch and PR** from current `main`. Follow `CONTRIBUTING.md` and `.github/pull_request_template.md`. Separate unrelated changes.
- Before coding, inspect open PRs, current `main`, existing feature branches and exact-head CI, so you do not duplicate or overwrite work.
- Before handoff, finish or safely stop the current atomic task, commit intended work, run available checks, and update `docs/AI_ACTIVE_WORK.md` plus `docs/AI_HANDOFF_LEDGER.md`.
- Distinguish CI green, merged, deployed and live-verified; no release claims without postdeployment SHA/journey evidence.
- Never silently overwrite another agent's branch. If continuing an existing branch, first verify its current head SHA and read its PR/CI status.
- Preserve the user's locked factual corrections and canonical content rules. Newer explicit user corrections override older repo content.
- When older durable logs conflict with `CURRENT_SOURCE_RECONCILIATION_2026-09-15.md`, treat the reconciliation file as the newer project-state authority until the old section is rewritten.
- Do not restart or redesign the project from scratch. Continue the current architecture unless a verified requirement demands a change.

## Ownership states

`IDLE` — no implementation agent is writing.

`CODEX_ACTIVE` — Codex owns all repo implementation.

`CHATGPT_ACTIVE` — ChatGPT owns all repo implementation.

`HANDOFF_PENDING` — outgoing agent has stopped writes and documented the handoff; incoming agent has not yet claimed ownership.

`REVIEW_PENDING` — no new implementation work should begin until the listed PR/CI issue is reviewed or deliberately superseded.

## Incoming-agent checklist

1. Read the four required coordination/source-state files.
2. Inspect the latest `main` commit and the head of the intended task branch.
3. Inspect open PRs and CI.
4. Confirm the task already in progress before starting a new one.
5. Update `docs/AI_ACTIVE_WORK.md` to claim implementation ownership.
6. Work only on the declared branch/task.

If the coordination files and Git history disagree, Git history/PR state is the technical truth; update the coordination files before proceeding.
