## 2026-10-14 IST — R-025 canonical fact and governance heading leading

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent 0a255bc0fb269b15de6b17ae295bcb70d4632f9a. Two remaining source-level tight heading declarations in src/app/canonical-content.css: canonical fact display strong line-height 1.10 and governance summary strong shorthand 1.05. Adjust both to 1.12 without altering font-size, weight, colors, element semantics, layout, or cascade order. Exact-string preconditions and resulting declarations verified against remote parent; no new specificity, selectors or assets. R-025 remains PARTIAL until actual mobile/zoom/browser acceptance and broader selector coverage. No local browser or production build run in this tool environment. No merge, deploy or provider/data operations. Next: independently verify rendered multiline headings and continue original register.

## 2026-10-14 IST — R-061/R-066 shared component stylesheet governance

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013, parentfe32bd4cf35a8a0ead239201fcc0d98576f91576. Owner cx authorized continuation; no concurrent writer.

Original R-061/R-066 gap: native Stylelint checked only donate-audit.module.css, leaving all17 shared component modules outside its two existing rules. Diagnostic recorded49 hex-color occurrences and9 exact duplicate selectors. Extend the existing pinned stylelint:governed command to the component-module glob plus donation audit, with zero-warning enforcement through the existing npm run lint/CI entrypoint. No dependency or new workflow/status infrastructure.

Replace46 component hex occurrences with exact-value canonical palette roles; remove three redundant literal fallbacks where the canonical token is defined. Reuse existing surface/canvas/blue roles and add16 exact legacy component colors to the canonical root. Preserve approved RGB values, including image masks, photography stages, donor/intake feedback and placeholder gradients. Consolidate9 exact repeated selectors within their own rule containers, including amount emphasis, intake step navigation and carousel witness cards; discard overwritten same-property declarations while retaining important flags. Other grouped reconciliation/route/global rules are outside this bounded batch.

Validation: all17 component modules plus donation audit pass both native rules. A disposable new component module with a hex color and duplicate selector fails the expanded actual command with both diagnostics; removed before commit. Temporary PostCSS comparison across340 stylesheet/width/motion matrices preserves normalized winning property values and important flags per exact selector, with replacement tokens resolving to prior RGB. This does not prove every cross-selector/rendered cascade. Full npm run lint passes; full unit suite1005passed/9database-dependent skipped; diff and secret/static-image guards pass. Clean compile-mode build passes:JS813132/819200bytes,CSS347008/348160bytes. No runtime TS change or new permanent tests. R-061/R-066 remain partial: RGB/alpha literal governance and route/global CSS coverage remain open; hosted browser/deployment acceptance is unverified. No main merge/deploy or live provider/data changes. Next: remaining original CSS/tooling and runtime gaps.

## 2026-10-14 IST — framework navigation feedback corrected

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013, parent402b83b43937c622674f64260ef34dc335bcd54b. Owner cx authorized continuation; no concurrent writer.

Older browser run38449403934 failed both policy-loading cases and mobile-header loading twice: no overlay existed. Confirmed source cause: Next client navigation calls preventDefault, so the document click listener interpreted framework handling as user cancellation. Add one thin NavigationLink owner using native useLinkStatus in a descendant; its headless status component reports true pending and cleanup through a shared event. Update52 application Link imports to this owner; native Next props, refs, prefetch, server child content and hrefs remain. The global indicator associates pending with link identity: older completion cannot clear a newer transition, completion/cancellation/unmount releases its owner, history resets. Plain native anchors retain the existing cancelled/modifier/external/same-path exclusions, with safer Element target narrowing. No navigation monkeypatch, timer heuristic or loading.tsx boundary. Official API: https://nextjs.org/docs/app/api-reference/functions/use-link-status.

Browser acceptance now blocks About before opening the initial page, preventing successful prefetch from legitimately skipping pending. Preserve full overlay geometry, logo/dots, body lock, populated page shell and post-navigation dismissal assertions. Add actual framework-link cancellation case alongside existing native-anchor cancellation; cancelled links must leave route/loading unchanged. Fully prefetched transitions correctly skip pending.

Validation: six actual-component status/effect tests pass with mocked framework hook and DOM event boundaries. Restoring the old progress listener fails framework-start and overlapping-owner checks. Full suite1005passed/9database-dependent skipped; TypeScript and full repository zero-warning ESLint pass; browser syntax/diff checks pass. Clean compile-mode build passes:JS813132/819200bytes,CSS346266/348160bytes; client-secret/static-image guards pass. Existing52 imports are the only changes in their callers. Browser runtime/production prerender and rollout remain unverified. This repairs existing feedback; R-071 route skeletons remain open and the prior unsafe loading-boundary approach remains prohibited. No original95 closure inferred, main merge/deploy or live provider/data changes. Batch complete; next: exact-head browser evidence when available and independent original-register defects.

## 2026-10-14 IST — R-054 lazy thumbnail sizing and acceptance corrections

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013, parent8990d6d687135ddb1391d566870e1cb610549d09. Owner cx authorized continuation; no concurrent writer.

Older hosted browser run38449403934 failed thumbnail acceptance at390px/200% (64w candidate versus128px rendered width) and at tablet/desktop image readiness. HTML source-size rem units resolve like Media Queries against initial font size, not author CSS enlargement. WorkPortfolio now uses auto first on its existing lazy optimized images, with prior mobile/tablet/desktop rem hints as legacy fallback. Explicit CSS slot and intrinsic dimensions remain. Primary references: https://html.spec.whatwg.org/multipage/images.html#sizes-attributes and https://drafts.csswg.org/mediaqueries-4/#units. No new client hook or optimizer host allowance.

Correct the synthetic fixture: prior one-pixel PNG fails strict sharp decoding; its pixel size also violates larger width descriptors and can yield zero density-corrected naturalWidth. Generate flat-color PNG at each requested candidate width and matching4:3 aspect using existing app sharp dependency, resolved with the existing browser-workspace createRequire pattern. No real media request or new dependency. Seven32–384w synthetic candidate rasters strictly decode at declared widths. Keep currentSrc candidate bounds, CSS slot dimensions, lazy loading and enlarged-text checks.

R-025 acceptance-only correction: iterating nth locators over shrinking details:not([open]) skipped disclosures and waited forever; hosted log confirms nth(3) timeout twice. Iterate stable disclosure locators and click only those still closed. Actual user clicks and all heading line-height/containment assertions remain. No typography source closure added.

Validation:25focused portfolio/public-media tests pass; restoring previous thumbnail hint fails the updated actual-render regression. Full suite999passed/9database-dependent skipped; TypeScript, focused zero-warning ESLint, browser syntax and diff checks pass. Clean compile-mode build passes:JS812195/819200bytes,CSS346266/348160bytes; secret/static-image guards pass. Actual browser execution and deployed transfer/CWV remain unverified; R-054 stays partial. No main merge/deploy or live provider/data changes. Next: navigation feedback failures and remaining original-register work.

## 2026-10-14 IST — delegated motion press ownership corrected

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013, parent c48e1030737f26b35a7b3392e84a89d3d28183b6. Owner cx authorized continuation; no concurrent writer.

Older hosted browser run38449403934 recorded the native press regression twice: pointer-down was followed by focus feedback which replaced pressed scale0.98 with1. Track the primary pointer owner and keyboard owners separately. Hover/focus preserve held state; pointer-up/cancel and key-up release the original control even if event target changed. Window blur releases held controls; reduced-motion reset clears ownership and inline effects. Native delegated WAAPI, existing selectors and route teardown remain. No hydration/CWV bottleneck closure inferred.

Validation: five actual-effect tests pass with stub event/DOM/animation boundaries. Restoring the prior module fails three of the initial four cases. Full suite999passed/9database-dependent skipped; TypeScript, focused zero-warning ESLint, browser syntax and diff checks pass. Clean compile-mode build passes:JS812195/819200bytes,CSS346266/348160bytes; client-secret/static-image guards pass. Existing browser press case now explicitly focuses while held; an additional case releases outside the action. Browser execution remains unverified locally. This is a task-introduced motion correction, not an additional original95 closure. No main merge/deploy or live provider/data changes. Next: responsive thumbnail and remaining navigation/typography acceptance failures.

## 2026-10-14 IST — N-20 gallery opener focus correction

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013, parent fb08de7b21bd0926e1063ddadf2661dec81e56e9. Owner cx authorized continuation; no concurrent writer.

Actionable hosted evidence: older fee578a0 workflow38449403934 browser job115477111117 was cancelled after recording failures. Final verify failed because BROWSER=cancelled; fast/database/production jobs succeeded. The duplicate-ID gallery case failed twice after ArrowRight then Escape: focus returned to the last viewed photograph rather than the opening thumbnail. Preserve opener identity in a ref and resolve its current position for cleanup. Existing connected-thumbnail fallback handles removal; image selection, modal keyboard trap and overflow cleanup remain intact. Reorder browser regression now navigates away before closing and still expects the opening identity.

Validation: actual-component effect regressions cover navigation, reorder and opener removal; restoring the old active-index target fails two of three. Five focused gallery tests pass. Full suite994passed/9database-dependent skipped; TypeScript, focused zero-warning ESLint, browser syntax and diff checks pass. Clean compile-mode build passes:JS811745/819200bytes,CSS346266/348160bytes; client-secret/static-image guards pass. Local effect tests use stub DOM/hook boundaries; actual browser correction is not yet certified. N-20 remains a source candidate, not deployed; no original95 closure inferred. Other old-run failures include responsive thumbnail acceptance, navigation feedback, motion press ownership and typography fixture interaction; these still require diagnosis. No main merge/deploy or live provider/data changes. Atomic gallery task complete; next: correct remaining actionable browser failures.

## 2026-10-14 IST — R-069 native lint protections implemented

Ownership: REVIEW_PENDING. PR #292 / fix/direct-transfer-feedback-20261013, parentaec129da47c3d37d123a09d918a3943716eedf78. Owner cx authorized continuation; no concurrent writer.

Enable existing Next-supplied import/no-cycle for src TS/TSX with external packages excluded and runtime dynamic cycles still rejected. Next already supplies eslint-plugin-import2.32.0 and TypeScript resolver3.10.1; no dependency added. A360-file diagnostic passed. Disposable real two-file runtime cycle triggers both participants; the same files changed to type-only references pass.

Add supplemental jsx-a11y/control-has-associated-label for button/summary/ARIA-role names with nested text depth5. Native input/select/textarea associations retain existing label checks: this supplemental rule cannot resolve external/wrapping native labels and initially produced false positives. Do not manufacture duplicate aria-labels. Actual unnamed-button probe fails and named-button probe passes. All probes removed before commit.

Validation: full npm run lint passes (repository ESLint zero warnings plus existing governed Stylelint). Final post-cleanup repository ESLint and diff checks pass; tracked scope is lint configuration and existing coordination/register docs only. App unit/build suites were not rerun because runtime/source assets are unchanged from prior validated image batch. No full WCAG/strict-profile/production acceptance claim; R-069 remains partial pending broader policy acceptance and hosted execution. No main merge/deploy or live provider/data operations. Atomic lint task complete; no active writer. Next: inspect exact-head acceptance and continue remaining original requirements.

## 2026-10-14 IST — R-052/R-054 public image delivery batch completed

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent5c6f6a7c17a322df54f0624a5c569368d7375020. Owner cx authorized continuation; no concurrent writer.

R-054: PageHero canonical owner exports one full-mobile/half-desktop image-sizing hint. Apply to priority photographs/artwork in eight public hero surfaces: About, appeals, Get Involved, education sponsorship, Our Work index, initiative detail, programme categories and umbrella programme detail. Previously some inherited a body70vw hint at tablet widths, while others advertised90vw despite full-mobile photo layouts. Body/gallery/portfolio sizes and lazy behavior stay scoped. Category browser acceptance now includes768px and explicit hero sizes alongside existing preload/lazy checks.

R-052: PublicMedia and CampaignMediaGallery optimized only root-relative paths, so an approved absolute Amaana/media URL bypassed responsive optimization. Shared getPublicImageOptimizationUrl converts only same configured HTTPS app-origin /media/ and /brand/ paths. Never grant optimizer access to external hosts, private/API paths, credentialed URLs, HTTP or malformed origins. Existing direct external/data-image delivery and public consent/cache/size guards retained. Actual-component baseline reproduces absolute-URL bypass; corrected native Image output/preload checks pass. Gallery thumbnails/lightbox share this policy.

Validation:32 focused image-render/policy tests pass; full suite991passed/9database-dependent skipped,105suites passed/one skipped. TypeScript and focused zero-warning ESLint across all affected TSX/helpers/tests pass; React review retains server components, direct imports, no new hooks/request waterfalls, existing alt/intrinsic dimensions and priority scopes. Clean compile-mode build passes:JS811676/819200bytes,CSS346266/348160bytes; client-secret/static-image guards, browser syntax and diff checks pass. No production transfer/CWV, browser/current-head hosted prerender or live rollout proof claimed. R-052/R-054 remain partial until broader responsive/network and deployment acceptance. No main merge/deploy or live money/mail/storage/data/config operations. Batch complete; no active writer. Next: inspect exact-new-head acceptance and correct real failures before release.

## 2026-10-14 IST — standalone global-error typography corrected

Ownership: REVIEW_PENDING. Existing PR #292 / fix/direct-transfer-feedback-20261013, parent c4e0ccc8ae46db36be9d879a15073beb2685b0ee. Owner cx authorized continuation; no concurrent writer.

R-024/R-025 confirmed missed inline occurrences in global-error.tsx: label .72rem (11.52px at normal root) and heading .85 line-height. The standalone fallback replaces the normal root layout, so external accessibility CSS cannot be relied on. Set label .75rem and heading1.12 directly in the canonical fallback. Preserve approved background, text, private-error omission and reset action. No R-057 CSS relocation was performed: that investigation lacked rendered cascade/error-route proof.

Two actual fallback-render typography tests fail on original source and pass after correction; a third verifies complete English document, single H1, recovery control/guidance and private-diagnostic omission. Three focused tests, TypeScript, zero-warning focused ESLint and diff checks pass. Clean compile-mode build passes: JS810842/819200bytes, CSS346266/348160bytes; secret-boundary/static-image guards pass. Full unit suite was not rerun for these two presentation values. Browser/device/global-error recovery acceptance remains unverified locally because Chromium is unavailable.

Earlier fee578a0 CI38449403934 fast/production/database/readiness passed; browser remains running. Attempted running-job logs returned BlobNotFound404, not application failure evidence. Current/new-head hosted acceptance remains required. R-024/R-025 stay partial pending broader rendered and deployment acceptance. No main merge/deploy, live payment/mail/storage/data operation or original-audit closure. Atomic standalone-fallback task complete; no active writer. Next: obtain exact-head acceptance evidence, correct real failures and continue remaining authorized source work.

## 2026-10-14 IST — R-026 single-story archive label corrected

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013, parent cbae8ef48d6ebf52f0dbe4b8255398e7b89a9935. Owner cx authorized implementation; no concurrent writer.

Confirmed R-026 occurrence: stories.css .v2-stories-single-note span displayed the small Archive beginning label in bright --v2-gold on light archive paper, used when exactly one story is published. Replace only that foreground with existing --af-color-gold-ink. Source-token contrast on canvas #faf6ec improves1.83:1 to8.36:1; brand fills/borders unchanged. Source guard fails on old rule and passes after correction.

Six source/token contrast checks and34planner tests pass. Add four loaded-/stories stylesheet regressions at390/1440px and100/200%text, creating the exact one-story note markup without depending on archive record count; assert computed composite contrast>=4.5 and scaled readable font. Browser cases not locally executed (Chromium unavailable). Browser syntax, focused zero-warning ESLint and diff checks pass. Clean compile-mode build passes: JS810840/819200bytes and CSS346266/348160bytes; client-secret/static-image guards pass. Previous968unit/API test result belongs to the prior TS-source head, not a newly rerun full unit suite for this CSS-only change.

Current parent CI38450646534 pending at initial read; earlier fee578a0 fast/production/database/readiness successful with browser running. Exact-new-head acceptance remains required. R-026 stays partial until broader contrast and deployment review; no original-audit full closure inferred. No main merge/deploy or live payment/mail/storage/data operations. Atomic batch complete; no active writer. Next: inspect new-head acceptance and continue remaining register items.

## 2026-10-14 IST — R-008 Breadcrumb and Appeal runtime guards completed

Ownership: REVIEW_PENDING. Existing PR #292 / fix/direct-transfer-feedback-20261013; parent a291c65fbf93ec80e0d0240e562b48767ab9c69d. Owner cx authorized continuation; no concurrent writer.

R-008 uncovered source occurrences: Breadcrumb mapped unchecked items/paths and could throw for malformed runtime records; Appeal trusted TypeScript-only fields and could emit object-valued text or treat string isOpen=false as truthy. Add bounded strict Zod validation to shared structured-data library and use it in both components. Invalid optional schema returns null without preventing the main page from rendering. Breadcrumb destinations require safe root-relative paths; Appeal slugs require the existing lowercase hyphenated shape. Preserve valid text exactly, hardened escaping, sensitive-appeal redaction and real boolean donation-action gates.

Nineteen new actual-component cases (ten breadcrumb/nine appeal) all fail against original source; corrected source passes all. Five prior output/privacy/escaping cases remain passing. Focused JSON-LD suites:28 passed. Full unit/API suite:968 passed, nine database-dependent skipped,102 suites passed/one skipped. TypeScript, focused zero-warning ESLint and diff checks pass. Clean compile-mode Next build passes, JS810840/819200 and CSS346256/348160 bytes; client-secret and static-image guards pass. No browser/full hosted prerender or live deployment certification inferred.

Prior fee578a0 CI38449403934 fast/production/database/readiness passed; browser running at the last read. Current parent a291c65f CI38450017088 pending. This new source requires exact-head acceptance. R-008 now covers Article/WebPage, Breadcrumb and Appeal dynamic inputs; production closure remains pending. No real payment/mail/storage/data writes or main merge/deploy. Atomic batch complete; no active writer. Next: inspect new-head failures and continue original register work.

## 2026-10-14 IST — R-009 remaining JSON-LD surfaces completed

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent fee578a0c644549b6a2102946fc7079f508a6597. Owner cx authorized source continuation; no concurrent writer.

R-009 source gap: Organization, Breadcrumb and Appeal JSON-LD still independently escaped only less-than, while PublicContent used the existing complete serializer. Replace all three with serializeStructuredData from src/lib/structured-data.ts. All four JSON-LD rendering components now escape less-than, greater-than, ampersand and U+2028/U+2029 consistently. Existing less-than escaping already prevented HTML script termination; this is completion of the audited broader escaping requirement, not a newly demonstrated XSS exploit.

Five actual-component render regressions retain real React/server output and actual serializer. Three sensitive-character cases fail against original components; corrected output passes JSON round-trip, graph identity, canonical breadcrumb/donation targets, sensitive-appeal redaction and closed-appeal action omission. No canonical content, figures or payment execution changes.

Validation: nine focused JSON-LD tests pass; full unit/API suite 949 passed, nine database-dependent skipped (102 suites passed, one skipped). TypeScript, focused zero-warning ESLint and diff checks pass. Clean compile-mode build passes; JS 810840/819200 bytes and CSS 346256/348160 bytes. Client-secret/static-image guards and actual emitted route report pass. This does not certify full prerender, hosted database/browser or production rollout. Parent CI38449403934 plan/fast/readiness passed, production/browser/database running at last check. No main merge, deployment or real money/mail/data/storage operations. R-009 source occurrences are covered, deployment closure pending. Next: inspect exact-new-head acceptance and continue remaining original register items. Atomic batch complete; no active implementation writer.

## 2026-10-14 IST — R-054 Our Work thumbnail slot correction

Ownership: REVIEW_PENDING. Completed atomic continuation on PR #292 / fix/direct-transfer-feedback-20261013, parent 8bb927bb86834018924abbd1371c19899deecb08. Owner cx authorized same-branch implementation. No concurrent writer.

Confirmed R-054 source occurrence: WorkPortfolio identity thumbnails use CSS widths 4rem/5.5rem/6.5rem at <=600px/<=1000px/desktop, but inherited PublicMedia sizes of 100vw/70vw/900px. Original actual-component regression fails on that oversized hint; fixed markup passes and offers small responsive candidates while preserving lazy loading, alt text, intrinsic dimensions, identity selection and approved fallback. Rem-based sizes also match 200% root text.

Coverage: two actual React/Next component-render tests; six Playwright cases at 390/768/1440px and 100/200% text check slot width and selected candidate, using opt-in disposable synthetic media and intercepted 1px PNG responses. No beneficiary or storage requests. The unchanged default portfolio fixture remains photo-free. Browser cases are authored, not executed locally: Chromium remains unavailable.

Validation: 12 focused actual-component/media-policy tests and 34 CI-planner tests pass. Application and materialized-fixture TypeScript checks, focused ESLint, browser syntax and diff checks pass. Clean compile-mode build passes: JS 811235/819200 bytes, CSS 346256/348160 bytes. Secret-boundary and checked-in image-weight guards pass. Fixtures excluded from production route build and removed from tracked workspace. Full hosted production/database/browser acceptance remains required; parent CI was pending at the initial read. R-054 remains partial until broader hero sizing and deployed acceptance; no new original-audit closure. No production merge/deploy or live data/provider operations. Next: review exact-new-head acceptance and continue independent original defects. No active writer.

## 2026-10-14 IST — R-025 shared heading and R-047 route attribution batch

Ownership: REVIEW_PENDING. Existing PR #292 / fix/direct-transfer-feedback-20261013, parent 20f126bd75d0cd9bbd4de34b860805585d0e9080. User handover authorizes continuation; no concurrent implementation writer. Local checkout and dependencies restored.

R-025: fix five shared/component/Home leading occurrences (1.00/1.04/1.08 -> 1.12) in experience-finish.css, section-heading.module.css and home-documentary.css. Add 12 rendered cases covering Contact shared/component headings, Home section headings and expanded programme-card titles at 390/1440px with 100/200% root text. Cases require present/visible headings, actual computed leading and text containment. Browser execution pending: local Chromium download returned invalid/truncated ZIP; no rendered pass claimed.

R-047: Next 16 omits app-build-manifest but emits per-page client-reference JSON with entryJSFiles/entryCSSFiles. Parse JSON without evaluating the JS wrapper; deduplicate page, ancestor layout and shared runtime/polyfill files; exclude clientModules on-demand inventories and unrelated metadata/error entries. Report unsupported routes explicitly and retain aggregate-only fallback. Actual clean local build attributes 46 pages; seven special/server-only/redirect routes remain unattributed. Figures are uncompressed manifest-assigned entry bytes, not observed network transfers or field CWV.

Validation: 942 unit/API tests passed, nine database-dependent tests skipped; TypeScript and focused ESLint passed. Eight analyzer tests plus 34 CI-planner tests pass (42 combined). Clean compile-mode Next build passes: JavaScript 810840/819200 bytes, CSS 346256/348160 bytes. Client-secret and static-image guards pass. The earlier dirty incremental build retained obsolete CSS and is not budget evidence. Full hosted prerender/database/browser verification remains required. Prior-head CI 38446049892 remained pending at the last read and does not certify this batch. No main merge/deployment, live payment/email/storage/database writes or original-audit closure claim. Next: review exact-new-head acceptance, fix confirmed failures, then continue remaining original audit items. Atomic batch complete; no active writer.

## 2026-10-13 — checkout uncertainty and public-media timeout continuation (not original audit closures)

N-34: HTTP500/502/network-loss order responses could restore editable form after possible provider-order creation. Source ee3cc7a locks reconciliation on uncertain outcomes; 6930d14 preserves correctable pre-write HTTP400/403/409/413/429. Regression 248ba1d changes stale 500 expectation and adds three real-component ambiguous-outcome cases.

N-31: 693fe51 trims bounded verification/order error strings before display; e5c91da tests whitespace-prefix rendered feedback in the locked and correctable paths.

N-28/N-18 public media: 568f64c bounds stalled S3 GetObject transport and async iteration within 15 seconds using SDK AbortSignal and best-effort stream destruction; dea63c6 adds two real-module stalled transport/stream cases. Prior size, verified-length, consent, privacy and bucket restrictions retained.

Final source/test head 568f64cccd17e2312794c2c967b379ece02b8a4c. No local test execution because GitHub DNS/network access was unavailable for cloning. Hosted acceptance and unchanged asset budgets required before any merge; historical 95-row totals remain unreconciled. No deployment, live transaction or production data write.

## 2026-10-13 — malformed payment feedback and media cancellation completed

Ownership: REVIEW_PENDING for completed continuation of existing PR #292 / `fix/direct-transfer-feedback-20261013`, parent `c0ea335d2015f4b97a26928fc508847e38d7ea3a`. Owner `cx` authorized execution. Prior 0fd3838 full browser acceptance passed 1,424 Chromium and 24 Firefox/WebKit cases; final-parent CI 38417911131 passed fast, database and production, with browser still running. Those results do not certify this newer source.

N-31 follow-up: non-string confirmation errors previously reached React rendering, where object-valued feedback could crash the payment form and discard its local follow-up state. Accept only non-empty string error feedback and bound it to 500 characters; otherwise use the existing verification-pending guidance. Preserve entered donor values, payment reconciliation and the duplicate-submission lock. Add five real-component browser cases for object/array/numeric/null/empty error payloads; hosted execution remains pending.

N-28/N-18 supported media-reader occurrence: an oversized object with asynchronous stream cancellation previously stalled its known size-limit rejection or substituted a cancellation exception. Initiate best-effort cancellation without awaiting it, handle rejected cancellation, and preserve the known size error when cleanup throws. The original helper fails both stalled/rejected regression probes. Three actual-module cases now pass for stalled, rejected and synchronous-throw cancellation. Existing byte, completeness, key, private/public bucket, consent and readiness guards remain unchanged.

Validation: 88 focused tests across seven relevant suites passed; final full unit/API suite 940 passed / 9 database-dependent skipped, 100 suites passed / 1 skipped. TypeScript, focused ESLint, journey syntax and whitespace passed. Clean compile-mode assets: JavaScript 819,070 / 819,200 bytes; CSS 346,217 / 348,160 bytes. Client secret-boundary and static image guards passed. Compile mode does not certify full prerender/database/browser acceptance. Fresh final-head hosted verification remains required.

Same PR and branch. No main merge, deployment, real payment/email/applicant record, live storage operation or production-data write. No original-audit closure count or exhaustive security/AAA/performance claim. Publish this completed atomic batch; inspect fresh final-head acceptance before integration. No implementation writer remains active.

## 2026-10-13 — cleanup and payment follow-up correction completed

Ownership: REVIEW_PENDING for completed source on existing PR #292 / `fix/direct-transfer-feedback-20261013`, parent `0fd383865c72fa09404081e95d2a98fc5b3d0a09`. Owner `cx` authorized continuation. Parent CI 38413754175 passed fast/unit/type/lint, isolated database and full production build/budgets; browser remains pending at the checkpoint. That result does not certify this newer source.

N-30 review correction: a failed deletion after a later document validation failure previously returned correctable 400, allowing repeated submissions despite retained private objects. Rejected cleanup now follows uncertain 500 while preserving bounded logs, private headers and the successful-cleanup 400 behavior. The new actual-route regression fails on parent source (400 instead of 500); corrected combined assistance/storage/feedback suites pass 54 tests.

N-29 follow-up: after an earlier checkout reports payment, a newer pending order response could still open another checkout or overwrite verification feedback. Recheck attempt identity and opening phase before processing that response and in its error path. Continue reconciling the reported payment with its original order and receipt token. Add three rendered cases for accepted, server-error and malformed newer responses, waiting for actual JSON completion before asserting no new checkout.

N-31 source finding: malformed successful confirmation responses previously navigated to a private acknowledgement with an absent/invalid reference, including `/donations/undefined/acknowledgement`. Validate the reference before navigation; malformed responses retain reconciliation and the existing payment-confirmation guidance. Add six rendered cases for absent/null/numeric/empty/path-like/oversized references. No original-audit closure count inferred.

Final local full unit/API suite: 937 passed, 9 database-dependent skipped, 100 suites passed / 1 skipped. TypeScript, focused ESLint, journey syntax and whitespace pass. Clean compile-mode build: JavaScript 819,016 / 819,200 bytes; CSS 346,217 / 348,160 bytes; client secret and static image guards pass. Nine new payment browser regressions await hosted execution. Compile mode does not certify full prerender/database/browser acceptance. React checklist review preserves synchronous ref ownership, scoped render helpers, focus cleanup and existing privacy/payment boundaries.

No new PR, main merge, deployment, real payment, assistance record, email, storage deletion or production-data write. Existing historical 95-row totals remain unreconciled. Publish the combined correction to this same PR; fresh final-head acceptance is mandatory before integration. This atomic source batch is complete and no implementation writer remains active.

## 2026-10-13 — assistance outcome and evidence feedback continuation

Ownership: REVIEW_PENDING for the completed continuation of existing PR #292 / `fix/direct-transfer-feedback-20261013`. Recovered remote head `0036228c7ea465518bb5db9c71d80c22e089b755` passed CI 38401689042; main remains `aedae00171d2cbf585f65f93b783f66c7f003a43`. This deliberately extends the current form-integrity batch; PR #291 remains independent. The user explicitly resumed interrupted implementation.

N-30: assistance submission previously had no synchronous duplicate-submit guard and reopened the form after lost, malformed or server-error responses even when a case could already exist. Add a synchronous owner and distinct ready/submitting/submitted/follow-up phases. Only explicit pre-write 400/403/413/429 rejection with usable feedback allows correction; only HTTP 201 with validated private credentials allows navigation. Uncertain outcomes preserve values/files, lock resubmission and provide private contact guidance. Focus runs after committed feedback and cancels stale frames. Tracking credentials remain in fragments.

Evidence feedback: return linked document errors for oversized multipart bodies, forged textual/named-empty attachments and excess files. Typed file-type/size/signature rejections return private 400 after cleaning earlier uploads, before case creation. Storage outages retain uncertain handling. Share existing contact input rendering and control feedback within assistance; retain bounded field-error filtering; validation and privacy checks remain intact.

Validation: final focused form/actual route/storage suites passed 67 tests. TypeScript and focused ESLint passed. Full unit/API run: 935 passed, 9 database-dependent skipped, one unchanged password test timed out while compilation was active. A subsequent limited-worker attempt also timed out during compilation; after compilation ended, all 7 unchanged real-scrypt password/work-factor tests passed without changing thresholds or fixtures. This is not a single fully green final full-suite run. Added 9 rendered journey regressions; syntax passed, local Chromium execution unavailable. Final clean compile-mode build passed: JavaScript 818,824 / 819,200 bytes; CSS 346,217 / 348,160 bytes. Compile mode does not certify full prerender/database/browser acceptance; fresh hosted gates remain required. Five new actual-route assertions fail against the original handler; restoring the fixed handler passes all 67 focused tests.

No new PR, main merge, deployment, real assistance record, payment, transfer, email or production-data write. Historical 95-entry totals remain unreconciled; N-30 is a later finding, not another original-audit closure. Publish this same PR and inspect new-head acceptance. Source, tests and continuity records are complete; no further implementation is active in this atomic batch. A green prior head does not certify this continuation.

## 2026-10-13 — PR292 correction completed

Ownership: REVIEW_PENDING. Existing PR292; previous published head `d2c665225e5465c9a2e5cb549f876d0fc1dd02ae`; base/main `aedae00171d2cbf585f65f93b783f66c7f003a43`. Previous exact-head CI38395402522 passed fast/database/readiness and 1,414 Chromium plus 24 Firefox/WebKit cases. Production compiled successfully but failed the unchanged JavaScript budget (823,043 vs 819,200 bytes); no merge was performed.

Correction: share donor/transfer input markup; server-render verified payment instructions through DonationOptions, with a small client clipboard action. Preserve validation, linked errors, focus, fields, verified account/UPI values and submission locks. Direct-method headings now resolve the donation section's existing aria-labelledby. Checkout attempts also isolate dismissal: an earlier unpaid checkout callback cannot reopen a newer pending request. Added one rendered regression for that race (12 new cases in this PR, 42 total journey cases). Minor review spacing issues corrected.

Revised local compiled assets: JavaScript 818,755 bytes; CSS 346,217 bytes, both within unchanged limits (819,200 / 348,160). JavaScript reduction 4,288 bytes. Compilation and build TypeScript succeeded; final local prerender failed because no local PostgreSQL server exists at localhost:5432. This is not a successful complete local production build. Focused payment/API tests: 127 passed across 8 suites. Explicit TypeScript/focused ESLint, client secret boundary, static image guard, whitespace and journey collection passed. Prior candidate's full unit suite had 910 passes / 9 database-dependent skips. Revised hosted build/database/browser checks must pass before guarded integration; prior browser green does not certify the refactored candidate.

No new PR, main merge, deployment, live payment/transfer/email or production-data write performed by this correction. PR291 worker containment remains independent. Historical 95-entry closure totals remain unreconciled; this continues N-29/R-029–R-033/N-24 rather than inventing original-audit closures. Next: correct any revised-head failure before integration; continue independent confirmed defects while hosted validation runs.

## 2026-10-13 — recovered transfer UX and payment-state candidate

Ownership: REVIEW_PENDING. Branch `fix/direct-transfer-feedback-20261013`; base/main `aedae00171d2cbf585f65f93b783f66c7f003a43`. User explicitly resumed the interrupted chat; seven uncommitted source/test files recovered intact and completed. PR291 worker recovery remains independent.

Implemented: direct-transfer native/server field errors with linked messages and post-commit focus; field correction preserves editing focus; unknown/5xx/malformed/duplicate-reference outcomes retain a follow-up lock and contact guidance without encouraging another payment; clipboard failures announce manual-copy guidance. Cross-method lock updates synchronously before the POST. Online checkout rejects same-event duplicate submits and duplicate provider callbacks; payment-reported dismissal and SDK callbacks cannot reopen verification/reconciliation, while genuine unpaid dismissal permits method selection.

Validation: 90 focused tests passed; full unit/API suite 910 passed, 9 database-dependent skipped; TypeScript and focused ESLint passed; 34 CI-planner cases passed; journey spec syntax/collection passed. Added 11 rendered regressions covering five uncertain outcomes, pending same-event submit/method races, repeat field-focus/correction, native validation, clipboard denial, provider dismissal during verification and safe unpaid dismissal. Local Chromium binary is absent (previous installation already failed); collection is not browser execution. Hosted production-build/browser/database acceptance remains required before integration. No live transaction/email or production-data write, no main merge or deployment by this batch.

Historical 95-entry audit totals remain unreconciled. R-029–R-033 receive additional direct-transfer coverage; N-24 receives conservative failure-response UX. N-29 records the newly confirmed method/provider callback state-loss source paths; implemented, browser verification pending. Do not equate source occurrences, tests, or these follow-ups with additional original-audit closures.

## 2026-10-13 — actual HTTP cancellation regressions

Ownership: CODEX_ACTIVE on the preserved N-28 follow-up branch; validated release3414858b remains unchanged. Added actual assistance and direct-transfer route cases using the real body reader/error class: an oversized stream whose cancel promise never settles returns private413 and does not create a case/donation or upload evidence. Both route cases fail with rejection stalled when only awaited cancellation is restored. Fixed source:34 tests across3 suites passed; TypeScript and focused ESLint passed. Assistance test mock now retains the actual error class to verify the real classifier. No live requests, provider calls or production database writes.

Exact release CI38379820058 still reported running at checkpoint; no main merge based on the old tree's green CI. Worker image and other release checks passed. Preserve independent tests until current release is complete.

## 2026-10-13 — production promotion and independent upload batch checkpoint

Ownership: HANDOFF_PENDING. Consolidated14269ad passed full CI38365252911 across fast/database/production/browser/final verify. PR282 guarded-merged into security3414858b3f325ee120b702e66109b6f67cfac87a, whose tree matches the validated candidate. PR215 remains the sole open release PR. Exact release CI38379820058: promotion readiness, fast, PostgreSQL and production build/budgets passed; browser/final still pending at checkpoint. Worker image CI38379820284 passed. No main merge or new deployment yet.

Production config prepared without deploy: PUBLIC_MEDIA_BASE_URL=https://amaanafoundation.org/media, AMAANA_BROWSER_ACCEPTANCE=false, NEXT_PUBLIC_ENABLE_WEB_VITALS=false. Tested migration preflight node prisma/railway-predeploy.mjs/300s remains configured. Secrets are OAuth-redacted; existing credential names preserved. Notification worker still has old root/build/start config and year-only containment; no real email or authenticated job invocation performed.

Independent N-28 on fix/request-body-cancellation-20261013: original reader awaits a never-settling cancel and hangs an oversized-body rejection. Fake-timer baseline fails; non-awaited cancellation rejects promptly and preserves existing cancellation-failure semantics.107 tests across7 relevant suites, types and lint passed. Direct transfer additionally avoids a redundant body allocation up to5.25MiB per request;32 body/upload tests, types and lint passed. Assistance already used typed bytes directly and was unchanged. Implementation saved401f9574 then894f77a92f27fb698972cb3a260ee1ebdd9d6961; no PR opened or change made to release head. Integrate this follow-up after current production candidate is safely promoted, keeping evidence and scope distinct.

Production remains2a8c35ad; historical95 closure totals unreconciled. New-body finding:FIX_IMPLEMENTED/FOCUSED_TESTS_PASSED, unintegrated and not production-closed. Next checkpoint: final215 release result, guarded main merge only if successful, Railway SUCCESS/SHA/live verification, then targeted follow-up integration.

## 2026-10-13 — independent body rejection correction

Ownership: CODEX_ACTIVE on fix/request-body-cancellation-20261013, based on security3414858b. Consolidated14269ad full CI38365252911 passed all selected gates;282 guarded-merged3414858b;215 final CI38379820058 running. Production unchanged. Canonical media URL and disabled fixture/Web-Vitals flags set with skipDeploys. N-28 implemented: oversized stream rejection previously awaited cancellation indefinitely if underlying cancel never settled. New fake-timer regression fails on the original with rejection stalled; non-awaited best-effort cancel preserves immediate RequestBodyTooLargeError.107 tests across7 body/payment/assistance/webhook suites passed, with typecheck and focused ESLint. Direct-transfer multipart parsing now reuses the bounded Uint8Array directly instead of an extra full-size ArrayBuffer copy (up to5.25MiB per request); assistance already used direct typed bytes and is unchanged.32 body/upload route tests, typecheck and focused ESLint pass after this optimization. Keep this independent commit unintegrated until current release gate finishes; do not mutate the validated release head. Keep current release head unchanged while implementing independently.

## 2026-10-13 — PR backlog reconciled to two release PRs

Ownership: HANDOFF_PENDING. Closed11 verified superseded PRs278,279,280,281,274,249,253,258,240,247,241 with per-PR retained-scope evidence; no branches deleted. Recovered missing real-scrypt tests via existing254: refreshed02ef12c0 passed targeted CI38364040345, guarded mergec3e05f5a. Reconciled original216 without reverting newer work: refreshed025a8247 passed targeted CI38364789878, guarded merge3633cb172edcd671f13227740d76da95c9a5a3d1. Only282 consolidated release and215 main-promotion PR remain open. No new PR created in this cleanup batch.

Preserved unique importer batching/deduplication/UTC timestamps, donation card containment, isolated PostgreSQL cases, scoped Stylelint and readable-label browser regressions. Current safeguards remain:12px status badge, postbuild image weight, privacy migration checks, real-scrypt observer tests and payment/media boundaries. Local891 unit tests passed/9 skipped;41 importer/planner passed/4 PostgreSQL skipped; full ESLint/Stylelint/typecheck passed. Prior original216 full CI38252706957 passed exact retained importer/CSS source; refreshed targeted verification does not certify final integrated browser/database acceptance.

Earlier consolidated03b95b1a full CI38362023764 passed plan/fast/database/production/browser/final verify. It does not certify newer3633cb17. Final combined release gates required before promoting282→215→main. No live deployment or current-production closure asserted. Historical95 closure totals remain unreconciled. Production remains2a8c35ad; Railway migration preflight is configured for next deployment, with OAuth variable-value compatibility still unverified.

## 2026-10-13 — remaining importer/CSS reconciliation

Ownership: CODEX_ACTIVE refreshing existing PR216 onto consolidatedc3e05f5a. PR254 exact refreshed head02ef12c0 passed stacked CI38364040345 and mergedc3e05f5a. Open backlog now215,216,282;11 superseded PRs closed with evidence.

PR216 unique work retained from39b671a1: bulk master/factual-lock reads, scoped media deduplication preserving first metadata and repeat idempotency, UTC updatedAt parity for four bulk legacy category writes; donation CSS folded into one authority with shrinkable grid and link wrapping; importer/browser/CI coverage and scoped Stylelint. Keep newer status badge.75rem, postbuild weight guard, historical-pageview migration checks, route reporting and current stacked security work. Never copy its stale package/workflow/globals snapshots wholesale. 41 importer/planner cases passed locally, including7 importer model cases;4 actual PostgreSQL cases skipped locally. Combined unit891 passed/9 skipped, full ESLint/Stylelint/typecheck passed. Both new browser specs parse. Exact refreshed-head hosted gates and final integration database/browser acceptance remain required. Previous exact-head CI38252706957 passed but does not certify this refreshed candidate. No production data writes or deployment.

## 2026-10-13 — superseded PR cleanup and missing coverage recovery

Ownership: CODEX_ACTIVE for existing PR254 refresh onto consolidated03b95b1a. Closed11 superseded PRs:278,279,280,281,274,249,253,258,240,247,241, after comparing actual source/test deltas and fresh heads. Each closure body explains retained coverage; no branch deletion, stale merge or production closure.

Four PRs remain:215 production release;282 consolidation;216 unique importer/CSS work;254 unique real-scrypt coverage. Unlike the superseded candidates,254's password-work-factors.test.ts is absent and password.test.ts still has malformed four-field over-ceiling fixtures in consolidated. Restore exactly its two test blobs without changing authentication runtime. Seven actual-password tests pass with real Node scrypt calls; typecheck/ESLint pass. Add these paths and tests to existing stacked verification so the refreshed existing PR gets exact-head validation. Preserve both histories when refreshing; no force push.

PR216 exact-head CI38252706957 passed39b671a1. Its importer batching, timestamp and test changes are not fully preserved in282; keep open pending scoped reconciliation, rather than merge stale CSS/workflow snapshots. Historical95 totals remain unreconciled. Newer remediation is not deployed; main remains2a8c35ad.

## 2026-10-13 — notification and release-preflight batch complete

Ownership: HANDOFF_PENDING; source integration70e213e70eed102b29dfa67e09cbdc95cf81ffd0. PR288 merged433fccec after exact-head CI38361087739 passed. PR289 merged70e213e after exact-head CI38361613600 passed.

N-25 checkout credentials recovery: same server UUID, provider order and token hash;37 related tests passed. N-26 notification retry ownership: atomic claim requires snapshot attempts equality;15 notification tests passed. Removing equality reproduces an unwanted provider send in the new race regression; fixed source passes. Files: order/route.ts and provider-order.test.ts; notifications.ts, notifications-claim.test.ts and notifications-worker.test.ts. Combined local suite888 passed/9 skipped;97 suites passed/1 skipped; full lint and typecheck passed.

N-27 deployment configuration blocker: Railway production predeploy was only an inline environment check and did not run migrations. Updated existing service b40482be-5e5d-48cc-b36b-39beabfd5d5c in environment38aede68-35aa-42de-adbc-49802e6d44e4 to node prisma/railway-predeploy.mjs with300s timeout. Six wrapper tests passed; describe-service readback verifies both fields. Wrapper runs bounded-retry migrations; production skips preview content import and staging seed. Configuration applies on the next deploy; no deployment or database write triggered by this change.

Railway deployment bb65fc78-088e-4df2-b7b6-80c59fd62da8 is SUCCESS at main2a8c35ad5e553ac0cc78b8027a35b592d1876826; canRollback true. Latest release CI38361776442 for70e213e was queued at checkpoint. OAuth exposes variable names only, so canonical media URL, actual credential values and migration state are not remotely certified. Legacy PUBLIC_MEDIA_S3 credential names remain defined alongside MEDIA_S3 names; safe cleanup remains a release preflight item. No new production closure asserted.

Historical register95; current open/unintegrated/integrated/live-closed/reopened totals remain unreconciled. Next: final-head release gates, env/migration/privacy compatibility, guarded parent/main promotion, then deployment/live verification. No live emails, payments, refunds or beneficiary-sensitive tests performed.

## 2026-10-13 — notification retry continuation

Ownership: CODEX_ACTIVE on fix/notification-attempt-claim-20261013 by owner cx. PR288 integrated433fccec after exact-head CI38361087739 passed. N-26: selected attempt count can become stale before a due retry claim, but completion/failure uses that old count. Atomic claim now requires selected attempts equality as well as max-attempt/due-time guards.15 tests across4 notification suites, typecheck and focused ESLint passed. Removing equality reproduces an unwanted provider send in the new race test; corrected candidate passes. Await exact-head hosted verification before guarded integration. Consolidated release gates remain queued; no production promotion.

## 2026-10-13 — checkout persistence continuation

Ownership: CODEX_ACTIVE on fix/checkout-outcome-recovery-20261013 by owner cx. N-25 confirmed: provider order exists and donation write may commit despite lost acknowledgement, but checkout returns500 and loses original receipt access. Own-ID/token/provider-order recovery implemented; five new regressions;37 related tests plus typecheck and focused ESLint passed. No schema change or real provider requests. Await exact-head hosted CI and guarded merge. Final consolidated release CI remains queued; no promotion.

## 2026-10-13 — completed integration batch and release handoff

Ownership: HANDOFF_PENDING; current batch safely completed. Integration head197ca9078da6a2c885843b10150f9ede576af8d1 contains guarded merges: PR286 e5875b3c (CI38357703887), corrected PR2851c44ee9c (d95ef0ae / CI38359261238), PR287197ca907 (a1adbe80 / CI38360005569). All targeted hosted gates passed on exact task heads. Earlier full CI38356018038 passed9dfd0df8 only; latest full release gates remain pending.

N-23: media stack merge resolution reverted strict qualified transfer timestamps and forged/named-empty attachment checks with six source/test blobs. Restore parent validation before merge; retain media readiness scope. Combined validation332 tests across22 suites plus types/ESLint passed. Do not double-count original defects.

N-24: direct-transfer create may commit without acknowledgement, stranding receipt credentials and blocking retry. Preassign server UUID; recover by own ID and matching receipt-token hash; preserve duplicate-reference409 and fail closed on absent/unavailable/mismatched outcomes. Five new regressions;64 related tests passed. Full local unit suite882 passed/9 skipped;97 suites passed/1 skipped; full lint and typecheck passed. No schema change.

Production main remains2a8c35ad5e553ac0cc78b8027a35b592d1876826; no new deploy/live closure asserted. Historical register95; current open/unintegrated/integrated/production-closed/reopened totals unreconciled. Next: exact final-head release gates, environment/migration compatibility and privacy preflight before security/main promotion. No live charges/refunds or beneficiary tests performed.

## 2026-10-13 — current execution checkpoint

Ownership: CODEX_ACTIVE by explicit owner handoff. See docs/EXECUTION_CHECKPOINT_2026-10-13.md for current evidence. PR286 integrated at e5875b3c. PR285 corrective d95ef0ae restores six parent validation files reverted by its merge resolution (N-23); fresh hosted CI required. Combined candidate:99 focused tests and typecheck passed. Main remains2a8c35ad; no new production deployment or closure. Historical95 entries; current totals unreconciled.

## 2026-10-13 — combined corrective integration candidate

- Actual d59f5e66 CI38306526542 result: fast/database/production passed; browser and final verify FAILED. Browser summary1156passed,5failed,1flaky. Four404 cases consistently measured .98 line-height/font ratio despite earlier fallback edits; one impact fixture failed and the second was flaky after injected main DOM disappeared. No full/cross-browser success for this head is claimed.
- R-025 root cause: later experience-finish.css shared state/error `font` shorthand resets line-height to .98. Change that authoritative shorthand to1.05 for the shared state/receipt/404/error/loading heading family, preserving sizes/fonts and all existing test thresholds. Keep the four real404 assertions.
- Impact harness correction: replace mutation of React-owned main DOM with a server-rendered disposable impact-typography page importing the real impact CSS module. Retain both100/200% cases, exact font, opacity and color assertions; no weakened thresholds or retries. Production fixture preparation removes the entire fixture subtree; actual disabled-build removal probe passes.
- N-21 parked artwork cap fix included: bounded shared-cap encoder,11focused tests, postbuild image guard, actual7derivative evidence and3failing cap-bypass mutation cases. Local source/geometry/alpha unchanged; hosted sharp0.35.5 and full18-image checks pending.
- N-22 source-confirmed optimizer freshness mismatch: managed-media handler returns max-age60/s-maxage300, but global minimumCacheTTL31536000 overrides shorter upstream policies. Official Next image docs and exact v16.3.8 image-optimizer.ts confirm max(minimum,upstream). Lower floor to60; remove conflicting generic /media immutable config header so the handler owns success/error policies; explicitly retain year-long immutable source headers on /brand,/hero,/programme-artwork. Cap optimizer source bodies to existing5MiB managed-upload limit. Add three real optimizer/source-header browser cases with a disposable read-only source using an existing approved WebP; syntax and actual-config parsing pass locally.
- N-22 remains PARTIAL: nominal freshness policy is corrected, but existing caches, stale/error revalidation behavior, CDN purge and real consent-withdrawal acceptance are not certified. Do not describe this as immediate revocation or complete media privacy. Reference https://nextjs.org/docs/app/api-reference/components/image#minimumcachettl and vercel/next.js v16.3.8 packages/next/src/server/image-optimizer.ts; no private-header forwarding/auth-bypass claim.
- Ready for one guarded fast-forward from PR d59f5e66 after its run completed, including parked f3ab3447 ancestry. Fresh candidate lint/types/build/budgets/browser required. No security/main merge, deployment, live transaction or zero-defect/AAA certification.

## 2026-10-13 — parked validation and remaining boundaries

- N-21 sensitivity: detached byte-cap bypass mutation makes3 of11 focused tests fail (oversize fallback, nonmonotonic fallback, bounded rejection); actual candidate remains unchanged. Baseline actual-generation guard fails on422226-byte Taleem; bounded candidate397472 passes. This verifies enforcement rather than merely expected happy-path values.
- N-13 rechecked against actual PR215 advisory: GHSA-vfj7-8cjw-p6xm / CVE-2026-93687 affects braces<=3.0.3; GitHub Advisory Database still lists no patched version (https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Current lock chain eslint-config-next16.3.8→@next/eslint-plugin-next16.3.8→fast-glob3.3.1→micromatch4.0.8→braces3.0.3 is development-only. Docker still asserts braces is absent after prune --omit=dev. No downgrade, suppression, unaudited fork or claim of a new full audit/patch.
- Analytics review: page views and Web Vitals reuse normalizePublicAnalyticsPath; dynamic public slugs group as :slug, private routes are excluded, bodies are bounded and schema-strict. This source review does not close historical nonconforming paths, production migration, retention, live privacy or cost gates.
- Impact contrast review correction: base impact.css contains older light-surface inks, but later impact-wow.css resolves principle labels/paragraphs to canonical gold-ink/muted through brand aliases. No additional confirmed rendered defect established; no extra stylesheet change committed for those two selectors.
- d59f5e66 CI38306526542 browser remains active; other gates passed. Keep artwork code parked and preserve the running suite. No production release actions.

## 2026-10-13 — N-21 generated artwork bypassed image budget (parked)

- Root cause: the fast hero/artwork weight guard runs before `npm run build`; prebuild refinement creates ignored derivatives afterward. d59f5e66 production log contains Taleem422226 bytes against the existing MAX_ARTWORK_BYTES409600 cap. The same baseline pipeline reproduced all seven production byte counts locally; a weight check after baseline generation correctly fails on Taleem.
- Correction: shared-cap encoding helper keeps preferred quality88 when fitting, tries bounded qualities86/84/82/80/78/76, and throws before the oversized output write when none fits. Add the existing weight checker to npm postbuild after the secret-boundary gate, so production/browser builds cannot report success with oversized generated artwork. Add 11 focused encoder boundary/error tests to the existing fast image step. No budget increase or new dependency.
- Actual-file validation: candidate Taleem397472 bytes at quality82 (24754 bytes/5.86% smaller); other six derivatives remain byte-identical at quality88. All seven retain1536×1024 geometry and alpha channels; every downloaded approved source SHA-256 unchanged. Local 14-image subset (7sources+7derivatives) passes weight guard. Preferred/limit/oversize/nonmonotonic/floor/invalid/error cases11/11 pass; syntax passes. Visual comparison preserves the established composition; measured Taleem PSNR36.93dB relative to the prior encoding, not an assertion of lossless output.
- Local encoder is runtime sharp0.35.4; repository pins0.35.5. Exact old output bytes match hosted baseline, but fresh hosted generator/quality/budget validation remains required. Outputs and approved source image files are not committed or regenerated through AI.
- R-053 remains partial: mobile transfer <=150KB and external consent-cleared media delivery are not certified. Track new N-21 as implemented candidate, not deployed.
- Based on PR HEAD d59f5e66; CI38306526542 fast/database/production passed (755unit/9skipped; JS818786/819200,CSS346526/348160), browser still active. Park this follow-up until that browser run completes, then use one guarded integration update. No security/main merge, Railway deployment or live/payment check.

## 2026-10-13 — integrated follow-up candidate after gallery CI passed

- Verified baseline d246e366: run 38303371341 completed successfully across plan, fast, database, production, browser and final verify. Browser log: 1,154 Chromium passed (23.6m), 24 Firefox/WebKit smoke passed (35.3s), no reported flakes. Three new gallery reorder/removal/empty-state regressions included. Fast: 755 unit passed, 9 skipped; production JS818773/819200, CSS346461/348160. Three lint warnings were present on this baseline; parked cleanup addresses them without suppressions and needs fresh hosted verification.
- Candidate batch: gallery cleanup captures current DOM/trigger array safely; typed authorization route table removes unused adapter argument; R-075 static source index; R-024 five explicit sub-12px font declarations (status/pathway/donation/placeholder/impact index); R-025 active error/404 heading .8→1.05 in root and duplicated policy styles; R-019 impact index opacity/background and light-tile caption ink.
- Impact evidence: old index at 62% opacity calculates 4.40:1 over #f7f0de. Opaque #122239 on #fffdf8 calculates 15.73:1 regardless of underlying imagery. Light-tile caption moves #80620d→canonical #604407: 7.94–8.88:1 across #f7f0de/#fffdf8. Palette preserved. This is a scoped numerical/source check, not live image-wide contrast certification.
- Validation: all 79 CSS inventory files inspected for explicit px/rem/clamp and font-shorthand minima; 507 font declarations reviewed. Added eight browser cases: real404×four, actual donation labels×two, disposable impact-style fixtures×two. Node syntax checks pass; new candidate lint/build/unit/browser and budgets pending. No tests or limits weakened.
- Publish only after fresh PR HEAD/ancestry guard; expected old PR head d246e366. R-012, R-019, R-024 and R-025 remain partial; R-075 implemented pending hosted/live serving. No security/main merge, Railway deployment, payment or live verification performed.

## 2026-10-13 — R-024 public stylesheet minimum review

- Read all 79 CSS files from the original repository tree at PR d246e366; root/public/component CSS inventory has no missing fetches. Review targeted explicit px/rem declarations and bounded clamp values, not inherited/em/calculated font sizes or live computed styles.
- Two further sub-12px declarations found: donation-route metadata .68rem and decorative placeholder label clamp(.62rem,1.2vw,.72rem). Raise both to .75rem; earlier parked status/pathway corrections bring this batch to four minimum-size declarations. Placeholder remains decorative/aria-hidden; no semantic or beneficiary-data change.
- Add two actual donation-page browser cases at 390px, verifying both labels equal 12px at 100% and 24px at 200% root size. Together with four R-025 real-404 cases, this batch adds six browser regressions. Node syntax check passes; hosted browser results pending.
- R-024 remains partial until browser, inherited/computed typography, and human acceptance are verified. No claim of universal readable sizing or AAA compliance.
- Parked batch is based on 469a6813; PR d246e366/browser run 38303371341 continues. No security/main merge or deployment.

## 2026-10-13 — R-025 error-heading line spacing

- Current root `not-found.tsx` and `error.tsx` use `.v2-not-found` / `.v2-error-page`; both active headings receive line-height .8 from the globally imported `error-experience.css`. Error heading includes an explicit line break. This is confirmed source evidence; no live overlap measurement claimed.
- Raise the shared heading rule to 1.05 in root error styling and its duplicated policy-route rule, avoiding a later route stylesheet restoring .8. No changes to heading words, route boundaries, redirects, fonts or theme.
- Add four real-404 browser cases (390/1440px × 100/200% root font), checking HTTP404, the actual accessible heading, correct root scaling, and line height at least font size. Syntax check passed; browser execution pending. Existing thresholds unchanged.
- R-025 remains partial: other legacy display rules and broader human typography acceptance are not certified by this narrow correction.
- Parked batch now includes gallery cleanup, R-075 public source index, two R-024 label minimums, and this R-025 correction. Current PR d246e366/browser run 38303371341 still pending; no source update interrupting that run and no deployment.

## 2026-10-13 — R-024 remaining shared-label minimum

- Raise `.status-badge` (globals) and `.canonical-pathway span` (canonical-content) from .72rem to .75rem. At a 16px root, both now reach 12px; at a 32px root, both scale to 24px. Color, spacing, layout and content remain unchanged; replacement length is identical.
- Reviewed the original AM-05/AM-25 findings against current root/public CSS. Legacy tight-heading selectors remain in route styles, but were absent from their current page components; no current rendering failure inferred and no broad deletion performed.
- R-024 stays partial: this is two additional label declarations, not site-wide AAA certification or a completed human acceptance check.
- Based on parked R-075 commit 893dac77, which includes cleanup b5ff59ed. PR HEAD d246e366 and browser run 38303371341 remain active and unchanged. These updates are parked for one guarded integration batch after the running suite completes.

## 2026-10-13 — R-075 public source index (parked integration follow-up)

- Scope: add `public/llms.txt` with 15 canonical links to existing public information and policy routes. No beneficiary, donor, receipt or administrative detail links; no invented impact figures, social URLs or tax promises.
- Compliance: domestic Indian sources only; no FCRA registration; provisional Section 12A/80G approvals; normal acknowledgements are not tax-deduction certificates. Wording checked against the current compliance page.
- Evidence: original `AMAANA_MASTER_REMEDIATION_PLAN(2).md` identifies AM-27; file absence verified at PR HEAD d246e366. Local link/origin/format check passed. This is a small text convention, not a security critical or a guarantee of model indexing.
- Validation baseline: d246e366 fast/database/production gates passed; browser run 38303371341 still active. 77 actual-module local boundary/navigation probes pass. Parked cleanup b5ff59ed still awaits hosted lint/browser verification.
- Publication: keep PR HEAD unchanged until its active browser suite completes; combine this source index with the parked cleanup for the next integration batch. No security/main merge or production deployment performed.

# Current remediation checkpoint — 12 October 2026

This repository copy preserves the recovered reconstructed register below. Its original classification counts are historical, not current closure counts. Source: Amaana_Reconstructed_95_Finding_Status_2026-10-12.md (190 lines; recovered in full from the owner's project files).

- Integration: c7a4d5570e523784b29ea6f9fd475c18de2ff536. PR #277 merged after full CI 38249290059 succeeded; governance/policy label subset of R-024 is integrated, deployment pending.
- R-024 remains partial. #280 covers 61 declarations across 21 public stylesheets; #281 covers 19 shared chrome declarations across three stylesheets. #278 covers assistance labels; #279 private tracking/receipt labels; #216 donation-route labels and enlarged-text containment. Source occurrences are not separate defect closures.
- #216 repaired two failing enlarged-text cases at 39b671a1ea1f20cdfcf98969d3fd4df04f09bd43. CI 38252706957 passed fast/database/production; browser pending at this checkpoint. Historical passing importer checks do not certify pending browser checks.
- R-050: #274 refreshed onto integration e8ae478 at ffd2b81ff8e2b3aa72f15b3977b9ebc5f6a1c04d, preserving all eight tests and both histories. Fresh combined-head validation remains required.
- Typography test additions in #278/#279/#280/#281 are being reconciled with integrated #277 by retaining both append-only test blocks; source changes remain unchanged. New commit checks supersede prior-head results.
- Previously integrated payment/error-handling corrections are recorded in AI_HANDOFF_LEDGER.md. Do not use older PR references below as current integration state.
- Production has not been promoted during this batch. Last confirmed deployed main: 2a8c35ad5e553ac0cc78b8027a35b592d1876826. Do not mark any new correction Production Verified without deployment and live evidence.
- Terminal execution was unavailable after automatic approval review hit an account usage limit. Repository connector operations and hosted CI remain available. Modified JavaScript test syntax was parsed in the tool runtime; this does not replace browser execution.

## Live remediation delta — PR #282 (12 October 2026)

This section supersedes historical status labels in the reconstructed 95-row
inventory **only for the rows listed below**. Do not treat a commit, a passed
unit test or an integrated PR as evidence of a Railway deployment.

| Finding | Current branch evidence | Engineering disposition | Live deployment |
|---|---|---|---|
| R-012 Anonymous administrative boundaries | Protected routes require authentication/permissions; admin route inventory and anonymous-access coverage added to CI | Partially audited; complete independent review outstanding | No verified deployment |
| R-024 Metadata at 200% font scaling | One remaining /our-work 390px flake: 32px root observed before a separate 12px label reading. Enlarged stylesheet is now applied at document initialization and root/labels checked atomically after reload | Test-harness correction candidate. Browser rerun must prove 24px labels; no threshold weakening | No verified deployment |
| R-041 Donation and admin money controls | Razorpay + direct transfer + 3 admin rupee inputs use numeric/decimal keyboard text controls, schema validation, and Prisma Decimal(12,2) max-value guard | Code implemented; client/server regression tests passed on earlier candidate; broader human acceptance pending | No verified deployment |
| R-047 Per-route bundle analysis | Next 16 app-build-manifest absence handled; reports route count and honest aggregate bytes instead of invented per-route transfer figures | **Partial:** no reliable route-specific JS/CSS attribution until a suitable build artifact is available | No verified deployment |
| R-050 Wheel-only Lenis keyboard handoff | Keyboard teardown and explicit Home/End fallback with tests | Code implemented; full-browser rerun needed to certify the former flaky case | No verified deployment |
| R-053 Checked-in image weights | All 11 local WebP images total 2,044,648 bytes; largest 348,636 bytes. A 400 KiB per-image CI guard was added for local hero/artwork imagery | **Partial:** remote curated S3/CDN imagery and mobile responsive transfer measurements remain unverified | No verified deployment |
| R-071 Streaming loading states | Roll back five parent-route loading boundaries and the unused skeleton to restore full server HTML and canonical redirects | **Regression detected** in run 38285272953: 1,088 passed, 56 failed, 7 flaky; missing headings/metadata and a 200 response on a required 307/308 redirect. Corrective rollback requires fresh CI | No verified deployment |
| R-077 Real-user Core Web Vitals | Sampled opt-in observability and privacy-safe page-view grouping; a new migration groups eligible historical detail slugs by date while preserving totals, backed by isolated PostgreSQL checks | **Candidate only:** fresh CI, staging and production rollout verification needed. Nonconforming historic paths still require inventory/privacy review | No verified deployment |

**Current release boundary:** PR #282 is draft, targeting the P0 security
integration branch rather than `main`. Production promotion, live payment
confirmation, screen-reader review and actual Core Web Vitals measurements are
separate release gates.

**Evidence discipline:** The source register is reconstructed, not a recovered
original 95-defect ledger. Defects not listed above retain their previous
classification pending issue-by-issue review.

## Retained source register (historical snapshot)

# Amaana — Reconstructed Finding Register and Deployment Status

Status checked: 12 October 2026, IST.

## Provenance and limitations

The earlier conversation reported a 95-entry deduplicated working inventory but did not expose a recoverable individual-row ledger. This document is a new 95-row reconstruction from the retained audit sources and verified implementation records. R-001–R-095 are identifiers assigned now; they are not represented as the missing historical IDs or an exact recovery of the earlier 95 rows. The inventory includes confirmed defects, stale findings already addressed in the baseline, feature requests and unresolved verification tasks. It is not 95 confirmed live vulnerabilities. Supplement N-01–N-14 records later findings separately; overlaps in the original audits were not added together as if unique defects.

Live source: main 2a8c35ad5e553ac0cc78b8027a35b592d1876826. Railway website deployment bb65fc78-088e-4df2-b7b6-80c59fd62da8 reports SUCCESS. PR215 remains open and unmerged on security integration f5578c31829aeb76ac4e30060cc658342942d762; that integration is 48 commits ahead of deployed main. Source present in the deployed commit is not a claim that every manual/runtime/external-provider acceptance was freshly executed.

## Overview of the reconstructed 95 rows

| State | Rows |
|---|---:|
| Already addressed in deployed baseline | 10 |
| Implemented; not deployed | 30 |
| Partial; not closed | 14 |
| Open | 30 |
| Unverified | 11 |
| Total | 95 |

These are tracking-row counts, not a certified defect-free percentage. The 40 addressed/implemented rows include existing baseline capabilities and test-tooling changes; they must not be advertised as 40 newly fixed live defects.

## Register

### Security

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| R-001 | Next.js vulnerable release | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-01 | 16.3.8 is in deployed main. |
| R-002 | Sharp/librsvg vulnerable release | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-08 | 0.35.5 is in deployed main; do not infer permission to rasterize untrusted SVGs. |
| R-003 | source-map-js vulnerable release | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-16 | 1.2.2 is in deployed lockfile. |
| R-004 | Storage module lacks explicit server-only boundary | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-02; #215 | Server-only marker implemented in remediation branch. |
| R-005 | Public-prefixed media credential names | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-02; #215 | Renamed to MEDIA_S3_*; production variable cleanup remains part of release. |
| R-006 | Incomplete dedicated media credentials silently fall back | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-02; #217 | Reject a half-configured credential pair. |
| R-007 | Client-bundle secret scanner misses names or literal values | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-02; #218–#220/#244 | Scan names, configured values and legacy identifiers after production builds. |
| R-008 | JSON-LD input lacks runtime shape validation | Source implemented; remaining dynamic surfaces guarded and locally tested | Current PR; rollout pending | Not certified live | AM-24; #215/#292 | Article/WebPage, Breadcrumb and Appeal use bounded runtime validation. Nineteen actual-component malformed-input regressions pass; invalid optional schema is omitted without crashing the page. Boolean action/privacy gates, safe breadcrumb paths and slug shape are enforced. |
| R-009 | JSON-LD serializer lacks full sensitive-character escaping | Source implemented; actual-component tests passing | Current PR; rollout pending | Not certified live | AM-24; #215/#292 | All four JSON-LD components now use shared <, >, &, U+2028/U+2029 escaping. Three previously uncovered one-off serializers corrected; five actual render regressions plus four helper tests pass, retaining sensitive-appeal redaction and donation-action gates. |
| R-010 | Raw innerHTML assignments in test fixtures | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-23; #215 | Replaced fixture assignment. Test tooling; not a demonstrated production XSS. |
| R-011 | Dynamic new Function execution in audit harness | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-23; #215 | Use temporary ESM and normal import. Test tooling. |
| R-012 | Complete anonymous admin/API access audit | Unverified | Not established | Unconfirmed | AM-06 | Authentication exists; login HTTP200 alone is not an auth bypass. Full current route review unverified. |
| R-013 | Admin edge Access/WAF/allow-list requirement | Unverified | Not established | Unconfirmed | AM-06 | No fresh evidence of an applied edge restriction. |
| R-014 | CSP unsafe-inline script allowance | Open | No completed rollout | No verified new fix | AM-07 | Nonce/hash strategy and compatible checkout verification remain open. |
| R-015 | Cloudflare analytics beacon CSP violation | Unverified | Not established | Unconfirmed | AM-07a | Allow-list versus disabling injection decision not verified. |
| R-016 | Overbroad CSP img-src https allowance | Implemented; release verification pending | No scheme wildcard in current Next.js CSP; explicit configured HTTPS origins | Current PR source; production header not freshly verified | next.config.ts; e2e/security-headers.spec.mjs | Current imageSources allow self/blob/data and vetted NEXT_PUBLIC_APP_URL, PUBLIC_MEDIA_BASE_URL and NEXT_PUBLIC_DONATION_UPI_QR_URL origins. Existing rendered HTTP-header test asserts no `https:` or `*` in img-src. Verify actual production headers before marking deployed/closed. |
| R-017 | CSP report-only rollout and enforced-payment acceptance | Open | No completed rollout | No verified new fix | AM-07b | No completed compatible staged CSP rollout. |
| R-018 | HSTS preload/subdomain HTTPS review | Unverified | Not established | Unconfirmed | AM-26 | Header exists; complete subdomain review and preload decision unverified. |

### Accessibility

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| R-019 | Governance/muted/gold text contrast outside corrected surfaces | Partial; impact correction candidate | Opaque high-contrast impact index and canonical light-tile caption ink | Not deployed | AM-05 | Index calculated 15.73:1; caption 7.94–8.88:1 over documented cream stops. New browser style cases pending; other selectors and full human acceptance remain open. |
| R-020 | Policy labels/aside contrast tokens | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-05; #223 | Existing accessible semantic tokens applied and ratio tests added. |
| R-021 | Captions and appeal text contrast | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-05; #222 | Targeted accessible ink replacements implemented. |
| R-022 | Impact/Contact/initiative supporting-text contrast | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-05; #230 | Three affected surfaces switched to accessible meta ink. |
| R-023 | Dark admin-sidebar eyebrow contrast | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-05; #239 | Separate foreground tokens for light content and dark sidebar. |
| R-024 | Sub-12px text declarations | Partial; correction candidate | Companion scalable typography plus five label minima | Not deployed | AM-05 | Status/pathway/donation/placeholder/impact index use .75rem. Reviewed 79 CSS files and 507 font declarations including shorthand. Actual donor labels and disposable impact fixtures test 100/200%; fresh candidate browser and broader acceptance pending. |
| R-025 | Overly tight multiline heading line heights | Partial; targeted corrections implemented | Canonical and Stories feature/detail heading lines corrected in source | Not yet certified deployed | 8671e22; eb6aeb0; 33333da; 2618014; #292 | Canonical programme/trust/fact/governance headings use 1.12; Stories feature H2 and story detail H1 now use 1.12 instead of .92 and .84. Existing browser cases cover some canonical headings; Stories headings and remaining compact display rules require rendered mobile/200%-text acceptance. |
| R-026 | Remaining gold-on-light text contrast | Partial; targeted fallback correction implemented | R-026 light text-action fallback now uses dark gold ink; unsafe global bright-gold override removed | Current branch; not verified deployed | 16330b9; 01a5341; 3a0515d | Dark-gold ink #604407 on #fffdf8 is 8.88:1 and on admin light #f4f6f9 8.33:1; sidebar white on midnight #122239 is 15.37:1. Browser tests at 390/1440 exercise computed colors for 3 distinct contexts. Broader brand-accent contrast and hosted acceptance remain open. |
| R-027 | Assistance step errors lack linked inline messages | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #224 | Persistent aria-invalid/aria-describedby errors implemented. |
| R-028 | Assistance focus precedes error DOM commit | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #225 | Focus scheduled after rendered inline errors. |
| R-029 | Donation native validation lacks durable inline errors | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #226 | Native invalid events render linked field errors before focus. |
| R-030 | Donation server-rejected fields do not receive focus | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #228 | Focus the first server-rejected control. |
| R-031 | Donation error handling steals focus during correction | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #229 | Announce/focus an error once; preserve editing focus. |
| R-032 | Cancelled RAF suppresses donation error focus | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #237 | Mark focus complete only within the executed callback. |
| R-033 | Invalid giving-intent radio group is not focused | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-11; #248 | RadioNodeList-aware focus; hosted browser regressions passed. |
| R-034 | Contact social links fail visible-label-in-name matching | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #227 | Accessible names begin with visible platform/handle. |
| R-035 | Public-media link accessible name mismatch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #231 | Accessible name includes visible action. |
| R-036 | Gallery Enlarge accessible name mismatch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #232 | Enlarge action matches visible label. |
| R-037 | Appeal/reflection card accessible action mismatch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #233 | Visible action included in accessible name. |
| R-038 | Impact tile accessible action mismatch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #234 | Visible action included in accessible name. |
| R-039 | Participation-card accessible action mismatch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #235 | Visible action announced first. |
| R-040 | Story archive accessible action mismatch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-15; #236 | Accessible action includes visible label. |
| R-041 | Amount fields use number controls instead of decimal input UX | Implemented; integration pending | DonationForm and DirectTransferForm already use type=text, inputMode=numeric, pattern=[0-9]+ | Not certified live | Current branch; cfb62ec | Both donor amount controls use whole-rupee numeric-keyboard inputs and reject fractional strings. New real-component two-method regression added; hosted acceptance pending. Admin content-order/year number controls are separate from donation amounts. |
| R-042 | Real screen-reader/keyboard/200%-zoom acceptance | Unverified | Not established | Unconfirmed | AM-05/AM-11 | Automated checks do not replace the outstanding human acceptance. |

### Performance

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| R-043 | Homepage always-dynamic rendering / avoidable TTFB | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-09; prior P0-2 | ISR exists in deployed source; prior live measurements improved. |
| R-044 | Footer cumulative layout shift | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-09; prior CLS finding | Earlier live audit measured CLS0.0002; no claim of a new current field measurement. |
| R-045 | Appeal-cover runtime N+1 media queries | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-09 | Bounded batch media lookup exists in deployed source. |
| R-046 | Seed/master-content/category import N+1 operations | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-23; #216 | Bulk operations implemented; full candidate CI passed. |
| R-047 | Missing per-route bundle analysis | Partial; Next 16 entry attribution implemented and locally verified | Current PR; not deployed | Live transfer/CWV not measured | AM-09/AM-13; scripts/report-route-bundles.mjs | Client-reference entryJSFiles/entryCSSFiles JSON attributes 46 clean-build pages with shared runtime/layout deduplication; seven routes explicitly unattributed. Eight analyzer regressions pass; no JavaScript evaluation. Hosted production report pending. |
| R-048 | Current throttled-mobile LCP/TBT/TTI acceptance | Unverified | Not established | Unconfirmed | AM-09 | Fresh full target measurements not established. |
| R-049 | Unproven Companion/motion hydration bottleneck | Unverified | Not established | Unconfirmed | AM-09 | Requires profiling; scanner claim is not a confirmed component defect. |
| R-050 | Lenis activates after native keyboard handoff | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-09; #249 | Cancel pending import/initialization after handoff. |
| R-051 | Outdated browser/polyfill target | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-09 | Evergreen browserslist is deployed; residual byte savings still need measurement. |
| R-052 | Remaining raw image elements | Partial; same-origin absolute URL bypass corrected | Current PR; not certified deployed | Responsive/network rollout pending | AM-10; #292 | PublicMedia and gallery normalize only configured same-origin managed public paths for Next optimization. External approved hosts remain intentionally direct; no remote optimizer allowlist added. Actual-component/policy tests pass; broader responsive/production acceptance remains open. |
| R-053 | Oversized WebP assets/mobile variants | Partial; generated-output correction candidate | Bounded derivative encoder and postbuild weight guard | Parked; not deployed | AM-10 / N-21 | Taleem derivative422226→397472B locally; six other generated outputs byte-identical. Shared400KiB cap preserved. Fresh hosted checks, <=150KB mobile delivery and external media remain open. |
| R-054 | Hero preload/priority/sizes consistency | Partial; shared hero slots and lazy thumbnail auto sizing implemented | Current PR; not deployed | Responsive/network rollout pending | #292; PageHero; WorkPortfolio | Eight hero surfaces use canonical mobile/full and desktop/half sizes. Our Work lazy thumbnails use auto with explicit rem fallbacks for rendered-width selection under enlarged text. Actual-render/policy tests pass; synthetic browser fixture corrected without weakening dimensions/candidate bounds. Hosted responsive and deployed transfer acceptance still required. |
| R-055 | Missing image formats/responsive caching pipeline | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-10 | AVIF/WebP, responsive sizes and immutable caching exist. |
| R-056 | Missing ingestion blur/LQIP placeholders | Open | No completed rollout | No verified new fix | AM-29 | No complete ingestion pipeline implementation established. |

### CSS/tooling

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| R-057 | Too many stylesheets loaded globally | Open | No completed rollout | No verified new fix | AM-12 | Global import count remains a structural issue. |
| R-058 | Route styles are not fully isolated | Open | No completed rollout | No verified new fix | AM-12 | Complete route/module isolation not implemented. |
| R-059 | Missing governed cascade layers | Open | No completed rollout | No verified new fix | AM-12 | Full layer migration not implemented. |
| R-060 | Stacked duplicate donation stylesheet revisions | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-12; #216 | Consolidated into one governed rule set; not deployed. |
| R-061 | Hard-coded colors outside canonical tokens | Partial; shared component hex palette centralized | Current PR; not deployed | Rendered rollout pending | AM-05/AM-12; #292 | All17 shared component modules have zero hex occurrences:49 literals/fallbacks replaced or removed using exact-value canonical roles. Source winner matrices preserve prior values; RGB/alpha literals and route/global styles remain outside this completed scope. |
| R-062 | Excessive important declarations | Open | No completed rollout | No verified new fix | AM-12 | Complete cleanup not implemented. |
| R-063 | Competing button/card/section/media systems | Open | No completed rollout | No verified new fix | AM-12 | Complete unified-system consolidation not implemented. |
| R-064 | Appended reconciliation/override stylesheets | Open | No completed rollout | No verified new fix | AM-12 | Full fold-and-delete migration remains open. |
| R-065 | Missing Prettier formatting and check gate | Open | No completed rollout | No verified new fix | AM-18 | Complete formatter configuration/CI gate not established. |
| R-066 | Incomplete Stylelint design-token/duplicate-selector governance | Partial; all shared component modules gated | Current PR; not deployed | Hosted rollout pending | AM-18; #216/#292 | Existing native hex/duplicate rules now gate17 component modules plus donation audit with zero warnings. Nine exact duplicate selectors consolidated; an introduced component violation fails the actual command. Whole-site RGB/token and route/global CSS governance remains incomplete. |
| R-067 | Global CSS <=60KB target not achieved | Open | No completed rollout | No verified new fix | AM-12 | Existing budget passes do not establish this smaller global-CSS target. |
| R-068 | Unused CSS <10% on key routes unverified | Unverified | Not established | Unconfirmed | AM-12 | Current route-specific coverage measurements missing. |
| R-069 | Strict accessibility/import-cycle lint coverage gaps | Partial; native cycle and supplemental control-name gates implemented | Current PR; hosted rollout pending | Not certified live | AM-18; eslint.config.mjs; #292 | Existing native plugin/resolver detects runtime cycles and preserves type-only references. Supplemental button/summary/ARIA naming gate avoids false positives on native form-label associations. Full lint passes; broader strict-profile and accessibility acceptance remain open. |

### SEO/release

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| R-070 | Gallery branch apparently absent from main | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-03; #175 | Consolidated approved media selection exists; redundant branches superseded, not wholesale cherry-picked. |
| R-071 | Missing route skeletons | Open; unsafe previous approach rejected | Preserve canonical server HTML and HTTP redirects; no App Router loading.tsx boundary active | No new rollout | Historical CI 38285272953; corrective rollback 484a4bc–86211b1 | Earlier five loading boundaries produced 56 failures plus 7 flaky cases: absent initial headings/metadata and expected 307/308 redirects returning 200. An attempted root/donation/assistance fallback was withdrawn after discovering this evidence, including styles/tests. Do not repeat loading.tsx rollout without isolated streamed-HTML and redirect-contract proof. Existing navigation progress stays intact. |
| R-072 | Homepage description exceeds target length | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | AM-21; #221 | Trim implemented on remediation branch. |
| R-073 | Missing NGO/WebSite/alternateName/social/appeal action schema | Already addressed in deployed baseline | Main deployed | Yes—deployed source / prior baseline evidence | AM-20/AM-32 | These existing schema fields are in deployed source; absent-schema claim is stale. |
| R-074 | Missing verified registry link/entity enrichment | Open | No completed rollout | No verified new fix | AM-20/AM-32 | Further registry-based disambiguation not completed. |
| R-075 | Missing llms.txt | Implemented; integration pending | Parked follow-up based on b5ff59ed | Not deployed | AM-27 | Static source index: 15 canonical public links, conservative compliance wording; local checks pass, hosted/live serving pending. |
| R-076 | Cloudflare email-protection broken link | Unverified | Not established | Unconfirmed | AM-22 | No verified current correction. |
| R-077 | Missing real-user Web Vitals attribution | Partial; source telemetry exists; runtime verification pending | Optional sampled LCP/INP/CLS telemetry plus bounded private-safe aggregation | Production opt-in unverified | src/components/web-vitals.tsx; src/lib/web-vitals-ingestion.ts; src/app/api/analytics/web-vitals/route.ts | Actual route-scoped reporting, 10% sampling, ingestion and tests are implemented behind NEXT_PUBLIC_ENABLE_WEB_VITALS=true; production enablement and detailed element attribution are not established. No full closure claimed. |
| R-078 | Dated audit documents not archived | Open | No completed rollout | No verified new fix | AM-19 | No complete archive cleanup. |
| R-079 | Excess remote branches / branch hygiene | Open | No completed rollout | No verified new fix | AM-19 | No complete reviewed pruning. |
| R-080 | Rich-results and entity-schema live acceptance | Unverified | Not established | Unconfirmed | AM-20 | Source schema existence is not external validator acceptance. |
| R-081 | Complete truthful build/type/performance release gates | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-04/AM-13; #220/#241/#243 | CI/type generation exists; added remediation checks and complete Lighthouse-required gate are not all in main. |
| R-082 | Preview noindex/redirect and current search-index acceptance | Unverified | Not established | Unconfirmed | AM-13; source launch checklist | Current full preview redirect/Search Console acceptance not revalidated. |

### Product

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| R-083 | Donate landing page in-page flow and amount presets | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-14 | Appeal checkout exists; complete requested landing-page conversion flow not closed. |
| R-084 | Expanded donation intentions beyond current supported set | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-14/AM-31 | GENERAL/SADAQAH/ZAKAT exist; additional requested categories not completed. |
| R-085 | Monthly recurring donations | Open | No completed rollout | No verified new fix | AM-14 | Subscriptions workflow not completed. |
| R-086 | Persistent Donate CTA across all pages | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-14 | Appeal-specific mobile support CTA exists; global requested coverage incomplete. |
| R-087 | Persistent verified-impact trust bar | Open | No completed rollout | No verified new fix | AM-30 | Full requested component not established; existing factual content is not equivalent. |
| R-088 | Zakat calculator with reviewed rules/data | Open | No completed rollout | No verified new fix | AM-31 | Calculator not built; review rules/data before implementation. |
| R-089 | Hijri/event countdown expansion | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-31 | Companion/prayer/Hijri features exist; full Ramadan/Eid expansion not closed. |
| R-090 | Qurbani live sponsorship tiers/counter | Open | No completed rollout | No verified new fix | AM-31 | Programme pages exist; requested live sponsorship feature not completed. |
| R-091 | Consent-based Shukr donor wall | Open | No completed rollout | No verified new fix | AM-31 | No completed consent-backed donor wall. |
| R-092 | Seasonal campaign goal/progress features | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-31 | Seasonal programme content exists; complete new campaign feature scope pending. |
| R-093 | Wasiyyah/legacy-giving page | Open | No completed rollout | No verified new fix | AM-31 | Not completed. |
| R-094 | Islamic charity education content pipeline | Open | No completed rollout | No verified new fix | AM-31 | Dedicated reviewed content pipeline not completed. |
| R-095 | Live transparency/financial breakdown dashboard | Partial; not closed | Existing baseline; further work pending | Partial / baseline only | AM-31 | Transparency page exists; full live financial dashboard not established. |

## Later findings and coverage gaps

| ID | Finding / requirement | Fix status | Deployment status | Live status | Source / PR | Evidence or remaining work |
|---|---|---|---|---|---|---|
| N-01 | Duplicate asset entries within one import batch | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #216 | First-entry deduplication implemented; full CI passed. |
| N-02 | Bulk category updates omit updatedAt | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #216 | UTC timestamps implemented; rollback-only PostgreSQL parity tests passed. |
| N-03 | Confirmation accepts a different returned payment identity | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #250 | Bind returned provider identity to requested payment. |
| N-04 | Malformed provider payment reaches reconciliation | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #251 | Runtime validation of consumed provider fields. |
| N-05 | Invalid provider order ID reaches donation persistence | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #252 | Reject empty/unusable order identity before writing. |
| N-06 | Malformed failed-payment identity reaches persistence | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #253 | Reject before transaction/event writes. |
| N-07 | Older failure overwrites newer authorization | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #258 | Atomic AUTHORIZED/payment-ID predicate; includes #253 prerequisite. |
| N-08 | Multibyte job credential crashes timing-safe comparison | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #255 | Compare actual UTF-8 buffer lengths before equality. |
| N-09 | Gallery publish HTTP500 exposes raw exception text | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #257 | Return generic error; retain bounded diagnostic logging. |
| N-10 | Cron repeatedly builds website without DATABASE_URL | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #259 | Isolated worker built/tested; full application CI now passed. Schedule removed and URL corrected live; repaired worker not deployed. |
| N-11 | Scrypt work-factor tests exercise malformed fixtures | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #254 | Correct fixtures plus observation of actual crypto factor calls. Tests only. |
| N-12 | Private-record tests mock critical security helpers | Implemented; not deployed | Remediation/task branch only | No—new correction not deployed | #256 | Actual-helper origin/token/body-boundary coverage. Tests only; no new runtime defect claimed. |
| N-13 | Development-tool braces stack-exhaustion advisory | Open; no patched release listed | Current development-only lock chain verified | No new fix or live exposure claim | GHSA-vfj7-8cjw-p6xm / CVE-2026-93687 | braces3.0.3 remains affected; GitHub lists no patched version. Runtime prune asserts absence. Do not confuse with the older CVE-2024-4068 fixed by3.0.3 or suppress/downgrade lint. |
| N-14 | Destination stream closed early errors | Unverified | Not established | Unconfirmed | Successful browser CI logs | Cancellation can reproduce one mechanism; actual CI cause remains unconfirmed. |

N-10 exception: containment is active in Railway (schedule removed; production URL corrected with skipDeploys), but the repaired worker has not been deployed. Scheduled notifications remain suspended. N-11 and N-12 are coverage corrections, not claimed new runtime vulnerabilities.

## Current candidate evidence

- PR216: full hosted CI38185274773 passed; independent review/integration pending.
- PR241 and PR247–258: ready/unmerged candidate records show successful full hosted checks; independent approval remains separate.
- PR259: current head95770878b67e5f93ea125fea884f42680d563351. Worker-image CI38188479558 and complete application CI38188479539 both report SUCCESS. Plan, fast, database, production, browser and verify passed; production-promotion readiness was skipped. PR remains draft/unmerged at the status read. This is candidate verification, not production release approval.
- No production/main merge or Railway deployment was performed for this report.

## Source documents

1. AMAANA_MASTER_REMEDIATION_PLAN(2).md — AM-01–AM-32 and subordinate requirements; 10 October2026.
2. AMAANA_MAIN_RELEASE_AUDIT(2).md — main2a8c35ad source audit and earlier-finding scoreboard.
3. amaana-foundation-complete-audit-&-remediation-blueprint-master-document(2).md — consolidated technical/product requirements; stale claims explicitly reconciled.
4. amaana_foundation_site_audit_remediation_blueprint(2).md — generic source; inaccurate stack/unsupported claims are not applied literally.
5. Current GitHub PR metadata and Railway deployment/configuration reads.

## Safety dispositions

No unsupported Shariah-compliant badge, invented Qurbani sponsorship prices, donor totals, registry identifiers or social links are approved by this report. Adding unsafe-eval or rewriting the intentional light theme is not a defect fix. Public admin login HTTP200, PUBLIC_-named server variables and standard escaped JSON-LD are not by themselves proof of an authentication bypass, credential leak or XSS exploit. Third-party security/CDN/provider settings and true screen-reader/payment checks stay unverified where current evidence is missing.

### Browser regression root-cause correction — 12 October 2026

CI 38285272953: 1,088 passed, 56 failed, 7 flaky. Newly added parent-route `loading.tsx` boundaries made public route checks inspect the streaming fallback before required page content and produced HTTP 200 for a legacy redirect that requires 307/308. Remove these five boundaries and unused skeleton code, preserving server-rendered response semantics. CSS also exceeded the 340 KiB cap by 3,484 bytes; removing the new CSS asset is safer than raising the budget. R-071 remains deferred. The full browser and production CI must pass on a fresh commit before integration; no production verification is claimed.

### R-024 parked-batch integration — 13 October 2026 IST

Baseline `87aa9c61` passed CI 38294121822: 1,151 Chromium and 24 Firefox/WebKit tests, fast/database/production/final verify green; JS 818,586/819,200 B and CSS 346,363/348,160 B. This evidence does not validate the newer candidate.

Integrate parked `58c10229` with recovery `a4e9fa78` / `fdab2ad9`: root-relative Companion typography; repair two literal backslash-n sequences preventing flex wrapping; add source regression guard and deterministic loaded-prayer browser checks at 200% text size. Source guard 2/2 and CI planner 33/33 pass locally; browser spec syntax passes. Local Chromium is unavailable. Hosted candidate browser/build validation remains pending; R-024 is not fully closed or deployed.

CI retains its per-ref concurrency group and disables cancellation of running checks. Required release checks and asset limits remain unchanged.

### Public media operational boundary corrections — 13 October 2026 IST

| ID | Confirmed source defect | Correction | Validation | Deployment |
|---|---|---|---|---|
| N-15 | Public helpers bypassed readiness-only public/private bucket separation | Enforce separation before S3 client creation across upload, curated upload, read and delete | Baseline rejects missing in all four operations; corrected probes pass | Parked candidate; not deployed |
| N-16 | Invalid public delivery URL could be rejected after S3 upload; credentials/query/fragments accepted | Validate before persistence and share safe-base policy with readiness | Five unsafe configurations reproduced; corrected probes pass | Parked candidate; not deployed |
| N-17 | Public media publication database lookup escaped the route error handler | Guard lookup; return empty no-store 503 with Retry-After and noindex on failure | Real-handler probe failed on baseline and passes after correction, before S3 access | Parked candidate; not deployed |
| N-18 | Public object reads were unbounded and did not reject truncated bodies | Reject oversized metadata before reading, bound streamed bytes to existing 5 MiB upload limit, close on overflow, verify completeness | Restoring only old reader fails three guards; corrected reader preserves valid streamed bytes/metadata | Parked candidate; not deployed |

Combined local actual-module/handler probes: 18/18 pass with inert external transports and persistence adapters. Add 18 hosted Vitest cases (17 storage, one route); local TypeScript syntax parsed, but Vitest dependencies unavailable. Hosted lint/typecheck/unit/build/browser checks remain required. No live storage, deletion, upload or production configuration inspection occurred; no claim that production private records were exposed.

### Origin guard and R-024 flaky acceptance correction — 13 October 2026 IST

N-19: production origin validation fell back to untrusted Host when NEXT_PUBLIC_APP_URL was missing, threw for malformed configuration, and accepted HTTP/credentialed/opaque-origin configurations. Require configured HTTPS origin in production; reject bad configuration without throwing; preserve development HTTP fallback. Five baseline cases failed; eight actual-helper probes now pass. No production misconfiguration/exploitation is claimed.

CI 38297387285 at `2697dec3` passed required jobs, but Chromium reported 1,149 passed / 2 flaky (shared Companion scaling at 390px/1280px). Firefox/WebKit 24 passed. Source/build budgets passed: JS 818,586/819,200 B; CSS 346,461/348,160 B. Two tests read 12px at the 24px kicker assertion after a separate root style mutation.

New consolidated candidate integrates N-15–N-18 from parked `0c695485`, adds N-19 source/tests, and reloads shared 200% typography checks with persistent enlarged styles and atomic root/text measurement. Normal and enlarged reading/prayer checks and wrapping assertions remain. Local actual-module probes 26/26 pass; browser spec syntax and new TypeScript test syntax parse. Fresh hosted combined lint/type/unit/build/browser validation remains required. R-024 and R-012 are not fully closed; nothing new is deployed.

### Stable gallery lifecycle — 13 October 2026 IST

N-20 source finding: array-index selection substitutes photos after reorder and can retain hidden body overflow/key ownership after selected item removal or an empty collection. Candidate preserves image identity and cleans up the modal, restoring connected thumbnail focus.

14 actual navigation-helper cases pass locally; 14 Vitest and three actual-component browser mutation cases added. The client wrapper is a disposable acceptance fixture excluded from production. Script/spec/unit syntax passed; rendered lifecycle, lint/type/build and client-byte verification pending. No defect closure/deployment/AAA certification claimed. Baseline 38300163971: fast/database/production passed; hosted units 704 passed / 9 skipped; browser running at last read.

### Actual-helper privileged media API matrix — 13 October 2026 IST

R-012 gains 37 start/upload/publish/status cases retaining real session resolution, permission checks and origin validation. Persistence and external work are inert. Missing/unresolved sessions and each missing scoped permission reject before domain/storage activity. Valid scopes across one or multiple roles reach an explicit authorized checkpoint, without publishing. Mutation origins reject before cookie/DB lookup. Query checks verify ACTIVE status, hashed session token and future expiry predicate; errors retain private/noindex headers.

Local actual-helper matrix: 37/37 pass. Restoring an always-allow permission mutation in a detached scratch copy causes 12 failures; production auth helpers are unchanged. Hosted Vitest validation remains pending; no full authenticated/live/external-edge certification claimed. R-012 stays partial.

Baseline `0d193c3e` passed full CI 38300163971: units 704 passed / 9 skipped; Chromium 1,151 passed without reported flakes; Firefox/WebKit 24 passed; fast/database/production/final verify successful. JS 818,586/819,200 B; CSS 346,461/348,160 B. The new candidate integrates parked N-20 plus this coverage; fresh combined checks must pass before release.

### N-20 cleanup warning follow-up — 13 October 2026 IST

d246e366 CI 38303371341 fast passed with three lint warnings: one unused test parameter and two effect cleanup ref reads. Hosted units 755 passed / 9 skipped; database passed; production totals JS 818,773/819,200 B and CSS 346,461/348,160 B. Browser still pending at the checkpoint.

Park a follow-up that uses a typed direct status-handler table, captures the dialog/ref array inside the effect, and recognizes removal via captured DOM connection state before focus restoration. No lint suppression or rule changes. Local test syntax parsed; fresh hosted lint/type/rendered-lifecycle and budget verification required. No extra defect count or production closure claimed.

| N-21 | Generated artwork bypassed the prebuild-only image weight check | Shared-cap bounded encoding plus postbuild image enforcement | 11 focused tests and actual7-derivative validation pass locally; baseline oversized guard reproduces failure | Parked candidate; not deployed |

| N-22 | One-year optimizer floor overrides managed media short source-cache policy | Lower floor60, explicit static-source year caching, 5MiB optimizer input cap and three browser cases | Config parsed and fixtures excluded locally; real optimizer and legacy-cache/withdrawal acceptance pending | Partial candidate; not deployed |
