# AF-R025 — trust-evidence multiline heading, 12 November 2026 IST

**Single writer:** CHATGPT_ACTIVE. **Task branch:** `fix/af-r025-trust-evidence-heading-leading-20261112`, based on main `ab8e5e3d9229bd1abd6747f9cde7c4e77930a393`. Other independent candidate PRs: #799 (medical information hero, CI pending), #800 (AF-R004 evidence-only, CI pending). Draft #684 remains financial-activation held. No files overlap #799 or #800 except shared CI checkout inputs.

## Reproduced defect and scope

The actual `TrustEvidenceBoundary` used on the public Transparency page supplies a long multiline heading through shared `SectionHeading`. Its high-specificity `.canonical-body>[data-trust-evidence-boundary] .v2-section-title` in `src/app/canonical-content.css` overrides the established 1.12–1.24 editorial heading leading with `1.02`. The new fail-first Vitest assertion parses the exact selector and confirms original value `1.02` violates minimum `1.12`. Browser acceptance uses the real public /transparency heading, checks 320/390/1440px computed leading and horizontal containment, and requires multiline wrapping on 320px.

**Correction:** only this declaration changes to `1.14`. Identical copy, fonts, widths, family, public records, brand and content structure. No dependencies. Scoped PR does not claim full AF-R025 physical accessibility or 400% zoom closure.

## Release boundaries

Require exact-head fast/typecheck/lint, browser, database, production and privacy/security checks, independent review, separate ready-state CI and expected-head protected merge. CSS source triggers Railway website deployment; verify exact SHA and public readiness independently. Do not change payments, bank/UPI, donor records, media, auth/RBAC, schemas, CSP, worker or environment. Rollback revert the isolated style/test/documentation commit; no data rollback.
