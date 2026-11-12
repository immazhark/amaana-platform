# Public participation-card destination protocol safety — 12 November 2026 IST

**Scope:** Public ParticipationCards on /contact and /get-involved. Current typed href accepts non-HTTPS, non-mailto, non-tel destinations directly into Next Link without explicit safe-scheme policy. Runtime arrays can violate static TypeScript types. This is defensive source hardening, not evidence of a live malicious link.

**RED:** participation-card.test.tsx contains ten synthetic unsafe/malformed href examples: JavaScript, data, HTTP, protocol-relative, backslash-host, credentialed HTTPS, embedded newline, padded internal route, empty and null. Test requires invalid cards to disappear while official internal, HTTPS social, mailto and tel actions remain.

**GREEN proposal after hosted RED:** Validate actual href string, trim and control characters; permit a single-leading-slash internal route, non-credentialed HTTPS, mailto or tel; reject all others before rendering cards. Preserve all approved links, labels, icons, external target/rel, copy and brand. No new dependency.

**Release:** Require exact-head fast, database, browser, production, verify; independent review; separate ready-state; guarded merge and public runtime verification. No auth/RBAC, payments/CSP, donor records, media, schema, secrets, cron or infrastructure changes. Roll back scoped code/tests/docs; master 149-item counts unchanged.

## Verified test-first evidence

- Hosted RED at test-only head `bab6e235acb0bac51f0150e7a5fe9c76ed8c0939`: CI run `43220250947`, fast job `131189770864` failed only the new unsafe-destination regression. The rendered markup included synthetic JavaScript, data, insecure HTTP and protocol-relative cards; the existing valid navigation test passed. React's own JavaScript URL blocking did not remove the unsafe card, and was not sufficient to meet the new explicit policy. This establishes the actual source-level defect, **not** a malicious real user link.
- GREEN source commit `0567407bbafcfb84d232bb2869e65d325b4d686c` adds a guarded accepted-destination predicate before rendering. Valid internal, HTTPS-without-credentials, mailto and tel card behavior remains unchanged. The next exact-head CI is required for all validation.
- Explicit limitations: static reviewed source inputs are the current live callers; this is preventive defense in depth. No donation route, beneficiary record, media approval, schema or infrastructure behavior changed.
