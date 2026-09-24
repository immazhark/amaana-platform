# Amaana Platform — Codex ↔ ChatGPT Continuity Protocol

## Goal
Keep development continuous when Codex usage is available/exhausted, while preventing parallel repo edits, stale branches, duplicated work, and contradictory implementation.

## Core model: one writer, two collaborators

Codex and ChatGPT may both help with analysis, copy, QA, research, planning, review, and discussion at the same time.

For **repository implementation**, there is only one active writer at any moment.

The user controls ownership transitions.

## Normal operating cycle

### When Codex is available
1. Current ChatGPT implementation work is brought to a safe boundary.
2. ChatGPT commits/pushes any intended work and records exact branch, PR, head SHA, CI state, remaining task, and known risks.
3. State becomes `HANDOFF_PENDING`.
4. User tells Codex to take over.
5. Codex reads `AGENTS.md`, `AI_ACTIVE_WORK.md`, and `AI_HANDOFF_LEDGER.md`, inspects repo/PRs, then changes state to `CODEX_ACTIVE`.
6. ChatGPT may continue non-repo work, but makes no repository changes while Codex is active.

### When Codex limits are exhausted
1. Codex should stop at an atomic boundary if possible, commit/push work, and leave a concise handoff summary in the repo coordination files.
2. If Codex cannot do that because the limit cuts off suddenly, the user tells ChatGPT that Codex is exhausted.
3. ChatGPT inspects GitHub directly: integration branch, latest commits, open PRs, active branch, CI, changed files.
4. ChatGPT reconstructs the state from Git and updates the coordination files before continuing.
5. State becomes `CHATGPT_ACTIVE`.

No work should be recreated merely because the previous agent's conversational context is unavailable.

## Branch strategy

### Integration branch
`phase-public-site-rebuild`

This is the current development integration branch. `main` is not the active implementation target unless the user explicitly changes the release strategy.

### Task branches
Use small, descriptive branches:

- `fix/...`
- `feat/...`
- `chore/...`
- `content/...`

One task branch should represent one coherent atomic change.

### Handoff with an open branch
If the outgoing agent has an open task branch:

- incoming agent may continue that same branch only after inspecting its head SHA and PR;
- never create a competing branch for the same fix without documenting why;
- if the PR is clean and complete, finish/review/merge it before starting unrelated implementation when practical.

## Handoff contract

Every implementation handoff must contain:

- outgoing agent
- incoming agent
- state
- integration branch
- current task branch
- current PR number/URL if any
- head SHA
- last completed task
- task currently in progress
- exact next action
- tests already run
- CI status
- known failures and whether they are introduced by the task or pre-existing
- files/areas that must not be touched casually
- factual/content locks relevant to the next task

This information lives in `docs/AI_ACTIVE_WORK.md`. Historical transitions are appended to `docs/AI_HANDOFF_LEDGER.md`.

## Ownership claim

An incoming agent may claim repo ownership only after:

1. verifying no other implementation agent is still active;
2. reading open PR status;
3. checking whether the integration branch moved since the handoff;
4. updating `AI_ACTIVE_WORK.md` with its own ownership and current timestamp/context.

If the user explicitly says "Codex is running on implementation", ChatGPT must treat repo ownership as `CODEX_ACTIVE` even if the state file has not yet caught up.

If the user explicitly says "Codex is exhausted/take over", ChatGPT may reconstruct and claim ownership after checking GitHub.

## Parallel work allowed

While Codex owns implementation, ChatGPT may still:

- review screenshots/previews;
- verify facts/content;
- write copy outside the repo;
- prepare test plans;
- inspect public site behavior;
- research compliance questions;
- review Codex output or PRs read-only;
- prepare recommendations for the next handoff.

ChatGPT must not commit, update branches, merge PRs, or alter repo files while Codex is the active implementation owner.

The same principle applies in reverse: when ChatGPT is implementing, Codex should not independently modify the repo.

## CI and failing checks

A failing check must be classified before handoff:

- `TASK_INTRODUCED` — must normally be fixed before handoff/merge.
- `PRE_EXISTING` — document exact failing file/check; do not falsely attribute it to the current change.
- `INFRASTRUCTURE` — document and retry only when justified.

Do not merge a change solely because its own diff looks correct if required CI is red without understanding why.

## Canonical data discipline

New explicit user corrections override older repo content, old screenshots, cached seed data, and previous planning documents.

Known examples as of 2026-09-15:

- Winter Drive 2025–26: **234 Winter Kits distributed to 234 beneficiaries**.
- 8-day-old newborn medical case: **₹107,520**.

Canonical facts should be stored once where possible and propagated from structured data rather than manually duplicated across pages.

## Conflict prevention rules

- Never force-push over another agent's unreviewed work.
- Never merge two competing implementations of the same task without deliberate reconciliation.
- Never edit the integration branch directly while another task PR is actively modifying the same area unless necessary and documented.
- Prefer reading current repository state over relying on chat memory.
- If a branch has moved since the last handoff, inspect the delta before making changes.

## Emergency takeover

If Codex stops mid-task without a handoff:

1. ChatGPT checks latest commits and branches sorted by recent activity.
2. Locate unmerged PRs.
3. Inspect latest commit messages/diffs.
4. Determine whether work is complete, partial, or broken.
5. Record reconstructed state in `AI_ACTIVE_WORK.md`.
6. Continue from the existing branch if safe; otherwise create a narrowly scoped recovery branch.

## Definition of seamless handoff

A handoff is successful when the incoming agent can answer all four questions from the repository alone:

1. What was just completed?
2. What is currently unfinished?
3. What exact branch/PR should I continue from?
4. What is the next atomic action?

If those answers are not clear, fix the handoff record before coding.
