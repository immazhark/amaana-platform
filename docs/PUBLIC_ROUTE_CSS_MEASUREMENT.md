# Public route CSS measurement — AF-R057 / AF-R068

**Checkpoint:** 25 October 2026. This is a reproducible, read-only measurement procedure, not an optimization result or an audit-item closure.

## Release provenance

- Runtime site: PR #433, production SHA `b033e99982caaeb295726bf19df64ca1ffa7f7a3`, Railway deployment `a8d650de-9e24-4569-81d8-58d2b81e297b` SUCCESS, public version and readiness HTTP 200.
- CLI implementation: PR #434, main SHA `771cba2e0c0cfe364962bc8db0f43581f8d958e2`, full hosted CI `40133473638` and ready-state CI `40136256260` SUCCESS. Railway deployment `5d749e49-9b1a-4881-be8d-dd1a19f7e5b0` SKIPPED by file watch patterns: `scripts/**` and `.github/**` are not website build inputs. No runtime release required.
- Historical AF-R057 and AF-R068 remain **Partial/unchecked for complete CSS coverage**; the 149-row canonical ledger is unchanged.

## Capture

From a trusted checkout containing #434, using Node.js 22:

```sh
node --test scripts/test-route-bundle-report.mjs scripts/test-live-route-css.mjs
node scripts/audit-live-route-css.mjs --json > public-route-css-baseline.json
```

The CLI reads only five fixed, public GET routes: `/`, `/our-work`, `/impact`, `/donate`, and `/request-assistance`. It follows the page's same-origin rendered `/_next/static/**.css` links, rejects unexpected response origins or non-CSS content types, reuses each fetched stylesheet once, and counts decoded response bytes per route. It does not read private records, require credentials or initiate a financial transaction.

**Before accepting the JSON** verify that all five routes are represented, have nonzero stylesheet counts when CSS links exist, and no fetch errors occurred. Keep the exact date/time, main SHA, Node version, output and run environment together. If any route fails, record the failure; do not record zero for a missing sample. The CLI exits nonzero on HTTP or content-type errors.

## What may and may not be concluded

| Measurement | What it establishes | What it does not establish |
|---|---|---|
| `routes[].stylesheetCount` | Number of referenced unique CSS files on the initial HTML of that route | Whether selectors are used or how CSS changes during interaction |
| `routes[].cssBytes` | Decoded stylesheet response payload for a route | Compressed transfer bytes, unused style percentages or browser parse time |
| `shared.uniqueStylesheets` and `shared.decodedCssBytes` | Unique CSS set across sampled routes | Sum of actual user-session network transfer, because caching may apply |
| Prior build report aggregate budgets | Whether uncompressed production build JS/CSS remain within CI budgets | Per-route loaded CSS, LCP, INP or CLS |

Initial external inspection observed 3, 4, 3, 6 and 4 linked stylesheets respectively on the five public routes. Attempts to recover precise bytes through external scraping were blocked by rate limiting or payload truncation. **No historical per-route byte baseline is validated yet.** Use the Node CLI output rather than those incomplete external responses.

## Coverage required before optimization

1. Capture the five routes in desktop and narrow-mobile viewports, including key menus, accordions, expanded/closed cards and form state changes. Include 200% and 400% zoom, keyboard focus and reduced motion.
2. Capture actual CSS coverage per interaction in a real browser. Separate truly unused declarations from selectors needed only in hidden, hover, focus, error or responsive states.
3. Target a measured CSS cause, create a failing regression where behavior is at risk, and change only the smallest supported component or route layer. Do not move root stylesheet imports on aggregate-only savings claims.
4. Compare before/after decoded bytes, network transfer, rendered state, focus visibility, color contrast, motion and responsive screenshots; run the repository's full CI and browser acceptance.
5. Do not mark AF-R057 or AF-R068 complete until route/state evidence supports the specific acceptance claim. AF-R042 additionally needs actual assistive-device acceptance; browser emulation is not equivalent.

## Ownership and release policy

One active repository writer. No changes to Razorpay, donation status, case records, credentials, Cloudflare policy, tax or religious content are authorized by this measurement workflow. Keep the production Runtime SHA separate from a merged tooling-only Git SHA when Railway watch patterns intentionally skip a deployment.
