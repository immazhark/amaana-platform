# Amaana Foundation Release Status

This is the single living release-status document for the public platform. Update it whenever a release is promoted, rolled back, or materially changes deployment topology. Do not store credentials or secret values here.

## Branch and deployment contract

- `main` is the production source of truth and the only branch connected to the Railway `amaana-platform` production service.
- `phase-public-site-rebuild` is the integration branch used for full CI and preview acceptance before production promotion.
- Feature and remediation branches merge into the integration branch only after their required CI gates pass.
- The Railway `amaana-rebuild-preview` service is non-indexable, email-disabled and payment-safe; it must never use live Razorpay credentials.
- The notification cron follows `main`, matching the public production release.

## Current verified production baseline

As of 2026-10-07, `main` and the successful Railway production baseline are commit:

`29c7627ed3bffd0b581935c5b934ad903aeca2cd`

The production and notification services were reconnected to `main` and redeployed successfully from that baseline.

## Active remediation train

- PR #190: P1 audit closure — accessibility, native keyboard scrolling, Railway build-time Prisma availability and homepage fallback-asset integrity.
- PR #191: draft P2 closure — reproducible dependencies/container base, branded application icons, typography hardening, database release preparation and remaining audit cleanup.

Never promote an active remediation SHA directly to `main` merely because its code exists. Promotion requires the gate below.

## Production promotion gate

1. Fast CI, lint, TypeScript, unit and policy checks are green.
2. Isolated PostgreSQL checks are green.
3. Chromium responsive/accessibility/journey acceptance is green.
4. Firefox and WebKit public-surface smoke is green.
5. The Railway preview build and readiness healthcheck succeed.
6. Payment-sensitive changes preserve production-safe Razorpay boundaries.
7. Integration is merged or fast-forwarded to `main` only after the exact candidate SHA is verified.
8. Railway production and notification deployments finish successfully.
9. Run production smoke, indexing/robots/canonical checks and payment-path verification.
10. Record the promoted SHA in this file.

## Rollback rule

Rollback to the most recent known-good production SHA when a new release fails health, payment, privacy, accessibility or public-surface verification. Do not repair production by bypassing CI or by pointing Railway back to an unverified feature branch.
