# Amaana implementation ownership — current checkpoint

**15 November 2026 IST. Sole implementation writer:** `CHATGPT_ACTIVE`. Read-only reviews and CI may proceed concurrently, but no competing code writer.

**Protected source:** `main` at `f45c963b8d17f2abe08beadaa5e50d44c7ed6709`, after AF-R013 #985 merged through all full and ready acceptance. Railway website and parked worker SKIPPED this local audit script/doc release; website last independent live SHA `b1a5b71872c201874a25c70d6a2b7dc632ac6e06`, ready.

**Current bounded task:** AF-R005 prebuild guard for concatenated credential aliases on `fix/af-r005-public-credential-aliases-20261115` from current main. Source `scripts/check-public-env-secret-names.mjs` and its focused regression. Synthetic public env names containing `SECRETKEY`, `APIKEY`, `ACCESSTOKEN`, `AUTHTOKEN`, `PRIVATEKEY` evade the existing underscore-token matcher. Write the failing regression first, verify RED, add minimal boundary-preserving classifier and prove existing permitted `NEXT_PUBLIC_RAZORPAY_KEY_ID` remains allowed. No secret values may be logged. No changes to production env vars, key rotation, payment/CSP, auth, infra or schema. Full exact-head CI, separate ready acceptance and SHA-guarded merge; original AF-R005 remains Partial.

**Other accepted work in flight:** AF-R012 [PR #986](https://github.com/immazhark/amaana-platform/pull/986), integrated head `edc0e820b7317e405baa456c9144162321bb0d11`, synthetic appeal cross-role negative tests. Its exact-head CI `43741654296` started, awaiting final selected acceptance. If it merges first, reconcile this branch without force push or dropping any code.

**Finance/legal/privacy holds:** draft #684/#845, Railway IaC production migration #446, live payments, notifications, donor records, schema/secrets, identifiable public faces, 80G unresolved; domestic INR only, no FCRA, 12A/12AB provisional.

**Canonical 149:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A. Count unchanged.

**Next:** RED isolated regression on original source, GREEN minimal classifier, inspect actual CI; never treat a test skipped as passed, separate source vs runtime identity.
