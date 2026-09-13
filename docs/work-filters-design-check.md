# Our Work filter design check

Scoped source check for `598c9a8`: `src/app/our-work/page.tsx`, `work-filters.css`, and `src/lib/work-filters.ts`.

The extension preserves the existing v2 shell, headings, initiative rows, button styling and public-media rendering. Filters use inherited typography, ink `#203454`, white selects and blue `#2f4c7a` focus/link treatments. The wrapping row has 20px gaps and 24px vertical padding; labels stack below 600px with 16px gaps. Selects, submit and reset controls have 48px minimum heights. Focus outlines are 3px with 4px offset.

Explicit Programme and Year labels accompany native selects in a GET form. Programme/year query parameters make filtered URLs shareable; the results anchor reserves 120px header clearance. Active filters hide the featured story, show the matching count and expose Clear filters. Empty results explain recovery; invalid or repeated parameters return no matches. No new raster assets were introduced. Filtering consumes the existing public data projection and preserves PublicMedia rendering; it adds no privacy bypass.

Four helper tests, ESLint, CI 34787324992 and preview deployment 55fdccec-4760-4656-bdb0-9b100f44bc3a passed. Root verified desktop/mobile controls, submitted selected values, two matching records, invalid-year zero results, and Clear filters returning both controls to All and two records. At 390px the document was 375px wide and selects were 48px high. Independent review was source-only with no blockers; browser verification was by root. No global identity change was introduced.
