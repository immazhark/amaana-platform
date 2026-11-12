# Public verified-impact strip: malformed metric projection boundary (12 November 2026 IST)

**Scope:** Public evidence-strip robustness only. This is not a verified real incident, a new programme claim, a live donation total, or closure of AF-R052 media tasks. The component `VerifiedImpactStrip` appears on Home, Appeals and Donate pages and accepts server-side published programme metrics, but `items.filter` and `item.title.trim()`/value/label assume TypeScript runtime types.

**RED-first:** Synthetic `src/components/verified-impact-strip.test.tsx` regression from commit `d6250b3482e11bc442fd8c75644cbfa651c0b162` requires null/undefined/string/object collections and malformed individual metric fields to be filtered without throwing, while retaining an approved-format synthetic `42 recorded items` entry. Hosted failing-test evidence must be observed before any source change.

**GREEN scope:** Check Array.isArray at component boundary and plain-string types of slug/title/value/label before existing slug validation and deduplication. Keep existing published-only data projection, text escaping, metric caveats and maximum three records. No CSS, image, payment, donor, fundraising, auth/RBAC, schema, CSP, secret, worker, infrastructure or publication-status modifications. Full exact-head CI, reviewer, separate ready state, SHA-guarded merge, Railway/public identity verification. Rollback only this test/source/docs change.

## Hosted RED and scoped GREEN evidence

Test-only head `383bdaae0589c39b8eb97a544a6c5af28cdf1715` failed hosted fast CI `43198284522` (job `131114880487`): one added `verified-impact-strip.test.tsx` regression threw `TypeError: Cannot read properties of null (reading 'filter')` in `src/components/verified-impact-strip.tsx:53`; 2,970 other tests passed (20 previously skipped). The test exclusively uses synthetic records and does not imply actual malformed live public metrics.

GREEN source commit `78585c750d41a3baa85c4de62be085d7cedc1467` adds an array guard and strict string-field checks before existing filters. Normal published metrics, links, three-record limit and privacy caveats remain unchanged. Full exact-head GREEN CI, separate ready-state and a guarded merge are still required. No claims of deployment, live mutation, or backlog closure.
