# Amaana Foundation — current verified state

**17 November 2026 IST.** GitHub source, CI, Railway deployment and independently retrieved public runtime are distinct boundaries. One writer: `CHATGPT_ACTIVE`; independent read-only review permitted.

| Boundary | Verified current state |
|---|---|
| Protected main | `e289e6790f76ee421f440ac24bd3d96d3efb5ec3` |
| Guarded source releases | #1023 AF-R079 wave 15 `a920867ad30a0e246c4b47d429278b98f090f18d`; #1024 AF-R012 `12f3f077e7bef50547233fcd485db901b1607d6b`; #1025 AF-N23 `9d89e4d150cdee8420c973253a6739d61c517084`; #1029 AF-R034 `b84339ebb91b47763ba9b7e55980a9e808d3d4eb`; #1027 AF-R047 `e289e6790f76ee421f440ac24bd3d96d3efb5ec3` |
| Latest accepted merges | #1029: full CI `43982704136`, independent Ready-state `43983877130`; #1027: full CI `43980401530`, independent Ready-state `43984014032`; both expected-head squash merges and task branches independently retired |
| Deployed state | Railway website #1029 `a9f669e1-ba00-49f2-be44-42e859d75510` SUCCESS for `b84339ebb91b47763ba9b7e55980a9e808d3d4eb`. #1027 website deployment `1a218658-3b4a-49ae-8ff3-d3a8445fdd35` SKIPPED. Public uncached version/readiness could not be independently retrieved |
| Current implementation | Draft #1030 AF-R076, branch `fix/af-r076-dynamic-mailto-audit-20261117`; test-first detection of unverified computed contact and footer href destinations. Exact new head and full CI must be rechecked after this file update |
| Concurrent QA acceptance | Draft #1028 AF-R052 media public-metadata provenance, head `3bfc2b29b267e111ad4083e3bfc78019af4e49b5`. Fast/database/production green in run `43983619901`; browser still active at last check; no merge claim |
| Excluded | #1026 closed unmerged after browser-verified HTTP 404/redirect regression. #684 finance/UPI and #845 privacy staging-marker changes remain held |
| Original 149 accounting | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable = **149**; no whole-item promotion from these bounded subscopes |

**Next:** complete #1028 browser and full CI, verify Ready-state run and merge with exact expected head and clean reviews. Then finish #1030 exact-head acceptance on the latest source head. Verify retired task branches and Railway separately. No blanket branch/doc deletion, no forced deployment, no unapproved live financial/schema/secret/RBAC/checkout CSP/infrastructure operations.

**Locks:** domestic INR only, no FCRA; 12A/12AB wording provisional, 80G evidence conflict unresolved; all identifiable public beneficiary/donor faces require reviewed redaction and EXIF/GPS removal. Preserve `public/brand/amaana-mark.svg`, blue `#466FAA`, gold `#E0B318`, cream identity, responsive keyboard/focus/reduced-motion behavior.
