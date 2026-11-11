# AF-R076 — Contact email-protection regression coverage

**Date:** 11 November 2026 IST  
**Owner/writer:** CHATGPT_ACTIVE, the sole authorized implementation writer.  
**Current source status:** Existing Contact page and footer use native public `mailto:` links. No current source defect was reproduced; the historical external Cloudflare email-protection failure remains unverified against deployed runtime.

## Scope

This isolated test-only improvement prevents regressions in the Foundation's publicly visible Contact email links. It checks TypeScript/TSX source via the repository's already-installed TypeScript AST parser, not brittle substring counts. It requires three direct public email paths on Contact, one in the footer, and the distinct donation-support subject link. It rejects unexpected `mailto:` destinations, injected `/cdn-cgi/l/email-protection` paths and `javascript:` links. It returns only generic failure messages and does not process donors or disclose secrets.

## Verification

- Current source: `src/app/contact/page.tsx` and `src/components/site-footer.tsx`, inspected on main at task start.
- Local synthetic TDD setup: module import initially failed before implementation; after implementation four native `node:test` cases passed, including controlled source mutations of a Cloudflare-protected link, a wrong support email, and a broken footer link.
- CI integration: `node --test scripts/test-contact-email-links.mjs` added to the existing fast gate. Hosted exact-head CI and separate ready-state promotion are required before guarded merge; they must not be inferred from synthetic local tests.
- No runtime UI/route/brand/CSP change, no provider or infrastructure activation, no media/privacy/finance/migration effect. Even after merging test coverage, browser acceptance and public live verification remain separate.

**Historical 149-item scope:** AF-R076 remains a historical not-started/external-live repro item. Added source regression coverage does not certify the historical Cloudflare production symptom as fixed or promote its full-acceptance classification.

**Coordination:** This branch is `test/contact-email-link-integrity-20261111`, based on source main `e25987dd2223bfa459e15a1f9f0b4d99760237a9` while read-only branch retention PR #760 runs its required browser acceptance. Sole writer is unchanged; no second writer or overlapping source changes. PR #684 payment-destination activation remains on HOLD. Rollback only test helper, native tests, CI line and this evidence note.
