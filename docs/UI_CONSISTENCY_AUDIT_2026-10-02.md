# UI consistency and legacy-rule audit — 2026-10-02

## Scope and reference

Owner requested a site review and confirmed-issue fixes while away. Reference is the approved shared L1 cream/gradient/lattice banner with the right-side Amaana Arabic motif, shared body heading and carousel system. This is an incremental review, not a new design direction. Base: `8fcc88b935eed87f740dba2159d67f0d3eb8e231`.

## Confirmed findings and fixes

| Priority | Finding | Resolution |
| --- | --- | --- |
| High | State/receipt route CSS loaded after shared L1 CSS, retaining white foregrounds, oversized headings and a nearly transparent step panel on the new light banner. Confirmed on the deployed assistance confirmation page. | Remove obsolete banner color/type declarations at their source. Use dark text on the approved banner and an explicitly navy step panel with readable light text. Receipt reference/status copy uses the shared dark/gold tokens. |
| Medium | Home secondary banner action changed to white text on a pale background on hover and keyboard focus. | Preserve dark text and use a restrained navy tint/border in both interaction states. |
| Medium | Contact social introduction still used the old stacked heading. | Use SectionHeading: eyebrow with line, title left/subtitle right; stack on mobile. Keep official social icons and links. Apply the existing approved body backdrop utility to this section; it previously omitted the lattice. |
| Medium | Contact social and Faith editorial sections omitted the approved geometric body surface. | Reuse the existing body backdrop utility on those full-width sections; no new artwork or override layer. |
| Low | Route CSS still defined the retired intent-card design, circle decoration, grid balancing and entrance animations, despite ParticipationCard owning the complete replacement. | Remove those obsolete rules. Keep Contact layout and the Get Involved section rules. Visibility no longer depends on a delayed route entrance animation. |
| Verification | Carousel geometry acceptance used a fixed 700ms delay and intermittently sampled an unsettled position. | Poll actual settled alignment with the existing 2px tolerance. Do not relax the geometry requirement. |

## Coverage and findings classification

- Local production audit attempted 35 public/admin-login/error routes at 390px and 1440px. 38 successful page/viewport combinations were inspected for heading count, horizontal overflow, small form controls and axe WCAG2A/AA/2.1AA findings. Data-backed pages cannot render locally without PostgreSQL; those 500s are environment limitations, not diagnosed website defects.
- Live review opened all 30 canonical initiatives from `prisma/master-programmes.json`, all four separate programme category overviews, plus Our Work, Impact, Stories, Faith and Reflections, Appeals, Donate and education sponsorship. No horizontal overflow was detected in these desktop DOM checks. These are coverage observations, not a claim of exhaustive manual screen-reader/zoom testing.
- Final targeted regression checks run at 320/390/768/1024/1440/1920: state heading foreground and size, state-panel accessibility, Home hover/focus, Contact heading geometry and full Contact axe scan. All six pass locally.
- Ten carousel interaction/geometry cases pass locally, including drag, keyboard controls, reduced motion, rapid transitions and autoplay pause.
- Nine existing Home/portfolio screenshot and interaction cases pass locally. The participation/contact suite reached and passed its Contact/Get Involved assertions at all six widths but cannot finish its database-backed Appeals segment locally; seeded CI remains the authoritative end-to-end gate.
- Build, types, lint (zero errors; three unchanged warnings), editorial check, root CSS architecture and 16 planner regressions pass. JavaScript is unchanged at 819,087 / 819,200 bytes; CSS is 342,523 / 348,160 bytes. Budget caps remain unchanged.
- Early Contact contrast warnings sampled a legacy entrance animation mid-opacity. They did not justify a palette change. The removed obsolete animation and final full Contact scans resolve this transient reading issue.
- Mechanical detector warnings concern existing privacy/receipt disclaimer accent borders. They are intentional semantic notices and do not warrant unrelated redesign.

## Delivery and remaining boundaries

Application task branch: `fix/ui-consistency-audit-20261002`. Seeded focused CI, merge and exact-source Railway review deployment verification are pending at this checkpoint. CI maps the affected presentation styles to their banner, journey, participation, typography, chrome, performance and regression suites. Unknown/server/security/payment/config changes and releases continue to select full verification.

Authenticated staff-record states are not certified by this public review. Synthetic admin shell desktop/mobile checks and existing authorization tests cover the safe presentation boundary; no private operational records are opened or mutated. Canonical narratives/figures, beneficiary privacy, payment behavior, indexing gates, approved SVG bytes and the fixed bottom-right Companion are preserved. Main/production PR104 remains a separate protected release checkpoint.
