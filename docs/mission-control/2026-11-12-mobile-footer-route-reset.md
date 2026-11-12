# Mobile footer route-change accordion state — 12 November 2026 IST

**Implementation owner:** CHATGPT_ACTIVE, single coordinated writer. This is an independent UX defect track, separate from #803 backlog evidence, #804 sitemap source, and finance hold #684. Base main `cbb113a1fdc44bc2a9ef7f0bd36eb08ecf5097ac`.

**Hypothesis, not yet a confirmed runtime defect:** `FooterNavGroup` stores only `open` with `useState(false)` and uses `usePathname()` to update active-link attributes. It never resets `open` for a new pathname. The shared root layout may persist the footer across App Router client-side route changes, which would leave previously expanded mobile groups open on the next page.

**RED regression:** an isolated Playwright test at 390px opens the "Take part" group on /about, navigates via its Get Involved link and requires the new route's same group to be collapsed and the links to remain discoverable by reopening. If RED reproduces, implement path-scoped accordion state (no synchronous state-setting effect), preserving keyboard focus/aria-expanded, desktop always-visible links and no-JS fallback. If baseline passes, stop without speculative behavior edits.

**Release:** fresh exact-head fast/browser/database/production/security checks, independent review, separate ready-state and protected SHA merge, then Railway/public version readiness. No donation, user-data, media, provider, auth/RBAC, schema, CSP, secret, cron or infrastructure changes. Rollback: revert the two scoped source/test files; this is not an AF-R044 CLS closure without measured CLS evidence.
