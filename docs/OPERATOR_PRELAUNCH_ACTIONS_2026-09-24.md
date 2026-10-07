# Amaana Foundation — Final Operator Prelaunch Actions

Updated: 7 October 2026

This document contains only the operator/external work that cannot be completed safely by repository automation. It does not authorize a production merge, a real payment, beneficiary submission, media publication or email delivery by itself.

## Frozen engineering candidate

- Integration branch: `phase-public-site-rebuild`
- Final integration SHA: `9bd04887cb57c28a73f201f8a5c7002657f2b427`
- Git tree: `7c42f5b8b452b16f2aea698a8068baf57a969009`
- Exact Railway preview: `c2b5327d-94ee-49f6-b10c-d7f70673a1fa` — SUCCESS
- Preview source is pinned to the exact SHA above.
- Preview pre-deploy: `node prisma/railway-predeploy.mjs`, timeout 300s.
- Preview healthcheck: `/api/health/ready` — passed.
- Production source: `main`
- Current production/main SHA: `29c7627ed3bffd0b581935c5b934ad903aeca2cd`
- Current production deployment: `b7f9f2e2-9234-4a64-8085-a9fdb326944a` — SUCCESS
- PR #104 remains Draft.
- Fixed budgets remain JavaScript 819200 bytes and CSS 348160 bytes; do not raise them.

## 1. Clear the neutral Railway staged patch

Railway environment patch `45c0bc6c-46db-4ed8-82cb-3a8f02dfb483` is a non-destructive no-op created during pre-deploy sequencing analysis.

Its two entries are exactly:

- production `preDeployCommand`: current value → identical current value
- production `preDeployTimeoutSeconds`: `60 → 60`

It has never been deployed and has zero live effect.

Before any production cutover, remove/discard this staged patch in the Railway dashboard. **Do not use Accept & Deploy merely to clear this metadata**, because that would trigger a production deployment for no functional change.

After discarding it, re-read the environment and confirm there are no staged changes or applying workflows.

## 2. Enforce GitHub `main` protection

Current evidence:

- `main` reports `protected=false`
- required status-check enforcement is off
- repository ruleset collection is empty
- the connected GitHub App cannot administer branch protection

Before PR #104 leaves Draft, configure GitHub protection/ruleset so normal promotion requires:

1. pull-request based changes to `main`;
2. current CI success on the latest PR head;
3. `Production promotion readiness`;
4. no ordinary force-push or branch deletion;
5. reviewed administrator/bypass behavior.

Then re-read GitHub's effective `main` branch/ruleset state and record that evidence. Do not mark the gate verified merely because a rule was created.

## 3. Complete one real Railway rollback rehearsal on preview

The connected Railway tools expose redeploy but not the real **Rollback** mutation. Redeploy is not an acceptable substitute.

Current rollback target:

- final preview deployment: `c2b5327d-94ee-49f6-b10c-d7f70673a1fa`
- final candidate SHA: `9bd04887cb57c28a73f201f8a5c7002657f2b427`
- Railway reports `canRollback=true`

In the Railway dashboard:

1. ensure no preview deployment is BUILDING/DEPLOYING;
2. identify the immediate previous known-good preview deployment that Railway still offers through **Rollback**;
3. choose **Rollback** exactly once;
4. wait for terminal SUCCESS;
5. verify target deployment/SHA, `/api/health/live`, `/api/health/ready`, noindex, Razorpay Test posture and private-route boundaries;
6. restore forward to the exact final candidate;
7. wait for terminal SUCCESS;
8. repeat health/posture/private-boundary checks;
9. record rollback and restore-forward deployment IDs/timestamps.

Do not touch the production service during this rehearsal.

## 4. Finish Resend domain verification and controlled email acceptance

As of 7 October 2026, Resend has moved `amaanafoundation.org` from failed to **pending** after a fresh provider verification was triggered.

All required records currently report pending:

- DKIM TXT `resend._domainkey`
- Return-Path MX `send`
- SPF TXT `send`
- CNAME `rsend`

Production application email must remain disabled until the provider reports the domain verified.

After verification:

1. confirm the approved `EMAIL_FROM` identity;
2. enable application email only in the approved production acceptance window;
3. send exactly one synthetic/non-beneficiary message to an Amaana-controlled recipient;
4. verify provider acceptance/receipt;
5. verify the queue reaches SENT and stores the provider message ID;
6. repeat the retry/idempotency path without producing a duplicate;
7. disable or retain production email mode only according to the approved operating decision.

Never use donor, beneficiary, medical, payment or case data for the first production email acceptance.

## 5. Complete the genuinely human review

Automation has already covered the broad route matrix, axe checks, responsive containment, keyboard/focus regressions, metadata, factual locks, structured data and cross-browser public smoke.

The remaining human review is intentionally narrow. Use `docs/FINAL_HUMAN_LAUNCH_QA_CHECKLIST.md` against the exact final candidate and record reviewer/date/outcome.

Do not substitute another automated run for the screen-reader/actual-zoom/visual judgement portion.

## 6. Release-scoped non-blockers

The following gates are resolved as `NOT_APPLICABLE` for this release, not as fabricated verification:

- **Public-media human review:** no new unreviewed public programme media is introduced by the frozen release. Future curated/owner-supplied media must re-enter the privacy/consent/provenance workflow before publication.
- **Controlled live donation acceptance:** no legitimate appeal is currently live; do not create a dummy appeal or unnecessary real-money charge.
- **Live refund/receipt operational observation:** provider-backed Test Mode refund/receipt behavior is already verified, but no legitimate live captured donation exists to refund. Observe this on the first legitimate live donation.

These conditions reactivate operationally when the underlying real-world event exists.

## 7. Race-free production cutover sequence

Perform only after every required production gate is VERIFIED or evidence-backed NOT_APPLICABLE and the owner explicitly authorizes production promotion.

### 7.1 Freeze current production triggers

To prevent `main` merge from racing Railway configuration:

1. record current web deployment and cron deployment;
2. pin the production web service to current known-good main SHA `29c7627ed3bffd0b581935c5b934ad903aeca2cd`;
3. pin `amaana-notification-cron` to the same known-good main SHA;
4. allow any same-SHA Railway operation triggered by pinning to settle SUCCESS before proceeding.

### 7.2 Configure the next production web deployment

While the web service is pinned:

- set production pre-deploy command to `node prisma/railway-predeploy.mjs`;
- set pre-deploy timeout to 300 seconds;
- retain `/api/health/ready` healthcheck;
- do not change payment, indexing, domain or secret posture.

The current old production image does not contain this wrapper, which is why the service must remain pinned until the new main SHA exists.

### 7.3 Promote repository

1. verify PR #104 latest head is still the frozen approved candidate;
2. verify required checks/protection;
3. mark PR #104 Ready only after the readiness register permits it;
4. merge according to the approved method;
5. record the resulting exact `main` merge SHA.

### 7.4 Deploy the web service deliberately

1. connect production web source to `main` pinned to the exact new main merge SHA;
2. wait for pre-deploy and deployment SUCCESS;
3. prove the pre-deploy logs ran the production environment contract and database release preparation;
4. verify `/api/health/live` and `/api/health/ready`;
5. verify the official domain, TLS, security headers, robots, sitemap, canonical URLs, indexing posture and private-route boundaries;
6. verify production Razorpay remains Live-only;
7. confirm HTTP 5xx remains zero during the acceptance window.

Only after acceptance, reconnect the web source to `main` without a commit pin so normal main-following deployment behavior resumes.

### 7.5 Promote the notification cron

After the web service is healthy on the new main SHA:

1. connect the cron to the same exact new main SHA;
2. verify the deployment settles;
3. verify the next scheduled execution succeeds;
4. reconnect the cron to `main` without a commit pin.

## 8. Production payment rule

Do not manufacture a real payment for release bookkeeping.

The first legitimate public appeal must receive an observed Live order/checkout/capture/signed-webhook/reconciliation path. Perform a live refund only when operationally appropriate for a legitimate transaction.

## 9. Final evidence to record

After production promotion, update `docs/RELEASE_STATUS.md` and the readiness register with:

- final main SHA;
- production web deployment ID;
- cron deployment ID and successful execution;
- exact pre-deploy evidence;
- official-domain health/indexing/security checks;
- branch-protection evidence;
- rollback rehearsal evidence;
- Resend/email acceptance evidence;
- human review outcome.

Never record credentials, tokens, private beneficiary data or full database URLs.
