# Amaana Foundation — Creative Rebuild Plan

Status: ACTIVE
Branch: `phase-public-site-rebuild`
Primary objective: produce a public-facing Amaana experience that is confidently showable to donors, trustees, volunteers and family before expanding secondary features.

## 1. Creative standard

The site must feel like a bespoke creative-agency build, not a charity template, admin product or AI-generated interface.

Reference benchmark mix:
- Amaana's own logo, archive, campaign photography, posters, documents and verified history are the primary source of identity.
- Claude's static homepage is the minimum clarity baseline: strong hierarchy, real image, concise copy, visible data, coherent palette.
- Awwwards is the quality benchmark for composition, typography, motion, transitions, rhythm and interaction — never for trend copying.
- Human Appeal, Islamic Relief, Muslim Aid, Penny Appeal, HHRD, Al-Khair, MATW, IndiaZakat, VRIC, AMP India, Helping Hand Foundation and Terminate Hunger are references for charity UX, Islamic utility, appeals, evidence, continuity and trust.

Core design concept: **Living Amanah**.

The experience should communicate: faith → dignity → action → evidence → continuity.

## 2. Non-negotiable content rules

1. Google Drive initiative folder lineage is authoritative for media mapping.
2. No image is assigned to an initiative unless its source provenance is known.
3. Every public statistic must map to a source record, poster, report or verified internal figure.
4. Never use generic filler copy where real Amaana material exists.
5. Never use AI-generated beneficiary photography.
6. Identifiable beneficiary imagery requires a clear public-use basis; safer packaging, volunteer, distribution and product imagery is preferred by default.
7. Public evidence and private proofs remain separate.
8. Compliance wording must remain exact: provisional 80G, domestic donations only, 12A/12AB pending confirmation, no FCRA.
9. Grassroots start in 2020 must not be conflated with legal registration in 2024.

## 3. Content architecture before decoration

Build and maintain an internal content/media manifest:

`initiative → year → source folder → photos → posters → documents → verified figures → approved copy → public placement`

Priority initiatives:
- Eid Gift Kits
- Meat / Qurbani Distribution
- Dates Distribution
- Winter Drive
- Taleem Initiative
- Hyderabad Flood Relief 2020
- Medical & Financial Assistance
- COVID relief where source records are sufficient

Homepage content must use the strongest verified, visual material from these sources rather than generic descriptions.

## 4. Homepage showcase build — first release gate

No secondary feature expansion until this page is showable.

### 4.1 Header
- Official Amaana lockup, correctly sized and optically aligned.
- Refined sticky behavior with subtle surface transition after scroll.
- Strong active-navigation treatment.
- Premium desktop spacing and intentional mobile menu choreography.
- Primary action visually distinct but not loud.

### 4.2 Branded entry/loading state
- Animate the official Amaana mark, not a generic spinner.
- Blue/gold halo, restrained progress sweep and soft brand pulse.
- Reduced-motion alternative.
- Reuse for route loading, async utilities and data waits where appropriate.

### 4.3 Hero — "Amanah Window"
- Real Amaana campaign imagery, not abstract placeholder UI.
- Strong editorial headline with selective blue→gold gradient emphasis.
- One concise supporting paragraph.
- Two clear actions maximum.
- One compact evidence badge/metric cluster.
- Islamic architectural framing: arch/jali-inspired masking and filtered-light texture, extremely subtle.
- Controlled image transition/carousel only if multiple correctly sourced hero images improve the story.

### 4.4 Immediate proof strip
- Real verified numbers.
- No generic counters without context.
- Each number linked to its initiative/evidence destination.
- Motion limited to number reveal and line progress.

### 4.5 Featured work — image first
- Large editorial campaign panels, not a repetitive card grid.
- Every item: real photo + initiative + year + one verified result + short meaningful line.
- Mixed scale/asymmetry to avoid template repetition.
- Horizontal swipe behavior on mobile where useful.

### 4.6 Eid Kits 2020→2026 story
- Treat as Amaana's signature continuity story.
- Visual growth chart/timeline with real figures.
- Supporting campaign imagery/poster fragments.
- Show growth without creating a spreadsheet feel.
- Keep the 2020 grassroots origin and later trust registration historically distinct.

### 4.7 Documentary evidence section
- Qurbani, Dates, Winter, Taleem and other verified campaigns using their correct folder imagery.
- Display specific operational facts, not generic impact copy.
- Use captions that state what the viewer is actually seeing.

### 4.8 About / origin moment
- Short, emotional and specific.
- Avoid a long organisational essay on the homepage.
- Use the 2020 Ramadan origin and growth as the narrative anchor.

### 4.9 Trust / recognition / compliance
- Registration, DARPAN, provisional 80G and domestic-donation position surfaced elegantly.
- Awards/recognition only from actual source material.
- No legal-document wall on the homepage.

### 4.10 Faith layer
- One reviewed reminder or reflection, not placeholder text.
- Integrate visually into the experience instead of making a detached "religion card".
- Islamic Companion remains utility-oriented and clearly distinguishes calculated information from local mosque/moon-sighting authority.

### 4.11 Appeals / action
- If there is an active verified appeal, show it prominently with meaningful progress/status.
- If there is no active appeal, do not show an oversized empty-state block. Route visitors naturally to completed work, volunteering or assistance pathways.

### 4.12 Footer
- Use official logo/lockup.
- Better visual hierarchy and fewer equal-weight links.
- Social channels, trust links, action paths and contact separated clearly.
- Strong closing brand moment, not a generic sitemap dump.

## 5. Visual language

### Brand palette
Primary source: official Amaana logo and Claude-approved palette.

- Blue: `#466FAA`
- Mid blue: `#2F4C7A`
- Deep blue: `#1D3150`
- Ink: `#122239`
- Gold: `#E0B318`
- Deep gold: `#B8890E`
- Cream: `#FAF6EC`
- Muted cream: `#F3EDDD`
- Paper: `#FFFDF8`
- Border: `#E6DCC3`

Use variants and gradients intentionally:
- blue → deep blue for depth
- blue → gold for selective display text/highlight strokes
- gold → deep gold for badges/progress accents
- cream → paper for quieter editorial transitions

Do not gradient every heading. Reserve gradient treatments for high-value moments.

### Typography
- Editorial serif for major storytelling headlines.
- Clean sans for navigation, data, actions and support copy.
- Strong contrast in scale.
- Shorter line lengths.
- Eliminate orphaned/incomplete phrases and awkward line wraps.

### Surfaces
- Fewer rounded white cards.
- More full-bleed media, editorial split layouts, borders, rails, timelines and negative-space composition.
- Rounded containers only where they serve interaction or soften a specific utility.

## 6. Motion system

Motion must explain hierarchy and create delight, not decorate everything.

Preferred stack:
- `motion` / `motion/react` once package + lockfile integration is safely completed.
- Embla Carousel for touch-first galleries if needed.
- Native CSS for lightweight hover, reveal, mask, backdrop and progress effects.

Motion grammar:
- 150–250ms: controls and hover feedback
- 350–600ms: panels, nav, drawers, image reveals
- 700–1100ms: cinematic hero/section transitions
- stagger only when it improves reading order
- no perpetual motion except subtle ambient logo/loading states
- reduced-motion support everywhere

Planned signatures:
- Golden Thread scroll progress motif
- image mask reveal through arch geometry
- subtle parallax on documentary imagery
- evidence number reveal
- horizontal campaign gallery on touch
- soft section colour transitions
- branded route loader

## 7. Islamic utility experience

Islamic Companion should feel integrated, not bolted on.

Phase after showcase homepage:
- local Salah times after user permission
- calculation-method selector
- Hanafi/standard Asr option
- timezone-correct next prayer
- Hijri date with moon-sighting caveat
- upcoming Islamic dates
- seasonal Ramadan / Dhul Hijjah / Friday states
- neutral fasting reminders with reviewed wording

Do not launch a Zakat calculator without appropriate religious/policy review.

## 8. Interaction polish checklist

Every public interactive element must be reviewed for:
- default state
- hover
- keyboard focus
- active/current state
- pressed state
- loading state
- empty state
- error state
- disabled state where applicable
- mobile touch target
- reduced motion
- visual alignment at common breakpoints

This includes every link, button, menu item, carousel control, form, media block, metric, drawer, dialog and footer item.

## 9. Responsive design rule

Mobile is not the desktop layout stacked vertically.

Design explicitly for:
- 360–430px phones
- tablet portrait
- tablet landscape
- 1280–1440px desktop
- large desktop

Priority mobile considerations:
- image crop/focal point
- type scaling
- timeline transformation
- carousel touch behavior
- menu hierarchy
- sticky CTAs only where useful
- no horizontal overflow
- no tiny evidence text

## 10. Performance and accessibility gate

World-class includes speed and usability.

- Keep JavaScript budgets enforced.
- Optimize source images before shipping.
- Use responsive Next Image sizes.
- Avoid loading all gallery media above the fold.
- Ensure WCAG-level contrast for copy and controls.
- Preserve keyboard navigation and focus visibility.
- Use semantic headings and landmarks.
- All motion has reduced-motion behavior.

## 11. Execution sequence

### Pass A — Source integrity
- Audit media against Drive folders.
- Remove incorrect Qurbani/Dates mappings.
- Build authoritative initiative manifest.
- Verify homepage figures and copy.

### Pass B — Showcase homepage composition
- Rebuild hero.
- Rebuild featured work.
- Add Eid continuity visualization.
- Add documentary evidence sections.
- Refine origin/trust/action/footer.
- Remove weak/empty/filler sections.

### Pass C — Brand + interaction polish
- Apply typography hierarchy.
- Apply blue/gold gradient language selectively.
- Refine logo use, spacing, surfaces and backgrounds.
- Add micro-interactions and branded loaders.

### Pass D — Motion
- Safely integrate Motion package + lockfile.
- Add section reveal choreography, Golden Thread, media transitions and campaign carousel.
- Verify reduced-motion behavior.

### Pass E — Responsive QA
- Desktop/tablet/mobile alignment audit.
- Fix overflow, crop, spacing, button, navigation and timeline issues.

### Pass F — Content/legal QA
- Verify every visible number, initiative name, date and compliance statement against source material.
- Remove unsupported language.

### Pass G — Build gate
- lint
- typecheck
- tests
- production build
- bundle budget
- Railway preview deploy
- only then call homepage "showcase-ready"

## 12. Definition of showcase-ready

The homepage is ready to show when:
- the first screen immediately communicates Amaana's identity and real work;
- the official logo is unmistakably present and beautifully treated;
- at least several authentic campaign images are visible and correctly mapped;
- all headline statistics are source-backed;
- there is no developer/placeholder language;
- there are no obvious alignment or overflow issues at major breakpoints;
- motion feels intentional and restrained;
- every main navigation/action link has a meaningful destination;
- empty states do not dominate the experience;
- mobile feels designed rather than collapsed;
- the page passes CI/build and deploys successfully.

Until these conditions are met, secondary novelty features do not take priority over the showcase homepage.
