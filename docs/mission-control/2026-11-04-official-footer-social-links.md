# Official Amaana footer social destinations — November 4, 2026 IST

The public footer lists four rendered social channels, because LinkedIn has no href. Threads uses `https://www.threads.net/@amaanafoundation` instead of the owner-supplied official `https://www.threads.com/@amaanafoundation` destination.

Owner-approved social references: `https://www.linkedin.com/company/amaanafoundation` and `https://www.threads.com/@amaanafoundation`. External profile fetchability is not independently certified by this PR. Do not replace with look-alike domains.

**RED-first contract:** native `src/components/site-footer-year.test.tsx` renders SiteFooter and expects exactly these URLs, five social icons and descriptive accessible new-tab labels. The existing real browser site-chrome footer test must require five social links, exact Threads/LinkedIn addresses and five SVG icons. Verify expected failure on baseline before source changes.

**Bounded source correction:** modify only `src/components/site-footer.tsx` socialLinks entries to enable verified owner-supplied URLs. Preserve all other footer text, brand assets, links, layout, color, privacy and trust statements.

**Release:** exact-head full CI, independent review, separate ready-state verification, expected-head protected merge, Railway deployed identity and public readiness. Changes under src/** trigger website deployment, so source merge != deployment/live. No donor communications, payments, private data, RBAC, schema, media or secrets. Do not inflate historical 149 counts. Revert this PR if URL ownership is later revoked.
