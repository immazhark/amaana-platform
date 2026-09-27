# Amaana Platform — Production Handoff Configuration Audit

Original audit: 24 September 2026  
Live re-verification/update: 27 September 2026  
Integration branch: `phase-public-site-rebuild`  
Exact green integration HEAD before this update: `e6bf44c5a7caf6009972a6d477125c1c2076bb34`  
Current successful staging deployment: `368067ae-5bf4-4d00-90d9-43cc090eebc2` from source SHA `e1efc19f75482f2eae5f988b2a469dc2848640d5`

This is a read-only production-handoff audit. It does **not** authorize a merge to `main`, production DNS changes, Live Razorpay activity, indexing enablement, transactional email activation, or mutation of production secrets.

## 1. Reserved production service

Railway service:

- name: `amaana-platform`
- service id: `b40482be-5e5d-48cc-b36b-39beabfd5d5c`
- source repository: `immazhark/amaana-platform`
- source branch: `main`
- generated Railway domain: `amaana-platform-production.up.railway.app`
- custom domain: none currently attached
- latest recorded deployment at audit time: `4ae17816-5942-43fc-b24f-1e8ef1dd4f16`
- latest deployment SHA: `1a69dd179181390a488623accf1314a1ff09e319`
- latest deployment status: SUCCESS

This service is therefore a reserved production target, not the currently certified release candidate.

## 2. Production-service configuration parity — hardened 27 September 2026

The reserved `amaana-platform` service has now been aligned with the non-secret hardened deployment controls used by staging:

- builder: RAILPACK
- source: `main`
- one replica remains in `asia-southeast1-eqsg3a` (region intentionally unchanged)
- healthcheck: `/api/health/ready`
- healthcheck timeout: 300 seconds
- restart retry limit: 3
- application watch patterns:
  - `src/**`
  - `public/**`
  - `prisma/**`
  - `package.json`
  - `package-lock.json`
  - `next.config.ts`
  - `tsconfig.json`
  - `postcss.config.mjs`
  - `Dockerfile`
- no custom production domain attached yet

The Railway configuration mutation was made with no production deployment. Live deployment history remained unchanged: the latest production-service deployment is still `4ae17816-5942-43fc-b24f-1e8ef1dd4f16` on old `main` SHA `1a69dd179181390a488623accf1314a1ff09e319`.

This closes the non-secret service-configuration parity gap without authorizing a production candidate deployment or changing DNS, region, credentials, indexing, email delivery, or payment posture.

## 3. Production environment contract — variable-name audit

The repository's `scripts/check-production-environment.mjs` requires an explicit production contract.

The reserved production service already defines the following required variable names:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `EMAIL_FROM`
- `RESEND_API_KEY`
- `CRON_SECRET`
- `ASSISTANCE_TOKEN_PEPPER`
- `DONATION_TOKEN_PEPPER`
- `AUTH_RATE_LIMIT_PEPPER`
- private assistance-storage variables:
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `S3_BUCKET`
  - `S3_ENDPOINT`
  - `S3_REGION`
  - `S3_FORCE_PATH_STYLE`

Values are intentionally not recorded here.

### Production controls after 27 September fail-closed defaults

The reserved production service now defines these safe non-secret posture variables, with deployment explicitly skipped:

- `APP_ENVIRONMENT=production`
- `EMAIL_DELIVERY_MODE=disabled`
- `NEXT_PUBLIC_ALLOW_INDEXING=false`
- `STAGING_ACCEPTANCE_ON_START=false`
- `PUBLIC_MEDIA_ACCEPTANCE_ON_START=false`
- `AMAANA_BROWSER_ACCEPTANCE=false`

The remaining production contract decisions/resources still absent by variable name are:

- `PRODUCTION_INDEXING_DECISION` — intentionally unset until the explicit owner indexing decision;
- `PUBLIC_MEDIA_S3_BUCKET` — requires the approved production public-media bucket;
- `PUBLIC_MEDIA_BASE_URL` — production contract requires `https://amaanafoundation.org/media`.

The public-media runtime intentionally permits `PUBLIC_MEDIA_S3_REGION`, `PUBLIC_MEDIA_S3_ENDPOINT`, `PUBLIC_MEDIA_S3_ACCESS_KEY_ID`, `PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY`, and `PUBLIC_MEDIA_S3_FORCE_PATH_STYLE` to fall back to the private S3 provider/account settings while still requiring a physically/logically separate public-media bucket. Therefore those override variable names are **optional**, not unconditional blockers. When public-media access-key overrides are used, the production validator now requires the access-key ID and secret to be supplied together; optional endpoint overrides must use HTTPS.

Final production acceptance still requires the actual redacted values to pass `scripts/check-production-environment.mjs`; variable-name presence alone is not evidence that Live Razorpay, Resend, database, storage, or sender identity values are correct.

## 4. Values that require deliberate production verification

Because connected Railway OAuth redacts variable values, this audit does not claim the following values are correct merely because their names exist.

Before production acceptance, verify through the fail-closed environment contract that:

- `APP_ENVIRONMENT=production`
- `EMAIL_DELIVERY_MODE=live` only for the approved production acceptance window
- `NEXT_PUBLIC_APP_URL=https://amaanafoundation.org`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is a Live Razorpay key
- `RAZORPAY_KEY_SECRET` is the matching Live secret
- `RAZORPAY_WEBHOOK_SECRET` is the production Live-webhook secret
- `EMAIL_FROM` uses the approved `amaanafoundation.org` sender identity
- `RESEND_API_KEY` is the intended production Resend key
- `DATABASE_URL` points to the approved PostgreSQL production database
- private assistance storage uses HTTPS and remains private
- public-media storage is a physically/logically distinct bucket from private assistance storage
- `PUBLIC_MEDIA_BASE_URL=https://amaanafoundation.org/media`
- launch-only acceptance flags are not enabled in production

No secret values should be placed in Git, chat, or readiness documents.

## 5. Indexing decision remains explicit

The production service must not inherit an ambient indexing state.

Before the production build, select exactly one:

- `PRODUCTION_INDEXING_DECISION=keep_disabled` with `NEXT_PUBLIC_ALLOW_INDEXING` not true; or
- `PRODUCTION_INDEXING_DECISION=enable` with `NEXT_PUBLIC_ALLOW_INDEXING=true`.

Indexing also requires:

- `APP_ENVIRONMENT=production`
- official HTTPS origin `https://amaanafoundation.org`
- a production rebuild

A runtime-only flag change on a staging-built image must not make the site indexable.

## 6. Domain/cutover state

Current observed state:

- `amaanafoundation.org` is attached to `amaana-rebuild-preview`.
- `amaana-platform` has only its Railway-generated domain.
- production DNS/custom-domain cutover remains intentionally unperformed.

The official domain should move only after:

1. the approved candidate is promoted to `main`;
2. production variables pass the fail-closed environment contract;
3. the reserved production service uses the hardened health/readiness settings;
4. a production build/deployment is healthy on the Railway-generated domain;
5. controlled production payment/email acceptance scope is approved;
6. rollback targets and DNS rollback values are recorded;
7. explicit production-cutover authorization exists.

## 7. Configuration parity checklist before first production candidate deploy

Before deploying the first production candidate to `amaana-platform`:

- [ ] source branch remains `main`
- [ ] approved candidate has been explicitly promoted to `main`
- [x] `/api/health/ready` configured as Railway healthcheck
- [x] healthcheck timeout set to 300 seconds
- [x] restart behavior matches the hardened staging policy
- [x] application watch patterns aligned with the hardened staging service
- [ ] required production variables exist
- [ ] production environment contract passes without printing secrets
- [ ] assistance and public-media buckets are separate
- [ ] staging acceptance flags are absent/false
- [ ] Live Razorpay credentials are installed only on the production target
- [ ] production email sender identity is verified
- [ ] indexing decision is explicit
- [ ] official custom domain has **not** yet been moved during pre-domain acceptance
- [ ] only one Railway deployment workflow is active at a time

## 8. Evidence from 24 September outage

The certified staging candidate demonstrated the intended fail-closed behavior under a prolonged Neon incident:

- startup retry paths recovered from transient P1001 database reachability failures;
- concurrent deployments produced a transient Prisma P1002 advisory-lock contention, confirming why deployment workflows must be serialized;
- reviewed campaign import, RBAC seed and staging-acceptance seed recovered through bounded retry wrappers;
- Next.js reached Ready;
- Railway did not promote the candidate until database-backed readiness succeeded.

This operational evidence should inform the production service configuration rather than be bypassed by weakening readiness.

## 9. Transactional email provider state — 27 September 2026

Resend was audited directly:

- existing API keys: one key named `amaana-platform-staging`;
- configured sending domains before this block: none;
- historical transactional emails: none;
- new sending-domain resource created for `amaanafoundation.org`;
- sending enabled;
- receiving disabled;
- open/click tracking disabled;
- provider verification status: `not_started`;
- no production email sent;
- no production API key created.

The required DKIM/SPF records are now captured in `docs/OPERATOR_PRELAUNCH_ACTIONS_2026-09-24.md`. Production email delivery remains fail-closed until DNS verification, an approved production sender/API key and a controlled exactly-once staff acceptance are completed.

## 10. Current production-handoff decision

**NOT READY FOR PRODUCTION CUTOVER YET.**

This does not reflect an application-code failure. The certified application candidate is green. The remaining production work consists of explicit configuration, human/external acceptance gates, rollback rehearsal, indexing decision and owner authorization.

On 27 September 2026, only fail-closed/non-secret production preparation was changed: hardened Railway health/restart/watch settings and safe environment posture defaults. No production deployment, secret replacement, custom-domain move, Live Razorpay activation, live email activation or indexing decision occurred.

## 11. GitHub `main` branch protection gap

A live repository metadata check on 24 September 2026 found:

- `main.protected = false`
- required status-check enforcement: `off`
- required status-check contexts: none
- repository rulesets: none

This means CI and the dedicated `Production promotion readiness` job are currently visible safeguards but are not yet enforced by GitHub as an unskippable merge policy.

Before production promotion, enable branch protection or a repository ruleset for `main` that, at minimum:

- prevents accidental direct pushes/merges that bypass the pull-request path;
- requires the normal CI verification check;
- requires the `Production promotion readiness` check;
- does not permit the production PR to merge while those required checks are failing;
- preserves an explicit owner-controlled merge decision rather than enabling auto-merge.

After configuration, re-read `main` branch/ruleset metadata and record evidence before marking the `main-branch-protection` launch gate VERIFIED.

The connected GitHub installation does not expose administration writes for branch protection/rulesets, so this setting must be applied in GitHub repository settings by an authorized repository administrator.

