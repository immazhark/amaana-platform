# Amaana implementation ownership — current checkpoint

**15 November 2026 IST · Single implementation writer: `CHATGPT_ACTIVE`.** Read-only audits and hosted CI may run independently, but no competing implementation writers.

**Protected main:** `d77b1c40110ab12c2492304c184c61f988823e91`, AF-R005 #987 accepted after synthetic RED `43741783095`, full exact-head GREEN `43741890034`, separate ready GREEN `43744197664` and protected merge. Railway website and worker SKIPPED script-only source changes. Last independently public verified website commit `b1a5b71872c201874a25c70d6a2b7dc632ac6e06` with readiness ready.

**Current independent bounded task:** AF-R024 CSS 12px audit fails to fold multi-operation constant same-unit `calc()` chains nested in a `min()` expression when no individual operand is below the floor. Branch `fix/af-r024-nested-min-additive-chain-20261115` from current protected main. Reproduce with synthetic RED, apply smallest audited expression folding fix, run full exact-head CI, separate ready-state promotion and SHA-guarded merge. Static scanner/fixture only. Does not fix any measured live sub-12px UI or claim 200%-zoom acceptance.

**Other active same-writer lanes:** #986 AF-R012 synthetic appeal cross-role tests head `c53a9a102f3e543d45114a8e3accfb22d0243127` after latest-main integration, #988 AF-R078 unquoted Markdown HTML backlinks head `a76b0185782d58e01c94a8f6e6bda1d3018ee96a`, #989 AF-R079 reviewed 25 merged task heads `58e6aef569d9ebfc4c7000d20aaa0c85a407dec1`, pending main reconciliation and full selected acceptance. No direct branch deletions. Finance #684/#845 and Railway IaC #446 still held.

**Hard locks:** No real payments, production schema, auth/RBAC rule activation, secrets, cron, outbound messages or donor records. All public faces must be redacted with metadata removed; INR domestic only, no FCRA, 80G unresolved, 12A/12AB provisional.

**149 original classifications:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A, unchanged.

**Next:** RED/GREEN AF-R024 guard, exact-head CI, protection and ready-state; do not weaken failing tests to pass. Other lanes remain bounded.
