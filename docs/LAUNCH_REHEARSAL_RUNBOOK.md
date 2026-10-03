# Amaana Platform — Launch Rehearsal & Rollback Runbook

This runbook is for the `phase-public-site-rebuild` integration line. It does **not** authorize a merge to `main`, production DNS changes, live payment, beneficiary-data mutation, or any other production cutover action.

## Core rule
A green build is not a launch decision. `docs/launch-readiness.json` is the evidence register and `npm run launch:rehearsal` / `npm run launch:production` are fail-closed checks. Change a gate to `VERIFIED` only after evidence exists. Never convert a pending external or human-review gate merely to make the command pass.

## 1. Freeze and identify the candidate
1. Stop parallel repository writers.
2. Record the exact integration SHA intended for rehearsal.
3. Confirm the pull-request CI and the push-triggered post-merge CI both succeeded on the expected code line.
4. Confirm Railway reports `SUCCESS` for the same exact SHA.
5. Keep the previous known-good Railway deployment/SHA recorded for rollback.
6. Enforce one Railway deployment workflow at a time for the staging service. If an automatic branch-triggered deployment is already BUILDING/DEPLOYING, do not start a manual redeploy of the same SHA. Parallel startup paths can contend on Prisma's migration advisory lock and surface transient P1002 failures even when the application is otherwise healthy.

## 2. Run repository readiness checks
From the candidate checkout:

```bash
npm ci
npm run launch:preflight
```

The candidate preflight is the standard read-only repository gate. It runs canonical factual-lock tests, public editorial/compliance guards, public-media structural checks, review-register validation, launch-register validation, Prisma validation, lint, TypeScript, unit tests and a production build.

For a rehearsal decision, run:

```bash
npm run launch:preflight:rehearsal
```

For the final production decision, run:

```bash
npm run launch:preflight:production
```

The rehearsal/production variants deliberately fail closed when unresolved readiness gates remain. They must never be made green by weakening a pending human, external, payment, privacy, rollback or authorization gate. `media:review-readiness` remains a separate production blocker while human privacy/consent/provenance review is outstanding.

## 3. Capture recovery evidence before rehearsal
Do not treat application CI as a database backup.

- Confirm a recoverable Neon/PostgreSQL snapshot or equivalent backup exists immediately before the rehearsal/cutover window.
- For a non-disruptive Neon restore drill, call snapshot restore with `finalize: false`. Do **not** rely on the default for a newly created restore branch: the default finalizes immediately and can reassign computes / swap branch names. Verify the isolated restored branch first, then finalize only when an intentional branch replacement is required.
- Record timestamp, environment, responsible operator, restore method and retention location in the operational change record; do not commit credentials or private database URLs to Git.
- Confirm private assistance-document storage is backed up/retained according to policy and remains separate from public media.
- If a migration is planned, verify it is backward/forward compatible with the rollback target. A destructive migration requires an explicitly tested restore path before cutover.

Only after this evidence exists should `database-backup-evidence` be changed to `VERIFIED`.

## 4. Rehearse staging behavior
Use the Railway preview/staging host, never the production Amaana domain:

```bash
STAGING_BASE_URL="https://<staging-host>" npm run acceptance:staging
```

The acceptance script verifies live/readiness health, noindex staging behavior, representative public routes, synthetic appeal/donation boundaries, and private assistance headers/messaging. It must not create a real donation or submit real beneficiary evidence.

Also verify the durable Playwright suite is green in CI. Manual rendered review remains necessary for 200% zoom and human visual judgement where automation cannot certify quality.

## 5. Rehearse rollback without production cutover
A rollback rehearsal should prove the team can return the staging service to the previous known-good artifact/SHA and recover normal health.

Before any rollback action:
- record candidate SHA/deployment and previous known-good SHA/deployment;
- confirm no incompatible database migration blocks rollback;
- confirm health endpoint and critical routes used to judge recovery.

Rehearsal sequence:
1. Deploy/redeploy the candidate in staging and confirm `/api/health/live` and `/api/health/ready`. Before triggering anything manually, confirm there is no existing BUILDING/DEPLOYING workflow for the same staging service; use the already-running workflow rather than creating a duplicate.
2. Run staging acceptance.
3. Record the candidate SHA and verify it with:
   ```bash
   STAGING_BASE_URL="https://<staging-host>" EXPECTED_COMMIT_SHA="<candidate-sha>" npm run rehearsal:verify-target
   ```
   The verifier also requires the target to report `APP_ENVIRONMENT=staging` and Razorpay `paymentMode=test` through the non-secret version health response; a rollback that accidentally exposes Live payment posture fails.
4. Revert staging to the previous known-good deployment/SHA using the hosting platform's supported rollback/redeploy procedure. Trigger exactly one rollback deployment and wait for its terminal status before any restore-forward action.
5. Verify the rollback target with the same command using the previous known-good SHA.
6. Restore the candidate to staging.
7. Run `rehearsal:verify-target` again with the candidate SHA, then repeat full staging acceptance.
8. Record timestamps and deployment IDs outside Git if they include operationally sensitive context.

Do not perform this sequence against production without explicit approval. When the rehearsal has actually succeeded, update `rollback-rehearsal` to `VERIFIED` with evidence.

## 6. Production environment handoff contract

Before any production deployment, set an explicit indexing decision rather than inheriting an ambient flag:

- `PRODUCTION_INDEXING_DECISION=keep_disabled` with `NEXT_PUBLIC_ALLOW_INDEXING=false` keeps the launch non-indexable.
- `PRODUCTION_INDEXING_DECISION=enable` with `NEXT_PUBLIC_ALLOW_INDEXING=true` is only valid after the separate human indexing gate is approved.

Then run:

```bash
npm run launch:env:production
```

The contract also requires the official `https://amaanafoundation.org` application origin, Live Razorpay posture, production email delivery, separate private/public storage buckets, an HTTPS private-storage endpoint, and `PUBLIC_MEDIA_BASE_URL=https://amaanafoundation.org/media`. It prints variable names and validation failures only; it must never print secret values.

The convenience scripts `launch:env:production:indexing-enabled` and `launch:env:production:indexing-disabled` set only the indexing decision variables. All other production values must still come from the approved production environment.

## 6. Production-only blockers
`npm run launch:production` must remain red until all production gates have evidence, including:

- human privacy/consent/provenance review of public media;
- dedicated public-media upload/delivery configuration if admin uploads are part of launch operations;
- CA confirmation of 12A/12AB status and careful use of the provisional 80G record;
- Razorpay live/KYC readiness;
- explicitly authorized controlled live donation verification, plus refund/acknowledgement/reconciliation operations;
- production backup evidence and successful rollback rehearsal;
- Cloudflare/DNS cutover and rollback plan;
- deliberate production indexing decision after SEO/privacy QA;
- explicit authorization to promote/merge to `main` and perform production cutover.

Amaana remains domestic-only unless/until lawful FCRA registration exists. No launch step should weaken that boundary.

## 7. Cutover order once explicitly approved
Only after `npm run launch:production` is green and explicit approval is given:
1. Record final candidate SHA and backup evidence.
2. Freeze content/admin mutations for the cutover window if needed.
3. Promote the approved code using the agreed repository flow.
4. Deploy and wait for health/readiness checks before DNS changes.
5. Apply the pre-recorded Cloudflare/DNS change.
6. Verify HTTPS, canonical host, robots/indexing decision, critical public routes and private-route headers.
7. Verify payment/provider webhooks only within the explicitly approved controlled test scope.
8. Monitor errors and operational queues during the agreed observation window.

## 8. Production rollback triggers
Rollback rather than patch-forward during cutover when there is a material security/privacy regression, unavailable critical route, failed readiness health, payment-integrity problem, broken private-data boundary, or widespread frontend failure that prevents core use.

Rollback order:
1. Stop further cutover changes and record the failure symptom/time.
2. If DNS caused the issue, restore the recorded prior DNS values first.
3. Redeploy the previous known-good application SHA/deployment.
4. Restore database state only when required by an incompatible/data-corrupting change and only through the tested restore procedure.
5. Re-check live/readiness health and the critical route set.
6. Keep production indexing/payment exposure disabled if their safety cannot be established.
7. Document the incident before attempting a new candidate.

## 9. Evidence hygiene
Never commit passwords, API keys, full database URLs, private beneficiary documents, medical records, identity documents, banking details, consent documents or other restricted evidence into readiness files. The repository records status and non-sensitive evidence references; secret/private proof remains in the appropriate protected operational system.

## Railway rollback rehearsal target viability — reverified 27 September 2026

The originally pinned rollback pair from 24 September is no longer safe to execute as written.

Live Railway history now reports:

- **Previously pinned rollback target**
  - deployment: `a2e7b849-9276-438c-969e-0cc6d5ce3aef`
  - application SHA: `dde1cb607010eabd1c84dacc5c513737fd0378f7`
  - status: `REMOVED`
  - `canRollback=false`
  - `canRedeploy=true`
- **Previously pinned restore-forward target**
  - deployment: `d0e7608a-df34-425b-9d30-79d1434b1064`
  - application SHA: `bce6b1d85bedc9da6e0fb38484e867db71cb4182`
  - status: `REMOVED`
  - `canRollback=false`
  - `canRedeploy=true`
- **Current successful staging deployment**
  - deployment: `368067ae-5bf4-4d00-90d9-43cc090eebc2`
  - source SHA: `e1efc19f75482f2eae5f988b2a469dc2848640d5`
  - commit: `privacy: remove orphaned public legacy videos`
  - status: `SUCCESS`
  - `canRollback=true`
  - `canRedeploy=true`

The exact integration branch HEAD remains `60462d9cf0f790321b21dab531a443d11911dc21`; its push and PR CI runs are green. Railway skipped the later empty-media validation/tooling commits because they did not require another application deployment, so the currently served staging deployment remains `368067ae-5bf4-4d00-90d9-43cc090eebc2`.

Railway's official documentation states that rollback to an arbitrary previous deployment is available only while the stored deployment image remains inside the plan's retention window. When an image is no longer rollback-eligible, Railway exposes **Redeploy** instead, which rebuilds the selected historical source/configuration and is not equivalent evidence for the no-rebuild rollback gate.

### Required preflight immediately before the rehearsal

1. Open the `amaana-rebuild-preview` service and the **Deployments** tab.
2. Confirm there is no BUILDING/DEPLOYING workflow already in progress.
3. Confirm the exact historical deployment that will serve as the previous known-good baseline currently exposes **Rollback** in Railway's dashboard.
4. Confirm the current candidate deployment that will be restored after the rollback is still present and identifiable by exact deployment ID and SHA.
5. If either required historical image no longer exposes **Rollback**, do **not** substitute a visually similar row and do **not** mark the gate verified.
6. Establish a fresh rollback-eligible rehearsal pair through Railway's supported dashboard workflow while keeping the Git branch unchanged, staging on Razorpay Test mode, and indexing disabled.
7. Record the fresh deployment IDs and exact SHAs before performing the rollback.
8. Execute exactly one real Railway **Rollback** to the fresh previous-known-good target.
9. Verify the rollback-generated deployment, strict health/readiness, Test-payment posture, noindex posture, representative public routes and private boundaries.
10. Restore forward to the fresh current candidate using Railway's supported historical deployment action, then repeat the same verification and staging acceptance.
11. Only after both directions are proven may `rollback-rehearsal` move from PENDING to VERIFIED.

Do not use Git history manipulation, branch repointing, or a normal latest-source redeploy as a substitute for Railway's actual historical rollback feature.

The currently connected Railway action surface still does not expose the arbitrary historical rollback mutation, so the operator must perform the dashboard rollback/restore actions manually and provide the resulting deployment evidence for verification.