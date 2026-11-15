# Amaana implementation ownership — current checkpoint

**15 November 2026 IST. Sole repository implementation writer:** `CHATGPT_ACTIVE`. Parallel read-only audits and CI are allowed; no competing repository writers.

**Protected main:** `d77b1c40110ab12c2492304c184c61f988823e91`, after AF-R005 PR #987 accepted full exact-head CI `43741890034`, distinct ready-state `43744197664`, and protected merge. Railway website and worker correctly SKIPPED script-only source changes; last independently live-verified website SHA `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`, readiness ready.

**Current task:** AF-R079 historical branch retirement wave 4, [PR #989](https://github.com/immazhark/amaana-platform/pull/989), `chore/af-r079-reviewed-history-wave4-20261115`. Pinned manifest 25 unique merged same-repository main task PR heads #873–#897. Previously confirmed exact live head SHAs, no protected refs or retain label. Guarded post-merge workflow independently rechecks current branch protection, unchanged PR head, open/dependent PRs, merged ancestry and last-moment SHA. Original head `58e6aef569d9ebfc4c7000d20aaa0c85a407dec1` integrated with current protected main by a **non-force two-parent commit**. Fresh exact-head acceptance, separate ready-state and protected expected-head merge required. No deletion is claimed until workflow outcomes are independently observed.

**Other active same-writer PRs:** #986 AF-R012 synthetic cross-role appeal test coverage, reconciled head `c53a9a102f3e543d45114a8e3accfb22d0243127`; #988 AF-R078 unquoted HTML backlink inventory, reconciled head `a76b0185782d58e01c94a8f6e6bda1d3018ee96a`; #990 AF-R024 nested CSS min calc font-floor scanner, RED head `0e1a539d593e80949574c4c8579783ffa7adefb4`. Each remains draft pending exact-head review and release checks; re-integrate if main moves without force push.

**Hard holds:** #684 payment QR and #845 donation eligibility, #446 Railway IaC live apply, production money/secret/schema/cron/data/messaging, public identifiable faces without redaction. INR domestic only; no FCRA; 80G conflict unresolved, 12A/12AB provisional.

**Canonical 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A, unchanged.

**Next:** Verify #989 integrated-head full checks, then separate ready-state and SHA-guarded merge; record protected retire workflow's actual RETIRED vs PRESERVE output and branch census. Do not infer retirement from manifest acceptance.
