# Amaana Foundation — Rebuild Audit

This audit runs in parallel with implementation. It checks whether earlier deficiencies were actually corrected, not merely whether code was changed.

## Audit method

Each item is tracked as one of:
- **Resolved in code** — the earlier deficiency has a concrete implementation change.
- **Resolved in architecture, awaiting content/media** — the public experience is ready but the real source material still has to be populated.
- **Partially resolved** — the earlier problem has improved but still needs a later creative/QA pass.
- **Open** — not yet complete enough to certify.

Passing CI is necessary but is not used as proof of visual, factual or release quality by itself.

## Earlier failure → correction → present status

### 1. Generic / early-framework public site
**Earlier problem:** the public site looked like an unfinished framework rather than an Amaana-designed experience.

**Corrections:**
- Introduced the `Living Amanah — Faith. Dignity. Action.` creative direction.
- Added dedicated visual systems for Home, Our Work, initiative detail, Eid Gift Kits, Qurbani, Taleem, Winter, Dates, Medical/Financial Assistance, Flood Relief, Impact, Stories, Faith, Appeals, forms, state pages, trust pages, policy pages and Governance.
- Replaced generic page/card patterns with editorial, evidence-led layouts and different page rhythms.

**Status:** **Partially resolved.** The structural/template problem is corrected. Final certification waits for authentic media population and the whole-site second creative pass.

### 2. Homepage lacked identity, photography and clear visitor purpose
**Earlier problem:** no meaningful photography, weak hierarchy, oversized empty areas and no strong explanation of what Amaana does.

**Corrections:**
- Rebuilt hero and visitor-intent journeys.
- Added work, impact, stories, appeals, faith and participation pathways.
- Dynamic initiative/story architecture allows authentic approved media to populate the homepage.

**Status:** **Resolved in architecture, awaiting content/media.** The homepage is no longer structurally thin, but real photography still has to replace all remaining no-media states.

### 3. Donate journey reached a dead end
**Earlier problem:** Donate could lead to `No active appeals` with no useful visitor journey.

**Corrections:**
- Appeals index rebuilt around reviewed needs and transparent empty states.
- Appeal detail pages rebuilt with context, privacy boundaries, progress and known updates.
- Donation checkout now keeps the selected appeal context and explicitly hands off to Razorpay.
- Donation acknowledgement and failure/recovery states redesigned.

**Status:** **Resolved in code.** Final release still requires live/test Razorpay workflow QA.

### 4. Impact was reduced to a few numbers
**Earlier problem:** metrics appeared without enough initiative context, media, evidence or narrative.

**Corrections:**
- Impact rebuilt as an evidence journey tied to published initiatives.
- Metrics remain attached to the initiative/cause they describe instead of being combined into unsupported totals.
- Approved documentary media can be rendered through the public-media gate.

**Status:** **Resolved in architecture, awaiting media population.**

### 5. About did not properly tell Amaana's story
**Earlier problem:** internal publishing/admin language displaced the human origin story.

**Corrections:**
- Rebuilt About around the documented 2020 family-led response, first 85 families, continuity and growth.
- Added timeline/story progression and handoff to verified Governance.
- Legal registration timing is kept separate from 2020 grassroots activity.

**Status:** **Resolved in code**, subject to final copy QA and approved historical media.

### 6. Public experience was too thin
**Earlier problem:** very few meaningful public destinations and little reason to explore.

**Corrections:**
- Added/rebuilt Our Work, flagship initiative experiences, Impact, Stories, Faith & Reflections, Get Involved, Appeals, Transparency, Governance, How We Verify, Compliance and policy journeys.

**Status:** **Resolved in structure.** Phase 6 will test page-to-page pacing and remove remaining repetition.

### 7. Assistance request was functional but not humane
**Earlier problem:** request page was essentially a heading and a form.

**Corrections:**
- Rebuilt the journey around privacy, dignity, review stages and clear expectations.
- Supporting files are described as private evidence, not public content.
- Receipt/tracking states were redesigned.
- Existing abuse/rate-limit/document protections remain intact.

**Status:** **Resolved in code.** End-to-end staging QA remains open.

### 8. Trust was asserted more than demonstrated
**Earlier problem:** verification, transparency and compliance were presented as generic text rather than evidence systems.

**Corrections:**
- Dedicated How We Verify experience.
- Transparency built around `Need → Support → Preparation → Delivery → Known outcome` and `Public evidence. Private proofs.`
- Governance uses verified DARPAN facts.
- Compliance separates FCRA, provisional 80G and unresolved 12AB/12A matters without guessing.

**Status:** **Resolved in code**, subject to final legal/CA review where required.

### 9. Risk of unverified / over-broad claims
**Earlier problem:** campaign histories, legal status, religious references and totals could easily be overstated when source material was incomplete.

**Corrections:**
- Eid evidence parser validates the approved 710-family total and fails closed on inconsistent data.
- Initiative copy is scoped to campaign/year-specific evidence.
- Faith content requires `VERIFIED` religious-review status before public rendering.
- No generic Zakat route/category is published without a verified eligibility basis.
- COVID relief is not given a standalone initiative until the source set supports one.
- Provisional 80G is explicitly not presented as permanent/final.

**Status:** **Resolved in architecture; ongoing source audit remains mandatory.**

### 10. Beneficiary privacy and dignity risk
**Earlier problem:** charity sites can easily turn private hardship, children, medical records or identifiable recipients into marketing material.

**Corrections:**
- Stories require publication status plus privacy approval.
- Media requires its own public flag and privacy approval.
- Children/Taleem and medical cases use stricter publication thresholds.
- Raw medical/identity/banking/supporting documents remain private.
- Graphic Qurbani/slaughter imagery is excluded from default public presentation.

**Status:** **Resolved in architecture; individual-media approvals remain open work.**

### 11. Authentic media was missing
**Earlier problem:** public pages had no documentary visual evidence.

**Corrections:**
- Added `MediaAsset` architecture and public-safe media renderer.
- Added separate public-media storage boundary and admin publication workflow.
- Original Eid and Qurbani documentary candidates have been inventoried; several other campaign pages are prepared for approved media.
- Model-generated imagery is excluded from documentary evidence slots.

**Status:** **Open / active Phase 5 blocker.** Architecture is complete, but selected originals still need storage configuration, approval and actual public rendering.

### 12. Official logo / brand asset not yet wired
**Earlier problem:** text fallback cannot substitute indefinitely for the real Amaana mark.

**Corrections:**
- Exact blue/gold brand palette and `Upholding Trust` language are reflected in the current system.
- The Library contains `Branding & Logo.zip`.
- The archive has been materialized, but the current runtime repeatedly times out while enumerating/extracting the ZIP.
- No cropped, redrawn or AI-recreated logo is being passed off as the official master asset.

**Status:** **Open.** Recover the isolated original logo before final brand certification.

### 13. Policies and error states felt like leftovers
**Earlier problem:** Privacy, Terms, Donation/Refund policies, 404 and failure states looked like generic utility pages.

**Corrections:**
- Dedicated editorial policy system added.
- 404 rebuilt as a branded recovery journey.
- Route and global error states rebuilt and CI-verified.

**Status:** **Resolved in code.**

### 14. Navigation / dead-end risk
**Earlier problem:** navigation did not expose enough of the public journey and some pages had nowhere useful to go next.

**Corrections:**
- Header/footer reorganized around visitor journeys, work, trust and participation.
- Most major pages now end with contextual next actions.
- Governance, Transparency, Appeals, Assistance and Get Involved are connected into the journey.

**Status:** **Partially resolved.** Full link/dead-end crawl is Phase 8.

### 15. Accessibility refinements
**Earlier problem:** accessibility had not received a dedicated release pass.

**Corrections already present:**
- Semantic sections/headings on rebuilt pages.
- Focus-visible styling across major interaction patterns.
- Reduced-motion handling in dedicated experience CSS.
- Form labels, alerts and useful input types/autocomplete.
- Public images require alt text before publication.

**New audit correction:**
- The previous skip link was visually parked at `left:-9999px` with no dedicated focus treatment. It has now been converted to a keyboard-visible skip link.
- `Get Involved` reused `.v2-intent-arrow` for long action phrases at `1.5rem`; audit refinement now treats these as compact action labels rather than giant arrow text.

**Status:** **Partially resolved.** Keyboard, screen-reader, contrast, touch-target and responsive testing remain Phase 7/8 work.

## What is currently safe to say is complete

- Core public information architecture.
- Dynamic initiative/story/faith/media content architecture.
- Privacy/publication gating.
- Appeals and donation journey structure.
- Assistance submission/tracking structure.
- Trust, compliance and governance architecture.
- Major initiative storytelling templates and flagship pages.
- Policy/error-state redesign.
- CI/build/test baseline for implemented batches.

## What must NOT be called complete yet

- File-by-file source/archive inventory.
- Final authentic-media population.
- Official isolated logo deployment.
- Whole-site creative recomposition after real media is present.
- Final accessibility/device/browser testing.
- Razorpay staging/live reconciliation.
- Assistance end-to-end staging validation.
- CA/legal final review of compliance/policy positions where required.
- Production indexing enablement.
- Production merge/release.

## Current audit conclusion

The earlier site-level failures have largely been corrected at the architecture, narrative and interaction-design level. The remaining release risk is no longer that the site is a thin generic shell; it is that a strong architecture could still ship before authentic content/media, final accessibility, payment/assistance workflow verification and independent visual QA are complete. Those items remain hard release gates.
