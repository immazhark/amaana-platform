# Public appeal share URL privacy boundary — 12 November 2026 IST

**Writer and coordination:** CHATGPT_ACTIVE is the only repository implementation writer; work is serialized across isolated task branches, while tests/QA run concurrently. This branch starts from main 99fef460d493d21629f83f9612c33808e8ca8ec8 and changes only AppealShare source, its tests and this scoped note. Independent active PRs #814 (participation-card safe destination schemes) and #815 (carousel index) have non-overlapping source and test files. Financial PR #684 is held.

**Defect hypothesis:** AppealShare currently concatenates a path beginning with one slash directly into the official origin, including query strings and fragments. It also accepts a leading slash followed by backslash, which a URL consumer could interpret as a network-path target. A mistakenly supplied user or case query parameter could therefore enter outward WhatsApp share text and copied links. No actual live leak or malformed published case is claimed.

**RED-first:** Synthetic render tests require canonical share URL without query/fragment and reject raw backslash host patterns. The existing safe appeal path and legacy double-slash negative test must continue to pass. Run the RED test before changing source. **GREEN after RED:** parse and verify same-origin single-leading-slash path, reject backslash/control characters, discard query/fragment only for outward sharing, fall back to official homepage when invalid. Preserve privacy-sensitive title/summary copy, clipboard lifecycle, button semantics, no active checkout changes.

**Release:** Full exact-head fast/browser/database/production/verify CI, independent review, separate ready-state, protected SHA-guarded merge and Railway/public live identity. Do not touch bank/UPI, payments/refunds, donor data, identity/media, auth/RBAC, schema, CSP, secrets, cron or live infrastructure. A narrow revert removes this change. No 149-item reclassification for the sub-scope.

## Hosted RED evidence and GREEN correction

Test-only head `ee6ee83f3d3eba6bdf95c50433ea1703afd27946` failed exact-head fast CI `43222999542`, job `131199150745`: two new `appeal-share.test.tsx` cases failed, with the encoded synthetic `?reference=synthetic-private#notes` visibly included in WhatsApp's URL and a raw backslash-host string included in the copied share path. Existing native/clipboard, valid public appeal and double-slash rejection tests passed. The test used synthetic values, not real donor records.

GREEN source commit `ccac06897411397321e002d9c5369051b776110e` defines a same-origin canonical pathname guard: reject invalid/untrusted path forms and raw control/backslash characters; parse URL, check official origin, return only pathname. All external share UIs consume this single sanitized canonical URL. Full GREEN exact-head CI, separate ready-state, protected merge and live readiness remain required; there is no current claim of deployment or a real-world leak.
