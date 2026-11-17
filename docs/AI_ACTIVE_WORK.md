# Amaana Foundation — active implementation writer

**17 November 2026 IST — CLAUDE_CODE_ACTIVE.** Owner explicitly handed the single implementation-writer role from ChatGPT to Claude Code (second owner-authorised session). At claim time main had no commits since 07:49 IST, the only open PRs were the held #684 and #845, and no ChatGPT branch was open. ChatGPT performs no repository writes while this state holds; independent read-only review is permitted. Routine task-branch commits and qualifying expected-head squash merges have owner standing approval; follow `AGENTS.md` and protected exact-head full and ready-state checks.

**Protected main:** `3d337ca0491dff22be6d42d55a0e0931d972ab98`. Merged since the previous record: #1016 AF-R012 async-guard audit `d5c4cf5`, #1018 Highlights alignment `2677020`, #1019 desktop header containment `8be5c81`, #1020 AF-R044 streamed-fallback footer shift `751ad21`, #1028 AF-R052 public-media provenance `199c890`, #1031 AF-R005 `d18c5a8`, #1030 AF-R076 `ee87069`, #1032 AF-R079 wave 16 `3d337ca` (head `5454bcd`).

**Wave 16 outcome (independently verified):** the three pinned heads (#485, #490, #366 branches) and the #1032 task branch are absent from the remote. Branch count 674.

**Deployed state:** Railway website deployment `e60d2701-fb53-491f-98c7-9d20a0c4219f` SUCCESS for `199c890190f9660be30b88e06da0e77b29838a17`. Public `/api/health/version` returned that SHA (main, production) and `/api/health/ready` returned `ready` at the time of claim. Later merges (#1031, #1030, #1032) were SKIPPED by Railway watch rules (scripts or docs only); do not force a rollout.

**Current bounded task:** `fix/live-rail-desktop-text-clipping-20261117` — the desktop reminder and live rail clip the reminder citation and live headline with an ellipsis (for example a verse range cut to "2:28…"). Test first, then a CSS correction; PR to follow.

**Held:** #684 official UPI QR fallback and #845 privacy staging-marker PR remain unmerged. #1026 was closed unmerged after a verified HTTP 404/redirect regression; do not reintroduce nested loading boundaries without a status-preserving design.

**149-item register:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable. Bounded PRs do not close whole items. Domestic INR only, no FCRA, 12A/12AB provisional, 80G conflict unresolved, identifiable faces need redaction and EXIF/GPS removal, official logo and cream/blue/gold identity protected. No live financial, schema, auth/RBAC, checkout CSP, cron, notification or infrastructure change without separate scoped authority.

**Return handoff:** before the session ends, stop at a safe boundary, record exact branch/PR/head/CI state here and in `docs/AI_HANDOFF_LEDGER.md`, set `HANDOFF_PENDING` and stop repository writes.
