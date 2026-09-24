# Amaana Platform — Production Handoff Configuration Audit

Date: 24 September 2026  
Integration branch: `phase-public-site-rebuild`  
Certified application candidate: `bce6b1d85bedc9da6e0fb38484e867db71cb4182`  
Current documentation head at audit start: `7eabaf67b7300edd3c83ad5726eb285b95f977b7`

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

## 2. Current production-service configuration gap

The reserved `amaana-platform` service still reflects the older Railway configuration:

- builder: RAILPACK
- source: `main`
- one replica in `asia-southeast1-eqsg3a`
- no explicit `/api/health/ready` healthcheck shown in current service config
- no explicit 300-second healthcheck timeout shown
- no explicit restart-policy retry count shown
- no application watch-pattern list matching the hardened preview service
- no custom production domain attached yet

By comparison, the certified `amaana-rebuild-preview` service currently has:

- `/api/health/ready` healthcheck
- 300-second healthcheck timeout
- restart retry limit of 3
- explicit application watch patterns
- the integration branch source
- the current public custom domain
- the hardened startup path exercised during the 24 September Neon outage

The production target must be brought into configuration parity deliberately before cutover. Do not assume branch promotion alone will inherit preview-service settings.

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

### Required production controls currently absent by variable name

At audit time, the reserved production service does **not** define:

- `APP_ENVIRONMENT`
- `EMAIL_DELIVERY_MODE`
- `PRODUCTION_INDEXING_DECISION`
- `NEXT_PUBLIC_ALLOW_INDEXING`
- `PUBLIC_MEDIA_BASE_URL`
- `PUBLIC_MEDIA_S3_ACCESS_KEY_ID`
- `PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY`
- `PUBLIC_MEDIA_S3_BUCKET`
- `PUBLIC_MEDIA_S3_ENDPOINT`
- `PUBLIC_MEDIA_S3_REGION`
- `PUBLIC_MEDIA_S3_FORCE_PATH_STYLE`

These are configuration blockers for the repository production-environment contract. They must not be filled by copying staging values blindly.

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
- [ ] `/api/health/ready` configured as Railway healthcheck
- [ ] healthcheck timeout set to 300 seconds
- [ ] restart behavior matches the hardened staging policy
- [ ] application watch patterns are reviewed for production
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

## 9. Current production-handoff decision

**NOT READY FOR PRODUCTION CUTOVER YET.**

This does not reflect an application-code failure. The certified application candidate is green. The remaining production work consists of explicit configuration, human/external acceptance gates, rollback rehearsal, indexing decision and owner authorization.

No production configuration was changed as part of this audit.

## 10. GitHub `main` branch protection gap

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

