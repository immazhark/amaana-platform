# AF-R015 — Cloudflare beacon CSP non-relaxation regression

**Date:** 11 November 2026 IST  
**Scope:** test-only CSP contract, not external Cloudflare dashboard changes or production payment activation.

## Observed source evidence

- `next.config.ts` on protected main at task start already applies an enforced `Content-Security-Policy` globally. Its scripts allow only the app origin and Razorpay checkout, with existing `'unsafe-inline'` (AF-R014 remains separately pending). `connect-src` allows only the app origin and Razorpay API. Neither directive authorizes Cloudflare Analytics beacon origins. Checkout frames remain explicitly constrained to Razorpay.
- Existing browser acceptance `e2e/security-headers.spec.mjs` checks general CSP and Razorpay transport but not explicit denial of Cloudflare beacon-host expansion or duplicate directives.
- The historical AF-R015 external Cloudflare Analytics console violation has **not** been independently reproduced in a browser runtime. Browser-side injection by an external CDN cannot be proved or stopped solely by static Next source checks.

## Test-first implementation

`scripts/test-cloudflare-beacon-csp.mjs` imports the actual `next.config.ts` under the existing Node 22 strip-types runtime and inspects the enforced global policy without making a network call. Synthetic mutation checks require the audit to reject Cloudflare script/connect origins, wildcard sources, missing Razorpay transports, duplicated directives and missing enforcement.

RED: hosted draft head `f050659329810a7c0f357d8bbd94bc8ad514705f`, CI `43017737705`, fast job `130513006376` failed at the dedicated `Guard Cloudflare analytics CSP denial without relaxing Razorpay checkout` step with `ERR_MODULE_NOT_FOUND` for the planned `scripts/cloudflare-beacon-csp.mjs` helper. This is a planned missing-implementation failure, not a discovered production outage.

GREEN candidate: `scripts/cloudflare-beacon-csp.mjs` parses CSP directives, rejects duplicates, requires the existing payment-related allowlists and reports generic failure types without echoing policy values. It contains no setter or network operations. Full exact-head hosted GREEN CI is required before accepting these tests. The helper accepts the existing development-only `'unsafe-eval'` if `NODE_ENV=development`; production must not acquire that exception.

**Explicit non-goals:** Do not remove `'unsafe-inline'` here, whitelist Cloudflare Analytics, modify payment/checkout CSP, activate a third-party beacon, install new dependencies, export secrets, enable notifications, or claim live AF-R015 closure. Changes are restricted to scripts, fast-CI coverage, and coordination/evidence.

**Second test-first correction:** Hosted RED run `43019276426`, fast job `130518357388` failed exactly the new case `AF-R015 allows a future reviewed removal of unsafe-inline without relaxing external origins`. The audit incorrectly required `'unsafe-inline'` on `script-src`, which would have blocked a future reviewed security improvement. Corrected on source commit `1689a2cd495752d74035ab91fea6c00d77459362`: `'unsafe-inline'` is accepted if still present but is no longer required. All other payment allowlist checks remain. Require fresh exact-head GREEN CI; do not treat the RED as a passing test.

**Live source boundary:** Protected #762 merged `b85ede6c7c51c189fbb7eb0b99dba562e9bd4478` after full CI `43014046360` and separate ready-state `43018514792`. Railway deployment `4dc61c76-a77e-4dd5-a55e-48cd92f04bbf` reports SUCCESS/Online at that source SHA. Public health/version paths were inaccessible from the independent verification channel, so runtime HTTP readiness remains unverified. This test-only branch does not force another website rollout.

**Integration:** Branch `test/cloudflare-beacon-csp-boundary-20261111` from main `ac3e13353da445d4a4924a3974d5d15213d0898e`, independent of the AF-R077 Web Vitals PR #762. The 149-item historical backlog denominator and #684 payee-verification hold remain unchanged. After all required tests, perform separate ready-state acceptance and guarded merge. Rollback only test/helper/CI/docs; no live infrastructure rollback applies.
