# Companion panel audit — 2026-10-03

Scope: expanded shared Companion panel; retain fixed bottom-right dock, approved visuals, content and prayer/date calculations.

## Confirmed findings

- P1: panel labels reference missing tab IDs; arrow/Home/End keys do not activate tabs, and both tabs are in the sequential Tab order.
- P1: mobile panel height ignores its raised dock offset, allowing the top/title/close control to extend behind the sticky header. Reproduced at390×844; short900×320 also obscures the header.
- P2: tabs measure40.8px, below the project's44px touch-target contract. Source actions need consistent44px targets.

Scoped CSS now bounds the panel between sticky chrome and the existing dock. Normal-height panels retain their header/tabs and flex the scrolling content; short windows scroll the entire panel so all controls remain reachable. Mobile/tablet clearance also accounts for the dock's actual height and focus transform. The dock remains fixed bottom-right.

Tabs now have valid IDs and a shared labelled content panel, one sequentially focusable active tab, two-direction wrapping and Home/End activation. The content panel is keyboard focusable. Static icon rendering, an unused immutable reminder state and unnecessary delayed focus restoration were simplified to retain unchanged size caps. Prayer/date validation, source text, API fetch behavior, live-rail timing and publication rules remain unchanged.

## Verification

Fourteen responsive tests cover320/390/768/900/1024/1440/1920px at320/900px height: panel/header/dock bounds,44px controls, accessible labels/control IDs, arrow/Home/End keyboard behavior, real Tab order, retry error states, final reading reachability, scoped WCAG A/AA axe checks, Escape focus restoration and retained fixed positioning. Existing navigation resilience coverage also runs.

Initial local failures were classified: stale generated chunks/old component output required a clean build; test alert selection also matched Next's route announcer and was scoped to the actual panel; real subpixel tablet dock overlap was corrected with additional clearance. No failed application assertion was suppressed.

Fresh production build: JavaScript819181/819200 and CSS347670/348160 bytes, caps unchanged. CI planner has22 passing regressions, preserving full acceptance for public companion API/core changes and production releases. Types/lint pass with one pre-existing import warning; two dead-ref warnings are removed. Detector emitted no findings before final static-icon simplification.

## Delivery

Final local25 Companion/navigation tests pass in39.9seconds;392 units pass with six database-dependent skips. Desktop/mobile confirmation screenshots show labelled44px tabs, visible close/header controls and reachable final actions. Exact PR/CI/merge and Railway/live confirmation pending. This targeted audit does not certify every page or every browser/device combination.
