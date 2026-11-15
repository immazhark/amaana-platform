# Amaana Foundation — current implementation writer

**16 November 2026 IST — CHATGPT_ACTIVE**, single repository implementation writer. Owner retains project authority. Parallel research/QA remains read-only.

**Source main:** `fde49ad9953a786422c8b56b5bada688f73c3ca2`, after protected SHA-guarded squash merges: #994 `b97e93bdaa986409593b70e07acf4e77dbfb18a0` (Stylelint scope), #996 `c481cdf7a2a3de429682c635a595c2ec8816e6c1` (scoped keyboard-focus lint), #992 `16cb7008e9beb976e813f1c30f3fe55fea9827c8` (legacy public bundle-report labels), and #997 `fde49ad9953a786422c8b56b5bada688f73c3ca2` (sixth guarded retirement wave). Every listed merge completed exact-head full CI, distinct ready-state CI and protected head-guarded merge. #997's retirement job `43768085164` returned 25 RETIRED and no preserves; all 25 historical refs and its own task branch were independently verified absent. Earlier #991's 20 historical refs and branch were also verified absent.

**Active task / branch:** AF-R079 seventh bounded historical cleanup wave, `chore/af-r079-reviewed-history-wave7-20261116`. The existing guarded-retirement JSON manifest replaces the previous wave with **25** verified merged main-PR heads #756–#782, excluding #760 (`tools/`) and #777 (`security/`) because those prefixes are not in the approved manifest allowlist. Every selected live ref exactly matched the historical merged PR head SHA, and each PR merge SHA was verified an ancestor of current main. They are *candidates*, not deleted branches. The unchanged executor must still verify retention labels, protected refs, open dependent PRs, ancestry and exact live refs and preserve on any mismatch. Run full exact-head CI, distinct ready-state promotion, review and protected SHA-guarded squash merge, then independently verify actual outcomes.

**Other same-writer PRs:** #993 AF-R062 gallery CSS `65ede06cfbe3d2bb07d97a7d75b20da87b84e055`, and #995 AF-R061 share-link brand token `f5db94434e6478a04bfefd4a6fa159ae1938aa5d` remain open with fast/database/production checks green and browser acceptance active on those respective heads as last checked. Reconcile each into latest main without force-push and rerun acceptance before merge. Finance draft PRs #684/#845 remain held.

**Production boundary:** Railway website SUCCESS at `c481cdf7a2a3de429682c635a595c2ec8816e6c1`; public version independently returned that exact SHA, branch main, environment production, public readiness `ready`. The later source SHAs #992 and #997 had Railway SKIPPED for both watched services; do not force a deployment to equalize source and runtime. The notification worker is parked, with no outbound activation.

**Hard locks:** domestic INR only/no FCRA, unresolved 80G classification conflict, 12A/12AB provisional; no unreviewed payment/RBAC/schema/secret/CSP changes or public identifiable faces. Public faces require redaction and EXIF/GPS removal. No donor outreach, live refunds, migration or notification activation.

**Canonical 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A. Do not inflate for sub-scopes.

**Next:** accept seventh-wave PR after checks and verify actual ref deletion; independently advance #993/#995 on current main; monitor automatic Railway outcomes; keep evidence boundaries separate.
