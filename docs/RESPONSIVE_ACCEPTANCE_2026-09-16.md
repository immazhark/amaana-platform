# Responsive acceptance — 16 September 2026

Baseline: integration commit `1d2bdf1119d7a71674ab5d15a40b930d84c3b179`, Railway deployment `906b9744-c300-4997-aafe-0589caada641` confirmed SUCCESS. PR #22 is preserved, not reimplemented.

## Issue queue

- P0: persistent companion launchers overlap body copy on mobile and desktop. Move launchers into normal flow beneath the reminder strip; retain the user-opened companion panel and its close/Escape controls.
- P1: a finish-layer `display:grid` overrides the desktop hamburger's hidden state. Remove that override and switch the whole navigation at 1020px, before tablet labels crowd. Bound the open mobile menu to the available viewport with internal scrolling.
- P1: reminder controls shrink to 36px on mobile. Retain their 44px target height.
- P2: no aesthetic redesign needed. Preserve palette, typography, programme imagery and existing page composition.

## Baseline rendered checks

DOM geometry checked at 1440, 1024, 768, 430, 390 and 360px on each of:

`/`, `/our-work`, `/our-work/hyderabad-flood-relief-2020`, `/appeals`, `/impact`, `/stories`, `/get-involved`, `/get-involved/sponsor-education`, `/request-assistance`, `/donate`, `/contact`, `/faith-and-reflections`, `/request-assistance/status`, `/request-assistance/received`, `/governance`, `/transparency`, `/privacy`, `/compliance`, `/terms`, `/refund-policy`, `/donation-policy`.

All 126 baseline combinations had no horizontal document overflow or out-of-viewport common main headings, paragraphs or form controls. This does not certify all visual relationships: screenshots separately exposed the companion overlap and desktop/tablet menu issue. Assistance fields had associated labels. Screenshots inspected narrow flood relief and policy pages plus desktop flood relief and tablet assistance.

## Verification and limits

- Baseline local lint and TypeScript passed.
- Existing unit coverage: 82 tests passed; 24 factual/filter/faith script checks passed.
- Three new shared CSS regression tests passed.
- Local default Turbopack build cannot follow the reused dependency junction outside its project root. A webpack build is being used for local rendered verification; repository CI must still pass the unmodified production build and budgets.
- No applicant data submitted, no payment attempted, no public/private media changed.
- No active public appeal or published story was offered by the corresponding index during this sweep; populated detail journeys need a controlled fixture or approved record, not invented public content.
- `/our-work` still visibly reports six categories, including legacy Medical & Financial Aid. This is recorded as a runtime discrepancy; the completed PR #22 reconciliation is not being redone in this responsive patch.
- Post-fix rendered verification, CI/bundle/smoke results and subsequent launch-readiness checks are still pending at this checkpoint.

