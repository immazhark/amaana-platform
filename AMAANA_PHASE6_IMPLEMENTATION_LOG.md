# Amaana Foundation — Phase 6 Implementation Log

Status: ACTIVE
Branch: `phase-public-site-rebuild`

This log records implementation work completed during the whole-site senior UX / performance / discoverability pass. CI success is necessary but does not by itself certify Phase 6.

## Experience quality standard

The Phase 6 quality gate is defined in `AMAANA_PHASE6_EXPERIENCE_QUALITY_STANDARD.md`.

Primary experience objective:

**Attract → Intrigue → Explore → Discover → Believe → Trust → Act**

Two-Wow standard:
1. the design and interaction quality should create the first memorable impression;
2. the depth, continuity and evidence of Amaana's work should create the second.

## Performance work implemented

### Public data
- Homepage queries were changed to lean projections so only fields rendered by the homepage are loaded.
- Dynamic initiative, story, Faith and appeal routes now use React request memoization so metadata generation and page rendering can reuse the same public record instead of repeating identical Prisma work in one request.
- Appeal metadata and page rendering now share one privacy-safe/public-status query rather than maintaining separate database reads.
- Our Work discovery now uses a dedicated lean projection and fetches at most one approved documentary image per initiative rather than full public-media collections.
- Impact now uses a dedicated lean projection limited to the identity, summary, metric, cause and first eligible witness image required by the page.
- Stories discovery now fetches only the public archive fields, related labels and one approved media asset per story rather than full story bodies/media collections.
- Faith discovery now fetches only the verified library fields, topic labels, source citation and one approved media asset per item rather than detail-only relations/content.
- Appeals discovery now fetches only card-level public fundraising fields rather than full appeal records.
- Appeal detail now selects only the public fields and approved public update fields rendered by the page.
- Donation pages now use a dedicated minimal checkout-context projection rather than querying directly from the route.
- Existing Prisma indexes were reviewed rather than adding speculative indexes with unnecessary write/storage cost.

### CSS delivery
Large experience styles have progressively moved out of the root layout and into the routes that require them, including:
- Our Work and campaign experiences;
- trust/compliance experiences;
- donation and assistance forms;
- receipt/status states;
- policy pages;
- homepage/mixed experience styling;
- appeal-detail styling.

Appeal-card styling is separated from the much larger appeal-detail experience.

### Media
- `PublicMedia` supports explicit priority loading for genuine above-the-fold media.
- Image width/height geometry is now reserved before the bytes arrive to reduce layout-shift risk.
- Non-priority images remain lazy-loaded and asynchronously decoded.
- Documentary video no longer preloads metadata by default; bytes are deferred until user intent.
- Video remains inline-capable on mobile.
- The homepage hero can now select a real privacy-approved public image tied to a published initiative or privacy-approved story. If no eligible image exists, the design fails closed to an intentional evidence-led fallback rather than stock or generated imagery.

### Third-party scripts
- Razorpay checkout script loading was moved from normal post-hydration loading to lazy-onload behavior.
- Checkout stays disabled while the provider script is unavailable and now has an explicit provider-load failure state.

### Analytics
- Client and API route allowlists were aligned so the browser does not emit page-view requests that the API discards.
- Public page-view delivery is deferred to browser idle time with a timeout fallback.
- Sensitive/admin/donation/assistance routes remain outside public analytics collection.

## Creative / UX work implemented

### Homepage first-Wow hero
- The homepage opening has been re-composed into an asymmetric editorial hero instead of a text-only two-column introduction.
- The left side carries the brand promise, origin context, primary actions and two high-confidence proof points.
- The right side is now reserved for authentic approved documentary media, with direct context linking back to the source initiative or story.
- The media selection respects `isPublic` and `privacyApprovedAt` gates and only draws from published initiatives or privacy-approved published stories.
- When no eligible asset is available, the hero uses a deliberate 2020–2026 evidence composition rather than pretending photography exists.
- Responsive behavior gives mobile its own stacked composition rather than merely compressing the desktop grid.
- Homepage-specific hero CSS is route-scoped and does not increase unrelated page CSS.

### Our Work discovery
- Featured work is now composed as an editorial story/documentary-media experience rather than a metric-only block.
- Approved initiative media can carry the feature visually, while the no-media fallback remains intentional and evidence-led.
- Cause-led discovery stays intact, but initiative rows now support one authentic approved thumbnail without loading full galleries.
- Wide-desktop, tablet and mobile layouts have distinct compositions; reduced-motion behavior is retained.

### Impact / Stories / Faith discovery refinement
- Impact now exposes stronger section labelling for published signals, initiative evidence and documentary witness areas.
- Documentary witness links carry specific accessible names and have visible keyboard focus states.
- Stories now gives the featured field note and living archive explicit section relationships, specific accessible link names and visible focus treatment equal to hover treatment.
- Faith library sections now expose explicit labelled relationships for editorial review, library, featured content and published reflections.
- Interactive Faith library items receive specific accessible names and visible keyboard focus treatment.
- Reduced-motion rules suppress focus-induced movement while preserving visible focus indication.
- Discovery-page Twitter metadata now matches the canonical/Open Graph coverage already in place for Impact, Stories and Faith.
- Repeated inline centering for closing CTAs is being replaced by a shared presentation utility rather than page-local style attributes.

### Appeals and donation journey
- Appeals discovery now has explicit canonical/Open Graph/Twitter metadata and keeps domestic/FCRA boundaries visible before donation intent.
- Appeal progress is exposed as a real progressbar to assistive technology on both cards and detail pages.
- Appeal-card links now carry specific accessible names instead of relying only on generic visible link text.
- Appeal detail exposes funding status and process strips with clearer landmark/label semantics.
- Donation pages reuse one request-memoized minimal public record for metadata and rendering.
- Donation routes are explicitly `noindex,follow`: the public appeal remains the search landing page while the transactional checkout route stays out of search results.
- Donation context, form region and assurance strip now have explicit semantic labels.
- Donation form state exposes `aria-busy`, assertive provider/checkout errors, an identified form heading/description and an explicit submit button.
- Razorpay remains lazy-loaded and checkout remains unavailable until the provider script is ready.

### Mobile navigation accessibility
- The closed mobile navigation is removed from the focus/accessibility tree with `hidden`.
- Escape closes an open menu.
- Menu state is tied to the pathname rather than synchronously resetting state in an effect, so route changes close the menu without React's set-state-in-effect performance/lint problem.
- Opening now moves focus into the mobile menu and Escape returns focus to the menu toggle.

### Loading and transition states
- The App Router now has a lightweight global `loading.tsx` fallback so dynamic navigation is never an unexplained blank state.
- The loading experience is semantic, announced politely to assistive technology and uses a reduced-motion-safe progress treatment.
- The state deliberately avoids heavy skeleton DOM or media placeholders that would add unnecessary layout/render cost.

### Design-system and responsive continuity hardening
- A later audit found that the legacy root stylesheet still carried generic NGO-green shared tokens beneath the new Amaana experience layer. The final refinement layer now remaps those generic shared variables and surviving shared gradients to the current working Amaana blue/gold/deep-ink/editorial-neutral system so untouched states cannot silently fall back to the old identity.
- This does **not** certify the exact master brand colours; final colour/logo certification remains blocked on direct inspection of the branding archive.
- Public-shell vertical overflow is no longer globally hidden merely to suppress horizontal layout issues; vertical focus/sticky/long-content behaviour remains available while horizontal overflow is clipped at the public experience boundary.
- Very narrow viewports now receive smaller shell gutters, tighter brand-label spacing, safe text wrapping and hero-action wrapping without shrinking the established 3rem interactive-height baseline.
- Global smooth scrolling is disabled under `prefers-reduced-motion: reduce`.
- A first narrow-screen draft briefly reduced shared button height to 2.75rem; it was immediately reverted to 3rem and recorded in the Mistake & Lessons Log before certification.

## SEO / discoverability work implemented

### Robots/indexing
- `robots.ts` now uses the same strict indexing gate as page metadata.
- Staging/non-production configurations disallow crawling rather than merely relying on meta robots.
- Production robots output uses the configured canonical app URL rather than a second independent hard-coded host decision.

### Sitemap
The sitemap now includes the real public information architecture rather than only a small subset:
- Homepage
- Our Work
- Impact
- Stories
- Faith & Reflections
- Appeals
- About
- Get Involved
- How We Verify
- Transparency
- Governance
- Compliance
- Contact
- Request Assistance
- policy pages
- published initiative detail pages
- privacy-approved published story detail pages
- published + religiously verified Faith detail pages
- public appeal detail pages.

Draft, privacy-unapproved and religiously-unverified records remain excluded.

The sitemap is cached for one hour to avoid hitting PostgreSQL on every crawler request while still refreshing frequently enough for public editorial content.

### Dynamic detail metadata
Initiative, story, verified Faith and appeal detail routes now generate page-specific metadata appropriate to their public content gate, including canonical URLs and Open Graph/Twitter metadata. Approved public images are used for social previews only where the underlying record already exposes a separately approved image.

The homepage now also declares its explicit canonical URL rather than relying only on root defaults.

### Discovery metadata
- `/our-work`, `/impact`, `/stories`, `/faith-and-reflections` and `/appeals` now declare explicit canonical URLs and Open Graph metadata rather than relying only on inherited defaults.
- Impact, Stories and Faith discovery pages now also carry explicit Twitter card metadata.
- Transactional `/donate/[slug]` routes have page-specific metadata but remain intentionally excluded from indexing in favor of the corresponding public appeal page.
- Trust/utility routes now have stronger page-specific canonical/social metadata, including About, Governance, Compliance, Transparency, How We Verify, Get Involved, Contact and Request Assistance.
- Privacy Policy, Donation Policy, Refund Policy and Terms now have explicit canonical, Open Graph and Twitter metadata rather than relying on root defaults.

### Structured data
- Organization schema has been expanded into a graph containing the Amaana organization and website entities.
- Published social channels are represented with `sameAs`.
- Hyderabad/Telangana/India context and the public contact email remain explicit.
- The structured-data URL follows the configured app URL rather than silently hard-coding production into every environment.
- Logo schema remains intentionally absent until the original isolated branding asset is successfully recovered and verified.

## Backend/storage hardening added during Phase 6 continuity review

- Public-media upload now has a compensation path for the storage-upload/database-create boundary.
- If an uploaded managed public-media object is successfully stored but creation of its `MediaAsset` record fails, the application attempts to delete that exact newly uploaded object before rethrowing the original DB error.
- Cleanup is restricted to the application's managed `YEAR/UUID.ext` object-key shape rather than exposing arbitrary public-bucket deletion.
- A failed cleanup is logged, while the original record-creation error remains the user-visible failure.
- This reduces the orphan-object risk in code; staging-provider verification is still required before the risk is marked closed.

## CI checkpoints

Verified successful checkpoints include:
- #186 — route-split public experience styles
- #189 — scope mixed home experience styles
- #190 — split appeal card styles from route experience
- #191 — scope receipt and status styles
- #192 — defer and align public analytics
- #194 — defer Razorpay checkout script
- #199 — initiative metadata and priority media
- #200 — Phase 6 performance/SEO implementation checkpoint
- #204 — Faith gallery media remains correctly lazy
- #214 — cached page data, structured data and homepage first-Wow pass
- #217 — documentary Our Work discovery system
- #225 — corrected mobile navigation plus discovery-performance batch
- #244 — assistance-form semantics and labelled form region
- #251 — global loading-state plus policy metadata checkpoint
- #265 — Contact/external-link accessibility checkpoint
- #275 — active release-risk register checkpoint
- #276 — initial Mistake & Lessons Log checkpoint
- #280 — narrow-screen touch-target correction checkpoint

CI #218 exposed a React lint issue in the first route-change menu implementation (`setState` directly inside an effect). The implementation was corrected immediately by deriving open state from the current pathname rather than suppressing the lint rule. The corrected implementation is included in later green CI.

Newer palette/reflow/storage-hardening documentation and code require their own CI completion before being certified.

## Remaining Phase 6 / 7 performance work

- Measure representative production/staging Core Web Vitals rather than inferring performance from source alone.
- Establish actual route JS/CSS/image transfer budgets from production builds.
- Continue reducing global CSS only where route coverage can be proven safe.
- Audit header/navigation hydration cost against UX value before changing architecture further.
- Review longer-lived cache strategy for public DB-backed pages while preserving immediate publication invalidation.
- Verify hero image dimensions/crops using approved original media once populated.
- Audit every page for CLS, overflow, touch, focus, motion and reduced-motion behavior.
- Validate metadata/canonical coverage across all important static and dynamic pages.
- Run final crawl for orphan pages, redirects, broken links and sitemap parity.
- Add official logo/schema/social-preview imagery only after the original branding archive has been successfully inspected.
- Continue the creative-director pass through Impact, Stories, Faith, Appeals/Donate and trust/utility journeys.
- Exercise public-media DB-failure compensation against staging storage before closing the orphan-object risk.

## Important boundary

The site is not performance-certified or creative-certified yet. Source-level improvements and green CI reduce risk, but Phase 8 must measure real rendered pages on production-like infrastructure before release claims are made.
