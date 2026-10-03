# Homepage image edge blend and controls — 2026-10-04 IST

State: `CODEX_ACTIVE`. Branch `fix/home-carousel-edge-blend-20261004`, base f894b07d9395347d67577944538ebc9c9eb7af3e. Three owner screenshots inspected: feather the right/bottom photo edges into the original banner gradient, refine previous/next/play controls into translucent circular surfaces. CSS-only implementation; preserve programme content, image crop/edge position, backend, keyboard/swipe/pause behavior and original gradients/lattice. Focused existing banner/a11y/typography CI and unchanged asset budgets. Main/production PR104 protected.

---

# Dynamic homepage carousel — 2026-10-03 IST

Ownership `IDLE`. Delivered PR152, tested head `9ef0f45ed0bd2bc1ca9fecc92f62640899effdf9`, merge `4d87df7c57eaaab070697fd1244193f9b7c63797`; tested/local/remote/merged tree `5a6493c8e80556bb46969f754f894fd88dab92c2` identical. Final PR CI37145322111 SUCCESS:745 Chromium checks in10.5minutes and24 Firefox/WebKit smoke checks in26.2seconds;414 units and isolated PostgreSQL migration/persistence/revision/rollback checks pass. First core run had736 passes/nine superseded banner expectations; updated assertions preserve gradient/image/edge/fade/grid/overflow/height requirements, final run no retries/flaky failures. Integration CI37146239534 SUCCESS, duplicate browsers correctly skipped; production JavaScript810705/819200 and CSS348088/348160 bytes, unchanged limits.

Railway review deployment `a86daec7-eb42-4992-9e30-ab6d94a16c49` SUCCESS on exact merge. Startup applied20261003180000_home_carousel successfully. Live https://amaanafoundation.org/ confirms five programme slides in requested order, loaded collage images, working dots/pause, original gradient/lattice, right media edge equals shell edge1266px at1363px viewport,60.8px header title, centered controls and no horizontal overflow. `/admin/home-carousel` redirects unauthenticated visitors to `/admin/login`; no signed-in live editor mutation is claimed. Admin action permission/revision/audit guards and persistence validated through unit/isolated database checks. Live has no open public appeal; automatic insertion/removal is verified through tests, not a fabricated live appeal. Responsive/mobile proof is local/seeded CI; cloud live proof desktop only. Final deployed screenshot saved. Five AI-assisted collage derivatives remain separate from original programme photographs, with provenance and meaningful alt text.

Main remains `1a69dd179181390a488623accf1314a1ff09e319`; PR104 remains open/draft (its integration head naturally follows the new merge). No production launch/payment/email/indexing promotion. Next: owner reviews deployed carousel; admin staff use Home carousel to manage slides. New confirmed defects use a separate atomic branch. Documentation closure branch `docs/home-carousel-delivery-20261003`. No whole-site defect-free claim.

---

# Homepage banner composition — 2026-10-03 IST

State: `IDLE`. Delivered PR150, tested head3ecc6b492350bc2cc0053e569917fd88967bb3de, merge7a471eb141b248b000ea73cfff5702cb0c2c43cd; identical local/remote/tested/merged treee5994a3f18163b3b864daf5076f99678352057fb. CI37137587817 SUCCESS:112 first-attempt Chromium checks in2.3minutes and392 units pass (six database-dependent fast skips). Integration37137964849 SUCCESS, duplicate browser/database skipped. Railway2a7bbb9a-f7ba-4a95-9122-a27c7626bc58 SUCCESS on exact merge. Live three-slide carousel, next/previous/pause, full subtitles,64px header title versus56px body cap,480px logo, continuous geometry, no desktop overflow and fixed Companion verified. Right-side approved identity-image fade implemented; current two featured slides have no approved identity header photos and use brand fallback. Six-width fit plus mobile/desktop axe passed. Shared React server-rendered banner composition; no new client library/database call. Production JS819181/819200,CSS344401/348160, caps unchanged. Updated stale legacy-button acceptance to canonical button foreground and selectors. Protected main/PR104 untouched. Policy separator PR149 also deployed/live verified on all four policy routes. See HOME_BANNER_COMPOSITION_AUDIT_2026-10-03.md. Next: owner reviews deployed homepage; only new confirmed defects require a new task branch.

---

# Policy trailing separator — 2026-10-03 IST

State: `IDLE`. Completed PR149. Historical task: branch `fix/policy-trailing-separator-20261003`, base ddbd4d9181c33d806d51746a6f46f7a5c9ace27e. Three owner screenshots show the trailing vertical rule after the third policy principle on Terms/Privacy/Refund. Donation Policy already suppresses it; generalize that existing shared rule to every policy page. Preserve internal dividers/content/backgrounds/responsive layout. Focused existing CI plus desktop/mobile border inspection; main/PR104 protected.

---

# Participation and Appeals pattern correction — 2026-10-03 IST

State: `IDLE`. Four owner screenshot corrections complete through PR146 and corrective PR147. Final head946d82652b52a0d68f5179f886b6bbc8a0d179ba, mergec4309f3f9b664f800e76046a0838d2364e4d9b08; local/tested/remote/merged tree48ab227d530fb03fa7531369550e35664525449b identical. Final CI37128498341 SUCCESS:134 Chromium first-attempt checks in1.8minutes;392 units pass with six database-dependent fast skips. Integration37128803878 SUCCESS; duplicate browser/database skipped. Railway reviewd2a78709-6a93-44cb-8888-4ea23d2deea8 SUCCESS on exact merge. Live two-route desktop checks confirm Get Involved, completed Appeals, dark review and privacy lattice; topmost dark pattern/normal blending, obsolete square absent,12px privacy label/56px title/20px action separation/no divider/no overflow. Dark review and privacy screenshots inspected. Six-width seeded CI and local Get Involved responsive/axe checks pass. Clean build JS819177/819200,CSS348149/348160, caps unchanged; no client JS added. Initial presence-only regression missed global opaque layering; corrected with topmost-layer assertion before final delivery. See PARTICIPATION_APPEALS_PATTERN_AUDIT_2026-10-03.md. Docs closure branchdocs/appeals-pattern-final-delivery-20261003. Main/PR104/artwork/factual copy/media/carousel/payment/Companion preserved. Next: owner reviews deployed changes; new confirmed defects use separate task branch. No whole-site defect-free claim.

---

# Owner surface polish — 2026-10-03 IST

State: `IDLE`. All 19 owner screenshot corrections delivered through PR144, merge `5c0e61c2390c5ca339a754af4550925d525df830`. Local/tested/remote/merged tree `12277a804c87e4b3253969aca22d801fac08531c` identical. Sponsorship process/closing/cards, assistance follow-up, canonical institutional grids/headings, partnership actions, compliance guardrails, policy principles/prose/security notice and approved lattice visibility corrected. PR CI37124521399 SUCCESS:586 Chromium checks passed first attempt in9.6minutes. Integration CI37125268532 SUCCESS; exact-tree acceptance reused, duplicate browser/database skipped. Local15 responsive/navigation checks,24 planner regressions, build/types/lint and design detector pass. JS819181/819200,CSS347615/348160; caps unchanged, CSS smaller than baseline.

Railway review deployment `c4b2596f-9d41-47f9-9dc4-3ec54525096d` SUCCESS on exact merge. Live desktop checks cover all11 affected routes: sponsorship number absent/title38.164px/equal CTA baseline/restored pattern/right closing; four policy prose columns734.234px full width, lighter summaries and shield notice; governance/reporting rows1184px full shell; recognition heading1184px; partnership separator gap32px; assistance rows84.1875px/no shadows; compliance572px+572px with lattice; no horizontal overflow. Responsive proof is local/seeded CI, not cloud viewport resizing. Source/legal/factual/payment/form/media/artwork/Companion contracts preserved; protected main/PR104 untouched. See OWNER_SURFACE_POLISH_AUDIT_2026-10-03.md. Documentation closure branch `docs/owner-surface-delivery-20261003`. Next: owner reviews the deployed fixes; subsequent confirmed defects use a separate atomic branch. No whole-site defect-free claim.

---

# Donate and sponsorship screenshot correction — 2026-10-03 IST

State: `IDLE`. Task completed through PR142, merge `e20149276b6bb864c082f5a15b718eeeec85bc4a`. Donate section1 now matches section2's canonical grid/font; Sponsor Education supporting copy uses body typography/top alignment. PR CI37117208040 SUCCESS:103 first-attempt Chromium checks in1.9minutes, including six widths320/390/768/1024/1440/1920. Integration CI37117505771 SUCCESS; duplicate browsers skipped by exact-tree acceptance. Local typecheck/build/lint (one existing importer warning), detector and23 planner checks pass. JS819181/819200,CSS347746/348160; caps unchanged.

Railway review deployment `f58aa5cc-5729-4f35-ba59-35bed9156977` SUCCESS on exact merge. Live desktop Donate confirms both headings40.89px,left82px; both copy columns643.11px. Sponsor lead changed from40px Georgia/70px line-height to18.88px Arial/33.04px, equal column tops1657.75px and no overflow. Responsive proof is seeded CI; live browser is desktop. See DONATE_SPONSORSHIP_LAYOUT_AUDIT_2026-10-03.md. Source/query/payment/copy/artwork/Companion unchanged. Only protected production PR104 remains; no main promotion. Next: owner continues observations; new confirmed issues use a separate task branch. Documentation closure branch `docs/donate-sponsorship-delivery-20261003`.

---

# Latest delivery — section hierarchy and alignment — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration: `phase-public-site-rebuild`. Implementation/CI/review deployment complete. Documentation closure branch `docs/section-hierarchy-delivery-20261003`.

Completed: body display H2 cap3.5rem across shared and legacy route rules; homepage banner titles exceed body display headings, max4rem; shared homepage title-left/description-right introduction; full-shell closings with right-column supporting copy and aligned actions, mobile stacking; block evidence headings above their labels; wider heading measures. Corrected short Contact closing copy specificity and pre-existing390x844 menu backdrop reachability with a3rem dismiss strip. Approved artwork/content and fixed Companion preserved.

Validation: final24 local responsive/keyboard/scroll/WCAG/Contact/backdrop regressions pass.392 units pass with six database-dependent skips,22 planner and editorial checks pass; lint one existing importer warning. Exact-head PR CI37107270067 SUCCESS:706 Chromium first-attempt checks in10.0minutes and24 Firefox/WebKit smoke checks in51.3seconds. Initial PR CI37106160672 had698pass/3fail; two task-introduced Contact alignment failures and one pre-existing backdrop failure fixed without disabling assertions. Production build/types/coverage/database/server smoke and unchanged budgets green:JavaScript819181/819200,CSS347689/348160. Integration CI37108057516 SUCCESS; exact-tree PR browser acceptance reused, browser job skipped.

Delivery: application PR [#140](https://github.com/immazhark/amaana-platform/pull/140), final head `69f93b5e3ace613a4e5ec16daab598354e7efc52`, merge `3d83e2df7ba5a80687d95d04903c3ed731b7aa7d`; local/tested/remote/merged tree `45cbb6609900ab6c3c72ae66bb98582f1af4cdba` identical. Railway review deployment `e78d725e-3399-410f-aee9-ef12739c2514` SUCCESS on exact application merge. Main/production PR104 remains protected.

Verification limit and next action: desktop/mobile local captures inspected and seeded real-route CI passes. Live /our-work was reachable before deployment, but post-deployment reload failed because the execution environment disconnected (409 environment_offline). No post-deployment live visual confirmation is claimed. Workspace/local checkout refresh also became unavailable. Restore the workspace connection, fetch latest rebuild integration/documentation before any writes, then verify deployed Home/Our Work/Stories/Impact/Contact geometry. No application change or full-suite rerun is needed solely to resume live verification. See SECTION_HIERARCHY_AUDIT_2026-10-03.md. No whole-site defect-free claim; canonical factual/privacy/payment/media/indexing locks preserved.

---

# Latest delivery — Companion panel accessibility — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration: `phase-public-site-rebuild`. Expanded Companion task complete; documentation closure branch `docs/companion-panel-delivery-20261003`.

Completed: labelled tab IDs/shared content panel, roving Tab order, ArrowLeft/Right wrapping and Home/End activation;44px tabs/source controls; scoped panel bounds below sticky chrome and above the existing fixed dock. Normal-height panels flex the scrolling content, short windows scroll the whole panel. Removed unused immutable reminder state, unused refs and delayed focus scheduling; reused static line icon. Fixed dock location, approved visuals/source text and prayer/date/API behavior unchanged.

Verification:25 local responsive/keyboard/header-navigation/WCAG/retry/reachability checks pass in39.9seconds across seven widths and short/tall windows.392 units pass (six database-dependent skips),22 planner regressions pass; fresh build/types/lint green (one existing import warning; two dead-ref warnings removed). Detector emitted no findings before final static-icon optimization. Initial failures classified as stale generated output, alert-locator ambiguity and real subpixel tablet dock overlap; source/test fixes completed without suppressing failing requirements. JavaScript819181/819200 and CSS347670/348160 bytes, unchanged caps.

Delivery: PR [#138](https://github.com/immazhark/amaana-platform/pull/138), tested head `b94d81bec44b368ff584b8a1dab3f0bb2d679c75`, merge `7d2e3ffe62bf284eee5b18e25459e9a6b5dc46ce`; local/tested/merged tree `770db4f9d7496143e6e0c971a87c4cdb20063692` identical. PR CI37101750482 SUCCESS:65 Chromium first-attempt checks pass in1.5minutes. Integration CI37102025429 SUCCESS: exact-tree browser acceptance reused, duplicate browser/database skipped, build/budgets/coverage/server smoke green. Railway review `32edc17f-2650-4358-9954-53549444a074` SUCCESS on exact application merge SHA.

Live desktop /about screenshot/accessibility/DOM confirms44px tabs, actual IDs, selected-only Tab order, named content, real Right/Left activation/focus, panel top145.61px below81px header and bottom849.61px above865.20px dock, fixed Companion, no horizontal overflow. Escape removes the panel and restores dock focus/expanded=false. Mobile/tablet/short-screen proof is local/seeded CI; live cloud-browser viewport resizing not claimed. See `COMPANION_PANEL_AUDIT_2026-10-03.md`.

Next: owner continues UI observations; new confirmed defects use a separate atomic task after incoming checks. Main/production PR104 remains protected. Canonical factual/media/privacy/payment/indexing and fixed Companion locks preserved. No whole-site defect-free claim.

---

# Latest delivery — shared navigation resilience — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration: `phase-public-site-rebuild`. Atomic shared-navigation task complete; documentation closure branch `docs/navigation-audit-delivery-20261003`.

Completed: corrected 760/1020px backdrop breakpoint mismatch, locked background scrolling only while mobile navigation is open, cleared stale menu state on desktop resize with visible home-link focus, and used shared chrome-height/dynamic viewport tokens for short-screen reachability. Reused immutable links for keyboard wrapping; dismissal restores focus without unnecessary animation-frame scheduling. Approved design, banners and fixed Companion unchanged.

Validation: final 11 local responsive/keyboard/header-WCAG checks pass across five widths/two heights; 392 units pass (six database-dependent skips), 21 planner regressions pass. Production build/types/lint pass (three existing warnings). UI audit detector has no emitted findings. PR CI 37099076391 SUCCESS: 57 Chromium checks pass on first attempt in1.5minutes. Integration CI 37099358020 SUCCESS; exact-tree PR acceptance reused, duplicate browsers/database skipped, build/budgets/coverage/server smoke retained. JavaScript819175/819200 and CSS345824/348160 bytes, caps unchanged.

Delivery: PR [#136](https://github.com/immazhark/amaana-platform/pull/136), tested remote head `52fa5a362270cf2a52f9408cdbfa65b48e9d5dc4`, merge `838bf7d7519cf50996cf49c51f084eb78a39c31a`; both tested and merged tree `d2cdefbfba7bf12fec6607a64c845dcd38e3a88d` matches local tree. Railway review deployment `79349c3e-b715-4e54-8aef-3f5c28fc2621` SUCCESS on exact merge SHA. Live desktop /about screenshot/DOM confirms loaded header CSS Module, menu hidden/expanded=false, body overflow visible, no horizontal overflow, approved gradient/geometry/Arabic branding and fixed bottom-right Companion intact. Mobile/tablet and short-screen proof is local/seeded CI, not live cloud-browser resizing.

Next: owner continues UI observations; new confirmed defects use a separate atomic branch after incoming checks. No claim that the entire site is defect-free. Main/production PR104 remains protected. Canonical factual/media/privacy/payment/indexing locks preserved. See `UI_NAVIGATION_AUDIT_2026-10-03.md`.

---

# Latest delivery — assistance progress and actions — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`.

Completed: readable branded current/upcoming assistance progress at14px with44px controls; disabled semantics preserved. Corrected CSS Modules selector for global forward button, restoring desktop right alignment and explicit mobile full-width stacking. Removed duplicate local progress declarations. Form/validation/submission/permission logic unchanged.

Validation:19 local browser checks pass in47seconds, covering24 step/viewports at320/390/768/1024/1440/1920 with WCAG A/AA axe, action geometry, genuine keyboard traversal/focus and retained values; seven existing private assistance journeys pass. Build/types/lint (three unchanged warnings),20planner/content/editorial/global CSS/diff guards pass. Detector finding is only unchanged privacy-note emphasis. Initial default axe best-practice advisory and test focus timing corrected in coverage/method, not suppressed application failures. See ASSISTANCE_PROGRESS_AUDIT_2026-10-03.md.

PR [#134](https://github.com/immazhark/amaana-platform/pull/134) merged asf72eca09957a63e9f7b922563484977b7f8bbb1c. Exact tested remote head3d9ac4705d643f93d914d4337d6a8045b8050783 matches local treeed649737de03c5d1b2ecf55a4e03564daf38f342. PR CI37054686962 SUCCESS:68 Chromium first-attempt pass in2.2minutes,392 unit checks pass (six database-dependent fast skips). Integration push37055303488 SUCCESS; exact-tree browser acceptance reused, duplicate browser/database skipped; production build/budgets/coverage/server smoke green.

Railway review deploymentd43c96f0-3698-46fb-94e9-64994a923bb4 SUCCESS on exact application merge SHA. Live desktop /request-assistance#request-form screenshot/DOM verifies all four progress labels14px,44px targets, opacity1, muted upcoming surfaces with real disabled attributes, active blue surface, forward action right-gap0 and no horizontal overflow. Local/seeded tests cover six widths and all four steps; live verification is desktop. JavaScript819031/819200 and CSS345202/348160, caps unchanged.

Task complete, ownership IDLE. Next: owner continues UI observations; subsequent confirmed defects use a separate atomic branch. Protected PR104/main release, canonical facts/copy, approved artwork, media/privacy/payment/indexing and fixed Companion preserved. No claim of a defect-free whole website. Documentation closure branch docs/assistance-progress-delivery-20261003.

Older entries below are historical.

---

# Assistance progress and actions audit — 2026-10-03 IST

State: `CODEX_ACTIVE`. Branch `fix/public-controls-20261003`, verified integration base `b8d75553b254705baabd42f4a0f80f57a406ddcc`. Owner authorizes continued UI/UX checking and fixes. Only protected production PR104 is open. Confirmed live assistance progress labels12.16px and disabled opacity.48; CSS-module action selector does not match global v2-button, leaving desktop forward action left-aligned. Mobile global rules currently mask width mismatch. Scoped presentation fixed;19 local browser checks pass across24 step/viewports and seven private journeys. Build/types/lint/content/CSS guards and20planner checks pass, CSS345202/JavaScript819031 within unchanged caps. Publish/CI/merge/exact review delivery next. See ASSISTANCE_PROGRESS_AUDIT_2026-10-03.md. Preserve canonical content, artwork, payment/privacy/indexing and fixed Companion.

---

# Latest delivery — policy navigation and accessibility — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`. Application PR [#132](https://github.com/immazhark/amaana-platform/pull/132) merged as `5e505ce4758f7cf8ed6fd6d4a0a7538e1e509ab4`; exact tested task head `0bf13028804bdb67045c41ef660d66eb65329b08`, tree `77b4c8175cc11072c3d7108a098bbf99157d79ab`. Documentation closure branch `docs/policy-audit-delivery-20261003`.

Completed: native policy headings clear sticky chrome; full-width 44px contents targets, keyboard focus and responsive breakpoint parity restored; long desktop contents scroll within short viewports. Restored missing global sr-only utility for Privacy, navigation-loader and private notification labels without removing their accessibility names or changing legal content/action behavior.

Validation: nine local browser tests pass across 24 policy page/viewports at320/390/768/1024/1440/1920 with full axe, real keyboard jumps, direct fragments, short1440x600 sidebar reachability and delayed-loader states. Build/types/lint (three unchanged warnings),20 planner regressions, content/editorial/global CSS/detector/diff checks pass. PR CI37050971480 SUCCESS:657 Chromium checks passed on first attempt in10.4minutes;24 Firefox/WebKit smoke checks pass;392 unit checks pass with six database-dependent fast skips; isolated database verification passes. Shared accessibility CSS correctly retained full acceptance; policy-only paths now have focused coverage.

Integration push CI37052641854 SUCCESS: exact tested tree preserved and duplicate browser suite skipped; production build, coverage, database and smoke checks green. Unchanged caps: JavaScript819087/819200; CSS345331/348160.

Railway review deployment `4652b782-1492-4c60-8601-531c4e83f729` SUCCESS on exact application merge SHA. Live desktop Privacy #policy-03 screenshot/DOM confirms target heading152.33px below header bottom81px, full-width312px contents rows at least44px, viewport-bounded scrolling sidebar, clipped1px sr-only label still present in named accessibility region, and no horizontal overflow. Six-width/mobile/short-screen coverage is local/seeded; live proof is desktop.

Current task: complete. Next: owner continues UI observations; next agent inspects new confirmed defects in a separate atomic branch. Private authenticated staff-record states were not opened. Preserve canonical factual/media/privacy/payment/indexing gates, approved artwork and fixed Companion. Production PR104/main promotion remains protected. See POLICY_NAVIGATION_AUDIT_2026-10-03.md. Older entries below are historical.

---

# Policy navigation audit — 2026-10-03 IST

State: `CODEX_ACTIVE`. Branch `fix/policy-navigation-20261003`; verified integration base `e81ba99fef5455f8d065853993d5e2b8adc4e6d6`. Owner requests continued checking and correction. Only protected production PR104 is open; no competing writer. Confirmed deployed Privacy contents links are30px high and #policy-03 settles with its heading at47.56px beneath81px sticky header. Fix shared policy navigation and anchor offsets across Privacy/Terms/Donation/Refund without changing legal content. Inspect short-screen sidebar reachability and breakpoint parity. Policy anchor/link/sidebar/breakpoint corrections and missing shared sr-only utility implemented. Nine local browser tests pass across24 policy page/viewports, full axe, short-screen/fragment and delayed-loader scenarios. Build/types/lint/content/global CSS/detector and20planner checks pass; JS819087/CSS345331 within caps. Shared accessibility correction intentionally retains full exact-head acceptance. Publication/CI/integration review delivery next. See POLICY_NAVIGATION_AUDIT_2026-10-03.md. Preserve approved media/backgrounds/factual/privacy/payment/indexing and fixed Companion.

---

# Latest delivery — follow-up UI audit — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`. Application PR [#130](https://github.com/immazhark/amaana-platform/pull/130) merged as `2044bf97364674e89c9fe558ea6808999d49892b`; exact tested task head `93ee64399a30f834314c5cc56627e45231b7f38e`, tree `73b95c7c3cdf917871ac4e936bd247335e8a9563`.

Completed: corrected Request Assistance Before/After checkerboard bands caused by inherited tiling sizes applied to legacy gradients; restored approved lattice/body surfaces and shared Before heading. Retired corresponding route overrides. Previously blocked state, Contact/Faith and Impact/Our Work surface verification resumed. Canonical content/privacy/payment/media/indexing, approved SVG bytes and fixed Companion preserved.

Validation: build/types/lint (three unchanged warnings),18 planner regressions, content/editorial/SVG/CSS guards and detector pass. All14 local browser checks pass: six widths with full-page axe plus eight private assistance journeys. Desktop/mobile captures inspected. Initial local full Chromium failure was workspace socket permissions; the installed pinned headless runtime resolved it. Final PR CI37047981721 SUCCESS:62 Chromium checks passed on first attempt in2minutes;392 units pass, six database-dependent fast skips. Integration CI37048619969 SUCCESS; exact-tree PR browser acceptance reused, duplicate browsers/database skipped. JS819087/819200 and CSS344667/348160; caps unchanged.

Railway review deployment `7ee3334c-dbf2-45a1-81d3-83217b0c4cb7` SUCCESS on exact application merge SHA. Live /request-assistance DOM and screenshot confirm approved dark lattice with repeat/no-repeat104px/100% layering, shared split heading, approved After body background and no horizontal overflow. Local/seeded tests cover320/390/768/1024/1440/1920; live verification is desktop. See UI_FOLLOWUP_AUDIT_2026-10-02.md.

Current task: complete. Next: owner continues UI observations; no failing required task checks remain. Authenticated private staff-record states were outside this public audit. Production PR104/main promotion and separate release gates remain protected. Older entries below are historical.

---

# Follow-up UI verification — 2026-10-02 IST

State: `CODEX_ACTIVE`. Branch `fix/ui-followup-audit-20261002`; verified integration base `f5458a98188fb8deed78b07a6fad0191453c1d9c`. Owner requests continued inspection and correction of existing issues. Browser/workspace access restored. No competing task PR; production PR104 remains protected. First inspect previously blocked deployed states and evidence closings, then forms/navigation and confirmed legacy conflicts. Preserve approved design, canonical facts/media/privacy/payment/indexing and fixed Companion. Confirmed assistance Before/After repeating-gradient defect and bypassed heading fixed. Build/types/lint, 18 planner tests, content/SVG/global CSS guards pass; JS819087/CSS344667 within unchanged caps. Local browser launch infrastructure-blocked, no responsive success claim. Focused seeded CI, merge and exact-source review deployment pending. See UI_FOLLOWUP_AUDIT_2026-10-02.md.

---

# Latest delivery — UI consistency and legacy-rule audit — 2026-10-02 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`. Application PR [#128](https://github.com/immazhark/amaana-platform/pull/128) merged as `c670a94239aeeed83a72c74b6ce5338a630aeb20`; tested task head `b60aa42e8e8002095c9bdbdf6ed800207a6710c8`. Documentation closure branch `docs/ui-audit-delivery-20261002`.

Completed: fixed state/receipt legacy white text and oversized typography on light L1 banners; readable Home secondary hover/focus; shared Contact social heading; approved Contact/Faith body backgrounds; explicit responsive Impact/Our Work evidence closing layouts and Impact section gap; visible dark closing geometry; removed retired intent-card rules/animations. Canonical narratives/figures, media, privacy, payment behavior, approved SVG bytes, indexing gates and fixed bottom-right Companion preserved.

Validation: all30 canonical live initiatives and four category overviews opened; static public desktop/mobile and six-width local regressions inspected. Build/types/lint/editorial/CSS guards and17planner regressions pass. Final PR CI37036140425 SUCCESS:153 Chromium cases pass on first attempt in3.9minutes;392 unit checks pass (six DB-dependent checks skipped in fast, browser environment seeded). Specific mappings avoid the unrelated398-case whole-site shell matrix:153 selected instead of554. Shared global/unknown/core paths and releases retain broad/full acceptance. Carousel and keyboard-focus checks await actual geometry/focus without relaxing requirements.

Integration push CI37037096503 SUCCESS: production build and unchanged budgets, JS819087/819200 and CSS344368/348160. Exact tested tree retained; duplicate task browsers skipped. Railway review deployment `2d1e38aa-b97f-4694-9920-5243d2e5f310` SUCCESS on exact application merge SHA `c670a94239aeeed83a72c74b6ce5338a630aeb20`.

Current implementation task: complete. Next action: owner continues UI review; when browser/workspace reconnects, inspect deployed confirmation, Contact/Faith body patterns and Impact/Our Work evidence closings. Final live screenshot was blocked by409 environment_offline after merge; no post-deployment screenshot/rendered verification claim is made. Private staff-record states remain outside this public audit. Production PR104 stays protected and automatically runs its separate full release acceptance when the integration head changes; that suite is not a blocker for completed review delivery. See UI_CONSISTENCY_AUDIT_2026-10-02.md. Older entries below are historical.

---

# UI consistency and legacy-rule audit — 2026-10-02 IST

State: `CODEX_ACTIVE`. Branch `fix/ui-consistency-audit-20261002`; verified integration base `8fcc88b935eed87f740dba2159d67f0d3eb8e231`. Owner authorizes reviewing all screens and fixing confirmed UI/UX inconsistencies and conflicting legacy rules while away. Only protected production PR104 is open. Confirmed state/receipt foreground/type conflict, Home hover contrast, Contact social heading and retired intent CSS fixed. Approved body backgrounds restored on Contact/Faith; Impact/Our Work closing grids explicitly restored and Impact evidence-to-heading spacing corrected. Local six-width UI/a11y regression and ten carousel cases pass; build/types/lint/editorial/CSS guards and 17 CI planner regressions pass. JS819087/819200; CSS344368/348160. See UI_CONSISTENCY_AUDIT_2026-10-02.md. Seeded focused CI, merge and exact-source review deployment pending. Preserve approved banners/background SVGs, canonical content/media/privacy/payment/indexing gates and fixed bottom-right Companion.

---

# Latest delivery — site-wide approved L1 banners — 2026-10-02 IST

State: `IDLE`. Outgoing agent: Codex; incoming agent: next available implementation agent. Integration: `phase-public-site-rebuild`. Completed task branch: `fix/sitewide-l1-banners-20261002`. PR [#126](https://github.com/immazhark/amaana-platform/pull/126) merged at `a6cea782514fdf49837af7a41e7d4aa178a4821e`; tested task head `494421b4e727ff65314b7ac82f9f91d273926b37`. Documentation closure branch: `docs/sitewide-banner-delivery-20261002`.

Completed: all shared PageHero purposes use the approved L1 gradient, geometric lattice and right-side Arabic Amaana motif. Home, assistance success/tracking, donation acknowledgement, error/loading and admin headings share the same surface. Page purposes remain semantic. Mobile Home copy stays on the light field; global error uses an independent equivalent; acknowledgement print stays readable. Retired variant styles removed. Canonical content, media, actions, auth and fixed Companion preserved.

Validation: production build/types, lint (three existing warnings), 392 units (six DB-dependent local skips), 15 planner regressions, content/factual/CSS/SVG guards, sixty local production page/viewport checks and eighteen axe audits passed. All six seeded banner tests passed at320/390/768/1024/1440/1920. PR CI37004033430 green:631 Chromium cases passed first attempt, one body-carousel1024px animation timing assertion passed on built-in retry;24 Firefox/WebKit smoke cases passed. The earlier631pass/1fail run exposed a stale About prose selector from prior PR124; corrected to the actual prose column and verified locally, with no layout change. No current failing required checks. JS819087/819200 and CSS346628/348160; caps unchanged.

Integration CI37005131492 passed production build, budgets, database/fast guards and server smoke; exact-tree PR acceptance reused, duplicate browsers skipped. Railway review deployment `503b31d2-e2ff-4fbd-a76b-95a4a81eab50` SUCCESS on exact application SHA `a6cea782514fdf49837af7a41e7d4aa178a4821e`. Live Home, Contact and neonatal initiative DOM confirms identical surface, visible approved Arabic motif and no horizontal overflow. Deployed Contact screenshot inspected and saved. Live neonatal page retains full case narrative and ₹107,520; gallery remains supporting media.

Current implementation task: complete. Exact next action: owner continues UI review on the deployed review website. Future page-specific banner exceptions are deferred until requested. One existing carousel geometry test has a timing-sensitive700ms wait and0.09375px first-attempt overshoot; retry passes, recorded for future test stabilization rather than broadening this banner change. Main/production promotion PR104 remains a separate protected checkpoint. Preserve all canonical factual/compliance/privacy/media/payment/indexing gates, approved SVG bytes and fixed Companion. Older active/pending entries below are historical and superseded.

---

# Site-wide approved L1 banners — 2026-10-02 IST

State: `CODEX_ACTIVE`. Integration base `4f8459967845b2a7bc988adaaf62b073a624faf6`; task branch `fix/sitewide-l1-banners-20261002`. Owner explicitly requests the approved L1 gradient/geometric/Arabic-right artwork on every website header banner, with future per-page exceptions deferred. No other implementation writer or task PR is active; only protected production PR #104 is open. Current task: audit shared PageHero and custom/transactional banners, standardize surfaces without changing canonical content or interactions, then focused validation, integration PR/CI/merge and exact-source preview verification. Prior live browser transport failure is historical; retry verification for this delivery. Preserve factual/media/privacy/payment gates, approved SVG bytes and fixed Companion. Older entries below are historical.

Local validation complete: production build/typecheck, lint (three existing warnings), 392 unit tests (six DB-dependent local skips), 15 CI planner regressions, content/factual/CSS guards and all six approved SVG hashes pass. Sixty production page/viewport combinations and eighteen axe audits pass at 320/390/768/1024/1440/1920; local Home uses the production hero fixture and DB-backed initiative is reserved for seeded CI. Desktop/mobile rendered inspection passed. Final JS 819087/819200 and CSS 346628/348160; fixed budgets unchanged. Implementation complete; publication, seeded full shared-surface CI, green merge and exact-source review deployment remain pending.

Delivery checkpoint: PR #126, head 481d009eb1e19ced645dbd1f41dd4f4a26077812. CI 37002628565 fast/database green; Chromium 631 passed, one pre-existing stale About prose selector failed. The heading wrap introduced in prior PR124 caused the test to measure the left heading as prose. Selector corrected to the actual last direct prose div; unchanged production layout passes locally at 1920/1440/390. All six actual seeded banner tests passed. Corrected acceptance run and deployment remain pending.

---

# Latest delivery — body section headings and footer spacing — 2026-10-02 UTC

State: `IDLE`. Outgoing agent: Codex; incoming agent: next available implementation agent. Integration: `phase-public-site-rebuild`. Completed task branch: `fix/section-headings-footer-spacing-20261002`. PR [#124](https://github.com/immazhark/amaana-platform/pull/124) merged at `892aa722294b2ebb307e6934a444fad3ffee5361`; task head `d837253610ce26e07c5784c21d0edaae84d101ad`. Documentation closure branch: `docs/heading-footer-delivery-20261002`.

Completed: shared server-rendered body introductions use a 40px rule and eyebrow above the left title, subtitle on the right; mobile stacks. Additional right-side content retains its composition. Site-wide footer outer spacing shares one token: 80px desktop, 96px plus safe area on mobile. Canonical/legacy programme galleries and eligible public introductions use the shared component. Content, approved background foundations, factual locks and fixed Companion preserved.

Validation: local production build, lint/types/content/CSS guards, 392 unit tests (six database-dependent skipped locally), 15 CI planner regressions, and 30 local production page/viewport combinations passed. PR CI 36948217424 passed all 507 Chromium cases, including six widths. Integration CI 36949106614 passed build, budgets and server smoke, reusing exact-head PR acceptance and skipping duplicate browsers. JS 818873/819200 and CSS 347314/348160; caps unchanged. Optional-gallery fixture assertion and real keyboard-navigation setup corrected; no current failing application checks.

Railway preview deployment `b7ef3970-885d-4017-bdce-de9f4c6176ff` is SUCCESS on exact application SHA `892aa722294b2ebb307e6934a444fad3ffee5361`. Final public-site visual inspection could not finish because the browser/container transport disconnected with `409 environment_offline`; no post-deployment screenshot or live visual claim is made. Seeded browser acceptance and exact-source deployment are confirmed.

Current implementation task: complete. Exact next action: owner continues UI testing on the deployed review site; when browser access returns, inspect /impact shared introductions and footer, and /our-work/emergency-neonatal-medical-aid gallery. No additional code edits are required for this delivery. Main/production promotion PR #104 remains a separate protected release checkpoint. Do not casually change factual/content locks, private evidence boundaries, payments/indexing gates, approved geometric foundations or Companion positioning.

All older active/pending entries below are historical and superseded by this delivery record.

---

# Body section headings and footer spacing — 2026-10-02

State: `CODEX_ACTIVE`. Branch `fix/section-headings-footer-spacing-20261002`, verified integration `2235263272d0083fa280fc7a1ed0b34acdd6ba88`. Only open PR is protected production #104. Owner requests equal outer footer top/bottom breathing room and a consistent body heading: line + eyebrow, title left, subtitle right; retain compositions with extra content on the right, stack on mobile. Screenshots recovered and inspected. Prior PR122/123 merged with green CI and exact preview deployments; older pending notes below are historical. Shared server-rendered heading implemented across standard public introductions, closings and galleries; original content, hero layouts, content-panel exceptions, card headings and fixed Companion preserved. Thirty actual production page/viewport combinations pass at 320/390/768/1024/1440/1920. Local lint/types/content/CSS audit/build and 392 unit tests pass (six DB-dependent skipped locally); 14 planner regressions pass. Final JS 818873/819200 and CSS 347314/348160, caps unchanged. Footer outer top/bottom uses one token: 80px desktop, 96px mobile plus safe area. Focused seeded CI, green merge and exact-source preview deployment verification remain pending.

---

# Participation, Contact and completed Appeals — 2026-10-01

State: `CODEX_ACTIVE`. Branch `fix/participation-contact-appeals-20261001`; stacked PR #123, remote head 4e73601731f76d6a8fe5f3c2d65efb7b7494e9ab. All six screenshot groups are implemented: shared Contact/Get Involved cards with refined normal/hover/focus states; separated journey headings/copy without misaligned dots or rails; official social SVGs reused from the footer; completed Appeals use BodyCarousel/BodyCard; brand-gradient fallback uses the approved geometric lattice globally. Local production checks pass at 320/390/768/1024/1440/1920; Contact/Get Involved axe checks pass. Units: 392 passed, six database-dependent skipped locally. Build/types/lint/content/global CSS and 13 CI planner regressions pass. Production JS 818873 / 819200 and CSS 344906 / 348160; caps unchanged. Actual database-backed Appeals verification remains for remote CI and deployment.

PR #122 head 04a7b0f28138982bce8d5fa82e28e7d1983b0235, CI 36896947301: fast and database green; browser running. Previous complete Chromium run passed 614 cases; Firefox could not launch because the container HOME owner differed from its runner user. Current commit repairs existing HOME ownership without changing HOME or reinstalling browsers. PR #123 contains this fix as an ancestor. After PR #122 passes and merges, retarget PR #123 to `phase-public-site-rebuild`, trigger focused CI, merge only on green, verify exact-source integration build/Railway preview and actual pages. New presentation changes select ten focused suites without a full cross-browser matrix or refund database job. Main/production remains unchanged.

---

# Initiative detail delivery checkpoint — 2026-10-01

State: `CODEX_ACTIVE`. Owner requested continuation; current CI remains running. PR122 is open on fix/initiative-detail-narrative-20261001; remote head7e09e584e85febe87974d7b83c1e90d0d913e52b. Full canonical and legacy narratives retained; clinical glossary removed; continuous approved pattern, centered closing actions, equal footer padding implemented. All six new initiative browser checks passed at320/390/768/1024/1440/1920. Last full run36888890250:613 passed,1 failed due single-programme category test expecting medical relief to have one record after canonical seed expansion. Test now uses genuinely single-parent Taleem category. Current final CI36891312920 is running. Fast/database previously green; local types/lint/master/build and budgets pass. Not merged or deployed. Next: verify current CI, merge PR122 into phase-public-site-rebuild only after green, check integration build and exact-source Railway preview deployment, inspect rendered initiative pages. Existing browser detailTab id3 on amaanafoundation.org; runtime restored. Main/production protected. CI uses pinned Playwright1.55.0 preinstalled image, postgres service hostname, canonical seed and valid workspace/relative artifact paths; prior20-minute OS mirror install timeout eliminated. User frustrated by full-suite repetition; do not repeat broad runs beyond required failures.

---

# Initiative detail corrections — 2026-10-01

State: `HANDOFF_PENDING`. Local implementation complete. Branch fix/initiative-detail-narrative-20261001 from verified integration20b5c23. Six screenshots inspected. Scope: restore complete canonical narrative, remove clinical glossary, one continuous approved body surface, align closing CTA and footer spacing. Main and factual locks protected. Validation: eight narrative tests including all30 canonical records; full unit suite391 passed before final additional catalogue case; six-width representative production-CSS layout harness passes, SVG artwork visually inspected. Lint/types/master/global CSS audit/build pass; JS818873 and CSS340119 below unchanged budgets. Actual database-backed browser pages and remote CI/staging remain unverified. Publication next.

# CI separation extension — 2026-10-01

State: `HANDOFF_PENDING`. Extended policy verified locally: twelve planner tests, lint, workflow job dependencies, YAML/shell syntax and diff checks pass. Fast/database/production/browser separated with stable aggregate verify gate. Remote publication is pending direct authorization. Continue chore/change-aware-ci-20261001; user requests explicit light/heavy job separation and wider routine UI/content selection. Publication remains blocked by prior auto-review; do not retry export without direct authorization.

# Change-aware CI — 2026-10-01

State: `HANDOFF_PENDING`. Local mechanism implemented and verified: eight planner tests, lint, YAML/shell syntax and diff checks pass. Publication/remote workflow validation pending. User requests implementation of efficient verification criteria. Branch: chore/change-aware-ci-20261001; verified integration base 72fcfe3, PR120 merged. Scope: deterministic diff planner, workflow selection and regression tests; preserve production readiness and budgets.

# Publication authorized — 2026-10-01 IST

State: `CODEX_ACTIVE`. Owner explicitly approved GitHub publication, PR/CI and integration staging delivery. Continue fix/owner-screenshot-polish-20261001 from verified f6980fd3. All local checks pass as recorded below. Terminal push has no credentials; use the connected GitHub publisher to publish the same tested tree. Remote CI, merge and exact-source deployment verification are next.

---

# Publication blocked — 2026-10-01 IST

State: `REVIEW_PENDING`. Branch: `fix/owner-screenshot-polish-20261001`.
Implementation commit: `c911884` (based on verified integration f6980fd3).
All six owner screenshot groups are implemented and locally verified. Nine new production-browser tests pass across 1920/1440/1024/768/390/320, including keyboard disclosure/select, hover/focus, actual moving gradient, reduced motion, no hero-control overlap, no horizontal overflow and axe checks. Eleven existing chrome checks also pass. Lint/types/master/CSS audit/build and 389 unit tests pass; six database-dependent tests are locally skipped. Production JS 818873/819200; CSS 340731/348160. Desktop/mobile visual review confirms contained official logo artwork and aligned portfolio metrics/controls.

Automatic approval review rejected GitHub push: repository export destination requires explicit end-user authorization for this change set. No connector workaround was attempted. Read-only GitHub verification confirms the task branch does not exist remotely (404). No PR, remote CI, integration merge or staging deployment occurred. Staging remains the prior verified application 0227dc8.

Next exact action, after direct user publication authorization: push the task branch to https://github.com/immazhark/amaana-platform, create PR to phase-public-site-rebuild, require green full CI, merge and verify exact-source Railway staging deployment plus rendered Home/Our Work. Main/production promotion, indexing, live payments, factual locks, identity separation and fixed Companion remain protected.

---

# Owner screenshot corrections — 2026-10-01 IST

State: `CODEX_ACTIVE`. Branch: `fix/owner-screenshot-polish-20261001`.
Verified integration base: `f6980fd3a083392deaa375626f6289c70da66d5f`; only open PR is protected production promotion #104. User explicitly requests detailed implementation of six annotated screenshots. Scope: header hover, taller Home hero and official brand fallback, animated Highlights gradient, visible dark-section lattice, trust links/contrast/icons, wider smaller footer lead, portfolio filters/disclosure alignment, brief initiative summaries, consistent metadata and readable brand thumbnails. Preserve factual values, curated identity separation, fixed Companion and integration-only delivery. Local verification complete: nine production-browser checks across six widths, eleven existing chrome checks, axe on corrected surfaces, lint/types/master/CSS audit, 389 unit tests pass (six DB-dependent local skips). Final production JS 818873/819200 and CSS 340731/348160. Desktop/mobile screenshots inspected; full logo artwork contained and controls do not overlap CTAs. Full remote CI and staging verification pending.

---

# Completed delivery — 2026-10-01

State: `IDLE`. Unified body-carousel task is complete.

- PR #118 merged into phase-public-site-rebuild at 0227dc873fd596b71320d9fc2edaf4b43441483e.
- Final task-head CI 36843517333 and integration push CI 36844982063 are SUCCESS: 832 Chromium + 24 Firefox/WebKit checks, unit/refund database, lint/types/content checks.
- Integration production build and unchanged budgets pass. Local production totals: JS 818873/819200 bytes; CSS 344825/348160 bytes.
- Railway preview deployment 90272fe1-bbd5-42f7-a31f-f76f5e86e836 is SUCCESS on exact application SHA 0227dc8.
- Cloud-browser live verification confirms Home starts flush left with 18% preview, Qurbani two-card and Eid seven-card rows use equal row heights and 16:9 visuals, and wrap navigation aligns the last card at the same left edge. Companion remains fixed bottom-right.
- Six local responsive fixture widths and ten interaction checks pass. Terminal live-site DNS was unavailable; live checks used the cloud browser at its desktop viewport. Do not claim six-width live-deployment checks or a public version-endpoint check; the version endpoint was blocked to this browser, while Railway source SHA and deployed UI were verified.
- Shared BodyCarousel/BodyCard, heading controls, progress line, brand SVG fallbacks and site Framer Motion layer are delivered. Manual pause, focus/hover pause, native drag, direct links, keyboard navigation and reduced motion are verified.
- Design specification: docs/BODY_CAROUSEL_DESIGN_SPEC.md. Gallery photos remain separate from hero/identity media. Main, reserved production, indexing, live payments and factual locks remain protected.
- Next: owner visual review and the next explicitly requested UI defect block. Identity photographs remain an external content assignment. No unfinished implementation in this carousel block.

---

## Autoplay focus guard follow-up

Autoplay now checks actual hover/focus state and active drag before advancing, so pointer exit cannot resume while keyboard focus stays inside. Independent manual pause remains. Ten local Chromium checks pass (including focus/blur resume), lint/types/production build pass. Production JS 818873/819200, CSS 344825/348160. Publish focused follow-up to PR #118 and require its exact-head CI before merge.

# Recovery checkpoint — 2026-10-01

State: `CODEX_ACTIVE`; continuing PR #118 at verified remote HEAD b00f8398040606a6479e78a5b480d6f19d551f29. Integration remains 5908d16. Latest CI: 826 passed / 5 failed. Recovered exact published sources; removed retired Impact and programme card rules, fixed in-flight scroll destination tracking and hero offset context. Canonical programme-link assertions and approved 416px hero-height assertions replace obsolete expectations; left-edge wrap geometry is polled until settled. Local lint/type/build/master and 389 unit tests pass; eight existing browser checks pass. Production JS 819177/819200, CSS 344825/348160. Added rapid wrap regression; exact-head CI, integration and staging verification pending. Main and fixed Companion remain protected.

---

## Carousel validation checkpoint

Draft PR #118; initial CI lint issue corrected. Final local lint/type/build pass, 389 unit passes (6 DB skips), eight Chromium checks pass including six widths, exact peek, manual pause, reduced motion, drag and direct-link navigation. JS 818889/819200; CSS 347534/348160. Full exact-head CI and preview deployment pending.

# Current task — 2026-10-01 unified body carousels

State: `CODEX_ACTIVE`
Task branch: `feat/unified-body-carousels-20261001`
Verified integration base: `5908d16b6c31f5919033e68b49b33962068e5a71`.

Owner requests all body carousels start flush left; one design system for Home/L1/L2, fixed visual headers, brand-themed SVG fallbacks, equal card geometry, 15–20% next-card peek, heading-aligned controls and progress line. New explicit instruction requires Framer Motion site-wide where appropriate. Preserve native scroll snap/touch and motion preferences, factual locks, identity media separation and fixed Companion. Only open PR at claim is reserved production PR #104; no competing implementation writer. Prior #116/#117 delivery is complete: 823 Chromium + 24 Firefox/WebKit passed, final integration CI green, Railway success on 5908d16, JS 805951/CSS 346969 within unchanged budgets. Implement and verify this new coherent task before integration; no production promotion.

---

# Current delivery checkpoint — 2026-10-01 IST

State: `CODEX_ACTIVE`
Task branch: `fix/curated-import-validation-bundle`
Integration HEAD: `3107555782a4b9632300bcfb7ef65271e86592fb`.

- PR #116 merged after exact-head CI 36764531334 passed 823 Chromium and 24 Firefox/WebKit cases, lint/types, 389 unit tests and isolated refund database checks.
- Railway staging deployment `b4c52092-3072-4249-9566-be32d4e3fdc8` is SUCCESS on exact integration SHA `3107555`. Rendered homepage verified through cloud browser: header, separate reminder/live rail, five Highlights including ₹12,14,520, canonical footer and fixed Companion are present.
- Integration push CI 36766109793 exposed the existing JS excess: 973,135 / 819,200 bytes. CSS passes: 346,969 / 348,160 bytes. No budget increase allowed or performed.
- Root cause: shared curated-gallery schema imported the exported Zod namespace object, retaining unused validator exports/locales in the admin browser bundle. Changing to an ES module namespace import preserves exactly the same schemas, validation and inferred types while enabling unused exports to be removed.
- Clean local production build after this import-only correction: JS 805,951 / 819,200 bytes; CSS 346,969 / 348,160. TypeScript and all three curated-contract tests pass.
- Next: publish isolated correction PR into integration; require green CI, merge, verify production budgets and staging source SHA. Current application fixes are deployed, but delivery is not fully certified until integration CI is green.
- Main, reserved production service, indexing, Live Razorpay, gallery/identity assignments and fixed bottom-right Companion placement remain locked.

---

# Current checkpoint — 2026-09-30 site chrome + footer + homepage hero correction

State: `CODEX_ACTIVE`
Task branch: `fix/site-chrome-footer-hero-20260930`
Integration base / current phase HEAD at claim: `883d2c6c680bd4ac2796eb68defe16875a9b7bab`.

Incoming Codex ownership explicitly handed over by the owner continuation prompt. Verified task HEAD `464938377ee3b8cddc03b756aa6ab9668b8f655a`, integration HEAD `883d2c6c680bd4ac2796eb68defe16875a9b7bab`, Draft PR #116. CI 36748468904: 808 Chromium checks passed, seven failures under investigation. No concurrent implementation writer is active.

Owner-authorized Block #1 + Block #2 implementation:
- footer geometry/spacing/typography/site-wide parity, gold link states, official social icons, Threads support, future social extensibility;
- slightly taller global header with larger logo, restored thick animated gold nav underline, canonical Support a need CTA;
- split compact Reminder + independent Amaana Live rail below navigation;
- homepage hero breathing room, 45/55 copy/media composition, image fade boundary, removal of decorative 2020/Arabic story graphics;
- fifth homepage Highlights metric for the canonical medical/financial assistance aggregate.

Do not repurpose any of the 154 gallery photographs as hero/banner/thumbnail media. Do not touch main, DNS, indexing, reserved production service, Live Razorpay, or fixed bottom-right Islamic Companion placement.


Codex recovery checkpoint:
- Recovered Draft PR #116, inspected all 19 implementation commits and all seven exact-head browser failures.
- Established `site-chrome.css` after `experience-finish.css`; retired conflicting nav/footer/reminder generations rather than increasing specificity or bundle budgets.
- Fixed footer implicit grid tracks and inherited 48–80px lead margin; restored 44px mobile link targets, canonical active-route gold, safe bottom spacing, and consistent typography.
- Corrected the hero split relative to the public container and secondary CTA contrast; actual Home story and Highlights are shared with the isolated carousel fixture.
- Guarded assistance total against malformed measures, duplicated cases, missing cases and future rollups. Canonical total remains ₹12,14,520; ten focused unit cases pass.
- Expanded rendered acceptance across 1440/1280/1024/768/390/320, including uncut metric values, footer shell parity and fixed Companion positioning. Obsolete tests now enforce the owner’s newer same-footer/two-lane requirements.
- Local lint/type/master and unit checks pass (389 tests, 6 database-dependent skips; three unchanged lint warnings). Full exact-head CI and staging verification remain pending; no completion/deployment claim yet.


Publication recovery — 2026-10-01 IST:
- Owner directly authorized continuation after the explicit publication approval request. Terminal push then failed for missing GitHub credentials.
- Connected GitHub publication succeeded: `12cd093d4024bcb2775ab83c07f0b77fcd5b472a`, whose tree exactly equals local tested tree `50cd32acd66c24f97778d173842b954aa7b02596`.
- PR CI 36762269001 passed lint/types/unit/database/factual checks and 822 Chromium cases. One mobile footer-collapse failure exposed a later generic display rule overriding the existing disclosure state.
- Removed only the redundant generic display declaration; kept the existing disclosure behavior and compact-height assertion. Local failing mobile disclosure test now passes, as do all eleven focused chrome checks. Two broader local checks need unavailable database routes; those same routes passed in CI.
- Clean acceptance CSS was 346,982 / 348,160 bytes before this one-line reduction; budgets remain unchanged. The local JS baseline discrepancy still requires integration production-build verification.
- Publishing this correction and rerunning exact-head CI is next. PR #116 remains Draft until green; no integration merge or Railway deployment has occurred yet.


---

# Historical checkpoint — 2026-09-28 background composition correction

State: `CODEX_ACTIVE`
Task branch: `fix/background-composition-scale`
Base integration SHA: `671e3ba219f01248a0154dfe81525d7518e2efdf`
User explicitly requests uncropped header/footer emblems and uniformly small, lighter body pattern. Prior cover-based acceptance was insufficient. Preserve original six source SVGs; derive independent ornament/tile assets and test actual viewport geometry. Scope is backgrounds and their readable layout only; content, payments, main and draft promotion PR #104 remain untouched. No other implementation writer is active. Verification pending.

---

# Amaana Platform — Active Implementation State

## State
**CODEX_ACTIVE**

## Integration branch
- `phase-public-site-rebuild`
- Family feedback/review is complete as of 21 September 2026.
- Quiet-mode restrictions are lifted. Audited implementation may be pushed phase-by-phase to staging on this branch.
- Current exact integration HEAD: `cdfc8ad2cefb61c992537a3d4cae48e58cfe6aab`; push CI `36330311977` and PR CI `36330314494` are SUCCESS. Exact-head Chromium acceptance: 352 passed in 5.2 minutes.
- Current successful Railway staging deployment: `a7625ecc-5d8b-41d7-a8ac-7cb341e71bfc` from source SHA `b5d5373402e275e3993448914cff75e1bbb23bcb` (`fix: make master copy source reproducible`). Startup encountered one transient Neon P1001, recovered through the existing retry path, and Railway `/api/health/ready` succeeded before deployment reached SUCCESS. The later `cdfc8ad2...` assertion-only commit was correctly SKIPPED by Railway.
- Exact-head repository state is certified by GitHub CI; Railway deploys only application-affecting changes and correctly skips test/documentation-only follow-ups.
- Prior runtime baseline `bce6b1d85bedc9da6e0fb38484e867db71cb4182` / deployment `d0e7608a-df34-425b-9d30-79d1434b1064` remains historical evidence, but that deployment is now `REMOVED` and is not the currently served staging deployment.
- Reserved production service `amaana-platform` now has non-secret hardened deployment parity: `/api/health/ready`, 300-second timeout, restart retry limit 3 and staging-aligned application watch patterns. No deployment was triggered.
- Safe production defaults were staged with deploys skipped: `APP_ENVIRONMENT=production`, `EMAIL_DELIVERY_MODE=disabled`, `NEXT_PUBLIC_ALLOW_INDEXING=false`, and all acceptance/browser flags false. Indexing decision, production public-media bucket, Live payments and live email remain deliberately unresolved.
- Resend production sending-domain resource for `amaanafoundation.org` was created on 27 September 2026 with sending enabled, receiving disabled and tracking disabled. Provider verification has been triggered and remains `pending`; DKIM, SPF MX, SPF TXT and the `rsend` CNAME now all report `pending`, with none yet verified. No transactional email was sent and no new API key was created.
- Live Neon media audit on 27 September 2026: 3 MediaAsset rows total, all unpublished/unapproved initiative-linked legacy VIDEO metadata matching the three removed static MP4s; zero public assets, zero privacy approvals, zero public-without-approval, zero orphaned assets and zero identity assets. No destructive DB cleanup was performed.
- Reserved production service now also has `PUBLIC_MEDIA_BASE_URL=https://amaanafoundation.org/media` configured with deploys skipped. `PUBLIC_MEDIA_S3_BUCKET` and `PRODUCTION_INDEXING_DECISION` remain deliberately unset.
- `main` remains untouched until explicit production-promotion approval.

## Current task stream
- Continue the consolidated audit/enhancement roadmap on the integration branch.
- Curated programme photography is intentionally deferred until the owner finishes selecting images drive-by-drive.
- The media system must remain plug-and-play while that curation happens; do not request replacement media as a blocker for unrelated engineering work.
- Priority UX direction: materially reduce vertical scrolling with deliberate banner, gallery and repeated-card carousels while keeping reading-heavy trust/policy/story content linear.

## Working protocol
1. Keep `main` untouched and indexing disabled.
2. Push coherent, reviewable implementation slices to `phase-public-site-rebuild`; staging auto-deploys browser-affecting changes.
3. Do not initiate real Razorpay payments/refunds or production cutover actions.
4. Do not publish real beneficiary/programme media without the existing human privacy/consent/provenance gate.
5. Do not reintroduce the deleted legacy programme-image pool or heuristic/random hero selection.
6. Use one explicit curated identity/hero image per programme/drive and ordered supporting images.
7. Prefer compact carousels only for media/repeated-card surfaces where they reduce scroll; do not hide long-form accountability or policy reading inside sliders.
8. At each implementation checkpoint, validate build/type safety and retain browser/E2E regression coverage.

## 21 September 2026 media + carousel baseline
- All 191 legacy programme/drive/cause image files were removed from the current staging branch.
- All 175 staging `MediaAsset` IMAGE records were removed. The three legacy static MP4 files were subsequently removed from `public/media`; three matching DB VIDEO metadata rows remain private/unapproved and hosted video remains fail-closed publicly.
- `prisma/integration-media.json` is empty so deleted images cannot silently re-seed.
- Identity image contract is deterministic: `IDENTITY_MEDIA_SORT_ORDER = -1000`; assigning a new identity image demotes the prior identity image for the same target.
- Identity publication requires explicit hero-use approval in addition to the normal privacy/provenance publication gate.
- Shared manual/swipe/keyboard `ScrollCarousel` is implemented without autoplay or a heavy slider dependency.
- Programme galleries use the carousel while retaining the accessible lightbox.
- Long programme-year histories switch to compact carousel presentation when they exceed three entries.
- Impact witness media uses a compact carousel.
- Homepage programme discovery is a horizontal five-area strip.
- A full-width homepage banner carousel is wired but activates only once at least three approved featured identity images exist; until then the existing static PageHero fallback remains.
- Curated image insertion therefore requires data/media work, not another layout redesign. See `docs/CURATED_MEDIA_CAROUSEL_CONTRACT_2026-09-21.md`.

## Completed before this quiet batch
- Secure gated private-bucket public-media proxy and real synthetic upload/publish/unpublish acceptance.
- Database snapshot/restore recovery drill with matching content digests and clean post-restore application startup.
- Fail-closed staging launch acceptance (32 checks) on exact candidate SHA before public-port activation.
- SEO/social metadata hardening and Docker build-time NEXT_PUBLIC_* injection.
- Bounded Prisma advisory-lock retry for transient P1002 migration contention.
- Separate public-media storage from private assistance storage.

## Quiet-batch work completed/in progress

### Release / editorial quality
- Unified read-only launch preflight commands:
  - `npm run launch:preflight`
  - `npm run launch:preflight:rehearsal`
  - `npm run launch:preflight:production`
- Public editorial/compliance guard with tests for:
  - newborn amount ₹107,520;
  - Winter 234 kits / 234 beneficiaries;
  - Aliza amount ₹482,700;
  - provisional 12A/12AB and 80G wording;
  - domestic-only / non-FCRA boundary.
- Exact Aliza public metric changed from rounded `₹4.82L` to `₹482,700`.
- SEO browser coverage now covers all 26 declared static public routes, all four programme-category schemas, generated social images and canonical redirects; exact-head Chromium acceptance completed 352/352.
- Document-title regression coverage prevents duplicate Amaana branding.
- Master-copy generation is now reproducible from tracked `src/content/master-copy.json`; `npm run master:check` is enforced in CI and the confirmed provisional 12A/12AB status is locked against stale source text.
- Privacy, Terms and Refund Policy still explicitly disclose outstanding professional legal/accounting wording review; this remains part of the human `final-editorial-seo-social-review` gate and is not auto-closed by green automation.
- Public/private data-boundary guard prevents public publishing surfaces from reading internal beneficiary/verification/token/storage fields.
- Final human launch QA checklist consolidated into one canonical document.

### Accessibility
- Skip-link target is programmatically focusable.
- Browser acceptance verifies skip-link focus transfer, one H1, document language and main landmark.
- Existing axe, responsive, reduced-motion, keyboard, mobile-focus and 200%-reflow-equivalent coverage retained.
- Branded 404 behavior is browser-tested for 404 status, navigation, noindex and mobile containment.

### Security / privacy / operations
- Private-document signed URL ownership binding and private-cache hardening.
- Admin login timing/identity hardening, bounded credential inputs, expired-session pruning and audited logout.
- Trusted proxy/client-address normalization for rate-limit identity.
- Ephemeral login/donation security-ledger retention/pruning.
- Transactional email worker idempotency/retry/stale-processing recovery plus operational runbook.
- Notification operations page and audited manual requeue path using new `notification.manage` permission.
- Destructive media/private-document deletion intent audit records.
- Public-media route MIME mismatch fails closed; managed PDF delivery acceptance added.
- Staging email delivery remains fail-closed/disabled.
- Browser security-header acceptance now covers CSP, HSTS, framing, referrer, permissions, COOP/CORP and no-store sensitive surfaces.

### Data / query integrity
- Additive operational indexes for audit history, notification lists, security-ledger cleanup and media review ordering.
- No destructive schema migration introduced.

## Additional hardening completed in the quiet batch

### Payment / refund correctness
- Refund processing requires INR and bounded paise values.
- Out-of-order refund webhooks reconcile payment → order and reuse the idempotent capture path before refund accounting.
- Refunds can reopen a FUNDED appeal to PUBLISHED only while the fundraising window is still open; otherwise the under-target funded appeal becomes CLOSED.
- Private donation acknowledgement responses are no-store, no-referrer and noindex.
- Critical unmatched payment/refund events are surfaced in admin donation operations.
- Stored webhook evidence is privacy-minimized.
- Exactly one donor refund notification is queued transactionally for each effective unique refund event.
- `docs/PAYMENT_REFUND_OPERATIONS_RUNBOOK.md` documents the controlled live acceptance.
- Webhook route tests now cover invalid signatures, duplicate event idempotency and end-to-end refund reconciliation into donation/appeal/event/notification records.

### Production indexing boundaries
- Indexing now requires explicit opt-in, official HTTPS Amaana host and `APP_ENVIRONMENT=production`.
- Docker builder defaults `APP_ENVIRONMENT=staging`, making preview builds fail closed.
- `/donate` is a public SEO route while `/donate/<appeal>` remains private.
- All admin surfaces have explicit noindex/nofollow/no-referrer metadata.

### Rollback preparation
- `npm run rehearsal:verify-target` validates exact deployed SHA, health/readiness, representative public routes and private no-cache/noindex boundaries.
- Pinned previous-known-good branch remains `rehearsal/rollback-baseline-2026-09-18`.

### Production RBAC correctness
- New notification view/manage permissions are not seed-only.
- Migration `20260918111500_notification_operations_rbac` idempotently creates/grants them to PRIMARY/BACKUP approvers in production.
- Manual email recovery uses an atomic FAILED-only claim and cannot race an active worker into a duplicate send.
- Notification worker tests cover atomic claim, stable provider idempotency, SENT transition, transient retry scheduling and concurrent claim loss.

## Current background correction
- Six corrected approved SVG source files were supplied and landed byte-for-byte in `public/backgrounds/`.
- `scripts/verify-approved-backgrounds.mjs` locks their SHA-256 hashes and launch preflight fails closed if repo assets differ.
- The family-review deployment still serves the previous backgrounds; responsive rendered QA remains pending until the next controlled staging deployment.

## Operational note
- The preview service remains healthy on the family-review SHA.
- The notification cron's historical failed build was caused by the superseded admin-login TypeScript error, not by the worker. The active cron deployment is healthy and was observed on 19 September 2026 firing every five minutes and receiving HTTP 200 with `status:"disabled"`, which is the intended staging posture.
- No separate cron deployment is required merely to repair that historical failure.

## Additional implementation completed on 19 September 2026

- Donation checkout remount regression fixed with Next Script `onReady` plus an already-loaded `window.Razorpay` fallback; browser acceptance now reproduces unmount/remount behavior so the form cannot remain stuck on “Preparing secure checkout…” after revisiting the page.
- Explicit `payment.failed` webhook state-guard tests added; failed payments cannot increase appeal accounting.
- Transactional-email operations gained a controlled self-recipient acceptance action for authorised staff only, duplicate-active-acceptance protection, audit logging and Resend provider-message-id persistence/visibility.
- Production environment contract now fails closed on staging/Live Razorpay mix-ups, wrong production canonical origin, shared assistance/public-media buckets, insecure public-media origin and launch-only acceptance flags.
- Version health now exposes only non-secret deployment posture (`environment` and Razorpay `paymentMode`); staging/rollback acceptance requires `staging + test`.
- Assistance browser acceptance now covers a synthetic private PDF in the multipart submission. Route tests lock private-document persistence and compensation cleanup when the later database write fails.
- Additive migration `20260919142000_notification_provider_message_id` stores the external email provider message id for delivery reconciliation. It has not been applied to staging/production yet.
- These new quiet-branch changes still require consolidated lint/typecheck/unit/build/browser validation before integration.

## Remaining genuine launch gates
- `rollback-rehearsal` — real staging rollback to a previous known-good deployment and restoration still required.
- `transactional-email-delivery` — controlled live production sender acceptance required.
- `manual-rendered-accessibility-review` — final human rendered review required.
- `final-editorial-seo-social-review` — final human copy/social preview review required.
- `public-media-human-review` — individual media privacy/consent/provenance review required.
- Razorpay account/KYC and website approval are VERIFIED. Provider-backed Test Mode capture, webhook delivery, acknowledgement/accounting and a full refund with `refund.processed` reconciliation are verified. Separate Live API credentials and a separate Live webhook now exist and remain outside staging. Remaining payment gates are provider-backed `payment.failed` evidence (or documented Test Checkout limitation), production-only Live credential installation, controlled real donation acceptance and production receipt/email/refund operations.
- explicit production indexing decision.
- explicit `main` promotion/production approval.

## Recovery anchors
- Database recovery snapshot evidence is recorded in `docs/DATABASE_RECOVERY_DRILL_2026-09-18.md`.
- Preserved Neon branch: `pre-recovery-original-2026-09-18`.
- Pinned rollback baseline branch: `rehearsal/rollback-baseline-2026-09-18` at healthy SHA `4f7cbafb87e8c7d75fd7191d7bcc7a83c9320a3d`.

## Locked facts
- Newborn medical aid: **₹107,520**.
- Winter Drive 2025–26: **234 Winter Kits distributed to 234 beneficiaries**.
- Aliza critical-care appeal: **₹482,700**.
- Taleem Nazira + Hifdh: **25 students combined as of September 2026**.
- Amaana is **not FCRA-registered**; fundraising remains domestic-only.
- 12A/12AB and known 80G status are **provisional** and must be described that way.


## 21 September 2026 implementation checkpoint — carousels, donor intent and guided assistance

### Scroll reduction and curated-media architecture
- Shared manual/swipe/keyboard `ScrollCarousel` now powers programme galleries, long programme-year histories, Homepage field work/programme discovery, Impact witness media and supporting Story media.
- The Homepage full-width curated banner is structurally complete and intentionally activates only once at least three approved featured identity images are available; it supports up to five curated slides and never autoplays.
- Story metadata, Story heroes and Story discovery cards now use the explicit identity-image contract instead of first-file heuristics.
- Mobile Home proof metrics and Impact metrics become horizontal snap strips instead of long stacked blocks.
- Curated image insertion remains data/media work. Do not redesign these surfaces when the selected photographs arrive.

### Donation intent
- Added a donor `givingIntent` record with values `GENERAL`, `SADAQAH` and `ZAKAT`.
- Donor giving intention remains separate from appeal designation and separate from the internal beneficiary Zakat-eligibility review.
- Zakat is offered only when the appeal's private verification record is explicitly `ELIGIBLE`; the order API re-checks this server-side and rejects forged Zakat intent otherwise.
- Giving intent is persisted on the Donation, included in Razorpay order notes, private acknowledgement, donor acknowledgement email payload and admin donation/reconciliation views.
- Additive migration: `20260921103000_donation_giving_intent`.
- The same additive enum/column/index were applied to the staging Neon branch before code rollout; existing records default to `GENERAL`.
- The complete donation-intent stack built successfully on Railway at `430329957477bf513b79577bbeae47f6602d3b3c`.

### Mobile appeal conversion
- Open verified appeal pages now have a mobile-only persistent “Support this appeal” action.
- It is deliberately absent on closed appeals and is not globally injected across Stories/programmes.
- Safe-area spacing prevents the bar from obscuring content and shifts Back-to-top/Companion overlays upward on affected pages.
- Isolated browser acceptance fixture and regression spec cover open/closed state, horizontal containment and floating-control overlap.

### Request Assistance
- The request form is now a genuine four-step guided flow: Contact → Need → Supporting Evidence → Confirm.
- Current-step validation prevents invalid forward progression.
- Input/file state is preserved between steps; the final request remains one secure multipart submission.
- Server validation errors reopen the exact step containing the rejected field and focus that control.
- Browser regression coverage follows the real progressive flow and preserves the private PDF upload test.
- Production compile/TypeScript succeeded and Railway deployment `32b31a06-8577-49d6-b283-e9c3183940ca` reached SUCCESS.

### Performance / regression guards
- Dynamic Homepage data loading is narrowed to dedicated appeal + discovery projections instead of loading unused story/faith/archive data.
- Public media retains intrinsic layout reservation.
- Browser performance coverage records CLS for Home, About, Our Work, Donate and Request Assistance with a <= 0.10 launch budget.
- Hosted GitHub browser workflow execution is not currently being reported for the newest test-only commits. Do not describe those Playwright specs as executed until a runner result is available.

### Current validation note
- Story curated-media deployment `cef325f99e55548596a4e452e549e0c4804b675d` reached SUCCESS before being superseded.
- Guided Assistance deployment `22e252dedd7cc988c9da96f4e72384ef6ecf6e61` reached SUCCESS.
- Latest mobile metric-strip head `71ea4b429e9cfaa6b1fcb3369b453d7cdb64cfef` is in Railway deployment validation at the time of this checkpoint.

## Codex continuation — 2026-09-23

- Ownership: CODEX_ACTIVE (explicit user handover).
- Task branch: fix/webhook-retry-scope; integration: phase-public-site-rebuild.
- Verified baseline HEAD: e76744a28e3da94ce239e45af96f01510fc5524e; no open integration PRs.
- PRE_EXISTING failure: CI run 35772257463/job 106897043629 and staging deployment b85e2a7a-c63f-4ae6-a404-489e3148bf9e fail TypeScript at razorpay/route.ts:254 (payload outside try scope).
- Immediate task: restore retry-handler compilation with event-type collision regression coverage; then durable refund-entity idempotency and private credential lifecycle.
- Main, production controls, live payments/refunds, private media publication remain protected. Impact redesign on hold.

## Codex phase A — 2026-09-23

Ownership CODEX_ACTIVE. Branch fix/refund-entity-idempotency. Recovery PR #102 merged at 30f157521776a1fadf70d326d1cff44d88e69e1f after PR CI passed. Implement additive refund identity ledger with legacy backfill, atomic accounting and real PostgreSQL concurrency tests. Integration build/deploy certification pending. No production actions.

## 24 September 2026 — final launch/cutover certification checkpoint

### Certified application candidate
- Application SHA: `bce6b1d85bedc9da6e0fb38484e867db71cb4182`.
- GitHub Actions run `36012879631`: **SUCCESS** on the exact candidate.
- The run passed the full integration gate, including lint, TypeScript, isolated PostgreSQL refund-ledger verification, coverage, production build, bundle budgets, post-build smoke checks, isolated browser fixture/workspace, Chromium installation, and responsive/accessibility/journey Playwright acceptance.
- Railway staging deployment `d0e7608a-df34-425b-9d30-79d1434b1064`: **SUCCESS** on the same exact application SHA.
- Railway's strict `/api/health/ready` check passed only after the database became reachable; the system correctly remained fail-closed during the prolonged Neon P1001/P1002 incident.
- Real startup recovery evidence from that deployment:
  - reviewed-campaign import recovered after transient database failures;
  - RBAC seed recovered after a transient database failure;
  - staging-acceptance seed recovered after transient database failures;
  - Next.js reached Ready;
  - Railway promoted the candidate only after DB-backed readiness returned healthy.

### Canonical routing/discovery closure
- Legacy `/our-work/*` aliases are centralized and deterministic.
- Legacy `/programmes/*` compatibility routes are also deterministic and no longer depend on database availability before redirecting.
- The static shadow route `/our-work/medical-financial-assistance` now redirects deterministically to the canonical medical/financial programme category.
- Sitemap/public discovery excludes legacy aliases and preserves published/canonical routes.
- Programme-category JSON-LD and canonical metadata are covered by regression tests.
- Homepage/Story/Faith related work links use canonical destination helpers.

### Launch-readiness register
- Rehearsal: **5/6** required gates resolved.
- Production: **9/19** required gates resolved.
- The only unresolved rehearsal gate is `rollback-rehearsal`.
- Rollback rehearsal remains pending because the connected Railway action surface exposes redeploy-latest but not deployment of an arbitrary historical deployment/snapshot. Do not fake this gate through Git rewrites.
- Current candidate and previous known-good deployment identities are recorded in `docs/launch-readiness.json`.

### Remaining production gates
The following remain intentionally PENDING until actual evidence exists:
- approved background artwork human rendered QA;
- transactional live email delivery acceptance;
- final human rendered accessibility review;
- final editorial/SEO/social-preview review;
- public-media privacy/consent/provenance review;
- controlled Live donation acceptance;
- refund/receipt operational production acceptance;
- real staging rollback rehearsal;
- explicit production indexing decision;
- explicit `main` promotion and production authorization.

### Protected actions
- Do not merge/promote to `main` without explicit user approval.
- Do not enable production indexing without the explicit production indexing decision.
- Do not install/use Live Razorpay credentials on staging.
- Do not initiate a real donation/refund merely to make a readiness gate green.
- Do not mark human privacy/accessibility/editorial gates VERIFIED from automated evidence alone.
- Impact-page visual redesign remains deferred until the owner supplies the separate redesign prompt.


## 28 September 2026 — approved background integration

User explicitly requested integration of all six revision-4 SVGs after design review. Codex owns this scoped implementation on `feat/approved-svg-backgrounds`, based on verified integration HEAD `6bb0666c45aa274e5e44a0a7d0339198802164e5`. Only open PR is draft production promotion #104; do not merge it. Replace approved assets byte-for-byte, refresh hash lock, adapt responsive placement and verify readability without changing content or footer height. Baseline push CI 36341349733 fails browser acceptance (classification in progress); PR checks pass. Production remains protected.


## 2026-09-28 — Approved vector background integration
- Current task PR: #105, `feat/approved-svg-backgrounds`, based on `6bb0666c45aa274e5e44a0a7d0339198802164e5`.
- All six revision-4 assets copied byte-for-byte; SHA-256 guard and XML/native-vector checks pass locally (51,146 bytes combined).
- Shared responsive token paths retained. Light body whitening gradients removed; dark-section contrast layers retained. Homepage carousel frame now consumes the header token. Footer height is still content-driven.
- PR CI and staging/browser verification pending at this checkpoint. Do not infer production approval.
- Pre-existing integration CI 36341349733 fails typography-hierarchy at 1440/390 (Arial vs serif expectation); unrelated to this asset change and not suppressed.
