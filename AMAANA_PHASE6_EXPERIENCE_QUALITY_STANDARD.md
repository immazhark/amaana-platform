# Amaana Foundation — Phase 6 Experience Quality Standard

Status: ACTIVE PHASE GATE
Branch: phase-public-site-rebuild

## Objective

Phase 6 is the whole-site creative-director and senior UX pass. It does not exist to decorate completed pages. It exists to make the entire public experience exceptional while preserving the evidence, privacy, payment, assistance, compliance and publication safeguards already built.

Amaana has a two-Wow objective:

1. **Wow 1 — Experience:** within the first moments, the visual design, composition, typography, motion, imagery, navigation and responsiveness should feel exceptional enough to make a visitor want to continue exploring.
2. **Wow 2 — Work:** exploration should reveal the depth, continuity and evidence of Amaana's real work so that visual admiration turns into respect, trust and meaningful action.

The intended journey is:

**Attract → Intrigue → Explore → Discover → Believe → Trust → Act**

Design must amplify the work rather than compete with it.

## Quality pillars

### 1. Creative direction and visual system
- Use the official Amaana logo and exact source brand colours once recovered from the supplied branding archive; approximations cannot receive final brand certification.
- Authentic Amaana documentary photography is the primary visual material.
- Establish deliberate editorial rhythm: visual drama, quiet reading space, evidence moments, human storytelling and action moments.
- Avoid generic NGO templates, repetitive rounded-card grids, gratuitous gradients, excessive glassmorphism, decorative animation, fake urgency and ornamental Islamic motifs without purpose.
- Islamic visual language should influence framing, geometry, rhythm and detail subtly and respectfully.
- Every major page must have its own compositional character while remaining recognizably part of one Amaana system.

### 2. UX and information architecture
- Every page has a clear visitor purpose and primary next action.
- No dead ends, orphan pages or contextless CTAs.
- Visitor journeys are reviewed end-to-end: first-time visitor, donor, assistance requester, returning supporter, volunteer/partner, trust/compliance visitor and mobile visitor.
- Reveal information progressively; do not front-load every statistic, certificate or ask.
- Trust information appears at the point of hesitation rather than only on dedicated trust pages.

### 3. Responsive product design
- Mobile is designed, not compressed.
- Test representative phone, tablet, laptop and wide-desktop widths.
- Preserve hierarchy, image intent, touch comfort and action clarity at every breakpoint.
- Avoid horizontal overflow, clipped media, awkward heading wraps, cramped forms and desktop-only interaction assumptions.
- Minimum touch-target and spacing behavior must meet accessibility expectations.

### 4. Accessibility
Target WCAG 2.2 AA across public journeys.

Required checks include:
- semantic landmarks and logical heading structure;
- native elements before ARIA;
- complete keyboard navigation;
- visible focus;
- working skip navigation;
- accessible menus, dialogs, galleries and forms;
- labels, instructions and useful error association;
- meaningful image alt text;
- sufficient text/UI contrast;
- sensible DOM and reading order;
- touch-target adequacy;
- `prefers-reduced-motion` support;
- screen-reader spot checks before release.

### 5. Frontend performance
Core Web Vitals release targets:
- LCP ≤ 2.5 s
- INP ≤ 200 ms
- CLS ≤ 0.1

Additional expectations:
- minimize unnecessary client JavaScript;
- prefer server rendering/components where interaction does not require client state;
- responsive optimized images and deliberate priority loading;
- lazy-load below-fold media;
- avoid layout shifts from images/fonts/dynamic content;
- limit third-party scripts;
- use efficient caching and font delivery;
- inspect production-like pages rather than relying only on local perceived speed.

Representative production pages should aim for Lighthouse 90–100 Performance while never gaming metrics at the expense of UX or content.

### 6. Backend performance and reliability
- Review Prisma queries for unnecessary round trips and over-fetching.
- Ensure indexes match real access patterns.
- Paginate datasets that can grow.
- Preserve payment idempotency and verification safeguards.
- Preserve rate limiting and private assistance-document controls.
- Fail safely and provide recoverable public states.
- Keep notification/retry workflows bounded and observable.
- Review public-media upload lifecycle, including orphan-object cleanup risk after storage upload / DB failure.

### 7. Semantic quality
Use meaningful HTML and content structure so pages remain understandable without visual styling:
- header/nav/main/footer landmarks;
- articles for standalone editorial content;
- figures/captions for documentary media where appropriate;
- real lists for collections;
- buttons for actions and links for navigation;
- descriptive link text;
- meaningful heading hierarchy;
- logical source order independent of CSS placement.

### 8. SEO and discoverability
- Unique page titles and descriptions.
- Correct canonical behavior.
- Deliberate robots/indexing rules: staging remains non-indexable; production indexing is an explicit release action.
- XML sitemap coverage.
- Open Graph/social metadata and appropriate imagery.
- Structured data only where factually valid and useful.
- Strong contextual internal linking.
- No thin/duplicate pages created merely for SEO.
- Campaign histories, impact archives, stories and Hyderabad/local context should create genuine search value.
- Image filenames/alt/captions should be meaningful without keyword stuffing.
- Validate crawlability and broken links before production.

Search rankings or traffic levels are not guaranteed; the product must instead remove avoidable technical/content barriers to discovery.

### 9. Trust, privacy and conversion
- Every impact claim remains attached to its evidence/context.
- Sensitive beneficiary proofs remain private.
- Public media remains separately privacy-approved.
- Donation limitations and payment expectations appear before payment.
- Assistance privacy and expectations appear before sensitive submission.
- Compliance language remains precise, including provisional 80G and domestic-only/FCRA boundaries.
- Conversion is earned through clarity and confidence, not manipulation.

### 10. Maintainability
- Centralize real design tokens once official brand assets are verified.
- Build reusable behavior without making every page visually identical.
- Keep content/data concerns separate from presentational composition.
- Avoid dense, difficult-to-review JSX.
- Critical behavior receives tests; visual/UX quality receives manual and automated QA where appropriate.
- Keep durable implementation/audit documentation current.

### 11. Analytics and post-launch visibility
Prepare for privacy-conscious measurement of:
- organic landing pages;
- initiative/story discovery;
- navigation paths;
- appeal-to-donation funnel progression;
- assistance-form abandonment/completion;
- device mix;
- important errors and failed journeys;
- Core Web Vitals in the field.

Analytics must not compromise beneficiary or assistance-request privacy.

## Phase 6 execution order

1. **Brand certification** — recover official logo variants and exact source colours; replace temporary identity treatments.
2. **Global shell** — header, navigation, mobile menu, footer, page container/grid, typography, buttons, focus, spacing and global motion language.
3. **Homepage** — engineer Wow 1 and the transition into Wow 2.
4. **Our Work + initiative details** — make documentary work discovery immersive and varied.
5. **Impact + Stories + Faith** — evidence/editorial experiences with clear related-content journeys.
6. **Appeals + Donate** — premium trust-first conversion without manipulative patterns.
7. **About + Governance + Verification + Transparency/Compliance** — human story and institutional confidence.
8. **Get Involved + Contact + Assistance + policies/state pages** — bring utility experiences to the same visual and UX standard.
9. **Cross-site retention pass** — related content, contextual CTAs, social continuity and elimination of dead ends.
10. **Phase 7/8 handoff** — accessibility, motion, responsiveness, performance, SEO, semantic, browser/device and workflow hardening.

Authentic-media population continues in parallel. Pages dependent on unavailable/unapproved media cannot receive final creative certification.

## Per-page senior UX review

Every public page must answer:

1. Does this feel unmistakably Amaana?
2. Is the visitor's purpose clear within seconds?
3. Is the visual hierarchy intentional at desktop and mobile sizes?
4. Is there one obvious primary action and are secondary actions appropriately subordinate?
5. Does the page reveal real evidence/work rather than generic charity language?
6. Is trust information placed where uncertainty occurs?
7. Does every interactive element work with keyboard, touch and reduced motion?
8. Does the semantic structure describe the content correctly?
9. Is the page fast enough that the design never feels heavy?
10. Does the page create a meaningful onward journey?
11. Would the page stand credibly beside the strongest benchmark experiences rather than merely outperform the old Amaana site?
12. Does the design make Amaana more memorable than the effects themselves?

## Release budgets and gates

Phase 6 establishes the standard; Phases 7–8 verify it quantitatively and behaviorally.

A public page cannot be certified merely because CI passes. Final certification requires:
- authentic source/content review;
- brand review;
- desktop/mobile visual QA;
- keyboard/accessibility QA;
- responsive overflow/crop QA;
- semantic review;
- performance/Core Web Vitals review;
- metadata/SEO review;
- workflow/CTA review;
- empty/loading/error/success review;
- privacy/compliance review;
- independent final review.

## Non-negotiable final test

**WOW 1:** Would a visitor remember, screenshot, share or bookmark the experience because the design feels exceptional?

**WOW 2:** After exploring, would that visitor leave with substantially greater understanding, trust and respect for Amaana because the work and evidence were presented exceptionally?

Both must be true. A beautiful site that hides the work fails. A comprehensive archive with ordinary UX also fails.
