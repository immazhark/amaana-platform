# AF-R049 route-scoped optional wheel enhancement lifecycle

**Scope/date:** 2026-11-04 IST. A prior main post-merge browser run 41844403652 had one failed route-scroll scenario at `e2e/site-motion-scroll.spec.mjs:272`: `html` still contained Lenis CSS class after navigation; other required main jobs passed. PR branch code may be unrelated, so this is an observed intermittently failing browser check, not established root-cause attribution.

**RED-first focused synthetic contract:** start a wheel-only Lenis enhancement, click a same-origin link to another pathname, observe the expected teardown, then simulate a queued wheel before pathname commit. Old-route wheel events must not reinitialize optional smoothing during an in-flight transition. A fresh wheel after a new pathname effect should be eligible again. Confirm first new test fails on uncorrected source via hosted exact-head CI. Maintain native page scrolling regardless of enhancement.

**Scope controls:** do not relax existing browser assertions, disable smooth scrolling globally, change static budgets, change website design or modify provider/payment/security boundaries. Require full CI on corrected exact head, separate ready-state verification, guarded merge and Railway/public runtime proof before describing as live. Preserve historical 149-item classification. Revert this bounded task if incompatibilities are found.
