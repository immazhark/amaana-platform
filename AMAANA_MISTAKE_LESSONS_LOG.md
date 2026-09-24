# Amaana Foundation — Mistake & Lessons Log

Status: ACTIVE / APPEND-ONLY PRACTICE
Branch: `phase-public-site-rebuild`

Purpose: prevent known mistakes from being repeated as the rebuild grows. Every meaningful mistake, regression, incorrect assumption or process failure must be recorded with: what happened, why it happened, how it was corrected, and the permanent prevention rule.

A mistake is not considered learned from until the prevention rule is reflected in subsequent work.

## Permanent operating rule

For every future mistake or regression:
1. record the mistake here;
2. identify the root cause rather than only the symptom;
3. record the corrective change;
4. define a prevention rule or release gate;
5. check related pages/workflows for the same class of defect;
6. do not mark the issue resolved until the correction is verified.

## Lessons already established

### 1. Prematurely calling phases/pages complete
**Mistake:** Earlier work sometimes treated code completion or a green build as equivalent to a finished public experience.

**Why it happened:** Engineering completion was being used as a proxy for visual, factual, accessibility and workflow quality.

**Correction:** Rebuild audit, Phase 6 quality standard and Open Risk Register now explicitly separate implementation from certification.

**Prevention rule:** No public page or phase is called complete from CI alone. Final certification requires source/content review, brand review, visual/responsive QA, accessibility, performance, SEO, privacy/compliance and workflow verification where applicable.

### 2. Generic/early-framework public design
**Mistake:** The original public site felt like a sparse framework with generic hierarchy, little authentic media and weak Amaana identity.

**Why it happened:** Functional page construction preceded strong art direction, documentary storytelling and visitor-journey design.

**Correction:** `Living Amanah — Faith. Dignity. Action.` creative direction; two-Wow objective; dedicated page systems; editorial/asymmetric layouts; documentary-media architecture.

**Prevention rule:** Every public page must pass the Phase 6 senior UX questions. Reusable components may not force visual sameness. Design exists to create Wow 1 while revealing the real work for Wow 2.

### 3. Treating provisional brand colours as certified source values
**Mistake:** Documentation at one point called working blue/gold hex values official before the master branding archive had been successfully inspected.

**Why it happened:** Values observed/derived from supplied campaign material were promoted into source-of-truth language too early.

**Correction:** Brand documentation now treats current values as provisional/working until the isolated logo/source artwork is inspected.

**Prevention rule:** Visual inference never becomes a certified brand fact. Logo variants, source colours and production brand assets require direct inspection of the master branding source.

### 4. Risk of overstating archive/source review
**Mistake:** The project could have implied that archives had been fully reviewed despite ZIP enumeration/extraction failures.

**Why it happened:** High-level files and some retrievable assets were available while complete file-by-file inventory was not.

**Correction:** Phase 5 log and risk register explicitly distinguish inventoried material from inaccessible/unreviewed archive contents.

**Prevention rule:** Never say `reviewed everything` without real file-by-file inventory. Missing/inaccessible source remains a visible blocker rather than being filled from memory.

### 5. Fabricated location fallback on appeals
**Mistake:** Appeal UI previously used `Hyderabad` when beneficiary location was absent.

**Why it happened:** A visually convenient fallback silently became a factual claim.

**Correction:** Missing location now renders as `Location withheld` rather than invented geography.

**Prevention rule:** Fallback copy must never create facts. Unknown/private values must be represented as unknown, withheld or omitted.

### 6. Mechanically prioritizing the first Faith image
**Mistake:** The first Faith media item was briefly priority-loaded because it was the first item, despite appearing below the editorial body.

**Why it happened:** Media ordering was confused with viewport/LCP importance.

**Correction:** Faith gallery media returned to lazy loading.

**Prevention rule:** Eager/priority media is determined by actual above-the-fold placement and LCP value, never array position.

### 7. React mobile-menu state reset via effect
**Mistake:** The first route-change menu implementation synchronously called `setState` inside an effect, triggering a CI/lint failure.

**Why it happened:** Route-change behavior was implemented imperatively rather than deriving state from pathname.

**Correction:** Open state became pathname-aware; route navigation naturally closes the menu without effect-driven state reset.

**Prevention rule:** Prefer derived state over effects for values that can be expressed from current props/router state. Never suppress a valid lint warning to preserve a flawed pattern.

### 8. Mobile menu focus was not fully managed
**Mistake:** A menu could close while keyboard focus remained inside content that became hidden.

**Why it happened:** Visibility/ARIA behavior was corrected before focus lifecycle was fully audited.

**Correction:** Opening transfers focus into the menu; Escape closes and returns focus to the toggle.

**Prevention rule:** Any show/hide interaction requires a keyboard focus-entry, focus-exit and Escape/recovery review, not only `aria-expanded`/`hidden` semantics.

### 9. Global `overflow:hidden` risk
**Mistake:** The v2 public shell used broad overflow hiding, potentially masking vertical focus outlines, sticky elements or long-content behavior merely to suppress horizontal overflow.

**Why it happened:** A layout containment shortcut was applied too broadly.

**Correction:** Horizontal-only clipping/refinement and explicit focus/anchor behavior were introduced.

**Prevention rule:** Never use broad overflow suppression as a substitute for finding the element causing overflow. Responsive QA must inspect the root cause.

### 10. Checkout route cache-control gap
**Mistake:** `/donations/*` had private/no-store headers, while the actual `/donate/*` checkout route was not covered by the same explicit response policy.

**Why it happened:** Similar route names caused an incomplete security/cache boundary.

**Correction:** Checkout responses are explicitly private/no-store.

**Prevention rule:** Security/privacy controls must be mapped to real route inventory, not inferred from naming. Phase 8 must crawl every sensitive route class.

### 11. Request Assistance sitemap parity gap
**Mistake:** Request Assistance had indexable metadata but was absent from the public sitemap.

**Why it happened:** Metadata and sitemap coverage were improved in separate passes.

**Correction:** The legitimate public assistance-intake route was added while private receipt/status routes stay excluded.

**Prevention rule:** Final SEO QA compares actual public route inventory against canonicals, robots, sitemap and indexing intent as one matrix.

### 12. Stale execution documentation
**Mistake:** The main execution log still described Phase 6/7 as pending after those phases were actively underway.

**Why it happened:** Implementation moved faster than durable status documentation.

**Correction:** Current checkpoint/status was refreshed; risk and implementation logs were introduced.

**Prevention rule:** At every meaningful checkpoint, update durable execution state before declaring phase progress. Stale docs are treated as a project risk because they can cause duplicate or skipped work.

### 13. Public-media upload can orphan storage objects
**Mistake/risk:** Validation-before-upload was improved, but a successful object upload followed by a failed DB create can still leave an orphaned object.

**Why it remains:** Storage and database operations are not transactional together.

**Current correction:** Recorded explicitly in the risk register instead of pretending the upload lifecycle is fully hardened.

**Prevention rule:** Add compensation/cleanup before high-volume use; do not call media storage lifecycle complete until failure cleanup is verified.

### 14. Video rendering is not the same as video accessibility
**Mistake/risk:** A labelled `<video controls>` element could be mistaken for a complete accessible video experience.

**Why it matters:** Meaningful video may require captions/transcript support not represented by current media data.

**Current correction:** Video accessibility remains a publication/release gate.

**Prevention rule:** No meaningful video content is certified accessible merely because native controls work. Captions/transcript strategy must be reviewed before publication.

### 15. Legacy green design tokens survived beneath the V2 layer
**Mistake:** The legacy global stylesheet still defined the public primary system with generic NGO green tokens and green-tinted gradients even after the Amaana blue/gold V2 system had been introduced.

**Why it happened:** New experience CSS visually overrode many public pages, but the underlying global shell/admin/shared components were not re-audited as one complete token system. This allowed an old design language to remain available and potentially leak into untouched states or components.

**Correction:** The final global refinement layer now remaps the shared legacy tokens and remaining shared public gradients to the current Amaana working blue/gold/deep-ink/editorial-neutral system. Reduced-motion handling was also extended to disable global smooth scrolling when the user requests reduced motion.

**Prevention rule:** A redesign is not complete while old brand tokens remain active underneath it. Every design-system migration must audit root variables, generic components, empty/error/admin/shared states and hard-coded legacy colours—not only the newly redesigned pages. Final brand values remain provisional until master artwork is directly verified.

### 16. Narrow-screen refinement briefly reduced the established button height
**Mistake:** During the narrow/reflow hardening pass, a mobile override briefly changed shared buttons from the established `3rem` minimum height to `2.75rem`.

**Why it happened:** The reflow pass focused on fitting content into very narrow viewports and changed a size that did not need to be reduced.

**Correction:** The next commit immediately restored the full `3rem` minimum touch target before the batch was certified.

**Prevention rule:** Reflow must solve width, wrapping and spacing problems without shrinking established interactive target sizes. Any responsive override touching buttons, links, toggles or inputs must be checked against the interaction-size baseline before it is retained.

## Cross-project prevention checklist

Before closing any future batch, ask:
- Did we introduce or infer any fact not supported by source?
- Did we confuse code completion with user-visible certification?
- Did we preserve privacy/publication/religious/compliance gates?
- Did we introduce a responsive or focus issue to achieve a visual effect?
- Did we optimize based on assumption rather than actual viewport/data use?
- Did metadata, robots, sitemap and route intent stay aligned?
- Did security/cache controls cover the real route, not a similarly named route?
- Did documentation remain synchronized with implementation?
- Did a fix address the same class of issue elsewhere, not only the reported instance?
- Is the new state actually verified, or only implemented?
- Did any legacy design token, copy pattern or interaction survive beneath the new system and create a future leak path?
- Did a responsive change preserve established touch targets rather than trading usability for fit?

This file should grow when we learn something new. Repeating a documented class of mistake without checking this log is itself a process failure.


### 17. Successful builds shipped corrupt campaign photography
**Observed:** On 13 September 2026, all three campaign-photo placements on the rebuild homepage had zero decoded dimensions, while the SVG logo loaded. The committed JPEG/WebP campaign files were approximately 15 KB and were not valid images.

**Cause boundary:** The deployed files contained invalid image bytes. The mechanism that originally produced those bytes has not been established. Existing CI validated code and selected HTTP routes, but did not decode public media.

**Correction:** Download the two exact user-approved Drive originals through the authenticated browser; visually inspect campaign labels; preserve aspect ratios; generate real JPEG/WebP files; verify complete decoding and compare locally calculated Git blob hashes with upload responses before updating the branch. See `AMAANA_MEDIA_REPAIR_2026-09-13.md`.

**Prevention:** CI now rejects invalid raster images, extension mismatches and truncated data using full decoding. Validator regression tests cover valid, mislabeled, corrupt and truncated fixtures. A successful deployment still requires browser verification that actual campaign photographs have nonzero decoded dimensions and acceptable crops; green CI alone is not visual certification.

### 18. Reviewed archive imports accidentally competed for featured placement
**Mistake:** The reviewed-campaign importer forced every imported historical edition to `isFeatured: true`. Once the archive grew to many annual Eid, dates, meat and assistance records, those records could compete with flagship initiatives for featured hero/discovery placement and flatten the intended hierarchy.

**Why it happened:** The first import batch was small, so `isFeatured: true` looked harmless. The same default was then reused as the archive expanded, even though “published evidence record” and “featured programme” are different editorial concepts.

**Correction:** New reviewed imports now default to non-featured unless a campaign explicitly opts in. Existing preview records are normalized through a source-guarded startup pass that only clears the feature flag when the published record still matches the reviewed campaign summary; editorially changed or archived records are left untouched. CI now tests this normalization behavior.

**Prevention rule:** Publication status and editorial prominence must never be coupled by default. Importers should preserve discoverability without promoting every record into primary navigation/hero hierarchy, and any startup correction of existing content must be source-guarded so it cannot overwrite subsequent editorial work.


### 19. Route activation exceeded the aggregate CSS budget

**Mistake:** The dignity-led Request Assistance refinement was committed in one step and activated in the next, but activation pushed aggregate production CSS 2,537 bytes above the enforced 256 KiB budget.

**Why it happened:** Route-scoping prevented the styles from burdening unrelated pages, but aggregate build output was not measured before the new layer was activated. Repeated colour selectors and low-value decorative motion consumed budget without adding equivalent visitor value.

**Correction:** The layer was consolidated in measured passes. Repeated selectors and decorative duplication were removed while retaining the asymmetric hero, Amaana palette, form-stage differentiation, trust hierarchy, mobile behaviour and reduced-motion safeguards. CI #444 passed on `242bfb02` without relaxing the budget.

**Prevention rule:** A new route-scoped experience layer must be judged both by route isolation and aggregate compiled output. Preserve interaction, hierarchy and accessibility first; remove redundant declarations and autonomous decoration before considering any budget change.
