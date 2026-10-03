# Curated Media & Carousel Contract — 21 September 2026

This document is the binding implementation contract for programme/drive imagery after the legacy media reset.

## 1. Core rule

Amaana programme photography is curated, not discovered heuristically.

Every programme/drive that receives public photography must have:
- exactly one deliberate **identity / hero image** when a suitable image exists;
- zero or more ordered **supporting images**;
- publication metadata that passes the existing privacy, consent, provenance and website-channel gates.

Do not restore the deleted legacy programme-image pool merely because older files remain in Git history.

## 2. Identity image contract

The current schema uses the reserved media order:
- `IDENTITY_MEDIA_SORT_ORDER = -1000` for the single identity image;
- supporting images use non-negative `sortOrder` values.

The admin workflow enforces replacement semantics: assigning a new identity image to the same content target demotes the previous identity image instead of allowing competing heroes.

An identity image may not be published without explicit **Hero use approved** confirmation in the structured media review.

## 3. Surface mapping

### Homepage full-width flagship carousel
- This is the permanent homepage masthead and must render as a full-bleed, cinematic editorial carousel rather than falling back to a static PageHero.
- Slide 1 is always **The Story of Amaana**: a concise origin-to-present glimpse linking to `/about`. It must distinguish the grassroots Ramadan 2020 beginning from later formal organisation/registration.
- Subsequent slides highlight major Amaana initiatives using their approved identity images, documented summary/metric and direct programme link.
- Curated initiative photography progressively enriches the carousel; absence of enough reviewed photos must not remove the carousel or the Amaana-story slide.
- Keep the visible set deliberately curated rather than exhaustive. The homepage should feel like a flagship editorial showcase, while `/our-work` remains the complete programme portfolio.
- Controls must support touch/swipe, keyboard and explicit previous/next navigation. Motion must respect reduced-motion preferences.
- Initiative slides may not use unreviewed/random legacy images. The Story of Amaana slide may use a designed Amaana visual treatment until a specifically approved story/heritage photograph is available.

### Homepage programme strip
- Uses one identity image per programme area when available.
- Remains a compact horizontal discovery strip.
- Uses designed placeholders while curated media is absent.

### Programme / drive detail hero
- Uses the programme’s single identity image.
- Do not rotate arbitrary supporting gallery images through the hero.
- The hero remains the programme’s stable visual identity.

### Parent programme histories
- Each annual/child programme card prefers that child record’s identity image.
- Histories longer than three records use the compact card carousel to reduce page length.
- Short histories remain ordinary grids.

### Programme gallery
- Uses supporting public images after excluding the identity image and any separately rendered data/highlight visual.
- Ordered by explicit supporting-image order.
- Horizontal carousel plus existing lightbox.
- Captions/alt text describe visible/documented content; do not infer undocumented circumstances.

### Our Work / Impact / supporting discovery surfaces
- Prefer the explicit identity image.
- Never select a “random first file” when an identity image exists.
- Designed placeholders are preferable to unreviewed or unrelated photography.

## 4. Upload sequence when curated files arrive

For each programme/drive:
1. Upload only the selected curated files.
2. Attach every file to the correct initiative/drive record.
3. Mark one photograph as **Identity / hero image**.
4. Add factual alt text.
5. Add caption only where it adds documented context.
6. Record source reference and source year.
7. Give supporting images explicit non-negative display order.
8. Complete privacy/consent/provenance review.
9. For the identity image, explicitly approve hero use.
10. Publish only after the gate passes.

No page-layout code change should be necessary for ordinary curated-media insertion.

## 5. Carousel interaction contract

All Amaana website carousels are:
- manual;
- swipe/trackpad scrollable;
- keyboard operable;
- reduced-motion aware;
- non-autoplay;
- horizontally contained so the document itself does not overflow.

Reading-heavy content such as verification explanations, governance/accountability text, policies and programme story prose remains linear and must not be hidden in carousels merely to shorten pages.

## 6. Final media QA after upload

Once real curated photography is supplied, verify:
- desktop, tablet and mobile crop/object-position;
- image-overlay contrast on each actual photograph;
- hero text does not cover essential subjects;
- slide order tells a coherent story;
- gallery order is visually varied rather than repetitive;
- no duplicate or near-duplicate frames;
- no private proof or unapproved beneficiary imagery;
- keyboard, touch, focus and lightbox behavior;
- 200% zoom/reflow;
- reduced-motion behavior;
- LCP and image loading priority for the first visible banner/hero image.

## 7. Current empty-state baseline

As of 21 September 2026:
- current staging branch contains no legacy programme image files;
- staging database contains no programme IMAGE MediaAsset records from the deleted pool;
- three legacy MP4 files/records remain outside the image-reset scope;
- the full media/carousel structure is ready for curated insertion.
