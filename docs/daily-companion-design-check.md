# Daily companion scoped design check

Documentation finish handoff, 2026-09-14. Scope: the reminder strip and two companion panels in `src/components/islamic-companion.tsx` and `src/app/islamic-companion.css`. Evidence: those source files, `PRODUCT.md`, `docs/daily-companion.md`, and the independent `docs/daily-companion-review.md`. This is a source-based documentation check; browser observations below belong to the independent reviewer, not this pass.

## Overview

The implementation extends the stated Amaana identity: deep teal/ink, warm light surfaces, serif reading headings and restrained gold focus outlines. The reminder strip and labelled reading/prayer dock leave campaign imagery as the page's primary subject. PRODUCT.md's official-logo and established-identity commitments remain the authority; this widget introduces no replacement visual world or shipping raster asset.

These are scoped implementation notes, not a global design specification. Missing root DESIGN.md and token/sidecar documentation are pre-existing documentation gaps, not evidence that the site needs a new identity. They are recorded without creating or repairing global artifacts. No broader visual drift conclusion is possible from this bounded inspection.

## Colors

The observed reading ink is `#203b43`; primary controls and the next-prayer block use `#173e47` against `#fffaf0`, with `#285763` for hover/expanded controls. The reminder surface is `#f4efe3`, the panel `#fffcf5`, and the select `#fffdf8`. Warm borders include `#d4c9b4` on the panel and `#ded5c5` between reading sections. Underlined source links use `#234e67`; secondary notes use `#50605c`. Gold focus is `#8f691e`, while selection uses `#d9c18b`. Errors use `#853b26`, and the next timetable row uses `#164f42`. These literal stylesheet values document this extension; they are not newly declared site-wide tokens.

## Typography

Utility text and controls inherit the site's font family. Georgia with serif fallback gives the panel heading 28px/1.15, the translation 20px/1.55, hadith title 22px/1.3, Hijri date 25px/1.35 and next-prayer value 27px/1.3. Panel paragraphs are 15px/1.65; notes are 12px/1.55. The panel heading reduces to 26px on mobile. Prayer rows use tabular numerals.

Arabic is marked `lang="ar"` and `dir="rtl"`, right aligned, with the declared stack Noto Naskh Arabic, Traditional Arabic, Geeza Pro, serif at 30px/1.95 and weight 400. This records a font stack, not a claim that every device loads the first family. Attribution, excerpt labels and hadith meaning-summary labels remain visible reading content.

## Layout

The reminder interior is capped at 1320px, with 14px 32px padding, 28px flex gap and an 82ch content maximum. Its controls have a 6px gap. The schedule uses two columns and an 18px by 32px gap.

The dock sits above the bottom safe area, with a minimum 16px bottom offset, 20px right offset and 8px gap. The desktop panel is at most 440px wide, with 24px padding, a maximum height of `calc(100dvh - 112px)`, vertical scrolling and contained overscroll. Its bottom is 60px above the dock's bottom offset. Panel and dock stacking levels are 1100 and 1099. Body bottom padding reserves 80px plus the safe-area inset for footer access.

At 640px and below, reminder padding becomes 14px 18px, the content and controls wrap to full width, and the schedule becomes one column. The dock is centered between 12px side offsets. The corrected local panel rule is `width: calc(100% - 24px)` with right 12px and padding 22px. This implements the review's P3 scrollbar-gutter recommendation; this documentation pass does not claim a new rendered spot-check.

## Elevation & Depth

Warm surfaces and thin dividers organize reading content. The fixed dock has shadow `0 6px 22px #122e3926`; the panel has `0 18px 60px #102e3940`. These shadows distinguish floating controls and the open panel from the charity page. No animation or decorative raster is added by the widget.

## Shapes

The panel radius is 14px; dock buttons and next-prayer block use 8px. Action, reminder and close controls use 6px; the select uses 5px. Panel and control borders are 1px. The icons are inline 20px SVGs with 1.7 stroke width, not raster assets requiring provenance.

## Components

Two separately labelled buttons open one nonmodal, scrollable region at a time. Opening focuses the region; Escape and the close button restore focus to its trigger without scrolling. The close target is 44px square; primary actions and the select have a 44px minimum height. Dock buttons have 48px minimum height, reducing to 46px on mobile. Reminder buttons reduce from 44px to 36px on mobile; this is an observed compact treatment, not a global target-size prescription. Focus-visible uses a 3px gold outline with 4px offset. Source links remain underlined.

Reminders start still. Auto-play explicitly enables a 14-second interval; pause, hover, focus, an open schedule or panel, a hidden document and reduced-motion preference suppress rotation as implemented. The strip has `aria-live="off"`; loading and copy feedback use status roles, and timing failures use an alert with retry. Source links, optional details, a native Asr select and the copy action support the primary reading/prayer tasks. Print hides the companions and reminders and removes reserved body padding.

## Evidence and unresolved input

The independent review approved the scoped preview with its calendar estimate after inspecting 1440×960, 390×844 and 320×844 presentations, panel interactions and a natural midnight reading transition. It identified only the nonblocking mobile gutter issue documented above. Its verdict applies to the reviewed build; its explicit test limitations and historical finding remain in the review rather than being rewritten by this handoff.

Hyderabad local moonsighting remains unresolved. The direction contract reports no verified production announcement. The component truthfully labels the fallback “Calculated estimate · Hyderabad moon-sighting not yet confirmed,” identifies the fallback as tabular Islamic Civil, and distinguishes civil-day fallback from Maghrib rollover when prayer times are available. A verified, dated local authority announcement is still required before claiming local confirmation. This documentation check does not authenticate a religious source or turn a computed date into an observed one.

Documentation disposition: the scoped visual facts and inheritance are captured, with no material discrepancy from the stated existing-world direction found in these files. This does not replace deployment verification, the independent visual verdict, or the pending local announcement.
