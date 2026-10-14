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


