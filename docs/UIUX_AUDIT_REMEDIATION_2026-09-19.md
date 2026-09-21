# UI/UX Audit Remediation — 19 September 2026

Source: `Amaana_UIUX_Audit.md` supplied after the family-review staging deployment.

This ledger tracks implementation state only. A code fix is not considered visually accepted until it is deployed to the family-review environment and checked at desktop/mobile breakpoints.

## Fixed in the quiet branch

- **Global mid-word wrapping:** removed the public-site `overflow-wrap:anywhere` behavior from headings, labels and short display text; kept safe wrapping for body copy/links. Placeholder labels now wrap at word boundaries and clamp cleanly.
- **Currency/metric integrity:** impact, appeal and hero metric values use no-wrap/tabular numeric presentation; Impact metric sizing was reduced slightly so INR values fit without digit splits.
- **Home field-card overlap:** generic `PublicMedia` figcaptions are suppressed inside Home field cards and media fills the visual layer, leaving only the deliberate card caption.
- **Impact gallery geometry:** reset inherited legacy `nth-child` grid placement so the two-column refinement actually produces a deliberate two-column grid.
- **About + How Amaana Works labelled content:** canonical blocks now support a labelled presentation with an explicit em-dash separator.
- **Five-item grids:** Get Involved and Contact use a balanced 3+2 layout on wide screens and a full-width fifth card at tablet width instead of orphaning card 05.
- **Get Involved stylesheet dependency:** added a route layout so shared intent-card styles are loaded on direct navigation rather than relying on CSS from a previously visited route.
- **Get Involved hero relevance:** prefer approved Taleem preparation media before falling back to the latest approved initiative image.
- **Our Work missing-media fallback:** replaced the bare AF box with the same designed `WorkVisualPlaceholder` used elsewhere.
- **Our Work filter grouping:** tightened control-group gap from 20px to 12px.
- **Our Work metrics:** initiative proof values use no-wrap/tabular numeric styling.
- **Donate CTA contrast:** replaced the dark-background ghost treatment on “Explore Taleem Sponsorship” with a paper-safe outlined secondary button.
- **Request Assistance step names:** sidebar now matches the rendered form sections: Contact, Need, Supporting evidence, Confirm.
- **Request Assistance file picker:** replaced the raw native presentation with an accessible styled evidence chooser, selected-file feedback and keyboard focus treatment.

## Verified clean in source/data; keep as live-render checks

- **COVID-19 duplicated sentence:** canonical master copy is clean and the current staging `Initiative` database row is clean. Do not alter the correct content unless the duplication is reproducible in the rendered page.
- **Footer disclaimer highlight box:** audit itself identifies this as potentially transient hover/focus capture state.
- **Home/Terms ghosted duplicate text:** audit identifies the same failure signature as a possible animation-timing capture artifact. Confirm in a normal live browser after the next deployment.

## Nice-to-have / later polish

- Home hero-card radius/shadow refinement.
- Home Our Work thumbnail/hover polish and extra section spacing.
- Appeal-card subtle ring refinement.
- Impact gallery final visual tuning after geometry fix.
- About lower-page spacing refinement.
- Governance visual-density enhancement.
- Donate-page information-architecture decision: keep two distinct donation entry points or merge/redirect.
- Broader page-specific hero-image diversification beyond the Get Involved correction.

## Pages explicitly reported clean by the audit

Preserve unless a shared/global correction naturally affects them:

- Governance (apart from optional density enhancement)
- Stories of Amanah
- Support a Need / verified-needs donation listing
- Awards & Recognition
- Partner
- Privacy Notice
- Refund Policy
- Donation Policy
- Registration & Compliance

## Deployment state

- Family-review deployment remains on integration SHA `b4b0a1b022a4d02443ecd39e8936e07593bd11c5`.
- UI/UX remediation is isolated on `work/uiux-audit-2026-09-19`.
- No `main` merge, family-review deployment, indexing change, Live Razorpay change or real payment has been performed for this remediation batch.


## Claude + Gemini synthesis implementation checkpoint — 20 September 2026

Family review remains isolated on `phase-public-site-rebuild` at `b4b0a1b022a4d02443ecd39e8936e07593bd11c5`. The work below is quiet-branch only and has not been deployed.

### Additional blocker/high-value remediation implemented

- Checkout form now has bounded, high-contrast amount/contact controls, visible focus treatment and selectable agreement tiles while preserving Razorpay behavior.
- Faith & Reflections replaces raw zero counters with a deliberate editorial-curation state when no reviewed content is public.
- Our Work filters retain semantic native selects but present them as one coherent toolbar; INR outcome metrics receive a compact status treatment.
- Appeals lifecycle is presented as a structured progression; synthetic staging appeals are labelled in staging and filtered from production-facing appeal, homepage and direct donation/detail access.
- Public leaf-page copy uses a shared deduplication guard so a body paragraph identical to the hero summary is not rendered again.
- Programme and initiative evidence images use a compact responsive gallery with keyboard-operable modal viewing, focus return, Escape/arrow-key controls and reduced-motion-safe styling.
- Repeated media URLs are deduplicated before gallery rendering.
- Programme hubs batch-load one privacy-approved public child image per pathway/year, replacing generic fallbacks when a suitable approved image exists without N+1 reads.
- Programme/case pages now surface documented metric/status summaries from existing public records.
- Recurring programme histories use compact layouts for Eid Gift Kits, Dates and Qurbani instead of long uniform card walls.
- Historical Flood/COVID pages receive an explicit pre-registration grassroots disclosure.
- Critical-care records surface referenced clinical abbreviations as plain-language context tags without changing the underlying case facts or providing medical advice.
- Governance now has a structured trustee layout; Transparency presents accountability and intentionally-private material in a clearer comparison; Partner areas use structured cards.
- About constrains long narrative measure and gives Mission/Vision equal visual treatment; How Amaana Works/verification uses a timeline treatment.
- Contact visually prioritizes the private assistance route and strengthens the sensitive-document warning.
- Get Involved uses stronger pathway/process cards while preserving the balanced five-item layout.
- Request Assistance now has consistent rounded field/select/textarea focus/error states plus a prominent privacy-before-submission assurance.
- Terms, Privacy, Refund and Donation Policy have in-page navigation; Refund elevates the never-share-PIN/OTP/card-credential warning.
- Privacy adds a public/private/payment data classification summary using existing policy facts.
- Compliance status is presented as four distinct status cards while preserving the existing conservative wording.
- Donate separates verified-appeal giving from programme/Taleem enquiry routes rather than implying one generic donation flow.
- Recognition now surfaces the actual AMP certificate as a lazy PDF preview plus issuer/year/category metadata and the existing non-endorsement caveat.
- Home media overlays were strengthened, proof metrics aligned with tabular no-wrap values, and service rows received restrained interaction polish.
- Stories preserves the no-fake-content privacy gate but presents it as an intentional protected archive state.

### Verification still required before any review deployment

- Full lint/typecheck/test checkpoint on the current quiet-branch head.
- Rendered desktop/mobile review of every changed route, including 200% zoom, keyboard and reduced motion.
- Exact contrast measurement for image-overlay text rather than relying on screenshot estimates.
- Gallery/lightbox screen-reader and focus-trap verification.
- Razorpay hard-refresh/remount regression check after checkout presentation changes.
- Assistance upload validation/error/retry check.
- Human media/provenance/privacy review remains a separate launch gate; these changes do not auto-approve media.

### Family feedback

Family navigation feedback is still being collected. When received, add it to this same remediation stream as real-user evidence rather than starting a separate redesign plan.


## Staging implementation checkpoint — 21 September 2026

Family feedback is complete and the remediation stream is no longer held on a quiet branch. Implementation is now landing phase-by-phase on `phase-public-site-rebuild`.

### Completed from the previous “nice-to-have / later polish” list

- **Home Our Work polish:** stronger thumbnail framing, restrained hover/focus media lift, improved section spacing and identity-image preference.
- **Appeal card ring/elevation:** subtle baseline elevation plus restrained hover ring.
- **Impact media density:** photographic witness wall converted to a compact carousel and identity-image selection standardized.
- **About lower-page spacing:** recognition and public-record continuation receive distinct, scannable closing treatments.
- **Governance density:** added an at-a-glance summary from existing public governance facts without adding new claims.
- **Broader media architecture:** legacy image pool reset; explicit identity/hero selection replaces first/random-image heuristics.

### New scroll-reduction implementation

- Shared `ScrollCarousel` supports manual buttons, touch/swipe, ArrowLeft/ArrowRight/Home/End keyboard navigation, slide status and reduced-motion behavior.
- No carousel auto-rotation is allowed.
- Programme gallery is horizontal while preserving modal enlargement, Escape handling and focus return.
- Parent programme histories with more than three child/year records are horizontal compact cards.
- Homepage documented-field work and programme-area discovery are horizontal strips.
- Impact witness photography is horizontal rather than a four-card vertical wall.
- Full-width homepage banner carousel is prepared for 3–5 curated featured identity images and stays dormant below three images.

### Media-dependent items intentionally deferred

- Final image crop/object-position tuning for the full-width homepage banner.
- Exact image-overlay contrast measurement against the curated photographs.
- Final gallery pacing/order and per-image captions once curated sets are supplied.
- Page-specific hero-image diversification that requires the new curated media.
- Human privacy/consent/provenance approval remains mandatory for every real public asset.

### Validation state

- Main carousel implementation commit `1ce9160086bf4a26f820e32b28f944edc44df901` deployed successfully on Railway.
- Audit/trust-polish commit chain through `67e898ac20266a20ab2836f22dabd1e18d6a0ad0` deployed successfully.
- Carousel E2E regression coverage exists in `e2e/carousel-acceptance.spec.mjs` for keyboard controls and mobile document containment.
- Screenshot-level staging inspection is still a separate rendered QA gate; do not claim it solely from build success.
