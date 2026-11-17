# Amaana Foundation — active implementation writer

**17 November 2026 IST — CLAUDE_CODE_ACTIVE.** Owner explicitly handed the single implementation-writer role from ChatGPT to Claude Code. ChatGPT performs no repository writes while this state holds; independent read-only review is permitted. Owner standing authorisation (17 November 2026): routine task-branch commits, expected-head squash merges, guarded branch retirement and removal of obsolete documentation. Follow `AGENTS.md` and protected exact-head full and ready-state checks.

**Protected main:** `045a2a078df54fd0d7fac2c5a7a137d536ce73ab`. Merged this session: #1015 AF-R024 `8b2bed9`, #1016 AF-R012 `d5c4cf5`, #1018 Highlights alignment `2677020`, #1019 desktop header containment `8be5c81`, #1020 AF-R044 footer shift `751ad21`, #1033 desktop rail text `76e53ea`, #1034 SEO description clamp `54405a6`, #1036 documentation prune `d6478e0`, #1035 purge workflow `045a2a0`.

**Branch purge (owner directive, verified):** dry run `44022457155` planned 671 removals; apply run `44022594184` succeeded. Remote heads now: `main` and the two held PR branches only. 628 removed tips are preserved by pull request refs (`refs/pull/N/head`); 43 branches with unique commits were first parked under `refs/archive/<name>`. Recreate any branch with `git push origin <sha>:refs/heads/<name>`. The one-off workflow and script were removed in the follow-up PR.

**Documentation prune:** 159 markdown files reduced to 53 (#1036); removed files remain in Git history.

**Deployed state:** Railway website deployment `d35e7520-7575-4250-8dc4-9e0f386e0566` SUCCESS for `54405a609303d66ac12340c4cb54513107c25606`; public `/api/health/version` returned that SHA and `/api/health/ready` returned `ready`. The docs-only #1036 and the scripts and workflow-only #1035 were SKIPPED by Railway watch rules; do not force a rollout.

**Held:** #684 official UPI QR fallback and #845 privacy staging-marker PR remain unmerged. #1026 was closed unmerged after a verified HTTP 404/redirect regression; do not reintroduce nested loading boundaries without a status-preserving design.

**Open decisions for the owner:** below 1280px the desktop rail hides the secondary reminder line (#1033); five page titles exceed about 60 characters with the site suffix and were left as editorial copy.

**149-item register:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable. Bounded PRs do not close whole items. Domestic INR only, no FCRA, 12A/12AB provisional, 80G conflict unresolved, identifiable faces need redaction and EXIF/GPS removal, official logo and cream/blue/gold identity protected. No live financial, schema, auth/RBAC, checkout CSP, cron, notification or infrastructure change without separate scoped authority.

**Return handoff:** before the session ends, stop at a safe boundary, record exact branch/PR/head/CI state here and in `docs/AI_HANDOFF_LEDGER.md`, set `HANDOFF_PENDING` and stop repository writes.
