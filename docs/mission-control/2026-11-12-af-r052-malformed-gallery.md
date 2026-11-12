# AF-R052 — Fail closed for malformed runtime gallery item types

Date: 12 November 2026 IST. Scope: public-gallery robustness and a small source-validation sub-scope, **not** a blanket public-photo privacy approval.

## RED

The existing `normalizeSafePublicMediaUrl()` accepts TypeScript-declared `string | null | undefined` but calls `value?.trim()`. A malformed runtime number (`42`) throws `TypeError`; a forged object with a callable `trim()` can return a URL and execute arbitrary object methods. `CampaignMediaGallery` also uses `item.alt?.trim()` on runtime data and allows empty/non-string IDs; a malformed entry can crash rendering or produce unstable selection. This is a real JS boundary even when compile-time TypeScript callers are correct.

RED commit adds synthetic Vitest tests for bad runtime URL types, side-effecting forged trim, invalid gallery alt and IDs, and preservation of a valid reviewed entry; neither touches real donor or media records. Existing code fails these tests.

## GREEN

`src/lib/public-media.ts`: check `typeof value === "string"` before `trim()`. `src/components/campaign-media-gallery.tsx`: reject missing/non-string/blank IDs and non-string/blank alt before accessing URL properties, preserving existing reviewed HTTPS/CSP/private-route/optimized image gates and valid entries. No new dependency, whitelisting or publication bypass. Existing legitimate string URLs keep the same normalized output.

## Verification and release

Run RED sensitivity/targeted GREEN, full fast/typecheck/lint, database, browser route and production/security builds, separate ready-state, independent review and SHA-guarded merge; tests under `src/**` trigger Railway website deployment. After release, verify deployed SHA/readiness, public gallery behaviour and that the existing URL/private-route safeguards still reject unsafe URLs. The privacy requirement for face-redacted metadata-stripped public derivatives **remains unresolved in issue #785** and is not addressed here. AF-R052 stays Partial until remaining raw images/route acceptance. No financial, schema, auth, media activation, cron or infrastructure mutation.
