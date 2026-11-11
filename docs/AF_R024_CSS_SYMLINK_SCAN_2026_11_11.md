# AF-R024 — Public CSS symbolic-link audit integrity

Date: 11 November 2026 IST. Writer: CHATGPT_ACTIVE. Draft PR #769.

## Reproduced scanner defect

`scripts/public-font-floor.mjs` enumerated `src` with `readdir({ withFileTypes: true })` and accepted only `Dirent.isFile()` or `Dirent.isDirectory()`. Symlinked CSS files/directories were silently skipped. A symlink at the `src` root was followed by `readdir` without an explicit audit boundary.

A local synthetic filesystem probe confirmed the Dirent behavior. GitHub test-only head `c880a34f3cb9ac7347ee94160c6eb3c67c721136`, CI `43048893417`, fast job `130620417100` reproduced three missing-rejection failures. An ordinary nested CSS control passed.

## Correction and boundaries

Commit `94a5ed6a2b1e687e26441af021e666405b31459a` validates the root of each scanned CSS directory with `lstat()`; it rejects a symbolic-link source root and all symbolic links encountered in directory entries, rather than silently omitting linked files. Normal local CSS continues to be audited against the existing literal 12px/.75rem floor. No application stylesheet, public media, auth, payment, secret, schema, CSP or live Railway setting changes.

## Acceptance

Require corrected candidate full exact-head GREEN (fast, production, browser, database and final verification), independent review, separate ready-state and SHA-guarded merge. The new guard does not constitute full rendered WCAG acceptance or prove absence of other dynamic CSS risks. The financial QR PR #684 remains held. Historical 149-row backlog totals are unchanged.

Rollback: narrow revert of auditor, synthetic tests and coordination/evidence only.
