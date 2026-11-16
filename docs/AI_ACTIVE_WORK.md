# Amaana Foundation — active implementation writer

**16 November 2026 IST — CHATGPT_ACTIVE.** Only one implementation writer. Parallel independent read-only reviews and CI are permitted, but no second repository writer.

**Protected main at AF-R024 reconciliation:** `eab2d44d5ce1b83f60476aa3dbe142156e4cac3b`, after #1014 guarded wave-13 manifest SHA-guarded merge; full CI `43910196497`, independent ready-state CI `43914652760`. Protected source and website runtime are distinct; last public runtime `edcaf99ff21733c37937e8c326624e8e41a14267` and /api/health/ready `ready`. #1014 historical retirement `43914765982` requires independent post-workflow ref verification.

**Current source task:** `fix/af-r024-clamp-additive-font-floor-20261116` / PR #1015, AF-R024 synthetic CSS font-floor scanner gap for additive constant `calc()` within `clamp()` minimum. Original RED test commit `4fbaa89029ac8ab597a9e3ce7f3b3bee9994b68c` failed at exactly `Guard public CSS minimum type size` in CI `43910992881`. Corrected code and unchanged test commit `09cf993d72c1020a78fab6252a1f736ac96f00bf` passed the focused scanner guard and full fast suite in CI `43911266079`. Reconcile to new protected main without force, then re-run all exact-head checks and distinct ready-state gates before any guarded merge. This is a bounded scripts-only change, not field typography acceptance.

**Independent existing task:** PR #1016 `test/af-r012-unawaited-permission-guard-20261116` is a synthetic test+scanner hardening branch for unawaited `requirePermission` and `getCurrentUser`. Both RED tests were proven in hosted CI `43914072957` and `43914588767`; GREEN change head `189a8daa233a5c8cb298f83e31f6ec92f72a893d` is under hosted checks, must reconcile to later protected main. No production auth/RBAC changed.

**Financial hold:** #684 official UPI QR receiving/settlement/provider verification and #845 staging payment eligibility remain unmerged; no payment, migration, notifications, secrets or cron activation.

**Master 149 unchanged:** 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 Not applicable.

**Safety:** Domestic INR only/no FCRA; 12A/12AB provisional and 80G unresolved. Redact all identifiable public donor/beneficiary faces and strip EXIF/GPS. Preserve protected/retained/unmerged refs and unique legal/media/recovery evidence. No high-risk production alterations without separate reviewed scope and authorization.

**Next:** Complete #1015 exact-head and ready-state checks; SHA-guarded merge; verify Railway SKIPPED and public identity. Reconcile #1016 after merge. Continue AF-R079 retirement only with reviewed exact-SHA manifests and verified deletion results.
