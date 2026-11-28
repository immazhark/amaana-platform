# Amaana — design and UX evidence

28 November 2026 IST. Source baseline `02134d0471f2dde2e77a96424fffe4b276a9fb1f`. This is a selected-source review, not a rendered site-wide visual audit. Owner deferred fresh Lighthouse, axe and runtime measurements. All such values, physical-device behavior, field CWV and visual rubric scores remain **UNVERIFIED**.

## Existing foundations to preserve

- `AMAANA_BRAND_FOUNDATION.md` already defines the approved Living Amanah identity, official SVG and verified #466FAA/#E0B318 palette. Missing DESIGN.md does not imply a missing system.
- `src/app/globals.css` defines semantic colors, type/spacing/radius/content/motion tokens and balanced headings. Financial modules already use tabular numerals. `src/lib/image-placeholder.ts` implements a bounded blurred WebP equivalent to BlurHash; do not add another decoder/runtime.
- Mobile support/gallery/companion styles contain safe-area offsets. Source presence is not proof of unobscured focus, correct soft-keyboard behavior or contrast at every viewport.
- Existing server validation, bounded financial arithmetic, provider identity/signatures, guarded state transitions, domestic-INR restrictions, private token/permission checks and audit controls remain intact. New design requirements do not authorize risky behavior changes.

## Current bounded finding and correction

The native appeal-search GET form has a visible label, descriptions, query length cap, invalid recovery and clear navigation. Before this batch it did not explicitly expose a search landmark or virtual-keyboard search action. This is an enhancement; browsers may already infer the keyboard label from type=search. It is not a proven broken keyboard or WCAG failure.

- `src/components/appeal-search-form.tsx`: add role=search to the named existing form and enterKeyHint=search to its existing input. Preserve routing, validation, query echo, no-JS submission, privacy warning, copy and CSS.
- New SSR regression: **RED 2 failed / 3 passed** before editing. **GREEN 5/5** after. Existing `src/lib/appeal-search-privacy.test.ts`: **3/3**. These are actual local Vitest runs, not browser/device results.
- Existing `e2e/appeal-search.spec.mjs` extended for named landmark, hint and native Enter GET submission. Syntax checked; browser execution pending existing isolated CI.
- Mechanical design detector returned an empty findings array for the changed component. This is a limited source detector, not visual, accessibility or performance certification.


Local full Vitest after Prisma generation: 428 test files passed / 16 skipped; 4,598 tests passed / 150 skipped, Node v24.22.3. First full attempt started before generated Prisma client was available and failed module loading; corrected setup rerun passed. No database opt-in or live DB access. Typecheck and full lint (ESLint + governed Stylelint) passed; hosted Node22/build/database/browser and promotion pending.

## Prior security audit reconciliation

Keep these source findings open in the security backlog: application password login issues a session without a second factor (edge MFA unverified); production script CSP permits unsafe-inline; media publication validation by itself lacks byte-bound face/metadata review; inspected CI Actions refs use mutable tags. Complete RBAC/IDOR, financial audit immutability, provider-order retry idempotency, concurrent late capture, full-history secrets, dependency advisories and real settlement acceptance were not certified. No exploit, real duplicate charge or exposed credential was demonstrated. High-risk changes retain separate plan/approval gates.

Design priority does not downgrade those risks. Fund giving and prepaid Taleem source must not be confused with activated recurring mandates, corpus restrictions, complete education matching/reporting or consented donor-wall publication. See the [reconciled prompt](../directives/MASTER-DESIGN-EXECUTION-PROMPT.md) and [requirement register](DESIGN-IMPLEMENTATION.md).

## Research and adoption decisions

| Primary source reviewed | Application / decision |
|---|---|
| [MDN enterkeyhint](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint) | Explicit search keyboard intent; no JS or library. Physical keyboard outcome still needs device verification. |
| [W3C search landmark pattern](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html) | Search form uses named role=search. Preserve its real form/control semantics. |
| [W3C keyboard understanding](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) | Preserve native Enter and equivalent keyboard functionality; add browser regression. |
| [MDN text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap) | Retain existing balanced headings with browser fallback; do not duplicate implementation. |
| [USWDS button guidance](https://designsystem.digital.gov/components/button/) and [USWDS repository](https://github.com/uswds/uswds) | Additional public-service design reference for native controls, hierarchy and accessible states; no package/style/assets imported. No license or bundle adoption claim. |

USWDS is an additional reference beyond the named inspiration list, not a replacement identity. An attempted NHS component URL was unavailable and was not used as evidence. Design-gallery/competitor research and actual visual comparison remain pending before significant visual composition changes. No library was installed for the frontend change.

## Required next critique

Use existing synthetic giving fixtures and the current component system. Review before/after views at 320, 360, 375, 390, 414, 430, 768, 1024 and 1440px where applicable. Check primary-action reach, method/amount comprehension, focused error recovery, pending states, sticky overlap, reading rhythm, contrast, back behavior and reduced motion. Do not manufacture screenshots or assign the 95/100 rubric target as an achieved score.

Fresh screenshots, Lighthouse mobile/desktop, axe/pa11y, manual keyboard/screen readers, slow-network/real-device acceptance, schema validators, source/runtime identity and public privacy review remain open evidence gates. This first implementation does not close the transformation programme or reclassify the canonical149.


## Continuation — no-script recovery, 28 November 2026 IST

Main after #1249: f9dc528fc0c6d9a7dcb95f577504af70dc76875c. Source-defined defect: giving and Taleem configurators and reviewed-appeal selector initially hide payment methods behind client-only buttons; online donation starts in disabled loading phase. With JavaScript disabled, there was no explanation or route-specific help. Shared native GivingNoScriptNotice now explains the requirement and links to contact/policy before payment interactions. It never supplies an alternate payment destination or acceptance promise. Four added SSR acceptance cases failed before insertion (4 failed/32 passed); all36 pass after. Browser specs cover each synthetic route without JavaScript, keyboard Enter contact navigation and absence of donation API requests, plus retained JS-enabled flow. Hosted execution pending. This is graceful recovery, not no-JavaScript checkout or script-failure detection.

Actual baseline visual review: #1249 CI46111894064 mobile artifact15250123932, complete-browser-acceptance--give.jpg, synthetic fixture. The selected fund remains visibly distinct; mobile layout uses a long stack of cause choices and a bottom summary/action. That length merits a later rendered CTA/navigation study, not a speculative redesign. After-change no-script rendering remains UNVERIFIED: system Chromium wrapper lacks its binary and browser download returned403. Existing hosted artifact is not a screenshot of this new implementation.

Full local Vitest: 4,602 passed / 150 skipped (428 files passed / 16 skipped), Node v24.22.3; typecheck, changed-file ESLint, governed CSS Stylelint and e2e syntax pass. Hosted Node22/build/database/browser and separate promotion remain pending. Railway #1249 deployment c515cd7f-1c0e-4377-8286-2977507e5e22 subsequently SUCCESS for f9dc528fc0c6d9a7dcb95f577504af70dc76875c; public identity/readiness remains UNVERIFIED/deferred.

## 28 November — no-script browser acceptance repair

**28 November 2026 IST — CHATGPT_ACTIVE; #1250 browser regression repair.** Exact predecessor `1270b031d60aa637ae98196854ee54cd0944e6e7`, CI46115547524: fast/database/production/plan/draft-readiness green, browser 1,738 passed/4 failed, verify failed. All four failures on newly added test's `noscript` text-filter count (including retries), classified TASK_INTRODUCED test locator defect. Independent Chromium parsed synthetic body markup with scripting disabled: original locator returned zero despite visible contents; structural selector plus explicit visible inner-text, native links and focus passed. Missing copy, duplicate notices, unexpected interactive control and enabled-script inactivity mutations detected. Candidate test exact blob `c418bb3624f191af97443ce8fd5359c67ad6d990` syntax checked under Node22; no runtime source changes. Local browser navigation blocked by administrator policy, actual Next application and native Enter navigation require fresh hosted acceptance. #1251 `1449a757358400e2f546392636961335bc840278` five jobs successful/browser running; dependent Taleem commit `079d82d78aaa4ad9359d8b37654b9c947eeafdad` preserved. Main/runtime deployment unchanged. No protected merge until fresh exact-head full CI and separate ready-state checks. Canonical149 unchanged.
