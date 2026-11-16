# Amaana Foundation — current implementation writer

**16 November 2026 IST — CHATGPT_ACTIVE.** One repository implementation writer; parallel analysis and QA are read-only. Owner retains authority.

**Protected source main:** `8801ca786262ca7fc6f6f4e0e136cebfceffca48` after reviewed squash merge #998. Seventh historical retirement wave was independently verified: 25 historical refs and the merged task head absent. Across #991, #997 and #998, **70 historical refs** have been retired.

**Current branch:** `chore/af-r079-reviewed-history-wave8-20261116` (AF-R079). The existing guarded JSON manifest pins 25 live merged-PR heads #783–#815, excluding unmerged/unsupported #785, #787, #796, #800, #807–#809, and #804 (its merge SHA cannot be verified as an ancestor of current main). Each included live branch head matched the recorded merged PR head SHA, and each merge SHA was independently confirmed an ancestor of current `main`. The guard must still verify live PR/ref identity, retention exceptions, merge ancestry and exact SHA at deletion time. **Candidates are not deletions.** Full exact-head CI, distinct ready-state checks, guarded squash merge and postmerge retirement verification remain required.

**Other existing same-writer branches:** #993 AF-R062 gallery CSS at `70bde7fa91ba2ee8071dcaa0e1a7aee2002a96f9`, and #995 AF-R061 share-token CSS at `cfc4ca364a0dd3ab217a5848cc7d4a0ac4fc53ba`. Both are based on current main, with fast, database and production checks passed; browser acceptance was still running at last check (runs `43777396213` / `43777417557`). Promote/merge only after exact-head full and separate ready-state checks. Finance drafts #684/#845 are held.

**Runtime boundary:** Railway website last SUCCESS and public version/ready verified at `c481cdf7a2a3de429682c635a595c2ec8816e6c1`; #998 Railway website and parked worker SKIPPED. Never force a rollout just to equalize source and runtime.

**149-item master ledger:** **35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A = 149**. No classification change from branch retirement or isolated UI regression work.

**Locks:** Domestic INR only/no FCRA; provisional 12A/12AB and unresolved 80G status; no unapproved payment/auth/schema/secret/CSP activation. Public identifiable faces require redaction and EXIF/GPS stripping. Do not activate notifications, send donor messages, migrate production data or change live infrastructure without separate reviewed authorization.

**Next:** review wave-eight PR on exact head; finish #993/#995 browser acceptance and protected release; independently verify any actual branch retirement and Railway/public runtime afterward.
