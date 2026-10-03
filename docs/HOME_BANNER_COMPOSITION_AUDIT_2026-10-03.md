# Homepage banner composition — 2026-10-03

Owner requested the standard small label, large title, full subtitle and CTAs in a cinematic homepage carousel: copy left, approved image right fading toward the copy; enlarge the unmodified Amaana logo and softly blend its background.

## Delivered behavior

- One shared server component renders all story, appeal and featured initiative banners using canonical PageHero typography/actions. One semantic homepage H1 remains, with each slide title an H2. Full subtitles replace the old line clamp and extra competing tagline/metric blocks.
- Homepage title reaches 64px, above the 56px body cap. Desktop Amaana mark reaches 480px. Its former hard circular panel is replaced with a radial fade; the logo SVG itself is unchanged.
- Approved identity imagery fills the right side and masks toward the left; mobile stacks the visual beneath text with a vertical fade. Published featured slides remain present with approved brand fallback when identity imagery is pending. The live homepage currently has story plus two featured slides, all brand fallback; no documentary gallery is promoted to identity media.
- Existing seven-second carousel, keyboard controls, next/previous, pause, reduced-motion handling and inactive-slide accessibility remain. Fixed Companion, canonical destinations, approved geometric background and factual copy preserved. No new client library or data query.

## Validation and delivery

PR150: head3ecc6b492350bc2cc0053e569917fd88967bb3de; merge7a471eb141b248b000ea73cfff5702cb0c2c43cd. Exact local/remote/tested/merged treee5994a3f18163b3b864daf5076f99678352057fb.

Clean local build/typecheck/lint pass (one existing unused importer warning). All six approved background hashes unchanged. Twenty-five planner regressions pass; final complete diff selects seven focused dependency suites and skips release, cross-browser and database acceptance. Shared/core/security/unknown changes still fail closed to full acceptance.

Final CI37137587817 SUCCESS:112 first-attempt Chromium checks in2.3minutes, including all published slides at320/390/768/1024/1440/1920px, full copy visibility, heading hierarchy, image masks, keyboard/playback controls and existing affected route regressions. Mobile/desktop axe and screenshots inspected locally. Old homepage v3-btn acceptance selector and its foreground expectation were updated to canonical PageHero styling; final suite has no retry/flaky failures.

Integration37137964849 SUCCESS reuses passed PR browser acceptance while building and checking server smoke and performance budgets. Built JS819181/819200 and CSS344401/348160; caps unchanged. Local clean JS817826/CSS344401; production environment generates a slightly different JS aggregate.

Railway2a7bbb9a-f7ba-4a95-9122-a27c7626bc58 SUCCESS on exact merge. Live three-slide controls verified, all copy fits, title64px/logo480px, geometry present, no desktop horizontal overflow, Companion fixed. Deployed homepage screenshot inspected. Main and protected draft PR104 unchanged. No whole-site defect-free claim.

## Policy separator task completed in the same session

PR149 mergedf015aa3fa5705c1f20e99c34c6ae5072a44484a2; CI37134716223 SUCCESS with56 first-attempt browser checks. Integration37135066159 and Railwayec2230d5-1a39-49d3-9ca7-6b5b2da444aa SUCCESS. Generalized the existing Donation Policy last-child border:0 exception to all principles: Terms, Privacy, Refund and Donation each verify live borders1px,1px,0px. Content, approved backgrounds, interior dividers and responsive behavior preserved.
