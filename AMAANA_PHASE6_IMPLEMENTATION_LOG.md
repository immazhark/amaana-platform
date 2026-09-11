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

### Third-party scripts
- Razorpay checkout script loading was moved from normal post-hydration loading to lazy-onload behavior.
- Checkout stays disabled while the provider script is unavailable and now has an explicit provider-load failure state.

### Analytics
- Client and API route allowlists were aligned so the browser does not emit page-view requests that the API discards.
- Public page-view delivery is deferred to browser idle time with a timeout fallback.
- Sensitive/admin/donation/assistance routes remain outside public analytics collection.

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
- policy pages
- published initiative detail pages
- privacy-approved published story detail pages
- published + religiously verified Faith detail pages
- public appeal detail pages.

Draft, privacy-unapproved and religiously-unverified records remain excluded.

The sitemap is cached for one hour to avoid hitting PostgreSQL on every crawler request while still refreshing frequently enough for public editorial content.

### Initiative detail metadata
Dynamic initiative pages now generate:
- unique title;
- initiative summary description;
- canonical URL;
- Open Graph article metadata;
- approved lead image metadata when an eligible public image exists;
- Twitter card metadata.

The approved lead media is also marked as rendering priority on the initiative page to support LCP when it is the above-the-fold visual.

## CI checkpoints

The following performance batches completed successfully before the newest SEO batch:
- #186 — route-split public experience styles
- #189 — scope mixed home experience styles
- #190 — split appeal card styles from route experience
- #191 — scope receipt and status styles
- #192 — defer and align public analytics
- #194 — defer Razorpay checkout script

The latest SEO/media commits require their own CI completion before being called verified.

## Remaining Phase 6 / 7 performance work

- Measure representative production/staging Core Web Vitals rather than inferring performance from source alone.
- Establish actual route JS/CSS/image transfer budgets from production builds.
- Continue reducing global CSS only where route coverage can be proven safe.
- Audit header/navigation hydration cost against UX value before changing architecture.
- Review cache strategy for public DB-backed pages while preserving immediate publication invalidation.
- Verify hero image dimensions/crops using approved original media once populated.
- Audit every page for CLS, overflow, touch, focus, motion and reduced-motion behavior.
- Validate metadata/canonical coverage across all important static and dynamic pages.
- Run final crawl for orphan pages, redirects, broken links and sitemap parity.
- Validate structured data against real published brand assets and public facts; do not add logo/social schema until source assets are confirmed.

## Important boundary

The site is not performance-certified yet. Source-level improvements and green CI reduce risk, but Phase 8 must measure real rendered pages on production-like infrastructure before release claims are made.
