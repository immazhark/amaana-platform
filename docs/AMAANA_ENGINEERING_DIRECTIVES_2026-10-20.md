# Amaana — Binding Engineering and Independent Audit Directives

**Effective:** 2026-10-20  
**Source:** Owner-supplied "Principal engineer, security architect, and SRE" audit directive received 2026-10-20.  
**Applies to:** All coding, security, data, content, QA, deployment and handoffs in `immazhark/amaana-platform`.  
**Execution index:** [Master Reconciled Execution Plan](./AMAANA_MASTER_RECONCILED_EXECUTION_PLAN.md).

## Precedence and reconciliation

1. **Latest explicit owner instructions** control the requested outcomes and risk approvals. Facts about registration, donations, beneficiaries and money must also be reconciled against evidence, never silently overwritten.
2. Preserve Next.js App Router / TypeScript / Prisma / PostgreSQL / RBAC / Razorpay / Railway. No speculative platform rewrite, weakened protected check or direct implementation push to `main`.
3. One repository writer at a time per `AGENTS.md` and `docs/AI_CONTINUITY_PROTOCOL.md`. Parallel analysis, design, fact-checking and prioritization are allowed; parallel uncoordinated repository edits are not.
4. **95% substantive engineering, 5% essential process overhead** after the initial read-only security and source reconciliation. Avoid repetitive build/status loops. Fix proven root causes with focused test-first changes.
5. This new directive introduces a **strict merge-approval rule**: create atomic PRs; do **not** merge until the owner explicitly says **"merge it"** for that PR and the required protected checks have passed. Older broad deployment permissions and background auto-merge instructions do not authorize a new merge. Never bypass branch protections.
6. No approval is required to **propose** LOW-risk documentation-only PRs. MEDIUM-risk application plans are presented before implementation. HIGH-risk changes (auth, RBAC, payment logic, secrets/webhooks, DB schema, CSP affecting checkout, donor data) require an explicit written plan and owner approval **before code modification**. Destructive production actions require separately scoped approval.
7. Every item ends in an evidence-backed state: `IMPLEMENTED_SOURCE`, `TESTED`, `MERGED`, `DEPLOYED`, `LIVE_VERIFIED`, `BLOCKED` or `UNVERIFIED`; these are not synonyms. Never call a master item closed solely because a test passed or a PR exists.

## Product, privacy and content locks

- **Organization:** Amaana Foundation; registered Hyderabad charitable trust. DARPAN `TS/2024/0403215`. Official logo `public/brand/amaana-mark.svg`; source blue `#466FAA`, gold `#E0B318`; preserve the existing approved cream/blue/gold visual direction rather than redesigning every surface.
- **FCRA:** Not registered. Foreign contributions remain disabled in the UI **and server**, even though international visitors may browse the public site. Domestic INR donations only.
- **80G conflict — OPEN, not silently resolved:** The incoming audit directive says "**80G still pending**", while repository evidence `AMAANA_CONTENT_ASSET_REGISTER.md`, `docs/canonical-factual-locks-2026-09-15.md` and `src/app/compliance/page.tsx` records **provisional** Section 80G approval via Form 10AC dated 2026-01-26, AY 2026–27 to 2028–29. The public site currently issues **ordinary acknowledgements only**, not 80G deduction certificates. **Owner/CA must reconcile the new wording against the signed certificate and current validity before public tax-status text changes**. Never claim permanent/final 80G or emit tax-deduction certificates by implication.
- **12A/12AB:** State **provisional** pending professional confirmation of the current registration position; do not imply final approval.
- **New stricter image privacy instruction:** Every identifiable donor or beneficiary face must be blurred for public images; EXIF/GPS removed. Prior consent approval alone is not an exemption from this new face-redaction rule. Treat historical public images as `UNVERIFIED` until reviewed. Flag named medical/financial-aid cases for an owner-led anonymization decision. Do not silently invent, republish or replace beneficiary photographs. Existing public asset changes are a separate privacy-scoped release.
- Never invent registration status, impact numbers, awards, sponsors, religious rulings, testimonials, destination costs or partners. If evidence is missing, record a tracked `BLOCKED` decision with owner/required evidence instead of shipping speculative copy or implementation placeholders.
- Preserve locked metrics (including 234 Winter Kits and neonatal medical aid ₹107,520); existing factual-source register controls other campaign totals.

## Required audit and engineering workflow

1. **Read-only reconnaissance:** Confirm production `main` SHA, deployed Railway SHA, open PR branches, declared implementation owner, and affected code. Do not describe an unperformed repository-wide security audit as completed.
2. **Fail-first findings:** Rank `CRITICAL / HIGH / MEDIUM / LOW` with file and line references, observed impact, reproducible evidence, owner and a bounded correction. Unverified findings are explicitly `UNVERIFIED`, not false failures or passes. Present the audit's scope, including parts not examined.
3. **Fix by isolated concern:** A small branch and PR with precise source changes, regression tests written before risky code changes, type-safe error handling and a direct rollback route. No rearchitecture without a reasoned ADR and rollback.
4. **Never conflate unit acceptance with live acceptance:** Measure user-facing performance, 400% zoom, WCAG 2.2 AA keyboard/screen readers, production deployment, privacy and payment behavior. If external tools/devices are unavailable, record exact steps and owner evidence needed rather than fabricating results.
5. **No secrets or private datasets in Git/history/client bundles/logs.** If a secret is found in history, stop the affected work and request rotation; deletion of one source line does not undo exposure.
6. **Payment safety:** Never change Razorpay keys/webhook configuration/payment logic without a separately approved plan/PR. Keep all card data outside Amaana servers. Server-side amount, identity, webhook signature, refund, idempotency, retry and reconciliation controls remain mandatory. Require approval before any live payment or production-data test.
7. **Database safety:** No destructive/irreversible migration, backfill or donor-data access without explicit plan, migration SQL/diff, risk and tested rollback. Preserve RBAC permissions and private-document access boundaries.
8. **Shipping:** PR description contains risk, files, what changed, tests/measurements, UI evidence where relevant, rollback instructions and explicit owner approval. Never push implementation directly to main, force push, delete others' branches, or change secrets/settings/protections without written approval. Verify exact release SHA after an authorized merge.
9. **Continuity:** Update the canonical master register's implementation, testing, merge, deployment and blockers separately; add the top next actionable source fixes. No status-count inflation, half-shipped features or redundant competing PRs.

## Audit/acceptance objectives — not presumed current PASS

| Area | Target / mandatory principle | Evidence needed |
|---|---|---|
| Mobile CWV | Lab LCP ≤ 1.5s (field p75 ceiling 2.5s), INP ≤ 100ms (ceiling 200ms), CLS ≤ .02 (ceiling .1), FCP ≤ 1.2s, TBT ≤ 150ms, Indian-edge TTFB ≤ 300ms | 4G mid-range Android, field RUM and dates |
| Lighthouse | Mobile ≥ 95 performance, accessibility, best practices and SEO | Median of five representative runs and real-device checks |
| Frontend payload | ≤ 150 KiB **compressed per route** JS as target; images ≤ 150 KiB unless approved LCP exception | Per-route compressed bundles and visual/LCP assessment. **Do not confuse with existing 800 KiB aggregate JS / 340 KiB aggregate CSS regression caps; keep both until explicitly updated.** |
| Frontend design | Core Web Vitals, no CLS, responsive reserved media, Next/Image sizes, minimal client JS, reduced motion | Production source + screenshot/trace evidence |
| Security | OWASP ASVS L2; L3 on privileged/auth/payment paths; strict CSP/headers, SSRF/CSRF/IDOR, MFA, safe uploads | Source tests plus live headers/scans; CSP/payment-provider compatibility before enforcement |
| Accessibility | WCAG 2.2 AA, 4.5:1 text, 3:1 controls, 44px targets, full keyboard/screen-reader/400% zoom | Automated and manual platform evidence |
| SEO | Real canonical content, precise redirects, sitemap/robots/OG/schema/NAP parity | Live rendered crawl/search validator evidence |
| Privacy/legal | DPDP-aligned minimization, consent, breach/deletion workflow; no FCRA, no unreviewed 80G benefits, no identifiable faces | Public + private data audit, image review, policy/CA decisions |
| Reliability | PostgreSQL backup/restore rehearsal, Railway deploy/rollback, peak donation load resilience, delivery authentication | Tested RTO/RPO, 10× simulated load and logs without PII |
| Payments | One-time, refunds, repeats, recurring where actually implemented, reconciliation | Isolated mode and explicitly approved small live verification; never fabricate |
| Supply chain | Pinned dependencies, audit/SAST/DAST, secret review, documented threat model | Direct tool evidence, severity and remediation |
| Release | User-approved protected PR merge and exact-sha Railway verification | PR approval, merge SHA and deployed SHA |

## War-footing decision system

**Do immediately:** Proven CRITICAL/HIGH *read-only* triage, safe test-first frontend/source corrections, bounded P1 accessibility/performance, evidence refresh of the 149-item register. **Ask approval first:** HIGH-risk changes, production payment/data/security settings, legal or religious policies, public-asset privacy redaction decisions and every PR merge. **Never ship:** unreviewed financial promises, foreign contributions, unapproved tax-certificate functionality or unblurred identifiable faces.

Working queues: `ACTIVE_CODE` (one atomic implementation writer), `READY_TO_REVIEW`, `OWNER_DECISION`, `INDEPENDENT_QA`, `BLOCKED_EXTERNAL`, `CLOSED_WITH_LIVE_EVIDENCE`. Concurrent *investigation* across all 26 not-started items is allowed; do not concurrently mutate unrelated code and call it progress.

The status at the end of a working session must name real completed source changes, the open PRs with risk tiers, verified versus unverified outcomes, exactly what decision is needed from the owner and the next three ranked implementation actions. Maintain direct ASD-STE100 wording; no praise or filler.
