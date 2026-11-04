# Official Amaana footer social destinations — November 4, 2026 IST

The public footer lists four rendered social channels, because LinkedIn has no href. Threads uses `https://www.threads.net/@amaanafoundation` instead of the owner-supplied official `https://www.threads.com/@amaanafoundation` destination.

Owner-approved social references: `https://www.linkedin.com/company/amaanafoundation` and `https://www.threads.com/@amaanafoundation`. External profile fetchability is not independently certified by this PR. Do not replace with look-alike domains.

**RED-first contract:** native `src/components/site-footer-year.test.tsx` renders SiteFooter and expects exactly these URLs, five social icons and descriptive accessible new-tab labels. The existing real browser site-chrome footer test must require five social links, exact Threads/LinkedIn addresses and five SVG icons. Verify expected failure on baseline before source changes.

**Bounded source correction:** modify only `src/components/site-footer.tsx` socialLinks entries to enable verified owner-supplied URLs. Preserve all other footer text, brand assets, links, layout, color, privacy and trust statements.

**Release:** exact-head full CI, independent review, separate ready-state verification, expected-head protected merge, Railway deployed identity and public readiness. Changes under src/** trigger website deployment, so source merge != deployment/live. No donor communications, payments, private data, RBAC, schema, media or secrets. Do not inflate historical 149 counts. Revert this PR if URL ownership is later revoked.

## Hosted RED confirmation and source repair

Head `1fdd0e111e371fec152863f249631b1f2f32924f` CI `41845302936` confirmed exactly one new `src/components/site-footer-year.test.tsx` failed for the missing LinkedIn URL, with 2,603 passing Vitest tests and 20 intentionally skipped isolated DB cases. The downstream build/browser/database were skipped because fast failed; this run is deliberately not an acceptance pass. The next GREEN source correction changes only the two approved footer href values. It does not claim network/profile availability, donor reach, a deployed website or fully accepted 149-item closure. The browser fixture's five-link/five-icon assertion was already present in the RED candidate.
