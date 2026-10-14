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
