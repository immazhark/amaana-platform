# Post-PR41 Launch Hardening Audit — 16 September 2026

Baseline integration commit: `1540c8dfa08c57e2fa6d986b9ff0b6c54680224b`  
Railway staging deployment: `129b1ee9-355c-4004-986a-bed821d769eb` — SUCCESS.

## Audit rule
This document separates verified source/deployment findings from browser-only visual assertions. A source review must not be presented as proof of pixel geometry, contrast, focus order, screen-reader output or Core Web Vitals.

## Item 1 — post-PR41 rendered / UX / UI acceptance

### Verified baseline already completed
The earlier responsive acceptance sweep covered 21 major public routes at 1440, 1024, 768, 430, 390 and 360px. It found no general document overflow or off-viewport common headings, paragraphs or form controls in the 126 route/viewport combinations checked at that checkpoint. The subsequent PR #41 changed several shared visual layers, so those rendered checks must be repeated before final certification.

### Source-level checks completed in this round
- Root layout has a skip link targeting `#main`, a single shared `<main id="main">`, site header/footer, companion and Back to Top control.
- Primary navigation exposes `aria-current` for active links and the mobile menu toggle uses `aria-expanded`, `aria-controls` and an explicit accessible label.
- Mobile navigation moves focus into the open menu and restores focus to the toggle on Escape.
- Shared input/select/textarea focus styling preserves `:focus-visible` rather than removing keyboard focus.
- Major v2 page hero titles have reduced-motion handling for the title sheen animation.
- Our Work responsive rows deliberately change grid structure at 900px, 760px and 520px; thumbnails become full-width at the narrow breakpoint.
- Impact horizontal scrolling is intentional and constrained to the metric rail rather than the whole document.
- Companion launchers and Back to Top are fixed bottom-right elements; their mobile offsets are coordinated in CSS. This requires real rendered overlap verification after PR #41 and is not certified by source inspection alone.

### Browser-only acceptance still required for Item 1
Repeat representative visual/interaction checks on:
- `/`
- `/our-work`
- `/impact`
- `/stories`
- `/faith-and-reflections`
- `/get-involved`
- `/appeals`
- representative programme detail including Qurbani
- `/request-assistance`
- `/request-assistance/status`
- `/donate`
- `/contact`
- governance/transparency/policy family

At minimum: 1440, 1024, 768, 430, 390 and 360px; keyboard-only navigation; 200% zoom; reduced motion; long-text/empty-state views; mobile menu open; companion panel open; Back to Top visible.

### First-round issue queue
- **P1 — performance architecture:** root layout currently imports 18 global stylesheet layers, including several historical refinement/iteration files. This is a maintainability and CSS-delivery risk and is the first concrete performance target after rendered acceptance.
- **P1 — durable browser regression coverage:** current package scripts provide lint, typecheck, build, Vitest and staging HTTP acceptance, but no Playwright/axe browser suite. Add browser E2E/accessibility coverage after the first rendered pass.
- **P1 — public media exposure audit:** files under `/public/media` are directly addressable. Only public-safe derivatives may remain there; genuinely restricted/private originals must stay in protected storage.
- **P1 — production donation readiness:** code paths exist, but live Razorpay/KYC, real controlled transaction, refund/receipt operations and Zakat/unrestricted-giving decisions remain external launch gates.
- **P2 — final editorial pass:** rendered public copy still needs a full grammar, terminology, capitalization, CTA and amount-format consistency sweep.
- **P2 — final social/SEO QA:** metadata architecture exists; final OG imagery, share preview and production-domain checks remain.

## Item 2 — performance remediation starting point
The root layout currently imports the following global CSS layers: `globals.css`, `v2.css`, `brand.css`, `media.css`, `appeal-card.css`, `error-experience.css`, `refinement.css`, `iteration-three.css`, `brand-lockup.css`, `brand-expression.css`, `loading-experience.css`, `world-class-polish.css`, `home-media-polish.css`, `experience-finish.css`, `islamic-backdrops.css`, `islamic-companion.css`, `accessibility.css`, and `iteration-four.css`.

The next implementation pass will measure selector overlap/dead rules and consolidate without redesigning the current approved public visual direction.
