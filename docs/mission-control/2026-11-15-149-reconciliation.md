# Amaana — 149-item source and live evidence reconciliation (15 November 2026 IST)

**Authoritative item register for this checkpoint:** [149-item-status-2026-11-15.csv](./149-item-status-2026-11-15.csv).
This preserves **all 149 original IDs, historical labels, prior 12 November evidence and row-specific next steps**. It does not create an extra backlog ID or substitute a broad architectural claim for verified acceptance.

## Current classification vs 12 November

| State | 12 Nov | 15 Nov | Change |
| --- | ---: | ---: | ---: |
| Completed | 12 | **16** | +4 |
| Implemented (not fully accepted) | 48 | **42** | -6 |
| Partial | 63 | **65** | +2 |
| Not started | 24 | **24** | 0 |
| Superseded | 1 | **1** | 0 |
| Not applicable | 1 | **1** | 0 |
| **All original IDs** | **149** | **149** | 0 |

### Promoted after matching current source, tests and public release

- **AF-R006 → Completed (exact credential-pair defect):** `src/lib/storage.ts` throws when precisely one of `MEDIA_S3_ACCESS_KEY_ID` / `MEDIA_S3_SECRET_ACCESS_KEY` is configured. `src/lib/storage-readiness.test.ts` exercises both incomplete directions. Current production Railway reports both variable **names** without exposing secret values; this does not certify credential validity, content publication or all S3 operations.
- **AF-R008 → Completed (reviewed breadcrumb/appeal JSON-LD input boundaries):** both `breadcrumb-structured-data.tsx` and `appeal-structured-data.tsx` use strict Zod `safeParse`; `structured-data-runtime-boundary.test.tsx` rejects null, wrong types, invalid slug and surplus private fields. PR #788 merged at `6e5dbf1bbdb353ecbac88c71d91df833d94d0b2c`; subsequent full exact-head CI (#938, run `43637455449`) passed. Fresh live structured-data and breadcrumb scripts parse. No blanket claim that all future JSON-LD publishers are validated.
- **AF-R073 → Completed (original missing structured-data types):** independently parsed live `/` and `/how-we-verify` schema shows Organization+NGO, WebSite, `alternateName` and `sameAs` social profiles. Live published `/appeals/help-mr-khaja-continue-his-oral-cancer-treatment-mw6iyd6h` emits WebPage + conditional DonateAction with a same-site canonical `/donate/...` target. Schema presence is not Google's rich-results certification (AF-R080 remains open).
- **AF-R075 → Completed (missing public llms index):** `public/llms.txt` exists; `src/lib/public-llms-index.test.ts` checks canonical real links and absence of private/admin/token destinations. Independent live URL `https://amaanafoundation.org/llms.txt` returns the public index. Ongoing link freshness is routine maintenance.

### Corrected overstatements; not falsely promoted

- **AF-R043 → Partial:** `src/app/page.tsx` still explicitly uses `force-dynamic`, for a defensible reason: expired and revoked appeals must not persist in static HTML. An actual TTFB/memoization optimization needs an eligibility-safe freshness contract and measurements; source presence is not completion.
- **AF-R072 → Partial:** independent live homepage `meta[name=description]` is **165 characters**, while `og:description` is **119**. The original excessive-length concern remains open. Proposed shortening needs approved editorial copy and canonical/OG checks, not speculative rewriting.

### Checked but not promoted

- **AF-R045:** the source uses one reviewed batch of appeal-cover URLs (`getAppealCoverMediaBatch`), and `home-carousel-data.test.ts` tests one call. The original SQL N+1 acceptance still requires 0/1/N query-count measurements against isolated PostgreSQL. Remains Implemented.
- **AF-R016:** source `next.config.ts` limits image CSP to self/blob/data and validated configured HTTPS origins; independent **live HTTP CSP-header/provider parity** still needed. Remains Implemented.
- **AF-FAQ:** the real live `/how-we-verify` page contains five matching FAQ responses and parseable `FAQPage` JSON-LD. The pending-versus-provisional 80G acceptance discrepancy is unresolved; do not certify all factual FAQ statements until professional review. Remains Implemented.

## Item-by-item reconciliation accuracy and limits

- Unique original IDs counted: **149**; historical classification preserved alongside current.
- The October technical audit mapped explicit candidate code/test locations and remaining checks for **146** rows. AF-N10 (historic Completed), AF-ZAKAT-LOCK (Superseded) and AF-CRYPTO (Not applicable) retain their special dispositions.
- **Nine** previously unclosed scopes received targeted source and/or live rechecks in this execution (four promotions, two downgraded claims, three additional inspected).
- **128** otherwise-open rows are explicitly labelled `CARRIED_NOT_RECHECKED_IN_THIS_SESSION`, not silently called fixed. Previously closed items retain their earlier verified record. A source path in the October audit is a **candidate** and not proof the same file still exists or the feature is live.
- Live site currently independently verified **website runtime** `b2166d9a0a35f67a8e930cbc7f33f431172bf8f6`, `main`, `production`, readiness `ready`. Source main at audit start `e4076e9b8a9985b6a8fb937ef08891535234c5d1` differs due the later E2E-only PR #939. Source/run matching is not inferred from copied documentation.
- This register is a **measured advance**, **not** a claim that all 149 rows have now passed fresh source, security, browser and live validation. Each remaining row retains a concrete acceptance check in the CSV. No field CWV, live financial transfer, tax ruling, unreleased private media or production infrastructure change is certified by this work.

## Work queue without duplication

**Next high-evidence closure checks:** AF-R016 live CSP/header/provider compatibility; AF-R045 isolated 0/1/N PostgreSQL query-count proof; AF-N01 gallery-import same-batch idempotency (isolated DB); AF-N02 bulk-category `updatedAt` parity (isolated DB); AF-R027 through AF-R034 accessible form/focus/link contract in browser; AF-R050 mobile scroll handoff; AF-R055 actual image caching delivery; AF-FAQ owner/CA factual acceptance. Preserve separate gates for AF-R043/AF-R072. External/provider-dependent AF-R013, AF-R015, AF-R018, AF-R080, AF-TAX, AF-LOCALES, and production #446 must not be marked Completed from source evidence alone.

Ongoing bounded implementation candidates #940/#941/#942 do not change these item totals absent exact original-scope acceptance. Finance-sensitive #684/#845 remain held. No branch deletions or deployment forcing performed for this reconciliation.
