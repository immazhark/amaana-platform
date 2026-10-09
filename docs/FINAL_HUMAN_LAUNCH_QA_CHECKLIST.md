# Amaana Foundation — Final Human Launch QA Checklist

Updated: 7 October 2026

This checklist contains only evidence that still requires human perception or an authorised interactive session. It complements—not duplicates—the automated CI/browser/database/security acceptance already passed by the release candidate.

Review against one exact candidate SHA. If a later code change affects a reviewed surface, repeat the relevant item.

## 1. Candidate identity

- [ ] Record exact candidate SHA.
- [ ] Confirm it matches the exact Railway preview deployment intended for promotion.
- [ ] Confirm preview remains noindex and Razorpay Test-only.
- [ ] Confirm no one-shot staging acceptance flag is unintentionally enabled.

Current engineering candidate at document update: `9bd04887cb57c28a73f201f8a5c7002657f2b427`.

## 2. Human accessibility and visual judgement

Automation already covers axe A/AA, broad responsive containment, focus-order regressions, skip-link behavior, menu focus restoration/trapping, reduced-motion code paths, minimum target checks and fixed-control collision checks.

Human reviewer must still perform:

- [ ] actual browser **200% zoom** on representative desktop routes;
- [ ] keyboard-only navigation on Home, Our Work/detail, Donate, Request Assistance, Compliance/Transparency and Admin sign-in;
- [ ] visible-focus quality judgement on links, buttons, carousels, modal/drawer states and floating controls;
- [ ] screen-reader spot check for page title/H1, landmarks, navigation, one form with validation errors and one status/confirmation message;
- [ ] OS-level reduced-motion visual check;
- [ ] mobile visual check at approximately 390px and 430px for fixed-control overlap;
- [ ] authorised admin laptop-width spot check for navigation, focus and destructive-action clarity.

Record any observed issue; do not waive it because automated CI is green.

## 3. Final editorial / SEO / social rendered judgement

Automation already verifies canonical metadata, robots/sitemap behavior, structured data, route-specific title/description, Open Graph/Twitter metadata, factual/compliance locks and public-source consistency.

Human reviewer must still confirm:

- [ ] homepage and representative L1/L2 page titles/descriptions read naturally;
- [ ] 12A/12AB and 80G remain described as provisional;
- [ ] no FCRA claim appears;
- [ ] domestic-only donation wording remains clear;
- [ ] completed appeals do not read as actively fundraising;
- [ ] no placeholder/staging/internal workflow language is visible publicly;
- [ ] generated Open Graph/Twitter cards look balanced and readable at normal social-preview scale;
- [ ] CTA wording matches the destination/action and does not imply a nonexistent live appeal.

## 4. Release-scoped media/payment note

No new unreviewed public programme media is introduced by the frozen release; future media still requires the separate privacy/consent/provenance review before publication.

No legitimate public appeal is currently live. Do not create a dummy appeal or real-money transaction for this checklist. Live capture/refund observation reactivates with the first legitimate appeal.

## 5. Admin/private spot review

Using authorised staging staff accounts only:

- [ ] role isolation still fails closed;
- [ ] assistance/media/retention/notification/donation operational screens remain usable at laptop width;
- [ ] destructive actions communicate permanence and confirmation;
- [ ] private document links/data never appear on public routes.

Do not create or publish real beneficiary data for this review.

## 6. Outcome

Record:

- reviewer;
- date/time;
- exact candidate SHA;
- **PASS**, **PASS WITH DEFERRED POLISH**, or **BLOCKED**;
- any issue references.

Only a PASS/PASS WITH DEFERRED POLISH backed by the checks above may support resolving the human accessibility/editorial gates. This checklist does not itself authorize production promotion.
