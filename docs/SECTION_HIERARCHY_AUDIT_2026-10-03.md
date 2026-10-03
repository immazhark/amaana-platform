# Body heading hierarchy and closing alignment

Owner evidence: all seven October3 screenshots recovered and inspected. Screenshot1 establishes title-left/supporting-copy-right; screenshot5 places closing actions under right-hand copy. Screenshots2/3/4/6/7 expose reversed homepage reading order, narrow closings and inline evidence kickers.

Implemented on `fix/section-hierarchy-alignment-20261003`, integration base `5ba040e2e2898b674693d301dd2ebcec1273a31e`:

- Shared and legacy body H2 display scales cap at3.5rem, with fluid mobile sizes; smaller form/prose headings retain their reading roles.
- Homepage banner title grows to a maximum4rem and exceeds body display headings at supported widths. Typography/geometry/brand artwork remain incumbent.
- Homepage programme introduction uses SectionHeading before its carousel; controls remain within the carousel toolbar.
- Closings use the full public shell and a two-column composition: heading left, supporting copy and actions right. Mobile reading/focus order stays title, copy, actions.
- Removed inline-block body-title legacy behavior so kickers cannot sit beside title baselines. Evidence panels retain their own right-hand content.
- Widened display text measures to avoid unnecessary five-line headings at desktop sizes. Retired unused v3-closing decorative circles; no rendered route used that selector.

Verification: first clean build/typecheck passed.392 units pass with six database-dependent skips;22 planner regressions and224-file editorial guard pass. Lint has one existing unused importer-variable warning. First responsive confirmation:16 Chromium checks pass in22.8seconds, seven widths320/390/768/900/1024/1440/1920 with WCAG A/AA layout checks and existing homepage/portfolio regressions. Desktop/mobile captures inspected; final text-measure confirmation and exact-head seeded route CI pending. Initial real-route local run failed due to absent DATABASE_URL; no local database-backed coverage is claimed. Isolated production-hidden section fixture supplies shared-layout coverage without touching live records.

Final local confirmation:16 Chromium checks pass in20.2seconds, including strict banner/body hierarchy at all seven widths. Corrected genuine mobile equal-size hierarchy found by that assertion. Clean build/types pass; fresh JavaScript819181/819200 and CSS347649/348160 bytes. Workspace stale generated output was isolated by moving the generated tree and keeping build/budget/browser confirmation in one command without concurrent filesystem operations. No budget caps increased.

Mechanical detector warning: existing footer wordmark gradient text in experience-finish.css; unchanged official treatment, outside requested heading/layout fix.

Release: PR/integration CI, exact review deployment and live verification pending. Protected main/PR104, canonical facts, artwork bytes, privacy/payment/media/indexing and fixed bottom-right Companion preserved.
