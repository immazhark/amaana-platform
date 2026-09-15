# Amaana Platform — Current Source Reconciliation

**Date:** 2026-09-15  
**Status:** CURRENT OVERRIDE FOR STALE DURABLE NOTES

This note records user-confirmed/source-verified changes that supersede older statements still present in long-running execution/risk documents. Where an older document conflicts with this note, this note is the current source of truth until that older section is rewritten.

## 1. Official Amaana brand source

Earlier rebuild notes said master branding was blocked because `Branding & Logo.zip` could not be enumerated reliably.

That is no longer the current state.

The user supplied the official logo set directly, and the repository contains an official Illustrator-exported SVG at:

`public/brand/amaana-mark.svg`

The source artwork verifies:

- Amaana Blue: `#466FAA`
- Amaana Gold: `#E0B318`

Therefore:

- the core blue/gold values are source-verified, not provisional approximations;
- brand work is **not** blocked on ZIP extraction;
- this does **not** trigger a palette redesign — the user explicitly wants the current website colour direction preserved;
- deployed logo variant/URL and final structured-data/social-preview usage still require normal production verification.

See `AMAANA_BRAND_FOUNDATION.md` for the updated brand rule.

## 2. Programme/initiative media input status

The user has confirmed that **all currently available images and data/impact images for all Amaana drives and initiatives have been uploaded to Codex / the implementation workflow**.

Therefore, older notes that ask the user to supply additional Winter, Taleem, Hyderabad Flood Relief, Dates, Qurbani, Eid-year or medical-case media are stale.

This closes the **media collection/upload request** as a project-input task.

It does **not** automatically certify every asset for public publication. The following remain separate implementation/release checks:

- correct initiative/year/provenance mapping;
- beneficiary/child consent and privacy review;
- rejection/redaction of sensitive or conflicting graphics;
- target public-storage/provider configuration;
- deployed URL integrity;
- alt text/caption quality;
- final public-media selection and responsive rendering.

In other words: **input collection is complete; publication and deployment verification remain open.**

## 3. Governance spelling

Current canonical/public governance source is:

- Mohammed Mazhar Khan — Founder & Managing Trustee
- Mohammed Ather Khan — Trustee & Treasurer
- **Syed Uqba Ali — Trustee**

Any older durable log containing `Syed Iqba Ali` is stale and should be read as **Syed Uqba Ali**.

The live public source in `src/lib/organization-copy.ts` already uses the correct spelling.

## 4. Confirmed factual locks

The following newer user-confirmed facts supersede older programme source values:

- Newborn medical-aid case: **₹107,520**.
- Winter Drive 2025–26: **234 Winter Kits distributed to 234 beneficiaries**.
- Winter Phase 1: **96 madrasa students** — supporting sub-measure.
- Winter Phase 2: **101 Winter Kits** — supporting sub-measure.
- Phase figures must not be added to the overall 234 total.

The implementation source for these corrections is `prisma/canonical-factual-locks.json` and the precedence rule is documented in `docs/canonical-factual-locks-2026-09-15.md`.

## 5. What remains genuinely open

The following should continue to be treated as real release gates rather than stale asset-collection problems:

- Razorpay production/test-mode E2E and reconciliation/refund/duplicate-payment verification;
- Assistance request upload/tracking/reviewer/cleanup E2E;
- real-browser responsive visual QA;
- keyboard/screen-reader/zoom/accessibility verification;
- Core Web Vitals and production-like performance verification;
- final rendered SEO/crawl/structured-data verification;
- 12A/12AB and any other professional CA/legal confirmation;
- deployment/storage/provider checks;
- final user acceptance before merge/release to `main`.

## 6. Agent rule

Codex and ChatGPT must read this file together with:

- `AGENTS.md`
- `docs/AI_CONTINUITY_PROTOCOL.md`
- `docs/AI_ACTIVE_WORK.md`
- `docs/AI_HANDOFF_LEDGER.md`

before treating older rebuild/risk statements about brand-source availability, missing programme media, governance spelling, Winter totals or the newborn amount as current blockers.
