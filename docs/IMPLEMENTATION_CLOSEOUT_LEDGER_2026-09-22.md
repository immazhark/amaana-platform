# Implementation Close-Out Ledger

Updated: 2026-09-22
Branch: `phase-public-site-rebuild`

## Consolidated source coverage

This close-out explicitly includes every previously supplied review source: latest Claude, earlier page-by-page Claude/UI audit, Gemini, DeepSeek, Qwen, Mistral AI, KIMI, SEOptimer, Family Feedback #1, Family Feedback #2, UX Designer Feedback #1, Product Owner Feedback #1 and #2, plus subsequent Product Owner observations and approved enhancements.

No accepted item from those sources is dropped merely because it is not repeated in the current chat. Duplicate findings are consolidated into one implementation item; conflicting suggestions follow the already-recorded project decisions and factual/privacy/compliance constraints.

### Accepted audit/remediation themes tracked through completion
- simpler first-visit comprehension and shorter, more visual homepage;
- flagship Amaana/story + major-work carousel and compact programme navigation;
- approved real media first, contextual fallback second;
- gallery/lightbox/load-more treatment where long galleries create scroll fatigue;
- evidence-led trust rather than repetitive trust claims;
- stronger contextual CTA/action hierarchy without artificial urgency;
- one coherent design system and removal of competing legacy CSS;
- editorial body treatment without turning every paragraph into a card;
- typography, wrapping, currency and metric integrity;
- checkout and assistance form field/focus/error/accessibility quality;
- assistance upload-limit architecture verification;
- staging synthetic-content isolation;
- measured CLS/performance/bundle remediation;
- deliberate mobile, keyboard, reduced-motion and accessibility acceptance;
- privacy-first Stories and curated Faith states without fabricated content;
- governance, transparency, recognition and compliance presentation improvements while preserving verified wording;
- appeal lifecycle/status presentation and approved thumbnails/fallbacks;
- SEO/social/schema audit of existing implementation rather than duplicate rebuild;
- responsive media/aspect-ratio contract verification;
- social/WhatsApp sharing where appropriate;
- automated acknowledgements/receipt operational readiness where already within the release scope;
- final cross-browser, staging and release-candidate QA.

### Explicitly rejected/protected suggestions
- no pre-launch indexing;
- no fake scarcity or manufactured urgency;
- no unsupported cost-per-student, donor, impact or tax claims;
- no claim of government approval or final/permanent 80G;
- no privacy-compromising beneficiary media;
- no Railway-to-Vercel migration without evidence;
- no blind security/payment rewrites where existing implementation is correct;
- no live payment/cutover/main merge without explicit approval.

### Enhancement backlog boundary
Approved enhancements already designated for this release are implemented in this close-out. Larger product features requiring separate religious/payment/product validation — including Scheduled Giving/AutoPay, Zakat calculator, Hijri scheduling and other Phase-2 platform concepts — remain preserved in the enhancement backlog and are not silently discarded.

## Working rule

This ledger is the implementation source of truth for the current close-out. Work proceeds without waiting for repeated continuation prompts. Items are only marked complete after code, automated checks, and where applicable rendered/browser acceptance. Production cutover, indexing, live payments, unreviewed beneficiary media, and main-branch promotion remain protected human-approval gates.

## Completed implementation families

- Core public-site information architecture and route set.
- Donation destination architecture, giving intentions, Zakat eligibility separation, reconciliation and admin visibility.
- Assistance workflow including validation, private upload handling, server-error recovery and hidden-step protection.
- Appeal lifecycle/status handling and synthetic-staging isolation.
- Canonical factual locks and conservative compliance wording.
- About, governance, transparency, contact and Get Involved content structures.
- Programme, Stories and Impact media/fallback structures.
- Homepage flagship editorial carousel and programme focus carousel foundations.
- Impact Wall implementation.
- Responsive currency/metric integrity and mid-word wrapping protections.
- Navigation/loading fixes, 404 noindex and public/private data guards.
- Performance/CLS regression infrastructure, CSS architecture audit and production bundle budgets.
- Canonical public surface family, shared shell/section rhythm, media/card vocabulary, action hierarchy and shared header/footer/pre-footer reconciliation.
- Assistance, programme-detail, Stories and Appeals surface/card reconciliation completed in the current visual-system pass.

## Active implementation queue

### P0 — CI and regression recovery
- Reduce shipped CSS below the established 340 KiB production budget by removing superseded rules, not by weakening the gate.
- Re-run the complete integration workflow on the exact branch head.
- Restore execution of post-build smoke and browser-acceptance stages after the bundle gate is green.
- Fix regressions by root cause; do not suppress tests.

### P0 — Site-wide visual-system reconciliation
- Continue removing legacy CSS that competes with canonical hero, action, surface, card, shell, spacing and responsive rules.
- Preserve intentionally distinctive components such as the Impact Wall, flagship homepage carousel and focus carousel.
- Verify all public routes read as one Amaana system rather than page-by-page redesigns.
- Do not add new global CSS layers; current architecture cap remains 17 imports.

### P0 — Rendered responsive acceptance
Validate at 1440×900, 1024×768, 768×1024, 430×932, 390×844 and 360×800, plus 200% browser zoom, keyboard-only and reduced-motion modes:
Home; About; Our Work; programme detail; Impact; Stories; Appeals; appeal detail; Donate; Request Assistance; Transparency/Governance/Compliance; Contact/Get Involved.

Acceptance includes:
- no overlap, clipping, horizontal overflow or broken wrapping;
- consistent hero hierarchy and section rhythm;
- controlled light/dark background alternation using approved Amaana artwork;
- coherent cards, media, metrics and CTA hierarchy;
- usable navigation and footer at every target width;
- carousel controls, swipe/keyboard behavior and reduced-motion handling;
- forms, checkout and assistance focus/error states;
- meaningful empty/fallback states;
- privacy and media provenance boundaries.

### P1 — Editorial/content and trust QA
- Remove remaining redundant public copy without weakening compliance context.
- Verify grassroots-2020 wording never implies the registered trust existed then.
- Verify canonical impact metrics and medical-aid amounts everywhere.
- Verify domestic-only/FCRA and provisional 80G/12A wording.
- Final SEO/social metadata and structured-data review.
- Final public-media human review/provenance/privacy pass.

### P1 — Release-candidate hardening
- Exact-SHA Railway staging validation.
- Staging acceptance and operational evidence update.
- Transactional-email delivery acceptance when safe to execute.
- Controlled payment/refund/receipt operational checks remain approval-gated.
- Rollback rehearsal remains a deliberate staging mutation and approval-gated.
- Production indexing, main promotion and production cutover remain explicit-approval gates.

## Deferred product backlog — not part of this close-out

Scheduled Giving/AutoPay, Hijri schedule presets and other Phase-2 product features remain documented for later implementation. They must not displace current audit remediation, regression, accessibility, QA and release-candidate work.

## Completion definition

“Implementation complete” means the active P0/P1 engineering work is exhausted, exact-head CI is green, Railway staging is healthy, browser acceptance has been run, known defects are either fixed or explicitly documented as protected/manual launch gates, and the final consolidated reviewer/audit ledger is reconciled. It does not mean production has been cut over.
