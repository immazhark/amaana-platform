# Amaana Foundation — verified current state

**17 November 2026 IST.** Reconcile live source, CI, Railway and public runtime separately. Repo `immazhark/amaana-platform`; implementation writer `CHATGPT_ACTIVE` (one writer, parallel read-only QA).

| Boundary | Current evidence |
|---|---|
| Protected main | `9d89e4d150cdee8420c973253a6739d61c517084` after guarded squash merges #1023, #1024, #1025 |
| AF-R079 wave 15 | #1023 merged `a920867ad30a0e246c4b47d429278b98f090f18d`; full/ready-state checks and guarded 2 historical + 1 task branch retirement succeeded, refs absent |
| AF-R012 | #1024 static guard-before-direct-DB regression/test-only change merged `12f3f077e7bef50547233fcd485db901b1607d6b`; source head retired, no production RBAC activation |
| AF-N23 | #1025 private acknowledgement fail-closed response-shape update merged `9d89e4d150cdee8420c973253a6739d61c517084`; source head retired; Railway website deployment `60d8db6b-d9d8-4019-876d-defcbce64383` SUCCESS |
| Current bounded task | #1026 AF-R071, `fix/af-r071-detail-loading-boundaries-20261117` from latest main. Synthetic RED required missing nested loading files; five data-free `[slug]/loading.tsx` additions plus regression and existing coordination records. Exact full CI `43975342729` was queued/running; final PR head must be rechecked after coordination updates |
| Current source/runtime distinction | Current main source at #1025. Railway deploy SUCCESS at that SHA, but public `/api/health/version` plus `/api/health/ready` exact response not freshly verified. Never force deployment to equal SHAs |
| Active finance holds | #684, #845 remain unmerged and out of scope |
| Original 149 | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A = 149; no whole-item closure from #1023–#1026 |

**Next:** complete exact-head full CI (browser/database/security where selected) for #1026; separately promote ready, obtain ready-state checks, review, SHA-guarded squash merge; independently verify branch retirement and actual public runtime/deployment. If blocked, preserve its PR and continue safe independent work. Do not create duplicated issue branches.

**Locks:** Next.js App Router + strict TypeScript + Prisma/Postgres + Razorpay + Railway preserved. Domestic INR only, no FCRA. 12A/12AB provisional, 80G pending/provisional conflict unresolved. Redact identifiable public faces and remove metadata; no synthetic beneficiary photos. Brand logo `public/brand/amaana-mark.svg` with blue `#466FAA` and gold `#E0B318`. No unauthorized live financial, secret, schema, cron, donor communication, infrastructure or bulk historical deletion actions.
