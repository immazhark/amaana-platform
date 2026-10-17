# Amaana — Development Checkpoint (15 October 2026)

Repository: `immazhark/amaana-platform`  
Branch: `fix/direct-transfer-feedback-20261013`  
PR: [#292](https://github.com/immazhark/amaana-platform/pull/292)  
Source head at checkpoint: `491ed6eb9139a54e9d146dc9b20bccb2181643ed`

## 2026-10-15 — B09 dormant private PDF authorization and output-contract batch

**Source head:** `491ed6eb9139a54e9d146dc9b20bccb2181643ed` on existing [PR #292](https://github.com/immazhark/amaana-platform/pull/292), `fix/direct-transfer-feedback-20261013`. No PR merge or release.

Implemented in a grouped code batch:
- `src/app/api/donations/receipt-download/authorize/route.ts`: separately scoped, exact-flag (`AMAANA_RECEIPT_PDF_ENABLED=true`) and server encryption-key gated **POST-only** preflight for five-minute encrypted download grants. Feature flag is **false by default** in `.env.example` and key remains unset. Disabled requests return 404 without accessing the request body, private records or rate-limit database. Enabled requests must pass same-origin verification, exact JSON schema/size constraints, the existing receipt-specific attempt limiter and the server-only settled-receipt projection; generic 404/403/413/429 and no-store/private/no-referrer/noindex/nosniff responses. Grants are returned in POST JSON bodies, not appended to URLs, but no frontend invokes the endpoint.
- `src/lib/private-receipt-pdf-response.ts`: server-only bounded **output-response contract**, not a PDF generator. A verified captured/refunded record with a receipt number is required before packaging bytes. The helper checks a supported PDF header, terminal EOF marker, maximum 2MiB output and safe reference-derived filename. It emits `application/pdf` with attachment-only disposition, no-store/private, no-referrer, noindex, nosniff and sandbox CSP. A copy of the byte input is made. Matching negative/type/transport tests were authored.
- Fixed a real source-level off-by-one in the PDF version line detector (inspection now includes newline/CRLF) and a missing-key case in the encrypted-grant opener (returns null rather than throwing for valid ciphertext when the decryption key is absent). New negative tests were added for missing/malformed keys and pending/failed/unreceipted output.
- **No native PDF bytes are generated yet.** No renderer/package/font assets were added. Production lacks a trusted licensed Unicode-capable server PDF renderer supporting Arabic/Telugu and selectable accessible text; npm registry and GitHub DNS were unavailable from the local shell. No PDF redemption HTTP route or donor-account recovery/reissue action was opened.

**Validation:** GitHub publication/readback/structural checks pass; 11 isolated Node cryptographic assertions (on an earlier local mirror) and 5 standalone response-boundary smoke assertions pass. These are *not* actual branch Vitest or compiled Next tests. Current branch TypeScript/ESLint, Vitest test files, browser/AT journeys, production build, font/Unicode, deployed security headers, native Postgres and financial/provider tests remain **unrun/unverified** in this chat session. No falsely attributed current-head green status.

**Register:** 149 items unchanged: 57 Implemented, 48 Partial, 42 Not started, 1 Superseded, 1 Not applicable; original 95 aliases unchanged. AF-RECEIPTS/B09 stays **Partial**. Controlled migration, real PDF renderer, positive/negative route verification, approved donor proof and secure reissue, release merge and production behavior remain gated. No environment toggles, secrets, provider/payment/refund, live DB records, email or Railway deployment changed.

**Next executable:** reconcile a reviewed Unicode-capable PDF library/fonts (license, size, Railway runtime, language shaping, accessibility), implement a private **POST** redemption handler using `redeemVerifiedReceiptDownloadGrant` and `privateReceiptPdfResponse`, then run real generated-file render/inspect/AT/browser and financial privacy regressions. Only then consider flag activation. Do not expose capability in query strings or mark browser Print-to-PDF as server PDF generation.



### 2026-10-15 additional hardening — exact-head `17cb249a1f4766510b38415d9dce2ddac9cff7ec`

A final grouped safety correction ensures the disabled PDF grant-authorize route bounds *actual streamed body bytes* and also aborts stalled requests after a five-second budget. Malformed JSON returns private 404, body oversize 413, slow body 408, and no limiter/private-record lookup occurs before successful body validation. Added focused negative cases in the actual route test. Existing five-minute grant decryption now returns a private null result when the independent key is missing or malformed; issuance still refuses to mint. The planned private PDF response additionally requires a verified settled acknowledgement object rather than accepting a caller-provided reference alone. Header-prefix inspection handles PDF LF/CRLF and output bytes are copied before response.

Source and test additions published on the same PR; no full exact-head `npm test`, TypeScript, production Next build, or rendered-browser verification has been executed in this session. No production feature, endpoint redemption, PDF generator, environment, payments, email or database mutation was activated. B09 remains Partial; master register counts unchanged.


## 2026-10-15 — B09 source-complete encrypted PDF journey, release still blocked

Current PR #292 HEAD at this checkpoint: `dce4ced655d889169455f6f0f93e4a45e810f64d`, on `fix/direct-transfer-feedback-20261013` (open/unmerged). The earlier code batches remain scoped to B09; no original 95-defect closure is inferred.

**Implemented source this continuation:**
- Actual native PDF/UA rendering through an optional offline, version-pinned WeasyPrint executable; Amaana-branded A4 typography with escaped donor text, Unicode Arabic/Telugu fallback, original designated purpose, exact INR paise and the explicit normal-acknowledgement/not-Form-10BE disclosure.
- `POST /api/donations/receipt-download/redeem`, performing exact flag/key/absolute renderer readiness check, origin/bounded-body/timeout/rate-limit enforcement, encrypted five-minute grant redemption, **fresh original-purpose/accounting/privacy validation**, bounded PDF rendering and a private attachment-only response. No grant or token in GET/URL. Revoked, expired or financially inconsistent claims cannot download.
- A lazy, separately guarded donor download control on the existing token-private acknowledgement page; hidden when disabled. It uses POST-only requests, validates the response content type and maximum size, creates a temporary Blob URL for the attachment, revokes it and provides retry-only download guidance without implying another payment.
- Consolidated feature-readiness policy shared by issuance, redemption and page visibility; a missing renderer cannot issue a dangling grant. Additional integration tests cover policy, actual mocked-API response, optional browser DOM download, default-hidden UI, HTML escaping/Unicode/accounting and an opt-in real PDF renderer.
- Privacy correction: temporary PDF/HTML cleanup failures **reject** the transaction, rather than silently leaving donor data in the scratch directory.
- **Original-purpose restriction:** public token-private historical acknowledgements retain their existing `legacy` or `review` presentation, but native downloadable PDF grants now require provenance `original` on both issue and redemption. Incomplete/mismatched designation history is not silently represented as an approved donor-purpose PDF. Historical donors can still use the existing private print acknowledgement while staff reconcile records.

**Executed local proof:** using synthetic donor names with Arabic and Telugu and hostile escaped HTML text, the TypeScript-backed WeasyPrint 68 engine returned a 25,847-byte tagged PDF/UA-1 output; one A4 page, extraction of both scripts, exact ₹100.30/₹0.10, and the disclaimer. PNG preview inspected for a balanced brand-aligned receipt layout. This demonstrates the *isolated local rendering engine*, not the full GitHub branch, deployed Alpine compatibility, conformance certification, production/browser acceptance or accessibility testing.

**Still open and deployment-blocking:** `npm test`, full `tsc`, changed-file/full lint, client bundle budgets, Playwright/AT, native PostgreSQL, genuine sandboxed Alpine WeasyPrint/Pango/Noto runtime provisioning and Railway memory/image-cost assessment were NOT run at this HEAD. The Railway Dockerfile stays Node-only; no fonts, binaries, secret keys or feature flags were provisioned. The PDF action remains disabled in production. Secure **donor-owned token reissuance and revocation** is still a separate unimplemented governance workflow; grant is replayable within five minutes. Do not enable or publish until verification and owner approval.

The canonical 149 register remains **57 Implemented / 48 Partial / 42 Not started / 1 Superseded / 1 Not applicable**; all original 95 aliases remain intact. AF-RECEIPTS/B09 remains Partial. No main merge, deploy, migration, provider transaction, refund, real donor query, email or live record mutation occurred.

**Next highest-value action:** execute exact-head source testing in a hydrated repository, perform a cost-aware, pinned Alpine runtime integration rehearsal without touching production, then address donor-owned reissuance and the adjacent AF-SETTLEMENT/B09 accounting work. Never substitute a successful local PDF demo for production safety approval.


## 2026-10-15 — CI-driven corrective batch + B09 manual transfer custody (source-only)

**Current PR #292 source checkpoint:** `f4308cc1dccdcd500172db059baa0fe9be80feb0` on `fix/direct-transfer-feedback-20261013`. Existing PR remains open/unmerged. This checkpoint is not proof of deployment or a green run at current HEAD.

1. A real Actions fast-lane failure on earlier `942ab218` (workflow 38626419463) identified a protected giving-fund preview route absent from the anonymous admin browser inventory. Added `/admin/giving-funds/not-a-real-id/preview` to the protected-path test in commit `9cb90060e56789fc79373420b103eb5b84e1d713`.
2. Follow-up Actions 38632465690 progressed beyond route inventory and reported three actual TypeScript errors: nullable MIME header first element in the PDF button, typed `HTMLAnchorElement.click` test mock, and child-process `NODE_ENV` requirement. Fixed together in `835257ae79689d10c3bab04a50f11f1d73416452`; re-validation of current HEAD is not yet established.
3. **Manual bank-transfer custody:** prior direct UPI/bank reconciliation accepted staff notes alone for a CAPTURED mutation. Source now requires an explicit **staff attestation** and typed bank-statement transaction reference equal to the claimed transfer, with a matching exact, safe INR-paise amount. The checks run inside the existing serializable transaction **before** changing captured status, raising appeal totals, queuing acknowledgement or recording a verification event. Successful reconciliation additionally records `bankStatementMatched`, normalized entry reference and matched amount in the audit event. Admin input fields have required client validation (Chromium `v`-mode-safe patterns), with a server-validated rejection workflow that does not falsely attest to a credit. Focused Vitest cases were authored for missing attestation, mismatch, invalid precision, scientific notation, positive exact amounts, normalized case, audit evidence and safe rejection. Source commits `6df46939df31913650fc54d2b2506520d196385b`, `a80900c134eca9a91cb061d7b10e4a1464b3f301`, `f4308cc1dccdcd500172db059baa0fe9be80feb0`.

**Scope caveat:** this is *staff-entered review*, not an authenticated bank API, automatically imported statement, independent bank evidence, second reviewer or automated matching. A dishonest reviewer can still falsely attest. Genuine bank entries that differ from the donor's reference require separate exception review and must never be silently captured. Bank-export format, full deduplication, PII-retention controls and separation of duties remain AF-SETTLEMENT scope.

**Evidence/operation:** GitHub Actions identified two concrete earlier failures with source fixes committed. Current-head TypeScript, Vitest, lint, build, browser, native DB and Railway runtime are **not claimed green**. No production transfer, Razorpay call, refund, email, migration, secret/flag, deployment or main merge was performed. PDF/UA remains disabled in the actual Railway runtime.

**149 canonical register unchanged:** 57 Implemented, 48 Partial, 42 Not started, 1 Superseded, 1 Not applicable. Original 95 aliases remain mapped; AF-SETTLEMENT/AF-RECEIPTS B09 stay Partial.

Next: inspect exact-head CI and fix real failures; pursue a reviewed read-only statement import/duplicate exception matcher only after approved bank-export format and evidence rules are known. Complete Railway Unicode PDF runtime verification and donor-owned token reissue separately.

### 2026-10-15 finance presentation precision — checkpoint `2cd6905fad93f61a102cc66323e0f94ec6902cd7`

The finance-admin donation list, gross/refund/net ledger totals and per-donation detail now use the already-tested `formatPrivateReceiptINR` **two-decimal, safe-paise formatter**. Previously they used `formatINR` (integer rounding), hiding fractional received/refunded balances from staff. Invalid monetary values in tabular legacy rows now display `Requires reconciliation` instead of rendering a rounded number or taking the full admin list down. Public goal/appeal formatting is unchanged. Patch `2cd6905fad93f61a102cc66323e0f94ec6902cd7`.

Latest GitHub CI was pending at the time of writing, so no claim is made that all Vitest, typecheck, lint, rendered browser, database or production runs passed. Authenticated money mutation and PDF activation remain unchanged. This precise display correction is source implemented on unmerged PR #292; the canonical 149 totals and historical 95 aliases remain unchanged.


### 2026-10-15 — B09 grouped settlement integrity, exceptions and accessible staff actions

Existing PR #292, `fix/direct-transfer-feedback-20261013`, source checkpoint `098489d1275a37b2e24b4bdbdf3d7c39881ba6b1`. Development was prioritized over CI polling or deployment.

- **Bank double-credit guard** (`65f05424`): within the existing Postgres SERIALIZABLE direct-transfer reconciliation transaction, a case-insensitive check for another already CAPTURED/REFUNDED direct UPI/bank record carrying the matching UTR blocks a second capture. Successful reviewer attestation still requires the exact INR-paise amount and reference; rejecting an unverified claim never requires false bank-credit evidence or creates a receipt. Negative unit tests cover duplicate credits, missing confirmation, mismatched reference/amount and no side effects.
- **Accounting invariant** (`65f05424`): a donation with status CAPTURED but refundedAmount equal to its entire amount now fails closed until its status is corrected to REFUNDED. Partial refunds within CAPTURED and valid full REFUNDED remain supported.
- **Purpose provenance and staff protection** (`1030deca`, `b67b60f`): finance dashboard/detail surface malformed destinations or donor-purpose snapshots as review-required instead of crashing or silently passing rewritten titles. Legacy appeal snapshots are explicitly labelled as not original. Dashboard no longer advertises that three clear operational counters certify overall payment health.
- **Operator experience** (`875477ba`, `b2dbd4fb`): accessible React 19 `useActionState` reconciliation form with in-place curated staff errors, disabled duplicate submits, required matching reference/amount/checkbox for VERIFY, REJECT bypass via `formNoValidate`, and preserved donation/admin/public cache invalidation only after successful server-side financial reconciliation. Existing server action tests were migrated and expanded, including authorization, duplicate UTR, generic private database errors and rejection behavior.
- **Pre-submit conflict visibility** (`098489d1`): a restricted staff-only donation detail view displays a linked warning if an already-settled direct transfer matches the pending claim's UTR case-insensitively. The transactional rejection remains authoritative; the warning is advisory.
- **Evidence:** 11 relevant files read back from GitHub and checked for key invariants. New and updated Vitest cases are authored, not actually executed in a hydrated repository in this turn. No claimed current-head green TypeScript, Vitest, browser, DB or production evidence; no CI polling loop. No bank API or independent statement evidence feed exists, so a dishonest operator can still attest falsely. Full bank-export verification, secondary review/segregation, expiry/reissue, and costed Unicode PDF runtime remain Partial.
- **No side effects:** no real bank payments, Razorpay operations, email deliveries, production DB writes/migrations, secrets, live feature activation, main merge or deployment. Original 95 aliases and 149 master register categories remain unchanged (57 Implemented / 48 Partial / 42 Not started / 1 Superseded / 1 Not applicable).

