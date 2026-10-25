# Railway watch-path candidate and migration gate (25 October 2026)

**Status:** SOURCE-TESTED PROPOSAL — **NOT** applied to Railway. The running production service and all Railway service settings remain unchanged by this document.

## Why this exists

Production deployment `bfc9a01b-d03d-4c37-b893-efcad6f94003` was triggered by the #439 merge at `d262c8f17fa26bf3bf71c2709acce3b12fd046e0`: the PR added only `src/lib/public-llms-index.test.ts`, but Railway's active watch list contains `src/**`. It deployed successfully; public version and readiness checks passed. Avoiding repeated test-only production builds reduces operational exposure without weakening CI.

**Important 2026 product change:** [Railway Config as Code](https://docs.railway.com/config-as-code) is deprecated. Its `railway.json`/`railway.toml` support ends **1 December 2026**. Railway reads the legacy file **after** a new deployment is triggered, and file settings do **not** update service dashboard settings. Therefore changing `railway.json` cannot be relied upon to correct GitHub-trigger evaluation. Preserve the existing file unchanged until a dedicated, planned migration to [Infrastructure as Code](https://docs.railway.com/infrastructure-as-code).

## Proposed effective watch paths

The single candidate rule list lives in [`scripts/railway-watch-policy.json`](../scripts/railway-watch-policy.json). It preserves today's nine positive patterns, then adds one positive `railway.json` trigger and ordered negations for isolated TypeScript tests. Existing public, application, Prisma, dependency and build configuration triggers must continue working. `!src/**/` explicitly re-includes nested Git directories before negative leaf patterns, avoiding Gitignore parent-directory exclusion surprises.

`node --test scripts/test-railway-watch-contract.mjs` uses Git's own matcher and synthetic paths. It must prove representative runtime files **match** and test/docs/workflow files **do not**. The test also guarantees existing legacy builder/health/restart keys were not edited.

**Limit:** Railway calls the patterns gitignore-style; the local fixture validates Git semantics, **not Railway's effective cloud matcher**. Passing CI does not apply or certify service settings.

## Release procedure — separate controlled operator action

1. Confirm exact `main` SHA, production runtime SHA, health HTTP 200, 5xx baseline, and a clean Railway staged-change state. Record the service/environment IDs in a restricted operational record, never secrets.
2. Snapshot the existing service watch list from Railway. Compare proposed rules against runtime-positive and test-negative fixtures and review any newly added file types. Preserve rollback to the old list.
3. Use Railway service configuration staging to preview a **watchPatterns-only** change, not a restart, variable modification, new deploy, or unrelated patch. Verify that no other services/fields are in the staged diff.
4. Obtain separate explicit approval for applying the production environment patch. Do not call `accept_deploy` without that approval; it triggers a deployment workflow. If the patch is applied, verify the live dashboard watch list and service identity separately.
5. Verify a controlled test-only PR returns `SKIPPED` and a real runtime-source PR triggers a deployment. These checks must pass without live donations, refunds, database writes, or notification deliveries.
6. If match results differ, restore the prior watch list immediately through reviewed service configuration. Record the actual skip/trigger decisions. Do not mark the watch-path remediation complete until end-to-end results are observed.
7. **Before 1 December 2026**, plan the independent Config-as-Code to Infrastructure-as-Code migration with `railway config pull` and `railway config plan`. Review the prospective graph diff for accidental deletion, source/branch overrides, healthcheck changes or secrets before any apply. Do not remove `railway.json` until migration parity is proven.

## Evidence boundary

This PR changes only a proposed policy artifact, an offline Node regression and CI planning verification, plus this operator note. The 149 canonical audit classifications, application runtime, Railway service settings, public legal claims and financial integrations remain unchanged.
