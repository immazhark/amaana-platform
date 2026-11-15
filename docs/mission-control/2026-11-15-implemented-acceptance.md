# 24 Implemented items — what is still needed before Completed

15 November 2026 IST · Source implementation exists or was previously asserted, but the exact remaining acceptance evidence is not yet sufficient. **These are targeted verification actions, not new claims that all listed defects were reproduced today.**

| ID | Execution lane | Original acceptance still unverified | Next focused verification or implementation |
|---|---|---|---|
| AF-R034 | ENGINEERING | Seven accessible-name mismatches need complete label-in-name proof across routes | Run focused screen-reader-name and Playwright assertions for each listed component |
| AF-R044 | MEASUREMENT | Footer CLS improvement lacks current measured mobile stability evidence | Collect shift sessions near footer then fix any remaining reserved-space issue |
| AF-R046 | ENGINEERING | Master category/initiative import may still make redundant database calls | Count SQL operations in isolated DB and batch confirmed N+1 |
| AF-R050 | ENGINEERING | Lenis may reenable smooth scroll after native keyboard focus | Verify keyboard navigation handoff against timed activation in browser |
| AF-R051 | MEASUREMENT | Browser and polyfill target modernization lacks current shipped bundle/device acceptance | Inspect Next build output and run supported-browser compatibility matrix |
| AF-R055 | MEASUREMENT | AVIF/WebP device sizes configured, but real delivery/cache acceptance incomplete | Probe width/format and cache headers across reviewed media and routes |
| AF-R083 | REVIEWED_SCOPE | In-page appeal choice and presets exist, but provider/checkout outcomes not independently accepted | Complete synthetic checkout tests; live payment needs separately authorized scope |
| AF-N03 | ENGINEERING | Payment confirmation might accept mismatched provider-returned identity without full negative coverage | Test returned payment IDs against ordered identity before persistence |
| AF-N04 | ENGINEERING | Malformed provider payment shape may still reach reconciliation under rare responses | Test malformed/null provider results and assert zero mutation |
| AF-N05 | ENGINEERING | Provider order ID must be strictly validated before donation row write | Exercise malformed/replayed identifiers in isolated database tests |
| AF-N06 | ENGINEERING | Malformed failed-payment identity must never alter authoritative paid status | Run synthetic malformed failure webhook/handler cases |
| AF-N07 | ENGINEERING | Stale payment failure must not overwrite later authorized status | Test concurrent state order and monotonic database transitions |
| AF-N11 | ENGINEERING | Scrypt weak-factor regression may use malformed fixtures | Prove real supported low-work-factor hash fails and valid strong hash remains valid |
| AF-N12 | ENGINEERING | Private-record tests mock real security helpers and may miss actual bypasses | Add integration cases with unmocked authorization and token validation |
| AF-N19 | ENGINEERING | Host/Origin guard coverage for absent/malformed/unconfigured headers incomplete | Test forwarded/absent/malformed origins with no unsafe trust |
| AF-N21 | ENGINEERING | Generated artwork might appear after prebuild-only weight audit | Run image weight check after generation and test oversized fixture |
| AF-N23 | ENGINEERING | Private JSON/prototype-derived labels need full rejection proof before client render | Exercise malformed prototype/array/unknown-key JSON fixtures |
| AF-N24 | ENGINEERING | Async acknowledgement response may update unmounted component | Use controlled deferred promise and effect-dispose test to assert no state update |
| AF-FAQ | EXTERNAL | Visible FAQ/schema exists but tax-status wording is not qualified-settled | Reconcile 80G pending/provisional register and verify final visible/schema parity |
| AF-ACK-TYPES | REVIEWED_SCOPE | Uncertain donation order/confirm response types risk duplicate payment submission | Exercise client state discriminated union, cancellation and retry tests; payment change needs scope |
| AF-INTAKE-UNCERTAIN | ENGINEERING | Uncertain assistance save/cleanup can encourage duplicate request retries | Test synthetic partial save and idempotent retry tokens with cleanup failures |
| AF-FUNDING-MATH | REVIEWED_SCOPE | Expired/near-goal fundraising states can misstate payable limits | Test closed/overfunded/reopened cases; live eligibility modification needs approval |
| AF-PROMOTION | REVIEWED_SCOPE | Sensitive identity promotion and stale withdrawn media caches lack full privacy acceptance | Test public denial and revocation with synthetic sensitive records; no face publication |
| AF-FIXTURE | ENGINEERING | Portfolio browser fixture may miss nullable preview relation and hide source projection regressions | Add nullable relation fixture and assert fail-closed public selection |

The issue must move to **Completed** when its own original defect is disproved by tested current source and, where necessary, the corresponding public live or provider result. It must move back to **Partial** if review shows source gaps. An unrelated successful deployment, passing smoke test or old PR title alone does not settle the original requirement.
