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
