# Follow-up UI audit — 2 October 2026

Base: f5458a98188fb8deed78b07a6fad0191453c1d9c. Task: fix/ui-followup-audit-20261002.

## Confirmed findings and changes

- P2 Request Assistance Before/After sections: late assistance-wow background shorthand replaced the approved artwork but inherited the shared 240px/104px tiling sizes. Deployed computed styles showed two repeated gradients; desktop screenshot showed checkerboard bands. Before now has the approved lattice over a non-repeating full-size navy gradient; After uses the approved body utility. Removed the obsolete route background declarations.
- P2 Before you begin introduction: old bespoke grid/heading bypassed the approved shared SectionHeading. Replaced it with the shared left title/right subtitle, with a stacked mobile layout and unchanged privacy copy. Removed obsolete heading-size/grid overrides.

## Inspection and validation

Browser access restored. Deployed Contact, Impact, Faith, Our Work, assistance received/tracking and Request Assistance inspected. Prior audit's corrected state foreground, Contact/Faith patterns and evidence closing backgrounds/layouts are present. No horizontal overflow at the current desktop viewport. Ten additional public routes scanned for the same repeated-gradient defect: Donate, Get Involved, About, How We Verify, Transparency, Compliance, Privacy, Refund Policy, Stories and Appeals; none showed it.

Build, TypeScript and lint pass (three unchanged lint warnings). All18 CI planner regressions, master-copy/editorial checks, six approved SVG hashes, global CSS guard and diff checks pass. Impeccable detector returned no findings for changed UI. Built JS819087/819200 and CSS344667/348160; budget caps unchanged.

Initial local Chromium validation was infrastructure-blocked by missing runtime and full Chromium socket permissions. Installing the pinned headless runtime resolved this. All14 local checks pass: six responsive/full-page axe cases and eight private assistance journeys. Desktop/mobile production captures inspected. Six new seeded regression cases cover320/390/768/1024/1440/1920, continuous background layering, heading geometry, no overflow and full-page axe. CI also retains the existing transactional journeys, banner/typography and performance suites. Unknown/API/core/shared and production-release changes still select broad verification.

## Delivery

PR130 merged as 2044bf97364674e89c9fe558ea6808999d49892b. CI37047981721 SUCCESS:62 Chromium cases passed first attempt in2minutes,392 units pass (six database-dependent fast skips). Integration push37048619969 SUCCESS; exact-tree browser acceptance reused. Railway7ee3334c-dbf2-45a1-81d3-83217b0c4cb7 SUCCESS on exact merge SHA. Live desktop DOM/screenshot confirms corrected layering, shared heading, approved After background and no horizontal overflow; six-width coverage is local/seeded CI. Main promotion remains protected. No factual/media/payment/indexing behavior changed; fixed Companion retained. Authenticated staff states are outside this public audit.
