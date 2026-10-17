## 2026-10-18 — Razorpay checkout interrupted transport versus malformed donor data

Ownership: CHATGPT_ACTIVE. Narrow post-PR309 follow-up based on production main b5b12f0cf0586f909660e61ea2f9525edd49ec1f. The checkout endpoint previously combined JSON parsing and request-body stream reading in a single catch, returning 400 bad donor information when the network stream failed before the 5-second deadline. Test first: an errored actual ReadableStream must yield private retryable 503 + Retry-After 60 and must not call Zod schema, appeal lookup, Razorpay provider or donation write. Source separates bounded transport from JSON.parse. Preserve original 5-second deadline (private 503), 32 KiB maximum (413), fully received invalid JSON (400), legitimate Razorpay order and response validation. No live donation/checkout/provider operations. Exact-head fast/type/build/database/browser, final verify, ready-state and guarded release required.

## 2026-10-18 — Private header release and tracking integration

Ownership: CHATGPT_ACTIVE on existing PR304. PR305 passed full CI39069179565 and ready-state39073443799, guarded merge70dcbfc417c11a8c5197d0fc582ff81eb0e591a2. Railway99892b30-9230-4bba-a726-c3c43e1a3895 SUCCESS; origin version returned exact merge/main/production/live. Official domain returned403 from this environment; live header/readiness checks pending. PR304 inherits released header source/tests; tracking code unchanged from green57d4d404. Both coordination histories retained. Fresh combined exact-head CI and ready-state gate required before merge. Git push lacks credentials; connected GitHub API used. No live financial operations or outgoing mail.

## 2026-10-18 — Private response referrer policy after checkout-read production merge

Ownership: CHATGPT_ACTIVE. Reconciled PR305 against main b5b12f0cf0586f909660e61ea2f9525edd49ec1f (PR309 five-second Razorpay checkout body deadline merge). `next.config.ts`, `e2e/security-headers.spec.mjs`, `src/lib/private-response-headers.test.ts` remain disjoint and unchanged in main since last PR305 head. Private API/admin/checkout/referrer policy improvement remains isolated, while PR307 strict webhook accounting and PR309 checkout deadline are inherited from new main. Prior exact-head fast, database, production build successful and browser previously in-progress; fresh exact-head CI, browser/final verification and ready-state promotion are required before this PR merges. No provider events, live donation, private customer records or outgoing mail.

## 2026-10-18 — Referrer-Policy override isolated after strict webhook release

Ownership: CHATGPT_ACTIVE. Existing PR305 private response `no-referrer` override and unit/browser tests applied to deployed main d5d401b84627615a0a81836559fdacac9f948e68 (PR307 strict signed state now live). No Next config or header tests changed between old and new main; preserve finance, checkout, donation, receipt and assistance paths. Previous full hosted CI 39062129864 covered older head only; require new exact-head CI with browser and final verification, then promotion and guarded merge. No live donor/payment, secret modification or outgoing email performed.

## 2026-10-18 — Private no-referrer headers after refund-cap production release

Ownership: CHATGPT_ACTIVE. Reconcile PR305 effective no-referrer policy for private API/admin/payment endpoints with deployed main 82a9566ad98890a1613c547a4c9fad7571ccde91 including PR301 over-refund ledger safeguard. Code delta remains one Next config source and two matching unit/browser regressions. Previous exact-head full CI39062129864 passed on prior parent e05c88fa; this new head requires fresh CI and ready-state checks. Preserve checkout, receipt, transfer evidence and financial source untouched; no live financial operations or outgoing email.

## 2026-10-18 — Private Referrer-Policy integration after receipt timeout release

Ownership: CHATGPT_ACTIVE. Reconcile effective no-referrer response policy on private API/admin/donate endpoints with current main e05c88fac09de95cc4243ad9ea0b42b100c52f07, preserving released receipt 5-second absolute read timeout, evidence byte preflight and exact-paise eligibility. Only Next header policy and its source/browser tests differ from main. Previous CI39057939248 was full green for earlier f9d589 candidate, not this exact head. Require new hosted CI, promotion checks and guarded merge. No private donor lookup, financial operation, outgoing email or credentials change.

## 2026-10-17 — Private response policy after production transfer-proof release

Ownership: CHATGPT_ACTIVE. Reconciled PR305 private no-referrer override and effective Next/HTTP header regressions with main f9d589ffc0716c06ed1444db3dadb4836d7ec4b3 (merged PR300). Preserve receipt-signature preflight and exact-paise safeguards. Changes remain scoped to global headers, security-header browser tests, effective-header unit tests, and additive coordination records. Original CI39056681474 covers prior head only; new exact-head CI required, then ready-state promotion and main merge. No provider/donor writes, secret changes, or production deployment from this branch.

## 2026-10-17 — ChatGPT private-response policy integration

Ownership: CHATGPT_ACTIVE. Branch fix/private-response-referrer-policy-20261017, PR305. Reconcile already-tested private no-referrer policy and regression coverage against main #299 without changing provider or donor flows. Preserve both older coordination histories; PR300 remains a separate draft undergoing browser acceptance. No merge/deployment until fresh exact-head hosted checks and later main reconciliation. GitHub connector used because original local checkout is unavailable.

## 2026-10-17 — Private header reconciliation with deployed settlement

Ownership: HANDOFF_PENDING. PR305 original f0227ffe passed full hostedCI39049214820. Reconciled deployed main303 fb2d1c19, preserving both handoff entries and all runtime changes. Combined47 focused/full912 passed9 skipped; types/E2E syntax/diff pass. No new runtime edits to privacy policy, no payments. Fresh exact-head hosted validation required after this integration.

## 2026-10-17 — Live-confirmed private response header override

Ownership: HANDOFF_PENDING after scoped header repair. Branch fix/private-response-referrer-policy-20261017 from deployed main ebc0b8e. Direct production version reports exact merged SHA and invalid synthetic receipt404 remains generic, but response Referrer-Policy is strict-origin-when-cross-origin despite route no-referrer. Repair global Next private-surface header precedence using real Next configuration resolver regression tests. Public Cloudflare request blocked403; origin behavior verified separately. RED: eight sensitive paths resolved public referrer policy through actual Next config resolver. GREEN:11 effective-policy regressions pass (plus2 optimizer tests); full908 passed/9 skipped, TypeScript/focused lint/E2E syntax/diff pass. New native HTTP browser tests pending hosted gates; independent review requested. No donor/payment/credential mutation.

## 2026-10-18 — Assistance tracking privacy and outage classification on live checkout-deadline baseline

Ownership: CHATGPT_ACTIVE. Surgical reconcile PR304 against released main b5b12f0cf0586f909660e61ea2f9525edd49ec1f. Existing independent 60/hour hashed tracking quota, private 8 KiB absolute five-second body stream guard, client 429 guidance, and new tests for database outage (private retryable 503), interrupted body stream (private retryable 503) and malformed but complete JSON (private indistinguishable found:false) preserved. PR309 live checkout deadline is inherited without rewriting payment code. The 8 private tracking/assist source and test files were verified identical between PR304's previous base and new main before graft. Fresh exact-head fast/type/build/db/browser/final verification and ready-state gate required; do not merge based on prior older-head green checks. No donor/assistance production records changed or viewed.

## 2026-10-18 — Tracking failure classification, private retry correctness

Ownership: CHATGPT_ACTIVE. PR304 now treats assistance status database lookup failures as private 503 with Retry-After 60 instead of returning 200 found:false (which wrongly invalidated valid beneficiaries' tracking links). Shared 8 KiB/5-second reader classification now distinguishes transport interruptions/timeout (private retryable 503) from completed malformed JSON (private 200 found:false), with quota 429 (3600 seconds) kept distinct in UI. Three additional unit regressions authored before implementation: database failure, interrupted stream, and completed malformed JSON. Preserve same-origin checks, one-way hashed rate-limit tokens, no credential leakage, no case-record writes, and private retry UI. Current candidate relies on fresh exact-head hosted tests, browser journeys, build, database, final verify, promotion, and guarded merge; old CI is not release evidence. No real beneficiary records or messages were accessed or sent.

## 2026-10-18 — Tracking quota feedback matched to backend 429/503

Ownership: CHATGPT_ACTIVE. Existing PR304 backend 60/hour independent tracking quota returns `429` with Retry-After 3600; the status UI previously classified it as a network outage. Browser test authored first asserts `Tracking temporarily limited`, one-hour wait guidance and unchanged fragment/query credential scrubbing; `503` retains generic unavailable state. UI now uses TrackingRateLimitedError for exact 429 classification without disclosing reference/token in text, logs or URL and preserves explicit in-memory retry. Head f523adda7406b1511c084de577512fbfdcd2586a. Require exact-head full fast/browser/build/database/final CI then ready-state; do not merge with unverified feature. No real beneficiary record, direct transfer, provider call or outgoing mail.

## 2026-10-18 — Private tracking quota and absolute body-read deadline after signed webhook release

Ownership: CHATGPT_ACTIVE. PR304 retains independent hashed 60/hour tracking lookups, private 429/503 before case database work, a bounded absolute five-second read with nonsettling stream cancellation safety, and HTTP/browser retries preserving private reference/token. Reconciled with production main d5d401b84627615a0a81836559fdacac9f948e68 after PR307 strict signed webhook validation merged. Source from PR304 is disjoint from newly changed webhook files; retain receipt and payment protections without copying stale source. New exact-head CI including browser and final verify is required before promotion. No live assistance records, refunds, secrets or outgoing emails affected.

## 2026-10-18 — Assistance tracking rate limit after signed refund-cap release

Ownership: CHATGPT_ACTIVE. PR304 independent 60/hour private tracking quota reconciled against deployed PR301 main 82a9566ad98890a1613c547a4c9fad7571ccde91. Source and browser changes are unchanged relative to its fully green previous head; updated main only adds financial webhook guard with disjoint paths. Existing standalone receipt 30/hour, assistance submit 3/hour, donor/receipt privacy, 5-second receipt timeout and exact-paise preflight are retained. Require fresh hosted exact-head CI + ready-state promotion before main merge. No real assistance lookup, payment, outgoing notification or provider action.

## 2026-10-17 — Assistance tracking quota after receipt timeout and transfer-proof release

Ownership: CHATGPT_ACTIVE. Existing PR304 independent 60/hour private tracking allowance is reconciled against main e05c88fac09de95cc4243ad9ea0b42b100c52f07 including #306 5-second receipt deadline and #300 exact-paise transfer-evidence preflight. Both retry browser journeys retained: receipt availability 503 and assistance tracking 429/503. Private 429/503 occurs before case read; distinct tracking hash/pepper remains isolated from receipt, submission, donation and analytics budgets. Exact-head CI required; never create actual assistance case or financial claim for verification.

## 2026-10-17 — Private tracking integration against current main

Ownership: CHATGPT_ACTIVE. PR304 existing branch fix/assistance-tracking-rate-limit-20261017 integrates exact 60/hour tracking quota, isolated hashed quota, privacy-safe 429/503 before case reads and retry browser regressions against main #299. Preserve existing receipt 30/hour and assistance submission 3/hour quotas, exact-paise payment guards and settled confirmation. Browser tests from main #303 retained in shared journey file. Previous local RED/GREEN and 903-pass evidence is historical; fresh hosted exact-head CI needed. No live case, payment, refund, secret or outgoing email action. PR300 and PR305 remain independently gated.

## 2026-10-17 — Receipt release and additive tracking reconciliation

Ownership: HANDOFF_PENDING. PR302 merged main ebc0b8e after full exact-head CI39045711385, successful ready-for-review promotion39048668531 and independent AI source review (no critical/important findings, no fabricated GitHub approval). Railway deployment5a6f0f10 is BUILDING on the merged SHA; not yet live-verified. PR304 reconciled with this main, preserving both receipt/tracking hashes, allowance helpers and isolated privacy stubs. Combined focused50 and full903 tests pass/9 skipped; type/lint pass. Additional actual-helper coverage exercises tracking60, receipt30 and assistance3 independent boundaries. Fresh reconciled hosted gates required.

## 2026-10-17 — Private assistance tracking quota extraction

Ownership: HANDOFF_PENDING after scoped implementation. Branch fix/assistance-tracking-rate-limit-20261017 from main aedae001. Extract one privacy safeguard from #292: independent 60/hour tracking allowance before private case reads, with fail-closed availability errors. Reuse hashed attempt ledger and assistance pepper; no migration or private record mutation. RED: route quota denial and ledger failure returned 200; tracking purpose used wrong pepper and lacked quota function. GREEN: 46 focused tests and full suite 900 passed/9 skipped; TypeScript/focused ESLint/diff/E2E syntax pass. Added two browser quota/outage retry journeys; not yet executed. Shared request-security/private-record test files require additive reconciliation after #302, preserving both purposes and both fixture stubs. No main merge, live requests, case records or deployments.

## 2026-10-17 — Receipt ingress hard read deadline against deployed transfer-proof main

Ownership: CHATGPT_ACTIVE. Existing PR306 receipt JSON endpoint now has a 5-second absolute read deadline before rate-limit/donor lookup, distinct private 503 Retry-After response, and non-awaiting cancellation of stalled streams. Default bounded-reader callers remain unchanged. Integrated against released PR300 main f9d589ffc0716c06ed1444db3dadb4836d7ec4b3 preserving settlement confirmation, donation exact-paise eligibility, evidence preflight, and all other current files. Existing negative tests and HTTP browser token retry retained. Old 912-pass evidence is from earlier head; require fresh exact-head database/build/browser acceptance, ready-state gate and independent review. No real payment/refund, receipt lookup with donor credentials, secret change or notification send.

## 2026-10-17 — Settlement release retained in receipt deadline

Ownership: HANDOFF_PENDING. PR303 merged main fb2d1c19 after fullCI39048295083, ready gate39050449878 and independent AI review; Railway4ecc31e9 SUCCESS; direct production origin version200 confirms exact fb2d1c19/main/production/live and synthetic empty confirmation POST returns private400/noindex without provider action. Custom-domain verification remains Cloudflare-blocked. PR306 incorporates this main, preserving both settlement and receipt retry browser cases and both handoff entries. Combined full912 passed/9 skipped, types/E2E syntax/diff pass. No production charge/refund. Fresh hosted checks required on reconciled306.

## 2026-10-17 — Private receipt body read deadline

Ownership: HANDOFF_PENDING after receipt deadline slice. Branch fix/receipt-body-deadline-20261017 from deployed main ebc0b8e. Extract bounded elapsed reader option and five-second receipt JSON deadline from historical292; preserve default byte reader behavior, hostile cancellation safety, private503 availability recovery before quota/donor lookup. RED: stalled/trickle reads remain pending, invalid timeouts accepted and route never returns by5s. GREEN:43 focused and full908 passed/9 skipped; TypeScript/focused lint/diff/E2E syntax pass. Independent AI source review no critical/important findings; noted timer upper bound now tested and rejected. One E2E503 explicit retry/token preservation case authored, not yet executed. Hosted exact-head gates pending. No secrets/schema/payment/receipt-data mutations.

## 2026-10-17 — Combined transfer proof and exact-balance safeguards

Ownership: HANDOFF_PENDING. Continued PR300 on fix/transfer-proof-preflight-20261017, preserving its original remote head24b381a3 and incorporating main2ee89d902cd4f03a1e3afb4f1182f19eb1286986 after PR299 merged. Both signature preflight before financial writes and exact-paise eligibility remain. Malformed-balance regressions now carry a valid PNG signature to exercise both guards together. Clarified signature checks do not prove document authenticity. Independent read-only AI review reports no important findings. Focused59 and full952 tests passed/9 skipped; TypeScript, focused ESLint and diff checks passed. Fresh exact-head hosted checks required before release; no live claim, charge, refund or email created. PR299 Railway deployment d4e77705-3ac1-420f-be25-04aa42f47adb reports SUCCESS at exact main2ee89d90; direct-origin smoke verification is separate. Next: inspect PR300 hosted acceptance, then ready/merge only after required gates pass and verify deployment. Historical PR292 remains extraction-only.

## 2026-10-17 — Receipt ingress hard read deadline against deployed transfer-proof main

Ownership: CHATGPT_ACTIVE. Existing PR306 receipt JSON endpoint now has a 5-second absolute read deadline before rate-limit/donor lookup, distinct private 503 Retry-After response, and non-awaiting cancellation of stalled streams. Default bounded-reader callers remain unchanged. Integrated against released PR300 main f9d589ffc0716c06ed1444db3dadb4836d7ec4b3 preserving settlement confirmation, donation exact-paise eligibility, evidence preflight, and all other current files. Existing negative tests and HTTP browser token retry retained. Old 912-pass evidence is from earlier head; require fresh exact-head database/build/browser acceptance, ready-state gate and independent review. No real payment/refund, receipt lookup with donor credentials, secret change or notification send.

## 2026-10-17 — Settlement release retained in receipt deadline

Ownership: HANDOFF_PENDING. PR303 merged main fb2d1c19 after fullCI39048295083, ready gate39050449878 and independent AI review; Railway4ecc31e9 SUCCESS; direct production origin version200 confirms exact fb2d1c19/main/production/live and synthetic empty confirmation POST returns private400/noindex without provider action. Custom-domain verification remains Cloudflare-blocked. PR306 incorporates this main, preserving both settlement and receipt retry browser cases and both handoff entries. Combined full912 passed/9 skipped, types/E2E syntax/diff pass. No production charge/refund. Fresh hosted checks required on reconciled306.

## 2026-10-17 — Private receipt body read deadline

Ownership: HANDOFF_PENDING after receipt deadline slice. Branch fix/receipt-body-deadline-20261017 from deployed main ebc0b8e. Extract bounded elapsed reader option and five-second receipt JSON deadline from historical292; preserve default byte reader behavior, hostile cancellation safety, private503 availability recovery before quota/donor lookup. RED: stalled/trickle reads remain pending, invalid timeouts accepted and route never returns by5s. GREEN:43 focused and full908 passed/9 skipped; TypeScript/focused lint/diff/E2E syntax pass. Independent AI source review no critical/important findings; noted timer upper bound now tested and rejected. One E2E503 explicit retry/token preservation case authored, not yet executed. Hosted exact-head gates pending. No secrets/schema/payment/receipt-data mutations.

## 2026-10-17 — Combined transfer proof and exact-balance safeguards

Ownership: HANDOFF_PENDING. Continued PR300 on fix/transfer-proof-preflight-20261017, preserving its original remote head24b381a3 and incorporating main2ee89d902cd4f03a1e3afb4f1182f19eb1286986 after PR299 merged. Both signature preflight before financial writes and exact-paise eligibility remain. Malformed-balance regressions now carry a valid PNG signature to exercise both guards together. Clarified signature checks do not prove document authenticity. Independent read-only AI review reports no important findings. Focused59 and full952 tests passed/9 skipped; TypeScript, focused ESLint and diff checks passed. Fresh exact-head hosted checks required before release; no live claim, charge, refund or email created. PR299 Railway deployment d4e77705-3ac1-420f-be25-04aa42f47adb reports SUCCESS at exact main2ee89d90; direct-origin smoke verification is separate. Next: inspect PR300 hosted acceptance, then ready/merge only after required gates pass and verify deployment. Historical PR292 remains extraction-only.

## 2026-10-18 — Strict webhook-state security isolated after refund-cap production merge

Ownership: CHATGPT_ACTIVE. PR301 financial over-refund cap merged to main 82a9566ad98890a1613c547a4c9fad7571ccde91. PR307 strictly validates signed captured/failed/refund-processed provider state ahead of replay acknowledgements, preserving PR301's transaction rollback on capped refund plus all #299/#300/#306 safeguards. Code differences from latest main limited to Razorpay webhook validation and its route/payment-failed tests. Fresh hosted exact-head CI, ready-state check, and only then guarded release. No real webhook, provider refunds, financial writes, secret edits, or outgoing emails.

## 2026-10-17 — Strict signed webhook-state candidate refreshed after receipt release

Ownership: CHATGPT_ACTIVE. PR307 strict payment captured/failed and refund processed state validation before replay lookup remains stacked on PR301. Parent PR301 a08d223e52272e5d2e2c99926e7636fd5e9beba9 incorporates merged #306 receipt deadline, #300 proof preflight and #299 exact-paise safeguards. This candidate combines strict-state and capped refund guards without copying stale unrelated source. Preserve 2 over-refund cases, strict replay cases and valid-HMAC failure/capture. New exact-head CI must pass; merge #301 first, then refresh #307 after #301 is released. No actual payment/refund/webhook replay and no email were executed.

## 2026-10-17 — Integrated financial webhook guards on capped-refund candidate

Ownership: CHATGPT_ACTIVE. Existing PR307 strict signed capture/failure/processed-refund entity validation before replay DB lookup is combined in its own candidate branch with existing PR301 capped-refund rollback guard. Parent financial candidate PR301 b349917b89bf3e3b2adb6e382f410bf2b97ad52d must be independently reviewed, fully tested, and merged first. After #301, PR307 becomes a strict-state-only delta against main; rerun exact-head hosted integration if main changes. Added both financial-over-refund tests to PR307's strict-state and valid HMAC regression suite; no real provider/refund/replay or outgoing message actions. Preserve unmodified payment-confirmation and exact-paise guards. Do not publish PR307 ahead of PR301.

## 2026-10-17 — Signed webhook financial state validation

Ownership: HANDOFF_PENDING after strict webhook guard. Branch fix/webhook-financial-state-validation-20261017 from deployed main303 fb2d1c19. Extract strict capture/failure/refund entity states before replay acknowledgement from historical292. Official Razorpay payment/refund webhook examples checked: capture statuscaptured + capturedtrue; refundprocessed statusprocessed. Preserve signatures, exact INR amounts, ledger/idempotency and PR301 over-refund reconciliation on integration. RED:16 strict-state/replay regressions fail before implementation. GREEN:97 focused/full921 passed9 skipped; type/focused lint/diff pass. Positive capture+matching replay verified; valid failed HMAC cases retained and missing statuses added. Original capture-invalid fixture now includes capturedtrue so identity cases remain reachable. Independent review requested; hosted DB/build/browser acceptance pending. No provider or real ledger operations.

## 2026-10-17 — Receipt ingress hard read deadline against deployed transfer-proof main

Ownership: CHATGPT_ACTIVE. Existing PR306 receipt JSON endpoint now has a 5-second absolute read deadline before rate-limit/donor lookup, distinct private 503 Retry-After response, and non-awaiting cancellation of stalled streams. Default bounded-reader callers remain unchanged. Integrated against released PR300 main f9d589ffc0716c06ed1444db3dadb4836d7ec4b3 preserving settlement confirmation, donation exact-paise eligibility, evidence preflight, and all other current files. Existing negative tests and HTTP browser token retry retained. Old 912-pass evidence is from earlier head; require fresh exact-head database/build/browser acceptance, ready-state gate and independent review. No real payment/refund, receipt lookup with donor credentials, secret change or notification send.

## 2026-10-17 — Settlement release retained in receipt deadline

Ownership: HANDOFF_PENDING. PR303 merged main fb2d1c19 after fullCI39048295083, ready gate39050449878 and independent AI review; Railway4ecc31e9 SUCCESS; direct production origin version200 confirms exact fb2d1c19/main/production/live and synthetic empty confirmation POST returns private400/noindex without provider action. Custom-domain verification remains Cloudflare-blocked. PR306 incorporates this main, preserving both settlement and receipt retry browser cases and both handoff entries. Combined full912 passed/9 skipped, types/E2E syntax/diff pass. No production charge/refund. Fresh hosted checks required on reconciled306.

## 2026-10-17 — Private receipt body read deadline

Ownership: HANDOFF_PENDING after receipt deadline slice. Branch fix/receipt-body-deadline-20261017 from deployed main ebc0b8e. Extract bounded elapsed reader option and five-second receipt JSON deadline from historical292; preserve default byte reader behavior, hostile cancellation safety, private503 availability recovery before quota/donor lookup. RED: stalled/trickle reads remain pending, invalid timeouts accepted and route never returns by5s. GREEN:43 focused and full908 passed/9 skipped; TypeScript/focused lint/diff/E2E syntax pass. Independent AI source review no critical/important findings; noted timer upper bound now tested and rejected. One E2E503 explicit retry/token preservation case authored, not yet executed. Hosted exact-head gates pending. No secrets/schema/payment/receipt-data mutations.

## 2026-10-17 — Combined transfer proof and exact-balance safeguards

Ownership: HANDOFF_PENDING. Continued PR300 on fix/transfer-proof-preflight-20261017, preserving its original remote head24b381a3 and incorporating main2ee89d902cd4f03a1e3afb4f1182f19eb1286986 after PR299 merged. Both signature preflight before financial writes and exact-paise eligibility remain. Malformed-balance regressions now carry a valid PNG signature to exercise both guards together. Clarified signature checks do not prove document authenticity. Independent read-only AI review reports no important findings. Focused59 and full952 tests passed/9 skipped; TypeScript, focused ESLint and diff checks passed. Fresh exact-head hosted checks required before release; no live claim, charge, refund or email created. PR299 Railway deployment d4e77705-3ac1-420f-be25-04aa42f47adb reports SUCCESS at exact main2ee89d90; direct-origin smoke verification is separate. Next: inspect PR300 hosted acceptance, then ready/merge only after required gates pass and verify deployment. Historical PR292 remains extraction-only.

## 2026-10-17 — Receipt ingress hard read deadline against deployed transfer-proof main

Ownership: CHATGPT_ACTIVE. Existing PR306 receipt JSON endpoint now has a 5-second absolute read deadline before rate-limit/donor lookup, distinct private 503 Retry-After response, and non-awaiting cancellation of stalled streams. Default bounded-reader callers remain unchanged. Integrated against released PR300 main f9d589ffc0716c06ed1444db3dadb4836d7ec4b3 preserving settlement confirmation, donation exact-paise eligibility, evidence preflight, and all other current files. Existing negative tests and HTTP browser token retry retained. Old 912-pass evidence is from earlier head; require fresh exact-head database/build/browser acceptance, ready-state gate and independent review. No real payment/refund, receipt lookup with donor credentials, secret change or notification send.

## 2026-10-17 — Settlement release retained in receipt deadline

Ownership: HANDOFF_PENDING. PR303 merged main fb2d1c19 after fullCI39048295083, ready gate39050449878 and independent AI review; Railway4ecc31e9 SUCCESS; direct production origin version200 confirms exact fb2d1c19/main/production/live and synthetic empty confirmation POST returns private400/noindex without provider action. Custom-domain verification remains Cloudflare-blocked. PR306 incorporates this main, preserving both settlement and receipt retry browser cases and both handoff entries. Combined full912 passed/9 skipped, types/E2E syntax/diff pass. No production charge/refund. Fresh hosted checks required on reconciled306.

## 2026-10-17 — Private receipt body read deadline

Ownership: HANDOFF_PENDING after receipt deadline slice. Branch fix/receipt-body-deadline-20261017 from deployed main ebc0b8e. Extract bounded elapsed reader option and five-second receipt JSON deadline from historical292; preserve default byte reader behavior, hostile cancellation safety, private503 availability recovery before quota/donor lookup. RED: stalled/trickle reads remain pending, invalid timeouts accepted and route never returns by5s. GREEN:43 focused and full908 passed/9 skipped; TypeScript/focused lint/diff/E2E syntax pass. Independent AI source review no critical/important findings; noted timer upper bound now tested and rejected. One E2E503 explicit retry/token preservation case authored, not yet executed. Hosted exact-head gates pending. No secrets/schema/payment/receipt-data mutations.

## 2026-10-17 — Combined transfer proof and exact-balance safeguards

Ownership: HANDOFF_PENDING. Continued PR300 on fix/transfer-proof-preflight-20261017, preserving its original remote head24b381a3 and incorporating main2ee89d902cd4f03a1e3afb4f1182f19eb1286986 after PR299 merged. Both signature preflight before financial writes and exact-paise eligibility remain. Malformed-balance regressions now carry a valid PNG signature to exercise both guards together. Clarified signature checks do not prove document authenticity. Independent read-only AI review reports no important findings. Focused59 and full952 tests passed/9 skipped; TypeScript, focused ESLint and diff checks passed. Fresh exact-head hosted checks required before release; no live claim, charge, refund or email created. PR299 Railway deployment d4e77705-3ac1-420f-be25-04aa42f47adb reports SUCCESS at exact main2ee89d90; direct-origin smoke verification is separate. Next: inspect PR300 hosted acceptance, then ready/merge only after required gates pass and verify deployment. Historical PR292 remains extraction-only.

## 2026-10-18 — Checkout read deadline after signed webhook-state release

Ownership: CHATGPT_ACTIVE. PR309 5-second absolute checkout JSON ingress timeout and three actual request tests preserved on current main d5d401b84627615a0a81836559fdacac9f948e68 after PR307 merged. New main touches only financial webhook source/tests and handoff docs; no checkout code was replaced. Existing provider validation, exact paise, receipt timeout, and transfer evidence preflight preserved. Fresh exact-head CI, promotion/ready-state checks required before merge. No financial/provider writes or outgoing email.

## 2026-10-18 — Razorpay checkout JSON absolute body deadline

Ownership: CHATGPT_ACTIVE. New atomic branch fix/checkout-order-body-deadline-20261018 from verified production main 82a9566ad98890a1613c547a4c9fad7571ccde91. Source checkout POST previously limited JSON to 32 KiB but allowed indefinite slow request streams after quota. Tests authored first: actual never-ending body with nonsettling cancellation, trickle body whose 5-second deadline never resets, complete invalid JSON. Code now uses previously released bounded reader absolute timeout 5,000 ms, private retryable 503 Retry-After 60 before schema, appeal read, Razorpay create, or donation write; prior 413/400 and valid paid order behavior unchanged. Full hosted Vitest, typecheck, lint, database, build, browser, and ready-state checks remain required before merge. No live payment, provider call, donation write or outgoing mail was used. Avoid merging unrelated draft PRs.

## 2026-10-18 — Strict webhook-state security isolated after refund-cap production merge

Ownership: CHATGPT_ACTIVE. PR301 financial over-refund cap merged to main 82a9566ad98890a1613c547a4c9fad7571ccde91. PR307 strictly validates signed captured/failed/refund-processed provider state ahead of replay acknowledgements, preserving PR301's transaction rollback on capped refund plus all #299/#300/#306 safeguards. Code differences from latest main limited to Razorpay webhook validation and its route/payment-failed tests. Fresh hosted exact-head CI, ready-state check, and only then guarded release. No real webhook, provider refunds, financial writes, secret edits, or outgoing emails.

## 2026-10-17 — Strict signed webhook-state candidate refreshed after receipt release

Ownership: CHATGPT_ACTIVE. PR307 strict payment captured/failed and refund processed state validation before replay lookup remains stacked on PR301. Parent PR301 a08d223e52272e5d2e2c99926e7636fd5e9beba9 incorporates merged #306 receipt deadline, #300 proof preflight and #299 exact-paise safeguards. This candidate combines strict-state and capped refund guards without copying stale unrelated source. Preserve 2 over-refund cases, strict replay cases and valid-HMAC failure/capture. New exact-head CI must pass; merge #301 first, then refresh #307 after #301 is released. No actual payment/refund/webhook replay and no email were executed.

## 2026-10-17 — Integrated financial webhook guards on capped-refund candidate

Ownership: CHATGPT_ACTIVE. Existing PR307 strict signed capture/failure/processed-refund entity validation before replay DB lookup is combined in its own candidate branch with existing PR301 capped-refund rollback guard. Parent financial candidate PR301 b349917b89bf3e3b2adb6e382f410bf2b97ad52d must be independently reviewed, fully tested, and merged first. After #301, PR307 becomes a strict-state-only delta against main; rerun exact-head hosted integration if main changes. Added both financial-over-refund tests to PR307's strict-state and valid HMAC regression suite; no real provider/refund/replay or outgoing message actions. Preserve unmodified payment-confirmation and exact-paise guards. Do not publish PR307 ahead of PR301.

## 2026-10-17 — Signed webhook financial state validation

Ownership: HANDOFF_PENDING after strict webhook guard. Branch fix/webhook-financial-state-validation-20261017 from deployed main303 fb2d1c19. Extract strict capture/failure/refund entity states before replay acknowledgement from historical292. Official Razorpay payment/refund webhook examples checked: capture statuscaptured + capturedtrue; refundprocessed statusprocessed. Preserve signatures, exact INR amounts, ledger/idempotency and PR301 over-refund reconciliation on integration. RED:16 strict-state/replay regressions fail before implementation. GREEN:97 focused/full921 passed9 skipped; type/focused lint/diff pass. Positive capture+matching replay verified; valid failed HMAC cases retained and missing statuses added. Original capture-invalid fixture now includes capturedtrue so identity cases remain reachable. Independent review requested; hosted DB/build/browser acceptance pending. No provider or real ledger operations.

## 2026-10-17 — Receipt ingress hard read deadline against deployed transfer-proof main

Ownership: CHATGPT_ACTIVE. Existing PR306 receipt JSON endpoint now has a 5-second absolute read deadline before rate-limit/donor lookup, distinct private 503 Retry-After response, and non-awaiting cancellation of stalled streams. Default bounded-reader callers remain unchanged. Integrated against released PR300 main f9d589ffc0716c06ed1444db3dadb4836d7ec4b3 preserving settlement confirmation, donation exact-paise eligibility, evidence preflight, and all other current files. Existing negative tests and HTTP browser token retry retained. Old 912-pass evidence is from earlier head; require fresh exact-head database/build/browser acceptance, ready-state gate and independent review. No real payment/refund, receipt lookup with donor credentials, secret change or notification send.

## 2026-10-17 — Settlement release retained in receipt deadline

Ownership: HANDOFF_PENDING. PR303 merged main fb2d1c19 after fullCI39048295083, ready gate39050449878 and independent AI review; Railway4ecc31e9 SUCCESS; direct production origin version200 confirms exact fb2d1c19/main/production/live and synthetic empty confirmation POST returns private400/noindex without provider action. Custom-domain verification remains Cloudflare-blocked. PR306 incorporates this main, preserving both settlement and receipt retry browser cases and both handoff entries. Combined full912 passed/9 skipped, types/E2E syntax/diff pass. No production charge/refund. Fresh hosted checks required on reconciled306.

## 2026-10-17 — Private receipt body read deadline

Ownership: HANDOFF_PENDING after receipt deadline slice. Branch fix/receipt-body-deadline-20261017 from deployed main ebc0b8e. Extract bounded elapsed reader option and five-second receipt JSON deadline from historical292; preserve default byte reader behavior, hostile cancellation safety, private503 availability recovery before quota/donor lookup. RED: stalled/trickle reads remain pending, invalid timeouts accepted and route never returns by5s. GREEN:43 focused and full908 passed/9 skipped; TypeScript/focused lint/diff/E2E syntax pass. Independent AI source review no critical/important findings; noted timer upper bound now tested and rejected. One E2E503 explicit retry/token preservation case authored, not yet executed. Hosted exact-head gates pending. No secrets/schema/payment/receipt-data mutations.

## 2026-10-17 — Combined transfer proof and exact-balance safeguards

Ownership: HANDOFF_PENDING. Continued PR300 on fix/transfer-proof-preflight-20261017, preserving its original remote head24b381a3 and incorporating main2ee89d902cd4f03a1e3afb4f1182f19eb1286986 after PR299 merged. Both signature preflight before financial writes and exact-paise eligibility remain. Malformed-balance regressions now carry a valid PNG signature to exercise both guards together. Clarified signature checks do not prove document authenticity. Independent read-only AI review reports no important findings. Focused59 and full952 tests passed/9 skipped; TypeScript, focused ESLint and diff checks passed. Fresh exact-head hosted checks required before release; no live claim, charge, refund or email created. PR299 Railway deployment d4e77705-3ac1-420f-be25-04aa42f47adb reports SUCCESS at exact main2ee89d90; direct-origin smoke verification is separate. Next: inspect PR300 hosted acceptance, then ready/merge only after required gates pass and verify deployment. Historical PR292 remains extraction-only.

## 2026-10-17 — Receipt ingress hard read deadline against deployed transfer-proof main

Ownership: CHATGPT_ACTIVE. Existing PR306 receipt JSON endpoint now has a 5-second absolute read deadline before rate-limit/donor lookup, distinct private 503 Retry-After response, and non-awaiting cancellation of stalled streams. Default bounded-reader callers remain unchanged. Integrated against released PR300 main f9d589ffc0716c06ed1444db3dadb4836d7ec4b3 preserving settlement confirmation, donation exact-paise eligibility, evidence preflight, and all other current files. Existing negative tests and HTTP browser token retry retained. Old 912-pass evidence is from earlier head; require fresh exact-head database/build/browser acceptance, ready-state gate and independent review. No real payment/refund, receipt lookup with donor credentials, secret change or notification send.

## 2026-10-17 — Settlement release retained in receipt deadline

Ownership: HANDOFF_PENDING. PR303 merged main fb2d1c19 after fullCI39048295083, ready gate39050449878 and independent AI review; Railway4ecc31e9 SUCCESS; direct production origin version200 confirms exact fb2d1c19/main/production/live and synthetic empty confirmation POST returns private400/noindex without provider action. Custom-domain verification remains Cloudflare-blocked. PR306 incorporates this main, preserving both settlement and receipt retry browser cases and both handoff entries. Combined full912 passed/9 skipped, types/E2E syntax/diff pass. No production charge/refund. Fresh hosted checks required on reconciled306.

## 2026-10-17 — Private receipt body read deadline

Ownership: HANDOFF_PENDING after receipt deadline slice. Branch fix/receipt-body-deadline-20261017 from deployed main ebc0b8e. Extract bounded elapsed reader option and five-second receipt JSON deadline from historical292; preserve default byte reader behavior, hostile cancellation safety, private503 availability recovery before quota/donor lookup. RED: stalled/trickle reads remain pending, invalid timeouts accepted and route never returns by5s. GREEN:43 focused and full908 passed/9 skipped; TypeScript/focused lint/diff/E2E syntax pass. Independent AI source review no critical/important findings; noted timer upper bound now tested and rejected. One E2E503 explicit retry/token preservation case authored, not yet executed. Hosted exact-head gates pending. No secrets/schema/payment/receipt-data mutations.

## 2026-10-17 — Combined transfer proof and exact-balance safeguards

Ownership: HANDOFF_PENDING. Continued PR300 on fix/transfer-proof-preflight-20261017, preserving its original remote head24b381a3 and incorporating main2ee89d902cd4f03a1e3afb4f1182f19eb1286986 after PR299 merged. Both signature preflight before financial writes and exact-paise eligibility remain. Malformed-balance regressions now carry a valid PNG signature to exercise both guards together. Clarified signature checks do not prove document authenticity. Independent read-only AI review reports no important findings. Focused59 and full952 tests passed/9 skipped; TypeScript, focused ESLint and diff checks passed. Fresh exact-head hosted checks required before release; no live claim, charge, refund or email created. PR299 Railway deployment d4e77705-3ac1-420f-be25-04aa42f47adb reports SUCCESS at exact main2ee89d90; direct-origin smoke verification is separate. Next: inspect PR300 hosted acceptance, then ready/merge only after required gates pass and verify deployment. Historical PR292 remains extraction-only.

## 2026-10-17 — Exact checkout and settlement current-main verification

Ownership: HANDOFF_PENDING. PR299 corrected4ef74ae5 passed full hostedCI39050147508. Reconciled deployed303 fb2d1c19 preserving exact page bounds and all settlement/browser controls; only coordination notes conflicted and both records retained. Combined full938 passed9 skipped; TypeScript/diff pass. Fresh exact-head hosted acceptance required. Preserve299-before300; no provider/financial writes or deployment.

## 2026-10-17 — Exact checkout page bounds regression

Ownership: HANDOFF_PENDING after exact-bound repair. Existing PR299 head045c497b passed hosted CI but independent AI review found page still passes floating subtraction to both forms. goal2.01 raised0.01 yields max1.9999999999999998 and rejects valid2. Repair page to consume exact-paise helper, with actual server-page/rendered prop regression and valid/unpayable cases. RED: actual server-page render shows max1.9999999999999998 and unpayable projection renders. GREEN: shared exact-paise helper feeds page/form with null fail-closed guard;64 focused and full combined934 passed/9 skipped, TypeScript/focused lint/diff pass. Independent AI follow-up confirms important finding resolved. Incorporated main302 additively. Fresh hosted acceptance required; preserve299-before300 order.

## 2026-10-17 — Settled payment confirmation extraction

Ownership: HANDOFF_PENDING after scoped extraction. Branch fix/settled-payment-confirmation-20261017 from main aedae001. Extract only persisted settlement confirmation and browser lock from historical #292; preserve current provider validation and webhook concurrency. New PR, independent of #299/#300/#301/#302. RED: four nonsettled status cases returned 200 instead of 409. GREEN: 14 confirmation tests pass; full local suite 898 passed/9 skipped. TypeScript, focused ESLint, E2E syntax and diff checks pass. Six browser cases authored for nonsettled HTTP-200 responses; hosted browser/build/database gates pending. No live payment, merge or deployment.

## 2026-10-13 — actual HTTP cancellation regressions

Ownership: CODEX_ACTIVE on the preserved N-28 follow-up branch; validated release3414858b remains unchanged. Added actual assistance and direct-transfer route cases using the real body reader/error class: an oversized stream whose cancel promise never settles returns private413 and does not create a case/donation or upload evidence. Both route cases fail with rejection stalled when only awaited cancellation is restored. Fixed source:34 tests across3 suites passed; TypeScript and focused ESLint passed. Assistance test mock now retains the actual error class to verify the real classifier. No live requests, provider calls or production database writes.

Exact release CI38379820058 still reported running at checkpoint; no main merge based on the old tree's green CI. Worker image and other release checks passed. Preserve independent tests until current release is complete.

## 2026-10-13 — production promotion and independent upload batch checkpoint

Ownership: HANDOFF_PENDING. Consolidated14269ad passed full CI38365252911 across fast/database/production/browser/final verify. PR282 guarded-merged into security3414858b3f325ee120b702e66109b6f67cfac87a, whose tree matches the validated candidate. PR215 remains the sole open release PR. Exact release CI38379820058: promotion readiness, fast, PostgreSQL and production build/budgets passed; browser/final still pending at checkpoint. Worker image CI38379820284 passed. No main merge or new deployment yet.

Production config prepared without deploy: PUBLIC_MEDIA_BASE_URL=https://amaanafoundation.org/media, AMAANA_BROWSER_ACCEPTANCE=false, NEXT_PUBLIC_ENABLE_WEB_VITALS=false. Tested migration preflight node prisma/railway-predeploy.mjs/300s remains configured. Secrets are OAuth-redacted; existing credential names preserved. Notification worker still has old root/build/start config and year-only containment; no real email or authenticated job invocation performed.

Independent N-28 on fix/request-body-cancellation-20261013: original reader awaits a never-settling cancel and hangs an oversized-body rejection. Fake-timer baseline fails; non-awaited cancellation rejects promptly and preserves existing cancellation-failure semantics.107 tests across7 relevant suites, types and lint passed. Direct transfer additionally avoids a redundant body allocation up to5.25MiB per request;32 body/upload tests, types and lint passed. Assistance already used typed bytes directly and was unchanged. Implementation saved401f9574 then894f77a92f27fb698972cb3a260ee1ebdd9d6961; no PR opened or change made to release head. Integrate this follow-up after current production candidate is safely promoted, keeping evidence and scope distinct.

Production remains2a8c35ad; historical95 closure totals unreconciled. New-body finding:FIX_IMPLEMENTED/FOCUSED_TESTS_PASSED, unintegrated and not production-closed. Next checkpoint: final215 release result, guarded main merge only if successful, Railway SUCCESS/SHA/live verification, then targeted follow-up integration.

## 2026-10-13 — independent body rejection correction

Ownership: CODEX_ACTIVE on fix/request-body-cancellation-20261013, based on security3414858b. Consolidated14269ad full CI38365252911 passed all selected gates;282 guarded-merged3414858b;215 final CI38379820058 running. Production unchanged. Canonical media URL and disabled fixture/Web-Vitals flags set with skipDeploys. N-28 implemented: oversized stream rejection previously awaited cancellation indefinitely if underlying cancel never settled. New fake-timer regression fails on the original with rejection stalled; non-awaited best-effort cancel preserves immediate RequestBodyTooLargeError.107 tests across7 body/payment/assistance/webhook suites passed, with typecheck and focused ESLint. Direct-transfer multipart parsing now reuses the bounded Uint8Array directly instead of an extra full-size ArrayBuffer copy (up to5.25MiB per request); assistance already used direct typed bytes and is unchanged.32 body/upload route tests, typecheck and focused ESLint pass after this optimization. Keep this independent commit unintegrated until current release gate finishes; do not mutate the validated release head. Keep current release head unchanged while implementing independently.

## 2026-10-13 — PR backlog reconciled to two release PRs

Ownership: HANDOFF_PENDING. Closed11 verified superseded PRs278,279,280,281,274,249,253,258,240,247,241 with per-PR retained-scope evidence; no branches deleted. Recovered missing real-scrypt tests via existing254: refreshed02ef12c0 passed targeted CI38364040345, guarded mergec3e05f5a. Reconciled original216 without reverting newer work: refreshed025a8247 passed targeted CI38364789878, guarded merge3633cb172edcd671f13227740d76da95c9a5a3d1. Only282 consolidated release and215 main-promotion PR remain open. No new PR created in this cleanup batch.

Preserved unique importer batching/deduplication/UTC timestamps, donation card containment, isolated PostgreSQL cases, scoped Stylelint and readable-label browser regressions. Current safeguards remain:12px status badge, postbuild image weight, privacy migration checks, real-scrypt observer tests and payment/media boundaries. Local891 unit tests passed/9 skipped;41 importer/planner passed/4 PostgreSQL skipped; full ESLint/Stylelint/typecheck passed. Prior original216 full CI38252706957 passed exact retained importer/CSS source; refreshed targeted verification does not certify final integrated browser/database acceptance.

Earlier consolidated03b95b1a full CI38362023764 passed plan/fast/database/production/browser/final verify. It does not certify newer3633cb17. Final combined release gates required before promoting282→215→main. No live deployment or current-production closure asserted. Historical95 closure totals remain unreconciled. Production remains2a8c35ad; Railway migration preflight is configured for next deployment, with OAuth variable-value compatibility still unverified.

## 2026-10-13 — remaining importer/CSS reconciliation

Ownership: CODEX_ACTIVE refreshing existing PR216 onto consolidatedc3e05f5a. PR254 exact refreshed head02ef12c0 passed stacked CI38364040345 and mergedc3e05f5a. Open backlog now215,216,282;11 superseded PRs closed with evidence.

PR216 unique work retained from39b671a1: bulk master/factual-lock reads, scoped media deduplication preserving first metadata and repeat idempotency, UTC updatedAt parity for four bulk legacy category writes; donation CSS folded into one authority with shrinkable grid and link wrapping; importer/browser/CI coverage and scoped Stylelint. Keep newer status badge.75rem, postbuild weight guard, historical-pageview migration checks, route reporting and current stacked security work. Never copy its stale package/workflow/globals snapshots wholesale. 41 importer/planner cases passed locally, including7 importer model cases;4 actual PostgreSQL cases skipped locally. Combined unit891 passed/9 skipped, full ESLint/Stylelint/typecheck passed. Both new browser specs parse. Exact refreshed-head hosted gates and final integration database/browser acceptance remain required. Previous exact-head CI38252706957 passed but does not certify this refreshed candidate. No production data writes or deployment.

## 2026-10-13 — superseded PR cleanup and missing coverage recovery

Ownership: CODEX_ACTIVE for existing PR254 refresh onto consolidated03b95b1a. Closed11 superseded PRs:278,279,280,281,274,249,253,258,240,247,241, after comparing actual source/test deltas and fresh heads. Each closure body explains retained coverage; no branch deletion, stale merge or production closure.

Four PRs remain:215 production release;282 consolidation;216 unique importer/CSS work;254 unique real-scrypt coverage. Unlike the superseded candidates,254's password-work-factors.test.ts is absent and password.test.ts still has malformed four-field over-ceiling fixtures in consolidated. Restore exactly its two test blobs without changing authentication runtime. Seven actual-password tests pass with real Node scrypt calls; typecheck/ESLint pass. Add these paths and tests to existing stacked verification so the refreshed existing PR gets exact-head validation. Preserve both histories when refreshing; no force push.

PR216 exact-head CI38252706957 passed39b671a1. Its importer batching, timestamp and test changes are not fully preserved in282; keep open pending scoped reconciliation, rather than merge stale CSS/workflow snapshots. Historical95 totals remain unreconciled. Newer remediation is not deployed; main remains2a8c35ad.

## 2026-10-13 — notification and release-preflight batch complete

Ownership: HANDOFF_PENDING; source integration70e213e70eed102b29dfa67e09cbdc95cf81ffd0. PR288 merged433fccec after exact-head CI38361087739 passed. PR289 merged70e213e after exact-head CI38361613600 passed.

N-25 checkout credentials recovery: same server UUID, provider order and token hash;37 related tests passed. N-26 notification retry ownership: atomic claim requires snapshot attempts equality;15 notification tests passed. Removing equality reproduces an unwanted provider send in the new race regression; fixed source passes. Files: order/route.ts and provider-order.test.ts; notifications.ts, notifications-claim.test.ts and notifications-worker.test.ts. Combined local suite888 passed/9 skipped;97 suites passed/1 skipped; full lint and typecheck passed.

N-27 deployment configuration blocker: Railway production predeploy was only an inline environment check and did not run migrations. Updated existing service b40482be-5e5d-48cc-b36b-39beabfd5d5c in environment38aede68-35aa-42de-adbc-49802e6d44e4 to node prisma/railway-predeploy.mjs with300s timeout. Six wrapper tests passed; describe-service readback verifies both fields. Wrapper runs bounded-retry migrations; production skips preview content import and staging seed. Configuration applies on the next deploy; no deployment or database write triggered by this change.

Railway deployment bb65fc78-088e-4df2-b7b6-80c59fd62da8 is SUCCESS at main2a8c35ad5e553ac0cc78b8027a35b592d1876826; canRollback true. Latest release CI38361776442 for70e213e was queued at checkpoint. OAuth exposes variable names only, so canonical media URL, actual credential values and migration state are not remotely certified. Legacy PUBLIC_MEDIA_S3 credential names remain defined alongside MEDIA_S3 names; safe cleanup remains a release preflight item. No new production closure asserted.

Historical register95; current open/unintegrated/integrated/live-closed/reopened totals remain unreconciled. Next: final-head release gates, env/migration/privacy compatibility, guarded parent/main promotion, then deployment/live verification. No live emails, payments, refunds or beneficiary-sensitive tests performed.

## 2026-10-13 — notification retry continuation

Ownership: CODEX_ACTIVE on fix/notification-attempt-claim-20261013 by owner cx. PR288 integrated433fccec after exact-head CI38361087739 passed. N-26: selected attempt count can become stale before a due retry claim, but completion/failure uses that old count. Atomic claim now requires selected attempts equality as well as max-attempt/due-time guards.15 tests across4 notification suites, typecheck and focused ESLint passed. Removing equality reproduces an unwanted provider send in the new race test; corrected candidate passes. Await exact-head hosted verification before guarded integration. Consolidated release gates remain queued; no production promotion.

## 2026-10-13 — checkout persistence continuation

Ownership: CODEX_ACTIVE on fix/checkout-outcome-recovery-20261013 by owner cx. N-25 confirmed: provider order exists and donation write may commit despite lost acknowledgement, but checkout returns500 and loses original receipt access. Own-ID/token/provider-order recovery implemented; five new regressions;37 related tests plus typecheck and focused ESLint passed. No schema change or real provider requests. Await exact-head hosted CI and guarded merge. Final consolidated release CI remains queued; no promotion.

## 2026-10-13 — completed integration batch and release handoff

Ownership: HANDOFF_PENDING; current batch safely completed. Integration head197ca9078da6a2c885843b10150f9ede576af8d1 contains guarded merges: PR286 e5875b3c (CI38357703887), corrected PR2851c44ee9c (d95ef0ae / CI38359261238), PR287197ca907 (a1adbe80 / CI38360005569). All targeted hosted gates passed on exact task heads. Earlier full CI38356018038 passed9dfd0df8 only; latest full release gates remain pending.

N-23: media stack merge resolution reverted strict qualified transfer timestamps and forged/named-empty attachment checks with six source/test blobs. Restore parent validation before merge; retain media readiness scope. Combined validation332 tests across22 suites plus types/ESLint passed. Do not double-count original defects.

N-24: direct-transfer create may commit without acknowledgement, stranding receipt credentials and blocking retry. Preassign server UUID; recover by own ID and matching receipt-token hash; preserve duplicate-reference409 and fail closed on absent/unavailable/mismatched outcomes. Five new regressions;64 related tests passed. Full local unit suite882 passed/9 skipped;97 suites passed/1 skipped; full lint and typecheck passed. No schema change.

Production main remains2a8c35ad5e553ac0cc78b8027a35b592d1876826; no new deploy/live closure asserted. Historical register95; current open/unintegrated/integrated/production-closed/reopened totals unreconciled. Next: exact final-head release gates, environment/migration compatibility and privacy preflight before security/main promotion. No live charges/refunds or beneficiary tests performed.

## 2026-10-13 — current execution checkpoint

Ownership: CODEX_ACTIVE by explicit owner handoff. See docs/EXECUTION_CHECKPOINT_2026-10-13.md for current evidence. PR286 integrated at e5875b3c. PR285 corrective d95ef0ae restores six parent validation files reverted by its merge resolution (N-23); fresh hosted CI required. Combined candidate:99 focused tests and typecheck passed. Main remains2a8c35ad; no new production deployment or closure. Historical95 entries; current totals unreconciled.

## 2026-10-13 — combined corrective integration candidate

- Actual d59f5e66 CI38306526542 result: fast/database/production passed; browser and final verify FAILED. Browser summary1156passed,5failed,1flaky. Four404 cases consistently measured .98 line-height/font ratio despite earlier fallback edits; one impact fixture failed and the second was flaky after injected main DOM disappeared. No full/cross-browser success for this head is claimed.
- R-025 root cause: later experience-finish.css shared state/error `font` shorthand resets line-height to .98. Change that authoritative shorthand to1.05 for the shared state/receipt/404/error/loading heading family, preserving sizes/fonts and all existing test thresholds. Keep the four real404 assertions.
- Impact harness correction: replace mutation of React-owned main DOM with a server-rendered disposable impact-typography page importing the real impact CSS module. Retain both100/200% cases, exact font, opacity and color assertions; no weakened thresholds or retries. Production fixture preparation removes the entire fixture subtree; actual disabled-build removal probe passes.
- N-21 parked artwork cap fix included: bounded shared-cap encoder,11focused tests, postbuild image guard, actual7derivative evidence and3failing cap-bypass mutation cases. Local source/geometry/alpha unchanged; hosted sharp0.35.5 and full18-image checks pending.
- N-22 source-confirmed optimizer freshness mismatch: managed-media handler returns max-age60/s-maxage300, but global minimumCacheTTL31536000 overrides shorter upstream policies. Official Next image docs and exact v16.3.8 image-optimizer.ts confirm max(minimum,upstream). Lower floor to60; remove conflicting generic /media immutable config header so the handler owns success/error policies; explicitly retain year-long immutable source headers on /brand,/hero,/programme-artwork. Cap optimizer source bodies to existing5MiB managed-upload limit. Add three real optimizer/source-header browser cases with a disposable read-only source using an existing approved WebP; syntax and actual-config parsing pass locally.
- N-22 remains PARTIAL: nominal freshness policy is corrected, but existing caches, stale/error revalidation behavior, CDN purge and real consent-withdrawal acceptance are not certified. Do not describe this as immediate revocation or complete media privacy. Reference https://nextjs.org/docs/app/api-reference/components/image#minimumcachettl and vercel/next.js v16.3.8 packages/next/src/server/image-optimizer.ts; no private-header forwarding/auth-bypass claim.
- Ready for one guarded fast-forward from PR d59f5e66 after its run completed, including parked f3ab3447 ancestry. Fresh candidate lint/types/build/budgets/browser required. No security/main merge, deployment, live transaction or zero-defect/AAA certification.

## 2026-10-13 — parked validation and remaining boundaries

- N-21 sensitivity: detached byte-cap bypass mutation makes3 of11 focused tests fail (oversize fallback, nonmonotonic fallback, bounded rejection); actual candidate remains unchanged. Baseline actual-generation guard fails on422226-byte Taleem; bounded candidate397472 passes. This verifies enforcement rather than merely expected happy-path values.
- N-13 rechecked against actual PR215 advisory: GHSA-vfj7-8cjw-p6xm / CVE-2026-93687 affects braces<=3.0.3; GitHub Advisory Database still lists no patched version (https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Current lock chain eslint-config-next16.3.8→@next/eslint-plugin-next16.3.8→fast-glob3.3.1→micromatch4.0.8→braces3.0.3 is development-only. Docker still asserts braces is absent after prune --omit=dev. No downgrade, suppression, unaudited fork or claim of a new full audit/patch.
- Analytics review: page views and Web Vitals reuse normalizePublicAnalyticsPath; dynamic public slugs group as :slug, private routes are excluded, bodies are bounded and schema-strict. This source review does not close historical nonconforming paths, production migration, retention, live privacy or cost gates.
- Impact contrast review correction: base impact.css contains older light-surface inks, but later impact-wow.css resolves principle labels/paragraphs to canonical gold-ink/muted through brand aliases. No additional confirmed rendered defect established; no extra stylesheet change committed for those two selectors.
- d59f5e66 CI38306526542 browser remains active; other gates passed. Keep artwork code parked and preserve the running suite. No production release actions.

## 2026-10-13 — N-21 generated artwork bypassed image budget (parked)

- Root cause: the fast hero/artwork weight guard runs before `npm run build`; prebuild refinement creates ignored derivatives afterward. d59f5e66 production log contains Taleem422226 bytes against the existing MAX_ARTWORK_BYTES409600 cap. The same baseline pipeline reproduced all seven production byte counts locally; a weight check after baseline generation correctly fails on Taleem.
- Correction: shared-cap encoding helper keeps preferred quality88 when fitting, tries bounded qualities86/84/82/80/78/76, and throws before the oversized output write when none fits. Add the existing weight checker to npm postbuild after the secret-boundary gate, so production/browser builds cannot report success with oversized generated artwork. Add 11 focused encoder boundary/error tests to the existing fast image step. No budget increase or new dependency.
- Actual-file validation: candidate Taleem397472 bytes at quality82 (24754 bytes/5.86% smaller); other six derivatives remain byte-identical at quality88. All seven retain1536×1024 geometry and alpha channels; every downloaded approved source SHA-256 unchanged. Local 14-image subset (7sources+7derivatives) passes weight guard. Preferred/limit/oversize/nonmonotonic/floor/invalid/error cases11/11 pass; syntax passes. Visual comparison preserves the established composition; measured Taleem PSNR36.93dB relative to the prior encoding, not an assertion of lossless output.
- Local encoder is runtime sharp0.35.4; repository pins0.35.5. Exact old output bytes match hosted baseline, but fresh hosted generator/quality/budget validation remains required. Outputs and approved source image files are not committed or regenerated through AI.
- R-053 remains partial: mobile transfer <=150KB and external consent-cleared media delivery are not certified. Track new N-21 as implemented candidate, not deployed.
- Based on PR HEAD d59f5e66; CI38306526542 fast/database/production passed (755unit/9skipped; JS818786/819200,CSS346526/348160), browser still active. Park this follow-up until that browser run completes, then use one guarded integration update. No security/main merge, Railway deployment or live/payment check.

## 2026-10-13 — integrated follow-up candidate after gallery CI passed

- Verified baseline d246e366: run 38303371341 completed successfully across plan, fast, database, production, browser and final verify. Browser log: 1,154 Chromium passed (23.6m), 24 Firefox/WebKit smoke passed (35.3s), no reported flakes. Three new gallery reorder/removal/empty-state regressions included. Fast: 755 unit passed, 9 skipped; production JS818773/819200, CSS346461/348160. Three lint warnings were present on this baseline; parked cleanup addresses them without suppressions and needs fresh hosted verification.
- Candidate batch: gallery cleanup captures current DOM/trigger array safely; typed authorization route table removes unused adapter argument; R-075 static source index; R-024 five explicit sub-12px font declarations (status/pathway/donation/placeholder/impact index); R-025 active error/404 heading .8→1.05 in root and duplicated policy styles; R-019 impact index opacity/background and light-tile caption ink.
- Impact evidence: old index at 62% opacity calculates 4.40:1 over #f7f0de. Opaque #122239 on #fffdf8 calculates 15.73:1 regardless of underlying imagery. Light-tile caption moves #80620d→canonical #604407: 7.94–8.88:1 across #f7f0de/#fffdf8. Palette preserved. This is a scoped numerical/source check, not live image-wide contrast certification.
- Validation: all 79 CSS inventory files inspected for explicit px/rem/clamp and font-shorthand minima; 507 font declarations reviewed. Added eight browser cases: real404×four, actual donation labels×two, disposable impact-style fixtures×two. Node syntax checks pass; new candidate lint/build/unit/browser and budgets pending. No tests or limits weakened.
- Publish only after fresh PR HEAD/ancestry guard; expected old PR head d246e366. R-012, R-019, R-024 and R-025 remain partial; R-075 implemented pending hosted/live serving. No security/main merge, Railway deployment, payment or live verification performed.

## 2026-10-13 — R-024 public stylesheet minimum review

- Read all 79 CSS files from the original repository tree at PR d246e366; root/public/component CSS inventory has no missing fetches. Review targeted explicit px/rem declarations and bounded clamp values, not inherited/em/calculated font sizes or live computed styles.
- Two further sub-12px declarations found: donation-route metadata .68rem and decorative placeholder label clamp(.62rem,1.2vw,.72rem). Raise both to .75rem; earlier parked status/pathway corrections bring this batch to four minimum-size declarations. Placeholder remains decorative/aria-hidden; no semantic or beneficiary-data change.
- Add two actual donation-page browser cases at 390px, verifying both labels equal 12px at 100% and 24px at 200% root size. Together with four R-025 real-404 cases, this batch adds six browser regressions. Node syntax check passes; hosted browser results pending.
- R-024 remains partial until browser, inherited/computed typography, and human acceptance are verified. No claim of universal readable sizing or AAA compliance.
- Parked batch is based on 469a6813; PR d246e366/browser run 38303371341 continues. No security/main merge or deployment.

## 2026-10-13 — R-025 error-heading line spacing

- Current root `not-found.tsx` and `error.tsx` use `.v2-not-found` / `.v2-error-page`; both active headings receive line-height .8 from the globally imported `error-experience.css`. Error heading includes an explicit line break. This is confirmed source evidence; no live overlap measurement claimed.
- Raise the shared heading rule to 1.05 in root error styling and its duplicated policy-route rule, avoiding a later route stylesheet restoring .8. No changes to heading words, route boundaries, redirects, fonts or theme.
- Add four real-404 browser cases (390/1440px × 100/200% root font), checking HTTP404, the actual accessible heading, correct root scaling, and line height at least font size. Syntax check passed; browser execution pending. Existing thresholds unchanged.
- R-025 remains partial: other legacy display rules and broader human typography acceptance are not certified by this narrow correction.
- Parked batch now includes gallery cleanup, R-075 public source index, two R-024 label minimums, and this R-025 correction. Current PR d246e366/browser run 38303371341 still pending; no source update interrupting that run and no deployment.

## 2026-10-13 — R-024 remaining shared-label minimum

- Raise `.status-badge` (globals) and `.canonical-pathway span` (canonical-content) from .72rem to .75rem. At a 16px root, both now reach 12px; at a 32px root, both scale to 24px. Color, spacing, layout and content remain unchanged; replacement length is identical.
- Reviewed the original AM-05/AM-25 findings against current root/public CSS. Legacy tight-heading selectors remain in route styles, but were absent from their current page components; no current rendering failure inferred and no broad deletion performed.
- R-024 stays partial: this is two additional label declarations, not site-wide AAA certification or a completed human acceptance check.
- Based on parked R-075 commit 893dac77, which includes cleanup b5ff59ed. PR HEAD d246e366 and browser run 38303371341 remain active and unchanged. These updates are parked for one guarded integration batch after the running suite completes.

## 2026-10-13 — R-075 public source index (parked integration follow-up)

- Scope: add `public/llms.txt` with 15 canonical links to existing public information and policy routes. No beneficiary, donor, receipt or administrative detail links; no invented impact figures, social URLs or tax promises.
- Compliance: domestic Indian sources only; no FCRA registration; provisional Section 12A/80G approvals; normal acknowledgements are not tax-deduction certificates. Wording checked against the current compliance page.
- Evidence: original `AMAANA_MASTER_REMEDIATION_PLAN(2).md` identifies AM-27; file absence verified at PR HEAD d246e366. Local link/origin/format check passed. This is a small text convention, not a security critical or a guarantee of model indexing.
- Validation baseline: d246e366 fast/database/production gates passed; browser run 38303371341 still active. 77 actual-module local boundary/navigation probes pass. Parked cleanup b5ff59ed still awaits hosted lint/browser verification.
- Publication: keep PR HEAD unchanged until its active browser suite completes; combine this source index with the parked cleanup for the next integration batch. No security/main merge or production deployment performed.

# 2026-10-13 IST — Gallery cleanup lint follow-up parked

Ownership: `CODEX_ACTIVE` under owner continuation; one implementation writer. Parked task `fix/gallery-cleanup-lint-20261013` from consolidated PR #282 `d246e366c89455c4fb444c5b493392f046077103`.

CI 38303371341 at d246e366 passed fast and database; production budget measurements: JS 818,773/819,200 B; CSS 346,461/348,160 B. Hosted units 755 passed / 9 skipped, including 37 actual-helper API boundary and 14 gallery-selection cases. Browser remains in progress; completion is not inferred.

Fast lint was exit-zero but reported THREE warnings: unused _request in the status test adapter; effect-cleanup reads of dialogRef.current and triggerRefs.current. Fix the test table with an explicit Response handler contract and direct status handler. Capture the dialog node and mutable thumbnail-ref array inside the effect; use captured node isConnected to recognize modal removal before focus restoration. Preserve current thumbnail lookup and skip restoration during active modal navigation. No rule disable, threshold weakening or new dependency.

Local TypeScript test syntax parsed. This follow-up still requires hosted lint/type/browser/budget validation; no warning-free CI is claimed yet. N-20 and R-012 broader acceptance remain pending; no new runtime vulnerability count is added for lint warnings.

Next: allow current browser run to finish, inspect new gallery lifecycle results, reconcile this parked follow-up and validate. No security/main merge, Railway deployment or live verification.

---

# 2026-10-13 IST — Gallery lifecycle and actual-helper admin authorization integration

Ownership: `CODEX_ACTIVE` under owner continuation; one implementation writer. Consolidated PR #282 on `fix/consolidated-a11y-regression-20261012`, target `fix/p0-security-remediation-20261010`.

Baseline `0d193c3e0b4aedcb3135944b614055bba34fa628` completed CI 38300163971 successfully: lint/type/unit, database, production, browser and final verify. Hosted units 704 passed / 9 skipped; Chromium 1,151 passed with no failure/flake summary; Firefox/WebKit 24 passed. JS 818,586/819,200 B; CSS 346,461/348,160 B. This certifies the baseline only.

Integrate N-20 from parked `62a721f3`: stable image-ID selection; release stale modal ownership; restore connected thumbnail focus; 14 unit and three dynamic actual-component browser regressions. Local helper 14/14, syntax and production-fixture removal checks pass. Rendered lifecycle/client-byte acceptance still pending.

R-012 coverage: add 37 cases across start/upload/publish/status APIs using real getCurrentUser, hasPermission and isSameOrigin. Verify active/unexpired hashed-token query predicates; anonymous/unresolved sessions; zero/partial permissions; permissions combined across roles; foreign/missing/opaque mutation origins; private error headers; no privileged storage/publication activity before authorization. Stop authorized cases at an explicit inert runtime checkpoint rather than upload/publish.

Local actual API/session/permission/origin execution: 37/37 pass with inert external/persistence adapters. Detached permission-checker mutation (always true) causes 12 failures, with 25 unrelated cases still passing. Added hosted Vitest cases; local TS syntax passes. This is coverage improvement, not a newly discovered production bypass or complete R-012 certification.

Next: fresh combined CI; fix demonstrated failures, inspect gallery bytes and rendering, then integration/release gates. No security/main merge, Railway deployment, real storage mutation, payment or live verification. All compliance/factual/media locks and asset budgets remain unchanged.

---

# 2026-10-13 IST — Gallery lifecycle candidate

Ownership: `CODEX_ACTIVE` under owner continuation; one implementation writer. Parked task `fix/gallery-selection-lifecycle-20261013` from consolidated PR #282 `0d193c3e0b4aedcb3135944b614055bba34fa628`.

N-20: positional selection can change the displayed image after reorder and retain scroll/key ownership after the selected item disappears. Preserve selected ID; derive index; clear removed selections; restore connected thumbnail focus through modal cleanup. Retain layout, media and keyboard controls.

Validation: 14 actual-helper Node cases pass. Add 14 Vitest and three browser cases through the existing disposable synthetic fixture. Script/spec and unit TypeScript syntax pass. React checklist reviewed. Local browser/React execution unavailable; hosted lifecycle and client-byte acceptance pending. No new production dependency or CSS change; budgets remain JS 819,200 B / CSS 348,160 B.

Consolidated CI 38300163971: fast/database/production passed, hosted units 704 passed / 9 skipped; browser running at last check. Do not interrupt it. Next: reconcile/publish this parked batch and validate after that suite completes. No security/main merge, Railway deployment or live verification.

---

# 2026-10-13 IST — Storage/origin integration and Companion scaling correction

Ownership: `CODEX_ACTIVE` under owner cx continuation; one implementation writer. Active consolidated PR #282: `fix/consolidated-a11y-regression-20261012` targeting `fix/p0-security-remediation-20261010`.

Validated baseline `2697dec3661ece25231d2dc5d0eb333d0a8e4ff8`: CI 38297387285 succeeded across fast/database/production/browser/final verify. Actual Chromium summary: 1,149 passed and TWO flaky shared rail/footer/Companion typography tests (390/1280px), both succeeding on retry; Firefox/WebKit 24 passed. JS 818,586/819,200 B; CSS 346,461/348,160 B. This is not zero-flake acceptance.

Integrate parked N-15–N-18 storage/media corrections from `0c695485`, preserving all source/test work. Add N-19: isSameOrigin rejects missing production URL, malformed configured URLs, non-HTTPS production origins, credentialed configuration and opaque Origin. Development HTTP fallback remains available. Five baseline cases reproduced unsafe acceptance/exception behavior; eight corrected actual-helper probes pass.

R-024: hosted flakes read 12px kicker at the 24px assertion after a separate in-place root style mutation. Rework shared checks to reload with a persistent enlarged stylesheet, measure root/text atomically, and verify 100% and 200% reading/prayer typography plus loaded prayer wrapping. No thresholds or budgets weakened. This harness correction still requires hosted browser proof.

Local actual-module/handler probes: 26/26 pass (18 storage/media, eight origin). Added corresponding hosted Vitest cases; local syntax parsed, but local Vitest/Chromium dependencies unavailable. Server-only S3 boundaries remain intact; no database migration, live payment, real S3 mutation or production configuration change.

Next: fresh combined CI on consolidated candidate; resolve demonstrated failures/flakes; integrate to security branch only after required gates and review. No main merge, Railway deploy or live verification claimed.

---

# 2026-10-13 IST — Public storage boundary remediation candidate

Ownership: `CODEX_ACTIVE` under owner continuation. One implementation writer. Parked task: `fix/public-storage-boundaries-20261013` from consolidated PR #282 head `2697dec3661ece25231d2dc5d0eb333d0a8e4ff8`. Security integration remains `c7a4d557`.

N-15: public storage readiness rejected a shared public/private bucket, but common upload/read/delete helpers did not. Enforce separation inside getPublicMediaStorage before creating a client, including trimmed bucket names. Covers ordinary upload, curated upload, read and delete. Private evidence operations remain independent.

N-16: public delivery URL validation happened after persistence and accepted credentials/query/fragments. Validate before storage creation; share the validator with readiness; preserve valid HTTPS prefixes and unpublished null-URL uploads.

N-17: public media publication lookup sat outside the controlled error handler. Move it inside the guard so database failures return an empty no-store 503 with Retry-After and noindex headers before S3 access. A real-handler local probe failed on baseline and passes after correction; add the corresponding route Vitest case.

N-18: public S3 reads buffered entire objects without enforcing the upload-size contract or verifying completeness. Reject oversized ContentLength before reading and close the stream; cap streamed accumulation at 5 MiB; reject truncated bodies. A detached mutation restoring only the old read function failed three guards while 14 unrelated cases still passed. Valid streamed bytes and metadata remain unchanged.

Evidence: actual storage module executed with only AWS SDK/signing replaced by inert transports. Baseline: 9/10 initial probes failed (four absent shared-bucket rejections; three absent unsafe-URL rejections; two uploads before invalid-URL rejection). Corrected: 18/18 combined probes pass (17 storage plus one real media handler). Added 18 Vitest cases for hosted lint/typecheck/unit execution; syntax parsed locally. Local Vitest dependencies are unavailable; these are not claimed as locally executed Vitest results. No real S3 operations or credentials used.

PR #282 CI 38297387285: fast/database/production passed; browser in progress at initial check. Production totals JS 818,586/819,200 B, CSS 346,461/348,160 B. Park the security batch without cancelling or replacing that suite. New storage changes still require hosted candidate CI and eventual combined integration.

No security-branch/main merge, Railway deployment, migration or production privacy/security certification. Next: inspect completion of #282's current browser suite, reconcile this parked candidate with actual HEAD, integrate one atomic batch and validate.

---

# 2026-10-13 IST — R-024 consolidated integration candidate

Ownership: `CODEX_ACTIVE` under the owner's explicit execution handover. Single implementation writer; active PR #282 on `fix/consolidated-a11y-regression-20261012`, target `fix/p0-security-remediation-20261010`.

Verified baseline: `87aa9c613f635dc75b960a801c722f3f2f0f8ed6`. CI 38294121822 completed successfully: fast, database, production, browser and verify; Chromium 1,151 passed with no failure/flake summary; Firefox/WebKit 24 passed. Aggregate JS 818,586/819,200 B; CSS 346,363/348,160 B. These results certify the baseline only.

Parked R-024 work `58c10229` was recovered through `a4e9fa78` and `fdab2ad9`. Correct two literal backslash-n sequences that invalidated intended prayer-label wrapping. Regression guard fails on original parked CSS and passes after correction (2/2 Node tests). Pin browser client date and stub synthetic prayer timings; verify 200% reading/note sizes and seven loaded prayer row wrapping/containment cases at mobile and desktop widths. Spec syntax passes; local Chromium unavailable, so hosted browser results remain required.

CI policy: retain the per-ref concurrency group but set cancel-in-progress false to preserve active expensive browser runs. No tests or budgets weakened. CI planner tests: 33/33 pass locally.

Next: run fresh candidate CI; inspect any new failures and actual JS/CSS totals; integrate into security branch only after gates pass. No merge to main, Railway deployment, real payment/refund, privacy certification or full AAA claim. R-024 remains open for remaining public styles and production acceptance. Preserve canonical response semantics and all factual/compliance/media locks.

---

# 2026-10-12 — Payment integration and keyboard-scroll candidate

Ownership: `CODEX_ACTIVE` under owner continuation; security integration `fix/p0-security-remediation-20261010` at `dcecb8461d374b0c5914b2e050ab9a7cd5339847`. This current checkpoint supersedes historical state below. No parallel repository implementation writer.

Additional integrations:
- N-04, PR #269, validated head 61723e719019b83d2f26aa5c865a51ab0a343206; full CI 38241032771 passed fast/database/production/browser/verify; merge 4d11ca8408b993d9d7f68b1ef56f9f4b83de4473. Runtime validation of consumed Razorpay response fields now composes with #268 callback identity matching. Combined candidate acceptance remains required.
- N-05, PR #270, validated head e88a3761f2e2cff25dc6b6ab7f641ca9275f6414; full CI 38241192347 passed fast/database/production/browser/verify; merge dcecb8461d374b0c5914b2e050ab9a7cd5339847. Reject unusable order identity before persistence.

Independent candidate:
- R-050, draft PR #274, branch fix/keyboard-scroll-handoff-20261012, head f53ebea3cd5b8e90d012b8736e89e14d888485dd. Clean current-base source/test port from #249, with generation invalidation for pending Lenis import and eight keyboard cancellation/restart cases. Hosted CI 38244316271 running. No success or deployment is claimed. Original #249 is not merged and remains a superseded candidate once this replacement is integrated.

Still pending: PR #271 at 8a3ffec148f3b8757a0b7b45909c17c9de00afc8 (nine isolated PostgreSQL tests passed; browser running); PR #272 at cbf45c2f25951d0850b0eaf57cadbc189543c855 (fast/database/production passed; browser running). Do not infer pass from elapsed time, skipped ready-for-review workflows, or historical runs.

R-012 source audit at dcecb846: four admin API handlers enforce session and content permissions before privileged work; three mutations also reject foreign origins. Protected layout requires authentication; private document route requires assistance.view before lookup/signing; all nineteen exported operational server actions in seven protected action modules require their scoped permission at entry. Login/logout are separate credential/session paths. Existing anonymous-browser spec covers twelve protected surfaces and four APIs. This is source/coverage inspection only, not live acceptance or complete independent authenticated-role testing; R-012 remains partial pending current browser/live verification. No auth bypass was established.

Production remains main 2a8c35ad5e553ac0cc78b8027a35b592d1876826. No production promotion, Railway mutation, real donation/refund, email or beneficiary submission performed. Worker rollout remains pending, temporary annual cron containment intact. Preserve all release, factual, privacy, media and payment gates.

Next atomic actions: validate/integrate #271/#272/#274; complete combined integration CI; check PR #215 release gates and production authorization; recover worker only after its source is on main; perform safe live acceptance and update the master finding register. Documentation checkpoint remains separate to avoid cancelling active source-candidate validation.

---

# 2026-10-12 — ChatGPT Work remediation continuation

Ownership: `CODEX_ACTIVE` under the owner's explicit master handoff and cx continuation. This current entry supersedes historical ownership entries below. One repository writer; no parallel implementation agent.

Integration: `fix/p0-security-remediation-20261010` at `2a20844ee540deaa774817e4b0f919f99dc89d58`. Production release PR #215 remains open against main. Documentation task: `docs/remediation-work-checkpoint-20261012`.

Completed this session:
- R-033, PR #265: rejected giving-intent radio focus. Merge dd7bdcfe8040ce28b2f7f03f368dee2d495cc12b. Full CI 38238484810 passed fast/database/production/browser/verify; the separate ready-for-review run skipped validation and was not used as evidence. PR #215's corresponding review thread is now resolved by the reviewer.
- N-03, PR #268: bind provider payment identity to signed callback. Merge 8c71ce25004b1ff6972ed15550f02ff544f6ecdc. CI 38240338711 passed fast/database/production/browser/verify.
- N-09, PR #266: generic curated-gallery HTTP500 response with safe diagnostics. Merge bc9271dbe491eb87030f51e3d3bc4b04cb53de1d. CI 38239767561 passed fast/database/production/browser/verify.
- N-08, PR #267: compare UTF-8 byte lengths before timingSafeEqual. Merge 2a20844ee540deaa774817e4b0f919f99dc89d58. CI 38240152946 passed fast/database/production/browser/verify.

In progress:
- PRs #269, #270, #272: patches reviewed; no open review threads observed. Fast/database/production passed; browser completion still pending at this checkpoint.
- PR #271: found that reconstructed patch omitted real PostgreSQL regression coverage from #258. Restored all three existing cases (older failure/replay preserves newer authorization; matching CREATED and AUTHORIZED failures) in commit 8a3ffec148f3b8757a0b7b45909c17c9de00afc8. Fresh CI 38243416320 pending; previous-head validation cannot certify this commit. Tests use isolated loopback PostgreSQL only. No runtime source changes in this follow-up.
- Combined integration CI must pass for the final selected commit before production promotion. Individual PR passes do not establish combined acceptance.

Production verified from Railway deployment metadata: main 2a8c35ad5e553ac0cc78b8027a35b592d1876826, deployment bb65fc78-088e-4df2-b7b6-80c59fd62da8 SUCCESS. None of this session's fixes is live. Website service has both renamed MEDIA_S3 credential keys and legacy keys; only names inspected, values not exposed. Do not remove legacy keys until deployed-code compatibility and rollback are addressed.

Notification worker: latest deployment 473c17d9-ca74-45b6-908c-c9c0fb3507b6 FAILED; temporary cron 0 0 1 1 * remains active; only CRON_SECRET and NOTIFICATION_JOB_URL defined. Dedicated /ops/notification-cron rollout and successful authenticated invocation are still pending; restore five-minute scheduling only after recovery. No Railway mutation this session.

Next actions: finish remaining PR validation and integration; validate combined candidate; preserve main review/promotion gates; deploy only with required authorization and successful gates; recover worker; verify production; reconcile the recovered 95-row master register plus N findings. No real donations/refunds or user notifications initiated. Preserve factual locks, provisional tax-registration language, domestic-only fundraising, private records, approved imagery and bottom-right Islamic Companion.

---

# 2026-10-12 — Private record access regression coverage

Ownership `REVIEW_PENDING`; bounded test work completed by Codex under owner continuation deliberately supersedes prior implementation wait only for bounded private acknowledgement/assistance tracking regression coverage. Branch `test/private-record-access-boundaries-20261012` from security integration `f5578c31829aeb76ac4e30060cc658342942d762`. Preserve all independent review/integration/main/production gates.

Verified coverage gap: existing acknowledgement and assistance-status route tests replace origin checks, token hashing and bounded body handling with mocks; they do not establish that the actual privacy boundaries compose correctly. Add tests using real origin/token/body helpers, with only persistence mocked. Cover valid minimal responses, rejected origins, wrong or absent record credentials, corrupt persisted hashes, malformed JSON and actual streamed body limits. No runtime vulnerability claim or application change is implied.

Implemented:18 actual-helper privacy cases across acknowledgement and assistance tracking. Only database lookups are mocked; real origin validation, token hashing, constant-time comparison, schema parsing and streamed byte limits execute. Valid replies expose the expected minimal fields; wrong tokens/missing records/corrupt persisted hashes reveal no private data; foreign/null/missing origins, malformed JSON and actual oversized bodies retain private headers and reject before lookup where required.

Controlled mutation proof in a detached scratch checkout: disabling only origin rejection caused six test failures; bypassing only token equality caused four failures. Each runtime route was restored byte-for-byte in finally; primary runtime routes never changed. All18 focused checks and471 full unit tests pass, six database-dependent skips locally; full lint, TypeScript and whitespace checks pass. No user data, payment, email, real persistence, dependencies, runtime application code or secret configuration changes. Draft pending hosted validation and independent review.

PR254 exact-head CI38173157008 passed1094 Chromium and24 Firefox/WebKit plus fast/database/production/final verify; Ready and unmerged without independent approval. PR255 8b8d9841a49f4269133d78a32cf4487c163fbe8d has successful fast/database/production; browser remains running in CI38174787641. Local composition of #241/#247–#255:527 unit tests passed, six database skips; lint/typecheck passed. PR215 review map records the unresolved development-only braces advisory (no patched release), runtime-prune proof and no confirmed public-input path. No independent reviewer identity established; never invent one or self-approve.

# ChatGPT release-hardening checkpoint — 2026-10-07

Ownership `CHATGPT_ACTIVE`. Frozen integration candidate: `9bd04887cb57c28a73f201f8a5c7002657f2b427`, tree `7c42f5b8b452b16f2aea698a8068baf57a969009`. PR #197 patched source-map-js CVE-2026-93749; PR #198 patched current brace-expansion/Sharp production advisories and added fail-closed `npm audit --omit=dev --audit-level=high`; PR #199 moved GitHub first-party actions to Node-24 releases, promoted Prisma CLI to the legitimate runtime dependency set and pruned dev tooling from the Docker runtime. Exact PR #199 CI #2382 passed fast/database/browser/verify; final merge push CI #2383 passed fast/database/production/verify with JavaScript 806040/819200 bytes and CSS 346301/348160 bytes. The PR #199 tested head and final integration merge have an identical Git tree.

Exact Railway preview deployment `c2b5327d-94ee-49f6-b10c-d7f70673a1fa` is SUCCESS on `9bd04887...`, 1/1 online with zero warning/critical notifications. Pre-deploy ran `node prisma/railway-predeploy.mjs`, found 15 migrations and none pending, completed release preparation and passed `/api/health/ready`. Production remains untouched on main `29c7627ed3bffd0b581935c5b934ad903aeca2cd`. PR #104 remains Draft. PR #195 route-level loading boundaries was closed as a regression branch after 41 browser failures including CLS ~0.814.

Final readiness normalization is on branch `docs/final-release-evidence-20261007`. Release-scoped non-applicable gates: no new unreviewed programme media, no legitimate live appeal, no legitimate live refund target. Genuine unresolved gates: Resend/email acceptance, human rendered accessibility review, final human editorial/social judgement, real Railway Rollback rehearsal, main branch protection and formal production promotion. Resend domain changed from failed to pending on 7 Oct and a fresh verification was triggered; all four records remain pending at last check. Main remains unprotected with no ruleset.

Railway environment contains one non-destructive staged no-op patch `45c0bc6c-46db-4ed8-82cb-3a8f02dfb483`: production preDeployCommand current→identical current and timeout 60→60. It has no live effect. The connected Railway API exposes no discard operation, so remove it in the dashboard before cutover; do not Accept & Deploy merely to clear metadata.

Protected behavior: main/production not to be changed before readiness gates and explicit production authorization; no dummy appeal, real-money payment/refund, beneficiary submission or unreviewed public media; no JS/CSS budget increase; provisional 12A/12AB and 80G wording; no FCRA claim; Islamic Companion remains bottom-right.

---

# ChatGPT emergency takeover — 2026-10-05 16:32 IST

Ownership `CHATGPT_ACTIVE` by explicit owner handover after Codex/Work interruption. Continue existing PR #167 on `fix/all-route-audit-20261005`; do not start a competing branch. Verified remote head before takeover: `bd4feedb9fb41a60ad2b6b9f40b06c8c11cf59db`, base `phase-public-site-rebuild` at `2caccb9fb83424f75a4c78ffa4c9339ae2e15ad7`. PR is open, mergeable and unmerged. Main/production PR #104, production indexing, Live Razorpay/payment/refund actions and factual/media locks remain protected.

Latest remote CI run 37290562293: plan, fast and isolated database jobs passed; browser acceptance completed 1076/1078 with exactly two failures, both complete-page audit containment for `/admin/notifications` at mobile and desktop. The last remote containment patch is `bd4feed…`; this failure remains unresolved remotely and must be reverified/fixed, not waived.

The immediately following owner screenshot batch was partially implemented in the interrupted local workspace but was not pushed after `bd4feed…`. Reconstruct on this same branch from repository truth and the owner's latest directives: narrow all slant separators to ~2px; remove text truncation across widths; elevate Areas of Service styling; remove specified left gold separators; add polished glossy hover/focus treatment with reduced-motion safety; restore individual gallery images into the relevant carousels; correct dropdown padding; ensure WhatsApp opens a new tab; apply these patterns consistently site-wide. Preserve the fixed bottom-right Islamic Companion, approved background/media architecture, canonical facts/content, accessibility, performance caps and responsive containment.

Next atomic actions: inspect exact current source for the screenshot surfaces and shared primitives; implement reconstructed fixes plus the remaining notification containment defect; add/adjust focused regressions; then run/trigger scoped checks before the full PR gate. Do not claim complete AAA or defect-free status from automation alone.

---

# Complete route/state UI audit — 2026-10-05 IST

Ownership `CODEX_ACTIVE`. Owner requests every site page receive the same audit, including dynamic children and protected operational states. Atomic branch `fix/all-route-audit-20261005`, verified integration base2caccb9fb83424f75a4c78ffa4c9339ae2e15ad7. Only draft PR104 is open; main/release promotion protected. Build an explicit source route/state inventory, inspect actual desktop/mobile public renders and isolated admin/private journeys, fix confirmed defects, preserve factual copy/approved media/design and unchanged performance caps. Shared polish alone never counts as page-specific review. New complete inventory must distinguish source review, visual review, browser interaction and isolated-state evidence; unknown/unavailable states remain explicit. No subagents, real payments, beneficiary submissions or live staff mutations.

PR167 diagnostic head3c3de5786f20c44454247d9828958fb44af10469 / CI37230459929 completed237 passing and38 failing checks. All60 source page templates have matching desktop/mobile capture;87 routed views plus root interruption per device. Contrast and admin scroll focus findings now fixed locally, homepage editor banner standardized, private acknowledgement429/503 retry and receipt wrapping fixed. Twelve local receipt/recovery/interruption checks pass;440 unit and31 planner checks pass. Final complete acceptance/deployment remains pending; no claim of all-page pass or AAA certification. See ALL_PAGE_UI_AUDIT_2026-10-05.md.

---
# Sitewide experience polish — three batches delivered, 2026-10-05 IST

Ownership `IDLE` for this delivered batch. PR163 shared Motion/Lenis, contrast, navigation crash and compact menu containment fixes; PR164 programme closing alignment; PR165 continuous umbrella lattice are merged to `phase-public-site-rebuild`, deployed and live verified. Main and draft PR104 remain protected; live environment remains staging with test payments. Prior entries below are historical checkpoints.

PR163: CI37225113277 passed 888 Chromium and24 Firefox/WebKit checks without retries; integration37226470652 and exact-source Railway08ff3623-78b7-439a-ac13-5a087ab9a5ea succeeded. Six live contrast/navigation checks passed. PR164: CI37226550562 passed479 focused Chromium checks without retries; integration37227379178 and Railway58157547-5387-467a-85e7-a43de73b48f0 succeeded on merge2ec02ceb4505b3853f324f338a73a38e145af9f6/tree1240ae48ff8bd98517051f488606e84459f47734.

PR165: tested head f223b69b5b05fc9608b475ce9c37c5f90a644f28; merge2405a8f10ac57737ff88071fa155b5739bdda9da; local/remote/tested/merged tree9be0b0249a87a47885563d4eb4e140737e1a5ca5 identical. CI37227916057 passed74 focused checks without retries in2.0minutes; integration37228293890 and Railway5388b090-53b9-4e81-a0e5-e0d6a5a2ec51 succeeded. Live version confirms exact merge. Four final live Eid/auto-rickshaw checks at390/1440px pass: single continuous parent lattice, transparent child sections, correct left title/right desktop actions and20px mobile gap,56px desktop heading cap, no overflow or page errors. Final static JS818952/819200 and CSS346731/348160 bytes, caps unchanged.

Bounded review:78 capture metrics clean and overview/form/programme/footer families inspected. Live background failures on the initial umbrella review were genuine, documented and fixed in PR165; the final rerun passed. Legacy quick-link hover padding warning was an overridden selector, with no measured layout shift. No complete AAA certification or whole-site defect-free claim; human screen-reader/zoom review and separately tracked route/private-state review remain in the inventory. No pending code change or active writer in these batches. New confirmed defects use an atomic branch. See SITE_EXPERIENCE_POLISH_2026-10-04.md.

---
# Sitewide experience polish — programme pattern follow-up, 2026-10-05 IST

Ownership `CODEX_ACTIVE`. Shared batch PR163 and programme alignment PR164 are merged, deployed and exact-version verified. PR163:888 Chromium +24 Firefox/WebKit checks passed; integration37226470652 and Railway08ff3623-78b7-439a-ac13-5a087ab9a5ea green; six live contrast/navigation checks passed. PR164:479 focused Chromium checks passed without retries; integration37227379178 and Railway58157547-5387-467a-85e7-a43de73b48f0 green on merge2ec02ceb4505b3853f324f338a73a38e145af9f6/tree1240ae48ff8bd98517051f488606e84459f47734. Live individual detail alignment passes at390/1440px; umbrella closing geometry passes, but live background checks exposed the legacy alternating paper surface restarting the lattice on umbrella pathways.

Active atomic branch `fix/programme-continuous-pattern-20261005`: make the canonical parent background rule outrank the legacy alternating surface, with Eid/Taleem umbrella regressions. Finish scoped CI and exact-source deployment before closure. Approved media/copy/colors, main and draft PR104 remain protected. This is no AAA certification or whole-site defect-free claim.

---
# Programme closing alignment — published 2026-10-04 UTC

Ownership `CODEX_ACTIVE`. PR164 on `fix/programme-closing-alignment-20261004` validates the remaining programme closing alignment using the existing body heading grid. Initial head `2e2d6c130651e427b2188e8b15e0cf81f2396841`, tree `0ce66f6ef162ec1455beb07ec486359220ba0e6f`; seven local responsive/axe fixture checks and30 planner checks pass. Next action: finish seeded focused CI, merge once green and verify exact-source Railway deployment. Main and draft PR104 protected.

PR163 merged as `cb3cf8b90f2e76044669e500410a2f0c7d3de68d`. Exact tested head `8ff82a0757d72526a57b9aadf1498bef09c7df16`; tested/local/remote/merged tree `04797598d2dd5743717193bd1686e7f2a2e896ae`. CI37225113277 SUCCESS:888 Chromium checks without retries in16.5minutes,24 Firefox/WebKit checks in34.2seconds, fast and isolated database jobs green. Mobile hidden-link Motion crash, five contrast families and compact fine-pointer menu background scroll resolved. Shared Motion/Lenis delivery awaits integration build/Railway/live verification.

---
# Sitewide experience polish — 2026-10-04 IST

Ownership `CODEX_ACTIVE`. Branch `feat/site-experience-polish-20261004`, base `ad1a9941f087297235492795f9ac42c82e2cd557`. Owner delegates page-by-page/batched implementation of motion, micro-interactions, smooth scrolling, responsive/accessibility and performance polish. First inspect all routes and shared foundations, preserve approved brand/content/media and protected main/draft PR104. Motion respects reduced-motion and content remains available before hydration; keyboard/touch/nested scrolling stays native. Keep existing bundle ceilings, verify dependency lifecycle and full shared-system acceptance. Do not claim AAA certification from automated tests. No delegation.


PR163 remains open and undeployed. Resumed from head96733dfeedd20bc7edd66da90a532d39928d0051. Initial seeded CI37215501401 exposed five contrast failures and a mobile route crash: Motion committed styles after a menu link became hidden. Replaced stop with cancellation; strengthened regression against page errors/global interruption fallback; moved legacy text colors to approved contrast tokens. Corrected CI and delivery pending; main and draft PR104 protected.

---
# Initiative photo banners and detail polish — delivered 2026-10-04 IST

Ownership `IDLE`. PR161 merged into `phase-public-site-rebuild`. Tested head `f13ab2a8b3b67192242b8b8f4688d97a980fcba6`; merge `3f7d5e88b16a6c981b2ef59b3e2c0cef65e0a41e`; tested/local/remote/merged tree `df9068cf20bb2266114e5ecd6762f0c9d0a1f532` identical. CI37205921770 SUCCESS:571 focused Chromium checks passed in8.6minutes without retries. Local417 unit checks and29 planner checks pass. Integration37206621914 SUCCESS: production build, JS813541/819200 and CSS345943/348160 budgets and server smoke; duplicate browser/database work skipped.

Railway `74bfba5c-e91d-4f43-9646-63a9d3fd8e55` SUCCESS on exact merge. All30 published initiative pages verified live on desktop:22 single-photo headers, four umbrella collages and four no-media fallbacks; every selected image loaded, one H1, display-serif story heading, narrative reaching shell right edge and no horizontal overflow. Auto-rickshaw page uses its existing landscape vehicle photograph with blended edges; all three gallery originals remain. Pale gold/blue cards retain continuous lattice. Six-width responsiveness/mobile axe verified through isolated CI geometry fixtures; live review does not claim all mobile photo crops were inspected. Final live banner proof inspected and saved.

Selection uses existing published/privacy-approved assets, excludes collage derivatives on individual pages, and leaves other discovery identity selection unchanged. No generated beneficiary imagery, new dependency, schema/payment/email/factual edit or bundle ceiling increase. Main/draft PR104 remain protected. Current task complete; new confirmed defects require a new atomic branch. See INITIATIVE_BANNERS_2026-10-04.md. Documentation closure branch `docs/initiative-banners-delivery-20261004`.

---

# Site regression audit — delivered 2026-10-04 IST

Ownership `IDLE`. PR159 merged to `phase-public-site-rebuild` after full acceptance. Tested head `8ddb7cb4ae640e8d728ec1e95f0d43f71672e43e`; merge `c4bddf7db9e579d14c7ff4a72b6daee9b8a0cd63`; tested/local/remote/merged tree `f8c1d1097f41533d9e49db1aa93f13f89deb0024` identical. CI37202065296 SUCCESS:842 Chromium checks in10.8minutes and24 Firefox/WebKit checks in22.2seconds, no retries; fast and isolated PostgreSQL checks pass. Integration37203377607 SUCCESS: production build, JS813541/819200 and CSS344253/348160 budgets, server smoke and database checks; duplicate browsers skipped. Local414 unit checks and28 planner checks pass.

Eight confirmed defects resolved: tracking hydration; failure/retry states preventing duplicate requests; false confirmation without credentials; client-navigation credential timing; automatic carousel announcements; legacy contact markers; mobile Highlights keyboard access; seasonal image/title overlap. Final mobile home and seasonal native-size captures inspected; all78 named-route capture metrics clean. Earlier89 overview captures inspected; additional17 nested annual/education programme routes reviewed live on desktop for substantive copy, single H1,56px body H2 ceiling, containment and no clinical section. That additional review does not claim all17 were manually reviewed on mobile.

Railway `e8c2440c-54bd-4b7e-a33f-1143a705edf8` SUCCESS on exact merge. Live seasonal image/title gap54.515625px and no overflow; six contact SVGs; correctly hydrated missing-link status/confirmation and no new first-party hydration error; Highlights named focusable region with3px visible outline. Live desktop proof saved. Full submit/retry, protected operational and payment/security journeys use isolated tests; no real donation/refund, beneficiary submission, email or staff mutation performed. Main/draft PR104, canonical facts/media, approved brand patterns/typography, Companion and bundle ceilings preserved. No pending code change in this batch and no whole-site defect-free claim. See SITE_REGRESSION_AUDIT_2026-10-04.md. New confirmed defects use a separate task branch.

---

# Premium carousel controls and programme artwork — delivered 2026-10-04 IST

Ownership `IDLE`. PR157 delivered to `phase-public-site-rebuild`: tested head `6320b7d082b15164942831711d0a8bd9e2cccf85`, merge `d7ee5c64a9c317674d55df6a673b0701481cc0f0`; local/tested/remote/merged tree `90a2d98ff7cb1b0e00272bf1a68e5e1444cecf8c` identical. Final CI37161334707 SUCCESS:173 focused Chromium checks passed without retries in2.8minutes,414 units pass (six isolated-database fast skips),28 planner checks pass. Integration37161688907 SUCCESS: production build, unchanged JS811105/819200 and CSS344018/348160 budgets and server smoke; duplicate browser/database acceptance skipped.

Railway `8d91d45f-1674-47d7-8dc7-a0e811e06f36` SUCCESS on exact merge. Live desktop verification confirms hero slides2/4/5 new derivatives loaded,3 SVG hero controls48px, all5 umbrella card images loaded, emergency shared carousel full1184px width with27.26px display headings and44px SVG controls, relevant flood derivative/privacy blur and COVID branded fallback; seasonal full-width feature/winter imagery retained. Original gradient/pattern/fade, admin overrides, canonical links and Companion preserved. No desktop overflow on verified routes. Mobile/responsive proof is six-width local and seeded CI, not live cloud emulation. Two final live screenshots captured and inspected.

Initial acceptance171/173 passed; two legacy glyph-label selectors corrected to exact semantic labels and aria-hidden SVG checks. All3 gallery checks pass locally. Gallery test path initially selected unknown/full; explicit mapping and regression added, superseded run37161156585 automatically cancelled. Final planner confirms focused union and database skipped; unknown/core/auth/security and main-release paths still fail closed to full. Six authentic source-derived sibling WebP collages have source/output hashes and provenance; gallery originals unchanged. No separately identified COVID source exists, so its branded fallback remains. No database/schema/dependency/payment/email/indexing change. Main/draft PR104 protected. No whole-site defect-free claim. New confirmed defects use a separate task branch.

---

# Nine owner screenshot surfaces — 2026-10-04 IST

State: `IDLE` (delivered PR156; see final ledger). Historical branch `fix/owner-nine-surfaces-20261004`, base `67b3fc256f1f05c29ebde694ba830559f2e91444`. All nine supplied screenshots inspected. Scope Stories ethic pattern; Faith library width/editorial typography; Contact privacy pattern/closing contact icons; sponsorship closing placement; Partner areas; Compliance status/pending patterns and presentation. Preserve factual copy, approved assets, fixed Companion, original headers, unchanged budgets and protected main/draft PR104. Focused responsive/a11y and CI delivery.

---

# Homepage image edge blend and controls — 2026-10-04 IST

Ownership `IDLE`. Homepage edge blend and control refinements delivered through PR154. Tested head `a56bbbf0a4e05ea72be7e93dad4e5b92ea795bae`, merge `a9b84271bd0023106fb06a9faa5b3be67ab6bbf1`; tested and merged tree `0fed7715aa1e36241e309151feb2e13da38b2db8` identical. PR CI37149189924 SUCCESS:110 focused browser checks passed first attempt in1.6minutes. Integration CI37152618989 SUCCESS; duplicate browser/database work skipped. Production JavaScript810705/819200 and CSS348141/348160 bytes, unchanged limits.

Railway deployment `c33bffa1-0db0-4a00-8026-b4dff894b267` SUCCESS on exact merge. Live https://amaanafoundation.org/ verified all five image elements have intersecting side/bottom masks, all three cinematic controls have48px circular translucent surfaces and8px backdrop blur, original gradient/lattice remains, and no desktop horizontal overflow. Final live screenshot inspected and saved. Responsive/mobile proof remains the local14-check six-width validation and focused CI; live cloud proof is desktop. Programme content, crop, backend, fallback and carousel behavior preserved. No pending implementation in this atomic task. Main and draft PR104 remain protected. New confirmed defects use a separate atomic branch; no whole-site defect-free claim.

---

# Dynamic homepage carousel — 2026-10-03 IST

Ownership `IDLE`. Delivered PR152, tested head `9ef0f45ed0bd2bc1ca9fecc92f62640899effdf9`, merge `4d87df7c57eaaab070697fd1244193f9b7c63797`; tested/local/remote/merged tree `5a6493c8e80556bb46969f754f894fd88dab92c2` identical. Final PR CI37145322111 SUCCESS:745 Chromium checks in10.5minutes and24 Firefox/WebKit smoke checks in26.2seconds;414 units and isolated PostgreSQL migration/persistence/revision/rollback checks pass. First core run had736 passes/nine superseded banner expectations; updated assertions preserve gradient/image/edge/fade/grid/overflow/height requirements, final run no retries/flaky failures. Integration CI37146239534 SUCCESS, duplicate browsers correctly skipped; production JavaScript810705/819200 and CSS348088/348160 bytes, unchanged limits.

Railway review deployment `a86daec7-eb42-4992-9e30-ab6d94a16c49` SUCCESS on exact merge. Startup applied20261003180000_home_carousel successfully. Live https://amaanafoundation.org/ confirms five programme slides in requested order, loaded collage images, working dots/pause, original gradient/lattice, right media edge equals shell edge1266px at1363px viewport,60.8px header title, centered controls and no horizontal overflow. `/admin/home-carousel` redirects unauthenticated visitors to `/admin/login`; no signed-in live editor mutation is claimed. Admin action permission/revision/audit guards and persistence validated through unit/isolated database checks. Live has no open public appeal; automatic insertion/removal is verified through tests, not a fabricated live appeal. Responsive/mobile proof is local/seeded CI; cloud live proof desktop only. Final deployed screenshot saved. Five AI-assisted collage derivatives remain separate from original programme photographs, with provenance and meaningful alt text.

Main remains `1a69dd179181390a488623accf1314a1ff09e319`; PR104 remains open/draft (its integration head naturally follows the new merge). No production launch/payment/email/indexing promotion. Next: owner reviews deployed carousel; admin staff use Home carousel to manage slides. New confirmed defects use a separate atomic branch. Documentation closure branch `docs/home-carousel-delivery-20261003`. No whole-site defect-free claim.

---

# Homepage banner composition — 2026-10-03 IST

State: `IDLE`. Delivered PR150, tested head3ecc6b492350bc2cc0053e569917fd88967bb3de, merge7a471eb141b248b000ea73cfff5702cb0c2c43cd; identical local/remote/tested/merged treee5994a3f18163b3b864daf5076f99678352057fb. CI37137587817 SUCCESS:112 first-attempt Chromium checks in2.3minutes and392 units pass (six database-dependent fast skips). Integration37137964849 SUCCESS, duplicate browser/database skipped. Railway2a7bbb9a-f7ba-4a95-9122-a27c7626bc58 SUCCESS on exact merge. Live three-slide carousel, next/previous/pause, full subtitles,64px header title versus56px body cap,480px logo, continuous geometry, no desktop overflow and fixed Companion verified. Right-side approved identity-image fade implemented; current two featured slides have no approved identity header photos and use brand fallback. Six-width fit plus mobile/desktop axe passed. Shared React server-rendered banner composition; no new client library/database call. Production JS819181/819200,CSS344401/348160, caps unchanged. Updated stale legacy-button acceptance to canonical button foreground and selectors. Protected main/PR104 untouched. Policy separator PR149 also deployed/live verified on all four policy routes. See HOME_BANNER_COMPOSITION_AUDIT_2026-10-03.md. Next: owner reviews deployed homepage; only new confirmed defects require a new task branch.

---

# Policy trailing separator — 2026-10-03 IST

State: `IDLE`. Completed PR149. Historical task: branch `fix/policy-trailing-separator-20261003`, base ddbd4d9181c33d806d51746a6f46f7a5c9ace27e. Three owner screenshots show the trailing vertical rule after the third policy principle on Terms/Privacy/Refund. Donation Policy already suppresses it; generalize that existing shared rule to every policy page. Preserve internal dividers/content/backgrounds/responsive layout. Focused existing CI plus desktop/mobile border inspection; main/PR104 protected.

---

# Participation and Appeals pattern correction — 2026-10-03 IST

State: `IDLE`. Four owner screenshot corrections complete through PR146 and corrective PR147. Final head946d82652b52a0d68f5179f886b6bbc8a0d179ba, mergec4309f3f9b664f800e76046a0838d2364e4d9b08; local/tested/remote/merged tree48ab227d530fb03fa7531369550e35664525449b identical. Final CI37128498341 SUCCESS:134 Chromium first-attempt checks in1.8minutes;392 units pass with six database-dependent fast skips. Integration37128803878 SUCCESS; duplicate browser/database skipped. Railway reviewd2a78709-6a93-44cb-8888-4ea23d2deea8 SUCCESS on exact merge. Live two-route desktop checks confirm Get Involved, completed Appeals, dark review and privacy lattice; topmost dark pattern/normal blending, obsolete square absent,12px privacy label/56px title/20px action separation/no divider/no overflow. Dark review and privacy screenshots inspected. Six-width seeded CI and local Get Involved responsive/axe checks pass. Clean build JS819177/819200,CSS348149/348160, caps unchanged; no client JS added. Initial presence-only regression missed global opaque layering; corrected with topmost-layer assertion before final delivery. See PARTICIPATION_APPEALS_PATTERN_AUDIT_2026-10-03.md. Docs closure branchdocs/appeals-pattern-final-delivery-20261003. Main/PR104/artwork/factual copy/media/carousel/payment/Companion preserved. Next: owner reviews deployed changes; new confirmed defects use separate task branch. No whole-site defect-free claim.

---

# Owner surface polish — 2026-10-03 IST

State: `IDLE`. All 19 owner screenshot corrections delivered through PR144, merge `5c0e61c2390c5ca339a754af4550925d525df830`. Local/tested/remote/merged tree `12277a804c87e4b3253969aca22d801fac08531c` identical. Sponsorship process/closing/cards, assistance follow-up, canonical institutional grids/headings, partnership actions, compliance guardrails, policy principles/prose/security notice and approved lattice visibility corrected. PR CI37124521399 SUCCESS:586 Chromium checks passed first attempt in9.6minutes. Integration CI37125268532 SUCCESS; exact-tree acceptance reused, duplicate browser/database skipped. Local15 responsive/navigation checks,24 planner regressions, build/types/lint and design detector pass. JS819181/819200,CSS347615/348160; caps unchanged, CSS smaller than baseline.

Railway review deployment `c4b2596f-9d41-47f9-9dc4-3ec54525096d` SUCCESS on exact merge. Live desktop checks cover all11 affected routes: sponsorship number absent/title38.164px/equal CTA baseline/restored pattern/right closing; four policy prose columns734.234px full width, lighter summaries and shield notice; governance/reporting rows1184px full shell; recognition heading1184px; partnership separator gap32px; assistance rows84.1875px/no shadows; compliance572px+572px with lattice; no horizontal overflow. Responsive proof is local/seeded CI, not cloud viewport resizing. Source/legal/factual/payment/form/media/artwork/Companion contracts preserved; protected main/PR104 untouched. See OWNER_SURFACE_POLISH_AUDIT_2026-10-03.md. Documentation closure branch `docs/owner-surface-delivery-20261003`. Next: owner reviews the deployed fixes; subsequent confirmed defects use a separate atomic branch. No whole-site defect-free claim.

---

# Donate and sponsorship screenshot correction — 2026-10-03 IST

State: `IDLE`. Task completed through PR142, merge `e20149276b6bb864c082f5a15b718eeeec85bc4a`. Donate section1 now matches section2's canonical grid/font; Sponsor Education supporting copy uses body typography/top alignment. PR CI37117208040 SUCCESS:103 first-attempt Chromium checks in1.9minutes, including six widths320/390/768/1024/1440/1920. Integration CI37117505771 SUCCESS; duplicate browsers skipped by exact-tree acceptance. Local typecheck/build/lint (one existing importer warning), detector and23 planner checks pass. JS819181/819200,CSS347746/348160; caps unchanged.

Railway review deployment `f58aa5cc-5729-4f35-ba59-35bed9156977` SUCCESS on exact merge. Live desktop Donate confirms both headings40.89px,left82px; both copy columns643.11px. Sponsor lead changed from40px Georgia/70px line-height to18.88px Arial/33.04px, equal column tops1657.75px and no overflow. Responsive proof is seeded CI; live browser is desktop. See DONATE_SPONSORSHIP_LAYOUT_AUDIT_2026-10-03.md. Source/query/payment/copy/artwork/Companion unchanged. Only protected production PR104 remains; no main promotion. Next: owner continues observations; new confirmed issues use a separate task branch. Documentation closure branch `docs/donate-sponsorship-delivery-20261003`.

---

# Latest delivery — section hierarchy and alignment — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration: `phase-public-site-rebuild`. Implementation/CI/review deployment complete. Documentation closure branch `docs/section-hierarchy-delivery-20261003`.

Completed: body display H2 cap3.5rem across shared and legacy route rules; homepage banner titles exceed body display headings, max4rem; shared homepage title-left/description-right introduction; full-shell closings with right-column supporting copy and aligned actions, mobile stacking; block evidence headings above their labels; wider heading measures. Corrected short Contact closing copy specificity and pre-existing390x844 menu backdrop reachability with a3rem dismiss strip. Approved artwork/content and fixed Companion preserved.

Validation: final24 local responsive/keyboard/scroll/WCAG/Contact/backdrop regressions pass.392 units pass with six database-dependent skips,22 planner and editorial checks pass; lint one existing importer warning. Exact-head PR CI37107270067 SUCCESS:706 Chromium first-attempt checks in10.0minutes and24 Firefox/WebKit smoke checks in51.3seconds. Initial PR CI37106160672 had698pass/3fail; two task-introduced Contact alignment failures and one pre-existing backdrop failure fixed without disabling assertions. Production build/types/coverage/database/server smoke and unchanged budgets green:JavaScript819181/819200,CSS347689/348160. Integration CI37108057516 SUCCESS; exact-tree PR browser acceptance reused, browser job skipped.

Delivery: application PR [#140](https://github.com/immazhark/amaana-platform/pull/140), final head `69f93b5e3ace613a4e5ec16daab598354e7efc52`, merge `3d83e2df7ba5a80687d95d04903c3ed731b7aa7d`; local/tested/remote/merged tree `45cbb6609900ab6c3c72ae66bb98582f1af4cdba` identical. Railway review deployment `e78d725e-3399-410f-aee9-ef12739c2514` SUCCESS on exact application merge. Main/production PR104 remains protected.

Verification limit and next action: desktop/mobile local captures inspected and seeded real-route CI passes. Live /our-work was reachable before deployment, but post-deployment reload failed because the execution environment disconnected (409 environment_offline). No post-deployment live visual confirmation is claimed. Workspace/local checkout refresh also became unavailable. Restore the workspace connection, fetch latest rebuild integration/documentation before any writes, then verify deployed Home/Our Work/Stories/Impact/Contact geometry. No application change or full-suite rerun is needed solely to resume live verification. See SECTION_HIERARCHY_AUDIT_2026-10-03.md. No whole-site defect-free claim; canonical factual/privacy/payment/media/indexing locks preserved.

---

# Latest delivery — Companion panel accessibility — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration: `phase-public-site-rebuild`. Expanded Companion task complete; documentation closure branch `docs/companion-panel-delivery-20261003`.

Completed: labelled tab IDs/shared content panel, roving Tab order, ArrowLeft/Right wrapping and Home/End activation;44px tabs/source controls; scoped panel bounds below sticky chrome and above the existing fixed dock. Normal-height panels flex the scrolling content, short windows scroll the whole panel. Removed unused immutable reminder state, unused refs and delayed focus scheduling; reused static line icon. Fixed dock location, approved visuals/source text and prayer/date/API behavior unchanged.

Verification:25 local responsive/keyboard/header-navigation/WCAG/retry/reachability checks pass in39.9seconds across seven widths and short/tall windows.392 units pass (six database-dependent skips),22 planner regressions pass; fresh build/types/lint green (one existing import warning; two dead-ref warnings removed). Detector emitted no findings before final static-icon optimization. Initial failures classified as stale generated output, alert-locator ambiguity and real subpixel tablet dock overlap; source/test fixes completed without suppressing failing requirements. JavaScript819181/819200 and CSS347670/348160 bytes, unchanged caps.

Delivery: PR [#138](https://github.com/immazhark/amaana-platform/pull/138), tested head `b94d81bec44b368ff584b8a1dab3f0bb2d679c75`, merge `7d2e3ffe62bf284eee5b18e25459e9a6b5dc46ce`; local/tested/merged tree `770db4f9d7496143e6e0c971a87c4cdb20063692` identical. PR CI37101750482 SUCCESS:65 Chromium first-attempt checks pass in1.5minutes. Integration CI37102025429 SUCCESS: exact-tree browser acceptance reused, duplicate browser/database skipped, build/budgets/coverage/server smoke green. Railway review `32edc17f-2650-4358-9954-53549444a074` SUCCESS on exact application merge SHA.

Live desktop /about screenshot/accessibility/DOM confirms44px tabs, actual IDs, selected-only Tab order, named content, real Right/Left activation/focus, panel top145.61px below81px header and bottom849.61px above865.20px dock, fixed Companion, no horizontal overflow. Escape removes the panel and restores dock focus/expanded=false. Mobile/tablet/short-screen proof is local/seeded CI; live cloud-browser viewport resizing not claimed. See `COMPANION_PANEL_AUDIT_2026-10-03.md`.

Next: owner continues UI observations; new confirmed defects use a separate atomic task after incoming checks. Main/production PR104 remains protected. Canonical factual/media/privacy/payment/indexing and fixed Companion locks preserved. No whole-site defect-free claim.

---

# Latest delivery — shared navigation resilience — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration: `phase-public-site-rebuild`. Atomic shared-navigation task complete; documentation closure branch `docs/navigation-audit-delivery-20261003`.

Completed: corrected 760/1020px backdrop breakpoint mismatch, locked background scrolling only while mobile navigation is open, cleared stale menu state on desktop resize with visible home-link focus, and used shared chrome-height/dynamic viewport tokens for short-screen reachability. Reused immutable links for keyboard wrapping; dismissal restores focus without unnecessary animation-frame scheduling. Approved design, banners and fixed Companion unchanged.

Validation: final 11 local responsive/keyboard/header-WCAG checks pass across five widths/two heights; 392 units pass (six database-dependent skips), 21 planner regressions pass. Production build/types/lint pass (three existing warnings). UI audit detector has no emitted findings. PR CI 37099076391 SUCCESS: 57 Chromium checks pass on first attempt in1.5minutes. Integration CI 37099358020 SUCCESS; exact-tree PR acceptance reused, duplicate browsers/database skipped, build/budgets/coverage/server smoke retained. JavaScript819175/819200 and CSS345824/348160 bytes, caps unchanged.

Delivery: PR [#136](https://github.com/immazhark/amaana-platform/pull/136), tested remote head `52fa5a362270cf2a52f9408cdbfa65b48e9d5dc4`, merge `838bf7d7519cf50996cf49c51f084eb78a39c31a`; both tested and merged tree `d2cdefbfba7bf12fec6607a64c845dcd38e3a88d` matches local tree. Railway review deployment `79349c3e-b715-4e54-8aef-3f5c28fc2621` SUCCESS on exact merge SHA. Live desktop /about screenshot/DOM confirms loaded header CSS Module, menu hidden/expanded=false, body overflow visible, no horizontal overflow, approved gradient/geometry/Arabic branding and fixed bottom-right Companion intact. Mobile/tablet and short-screen proof is local/seeded CI, not live cloud-browser resizing.

Next: owner continues UI observations; new confirmed defects use a separate atomic branch after incoming checks. No claim that the entire site is defect-free. Main/production PR104 remains protected. Canonical factual/media/privacy/payment/indexing locks preserved. See `UI_NAVIGATION_AUDIT_2026-10-03.md`.

---

# Latest delivery — assistance progress and actions — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`.

Completed: readable branded current/upcoming assistance progress at14px with44px controls; disabled semantics preserved. Corrected CSS Modules selector for global forward button, restoring desktop right alignment and explicit mobile full-width stacking. Removed duplicate local progress declarations. Form/validation/submission/permission logic unchanged.

Validation:19 local browser checks pass in47seconds, covering24 step/viewports at320/390/768/1024/1440/1920 with WCAG A/AA axe, action geometry, genuine keyboard traversal/focus and retained values; seven existing private assistance journeys pass. Build/types/lint (three unchanged warnings),20planner/content/editorial/global CSS/diff guards pass. Detector finding is only unchanged privacy-note emphasis. Initial default axe best-practice advisory and test focus timing corrected in coverage/method, not suppressed application failures. See ASSISTANCE_PROGRESS_AUDIT_2026-10-03.md.

PR [#134](https://github.com/immazhark/amaana-platform/pull/134) merged asf72eca09957a63e9f7b922563484977b7f8bbb1c. Exact tested remote head3d9ac4705d643f93d914d4337d6a8045b8050783 matches local treeed649737de03c5d1b2ecf55a4e03564daf38f342. PR CI37054686962 SUCCESS:68 Chromium first-attempt pass in2.2minutes,392 unit checks pass (six database-dependent fast skips). Integration push37055303488 SUCCESS; exact-tree browser acceptance reused, duplicate browser/database skipped; production build/budgets/coverage/server smoke green.

Railway review deploymentd43c96f0-3698-46fb-94e9-64994a923bb4 SUCCESS on exact application merge SHA. Live desktop /request-assistance#request-form screenshot/DOM verifies all four progress labels14px,44px targets, opacity1, muted upcoming surfaces with real disabled attributes, active blue surface, forward action right-gap0 and no horizontal overflow. Local/seeded tests cover six widths and all four steps; live verification is desktop. JavaScript819031/819200 and CSS345202/348160, caps unchanged.

Task complete, ownership IDLE. Next: owner continues UI observations; subsequent confirmed defects use a separate atomic branch. Protected PR104/main release, canonical facts/copy, approved artwork, media/privacy/payment/indexing and fixed Companion preserved. No claim of a defect-free whole website. Documentation closure branch docs/assistance-progress-delivery-20261003.

Older entries below are historical.

---

# Assistance progress and actions audit — 2026-10-03 IST

State: `CODEX_ACTIVE`. Branch `fix/public-controls-20261003`, verified integration base `b8d75553b254705baabd42f4a0f80f57a406ddcc`. Owner authorizes continued UI/UX checking and fixes. Only protected production PR104 is open. Confirmed live assistance progress labels12.16px and disabled opacity.48; CSS-module action selector does not match global v2-button, leaving desktop forward action left-aligned. Mobile global rules currently mask width mismatch. Scoped presentation fixed;19 local browser checks pass across24 step/viewports and seven private journeys. Build/types/lint/content/CSS guards and20planner checks pass, CSS345202/JavaScript819031 within unchanged caps. Publish/CI/merge/exact review delivery next. See ASSISTANCE_PROGRESS_AUDIT_2026-10-03.md. Preserve canonical content, artwork, payment/privacy/indexing and fixed Companion.

---

# Latest delivery — policy navigation and accessibility — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`. Application PR [#132](https://github.com/immazhark/amaana-platform/pull/132) merged as `5e505ce4758f7cf8ed6fd6d4a0a7538e1e509ab4`; exact tested task head `0bf13028804bdb67045c41ef660d66eb65329b08`, tree `77b4c8175cc11072c3d7108a098bbf99157d79ab`. Documentation closure branch `docs/policy-audit-delivery-20261003`.

Completed: native policy headings clear sticky chrome; full-width 44px contents targets, keyboard focus and responsive breakpoint parity restored; long desktop contents scroll within short viewports. Restored missing global sr-only utility for Privacy, navigation-loader and private notification labels without removing their accessibility names or changing legal content/action behavior.

Validation: nine local browser tests pass across 24 policy page/viewports at320/390/768/1024/1440/1920 with full axe, real keyboard jumps, direct fragments, short1440x600 sidebar reachability and delayed-loader states. Build/types/lint (three unchanged warnings),20 planner regressions, content/editorial/global CSS/detector/diff checks pass. PR CI37050971480 SUCCESS:657 Chromium checks passed on first attempt in10.4minutes;24 Firefox/WebKit smoke checks pass;392 unit checks pass with six database-dependent fast skips; isolated database verification passes. Shared accessibility CSS correctly retained full acceptance; policy-only paths now have focused coverage.

Integration push CI37052641854 SUCCESS: exact tested tree preserved and duplicate browser suite skipped; production build, coverage, database and smoke checks green. Unchanged caps: JavaScript819087/819200; CSS345331/348160.

Railway review deployment `4652b782-1492-4c60-8601-531c4e83f729` SUCCESS on exact application merge SHA. Live desktop Privacy #policy-03 screenshot/DOM confirms target heading152.33px below header bottom81px, full-width312px contents rows at least44px, viewport-bounded scrolling sidebar, clipped1px sr-only label still present in named accessibility region, and no horizontal overflow. Six-width/mobile/short-screen coverage is local/seeded; live proof is desktop.

Current task: complete. Next: owner continues UI observations; next agent inspects new confirmed defects in a separate atomic branch. Private authenticated staff-record states were not opened. Preserve canonical factual/media/privacy/payment/indexing gates, approved artwork and fixed Companion. Production PR104/main promotion remains protected. See POLICY_NAVIGATION_AUDIT_2026-10-03.md. Older entries below are historical.

---

# Policy navigation audit — 2026-10-03 IST

State: `CODEX_ACTIVE`. Branch `fix/policy-navigation-20261003`; verified integration base `e81ba99fef5455f8d065853993d5e2b8adc4e6d6`. Owner requests continued checking and correction. Only protected production PR104 is open; no competing writer. Confirmed deployed Privacy contents links are30px high and #policy-03 settles with its heading at47.56px beneath81px sticky header. Fix shared policy navigation and anchor offsets across Privacy/Terms/Donation/Refund without changing legal content. Inspect short-screen sidebar reachability and breakpoint parity. Policy anchor/link/sidebar/breakpoint corrections and missing shared sr-only utility implemented. Nine local browser tests pass across24 policy page/viewports, full axe, short-screen/fragment and delayed-loader scenarios. Build/types/lint/content/global CSS/detector and20planner checks pass; JS819087/CSS345331 within caps. Shared accessibility correction intentionally retains full exact-head acceptance. Publication/CI/integration review delivery next. See POLICY_NAVIGATION_AUDIT_2026-10-03.md. Preserve approved media/backgrounds/factual/privacy/payment/indexing and fixed Companion.

---

# Latest delivery — follow-up UI audit — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`. Application PR [#130](https://github.com/immazhark/amaana-platform/pull/130) merged as `2044bf97364674e89c9fe558ea6808999d49892b`; exact tested task head `93ee64399a30f834314c5cc56627e45231b7f38e`, tree `73b95c7c3cdf917871ac4e936bd247335e8a9563`.

Completed: corrected Request Assistance Before/After checkerboard bands caused by inherited tiling sizes applied to legacy gradients; restored approved lattice/body surfaces and shared Before heading. Retired corresponding route overrides. Previously blocked state, Contact/Faith and Impact/Our Work surface verification resumed. Canonical content/privacy/payment/media/indexing, approved SVG bytes and fixed Companion preserved.

Validation: build/types/lint (three unchanged warnings),18 planner regressions, content/editorial/SVG/CSS guards and detector pass. All14 local browser checks pass: six widths with full-page axe plus eight private assistance journeys. Desktop/mobile captures inspected. Initial local full Chromium failure was workspace socket permissions; the installed pinned headless runtime resolved it. Final PR CI37047981721 SUCCESS:62 Chromium checks passed on first attempt in2minutes;392 units pass, six database-dependent fast skips. Integration CI37048619969 SUCCESS; exact-tree PR browser acceptance reused, duplicate browsers/database skipped. JS819087/819200 and CSS344667/348160; caps unchanged.

Railway review deployment `7ee3334c-dbf2-45a1-81d3-83217b0c4cb7` SUCCESS on exact application merge SHA. Live /request-assistance DOM and screenshot confirm approved dark lattice with repeat/no-repeat104px/100% layering, shared split heading, approved After body background and no horizontal overflow. Local/seeded tests cover320/390/768/1024/1440/1920; live verification is desktop. See UI_FOLLOWUP_AUDIT_2026-10-02.md.

Current task: complete. Next: owner continues UI observations; no failing required task checks remain. Authenticated private staff-record states were outside this public audit. Production PR104/main promotion and separate release gates remain protected. Older entries below are historical.

---

# Follow-up UI verification — 2026-10-02 IST

State: `CODEX_ACTIVE`. Branch `fix/ui-followup-audit-20261002`; verified integration base `f5458a98188fb8deed78b07a6fad0191453c1d9c`. Owner requests continued inspection and correction of existing issues. Browser/workspace access restored. No competing task PR; production PR104 remains protected. First inspect previously blocked deployed states and evidence closings, then forms/navigation and confirmed legacy conflicts. Preserve approved design, canonical facts/media/privacy/payment/indexing and fixed Companion. Confirmed assistance Before/After repeating-gradient defect and bypassed heading fixed. Build/types/lint, 18 planner tests, content/SVG/global CSS guards pass; JS819087/CSS344667 within unchanged caps. Local browser launch infrastructure-blocked, no responsive success claim. Focused seeded CI, merge and exact-source review deployment pending. See UI_FOLLOWUP_AUDIT_2026-10-02.md.

---

# Latest delivery — UI consistency and legacy-rule audit — 2026-10-02 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`. Application PR [#128](https://github.com/immazhark/amaana-platform/pull/128) merged as `c670a94239aeeed83a72c74b6ce5338a630aeb20`; tested task head `b60aa42e8e8002095c9bdbdf6ed800207a6710c8`. Documentation closure branch `docs/ui-audit-delivery-20261002`.

Completed: fixed state/receipt legacy white text and oversized typography on light L1 banners; readable Home secondary hover/focus; shared Contact social heading; approved Contact/Faith body backgrounds; explicit responsive Impact/Our Work evidence closing layouts and Impact section gap; visible dark closing geometry; removed retired intent-card rules/animations. Canonical narratives/figures, media, privacy, payment behavior, approved SVG bytes, indexing gates and fixed bottom-right Companion preserved.

Validation: all30 canonical live initiatives and four category overviews opened; static public desktop/mobile and six-width local regressions inspected. Build/types/lint/editorial/CSS guards and17planner regressions pass. Final PR CI37036140425 SUCCESS:153 Chromium cases pass on first attempt in3.9minutes;392 unit checks pass (six DB-dependent checks skipped in fast, browser environment seeded). Specific mappings avoid the unrelated398-case whole-site shell matrix:153 selected instead of554. Shared global/unknown/core paths and releases retain broad/full acceptance. Carousel and keyboard-focus checks await actual geometry/focus without relaxing requirements.

Integration push CI37037096503 SUCCESS: production build and unchanged budgets, JS819087/819200 and CSS344368/348160. Exact tested tree retained; duplicate task browsers skipped. Railway review deployment `2d1e38aa-b97f-4694-9920-5243d2e5f310` SUCCESS on exact application merge SHA `c670a94239aeeed83a72c74b6ce5338a630aeb20`.

Current implementation task: complete. Next action: owner continues UI review; when browser/workspace reconnects, inspect deployed confirmation, Contact/Faith body patterns and Impact/Our Work evidence closings. Final live screenshot was blocked by409 environment_offline after merge; no post-deployment screenshot/rendered verification claim is made. Private staff-record states remain outside this public audit. Production PR104 stays protected and automatically runs its separate full release acceptance when the integration head changes; that suite is not a blocker for completed review delivery. See UI_CONSISTENCY_AUDIT_2026-10-02.md. Older entries below are historical.

---

# UI consistency and legacy-rule audit — 2026-10-02 IST

State: `CODEX_ACTIVE`. Branch `fix/ui-consistency-audit-20261002`; verified integration base `8fcc88b935eed87f740dba2159d67f0d3eb8e231`. Owner authorizes reviewing all screens and fixing confirmed UI/UX inconsistencies and conflicting legacy rules while away. Only protected production PR104 is open. Confirmed state/receipt foreground/type conflict, Home hover contrast, Contact social heading and retired intent CSS fixed. Approved body backgrounds restored on Contact/Faith; Impact/Our Work closing grids explicitly restored and Impact evidence-to-heading spacing corrected. Local six-width UI/a11y regression and ten carousel cases pass; build/types/lint/editorial/CSS guards and 17 CI planner regressions pass. JS819087/819200; CSS344368/348160. See UI_CONSISTENCY_AUDIT_2026-10-02.md. Seeded focused CI, merge and exact-source review deployment pending. Preserve approved banners/background SVGs, canonical content/media/privacy/payment/indexing gates and fixed bottom-right Companion.

---

# Latest delivery — site-wide approved L1 banners — 2026-10-02 IST

State: `IDLE`. Outgoing agent: Codex; incoming agent: next available implementation agent. Integration: `phase-public-site-rebuild`. Completed task branch: `fix/sitewide-l1-banners-20261002`. PR [#126](https://github.com/immazhark/amaana-platform/pull/126) merged at `a6cea782514fdf49837af7a41e7d4aa178a4821e`; tested task head `494421b4e727ff65314b7ac82f9f91d273926b37`. Documentation closure branch: `docs/sitewide-banner-delivery-20261002`.

Completed: all shared PageHero purposes use the approved L1 gradient, geometric lattice and right-side Arabic Amaana motif. Home, assistance success/tracking, donation acknowledgement, error/loading and admin headings share the same surface. Page purposes remain semantic. Mobile Home copy stays on the light field; global error uses an independent equivalent; acknowledgement print stays readable. Retired variant styles removed. Canonical content, media, actions, auth and fixed Companion preserved.

Validation: production build/types, lint (three existing warnings), 392 units (six DB-dependent local skips), 15 planner regressions, content/factual/CSS/SVG guards, sixty local production page/viewport checks and eighteen axe audits passed. All six seeded banner tests passed at320/390/768/1024/1440/1920. PR CI37004033430 green:631 Chromium cases passed first attempt, one body-carousel1024px animation timing assertion passed on built-in retry;24 Firefox/WebKit smoke cases passed. The earlier631pass/1fail run exposed a stale About prose selector from prior PR124; corrected to the actual prose column and verified locally, with no layout change. No current failing required checks. JS819087/819200 and CSS346628/348160; caps unchanged.

Integration CI37005131492 passed production build, budgets, database/fast guards and server smoke; exact-tree PR acceptance reused, duplicate browsers skipped. Railway review deployment `503b31d2-e2ff-4fbd-a76b-95a4a81eab50` SUCCESS on exact application SHA `a6cea782514fdf49837af7a41e7d4aa178a4821e`. Live Home, Contact and neonatal initiative DOM confirms identical surface, visible approved Arabic motif and no horizontal overflow. Deployed Contact screenshot inspected and saved. Live neonatal page retains full case narrative and ₹107,520; gallery remains supporting media.

Current implementation task: complete. Exact next action: owner continues UI review on the deployed review website. Future page-specific banner exceptions are deferred until requested. One existing carousel geometry test has a timing-sensitive700ms wait and0.09375px first-attempt overshoot; retry passes, recorded for future test stabilization rather than broadening this banner change. Main/production promotion PR104 remains a separate protected checkpoint. Preserve all canonical factual/compliance/privacy/media/payment/indexing gates, approved SVG bytes and fixed Companion. Older active/pending entries below are historical and superseded.

---

# Site-wide approved L1 banners — 2026-10-02 IST

State: `CODEX_ACTIVE`. Integration base `4f8459967845b2a7bc988adaaf62b073a624faf6`; task branch `fix/sitewide-l1-banners-20261002`. Owner explicitly requests the approved L1 gradient/geometric/Arabic-right artwork on every website header banner, with future per-page exceptions deferred. No other implementation writer or task PR is active; only protected production PR #104 is open. Current task: audit shared PageHero and custom/transactional banners, standardize surfaces without changing canonical content or interactions, then focused validation, integration PR/CI/merge and exact-source preview verification. Prior live browser transport failure is historical; retry verification for this delivery. Preserve factual/media/privacy/payment gates, approved SVG bytes and fixed Companion. Older entries below are historical.

Local validation complete: production build/typecheck, lint (three existing warnings), 392 unit tests (six DB-dependent local skips), 15 CI planner regressions, content/factual/CSS guards and all six approved SVG hashes pass. Sixty production page/viewport combinations and eighteen axe audits pass at 320/390/768/1024/1440/1920; local Home uses the production hero fixture and DB-backed initiative is reserved for seeded CI. Desktop/mobile rendered inspection passed. Final JS 819087/819200 and CSS 346628/348160; fixed budgets unchanged. Implementation complete; publication, seeded full shared-surface CI, green merge and exact-source review deployment remain pending.

Delivery checkpoint: PR #126, head 481d009eb1e19ced645dbd1f41dd4f4a26077812. CI 37002628565 fast/database green; Chromium 631 passed, one pre-existing stale About prose selector failed. The heading wrap introduced in prior PR124 caused the test to measure the left heading as prose. Selector corrected to the actual last direct prose div; unchanged production layout passes locally at 1920/1440/390. All six actual seeded banner tests passed. Corrected acceptance run and deployment remain pending.

---

# Latest delivery — body section headings and footer spacing — 2026-10-02 UTC

State: `IDLE`. Outgoing agent: Codex; incoming agent: next available implementation agent. Integration: `phase-public-site-rebuild`. Completed task branch: `fix/section-headings-footer-spacing-20261002`. PR [#124](https://github.com/immazhark/amaana-platform/pull/124) merged at `892aa722294b2ebb307e6934a444fad3ffee5361`; task head `d837253610ce26e07c5784c21d0edaae84d101ad`. Documentation closure branch: `docs/heading-footer-delivery-20261002`.

Completed: shared server-rendered body introductions use a 40px rule and eyebrow above the left title, subtitle on the right; mobile stacks. Additional right-side content retains its composition. Site-wide footer outer spacing shares one token: 80px desktop, 96px plus safe area on mobile. Canonical/legacy programme galleries and eligible public introductions use the shared component. Content, approved background foundations, factual locks and fixed Companion preserved.

Validation: local production build, lint/types/content/CSS guards, 392 unit tests (six database-dependent skipped locally), 15 CI planner regressions, and 30 local production page/viewport combinations passed. PR CI 36948217424 passed all 507 Chromium cases, including six widths. Integration CI 36949106614 passed build, budgets and server smoke, reusing exact-head PR acceptance and skipping duplicate browsers. JS 818873/819200 and CSS 347314/348160; caps unchanged. Optional-gallery fixture assertion and real keyboard-navigation setup corrected; no current failing application checks.

Railway preview deployment `b7ef3970-885d-4017-bdce-de9f4c6176ff` is SUCCESS on exact application SHA `892aa722294b2ebb307e6934a444fad3ffee5361`. Final public-site visual inspection could not finish because the browser/container transport disconnected with `409 environment_offline`; no post-deployment screenshot or live visual claim is made. Seeded browser acceptance and exact-source deployment are confirmed.

Current implementation task: complete. Exact next action: owner continues UI testing on the deployed review site; when browser access returns, inspect /impact shared introductions and footer, and /our-work/emergency-neonatal-medical-aid gallery. No additional code edits are required for this delivery. Main/production promotion PR #104 remains a separate protected release checkpoint. Do not casually change factual/content locks, private evidence boundaries, payments/indexing gates, approved geometric foundations or Companion positioning.

All older active/pending entries below are historical and superseded by this delivery record.

---

# Body section headings and footer spacing — 2026-10-02

State: `CODEX_ACTIVE`. Branch `fix/section-headings-footer-spacing-20261002`, verified integration `2235263272d0083fa280fc7a1ed0b34acdd6ba88`. Only open PR is protected production #104. Owner requests equal outer footer top/bottom breathing room and a consistent body heading: line + eyebrow, title left, subtitle right; retain compositions with extra content on the right, stack on mobile. Screenshots recovered and inspected. Prior PR122/123 merged with green CI and exact preview deployments; older pending notes below are historical. Shared server-rendered heading implemented across standard public introductions, closings and galleries; original content, hero layouts, content-panel exceptions, card headings and fixed Companion preserved. Thirty actual production page/viewport combinations pass at 320/390/768/1024/1440/1920. Local lint/types/content/CSS audit/build and 392 unit tests pass (six DB-dependent skipped locally); 14 planner regressions pass. Final JS 818873/819200 and CSS 347314/348160, caps unchanged. Footer outer top/bottom uses one token: 80px desktop, 96px mobile plus safe area. Focused seeded CI, green merge and exact-source preview deployment verification remain pending.

---

# Participation, Contact and completed Appeals — 2026-10-01

State: `CODEX_ACTIVE`. Branch `fix/participation-contact-appeals-20261001`; stacked PR #123, remote head 4e73601731f76d6a8fe5f3c2d65efb7b7494e9ab. All six screenshot groups are implemented: shared Contact/Get Involved cards with refined normal/hover/focus states; separated journey headings/copy without misaligned dots or rails; official social SVGs reused from the footer; completed Appeals use BodyCarousel/BodyCard; brand-gradient fallback uses the approved geometric lattice globally. Local production checks pass at 320/390/768/1024/1440/1920; Contact/Get Involved axe checks pass. Units: 392 passed, six database-dependent skipped locally. Build/types/lint/content/global CSS and 13 CI planner regressions pass. Production JS 818873 / 819200 and CSS 344906 / 348160; caps unchanged. Actual database-backed Appeals verification remains for remote CI and deployment.

PR #122 head 04a7b0f28138982bce8d5fa82e28e7d1983b0235, CI 36896947301: fast and database green; browser running. Previous complete Chromium run passed 614 cases; Firefox could not launch because the container HOME owner differed from its runner user. Current commit repairs existing HOME ownership without changing HOME or reinstalling browsers. PR #123 contains this fix as an ancestor. After PR #122 passes and merges, retarget PR #123 to `phase-public-site-rebuild`, trigger focused CI, merge only on green, verify exact-source integration build/Railway preview and actual pages. New presentation changes select ten focused suites without a full cross-browser matrix or refund database job. Main/production remains unchanged.

---

# Initiative detail delivery checkpoint — 2026-10-01

State: `CODEX_ACTIVE`. Owner requested continuation; current CI remains running. PR122 is open on fix/initiative-detail-narrative-20261001; remote head7e09e584e85febe87974d7b83c1e90d0d913e52b. Full canonical and legacy narratives retained; clinical glossary removed; continuous approved pattern, centered closing actions, equal footer padding implemented. All six new initiative browser checks passed at320/390/768/1024/1440/1920. Last full run36888890250:613 passed,1 failed due single-programme category test expecting medical relief to have one record after canonical seed expansion. Test now uses genuinely single-parent Taleem category. Current final CI36891312920 is running. Fast/database previously green; local types/lint/master/build and budgets pass. Not merged or deployed. Next: verify current CI, merge PR122 into phase-public-site-rebuild only after green, check integration build and exact-source Railway preview deployment, inspect rendered initiative pages. Existing browser detailTab id3 on amaanafoundation.org; runtime restored. Main/production protected. CI uses pinned Playwright1.55.0 preinstalled image, postgres service hostname, canonical seed and valid workspace/relative artifact paths; prior20-minute OS mirror install timeout eliminated. User frustrated by full-suite repetition; do not repeat broad runs beyond required failures.

---

# Initiative detail corrections — 2026-10-01

State: `HANDOFF_PENDING`. Local implementation complete. Branch fix/initiative-detail-narrative-20261001 from verified integration20b5c23. Six screenshots inspected. Scope: restore complete canonical narrative, remove clinical glossary, one continuous approved body surface, align closing CTA and footer spacing. Main and factual locks protected. Validation: eight narrative tests including all30 canonical records; full unit suite391 passed before final additional catalogue case; six-width representative production-CSS layout harness passes, SVG artwork visually inspected. Lint/types/master/global CSS audit/build pass; JS818873 and CSS340119 below unchanged budgets. Actual database-backed browser pages and remote CI/staging remain unverified. Publication next.

# CI separation extension — 2026-10-01

State: `HANDOFF_PENDING`. Extended policy verified locally: twelve planner tests, lint, workflow job dependencies, YAML/shell syntax and diff checks pass. Fast/database/production/browser separated with stable aggregate verify gate. Remote publication is pending direct authorization. Continue chore/change-aware-ci-20261001; user requests explicit light/heavy job separation and wider routine UI/content selection. Publication remains blocked by prior auto-review; do not retry export without direct authorization.

# Change-aware CI — 2026-10-01

State: `HANDOFF_PENDING`. Local mechanism implemented and verified: eight planner tests, lint, YAML/shell syntax and diff checks pass. Publication/remote workflow validation pending. User requests implementation of efficient verification criteria. Branch: chore/change-aware-ci-20261001; verified integration base 72fcfe3, PR120 merged. Scope: deterministic diff planner, workflow selection and regression tests; preserve production readiness and budgets.

# Publication authorized — 2026-10-01 IST

State: `CODEX_ACTIVE`. Owner explicitly approved GitHub publication, PR/CI and integration staging delivery. Continue fix/owner-screenshot-polish-20261001 from verified f6980fd3. All local checks pass as recorded below. Terminal push has no credentials; use the connected GitHub publisher to publish the same tested tree. Remote CI, merge and exact-source deployment verification are next.

---

# Publication blocked — 2026-10-01 IST

State: `REVIEW_PENDING`. Branch: `fix/owner-screenshot-polish-20261001`.
Implementation commit: `c911884` (based on verified integration f6980fd3).
All six owner screenshot groups are implemented and locally verified. Nine new production-browser tests pass across 1920/1440/1024/768/390/320, including keyboard disclosure/select, hover/focus, actual moving gradient, reduced motion, no hero-control overlap, no horizontal overflow and axe checks. Eleven existing chrome checks also pass. Lint/types/master/CSS audit/build and 389 unit tests pass; six database-dependent tests are locally skipped. Production JS 818873/819200; CSS 340731/348160. Desktop/mobile visual review confirms contained official logo artwork and aligned portfolio metrics/controls.

Automatic approval review rejected GitHub push: repository export destination requires explicit end-user authorization for this change set. No connector workaround was attempted. Read-only GitHub verification confirms the task branch does not exist remotely (404). No PR, remote CI, integration merge or staging deployment occurred. Staging remains the prior verified application 0227dc8.

Next exact action, after direct user publication authorization: push the task branch to https://github.com/immazhark/amaana-platform, create PR to phase-public-site-rebuild, require green full CI, merge and verify exact-source Railway staging deployment plus rendered Home/Our Work. Main/production promotion, indexing, live payments, factual locks, identity separation and fixed Companion remain protected.

---

# Owner screenshot corrections — 2026-10-01 IST

State: `CODEX_ACTIVE`. Branch: `fix/owner-screenshot-polish-20261001`.
Verified integration base: `f6980fd3a083392deaa375626f6289c70da66d5f`; only open PR is protected production promotion #104. User explicitly requests detailed implementation of six annotated screenshots. Scope: header hover, taller Home hero and official brand fallback, animated Highlights gradient, visible dark-section lattice, trust links/contrast/icons, wider smaller footer lead, portfolio filters/disclosure alignment, brief initiative summaries, consistent metadata and readable brand thumbnails. Preserve factual values, curated identity separation, fixed Companion and integration-only delivery. Local verification complete: nine production-browser checks across six widths, eleven existing chrome checks, axe on corrected surfaces, lint/types/master/CSS audit, 389 unit tests pass (six DB-dependent local skips). Final production JS 818873/819200 and CSS 340731/348160. Desktop/mobile screenshots inspected; full logo artwork contained and controls do not overlap CTAs. Full remote CI and staging verification pending.

---

# Completed delivery — 2026-10-01

State: `IDLE`. Unified body-carousel task is complete.

- PR #118 merged into phase-public-site-rebuild at 0227dc873fd596b71320d9fc2edaf4b43441483e.
- Final task-head CI 36843517333 and integration push CI 36844982063 are SUCCESS: 832 Chromium + 24 Firefox/WebKit checks, unit/refund database, lint/types/content checks.
- Integration production build and unchanged budgets pass. Local production totals: JS 818873/819200 bytes; CSS 344825/348160 bytes.
- Railway preview deployment 90272fe1-bbd5-42f7-a31f-f76f5e86e836 is SUCCESS on exact application SHA 0227dc8.
- Cloud-browser live verification confirms Home starts flush left with 18% preview, Qurbani two-card and Eid seven-card rows use equal row heights and 16:9 visuals, and wrap navigation aligns the last card at the same left edge. Companion remains fixed bottom-right.
- Six local responsive fixture widths and ten interaction checks pass. Terminal live-site DNS was unavailable; live checks used the cloud browser at its desktop viewport. Do not claim six-width live-deployment checks or a public version-endpoint check; the version endpoint was blocked to this browser, while Railway source SHA and deployed UI were verified.
- Shared BodyCarousel/BodyCard, heading controls, progress line, brand SVG fallbacks and site Framer Motion layer are delivered. Manual pause, focus/hover pause, native drag, direct links, keyboard navigation and reduced motion are verified.
- Design specification: docs/BODY_CAROUSEL_DESIGN_SPEC.md. Gallery photos remain separate from hero/identity media. Main, reserved production, indexing, live payments and factual locks remain protected.
- Next: owner visual review and the next explicitly requested UI defect block. Identity photographs remain an external content assignment. No unfinished implementation in this carousel block.

---

## Autoplay focus guard follow-up

Autoplay now checks actual hover/focus state and active drag before advancing, so pointer exit cannot resume while keyboard focus stays inside. Independent manual pause remains. Ten local Chromium checks pass (including focus/blur resume), lint/types/production build pass. Production JS 818873/819200, CSS 344825/348160. Publish focused follow-up to PR #118 and require its exact-head CI before merge.

# Recovery checkpoint — 2026-10-01

State: `CODEX_ACTIVE`; continuing PR #118 at verified remote HEAD b00f8398040606a6479e78a5b480d6f19d551f29. Integration remains 5908d16. Latest CI: 826 passed / 5 failed. Recovered exact published sources; removed retired Impact and programme card rules, fixed in-flight scroll destination tracking and hero offset context. Canonical programme-link assertions and approved 416px hero-height assertions replace obsolete expectations; left-edge wrap geometry is polled until settled. Local lint/type/build/master and 389 unit tests pass; eight existing browser checks pass. Production JS 819177/819200, CSS 344825/348160. Added rapid wrap regression; exact-head CI, integration and staging verification pending. Main and fixed Companion remain protected.

---

## Carousel validation checkpoint

Draft PR #118; initial CI lint issue corrected. Final local lint/type/build pass, 389 unit passes (6 DB skips), eight Chromium checks pass including six widths, exact peek, manual pause, reduced motion, drag and direct-link navigation. JS 818889/819200; CSS 347534/348160. Full exact-head CI and preview deployment pending.

# Current task — 2026-10-01 unified body carousels

State: `CODEX_ACTIVE`
Task branch: `feat/unified-body-carousels-20261001`
Verified integration base: `5908d16b6c31f5919033e68b49b33962068e5a71`.

Owner requests all body carousels start flush left; one design system for Home/L1/L2, fixed visual headers, brand-themed SVG fallbacks, equal card geometry, 15–20% next-card peek, heading-aligned controls and progress line. New explicit instruction requires Framer Motion site-wide where appropriate. Preserve native scroll snap/touch and motion preferences, factual locks, identity media separation and fixed Companion. Only open PR at claim is reserved production PR #104; no competing implementation writer. Prior #116/#117 delivery is complete: 823 Chromium + 24 Firefox/WebKit passed, final integration CI green, Railway success on 5908d16, JS 805951/CSS 346969 within unchanged budgets. Implement and verify this new coherent task before integration; no production promotion.

---

# Current delivery checkpoint — 2026-10-01 IST

State: `CODEX_ACTIVE`
Task branch: `fix/curated-import-validation-bundle`
Integration HEAD: `3107555782a4b9632300bcfb7ef65271e86592fb`.

- PR #116 merged after exact-head CI 36764531334 passed 823 Chromium and 24 Firefox/WebKit cases, lint/types, 389 unit tests and isolated refund database checks.
- Railway staging deployment `b4c52092-3072-4249-9566-be32d4e3fdc8` is SUCCESS on exact integration SHA `3107555`. Rendered homepage verified through cloud browser: header, separate reminder/live rail, five Highlights including ₹12,14,520, canonical footer and fixed Companion are present.
- Integration push CI 36766109793 exposed the existing JS excess: 973,135 / 819,200 bytes. CSS passes: 346,969 / 348,160 bytes. No budget increase allowed or performed.
- Root cause: shared curated-gallery schema imported the exported Zod namespace object, retaining unused validator exports/locales in the admin browser bundle. Changing to an ES module namespace import preserves exactly the same schemas, validation and inferred types while enabling unused exports to be removed.
- Clean local production build after this import-only correction: JS 805,951 / 819,200 bytes; CSS 346,969 / 348,160. TypeScript and all three curated-contract tests pass.
- Next: publish isolated correction PR into integration; require green CI, merge, verify production budgets and staging source SHA. Current application fixes are deployed, but delivery is not fully certified until integration CI is green.
- Main, reserved production service, indexing, Live Razorpay, gallery/identity assignments and fixed bottom-right Companion placement remain locked.

---

# Current checkpoint — 2026-09-30 site chrome + footer + homepage hero correction

State: `CODEX_ACTIVE`
Task branch: `fix/site-chrome-footer-hero-20260930`
Integration base / current phase HEAD at claim: `883d2c6c680bd4ac2796eb68defe16875a9b7bab`.

Incoming Codex ownership explicitly handed over by the owner continuation prompt. Verified task HEAD `464938377ee3b8cddc03b756aa6ab9668b8f655a`, integration HEAD `883d2c6c680bd4ac2796eb68defe16875a9b7bab`, Draft PR #116. CI 36748468904: 808 Chromium checks passed, seven failures under investigation. No concurrent implementation writer is active.

Owner-authorized Block #1 + Block #2 implementation:
- footer geometry/spacing/typography/site-wide parity, gold link states, official social icons, Threads support, future social extensibility;
- slightly taller global header with larger logo, restored thick animated gold nav underline, canonical Support a need CTA;
- split compact Reminder + independent Amaana Live rail below navigation;
- homepage hero breathing room, 45/55 copy/media composition, image fade boundary, removal of decorative 2020/Arabic story graphics;
- fifth homepage Highlights metric for the canonical medical/financial assistance aggregate.

Do not repurpose any of the 154 gallery photographs as hero/banner/thumbnail media. Do not touch main, DNS, indexing, reserved production service, Live Razorpay, or fixed bottom-right Islamic Companion placement.


Codex recovery checkpoint:
- Recovered Draft PR #116, inspected all 19 implementation commits and all seven exact-head browser failures.
- Established `site-chrome.css` after `experience-finish.css`; retired conflicting nav/footer/reminder generations rather than increasing specificity or bundle budgets.
- Fixed footer implicit grid tracks and inherited 48–80px lead margin; restored 44px mobile link targets, canonical active-route gold, safe bottom spacing, and consistent typography.
- Corrected the hero split relative to the public container and secondary CTA contrast; actual Home story and Highlights are shared with the isolated carousel fixture.
- Guarded assistance total against malformed measures, duplicated cases, missing cases and future rollups. Canonical total remains ₹12,14,520; ten focused unit cases pass.
- Expanded rendered acceptance across 1440/1280/1024/768/390/320, including uncut metric values, footer shell parity and fixed Companion positioning. Obsolete tests now enforce the owner’s newer same-footer/two-lane requirements.
- Local lint/type/master and unit checks pass (389 tests, 6 database-dependent skips; three unchanged lint warnings). Full exact-head CI and staging verification remain pending; no completion/deployment claim yet.


Publication recovery — 2026-10-01 IST:
- Owner directly authorized continuation after the explicit publication approval request. Terminal push then failed for missing GitHub credentials.
- Connected GitHub publication succeeded: `12cd093d4024bcb2775ab83c07f0b77fcd5b472a`, whose tree exactly equals local tested tree `50cd32acd66c24f97778d173842b954aa7b02596`.
- PR CI 36762269001 passed lint/types/unit/database/factual checks and 822 Chromium cases. One mobile footer-collapse failure exposed a later generic display rule overriding the existing disclosure state.
- Removed only the redundant generic display declaration; kept the existing disclosure behavior and compact-height assertion. Local failing mobile disclosure test now passes, as do all eleven focused chrome checks. Two broader local checks need unavailable database routes; those same routes passed in CI.
- Clean acceptance CSS was 346,982 / 348,160 bytes before this one-line reduction; budgets remain unchanged. The local JS baseline discrepancy still requires integration production-build verification.
- Publishing this correction and rerunning exact-head CI is next. PR #116 remains Draft until green; no integration merge or Railway deployment has occurred yet.


---

# Historical checkpoint — 2026-09-28 background composition correction

State: `CODEX_ACTIVE`
Task branch: `fix/background-composition-scale`
Base integration SHA: `671e3ba219f01248a0154dfe81525d7518e2efdf`
User explicitly requests uncropped header/footer emblems and uniformly small, lighter body pattern. Prior cover-based acceptance was insufficient. Preserve original six source SVGs; derive independent ornament/tile assets and test actual viewport geometry. Scope is backgrounds and their readable layout only; content, payments, main and draft promotion PR #104 remain untouched. No other implementation writer is active. Verification pending.

---

# Amaana Platform — Active Implementation State

## State
**CODEX_ACTIVE**

## Integration branch
- `phase-public-site-rebuild`
- Family feedback/review is complete as of 21 September 2026.
- Quiet-mode restrictions are lifted. Audited implementation may be pushed phase-by-phase to staging on this branch.
- Current exact integration HEAD: `cdfc8ad2cefb61c992537a3d4cae48e58cfe6aab`; push CI `36330311977` and PR CI `36330314494` are SUCCESS. Exact-head Chromium acceptance: 352 passed in 5.2 minutes.
- Current successful Railway staging deployment: `a7625ecc-5d8b-41d7-a8ac-7cb341e71bfc` from source SHA `b5d5373402e275e3993448914cff75e1bbb23bcb` (`fix: make master copy source reproducible`). Startup encountered one transient Neon P1001, recovered through the existing retry path, and Railway `/api/health/ready` succeeded before deployment reached SUCCESS. The later `cdfc8ad2...` assertion-only commit was correctly SKIPPED by Railway.
- Exact-head repository state is certified by GitHub CI; Railway deploys only application-affecting changes and correctly skips test/documentation-only follow-ups.
- Prior runtime baseline `bce6b1d85bedc9da6e0fb38484e867db71cb4182` / deployment `d0e7608a-df34-425b-9d30-79d1434b1064` remains historical evidence, but that deployment is now `REMOVED` and is not the currently served staging deployment.
- Reserved production service `amaana-platform` now has non-secret hardened deployment parity: `/api/health/ready`, 300-second timeout, restart retry limit 3 and staging-aligned application watch patterns. No deployment was triggered.
- Safe production defaults were staged with deploys skipped: `APP_ENVIRONMENT=production`, `EMAIL_DELIVERY_MODE=disabled`, `NEXT_PUBLIC_ALLOW_INDEXING=false`, and all acceptance/browser flags false. Indexing decision, production public-media bucket, Live payments and live email remain deliberately unresolved.
- Resend production sending-domain resource for `amaanafoundation.org` was created on 27 September 2026 with sending enabled, receiving disabled and tracking disabled. Provider verification has been triggered and remains `pending`; DKIM, SPF MX, SPF TXT and the `rsend` CNAME now all report `pending`, with none yet verified. No transactional email was sent and no new API key was created.
- Live Neon media audit on 27 September 2026: 3 MediaAsset rows total, all unpublished/unapproved initiative-linked legacy VIDEO metadata matching the three removed static MP4s; zero public assets, zero privacy approvals, zero public-without-approval, zero orphaned assets and zero identity assets. No destructive DB cleanup was performed.
- Reserved production service now also has `PUBLIC_MEDIA_BASE_URL=https://amaanafoundation.org/media` configured with deploys skipped. `PUBLIC_MEDIA_S3_BUCKET` and `PRODUCTION_INDEXING_DECISION` remain deliberately unset.
- `main` remains untouched until explicit production-promotion approval.

## Current task stream
- Continue the consolidated audit/enhancement roadmap on the integration branch.
- Curated programme photography is intentionally deferred until the owner finishes selecting images drive-by-drive.
- The media system must remain plug-and-play while that curation happens; do not request replacement media as a blocker for unrelated engineering work.
- Priority UX direction: materially reduce vertical scrolling with deliberate banner, gallery and repeated-card carousels while keeping reading-heavy trust/policy/story content linear.

## Working protocol
1. Keep `main` untouched and indexing disabled.
2. Push coherent, reviewable implementation slices to `phase-public-site-rebuild`; staging auto-deploys browser-affecting changes.
3. Do not initiate real Razorpay payments/refunds or production cutover actions.
4. Do not publish real beneficiary/programme media without the existing human privacy/consent/provenance gate.
5. Do not reintroduce the deleted legacy programme-image pool or heuristic/random hero selection.
6. Use one explicit curated identity/hero image per programme/drive and ordered supporting images.
7. Prefer compact carousels only for media/repeated-card surfaces where they reduce scroll; do not hide long-form accountability or policy reading inside sliders.
8. At each implementation checkpoint, validate build/type safety and retain browser/E2E regression coverage.

## 21 September 2026 media + carousel baseline
- All 191 legacy programme/drive/cause image files were removed from the current staging branch.
- All 175 staging `MediaAsset` IMAGE records were removed. The three legacy static MP4 files were subsequently removed from `public/media`; three matching DB VIDEO metadata rows remain private/unapproved and hosted video remains fail-closed publicly.
- `prisma/integration-media.json` is empty so deleted images cannot silently re-seed.
- Identity image contract is deterministic: `IDENTITY_MEDIA_SORT_ORDER = -1000`; assigning a new identity image demotes the prior identity image for the same target.
- Identity publication requires explicit hero-use approval in addition to the normal privacy/provenance publication gate.
- Shared manual/swipe/keyboard `ScrollCarousel` is implemented without autoplay or a heavy slider dependency.
- Programme galleries use the carousel while retaining the accessible lightbox.
- Long programme-year histories switch to compact carousel presentation when they exceed three entries.
- Impact witness media uses a compact carousel.
- Homepage programme discovery is a horizontal five-area strip.
- A full-width homepage banner carousel is wired but activates only once at least three approved featured identity images exist; until then the existing static PageHero fallback remains.
- Curated image insertion therefore requires data/media work, not another layout redesign. See `docs/CURATED_MEDIA_CAROUSEL_CONTRACT_2026-09-21.md`.

## Completed before this quiet batch
- Secure gated private-bucket public-media proxy and real synthetic upload/publish/unpublish acceptance.
- Database snapshot/restore recovery drill with matching content digests and clean post-restore application startup.
- Fail-closed staging launch acceptance (32 checks) on exact candidate SHA before public-port activation.
- SEO/social metadata hardening and Docker build-time NEXT_PUBLIC_* injection.
- Bounded Prisma advisory-lock retry for transient P1002 migration contention.
- Separate public-media storage from private assistance storage.

## Quiet-batch work completed/in progress

### Release / editorial quality
- Unified read-only launch preflight commands:
  - `npm run launch:preflight`
  - `npm run launch:preflight:rehearsal`
  - `npm run launch:preflight:production`
- Public editorial/compliance guard with tests for:
  - newborn amount ₹107,520;
  - Winter 234 kits / 234 beneficiaries;
  - Aliza amount ₹482,700;
  - provisional 12A/12AB and 80G wording;
  - domestic-only / non-FCRA boundary.
- Exact Aliza public metric changed from rounded `₹4.82L` to `₹482,700`.
- SEO browser coverage now covers all 26 declared static public routes, all four programme-category schemas, generated social images and canonical redirects; exact-head Chromium acceptance completed 352/352.
- Document-title regression coverage prevents duplicate Amaana branding.
- Master-copy generation is now reproducible from tracked `src/content/master-copy.json`; `npm run master:check` is enforced in CI and the confirmed provisional 12A/12AB status is locked against stale source text.
- Privacy, Terms and Refund Policy still explicitly disclose outstanding professional legal/accounting wording review; this remains part of the human `final-editorial-seo-social-review` gate and is not auto-closed by green automation.
- Public/private data-boundary guard prevents public publishing surfaces from reading internal beneficiary/verification/token/storage fields.
- Final human launch QA checklist consolidated into one canonical document.

### Accessibility
- Skip-link target is programmatically focusable.
- Browser acceptance verifies skip-link focus transfer, one H1, document language and main landmark.
- Existing axe, responsive, reduced-motion, keyboard, mobile-focus and 200%-reflow-equivalent coverage retained.
- Branded 404 behavior is browser-tested for 404 status, navigation, noindex and mobile containment.

### Security / privacy / operations
- Private-document signed URL ownership binding and private-cache hardening.
- Admin login timing/identity hardening, bounded credential inputs, expired-session pruning and audited logout.
- Trusted proxy/client-address normalization for rate-limit identity.
- Ephemeral login/donation security-ledger retention/pruning.
- Transactional email worker idempotency/retry/stale-processing recovery plus operational runbook.
- Notification operations page and audited manual requeue path using new `notification.manage` permission.
- Destructive media/private-document deletion intent audit records.
- Public-media route MIME mismatch fails closed; managed PDF delivery acceptance added.
- Staging email delivery remains fail-closed/disabled.
- Browser security-header acceptance now covers CSP, HSTS, framing, referrer, permissions, COOP/CORP and no-store sensitive surfaces.

### Data / query integrity
- Additive operational indexes for audit history, notification lists, security-ledger cleanup and media review ordering.
- No destructive schema migration introduced.

## Additional hardening completed in the quiet batch

### Payment / refund correctness
- Refund processing requires INR and bounded paise values.
- Out-of-order refund webhooks reconcile payment → order and reuse the idempotent capture path before refund accounting.
- Refunds can reopen a FUNDED appeal to PUBLISHED only while the fundraising window is still open; otherwise the under-target funded appeal becomes CLOSED.
- Private donation acknowledgement responses are no-store, no-referrer and noindex.
- Critical unmatched payment/refund events are surfaced in admin donation operations.
- Stored webhook evidence is privacy-minimized.
- Exactly one donor refund notification is queued transactionally for each effective unique refund event.
- `docs/PAYMENT_REFUND_OPERATIONS_RUNBOOK.md` documents the controlled live acceptance.
- Webhook route tests now cover invalid signatures, duplicate event idempotency and end-to-end refund reconciliation into donation/appeal/event/notification records.

### Production indexing boundaries
- Indexing now requires explicit opt-in, official HTTPS Amaana host and `APP_ENVIRONMENT=production`.
- Docker builder defaults `APP_ENVIRONMENT=staging`, making preview builds fail closed.
- `/donate` is a public SEO route while `/donate/<appeal>` remains private.
- All admin surfaces have explicit noindex/nofollow/no-referrer metadata.

### Rollback preparation
- `npm run rehearsal:verify-target` validates exact deployed SHA, health/readiness, representative public routes and private no-cache/noindex boundaries.
- Pinned previous-known-good branch remains `rehearsal/rollback-baseline-2026-09-18`.

### Production RBAC correctness
- New notification view/manage permissions are not seed-only.
- Migration `20260918111500_notification_operations_rbac` idempotently creates/grants them to PRIMARY/BACKUP approvers in production.
- Manual email recovery uses an atomic FAILED-only claim and cannot race an active worker into a duplicate send.
- Notification worker tests cover atomic claim, stable provider idempotency, SENT transition, transient retry scheduling and concurrent claim loss.

## Current background correction
- Six corrected approved SVG source files were supplied and landed byte-for-byte in `public/backgrounds/`.
- `scripts/verify-approved-backgrounds.mjs` locks their SHA-256 hashes and launch preflight fails closed if repo assets differ.
- The family-review deployment still serves the previous backgrounds; responsive rendered QA remains pending until the next controlled staging deployment.

## Operational note
- The preview service remains healthy on the family-review SHA.
- The notification cron's historical failed build was caused by the superseded admin-login TypeScript error, not by the worker. The active cron deployment is healthy and was observed on 19 September 2026 firing every five minutes and receiving HTTP 200 with `status:"disabled"`, which is the intended staging posture.
- No separate cron deployment is required merely to repair that historical failure.

## Additional implementation completed on 19 September 2026

- Donation checkout remount regression fixed with Next Script `onReady` plus an already-loaded `window.Razorpay` fallback; browser acceptance now reproduces unmount/remount behavior so the form cannot remain stuck on “Preparing secure checkout…” after revisiting the page.
- Explicit `payment.failed` webhook state-guard tests added; failed payments cannot increase appeal accounting.
- Transactional-email operations gained a controlled self-recipient acceptance action for authorised staff only, duplicate-active-acceptance protection, audit logging and Resend provider-message-id persistence/visibility.
- Production environment contract now fails closed on staging/Live Razorpay mix-ups, wrong production canonical origin, shared assistance/public-media buckets, insecure public-media origin and launch-only acceptance flags.
- Version health now exposes only non-secret deployment posture (`environment` and Razorpay `paymentMode`); staging/rollback acceptance requires `staging + test`.
- Assistance browser acceptance now covers a synthetic private PDF in the multipart submission. Route tests lock private-document persistence and compensation cleanup when the later database write fails.
- Additive migration `20260919142000_notification_provider_message_id` stores the external email provider message id for delivery reconciliation. It has not been applied to staging/production yet.
- These new quiet-branch changes still require consolidated lint/typecheck/unit/build/browser validation before integration.

## Remaining genuine launch gates
- `rollback-rehearsal` — real staging rollback to a previous known-good deployment and restoration still required.
- `transactional-email-delivery` — controlled live production sender acceptance required.
- `manual-rendered-accessibility-review` — final human rendered review required.
- `final-editorial-seo-social-review` — final human copy/social preview review required.
- `public-media-human-review` — individual media privacy/consent/provenance review required.
- Razorpay account/KYC and website approval are VERIFIED. Provider-backed Test Mode capture, webhook delivery, acknowledgement/accounting and a full refund with `refund.processed` reconciliation are verified. Separate Live API credentials and a separate Live webhook now exist and remain outside staging. Remaining payment gates are provider-backed `payment.failed` evidence (or documented Test Checkout limitation), production-only Live credential installation, controlled real donation acceptance and production receipt/email/refund operations.
- explicit production indexing decision.
- explicit `main` promotion/production approval.

## Recovery anchors
- Database recovery snapshot evidence is recorded in `docs/DATABASE_RECOVERY_DRILL_2026-09-18.md`.
- Preserved Neon branch: `pre-recovery-original-2026-09-18`.
- Pinned rollback baseline branch: `rehearsal/rollback-baseline-2026-09-18` at healthy SHA `4f7cbafb87e8c7d75fd7191d7bcc7a83c9320a3d`.

## Locked facts
- Newborn medical aid: **₹107,520**.
- Winter Drive 2025–26: **234 Winter Kits distributed to 234 beneficiaries**.
- Aliza critical-care appeal: **₹482,700**.
- Taleem Nazira + Hifdh: **25 students combined as of September 2026**.
- Amaana is **not FCRA-registered**; fundraising remains domestic-only.
- 12A/12AB and known 80G status are **provisional** and must be described that way.


## 21 September 2026 implementation checkpoint — carousels, donor intent and guided assistance

### Scroll reduction and curated-media architecture
- Shared manual/swipe/keyboard `ScrollCarousel` now powers programme galleries, long programme-year histories, Homepage field work/programme discovery, Impact witness media and supporting Story media.
- The Homepage full-width curated banner is structurally complete and intentionally activates only once at least three approved featured identity images are available; it supports up to five curated slides and never autoplays.
- Story metadata, Story heroes and Story discovery cards now use the explicit identity-image contract instead of first-file heuristics.
- Mobile Home proof metrics and Impact metrics become horizontal snap strips instead of long stacked blocks.
- Curated image insertion remains data/media work. Do not redesign these surfaces when the selected photographs arrive.

### Donation intent
- Added a donor `givingIntent` record with values `GENERAL`, `SADAQAH` and `ZAKAT`.
- Donor giving intention remains separate from appeal designation and separate from the internal beneficiary Zakat-eligibility review.
- Zakat is offered only when the appeal's private verification record is explicitly `ELIGIBLE`; the order API re-checks this server-side and rejects forged Zakat intent otherwise.
- Giving intent is persisted on the Donation, included in Razorpay order notes, private acknowledgement, donor acknowledgement email payload and admin donation/reconciliation views.
- Additive migration: `20260921103000_donation_giving_intent`.
- The same additive enum/column/index were applied to the staging Neon branch before code rollout; existing records default to `GENERAL`.
- The complete donation-intent stack built successfully on Railway at `430329957477bf513b79577bbeae47f6602d3b3c`.

### Mobile appeal conversion
- Open verified appeal pages now have a mobile-only persistent “Support this appeal” action.
- It is deliberately absent on closed appeals and is not globally injected across Stories/programmes.
- Safe-area spacing prevents the bar from obscuring content and shifts Back-to-top/Companion overlays upward on affected pages.
- Isolated browser acceptance fixture and regression spec cover open/closed state, horizontal containment and floating-control overlap.

### Request Assistance
- The request form is now a genuine four-step guided flow: Contact → Need → Supporting Evidence → Confirm.
- Current-step validation prevents invalid forward progression.
- Input/file state is preserved between steps; the final request remains one secure multipart submission.
- Server validation errors reopen the exact step containing the rejected field and focus that control.
- Browser regression coverage follows the real progressive flow and preserves the private PDF upload test.
- Production compile/TypeScript succeeded and Railway deployment `32b31a06-8577-49d6-b283-e9c3183940ca` reached SUCCESS.

### Performance / regression guards
- Dynamic Homepage data loading is narrowed to dedicated appeal + discovery projections instead of loading unused story/faith/archive data.
- Public media retains intrinsic layout reservation.
- Browser performance coverage records CLS for Home, About, Our Work, Donate and Request Assistance with a <= 0.10 launch budget.
- Hosted GitHub browser workflow execution is not currently being reported for the newest test-only commits. Do not describe those Playwright specs as executed until a runner result is available.

### Current validation note
- Story curated-media deployment `cef325f99e55548596a4e452e549e0c4804b675d` reached SUCCESS before being superseded.
- Guided Assistance deployment `22e252dedd7cc988c9da96f4e72384ef6ecf6e61` reached SUCCESS.
- Latest mobile metric-strip head `71ea4b429e9cfaa6b1fcb3369b453d7cdb64cfef` is in Railway deployment validation at the time of this checkpoint.

## Codex continuation — 2026-09-23

- Ownership: CODEX_ACTIVE (explicit user handover).
- Task branch: fix/webhook-retry-scope; integration: phase-public-site-rebuild.
- Verified baseline HEAD: e76744a28e3da94ce239e45af96f01510fc5524e; no open integration PRs.
- PRE_EXISTING failure: CI run 35772257463/job 106897043629 and staging deployment b85e2a7a-c63f-4ae6-a404-489e3148bf9e fail TypeScript at razorpay/route.ts:254 (payload outside try scope).
- Immediate task: restore retry-handler compilation with event-type collision regression coverage; then durable refund-entity idempotency and private credential lifecycle.
- Main, production controls, live payments/refunds, private media publication remain protected. Impact redesign on hold.

## Codex phase A — 2026-09-23

Ownership CODEX_ACTIVE. Branch fix/refund-entity-idempotency. Recovery PR #102 merged at 30f157521776a1fadf70d326d1cff44d88e69e1f after PR CI passed. Implement additive refund identity ledger with legacy backfill, atomic accounting and real PostgreSQL concurrency tests. Integration build/deploy certification pending. No production actions.

## 24 September 2026 — final launch/cutover certification checkpoint

### Certified application candidate
- Application SHA: `bce6b1d85bedc9da6e0fb38484e867db71cb4182`.
- GitHub Actions run `36012879631`: **SUCCESS** on the exact candidate.
- The run passed the full integration gate, including lint, TypeScript, isolated PostgreSQL refund-ledger verification, coverage, production build, bundle budgets, post-build smoke checks, isolated browser fixture/workspace, Chromium installation, and responsive/accessibility/journey Playwright acceptance.
- Railway staging deployment `d0e7608a-df34-425b-9d30-79d1434b1064`: **SUCCESS** on the same exact application SHA.
- Railway's strict `/api/health/ready` check passed only after the database became reachable; the system correctly remained fail-closed during the prolonged Neon P1001/P1002 incident.
- Real startup recovery evidence from that deployment:
  - reviewed-campaign import recovered after transient database failures;
  - RBAC seed recovered after a transient database failure;
  - staging-acceptance seed recovered after transient database failures;
  - Next.js reached Ready;
  - Railway promoted the candidate only after DB-backed readiness returned healthy.

### Canonical routing/discovery closure
- Legacy `/our-work/*` aliases are centralized and deterministic.
- Legacy `/programmes/*` compatibility routes are also deterministic and no longer depend on database availability before redirecting.
- The static shadow route `/our-work/medical-financial-assistance` now redirects deterministically to the canonical medical/financial programme category.
- Sitemap/public discovery excludes legacy aliases and preserves published/canonical routes.
- Programme-category JSON-LD and canonical metadata are covered by regression tests.
- Homepage/Story/Faith related work links use canonical destination helpers.

### Launch-readiness register
- Rehearsal: **5/6** required gates resolved.
- Production: **9/19** required gates resolved.
- The only unresolved rehearsal gate is `rollback-rehearsal`.
- Rollback rehearsal remains pending because the connected Railway action surface exposes redeploy-latest but not deployment of an arbitrary historical deployment/snapshot. Do not fake this gate through Git rewrites.
- Current candidate and previous known-good deployment identities are recorded in `docs/launch-readiness.json`.

### Remaining production gates
The following remain intentionally PENDING until actual evidence exists:
- approved background artwork human rendered QA;
- transactional live email delivery acceptance;
- final human rendered accessibility review;
- final editorial/SEO/social-preview review;
- public-media privacy/consent/provenance review;
- controlled Live donation acceptance;
- refund/receipt operational production acceptance;
- real staging rollback rehearsal;
- explicit production indexing decision;
- explicit `main` promotion and production authorization.

### Protected actions
- Do not merge/promote to `main` without explicit user approval.
- Do not enable production indexing without the explicit production indexing decision.
- Do not install/use Live Razorpay credentials on staging.
- Do not initiate a real donation/refund merely to make a readiness gate green.
- Do not mark human privacy/accessibility/editorial gates VERIFIED from automated evidence alone.
- Impact-page visual redesign remains deferred until the owner supplies the separate redesign prompt.


## 28 September 2026 — approved background integration

User explicitly requested integration of all six revision-4 SVGs after design review. Codex owns this scoped implementation on `feat/approved-svg-backgrounds`, based on verified integration HEAD `6bb0666c45aa274e5e44a0a7d0339198802164e5`. Only open PR is draft production promotion #104; do not merge it. Replace approved assets byte-for-byte, refresh hash lock, adapt responsive placement and verify readability without changing content or footer height. Baseline push CI 36341349733 fails browser acceptance (classification in progress); PR checks pass. Production remains protected.


## 2026-09-28 — Approved vector background integration
- Current task PR: #105, `feat/approved-svg-backgrounds`, based on `6bb0666c45aa274e5e44a0a7d0339198802164e5`.
- All six revision-4 assets copied byte-for-byte; SHA-256 guard and XML/native-vector checks pass locally (51,146 bytes combined).
- Shared responsive token paths retained. Light body whitening gradients removed; dark-section contrast layers retained. Homepage carousel frame now consumes the header token. Footer height is still content-driven.
- PR CI and staging/browser verification pending at this checkpoint. Do not infer production approval.
- Pre-existing integration CI 36341349733 fails typography-hierarchy at 1440/390 (Arial vs serif expectation); unrelated to this asset change and not suppressed.
