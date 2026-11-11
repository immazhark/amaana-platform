# AF-R019 — Faith library action text contrast

Date: 11 November 2026 IST. Writer: CHATGPT_ACTIVE; draft PR #771.

## Source defect and reproduction

`src/app/faith-wow.css` styles the Faith & Reflections library cards on a pale paper-to-cream gradient, with `--amaana-paper` #FFFDF8 and `--amaana-cream` #FAF6EC. The earlier `.v2-faith-library-action` uses the approved dark `--amaana-gold-deep`, but a later same-specificity rule overrides the text with bright `--v2-gold` #E0B318. The final cascade supplies 1.83:1–1.94:1 contrast, below WCAG AA normal or large text thresholds.

Hosted test-only RED head `33593a316ab7185ca8efdf6d284015cb839dc210`, CI `43052022602`, fast job `130631539982`: exactly one new assertion failed on final `color:var(--v2-gold)`; 2,934 other tests passed, 20 skipped. The test validates the final effective rule in source, approved token aliases and >=4.5:1 contrast on both pale endpoints.

## Minimal correction

Use the approved `--amaana-gold-deep` alias for the final `.v2-faith-library-action` rule, preserving the earlier rule, underline/focus gold accents and existing card geometry. Dark gold-ink #604407 yields 8.36:1–8.88:1 contrast. Update the existing direct shared CSS Vitest contract to the corrected token; retain the new regression.

No page restructuring, religious editorial copy, media, beneficiary data, payment, authentication, secrets, schema, CSP, infrastructure or notification change.

## Acceptance and rollback

Require full exact-head CI (fast/production/browser/database/final verification), independent review, separate ready-for-review promotion, then protected expected-head merge. This is bounded source contrast; it does not certify full AF-R019 or physical assistive-technology acceptance. Concurrent disjoint PRs #769 and #770 have independent CI. QR/payment PR #684 remains held. Preserve 149 historical backlog classifications.

Rollback: revert the last CSS color declaration, shared source regression update and evidence record.
