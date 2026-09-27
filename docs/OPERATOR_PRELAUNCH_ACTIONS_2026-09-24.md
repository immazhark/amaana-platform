# Amaana Platform — Operator Pre-Launch Actions

Date: 24 September 2026  
Integration branch: `phase-public-site-rebuild`  
Current protected candidate head at creation: `bb6483a357443cd56c7157cf532440d7e917df26`  
Production PR: #104 (Draft)

This checklist exists for the small number of launch controls that require an authenticated human/operator action outside the connected automation surface. It does **not** authorize production launch, merging `main`, Live Razorpay activity, DNS cutover, indexing, or live transactional email.

## A. Protect `main` in GitHub

### Current observed state

Repository metadata currently reports:

- `main.protected = false`
- required status-check enforcement = off
- required status-check contexts = none
- repository rulesets = none

The connected GitHub installation can verify this state but cannot administer branch protection/rulesets.

### Required operator action

In GitHub repository settings for `immazhark/amaana-platform`, create protection/ruleset coverage for branch `main`.

Minimum intended policy:

1. Require the pull-request path for normal promotion to `main`.
2. Require status checks before merging.
3. Require the normal CI verification check.
4. Require the `Production promotion readiness` check.
5. Keep the production PR owner-controlled; do not enable automatic merge merely because checks are green.
6. Do not enable ordinary force-push or deletion of `main`.
7. Review administrator/bypass behavior. The protection is only useful if production controls cannot be casually bypassed.
8. Prefer strict/up-to-date required checks if the repository workflow remains compatible with that policy.

GitHub documents that protected branches can require pull requests and passing status checks before merge, and that required checks must pass on the latest applicable commit. The exact UI wording can vary; validate the effective policy after saving rather than relying on the form state.

### Evidence to capture after saving

Return to ChatGPT with **no secrets required**. We will re-read repository metadata.

The gate may be marked VERIFIED only when the repository reports effective protection/ruleset enforcement for `main`, with the intended required checks.

Do not mark PR #104 Ready for Review yet merely because protection was enabled. All other production gates must still resolve.

---

## B. Execute the Railway staging rollback rehearsal

### Fixed staging service

- project: `amaana-platform-staging`
- service: `amaana-rebuild-preview`
- environment id: `38aede68-35aa-42de-adbc-49802e6d44e4`

### Live target state reverified 27 September 2026

The previously pinned pair has aged out of rollback eligibility and must not be used as if it were still valid:

- `a2e7b849-9276-438c-969e-0cc6d5ce3aef` / `dde1cb607010eabd1c84dacc5c513737fd0378f7`
  - status: `REMOVED`
  - `canRollback=false`
  - `canRedeploy=true`
- `d0e7608a-df34-425b-9d30-79d1434b1064` / `bce6b1d85bedc9da6e0fb38484e867db71cb4182`
  - status: `REMOVED`
  - `canRollback=false`
  - `canRedeploy=true`

Current successful staging deployment:

- deployment: `368067ae-5bf4-4d00-90d9-43cc090eebc2`
- source SHA: `e1efc19f75482f2eae5f988b2a469dc2848640d5`
- commit: `privacy: remove orphaned public legacy videos`
- status: `SUCCESS`
- `canRollback=true`
- `canRedeploy=true`

Current exact integration HEAD:

- `60462d9cf0f790321b21dab531a443d11911dc21`
- push CI `36027994092`: SUCCESS
- PR CI `36027999164`: SUCCESS

### Pre-action rules

1. Confirm there is no BUILDING/DEPLOYING workflow already running for `amaana-rebuild-preview`.
2. Do not trigger duplicate rollback/redeploy actions.
3. Do not alter the Git branch/source to simulate rollback.
4. Do not touch the reserved production `amaana-platform` service.
5. Keep staging on Razorpay Test posture.
6. Keep indexing disabled.
7. Do not perform any real payment.
8. Treat Railway's currently visible **Rollback** action as the authority for historical-image eligibility; stale documentation is not sufficient.

### Fresh-pair preparation

Because the original historical images are no longer rollback-eligible, establish a fresh rehearsal pair in Railway before the actual rollback:

1. In **Deployments**, select a known-good historical deployment whose exact SHA is already accepted for staging.
2. If Railway exposes only **Redeploy** for that old artifact, using **Redeploy** may be used only to create a fresh known-good baseline image; it does not by itself satisfy the rollback gate.
3. Wait for that fresh baseline deployment to reach terminal SUCCESS and verify its exact SHA, `/api/health/live`, `/api/health/ready`, staging posture, Razorpay Test mode and noindex.
4. Restore the current staging candidate through Railway's supported historical deployment action so that the fresh baseline becomes a recent previous deployment inside the rollback-retention window.
5. Verify the restored candidate by exact deployment metadata and the same health/posture checks.
6. Record both fresh deployment IDs and SHAs before continuing.

### Real rollback action

Only after the fresh pair is established:

1. Open the fresh previous-known-good deployment's **...** menu.
2. Confirm **Rollback** is visibly available.
3. Choose **Rollback** exactly once.
4. Wait for the rollback-generated deployment to reach a terminal state.
5. Do not begin restore-forward while rollback is BUILDING/DEPLOYING.

### Rollback verification

After rollback is terminal:

- verify Railway deployment metadata maps to the recorded previous-known-good SHA;
- verify `/api/health/live`;
- verify `/api/health/ready`;
- verify staging environment posture;
- verify Razorpay payment mode remains Test;
- verify indexing/noindex remains fail-closed;
- verify representative public routes and private-boundary routes;
- run the repository target verifier with the exact recorded rollback SHA:

```bash
STAGING_BASE_URL="https://<staging-host>" \
EXPECTED_COMMIT_SHA="<fresh-rollback-sha>" \
npm run rehearsal:verify-target
```

Do not infer success if the version endpoint cannot prove the target. Use Railway deployment metadata plus the required health/posture checks.

### Restore-forward action

Only after rollback verification succeeds:

1. Use Railway's supported historical deployment action on the recorded fresh candidate deployment.
2. Confirm once.
3. Wait for terminal status.
4. Verify the exact recorded candidate SHA.
5. Repeat live/readiness health.
6. Repeat Test-payment/noindex posture verification.
7. Re-run staging acceptance.

Repository verifier:

```bash
STAGING_BASE_URL="https://<staging-host>" \
EXPECTED_COMMIT_SHA="<fresh-candidate-sha>" \
npm run rehearsal:verify-target
```

### Evidence required before resolving the gate

Record:

- fresh previous-known-good deployment ID and SHA;
- fresh candidate deployment ID and SHA;
- rollback action timestamp;
- rollback-generated deployment ID;
- target SHA evidence;
- health/readiness outcome;
- Test-payment posture outcome;
- noindex outcome;
- restore-forward action timestamp;
- restore-forward deployment ID;
- restored candidate SHA evidence;
- final health/readiness outcome;
- staging acceptance outcome.

Do not put secrets, credentials, private beneficiary data, or full database URLs in the readiness register.

---

## C. Sequence after A and B

After GitHub protection is verified and the Railway rehearsal succeeds:

1. update only the readiness gates directly supported by evidence;
2. keep PR #104 Draft;
3. complete human rendered accessibility/background QA;
4. complete public-media privacy/consent/provenance review;
5. complete final editorial/SEO/social-preview review;
6. complete production email acceptance in the approved production environment;
7. configure production-only Railway variables and service parity;
8. make the explicit production indexing decision;
9. only after explicit authorization, promote PR #104 out of Draft / merge according to the approved production flow;
10. perform controlled Live payment/refund acceptance only within the explicitly approved scope.

A green CI state does not replace these operator gates.
