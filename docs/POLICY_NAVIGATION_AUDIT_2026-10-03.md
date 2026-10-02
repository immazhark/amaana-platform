# Policy navigation and accessibility audit — 3 October 2026

Base e81ba99fef5455f8d065853993d5e2b8adc4e6d6. Branch fix/policy-navigation-20261003.

## Confirmed defects and corrections

- P2 Native policy anchors scrolled article headings under the sticky header. Deployed Privacy #policy-03 settled at article -0.44px/heading47.56px while the header ended at81px. Shared policy articles now use a scroll margin derived from the existing chrome-height token, leaving a reading gap.
- P2 Contents links were approximately30.28px tall and legacy descendant sidebar-link styles imposed max-content width/underline on the nested contents navigation. Scope those sidebar rules to direct links. Shared contents now has full-width grid rows,44px minimum targets, readable14px type, brand contrast and opaque keyboard outline. Real Tab traversal verifies focus-visible.
- P2 Long desktop contents could exceed a short viewport. Shared sidebar now has a viewport-relative maximum height and vertical scrolling; nested sticky navigation removed. Page and contents responsive breakpoints both use900px.
- P2 The sr-only class had no CSS definition. Privacy exposed an unintended unstyled accessibility heading; the navigation loader and private notification label used the same missing utility. Restored the standard shared nonvisual utility in accessibility.css: clipped1px content remains in the accessibility tree. No labels, legal copy, privacy or loader logic removed.

## Verification

Nine local Chromium tests pass in26.5seconds: four actual policy routes at320/390/768/1024/1440/1920 (24 page/viewport combinations, all full-page axe audits), native keyboard and direct-fragment jumps, short1440x600 contents reachability, and delayed navigation at390/1440 with accessible nonvisual loader labels and restored body scrolling. Desktop/mobile captures inspected; no horizontal overflow. The first policy test used programmatic focus rather than keyboard modality and failed two focus assertions; corrected to genuine Tab traversal, with no requirement relaxed.

Production build, types, lint (three existing warnings),20 CI planner regressions, master/editorial consistency, global CSS guard, detector and diff checks pass. JS819087/819200; CSS345331/348160. No cap increase or application JavaScript change.

Policy-only paths have explicit focused coverage. This batch also corrects the shared global accessibility foundation; it correctly retains full browser/database/cross-browser acceptance. Unknown/API/security/global paths and production releases remain fail-closed.

## Delivery

Publication, exact-head CI, integration merge/build and Railway review deployment pending. Main/production promotion is protected. Private staff-record states were not opened; the shared CSS correction applies to their existing nonvisual label without changing record/permission/action behavior. Approved artwork, canonical content/factual locks, media/privacy/payment/indexing and fixed Companion remain intact.
