# AF-N13 — withdrawn `braces` stack-exhaustion advisory

**Decision date:** 11 November 2026 IST  
**Status of this sub-scope:** source and upstream evidence reconciled; no runtime fix or package override necessary on verified evidence. This does not mean every possible parser input is safe or that all backlog acceptance conditions are met.

## Authoritative advisory

- [GitHub Security Advisory GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), CVE-2026-93687, originally published 18 September 2026, **withdrawn on 23 October 2026** because it was determined *not practically exploitable*. The advisory retains a historical high severity label and records **no patched release**. A withdrawn advisory is not an instruction to force a nonexistent `braces@3.0.4` upgrade.
- [OSV record](https://osv.dev/vulnerability/GHSA-vfj7-8cjw-p6xm) carries the same withdrawn status. Historical references remain useful for provenance; do not present their original severity score as a currently actionable production finding.

## Verified repository configuration

- `package-lock.json` blob `6f499e01bdb8525a61aa499709379c6520373e80`: `packages["node_modules/braces"]` is `version: 3.0.3` and `dev: true`. The root `package.json` does not declare `braces` as a direct dependency; lockfile entry is transitive and development-only.
- `Dockerfile` blob `5a935dbe7bf9d9abd923a4892be1b909997c4192`: the runtime-dependencies stage performs `npm prune --omit=dev` and asserts `test ! -e node_modules/braces` before building the isolated runner image. This proves the intended image contract and a required build-time guard, **not** an independent running-container package inventory.
- `package.json` includes `npm run audit:prod` as `npm audit --omit=dev --audit-level=high`. Existing exact-head CI for PRs #757 and #758 passed fast/production jobs; those CI results do not prove absence of all future advisories.
- Source `main` at review: `86135173653dcbdfb601be8c0dc7633f9bafab8e` (AF-R047 #758 merged). Latest website runtime is a separately verified boundary; this source-only disposition does not assume deployed SHA equals current main.

## Disposition and reopen triggers

**No dependency override, package downgrade, patch fabrication, blanket audit suppression or live release is approved or required for this withdrawn advisory.** Keep the provenance in the historical 149-row ledger; do not add an extra backlog item or inflate totals.

Reopen targeted investigation if any of the following becomes true: GitHub/OSV reinstates the advisory or a new actionable advisory is issued; `braces` is promoted into an installed production dependency; untrusted user-defined brace patterns reach a development/build parser on an exposed surface; or an actual, independently reproduced failure appears in Amaana's controlled workspace.

AF-N14 (early-closed destination stream) is **separate**. Without an exact failing command/event trace and isolated reproduction, this note must not claim its root cause or closure. No donor data, secrets, payments, network requests, schema, infrastructure or runtime application source were changed by this documentation.

## Evidence / acceptance boundary

Implemented: source-and-advisory disposition note. Tested: relevant earlier CI evidence, no new runtime test. Merged: pending this PR's impact-selected CI and separate ready-state acceptance. Deployed/live-verified: not applicable to a docs-only review; do not infer website runtime. Fully accepted: AF-N13 advisory disposition review only; other security and 149 backlog classifications unchanged.

Rollback: revert this single documentation note if the upstream advisory materially changes, then publish a new evidence-backed disposition; preserve its history.
