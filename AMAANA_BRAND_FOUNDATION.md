# Amaana Foundation — Brand Foundation

Status: SOURCE ARTWORK AND CORE COLOURS VERIFIED — DEPLOYMENT INTEGRATION REVIEW OPEN
Branch: `phase-public-site-rebuild`

## Brand name

The public brand name is **Amaana Foundation**.

Do not abbreviate the primary public identity to “Amaana” in the logo/brand lockup unless the design context clearly calls for conversational shorthand. The formal public brand remains **Amaana Foundation**.

## Verified brand source

The user has supplied the official Amaana Foundation logo set. An official Illustrator-exported SVG is preserved in the repository at:

`public/brand/amaana-mark.svg`

Direct inspection of that source artwork verifies the two core brand fills:

- **Amaana Blue:** `#466FAA`
- **Amaana Gold:** `#E0B318`

These are no longer provisional approximations. Earlier project notes that treated the blue/gold values as awaiting ZIP extraction are superseded by the supplied source artwork now present in the repository.

The current website colour direction has already been through multiple iterations and the user has explicitly asked that it **not be disturbed merely because the source colours are now verified**. Source verification is therefore a consistency/control improvement, not permission for a new palette redesign.

## Logo variants and production use

The supplied logo family includes emblem/mark and fuller lockup treatments. Production use should preserve the exact supplied geometry, Arabic calligraphy, hand motif, “Upholding Trust” wording and Amaana Foundation wordmark where that variant is used.

Do not redraw, trace, AI-recreate, distort or silently alter the official logo and call it the master.

The repository currently contains the official mark SVG. Any additional supplied lockup/negative/transparent variants should be introduced only from the user's original supplied files and should be checked for the correct usage context before replacing an existing website treatment.

## Design rule

The website should unmistakably reflect the Amaana Foundation identity while allowing a sophisticated tonal system around the verified blue-and-gold anchors.

Nearby tonal variants remain appropriate for dark surfaces, hover states, accessibility, editorial backgrounds, photography overlays, data visualisation and restrained motion, provided they remain visually descended from the source identity.

Examples of permitted supporting treatment:
- deeper navy/ink derived from the Amaana blue for cinematic dark sections;
- softer/desaturated blue tints for backgrounds and secondary UI;
- warmer or quieter gold variants for large surfaces where the source gold would be visually too intense;
- warm ivory, parchment, sand, off-white and neutral ink as supporting editorial colours.

The goal is not to force blue and gold onto every component. The goal is for the complete visual system to feel recognisably descended from Amaana's actual identity.

## Guardrails

1. Do not replace the Amaana identity with generic NGO green.
2. Do not turn the interface into a blue-and-yellow corporate template.
3. Use exact supplied Amaana logo artwork rather than reconstructed artwork.
4. Do not crop, redraw, trace, AI-recreate or silently approximate a logo and call it the master.
5. Preserve accessibility/contrast even when using verified source colours; tonal variants are allowed where necessary.
6. Photography remains dominant; brand colour should frame and unify authentic Amaana media rather than overpower it.
7. Islamic identity should come through composition, values, typography, geometry, content and restraint—not colour clichés.
8. Structured-data/social-preview logo use is no longer blocked by colour-source uncertainty, but the exact deployed asset URL/variant must still be verified before production publication.

## Relationship to V2 concept

The **Living Amanah** direction remains unchanged.

Current visual language:

**Verified Amaana blue/gold anchors + deep derived ink/navy + warm editorial neutrals + authentic photography.**

This document supersedes earlier wording that described `#466FAA` and `#E0B318` as provisional working values pending archive extraction.


## Permanent design-system contract — 28 November 2026 IST

This file is the existing equivalent of DESIGN.md. It remains the brand/design authority; do not create a second competing palette or design-system document. Read the [permanent owner directive](docs/directives/MASTER-DESIGN-ENGINEERING-DIRECTIVE.md) and apply the [traceability matrix](docs/qa/DESIGN-IMPLEMENTATION.md).

Amaana-specific direction: dignified humanitarian editorial composition, authentic evidence, clear stewardship and restrained motion. “Trust, made visible” describes the trust objective; it does not replace the previously approved Living Amanah identity or supplied copy. Primary journeys are domestic giving, assistance, education enquiries and private operational review. Do not borrow the other projects' bakery/commerce/wedding direction.

| Foundation | Existing implementation authority | Rule |
|---|---|---|
| Semantic palette, spacing, shape, type, measure and motion tokens | src/app/globals.css | Consume existing --af-* tokens; preserve blue #466FAA, gold #E0B318, canvas #faf6ec and surface #fffdf8. These are source values, not contrast certification. |
| Fonts and app shell | src/app/layout.tsx | Preserve approved display/body faces, font loading and zoom. Display caps do not justify uppercase body text. |
| Brand expression and editorial layout | src/app/brand.css; src/app/brand-expression.css; src/app/v2.css | Extend coherent incumbent composition; no generic card-grid makeover. |
| Button/form semantics | src/components/appeal-search-form.tsx and its CSS module; donation components | Visible labels, native controls/GET where appropriate, explicit mobile keyboard intent, truthful errors and stable state. |
| Figures | donation-form.module.css; taleem-fees.module.css; fund-ledger/public-fund-ledger.module.css | Localized currency and tabular numbers where comparison benefits. Never change authoritative amounts for visual alignment. |
| Motion | globals.css tokens; src/components/site-motion.tsx | Existing fast/medium tokens are 160/250ms. Prefer CSS transform/opacity, interruption and reduced-motion fallbacks. No navigation delay or scroll hijack. |
| Imagery | src/lib/image-placeholder.ts; src/components/public-media.tsx | Existing bounded blurred WebP is the BlurHash-equivalent. Keep public eligibility/revocation gates and reviewed authentic derivatives; consent alone does not exempt redaction. |
| Mobile fixed controls | src/components/mobile-support-bar.module.css | Preserve safe-area offsets and 44–48px targets; verify sticky overlap, keyboard focus and actual devices before acceptance. |

Review the full interaction state set for each component: default, hover, focus, pressed/selected, disabled, loading, empty, error and success where applicable. Keep nested radii geometrically consistent; continuous corners are optional progressive enhancement. Do not add a library for native keyboard hints, balanced text or tabular numerals.

Required critique: primary user outcome, 320–430px reading/touch/keyboard use, 768/1024/1440px composition, typography rhythm, state clarity, factual dignity and performance cost. Compare before/after rendered states where available; record UNVERIFIED where the owner deferred runtime access. Internal 95/100 target is not a score to assign without evidence. A proven security, functional or significant accessibility failure blocks release regardless of aesthetics.
