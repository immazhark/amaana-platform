# Nine owner screenshot corrections — 4 October 2026

All nine original attachments inspected directly. Scope and implementation:

| Screenshot | Route | Correction |
| --- | --- | --- |
| 1 | Stories | Reuse the approved topmost lattice/dark-gradient surface; suppress obsolete diamond decoration. |
| 2 | Faith & Reflections | Remove the 58rem empty-library cap; use full shell width with readable inner text. |
| 3 | Faith & Reflections | Shared SectionHeading for Editorial Trust, 56px desktop cap, canonical eyebrow rule and subtitle alignment; remove obsolete short separator. |
| 4 | Contact | Apply approved body artwork to the privacy section. |
| 5 | Sponsor Education | Vertically centered closing actions, consistent horizontal wrapping and 16px gaps. |
| 6 | Partner | Full-width two-column partnership list with contextual server-rendered SVG icons, shared section heading, consistent surfaces and left-aligned action. |
| 7 | Contact | Distinct accessible email/phone rows with icons, labels, 44px+ targets and keyboard focus. |
| 8 | Compliance | Visible lattice behind a balanced four-status strip; translucent panels, increased spacing and subordinate display titles. |
| 9 | Compliance | Approved lattice above the pending-registration gradient. |

Unreferenced faith/stories/compliance hero selectors removed with a CSS parser after confirming no matching class in current TSX. Remaining combined selectors and active detail/body styling preserved. Locked compliance text, approved SVG bytes, fixed Companion, existing header/carousel, database and payment logic preserved. No new client component, library, image or backend operation.

Clean production build and TypeScript pass after regenerating the local Prisma client from current schema. Lint has only the existing reviewed-campaign-import unused-variable warning. Production static JavaScript810705/819200 and CSS343279/348160 bytes; budgets unchanged, CSS reduced4862bytes. Six approved background hashes and26 planner regressions pass. A six-width nine-surface regression covers pattern layer order, library full width, title cap, contact icons/targets/focus, partnership icons, sponsorship action flow, provisional disclosures, overflow and axe390/1440. Local production browser first attempt could not query Stories because this workspace has no DATABASE_URL; CI uses its existing isolated seeded database. Publication, CI and deployed verification pending.

Initial focused CI:154 passed, one introduced mobile typography failure. Shared SectionHeading now uses a fluid30–38.4px mobile scale, retaining the56px desktop cap and an8px minimum separation from the smallest banner title. Assertions strengthened; no threshold weakened. Final CI pending.

Expanded shared-heading CI:572 passed, one tablet hierarchy failure at1024px identified by the strengthened assertion. Body-heading fluid scaling now follows the banner scale with a10px offset, retaining38.4px desktop minimum/56px maximum and30–38.4px mobile scale. CSS-only heading changes select responsive heading/typography/UI regressions; shared JSX still includes shell and journey coverage, release/unknown/core changes retain full checks.

## Delivery verified

PR156 merged `a5180bf343b7f3e82e9966a3bd4d0e99b7ef6623`; final tested head `bc9fcb99908cb3883a382646f1a07748d75ad20b`, tree `8452987e8dd24a64ba367333c8209a9972a8bf4d`.155 focused checks pass in3.7minutes,414 units and26 planner regressions. Railway `dc26dfdb-ccb2-47e7-bb52-98cab031dc93` SUCCESS. Live six-route desktop verification confirms topmost dark lattice, Contact privacy body pattern and contact icons,56px body title cap, Partner8 icons and no overflow. Responsive proof from CI and9-width local check. Main/draftPR104 unchanged.
