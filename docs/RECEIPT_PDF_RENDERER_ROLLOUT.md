# Amaana Foundation — Private Receipt PDF/UA Runtime Gate

**Status:** source implemented but dormant. The current production Alpine container does **not** include a PDF engine. This document is not authorization to install packages, change secrets or enable a release.

## Source contract

- `POST /api/donations/receipt-download/authorize`: accepts existing `{reference,token}` in a bounded JSON body, checks same origin and hashed abuse budget, and returns a **five-minute encrypted grant** only for a verified settled donation carrying a normal acknowledgement number. Never include a token or grant in query strings, cookies, analytics or logs.
- `POST /api/donations/receipt-download/redeem`: checks exact private flag + key + configured absolute renderer path, origin, bounded body and limiter; decrypts the grant and **rechecks the live private donor record**, original designation, refunds and late confidentiality changes before rendering. Returns PDF attachment (not inline) with no-store/no-referrer/noindex/nosniff, or a generic error. The grant remains replayable during five minutes; this is NOT a one-use receipt or donor identity recovery.
- `src/lib/private-receipt-pdf-html.ts`: escaped self-contained document; no remote fonts, images, links or scripts. `src/lib/private-receipt-pdf-renderer.ts`: optional external WeasyPrint adapter, two concurrent renders per instance, 15-second deadline, private temporary storage and 2MiB cap. `src/lib/private-receipt-pdf-response.ts` validates attachment output.
- Section 80G provisional approval must not be overstated. The acknowledgement explicitly is NOT Form 10BE.

## Local evidence recorded 15 October 2026

A synthetic HTML receipt rendered using WeasyPrint **68.0** to a 25,847-byte PDF/UA document. `pdfinfo` confirmed **Tagged: yes**, one A4 page; `pdftotext` recovered Arabic, Telugu, exact ₹100.30 and ₹0.10 and the tax disclaimer. A visual image render was inspected for layout and text clipping. The local TS rendering adapter was executed. **This does not validate the Alpine production image or automated repository test suite.**

## Controlled deployment prerequisites

1. Pin and security-review a supported WeasyPrint version and native Pango/Cairo dependencies in the Railway **runtime** image; verify the executable absolute path and installation license. Confirm Arabic and Telugu Noto-family fonts with valid licenses and correct script shaping. Do not copy arbitrary workstation font binaries to the repository.
2. Measure additional compressed image size, baseline/runtime memory, cold-start and 2-parallel-render memory to protect the Railway budget. If cost exceeds the approved budget, keep disabled.
3. Run `npm run typecheck`, affected Vitest tests (`receipt-download-grant`, `verified-receipt-download`, `receipt-download/authorize`, `receipt-download/redeem`, `private-receipt-pdf-html`, `private-receipt-pdf-renderer`, `private-receipt-pdf-response`), `npm run lint`, exact-head production compile/build and browser/assistive-tool acceptance. With an actual test binary, run `AMAANA_PDF_TEST_RUNTIME=/absolute/path/to/weasyprint npm test -- src/lib/private-receipt-pdf-renderer.test.ts`.
4. In an isolated staging image, execute a synthetic full flow with Arabic/Telugu and malformed HTML donor fields. Verify PDF tag tree, extracted Unicode, screen-reader order, status/refund arithmetic, absence of network requests, no cached private responses, no leaking temp files and payment independence.
5. Independently approve the rollout decision, create a fresh dedicated 32-byte encryption key in the secrets manager and set `AMAANA_RECEIPT_PDF_RENDERER_BIN` only after runtime verification. **Finally** enable `AMAANA_RECEIPT_PDF_ENABLED=true` at a controlled release checkpoint.
6. Complete separately reviewed donor-owned credential reissue/revocation. Do not issue a new receipt token by reference or email address alone.

## Defaults

`AMAANA_RECEIPT_PDF_ENABLED=false`; `RECEIPT_DOWNLOAD_ENCRYPTION_KEY=""`; `AMAANA_RECEIPT_PDF_RENDERER_BIN=""`. No public download link is shown while disabled. Retain browser Print/Save-as-PDF as the functioning fallback.

## Source completion checkpoint

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

