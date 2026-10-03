# Amaana Foundation Platform — Major Development Milestones

This is a concise engineering/product history of material milestones. It intentionally does not record every commit or small styling change. The repository, canonical content locks, launch-readiness register and human-review registers remain the authoritative operational sources.

## 1. Foundation and platform architecture

- Reframed the project from a thin charity website into an integrated Amaana Foundation public platform.
- Established Next.js + TypeScript application architecture with Prisma/PostgreSQL, Railway staging, S3-compatible media boundaries and Razorpay integration architecture.
- Added public and administrative surfaces for appeals, donations, assistance requests, programme content, governance and operational workflows.
- Kept private assistance evidence and beneficiary-sensitive material outside public fixtures and public-media paths.

## 2. Amaana content model and factual reconciliation

- Rebuilt the public information architecture around Amaana's actual programmes, history, appeals, impact records and trust/compliance content rather than generic NGO copy.
- Established a canonical five-category public programme taxonomy and parent/annual-edition relationships.
- Added automated factual locks for reconciled high-risk facts, including the newborn medical appeal amount of ₹107,520 and Winter Drive 234 kits / 234 beneficiaries.
- Separated programme-level evidence, stories and known outcomes so the site does not rely on unsupported aggregate impact claims.

## 3. Public-site rebuild and visual identity

- Rebuilt the public experience with Amaana's blue/gold identity, official logo/mark, editorial serif display typography and restrained sans-serif interface typography.
- Introduced shared PageHero architecture with distinct Level 1, Level 2, trust/policy and action-page treatments instead of repeating one generic banner everywhere.
- Added real approved programme media where available and branded neutral fallbacks where photography is unavailable or inappropriate; beneficiary photography is never invented.
- Standardised the primary content shell to 74rem and aligned header, hero, body and footer content to the same horizontal system.
- Standardised primary/secondary action geometry, focus states, mobile navigation, responsive reflow and floating companion controls.

## 4. Programme, impact and storytelling integration

- Integrated the available programme archive and media for Eid Gift Kits, Qurbani/Meat Distribution, Dates Distribution, Taleem, Winter Relief, Hyderabad Flood Relief and medical/financial assistance cases.
- Built programme indexes, annual filtering, initiative detail surfaces, impact views, stories and supporting evidence journeys.
- Added privacy-aware public-media handling and a human-review register rather than treating technical file validation as consent approval.

## 5. Donation, assistance and admin hardening

- Implemented donation-flow architecture with Razorpay boundaries and explicit staging/mock acceptance paths; no uncontrolled live financial transaction is used for automated testing.
- Implemented private assistance-request intake/status architecture with privacy safeguards.
- Added synthetic admin-role browser coverage for important administrative workflows without weakening production authorization boundaries.

## 6. Accessibility, responsive QA and browser acceptance

- Established real Chromium browser automation across desktop, tablet and narrow mobile widths, including 360/390/430/768/1024/1440-class layouts.
- Added keyboard-navigation, mobile-menu focus restoration, reduced-motion, floating-control collision and automated WCAG A/AA serious/critical checks.
- Added visual-system geometry tests for shared content alignment, button consistency, typography hierarchy, footer proportions, official Amaana marks and horizontal/media overflow.
- Automated checks are treated as engineering evidence only; final rendered and assistive-technology review remains a human launch gate.

## 7. SEO, privacy and public discoverability

- Added canonical metadata, organisation schema, sitemap/robots rules and privacy-safe brand social-preview images.
- Excluded highly sensitive assistance-linked content from inappropriate discovery paths and kept private/payment/status routes out of public indexing where required.
- Added browser SEO contract checks for representative public routes and social image endpoints.

## 8. Performance and deployment discipline

- Consolidated global CSS and introduced hard production bundle ceilings rather than allowing visual polish to grow indefinitely.
- Added application health/readiness/version endpoints and exact-commit Railway staging acceptance so a green source build is not confused with a verified deployed build.
- Added launch-readiness and rehearsal tooling covering database backup evidence, rollback rehearsal, media review, payment readiness, DNS/indexing decisions and explicit production approval.
- `main` remains protected from premature promotion; active pre-production work stays on `phase-public-site-rebuild` until the launch gates are satisfied.

## 9. Final pre-production visual-system refinement — September 2026

- Standardised site-wide content width, action height, heading hierarchy and repeated footer treatment after a page-by-page visual audit.
- Reduced oversized body/closing headings so banner titles retain a clear hierarchy over body section headings.
- Compacted the repeated pre-footer trust banner to prevent it from dominating the end of every page.
- Added whole-surface containment checks for overflowing text, images and containers and expanded responsive visual-system browser coverage.
- Refined Our Work umbrella-programme separation with a subtle Amaana blue/gold wash, removed the redundant second decorative rule in the Our Work section heading, and aligned the filter action to the canonical button height.
- Simplified homepage documentary-card overlays by removing long summaries from image cards, keeping the visual hierarchy focused on year + programme title.

## Remaining launch gates

The platform is in final pre-production hardening, not production. Material remaining gates include final visual/human accessibility review, public-media consent/provenance review, dedicated public-media delivery readiness, CA confirmation of 12A/12AB status, Razorpay live/KYC readiness, controlled live donation and receipt/refund operational checks, database backup/rollback evidence, production DNS/indexing decisions and explicit approval to promote to `main`/production.
