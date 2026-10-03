# Body heading hierarchy and closing alignment

Owner evidence: all seven October3 screenshots recovered and inspected. Screenshot1 establishes title-left/supporting-copy-right; screenshot5 places closing actions under right-hand copy. Screenshots2/3/4/6/7 expose reversed homepage reading order, narrow closings and inline evidence kickers.

Implemented on `fix/section-hierarchy-alignment-20261003`, integration base `5ba040e2e2898b674693d301dd2ebcec1273a31e`:

- Shared and legacy body H2 display scales cap at3.5rem, with fluid mobile sizes; smaller form/prose headings retain their reading roles.
- Homepage banner title grows to a maximum4rem and exceeds body display headings at supported widths. Typography/geometry/brand artwork remain incumbent.
- Homepage programme introduction uses SectionHeading before its carousel; controls remain within the carousel toolbar.
- Closings use the full public shell and a two-column composition: heading left, supporting copy and actions right. Mobile reading/focus order stays title, copy, actions.
- Removed inline-block body-title legacy behavior so kickers cannot sit beside title baselines. Evidence panels retain their own right-hand content.
- Widened display text measures to avoid unnecessary five-line headings at desktop sizes. Retired unused v3-closing decorative circles; no rendered route used that selector.

Verification: first clean build/typecheck passed.392 units pass with six database-dependent skips;22 planner regressions and224-file editorial guard pass. Lint has one existing unused importer-variable warning. First responsive confirmation:16 Chromium checks pass in22.8seconds, seven widths320/390/768/900/1024/1440/1920 with WCAG A/AA layout checks and existing homepage/portfolio regressions. Desktop/mobile captures inspected; final delivery results are recorded below. Initial real-route local run failed due to absent DATABASE_URL; no local database-backed coverage is claimed. Isolated production-hidden section fixture supplies shared-layout coverage without touching live records.

Final local confirmation:16 Chromium checks pass in20.2seconds, including strict banner/body hierarchy at all seven widths. Corrected genuine mobile equal-size hierarchy found by that assertion. Clean build/types pass; fresh JavaScript819181/819200 and CSS347649/348160 bytes. Workspace stale generated output was isolated by moving the generated tree and keeping build/budget/browser confirmation in one command without concurrent filesystem operations. No budget caps increased.

Mechanical detector warning: existing footer wordmark gradient text in experience-finish.css; unchanged official treatment, outside requested heading/layout fix.

PR140 first complete seeded CI37106160672:698/701 Chromium checks pass; two task-introduced Contact closing left-edge failures and one pre-existing mobile backdrop failure at390x844. Fixed closing intro specificity for short/contact-link copy, retaining mobile column reset. Reserved3rem beneath the viewport-bounded menu for pointer dismissal; public header remains accessible. Added actual Contact checks at all seven widths and844px navigation windows across five widths. Final correction confirmation:23 layout/navigation/WCAG checks pass in29.2seconds, plus the exact legacy backdrop regression passes in2.5seconds. Fresh build/types and unchanged budgets pass:JavaScript819181/819200,CSS347689/348160. No failing assertions removed or relaxed.

Release: PR140 final head `69f93b5e3ace613a4e5ec16daab598354e7efc52` passed CI37107270067:706 Chromium first-attempt cases in10.0minutes;24 Firefox/WebKit smoke checks in51.3seconds. Merged as `3d83e2df7ba5a80687d95d04903c3ed731b7aa7d`, matching tested tree `45cbb6609900ab6c3c72ae66bb98582f1af4cdba`. Integration CI37108057516 SUCCESS, duplicate browser acceptance skipped; build/coverage/database/budgets/server smoke retained and green. Railway review `e78d725e-3399-410f-aee9-ef12739c2514` SUCCESS on exact application merge. JavaScript819181,CSS347689 within unchanged caps.

Live verification remains unconfirmed: pre-deployment /our-work was reachable, but post-deployment reload failed with409 environment_offline because the execution workspace disconnected. Local checkout refresh could not complete. Restore connection and refresh latest integration before repository writes, then verify deployed homepage/Our Work/Stories/Impact/Contact. No live font or geometry success is claimed. Protected main/PR104, canonical facts, artwork bytes, privacy/payment/media/indexing and fixed bottom-right Companion preserved.
