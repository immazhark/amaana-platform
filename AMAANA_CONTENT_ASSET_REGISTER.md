# Amaana Foundation — Content & Asset Register

This register tracks source material intended for public-site population during Phase 5. It is intentionally conservative: an item is not treated as public-ready merely because it exists. Every entry should ultimately have a source, campaign/year, factual status, privacy status, media status, discrepancy notes and intended placement.

## Status vocabulary

- **Verified factual source** — source supports the stated fact directly.
- **Public-safe candidate** — appears suitable for public use, subject to final privacy/quality review.
- **Private / do not publish raw** — source contains sensitive or unnecessary personal information.
- **Needs reconciliation** — conflicting or incomplete source data exists.
- **Needs media approval** — content is potentially useful but has not yet been cleared for public rendering.
- **Published architecture ready** — site already has a public-safe renderer/location ready for approved material.

## Governance and compliance

| Source | Type | Supported facts | Public status | Website use |
|---|---|---|---|---|
| `AMAANA_FOUNDATION(1).pdf` | DARPAN/NPO record | DARPAN ID `TS/2024/0403215`; DARPAN registration 21-05-2024; Trust; registration no. `BK-4, CS No 59/2024`; entity registration 23-02-2024; office bearers Mohammed Ather Khan, Mohammed Mazhar Khan, Syed Iqba Ali listed as Trustee | Verified factual source. Raw source includes address/contact details; do not publish raw. | `/governance`, `/compliance` summaries only |
| `80G Provisional cert.pdf` | Form 10AC | Amaana Foundation; provisional approval dated 26-01-2026; AY 2026-27 through AY 2028-29 | Verified factual source. Do not present as permanent/final 80G. | `/compliance`; concise public status copy |

## Origin story and Eid Gift Kits evidence

| Source | Type | Supported facts | Status / discrepancy | Intended placement |
|---|---|---|---|---|
| `Eid Gift Kits Drive - 2026 Initiation (Detailed).pdf/.docx` | campaign document | 2020 COVID/Ramadan origin; first response reached 85 families; annual continuation; historical table: 2020 85, 2021 171, 2022 339, 2023 408, 2024 467, 2025 650; historical donations/cost per kit | Verified for narrative/history. The document says formalisation decision in 2023; legal registration date is separately 23-02-2024, so public copy should distinguish decision/process from legal registration. | About, Eid flagship, Impact timeline |
| Same detailed Eid source | financial table | 2020 ₹68,000 / ₹797 / 85; 2021 ₹226,008.74 / ₹1,327 / 171; 2022 ₹484,770 / ₹1,430 / 339; 2023 ₹610,153.28 / ₹1,500 / 408; 2024 ₹700,500 / ₹1,500 / 467; 2025 ₹1,110,742.53 / ₹1,709 / 650 | Verified table source; 2026 finance not approved from this source. | Eid evidence ledger / Impact |
| `Eid kits distribution – Amaana Foundation 2026.png` | infographic/carousel composite | 2026 total 710; category graphic; kit/preparation imagery | **Needs reconciliation:** graphic shows Medical Hardship & Disability 17 while approved web evidence uses 18, with Widows adjusted to 55 so total remains 710. Do not use graphic category counts as canonical text without correction. | Media candidate only; factual text should come from validated site evidence |
| `Eid kit distribution by Amaana Foundation.png` | social carousel composite | 710 families; kit photography; preparation/packaging visuals | Public-safe candidate for branded campaign-history context; inspect each panel before use. Avoid treating decorative claims such as “Dignity Restored” as measured outcomes. | Eid flagship / Stories / media gallery candidate |
| `Eid care kits from AMAANA Foundation.png` | branded campaign graphic | kit contents imagery, Eid greeting cards, Amaana branding | Public-safe candidate subject to final media review. | Eid flagship secondary media |
| `Upholding trust this Eid season.png` and `(1)` | branded campaign graphic | kit contents, packaging and preparation visuals | Public-safe candidate subject to final media review. | Eid flagship / field journal |

## Qurbani / Meat Distribution

| Source | Type | Supported content | Status | Intended placement |
|---|---|---|---|---|
| `2026 Qurbani meat distribution drive.png` | image/post | campaign visual | Needs media approval; model-generated flag exists in Library metadata, so do **not** use as documentary evidence. | Exclude from authentic-photo slots |
| `Upholding trust through Qurbani service.png` | branded graphic with real embedded photos | sacrifice/preparation, weighing, packing, labelled distribution boxes | Candidate for campaign-context use after privacy/quality review. Graphic language such as hygiene/quality claims must be checked against source evidence before being repeated as factual site copy. | Qurbani initiative media candidate |
| `Upholding trust in food distribution.png` / `Upholding trust in meat distribution.png` | branded graphic with real embedded photos | weighing, gloved handling, packed trays, workers | Candidate after privacy/quality review. Do not infer independent certification or standards from marketing wording. | Qurbani initiative / story media candidate |

## Brand and contact material

| Source | Type | Supported content | Status | Intended placement |
|---|---|---|---|---|
| `Thank you for your trust and hope.png` | branded closing graphic | Amaana logo treatment; website; email; social handles; a phone number | Branding/reference candidate. Contact details must be independently confirmed as current before publication. | Brand reference; possible footer/social audit source |
| `Payment Info.pdf` / `Payment Info(1).pdf` | payment/QR material | historical payment merchant/QR details | **Private / operational; do not auto-publish.** Current payment UX uses Razorpay and must remain canonical unless deliberately changed. | Archive only |

## Faith content

| Source | Type | Supported content | Status | Intended placement |
|---|---|---|---|---|
| `Lessons of Ashura: Trust and Gratitude.png` | faith graphic | religious claims, fasting guidance and devotional content | **Needs independent religious verification before publication.** Existing Faith content architecture already requires VERIFIED religious review. | Faith archive candidate only after review |

## Media handling rules for Phase 5

1. Prefer original real photographs/video over designed social graphics when both exist.
2. A designed graphic may be used as historical campaign collateral, but not as a substitute for documentary photography where authentic originals are available.
3. Library items marked model-generated are excluded from documentary/beneficiary evidence slots.
4. Beneficiary identity, children, medical situations and documents require explicit privacy review before public use.
5. Do not reproduce marketing wording as factual outcome claims without source support.
6. Do not use old payment QR/contact details merely because they appear in historical graphics.
7. All public media must pass the existing `MediaAsset` privacy/publication gate.
8. Every discrepancy is resolved in text/data before visual publication; screenshots do not override canonical validated evidence.

## Phase 5 work queue

### Batch A — Eid Gift Kits
- Inventory original 2026 kit/preparation/distribution photos separately from carousel composites.
- Map approved images to: hero, preparation, kit contents, distribution/field record, closing gallery.
- Retain validated 710 total and approved category breakdown from code/evidence, not discrepant graphics.
- Attach source/year/caption/alt text/privacy status for every selected item.

### Batch B — Qurbani 2025/2026
- Separate original photography from designed posts.
- Reconcile “animals” vs “sheep” terminology against primary source before final copy.
- Map safe preparation/packing/delivery media to the initiative detail page.

### Batch C — Taleem, Winter, Dates, Flood/COVID, Medical/Financial
- Inventory each campaign independently.
- Establish exact count/status/source before adding to public metrics.
- Apply stricter privacy review for children and medical-assistance material.

### Batch D — brand/social/contact
- Confirm official logo asset and current social/contact handles.
- Replace any remaining text-only brand substitute only after actual logo source is verified.

## Current register boundary

This is the **initial** Phase 5 register, not a claim that every Amaana archive has been enumerated. Archive ZIP/file-by-file completion remains pending and must be recorded here as each source is actually inspected.
