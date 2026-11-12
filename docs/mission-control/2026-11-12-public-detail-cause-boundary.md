# Public Story and Faith detail: absent nested cause relation — 12 November 2026 IST

**Scope:** Two public detail-page renderers only. Both use `initiative?.status === "PUBLISHED" && initiative.cause.status === "PUBLISHED"` to decide whether to link an initiative. If a reviewed record's nested `cause` relation is unexpectedly absent in a runtime projection, dereference throws, preventing the public page from rendering. No actual malformed live production record was observed, and no review/publication state is changed.

**Fail-first synthetic regression:** `src/app/stories/[slug]/page.test.tsx` and `src/app/faith-and-reflections/[slug]/page.test.tsx` now supply an invalid published initiative with `cause: null`. Requirements: the existing reviewed public narrative remains visible, no unapproved related programme name/link appears, and the Faith page retains its generic work-navigation fallback. Tests landed first at `9f3b4fffb80668345d5051e150d89f822082d506` and `6ad3b810fe377bae011225d2faf3daf0dda81012`. Hosted RED evidence required before modifying source.

**GREEN scope:** change only each `initiative.cause.status` guard to optional nested status access; keep published-state comparisons unchanged. No media, payment, donor records, tax, auth/RBAC, database schema, CSP, private context, secrets or infrastructure changes. Independent from #817 Story discovery utility fix; application and tests are disjoint.

**Release:** full exact-head fast, browser, database, production and final verification; independent review; separate ready-state; SHA-guarded merge; Railway/public runtime verification. Original 149-item totals unchanged. Revert narrow source/tests/docs on rollback.
