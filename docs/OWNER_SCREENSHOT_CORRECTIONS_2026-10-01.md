# Owner screenshot corrections — 1 October 2026

All six annotated screenshots were inspected. This task continues the deployed carousel system on integration base f6980fd3.

| Screenshot | Observations | Implementation |
| --- | --- | --- |
| 125250 | Box behind nav hover; poor support hover; short hero; empty story visual; moving Highlights gradient | Remove obsolete nav hover fill, preserve white support ink for hover/focus, taller desktop/mobile hero, official logo fallback with contained artwork, animated text gradient with reduced-motion opt-out. |
| 130848 | Geometric pattern absent behind Eid record | Place the existing approved 104px lattice above the navy gradient instead of behind a nearly opaque overlay. |
| 131148 | Trust pattern absent; dark links unreadable; weak arrows | Shared Home dark surface, readable white/gold links, purpose-specific SVG icons and consistent forward controls. |
| 131811 | Footer lead oversized and narrow | Smaller heading and wider copy column, maintaining shared footer parity and mobile disclosures. |
| 132719 | Native chevrons against select edge; count and toggle misplaced | Inset SVG chevrons while retaining native selects; disclosure title flexes and metadata/control align to the row’s right edge. |
| 133458 | Long summaries; inconsistent metadata; clipped fallback words; weak metrics/icons | First-sentence teaser, bounded to 180 characters; consistent date/documented-initiative slot; official contained logo thumbnail; aligned neutral metric column and SVG forward control. |

## Validation contract

- Test the same shared Home evidence and portfolio components in database-independent fixtures at 1920, 1440, 1024, 768, 390 and 320px.
- Verify keyboard disclosures/native select behavior, header hover/focus, motion preference, no horizontal overflow and no hero-control/CTA overlap.
- Inspect desktop/mobile screenshots in addition to computed geometry; prevent logo artwork clipping.
- Run axe checks for the corrected dark Home and expanded portfolio surfaces.
- Keep the full existing CI gate, bundle limits and deployment verification.

Canonical values and full detail-page stories are preserved. No gallery image becomes a hero/identity substitute. Companion remains fixed bottom-right. Main/production promotion, indexing and live payments remain protected.
