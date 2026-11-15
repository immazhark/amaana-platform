# Amaana Foundation — implementation coordination

**16 November 2026 IST — sole writer `CHATGPT_ACTIVE`.** Read-only audits and hosted CI may proceed concurrently. Never overlap implementation writers.

**Verified protected source:** `main` `56e926dee8e776df9507b92f6b2445ce4ed8c62b` after AF-R078 #988 full/ready checks and protected merge, following AF-R005 #987. Public last independent deployed `b1a5b71872c201874a25c70d6a2b7dc632ac6e06` ready; scripts-only deploys SKIPPED.

**Current task:** AF-R012 [PR #986](https://github.com/immazhark/amaana-platform/pull/986), `test/af-r012-appeal-cross-role-20261115`. Synthetic wrong-role/positive-control authorization regression tests for six existing appeal actions. This is coverage, not a production auth/RBAC behavior modification. Previous integrated head `c53a9a102f3e543d45114a8e3accfb22d0243127` completed full selected exact-head CI `43744311137`; latest protected main is reconciled by a normal two-parent commit, so new full exact-head CI, separate ready check, zero review issues and guarded merge required. Test-only src/** may activate normal Railway website build upon merge; verify independent runtime SHA/health.

**Other same-writer PRs:** AF-R024 [#990](https://github.com/immazhark/amaana-platform/pull/990) CSS nested min(calc()) static font-floor guard integrated head `ac62a07aa8d6ed1313ca6678257a59c2fda02038`, and AF-R079 [#989](https://github.com/immazhark/amaana-platform/pull/989) 25 pinned merged task heads integrated `9be8329aa89c0b7c10212e378005a98b45a760b6`. Hosted CI in progress; if either merges first reconcile and rerun tests.

**Hard holds:** #684 payment QR, #845 donation eligibility, #446 Railway IaC live apply, authentic donor records, secrets, live payments/refunds, schema, cron, notifications, identifiable faces without redaction. Domestic INR, no FCRA; 80G status conflict unresolved, 12A/12AB provisional.

**Canonical 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A; no inflation.

**Next:** verify revised #986 full CI, separate ready promotion and guarded expected-head merge; independently check public Railway and continue other bounded lanes.
