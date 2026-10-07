# Amaana Foundation Release Status

This is the single living release-status document for the public platform. Update it whenever a release is promoted, rolled back, or materially changes deployment topology. Do not store credentials or secret values here.

## Branch and deployment contract

- `main` is the production source of truth and the only branch connected to the Railway `amaana-platform` production service.
- `phase-public-site-rebuild` is the integration branch used for full CI and preview acceptance before production promotion.
- Feature, remediation and release-documentation branches merge into the integration branch only after their applicable CI gates pass.
- The Railway `amaana-rebuild-preview` service is non-indexable, email-disabled and payment-safe; it must never use live Razorpay credentials.
- The notification cron follows `main`, matching the public production release.

## Current verified production baseline

As of 2026-10-07, production remains on the known-good `main` commit:

`29c7627ed3bffd0b581935c5b934ad903aeca2cd`

Railway production deployment `b7f9f2e2-9234-4a64-8085-a9fdb326944a` is SUCCESS. The production service is sourced from `main`, the official domain `https://amaanafoundation.org` remains attached to that service, and the notification cron deployment `0c207866-fd6f-4c40-b7b9-257d4ae2181f` is SUCCESS with its latest execution succeeding.

## Final integration candidate

The exact final application-code candidate before this release-evidence update is:

`52063ad7ab7d9b0127023c17096284ca18681ab8`

It includes the merged P1/P2/security/strict-TypeScript/CSS-budget remediation train through PR #194.

Verified CI:

- Push CI run `37620193326` (#2364): plan, fast, database, production, browser and verify — SUCCESS.
- PR #104 CI run `37620199081` (#2365): plan, Production promotion readiness, fast, database, browser and verify — SUCCESS; production job skipped as expected for the PR event.
- Fixed bundle gates remained unchanged and passing:
  - JavaScript: `806040 / 819200` bytes.
  - CSS: `346301 / 348160` bytes.

## Exact Railway preview

- Service: `amaana-rebuild-preview`.
- Deployment: `c8a59b26-7f74-4f0f-9fe5-664bf6f2534c`.
- Commit: `52063ad7ab7d9b0127023c17096284ca18681ab8`.
- Status: SUCCESS; 1/1 replica online; zero active warning/critical notifications.
- Source: `phase-public-site-rebuild`, pinned to the exact commit above.
- Pre-deploy: `node prisma/railway-predeploy.mjs`.
- Logs verify the staging environment contract, no pending migrations, database release preparation completion and Railway pre-deploy release preparation.
- Readiness healthcheck `/api/health/ready` succeeded.
- Preview has only its Railway-generated domain and remains isolated from the official production domain.

## Promotion boundary

PR #104 is the formal promotion boundary from `phase-public-site-rebuild` to `main`. It remains Draft and mergeable.

Do not mark it ready or merge it merely because CI and preview are green. The fail-closed readiness register remains authoritative for unresolved operator/external gates.

Current genuine blockers include:

1. Resend domain verification and one controlled production delivery/retry/idempotency acceptance.
2. Manual rendered accessibility review.
3. Final editorial/SEO/social human review.
4. Current-release public-media privacy/consent/provenance review. The older zero-exposure audit predates later initiative-photo work and cannot clear the present gate by itself.
5. One real Railway rollback rehearsal on preview, followed by forward restoration and acceptance rerun.
6. Main branch protection/ruleset configuration. GitHub reports `main protected=false`; the connected integration cannot administer branch protection.

Condition-triggered obligations are not blockers for this release when their triggering condition does not exist:

- The first legitimate Live Razorpay donation must be observed end-to-end when a real public appeal is next published.
- Live refund/receipt acceptance must be observed when a legitimate captured production donation makes that operationally appropriate.

Do not manufacture a dummy appeal, expose unreviewed media or create a real-money transaction merely to clear a checklist.

## Production promotion gate

1. Fast CI, lint, TypeScript, unit and policy checks are green.
2. Isolated PostgreSQL checks are green.
3. Chromium responsive/accessibility/journey acceptance is green.
4. Firefox and WebKit public-surface smoke is green.
5. The exact Railway preview build and readiness healthcheck succeed.
6. Payment-sensitive changes preserve production-safe Razorpay boundaries.
7. Remaining fail-closed readiness gates are genuinely VERIFIED or intentionally NOT_APPLICABLE with evidence.
8. Railway must have no unresolved staged environment patch. The current no-op production pre-deploy patch must be discarded rather than accepted merely to clear metadata.
9. Before merging PR #104, pin both `amaana-platform` and `amaana-notification-cron` to the current known-good production `main` SHA. This freezes production while `main` advances.
10. While production is pinned, update `amaana-platform` pre-deploy to `node prisma/railway-predeploy.mjs` with a 300-second timeout. Do not redeploy the old pinned image after this command change because the wrapper does not exist in the old main image.
11. Merge the exact verified integration candidate to `main`. The pinned production services must remain on the known-good old SHA during this repository promotion.
12. Reconnect `amaana-platform` to the `main` branch without a commit pin. Its first candidate deployment must therefore run the new migration-aware pre-deploy wrapper before the application starts.
13. After the application deployment is healthy and exact-SHA verified, reconnect `amaana-notification-cron` to `main` without a commit pin and verify its next execution.
14. Run production health, official-domain, robots/sitemap, canonical/indexing, security-header, private-route, payment-boundary and cron checks.
15. Record the promoted SHA, deployment IDs and final runtime posture in this file.

## Rollback rule

Rollback to the most recent known-good production SHA when a new release fails health, payment, privacy, accessibility or public-surface verification. A release rehearsal is only VERIFIED after a real rollback action is executed and the target, health, staging noindex, Razorpay Test posture, private boundaries, forward restoration and acceptance rerun are all evidenced. Do not substitute a generic old-build redeploy unless Railway explicitly proves rollback semantics.
