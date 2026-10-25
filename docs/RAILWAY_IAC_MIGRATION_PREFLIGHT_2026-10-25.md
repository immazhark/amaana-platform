# Railway Infrastructure-as-Code migration: parity preflight

**Observed:** 25 October 2026 · **Scope:** read-only preparation · **No Railway setting, deployment, variable, or resource changed**

## Deployment facts requiring explicit parity

The Railway production environment contains **three live services** (website, rebuild preview, notification cron), **three buckets**, and **zero volumes**. Its website runs from `immazhark/amaana-platform`, branch `main`; the effective builder is **RAILPACK** with a **90-second** healthcheck, pre-deploy command `node prisma/railway-predeploy.mjs`, one replica in `asia-southeast1-eqsg3a`, sleep mode enabled, and nine existing watched path patterns.

The repository's legacy `railway.json` instead names **DOCKERFILE** and a **300-second** timeout and does not represent the live pre-deploy command or full project graph. A mechanical translation of that file is **not** an acceptable IaC migration specification.

The sanitized snapshot in [`scripts/railway-iac-observed-2026-10-25.json`](../scripts/railway-iac-observed-2026-10-25.json) records the above website settings, **non-secret effective profiles for both other services**, three service names, and **counts only** for buckets/volumes. It excludes bucket identities, environment variables, secrets, private tokens, deployment IDs and database contents. It is an **aging observation**, not automatic truth about current production.

**Do not accidentally activate the notification worker during IaC migration.** The actual worker runs under `/ops/notification-cron`, builds a Dockerfile, watches only `/ops/notification-cron/**`, has `startCommand=node --check run.mjs`, `restartPolicyType=NEVER`, and is parked on `cronSchedule=0 0 1 1 *`. These settings differ from historical issue [#264](https://github.com/immazhark/amaana-platform/issues/264), which describes an earlier failed full-Next.js-build state. Today's safe containment is **not** evidence of functioning five-minute delivery; keep delivery disabled until separate explicit notification/security/provider acceptance. The preview service remains on `phase-public-site-rebuild`, with RAILPACK, its observed source commit, its own 300-second readiness timeout and one `iad` replica.

The parity checker now rejects changes or missing settings for **both** these services in addition to the production website. A passing dated fixture still does **not** establish current live service safety or the full Railway IaC resource graph.

## Offline safety tests and CLI

```bash
node --test scripts/test-railway-iac-parity.mjs
node scripts/railway-iac-parity.mjs scripts/railway-iac-observed-2026-10-25.json
```

The tests reject missing/duplicate services, missing buckets, altered volumes, website and preview repository/branch drift, builder/health/pre-deploy/watch-pattern/sleep/replica changes, notification-cron activation or build-scope widening, missing service profiles and extra fields that may contain secrets. The second command compares a **manually sanitized proposal** against the dated snapshot; using the snapshot itself is a self-check only.

A successful offline comparison **does not verify** a generated `.railway/railway.ts` graph or Railway's current service state. Before any actual migration, recapture the environment inventory and compare with this dated reference. Review **all service settings, cron operation, bucket identities and variable preservation** privately; their complete semantics cannot be proven by this public, deliberately limited snapshot.

## Required IaC migration gates (no apply in this PR)

1. Review official [Railway Infrastructure as Code](https://docs.railway.com/infrastructure-as-code) and [CLI config](https://docs.railway.com/cli/config) documentation. Legacy Config as Code support ends **1 December 2026**. Confirm project and production environment selection with the operator.
2. From an authenticated *controlled operator workspace*, run `railway config migrate` **without `--apply`** to preview legacy translations, or `railway config pull` to import effective project state. These may write local files; do not publish generated raw exports without review. **Never use `--include-variables`, `--show-values` or `--decrypt-variables`** in shared outputs. Preserve existing variables with the generated `preserve()` references.
3. Audit the prospective graph against **all three services and three buckets**, including the notification cron's operational guardrails. With whole-project IaC, omitting a resource can be interpreted as deleting it. Choose a named partial only when justified by the project's repository boundaries and current ownership.
4. Compare the **effective** web service settings with the website invariants above, not the stale `railway.json`. Keep RAILPACK, effective pre-deploy command, live region/replicas, healthcheck and current watch list until a separate reviewed change proposes differences. Check all other service settings and bucket identities separately.
5. Run `railway config plan` **only** in the correct linked environment. Inspect the plan; target **0 unexpected adds, 0 unexpected changes, 0 destroys**. If Railway refuses because the legacy config still manages the service, follow the documented migration ordering; do not bypass the ownership conflict or drop the file in a separate PR without a rollback plan. The plan is read-only; **do not call `config migrate --apply`, `config apply`, `--yes`, `--confirm-destructive`, or an auto-apply GitHub Action** as part of this preparation.
6. Obtain explicit, separate production-change approval for the reviewed exact environment/plan after a safe rollback is rehearsed. Use an etag-pinned saved plan if/when execution is authorized. Verify health, runtime SHA, cron inactivity/permissions, bucket retention, variables, and all service states after any migration.
7. Roll out test-only source watch exclusions **separately** and confirm a test-only commit skips deployment while real runtime changes still build. Do not claim the proposed watch paths are installed in Railway based on their passing Git-semantic CI tests.

## Relation to existing work

This is a migration **preflight**, not migration completion. [Watch policy proposal](RAILWAY_WATCH_POLICY_ROLLOUT_2026-10-25.md) remains unapplied. No live donations, refunds, assistance submissions, notification sends, Railway variables, or databases were exercised. Historical 149-item Mission Control classifications remain unchanged.
