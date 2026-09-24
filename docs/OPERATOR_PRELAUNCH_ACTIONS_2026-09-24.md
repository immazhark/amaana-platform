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

### Fixed rollback target

- deployment: `a2e7b849-9276-438c-969e-0cc6d5ce3aef`
- application SHA: `dde1cb607010eabd1c84dacc5c513737fd0378f7`
- Railway history status at last verification: `REMOVED`
- `canRollback=true`
- `canRedeploy=true`

### Fixed restore-forward target

- deployment: `d0e7608a-df34-425b-9d30-79d1434b1064`
- application SHA: `bce6b1d85bedc9da6e0fb38484e867db71cb4182`
- Railway status at last verification: `SUCCESS`
- `canRollback=true`
- `canRedeploy=true`

### Pre-action rules

1. Confirm there is no BUILDING/DEPLOYING workflow already running for `amaana-rebuild-preview`.
2. Do not trigger duplicate rollback/redeploy actions.
3. Do not alter the Git branch/source to simulate rollback.
4. Do not touch the reserved production `amaana-platform` service.
5. Keep staging on Razorpay Test posture.
6. Keep indexing disabled.
7. Do not perform any real payment.

### Rollback action

In Railway:

1. Open `amaana-rebuild-preview`.
2. Open **Deployments**.
3. Locate deployment `a2e7b849-9276-4382-969e-0cc6d5ce3aef`.

**Important:** if Railway does not show that exact ID, stop and do not substitute a deployment by visual similarity. The canonical ID is `a2e7b849-9276-438c-969e-0cc6d5ce3aef`.

4. Open the **...** menu.
5. Choose **Rollback**.
6. Confirm once.
7. Wait for the rollback deployment to reach a terminal state.
8. Do not begin restore-forward while rollback is still BUILDING/DEPLOYING.

### Rollback verification

After rollback is terminal:

- verify Railway deployment metadata corresponds to SHA `dde1cb607010eabd1c84dacc5c513737fd0378f7`;
- verify `/api/health/live`;
- verify `/api/health/ready`;
- verify staging environment posture;
- verify Razorpay payment mode remains Test;
- verify indexing/noindex remains fail-closed;
- verify representative public routes and private-boundary routes;
- run the repository target verifier where available:

```bash
STAGING_BASE_URL="https://<staging-host>" \
EXPECTED_COMMIT_SHA="dde1cb607010eabd1c84dacc5c513737fd0378f7" \
npm run rehearsal:verify-target
```

Do not infer success if the version endpoint cannot prove the target. Use Railway deployment metadata plus the required health/posture checks.

### Restore-forward action

Only after rollback verification succeeds:

1. Use Railway's supported historical deployment action on candidate deployment `d0e7608a-df34-425b-9d30-79d1434b1064`.
2. Confirm once.
3. Wait for terminal status.
4. Verify the candidate SHA `bce6b1d85bedc9da6e0fb38484e867db71cb4182`.
5. Repeat live/readiness health.
6. Repeat Test-payment/noindex posture verification.
7. Re-run staging acceptance.

Repository verifier:

```bash
STAGING_BASE_URL="https://<staging-host>" \
EXPECTED_COMMIT_SHA="bce6b1d85bedc9da6e0fb38484e867db71cb4182" \
npm run rehearsal:verify-target
```

### Evidence required before resolving the gate

Record:

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
