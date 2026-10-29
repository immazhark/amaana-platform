# Integrated draft fixes — 28 October 2026

Source-only integration candidate on `integrate/verified-draft-fixes-20261028`, based on #525 head `7bbcbd9082d97560955bc7d8520c2b58d2b68df4`. Latest owner explicitly authorizes commits, task PRs and qualifying protected merges. One root implementation writer; specialist reviewers are read-only.

These 43 existing draft fixes are normally merged with their exact commits and coordination histories retained. #517 is already included in #516 and is not merged twice. No archived feature branches, localization #374, provider activation, schema migration, legal assertion or real financial/private-data operation is included. Separate HIGH retention race #523 remains unresolved. This is not closure of 43 canonical master rows.

| PR | Exact incorporated head | Scope |
|---|---|---|
| #479 | `94fd96d26447d1e1aa07fbbba39c511dae4d3ec8` | fix(a11y): allow native wheel scrolling inside compact mobile navigation |
| #480 | `de48e9c56af269539f35b238a68e6f16cd0eeb83` | fix(stories): render publication dates in Asia/Kolkata |
| #481 | `3c3be69527004aa260ee21db3fbd741b42c62eb3` | fix(faith): display publication and review dates in IST |
| #482 | `037b16018d8a2f48240ab9d4b2627a9b82d46a0b` | fix(appeals): display field-update dates in IST |
| #483 | `6e607a44ad311cc04eab0113fe038f9d0f7d5e21` | fix(a11y): return gallery focus to its original opener |
| #484 | `f229931d63559403d217943ec3dbf57d17ef9762` | fix(admin): preserve current request status and assignment selections |
| #485 | `f6881073cab795195cce8d29f27a26a1d19dbefe` | fix(admin): provide accurate filtered-empty states and recovery |
| #486 | `1766b9c3700e9e657f1eb1a5aa4ff86fe1e4c26b` | fix(a11y): dismiss mobile navigation before the Companion panel |
| #487 | `eb54e748a68b6a0b4958e3224c159ae9fe6e8227` | fix(companion): preserve latest copy feedback during overlapping attempts |
| #488 | `5a5ccb4c99b1573fb087338f6607825dbbecf3c3` | fix(tracking): display private request dates in IST |
| #489 | `15c52b687f7c1f506b288dc39a2833f9f781b51d` | fix(private): show donation acknowledgement record date in IST |
| #490 | `1a66cf39637e3bf86e20507cf9b081dd5cdaec6e` | fix(admin): clarify empty Media Library visibility filters |
| #491 | `4730233317e783facf8e711d46b7718d2bb46666` | fix(security): strip bidi control characters from optional feedback notes |
| #492 | `200c405a3f0cc10ace267f2ff4c603c4858eba54` | test(AF-R047): distinguish CSS Resource Timing from decoded bytes |
| #493 | `3c3636edaae65d7b687ea4c3b7690484894a1f55` | fix(AF-R042): restore Our Work search focus contrast |
| #494 | `071e91a67371247ed8cf5439622400d6bffd3179` | fix(a11y): restore readable Media source labels on paper cards |
| #495 | `e0b8e72c6f79c04af47a77fe19cfdd4157230d26` | fix(a11y): improve published appeal-update text contrast |
| #496 | `cabee58165a431a880934849d67937b97acd130c` | fix(a11y): raise Compliance hold paragraph contrast |
| #497 | `dba2bd4411c57f8285001d04cb942eb0d0bc47e0` | fix(a11y): maintain contrast on Appeals review cards and hover |
| #498 | `a05d139d5ad0e634fef14a8c4d53eb7213b8b53f` | fix(a11y): maintain contrast in Faith closing call to action |
| #499 | `4d407be9a16ff3d9e5e1dc6b1ffbe6b055be7ef2` | perf(css): remove unused Transparency folio stylesheet |
| #500 | `78eb27428af6df189a9b5a49a2c4c1d895e77095` | perf(faith): load media only for the hero and filtered lead |
| #501 | `5b0ed550c8d9750977dd68cfacd31d83994ddbec` | fix(a11y): describe Stories filter errors on invalid controls |
| #502 | `f149454a3cb840cceaee43e2ebfc802583ee16af` | fix(a11y): associate Impact filter errors with the programme control |
| #503 | `b36d1048ab004d0798b2ca1b65d516dce2226565` | fix(work): preserve usable approved identity image fallbacks |
| #504 | `79f6b7dd006929b54473fd5f887bca752c88c5dc` | perf(admin): avoid unused Media attachment queries for non-editors |
| #505 | `4e6c2c2e9101e4a8e8e16e419ab2048d2911bc35` | fix(admin): show audit timestamps and media review dates in IST |
| #506 | `1f7b861bfed74693f630ea353ae1e5f00cfbc23e` | fix(admin): display notification schedule and sent times in IST |
| #507 | `6a73968417a21ff1b54223d0a1aed7d2af285f94` | perf(admin): minimize assistance detail staff and audit reads |
| #508 | `4cb6da8bf6bc0e6a94ae93ab74ab2e6ffa9c9310` | perf(admin): minimize Appeal Editor related-record reads |
| #509 | `c2eb36ca92a20c074d1db1637b02bc511f0702bf` | fix(ui): preserve feedback from the latest transfer-detail copy attempt |
| #510 | `a95deec5c1a9674ff8d079b545ca38da17442a31` | fix(perf): preload programme artwork in hero routes only |
| #511 | `abdaa3ed37779bc1ee958add8c0b291880d21824` | test(auth): guard assistance actions with real-session denials |
| #512 | `a53c89e1ce97f6fd4b6dfb9e0ff7ae3d07c8f968` | fix(telemetry): include seven approved public pages in analytics |
| #513 | `7b1c302de861faefe3045de190fd19eef3a31725` | fix(volunteer): surface malformed enquiry URL preferences |
| #514 | `d3c75252e5a7fe68cf908da84dea6acf9f6c00f8` | fix(feedback): explain incomplete review links without exposing inputs |
| #515 | `2d4cb3f66e539582952a97c67a5896ce3a2b57a0` | perf(public): bound homepage and completed-support DB reads to visible programmes |
| #516 | `7e261508de8248d942c74ae7e1c1cca48980b453` | fix(a11y): preserve mobile header and footer navigation without JavaScript |
| #518 | `6ee90708f4f57129190cadd7d8bf8f3ac7c01350` | fix(content): align footer copyright year with Asia/Kolkata |
| #519 | `8bca7a7661bdd6227959adb7d51a5cd45a8f933f` | fix(a11y): announce new tabs on assistance and recognition links |
| #520 | `104ad095b0429c6d6e2e2d631c2f902d5e85d376` | fix(perf): reject invalid route-bundle byte measurements |
| #521 | `11042770ec0be4e71bbc1759126e1a803162ca38` | test(auth): cover media and carousel mutations with real-session denials |
| #522 | `490926aaca7cdb34a3732b9b8031a71d9bc63071` | fix(admin): render private donation detail timestamps in IST |

Source conflicts were confined to independent test cases appended to `e2e/companion-panel.spec.mjs`; each whole test was retained. Three coordination files used union conflict resolution to preserve both histories. Production source files merged without conflicts; combined behavior still requires fresh tests and review.

Validation on the combined corrected tree: full Vitest **2,512 PASS / 20 isolated-database opt-in SKIP**; strict TypeScript, full ESLint/Stylelint, clean production build including secret/image guards, 26 native reporter cases and four native contrast cases PASS. Sixteen changed browser specifications parse. Aggregate uncompressed JS **808,046 / 819,200**, CSS **326,804 / 348,160** bytes; these are not measured transfer/CWV. Three independent source/UI/security/query reviews PASS (security reviewer also ran 192 focused cases).

Two real integration collisions were fixed: the unavailable-assignee option now fetches only its displayed assignee name, with a new missing-projection regression confirmed RED first; the older acknowledgement date fixture now represents reference-keyed state. The corrected date regression still fails under a controlled UTC formatter mutation, then passes after exact source restoration. Final 19 combined assignee/status/ack cases PASS. No acceptance threshold was lowered.

All 43 incorporated heads were confirmed ancestors of the local integration tree. Fresh hosted combined acceptance, protected merge and deployment remain PENDING. Prior per-PR results do not certify integration. Before release require strict types, full local unit and lint, relevant native reporter tests, clean build/budgets, independent review, complete exact-head hosted browser/database/production acceptance, separate ready-state verification and protected expected-head merge. Inspect deployment and exact public identity after release. Keep all original PRs and branches until incorporation is independently verified; no deletion or force push.

Rollback: revert this integration batch normally; no schema/provider rollback. Preserve #525 correction separately if it has released first. Do not use a blanket revert that restores the #523 deletion race as a claimed fix; the race was never fixed by this batch. Current privacy/factual/provider/manual gates and 149 historical classifications stay unchanged.

