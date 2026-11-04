# AF-R012 — Admin API static guard inventory rejects comment decoys (4 Nov 2026 IST)

**Scope:** Source-only CI test hardening, no production auth/RBAC behavior changed. Preserve existing anonymous admin browser acceptance and runtime guards.

**Reproduction:** `scripts/test-admin-route-inventory.mjs` used regex `getCurrentUser()`, `hasPermission()`, `isSameOrigin()` text checks on raw source, which accept signatures in comments or quoted text. Synthetic unguarded API source containing those decoys was incorrectly considered guarded.

**RED:** Draft PR #643, test-first head `facec85c01bc6cac2b3eaad525e8077e56f8136c`, hosted CI `41734001293`: one new native test failed, four existing admin inventory tests passed; other jobs correctly skipped. This tests the static inventory only, not a runtime vulnerability.

**GREEN candidate:** `caacebe36fb0c8c0b940f729832ae4fd8834a6fa` replaces the static guard detection helper with TypeScript AST traversal. Accept only direct identifier `CallExpression` nodes for exactly those three guard functions; comments/string literals/member expressions do not satisfy the helper. Existing route inventory, no-store/header and server-action permission tests remain unchanged.

**Release requirements:** exact-head plan, fast, isolated database, production build, Chromium/browser, verify, independent review, separate ready-state promotion/verification and expected SHA guarded merge. CI-only `scripts/**`/docs modifications may correctly trigger Railway SKIPPED. No donor/beneficiary data, payments, schema changes, production auth, secrets, public media, cron activation or infrastructure changes. AF-R012 remains Partial; historical 149 counts unchanged. Rollback: revert this PR.

**Coordination:** single writer CHATGPT_ACTIVE, up to 3 independent draft PRs (#641 AF-R042; #642 AF-R057; #643 this). The same coordination files are updated by the PRs; reconcile against accepted main after each release, never assume nonconflicting coordination changes.
