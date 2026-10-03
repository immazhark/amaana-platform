# Owner-selected gallery integration — 30 September 2026

## Scope and current state

Base: `9d299b19d3f76c3e25f91010b0d5a956ca245edb` on `phase-public-site-rebuild`.
Task branch: `content/curated-gallery-20260930`.

User instructed “Start Integration” following 22 general-gallery batches. All 154 selected attachments were located, fully decoded, mapped to canonical initiative slugs, copied into a private local package and SHA-256 verified against the originals. Total source size: 146,977,259 bytes. One exact duplicate pair is retained in the supplied order. No images were re-encoded, blurred, cropped, substituted or removed.

This is **prepared local integration, not deployed/public gallery completion**. No database records, storage objects, live pages, remote branches, production settings or release gates were changed. Source photographs and the detailed manifest remain outside Git in `.curated-media/`.

## Mappings

| Canonical initiative | Attachments |
| --- | ---: |
| aliza-critical-care-support | 2 |
| auto-rickshaw-livelihood-support | 3 |
| dates-distribution-2023 | 9 |
| dates-distribution-2024 | 4 |
| dates-distribution-2025 | 4 |
| dates-distribution-2026 | 9 |
| eid-gift-kits-2020 | 7 |
| eid-gift-kits-2021 | 7 |
| eid-gift-kits-2022 | 11 |
| eid-gift-kits-2023 | 9 |
| eid-gift-kits-2024 | 8 |
| eid-gift-kits-2025 | 8 |
| eid-gift-kits-2026 | 9 |
| emergency-neonatal-medical-aid | 1 |
| hyderabad-flood-relief-2020 | 13 |
| jewellery-loan-intervention | 4 |
| oral-cancer-surgery-support | 1 |
| qurbani-meat-distribution-2025 | 13 |
| qurbani-meat-distribution-2026 | 10 |
| severe-burn-treatment-support | 1 |
| taleem-initiative-2025 | 8 |
| winter-relief | 13 |

The seven intake slugs `eid-kits-YYYY` map explicitly to existing `eid-gift-kits-YYYY` records. Filenames are not used to infer the initiative year. Unknown years remain null, not guessed from WhatsApp timestamps.

## Implementation

- `scripts/prepare-curated-gallery.mjs`: consumes only `batch-*-general-01.json` selections in the provided intake directory. Preserves filenames/extensions and byte content; records display-oriented dimensions including EXIF rotation, SHA-256, explicit order and provenance. Refuses to overwrite a different existing copy.
- `scripts/import-curated-gallery.mjs`: defaults to a no-write dry run. `--apply` requires designated staging context, dedicated private media storage and confirmation that anonymous object access is disabled. Uses conditional object creation, deterministic managed-proxy keys and hash checks on retries.
- `prisma/curated-gallery-import.mjs`: validates complete input and all target initiatives, creates unpublished gallery-only records transactionally, and leaves existing records unchanged on rerun. It cannot approve privacy/consent or assign identity media.
- Identity selection now requires the explicit reserved identity order. Previously, an unassigned hero could silently consume the first supporting photograph and remove it from the gallery.
- Thumbnail image height is now automatic within the existing uniform 4:3 frame. Existing full-image contain mode and lightbox are preserved.

## Local operator commands

```text
node scripts/prepare-curated-gallery.mjs ../intake
node scripts/import-curated-gallery.mjs
node --test scripts/test-curated-gallery.mjs
```

The private package is `.curated-media/originals/`; manifest and verification report are alongside it. Do not move originals into `public/`, commit them, or populate the old `integration-media.json` auto-publication path.

## Before applying and publishing

1. Owner website-publication approval is now received explicitly on 30 September: "Yes all images are okay to go ahead publish, start the integration immediately and publish them". Record it as owner attestation, not an independent consent-document audit. Preserve existing blur; hero use remains separate.
2. Review per-image alt text. User-provided cash/cheque handover context and Aliza's father's message are retained; generic descriptions elsewhere are draft text, not completed editorial acceptance.
3. Review graphic slaughter/butchery imagery in the Qurbani selections for appropriate public presentation, without altering source images.
4. Verify designated staging database/storage configuration and private bucket access. Run the dry run again, then `node scripts/import-curated-gallery.mjs --apply` in that verified environment.
5. If upload stops before the DB transaction completes, private objects may remain. Retry the same package; conditional writes verify them rather than overwrite/delete. Do not delete unrelated storage.
6. Complete existing admin publication review. Identity/hero eligibility remains false; banner and thumbnail selections are still coming separately.
7. Run actual desktop/mobile gallery and lightbox acceptance with real served images before staging integration. No rendered acceptance or production build is claimed by the local preparation checks.

## Checks completed

- 154 complete image decodes and original/copy SHA-256 comparisons passed.
- Canonical mapping: 22/22 initiatives; explicit per-initiative order validated.
- Full-package import dry run passed with no external writes.
- Draft importer: 5 tests passed (draft state, idempotency, unknown target, invalid publication/hero/path/dimension input, conflicting records).
- Public-media selector: 8 tests passed, including gallery-only no-hero regression.

Targeted ESLint, application TypeScript (`tsc --noEmit`) and `git diff --check` passed. Full production build and rendered verification are not certified here. Existing local screenshot-remediation changes remain excluded. Draft production PR #104 and payment PR #109, plus stale CSS PR #110, are untouched.

## Authenticated publication access

Verified staging service `fcb9d167-eba1-40c8-a4e6-ac35af470989` in Railway project `ab5c2eb7-9386-49dc-8b8c-62b355b8682d`, environment `38aede68-35aa-42de-adbc-49802e6d44e4`. The environment is named production in Railway, but this is the staging/preview application service. All dedicated media storage variable names exist. The OAuth connector returns `valuesRedacted: true`, so it cannot supply credentials for the local importer. No local DATABASE_URL/S3 environment variables or task `.env` are configured. No Railway CLI is available.

Both available browser/desktop execution runtimes fail during initialization with Windows error 3 (kernel asset path missing). BrowserAct and uv are absent; installation was not attempted. Next operator action: restore authenticated browser execution, or provide the staging-only DB/public-media storage environment to the local importer securely (not in chat). Then continue alt-text review, private-object access verification, draft import, audited publication and served-image acceptance. No upload or database mutation has occurred.
