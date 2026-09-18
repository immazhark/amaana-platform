# Amaana Platform — Manual Launch Review Checklist

This checklist closes the launch items that automation cannot certify by itself. It does **not** authorize a merge to `main`, live payment activation, public indexing, or publication of beneficiary media.

Record the candidate SHA and reviewer/date before starting. Review only the approved staging candidate.

## 1. Rendered accessibility review

### Representative routes
Review at minimum:

- `/`
- `/about`
- `/our-work`
- `/appeals`
- `/donate`
- `/request-assistance`
- `/transparency`
- `/compliance`
- `/admin/login`

### Viewports
Inspect each critical journey at:

- Desktop: 1440 × 900
- Laptop/tablet landscape: 1024 × 768
- Tablet: 768 × 1024
- Mobile: 430 × 932
- Mobile: 390 × 844
- Narrow mobile: 360 × 800

Automation already checks horizontal containment and axe A/AA on representative routes. Human review must additionally confirm that the visual hierarchy remains intentional, controls do not visually collide, text is comfortably readable, and no information becomes ambiguous at these widths.

### Actual 200% browser zoom
At a desktop viewport, set browser zoom to **200%** and verify:

- no horizontal page scrolling is required for normal reading;
- header/navigation remains operable;
- page title, body copy and CTAs remain readable;
- form labels, validation messages and buttons remain visible;
- floating companion/back-to-top controls do not obscure content;
- no modal/menu traps content off-screen.

### Keyboard-only operation
Without using the mouse:

1. Tab into the page.
2. Confirm **Skip to content** is the first meaningful focus target.
3. Activate it and confirm focus moves to the main landmark.
4. Traverse header navigation and CTAs in a logical order.
5. Open/close the mobile navigation with keyboard controls where applicable.
6. Complete the donation and assistance forms up to—but not beyond—safe staging boundaries.
7. Confirm focus is visible at all times.
8. Confirm Escape closes dismissible navigation/overlays and restores focus appropriately.

### Reduced motion
Enable the operating system/browser reduced-motion preference and verify that:

- rotating/reminder motion is disabled or reduced;
- no essential information depends on animation;
- focus/visibility changes remain understandable.

Record any issues as launch blockers unless explicitly classified as post-launch enhancement.

## 2. Editorial and factual review

Automation guards known canonical facts, but a human must read the final candidate for meaning and tone.

Confirm:

- newborn medical-aid amount is **₹107,520** wherever referenced;
- Winter Drive 2025–26 uses **234 Winter Kits distributed to 234 beneficiaries** as the overall metric;
- Aliza medical-aid amount uses the exact **₹482,700** when presented as a documented amount;
- 12A / 12AB is described as **provisional**;
- 80G is described as **provisional**, including Form 10AC dated 26 January 2026 and AY 2026–27 through 2028–29 where detail is given;
- Amaana is explicitly **not FCRA-registered**;
- public fundraising remains **domestic India only**;
- normal donation acknowledgements are not described as 80G tax-deduction certificates;
- completed appeals distinguish fundraising completion from medical/recovery outcomes where those are different;
- no public copy invents a beneficiary outcome, consent status, quantity or financial figure that is not documented.

### Terminology consistency
Confirm consistent use of:

- Amaana Foundation
- Eid Gift Kits
- Qurbani Meat Distribution
- Amaana Taleem Initiative
- Winter Relief / Winter Drive only in the agreed contextual usage
- verified need / reviewed need language
- domestic donation / India-only language

## 3. CTA and journey review

For every primary CTA, confirm the destination matches the promise.

Specifically verify:

- Explore our work → documented programme portfolio
- Support a Verified Need / Appeal → current appeal surface
- Taleem sponsorship → education sponsorship route
- Request assistance → private assistance form
- Transparency / How we verify → trust/process content
- Contact / partnership links → correct contact route

No CTA should imply a currently available donation destination when none exists.

## 4. SEO and social-share review

Automation verifies metadata structure, canonical URLs, generated images, robots and sitemap behavior. Human review must inspect the rendered result.

Check representative pages:

- homepage
- About
- Our Work
- Appeals
- Donate
- Compliance
- Transparency
- Recognition
- one canonical programme page

Confirm:

- browser title reads naturally and does not duplicate “Amaana Foundation”;
- meta description accurately describes the page;
- canonical URL is the intended public URL;
- Open Graph title/description are meaningful when shown outside the site;
- generated social image is legible and not visually clipped;
- Twitter/X preview metadata is appropriate;
- no beneficiary/private image is used as a default share image;
- Organization/NGO/WebSite structured data contains only approved public organization details.

### Indexing boundary
Until explicit launch approval:

- page metadata must remain noindex/nofollow;
- `robots.txt` must disallow crawling;
- sitemap must expose no launch URLs.

Do **not** enable `NEXT_PUBLIC_ALLOW_INDEXING` as part of this review.

## 5. Public media human review

Automation validates storage isolation, file structure and the review register; it does not grant consent.

For every asset intended for website publication, record:

- source/provenance;
- programme/year association;
- reviewer;
- review date;
- privacy classification;
- whether an identifiable minor is shown;
- whether a patient/medical context is shown;
- whether private documents/data are visible;
- consent status;
- whether website publication is an approved channel;
- whether high-prominence/hero use is separately acceptable.

Rules:

- social-media publication does not automatically imply website consent;
- patient/minor media requires the documented consent standard defined by the governance workflow;
- medical reports, IDs, bank information and other private proof must never become public evidence;
- uncertain media stays unpublished;
- hero placement requires a higher-confidence review than ordinary gallery use.

Only after the review register accurately reflects the human decisions should `public-media-human-review` be marked VERIFIED.

## 6. Admin rendered review

Using authorised staging staff accounts, confirm:

- each role sees only its intended navigation and operations;
- case reviewer cannot access editorial/finance operations;
- editorial reviewer cannot access beneficiary case/finance operations;
- finance reviewer remains isolated to donation reconciliation;
- no-permission users fail closed;
- assistance verification, media review, retention review and donation reconciliation screens remain usable at laptop width;
- permanent deletion controls visibly communicate their consequences;
- private document links never appear on public routes.

Do not create or publish real beneficiary data for this review.

## 7. Review outcome

Record one of:

- **PASS** — no launch-blocking issue;
- **PASS WITH DEFERRED POLISH** — only items already classified in the post-core UI enhancement backlog;
- **BLOCKED** — correctness, privacy, accessibility, payment-integrity, factual or journey issue must be fixed before launch.

For a PASS, record reviewer name, date, candidate SHA and any deferred enhancement references in the operational launch record. Then update only the readiness gates actually supported by that evidence.
