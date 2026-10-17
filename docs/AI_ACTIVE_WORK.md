## 2026-10-17 — Private tracking rate limits and captured-payment response integrity

Ownership: HANDOFF_PENDING. ChatGPT completed sole-writer source+focused regression batch on existing open PR #292 `fix/direct-transfer-feedback-20261013` to `main`, starting from verified `c7af4374a42fd6912698d73099a7240b310c543f`. Test commits `74d983c968cabfb9fc21c14c943962804ae6b5bb`, `e3bbb279e2a9f4e0962c9f123f4c6883782d10c0`, `ab4ebe352066aa6c166060fc6a2446a8b99effd3`, `138a1747116c9004cceb642d32a19f96013723f3`. Source commits `2d034ed745c3db77fece134ad6b77b2edf0c4819`, `770ba9e4f2cd8de384b41709ed3624dac1096272`, `e7610d81d7811466a8a7039b9491475f8a766052`, `6c68ddb5ef917da1a06a7a60e7df9c38c1f9f4e9`; master `5cf390ae004620649c6f537f2c8798cf557e9d8f`; ledger `a88d506cc20588938a53f28caad1187ff8d46499`.

- `src/app/api/assistance/status/route.ts` private case status check lacked online attempts quota despite bounded body, origin and token verification. New `enforceTrackingRateLimit` uses the existing serializable hashed-attempt ledger, isolated `tracking` namespace, 60 hourly attempts/client, ASSISTANCE_TOKEN_PEPPER with no new secret, and no coupling to the three-hourly-case-submit allowance. Requires same origin, then consumes attempt before reading token payload or querying private record; 429 generic found:false plus Retry-After, ledger unavailable 503. No raw IP/reference/token persisted in abuse ledger.
- `src/app/api/donations/confirm/route.ts`: prior post-`captureDonation` `expireDonationViews` exception could return false HTTP500 despite committed CAPTURED record. Now isolates cache expiry failure with generic server log, reads and returns canonical persisted donation status, and does not loosen Razorpay signature/payment identity/INR amount or captured-status checks. `src/lib/donation-cache.ts` attempts all tag/page invalidations even when one fails and throws the first failure afterward for other replayable callers.
- TDD-style regression scenarios written in private tracking route, request-security, confirmation route and donation-cache tests; GitHub readback checked code/test source. **Not executed**: hydrated project dependencies/checkout unavailable; no Vitest, TypeScript, ESLint, concurrency, provider, live payment or cache run. No CI pipeline, schema migration, deployment, main merge or real beneficiary/donor write.
- Master149 unchanged **60 Implemented /61 Partial /26 Not started /1 Superseded /1 Not applicable**, zero formally closed. AF-R012 and AF-SETTLEMENT get PR-open bounded source evidence only.

Next writer: verify PR head+ownership; run `npx vitest run 'src/app/api/assistance/status/route.test.ts' 'src/lib/request-security.test.ts' 'src/app/api/donations/confirm/route.test.ts' 'src/lib/donation-cache.test.ts'` and focused TS/lint when hydrated checkout is available; repair any failures before release, then continue actual source-backed remediation with the single-writer protocol.

## 2026-10-17 — Manual unpublication revocation of shared media and fail-closed review inputs

Ownership: HANDOFF_PENDING. ChatGPT completed sole-writer source+test batch on PR #292, `fix/direct-transfer-feedback-20261013` targeting `main`, beginning from verified HEAD `e50c08464ffb18af5624ab81e65367be6b8fab81`. New code `f7b6b1e9f1409768b6613b0f905faaaa79136492`, `53370c6374e97d9e07a34141735ab0661ec4a1c6`, `c981da2e665f14ee2bcf71957fa4640cf472bf37`; regression tests `74875c3aa4cfb34c5d5a8f60a7b97fcb603e43cc`, `cd98a334d6991545d85b59967c6f6018bb12a6dd`, `22971f780ed6936084e910f2baa6e76a8b6a9d6c`, `0d298094f45d10c6191f1f18e4ac3ebdb4043ada`; UI `c76e312fb86ed1a4236f42a1ab6ff38cd355f364`; master `f0ce533114774cc3b72d279542e8def50e196df7`; ledger `8803a708bbd1f9b6c0716e8bec4c4a2a5d49a8d8`.

- Standard `setMediaPublication` Unpublish previously changed just the selected MediaAsset, even though `storageKey` and public media URL may be reused by other published references. Now a serializable predicate read identifies all published matching storageKey/publicUrl references and conditional updates revoke every match in one transaction. Audit only after all CAS operations succeed; no partial public siblings remain on success. Refresh all selected and shared assets' public, programme, archive and managed-media routes using the existing independent postcommit helper. No original storage objects removed; external provider takedown remains manual.
- Admin publication `publish` previously silently treated invalid/missing/other values as false. Now requires explicit literal true/false and rejects repeated, missing, uploaded or other non-text identity/action fields before DB read. Permanent deletion identity and confirmation similarly reject ambiguity. `media-governance.ts` now rejects ambiguous duplicate/File values in nine consent, privacy-class, metadata and checkbox controls; checkboxes allow only missing or literal "on", 2000-character notes limit enforced. Staff media UI explains cross-programme unpublish scope.
- Regression cases were authored test-first in `src/app/admin/(protected)/media/actions.test.ts` and `src/lib/media-governance.test.ts`; GitHub readback checked code and test source. **No hydrated local repo / working git DNS**, so Vitest, TypeScript, ESLint, DB transaction, S3, browser, CDN and performance checks NOT run. No CI run, main merge/deploy, database migration, real media deletion, or payment operation. This remains an unverified PR, not established production readiness.
- Master149 unchanged **60 Implemented /61 Partial /26 Not started /1 Superseded /1 Not applicable**, zero formally closed; AF-PROMOTION/AF-CONSENT have added PR-open code evidence only.

Next: verify exact PR head, maintain single-writer discipline, run `npx vitest run 'src/app/admin/(protected)/media/actions.test.ts' src/lib/media-governance.test.ts`, TypeScript and changed-file lint on hydrated checkout, repair findings. Investigate adjacent source-backed defects before another code batch rather than manual speculative audits.

## 2026-10-17 — Admin media postcommit refresh integrity and storage alias deletion

Ownership: HANDOFF_PENDING. ChatGPT sole-writer batch on open PR #292, `fix/direct-transfer-feedback-20261013` targeting `main`, initial verified SHA `09c8f899c71b7c974a011852cf28a8d946c443ee`. Media action tests `15a1d3deaabcf4542a6abf0f8bb70a09ded5d035`, `01c36e77c194b1518e6d5a86978f8d6bc6b13d1d`, `10bca6586789e35a9fba89c517b707bdde01375a`; code `46b433519938e0fbe3eceb097adaa812d3f2c04a`, `11c7408edcbe85bdb5fe60b7f56ffb1c211c24a1`, `e013b129e1536ebb018c077b0bfd2755050cd9b1`, `11ee97981602c357e388461c9aeee7acf26c49fe`; UI `448606099b19df8bccb2f9c98d4492da4ff4d498`; master `1b57e14ad0774475fc70809a557d074cf652b922`; handoff ledger `b5972beb7af807a563c206ae75dd1ad50f202fe6`.

- Committed media publication actions previously could throw on sequential `revalidatePath` failures, falsely signalling publish/unpublish/create/edit/delete write failure and bypassing later cache refresh paths. New shared postcommit helper independently attempts all affected paths and redirects on any adapter failure to `/admin/media?saved=refresh-delayed` without replaying committed transactions.
- Publication/deliberate removal now refresh public list/landing, managed `/media/YYYY/UUID.ext`, bounded associated cause/initiative/story/faith detail and media archive routes. Existing singular asset read now includes relation slugs; no per-page N+1 reads. Draft create/edit remain narrow. Admin media page has accessible role=alert explaining successful commit and pending public refresh, with no-repeat warning.
- Schema `MediaAsset.storageKey` is nonunique. Previous permanent deletion of one unpublished record could remove S3 bytes referenced by a second asset, even public. Deletion now fails before S3 and destructive audit if any other asset references its key; rechecks after version claim. Does not guarantee concurrent uniqueness, and no migration/storage delete was performed.
- TDD-style focused tests authored before source, including cache failure after successful writes, affected detail/archive paths, no refresh after failed transactions, shared published/unpublished managed key, second-read alias detected after deletion claim. GitHub source and tests readback verified. **No hydrated repo/dependencies, so tests were NOT executed**; no TypeScript, ESLint, Postgres, browser, storage, real CDN or bundle verification. No CI jobs, migrations, merge, deployment, provider/payment calls or live data changed.
- Master149 unchanged: **60 Implemented /61 Partial /26 Not started /1 Superseded /1 Not applicable**, zero formally closed. AF-PROMOTION and AF-CONSENT receive source evidence only.

Next: Verify current PR head and sole-writer status, run `npx vitest run 'src/app/admin/(protected)/media/actions.test.ts'`, TypeScript and changed-file ESLint in a hydrated checkout, repair findings; then continue source-backed highest-impact bugs. Do not silently overwrite another agent's ownership.

## 2026-10-17 — Linked appeal cover media withdrawal + managed URL alias safety

Ownership: HANDOFF_PENDING. ChatGPT completed one sole-writer source batch on existing PR #292 `fix/direct-transfer-feedback-20261013`, base `main`, beginning from verified HEAD `c70e64fbd859d2ee0f7ea10af843aec4018d2a71`. Source `cb0a24b514c023dc2b52fac5d134e61a200a3467`, `e9751cf400fb5727d16c599af74ed823f0877be3`, `089b27ad6f522f88d32b00350d0817a304e32bf8`, `856ccc61a4c264a78d706fc5512e52a38a311404`, `bb03d5aa66781521a3b105380f383281017557b3`; UI `2528cac5426adb8bdb36c8c1c454cf9480a91441`; regression cases `ee1179e3f5e11c468fbb2418519ee05f255463f6`, `49418e62878e08a107ba05237c7d87324cab0753`, `c717fc115b9ca3bdc2601bddd999fe64348f0a39`, `0151737c270cc841a3bc377e38ec1e0807231bd2`; master register `1f54fa0b19555d5f690d480f3eea35d9e0febc5a`, ledger `17da3202b5430fc858be9f4c6e99e83ff196f2a6`.

- Existing emergency assistance-linked disclosure withdrawal now CAS-unpublishes associated published cover-media library records inside the SAME serializable transaction, including alias URL forms and all approved public rows pointing to a matching canonical managed storageKey. Audits each asset revocation. Doesn't delete S3 files or harm donation ledger; existing public withdrawal/verification/fundraising stop unchanged.
- Managed `/media/YYYY/UUID.ext` GET now requires exact URL↔storage-key publication matching both at DB selection and pre-storage authorization; a public row with unrelated URL cannot serve the same storage key. After commit also attempts each managed media route revalidation independently.
- Missing media-library match or externally hosted cover triggers `media=review-required` and accessible admin warning for original source removal. Success status also cautions that cached copies may remain. Provider/CDN cache purging and external source deletion CANNOT be assumed; previously cached copies may last under existing cache headers.
- Regression cases authored for managed/alias/external/unmapped cover, lost CAS rollback, route URL mismatch, managed path invalidation and unaffected existing flow. GitHub readback confirmed current source/tests/doc wiring; **no hydrated checkout or run of Vitest, TypeScript, ESLint, DB, browser, real S3 or external cache tests**. No CI pipeline, branch promotion, merge to main, deployment, real beneficiary/media/provider write or schema migration.
- Master149 remains **60 Implemented /61 Partial /26 Not started /1 Superseded /1 Not applicable**, zero formal closures; AF-PROMOTION and AF-CONSENT gain bounded PR-open evidence.

Next: verify PR HEAD and run focused `npx vitest run 'src/app/admin/(protected)/requests/[id]/actions.test.ts' 'src/app/media/[year]/[filename]/route.test.ts'`, TypeScript and changed-file lint on a hydrated repo. Repair any issue before release. Public media distributed or embedded beyond case cover, browser/CDN cached original bytes and externally hosted original URL removal still require explicit scope and operations. Maintain sole implementation writer.

## 2026-10-17 — Emergency public consent withdrawal after appeal conversion

Ownership: HANDOFF_PENDING. ChatGPT completed source/administration and regression coverage on open PR #292, branch `fix/direct-transfer-feedback-20261013` targeting `main`. Initial verified head `927effa29c746f7b7f0a062e9cc5f328d2ceae62`. Tests `9b4f8bb72404370624adbd6156efed1c101a0525`, `a28a5cd87683f8b3d11b6932d00336f672104ecf`, `09fc5c3fe18e3549a40b373386da4787b87870f3`, `b3ac8c4db5df9f61a02f9b42fb4f9488ccbc13a8`. Source `cbea70fdf2f892e80fcaa46c7e22d62c31792fa6`, `7460674b90dc4675e46eda2db05f9c83d28b38af`, `5b893febb2917cdd4c3b662ad5484edc8b3d9461`; admin UI `8e32747c17a9d847411c47e80f554f3ab15541bd`; master `07b3064b32552f2c40f66a91c2f916663cf990a3`; ledger `88c7934d6379d58e9fe2d0b15c0fb8683e197993`.

- Confirmed emergency gap: ordinary post-conversion case verification is locked; no route to record genuine withdrawal of public disclosure after a public appeal launched. Newly dedicated `withdrawConvertedAppealDisclosure` requires both `assistance.approve` and `appeal.approve`, factual 20–500 character private reason and explicit confirmation, and rejects duplicate/File scalar fields, unlinked cases, stale case/review/appeal versions, or lost conditional updates.
- Transactionally sets `decision=APPROVED_PRIVATE`, `confidentialityLevel=HIGHLY_SENSITIVE`, public name/photo/medical/institution/archive disclosure `NOT_ALLOWED`, PUBLISHED→PAUSED, FUNDED→CLOSED, clears featuring, and invalidates stale anonymous copies. CLOSED remains CLOSED with archive withheld, PAUSED stays hidden; no refund, ledger or approved amount mutation. Audit trail is preserved. Re-publication blocked even without name/cover.
- Added staff-only review form with version stamps/consent attestation and explicit result warnings. Post-commit invalidates `appeals` tag and related admin, public appeal, donation and programme paths independently; refresh errors do not pretend to undo committed writes.
- Ten focused cases authored in existing assistance actions and appeal-publication tests, code and test source readback checked. **Not runtime verified:** no hydrated local checkout, prior git DNS failed. Vitest, TypeScript, ESLint, database, browser, cache propagation, external CDN purge and bundle measurements not run. No real beneficiary withdrawal, payment, email or provider call, migration, `main` merge or live deployment. Outside-of-app hosted media takedown still operationally required after actual revocation.
- Master149 unchanged: **60 Implemented /61 Partial /26 Not started /1 Superseded /1 Not applicable**, zero formal closures. AF-PROMOTION and AF-CONSENT gain source-only PR-open evidence.

Next: verify PR head. Run `npx vitest run 'src/app/admin/(protected)/requests/[id]/actions.test.ts' src/lib/appeal-publication.test.ts` plus application TypeScript and changed-file lint in hydrated checkout; repair failures before release. Review public media/CDN revocation separately and proceed with next actual source-ready defect as sole writer.

## 2026-10-17 — Current beneficiary name/photo consent at public render boundary

Ownership: HANDOFF_PENDING. ChatGPT completed source/tests on open PR #292, branch `fix/direct-transfer-feedback-20261013` (base `main`), starting verified HEAD `f2ec234fc03404e3fe3c4ead36179abe1d98cf6e`. Detail regression `47ff70f064865d953715e3695fc52d6d6c7725f6` and code `4e2e1ca9deed6613645caa0a7700aec3a6241448`; homepage regression `19ada83860e18535e21a00b0dc92034015f39ed4` and source `94fbfe1837e9400fc53f3130a6b4c5ad31aaa7a2`; master149 `87e1bd50264c07d91298aa8c379f5ab2cdc7e4a6`, handoff ledger `3ffe3da74324a64c67c5880eeadfbaf63b7dfe9a`.

- Public appeal detail projection now checks current linked public-name and photo review decisions alongside existing archive consent. No explicit ALLOWED public-name consent => return null beneficiaryDisplayName. No photo ALLOWED/NOT_APPLICABLE => return null cover URL. Missing/invalid linked verification fails closed; private review relation stays server-only. Already-approved standalone legacy appeals and contextual approved imagery remain compatible.
- Homepage's existing lean appeal cache projection also selects photo consent and withholds unapproved cover URLs before public serialization. Confidentiality/highly-sensitive discovery checks and donation eligibility stay unchanged. No added DB roundtrip or provider integration.
- Authored targeted regression cases for approved/withdrawn/missing/unknown consent, independent consent choices, standalone legacy and closed archive, plus homepage withheld and approved image behavior. GitHub source/test readback confirmed exact branches and selection guards.
- **Not runtime verified:** no hydrated local repository or working git DNS. Vitest, application TypeScript, changed-file ESLint, PostgreSQL, browser, real revocation/caching and bundle measurements remain pending. Editorial identifiers embedded in title/summary/story/update copy are outside the structured-field fix, and cached homepage data may require explicit invalidation on consent revocation.
- Master149 unchanged: **60 Implemented /61 Partial /26 Not started /1 Superseded /1 Not applicable**, zero formal closures. PR open, no merge/deploy. No donation/payment, messaging, storage, schema, database or real beneficiary data mutations.

Next: Verify exact PR HEAD, run `npx vitest run src/lib/public-page-data.test.ts src/lib/public-content-homepage-consent.test.ts` plus project TypeScript and changed-file lint on a hydrated checkout. Correct any failures, then continue source-ready privacy revocation/cache and editorial copy protection. Maintain sole writer.

## 2026-10-17 — Fail-closed linked appeal promotion and metadata

Ownership: HANDOFF_PENDING. ChatGPT completed one privacy source batch on open PR #292 `fix/direct-transfer-feedback-20261013`, target `main`, starting HEAD `0955b444f6d05e0176bb7d7581bc99824f5400e8`. Promotion tests `f5b1d432`, first guard `168eb3df`, shared-class tests `940f21d1`, canonical privacy classifier `8a818445`, metadata tests `daa8a63c`, metadata integration `3f69b907`, master149 evidence `73f39aa27e7ed51e080a1ebbc2c9438943a7bceb`, handoff ledger `ecfc08aefdc048269f422d84c0b1a9de3fe91dac`.

- Source root cause: prior `!== "HIGHLY_SENSITIVE"` comparison passed missing and unrecognized linked-assistance verification/classifications to public promotion. Concurrent `getAppealSearchPrivacy` nullish default labelled linked unknown verification STANDARD, risking identifiable metadata and share copy.
- `src/lib/appeal-promotion.ts` centralizes schema-valid public privacy classification. Linked records promote only with exact STANDARD or CONFIDENTIAL; missing/unknown linked verification uses HIGHLY_SENSITIVE public classification. `src/lib/appeal-search-privacy.ts` shares it and fails closed on absent public record. Existing `public-content.ts` and `public-page-data.ts` apply the helper to homepage, initiative and appeal directory discovery. Legacy standalone records retain visibility. Approved direct accountability case body not changed.
- Added/updated `src/lib/appeal-promotion.test.ts`, new `src/lib/appeal-search-privacy.test.ts`. Both cover approved decisions, missing/invalid linked decisions and standalone legacy. No provider activity, applicant/donor/DB changes, migrations, configuration, package or UI dependencies.
- Read public Superpowers TDD, Ponytail, addyosmani/agent-skills and mattpocock/skills for directly applicable engineering principles. Did not import unrelated linked video or agent/model tooling.
- GitHub readback verified source/test and projection wiring. **Vitest, project TS/lint, browser/public URL/DB and bundle checks were not run**: no hydrated repo in local container, git DNS inaccessible. Do not label these regressions as runtime passed. No main merge or production deploy.
- Master149 unchanged: 60 Implemented /61 Partial /26 Not started /1 Superseded /1 Not applicable, zero formal closures. AF-PROMOTION / AF-CONSENT gain PR-open evidence only.

Next: verify current PR head, execute focused `npx vitest run src/lib/appeal-promotion.test.ts src/lib/appeal-search-privacy.test.ts` and project TypeScript/ESLint on hydrated checkout; fix any failures before release, then select next source-ready backlog batch. Preserve single writer ownership.

## 2026-10-17 — Appeal cache refresh after confirmed commit

Ownership: HANDOFF_PENDING. ChatGPT completed source changes on open PR #292, branch `fix/direct-transfer-feedback-20261013`, target `main`. Starting verified HEAD `408f2c06df7817600d3d4395fc2d5a86b4ea643e`. Tests `e916945a31110f573f2b8bcd955878e61bda2755` and `47af3a708632ecec19f4264582290deaeff545c3`; source `84e64fbaa965a9ac45ec86edf44242551b06358b`; admin delayed-state notice `36ef8e5aa0a0184652d2edef295977757e8e56bb`; master149 `c4aeebdce36a1e040dd5703b15dfc29ead90b3e7`; handoff ledger `5ce4f4ef2f93f2b104f008276eb9919564ca7bf4`.

- Six appeal mutation actions now keep database/audit success separate from cache invalidation failure. All planned invalidations run independently after commit; partial errors redirect to a saved-but-refresh-delayed staff notice, avoiding false rollback messages and duplicate retry. Public status transitions also invalidate specific detail URLs when possible. A privacy escalation warning addresses potentially stale public content.
- Added targeted tests for cache failures after status/featuring/edit/create/publish/unpublish updates, fallback invalidations, unaffected valid completion and genuine transaction conflict. Existing consent/verification, privacy media review, RBAC, optimistic CAS and serializable mutation behavior remain unchanged. No runtime dependency, schema/migration, CSS or provider behavior change.
- GitHub readback confirmed six post-commit helper calls and matching notification markup. **Tests authored, not executed**: this session lacks a hydrated checkout and working git DNS. Vitest, TypeScript, changed-file lint, native DB, production cache, browser and bundle sizes remain unverified. No main merge, live mutation, external provider operation or production deploy.
- Master149 unchanged: **60 Implemented /61 Partial /26 Not started /2 other**, no formal closures. AF-PROMOTION and AF-CONSENT gained scoped source evidence only, PR open.

Next: verify PR branch head and run targeted `npx vitest run 'src/app/admin/(protected)/appeals/actions.test.ts'`, application TypeScript and changed-file ESLint on a hydrated checkout, then continue independently source-ready items. Treat delayed public cache invalidation as a follow-up operational concern until public URLs are verified. Maintain one implementation writer.

## 2026-10-17 — Strict appeal administration input boundary

Ownership: HANDOFF_PENDING. ChatGPT completed existing PR #292 on branch `fix/direct-transfer-feedback-20261013` (target `main`; not merged or deployed). Initial verified HEAD `94dedae77a40dd48daa56d20448063fdd1ea6908`. Source `82134f65bd3af049ec2ee480c0dc0e444f02038d` and `d5c1f9329509976a09f3aefdcd2b889b3e1bf1f2`, regression tests `9cad3d2eb9260c40555cd8295ee190544a2d0efc` / `5edaf9934b23474951dd17a25f78447abce9b609`, master149 `46849f170860a9728656f0b2baca233573773647`, handoff ledger `034fe718145b00890ec53b53c4d463507cc46ec7`.

- Replaced first-wins `FormData.get()` with established single-field cardinality guard and a text-only input boundary in all seven appeal administration actions. All 28 scalar reads now reject duplicates; File-valued text fails before coercion. BeneficiaryLocation parsing moved before transaction entry. Retains valid forms, permissions, approved financial-goal/media/consent checks and existing CAS/audit.
- Added unit/action regression cases for duplicate goal/beneficiary name/location/status/featured order/publication flags/review/identity and File-as-text inputs. GitHub source readback: 0 raw reads, 28 guarded reads, form control names preserved.
- **Validation limit:** local repository checkout and dependencies unavailable; GitHub DNS failed. Authored Vitest cases were not run. Application TypeScript, lint, database, browser, bundle and release validation remain outstanding; do not promote the new source as runtime verified. No provider/DB/payment/email mutations, new dependency/migration/config, main merge or production deployment.
- Master149 remains **60 Implemented /61 Partial /26 Not started /2 other** with zero formal closures. AF-PROMOTION and AF-CONSENT gain only bounded PR-open evidence.

Next: verify current PR/branch SHA and run focused `npx vitest run 'src/app/admin/(protected)/appeals/actions.test.ts'`, application TypeScript and changed-file lint in a hydrated checkout; correct failures before release. Resume next source-ready batch only with sole writer ownership.

## 2026-10-17 — Safe paused appeal resumption

Ownership: HANDOFF_PENDING. ChatGPT completed the sole-writer batch on `fix/direct-transfer-feedback-20261013`, PR #292 targeting `main`. Starting branch HEAD `8acb60dc460947c32e6e349b5b1a5365818618`. Source `825211b27c9940908c3f872792361605ea3563bd`, `3b5e47cd4b7920023c929577b2bc608650115092`, required-link change `5e224e1751c004cf2b7ba2ec28237dddc5b04c06`, test commit `d49a5c3769bf3edeb3601c42ab2823d98946c806`, master update `4420f8a227ec3502f200495f545323e7a7404096`, handoff ledger `689ce2e42bdfbc6c573391e341f4d5c0bd37a6e3`.

- PAUSED→PUBLISHED now repeats current linked-assistance verification, name/media permissions, exact approved-goal check and approved-media review before and within the transactional status change. Withdrawal or media revocation stops the public transition without a status write, audit event or public invalidation. First publication remains guarded.
- Previously public, unlinked legacy appeals can resume without an invented case verification, but their cover still needs current library approval. Valid resumed appeals keep the first publishedAt. Other transitions unchanged.
- Added focused helper/action regression cases: withdrawn disclosure, altered goal, missing verification, legacy resumption, cover withdrawn before review or inside transaction, and successful reviewed resume with preserved published timestamp.
- GitHub source/test readback and symbol/call-site checks passed. **Runtime tests were not executed** because no hydrated repository checkout is available and git cannot resolve GitHub here. TypeScript, Vitest, lint, native database and browser evidence remain pending. No new JS/CSS bundle measurement.
- Master149 remains 60 Implemented /61 Partial /26 Not started /2 other, zero closures. AF-PROMOTION and AF-CONSENT receive only scoped PR-open evidence. No live records, providers, migrations, emails, transactions, main merge or deployment were changed.

Next: verify current PR head and run targeted `npx vitest run src/lib/appeal-publication.test.ts 'src/app/admin/(protected)/appeals/actions.test.ts'`, application TypeScript and changed-file lint on a hydrated checkout. Fix any failures before release or the next source-ready batch. Maintain one implementation writer.

## 2026-10-17 — Public assistance verification integrity

Ownership: HANDOFF_PENDING. ChatGPT completed this sole-writer batch on PR #292, branch `fix/direct-transfer-feedback-20261013` (target `main`, not merged). Starting branch head `008efa3bd3fd47c02fc08ab6b7716b568846f731`; implementation `2c0509d4500ec3af1206d5845fc27f91c88704da`, tests `21d1610697b777dca40631b274b0b8849c1f5d40`, master register `8bfb582b3115fd6b3d3c99588556335afa185a66`, handoff ledger `25806b1b32dd3857d6cb320f822d7250a98606c5`.

- The shared public-appeal verification gate no longer treats arbitrary strings as reviewed consent or Zakat evidence, nor malformed nonempty timestamp strings or invalid Date instances as a completed verification. The generic request approval helper uses the same timestamp boundary. Valid reviewed decisions and actual Date/ISO timestamps retain their previous behavior.
- Updated existing AF-LOCAL/AF-CONSENT master149 evidence rows; no new register IDs, status promotions or formal closures. Counts unchanged: 60 Implemented /61 Partial /26 Not started /2 other.
- Authored focused Vitest regression cases for all five disclosure fields, valid/invalid Zakat statuses, invalid timestamps and valid Date/ISO completions. GitHub readback confirmed source/tests. **Cases were not executed here**: previous checkout path and dependencies were absent, network git clone is unavailable in this container. No TypeScript, lint, optimized build, browser, native DB or provider verification is claimed for this batch.
- No main merge, production deploy, payment, case mutation, schema/migration, provider activation or external messages. The fixed asset ceilings remain unchanged; bundle sizes were not remeasured. Do not claim release readiness.

Next: incoming sole writer should verify the latest PR/branch head and run the focused tests, application TypeScript and changed-file lint on a hydrated checkout. If those pass, select the next independent master-register source-ready batch. Preserve the existing publication/consent and financial boundaries.

## 2026-10-17 — Reliable private proof upload lifecycle

Ownership: HANDOFF_PENDING. Sole writer continued PR #292 from `ce01bd7`; source `7a2072b26c685f08940a1a98ce48b60622717c8f`. No main merge/deployment or actual evidence upload.

- Shared delivery/bank/consent proof uploader now uses the existing bounded private-request helper for a thirty-second transport AND response-body deadline. Synchronous submission lock prevents overlapping requests before React renders disabled controls; file validation stays before transport.
- Case/purpose identity keys reset browser state immediately when the target changes. Lifetime abort on unmount/scope replacement and ignored late responses prevent an old case upload from displaying success, clearing a new file selection or refreshing the replacement case.
- Only a valid document-ID response confirms success. Timeout, network failure, unreadable/malformed receipt or server 5xx means uncertain outcome: uploads remain blocked and a native case reload link requires document review before another attempt. Cancellation ends the browser wait; it never claims to roll back a server write. Definite 4xx validation remains manually retryable. No automatic upload retries or server deduplication claim.
- Verified receipts remain success if router refresh throws, with manual reload guidance. Existing server permission, same-origin/body/file limits, case/role eligibility, transaction/audit and uncertain-commit/orphan safeguards are unchanged. Upload alone does not confirm delivery, corroborate finance or approve disclosure.
- No database schema, public media role, consent activation, provider operation, client framework or project dependency added. A temporary external jsdom test runtime was used for real React component lifecycle checks; no repository dependency/lockfile change.

Applied ECC trust-boundary principles, Karpathy/Ponytail minimal change and existing Impeccable conventions. Detector reported no findings. Relevant GitHub/plugin guidance is used selectively; no unrelated scanner/installer/model-router execution.

Validation: **32 focused cases across real DOM component, bounded-request helper and existing upload-route suites pass**. Cases cover same-tick double submit, hung transport/body, timeout then late success, case/purpose replacement, unmount, 4xx/5xx/malformed receipts, all three proof purposes and refresh-after-success failure. Actual object storage/database/provider writes are mocked. Application-only TypeScript, changed-file zero-warning ESLint, diff checks and clean optimized compile-only build pass. No CI pipeline, full data generation, native database concurrency or authenticated browser/live upload acceptance is claimed. Earlier whole-repository assistance fixture typing limits remain separate.

Emitted JS **815858/819200**, CSS **348052/348160**; JS +1632 from the earlier 814226-byte build, still 3342 below the fixed ceiling. CSS unchanged. No budget/config relaxation.

Master149 remains 60 Implemented /61 Partial /26 Not started /2 other, zero formal closures; AF-MILESTONES/AF-SETTLEMENT/AF-CONSENT gain scoped private-proof lifecycle evidence only. Financial reconciliation, verified outcomes, exact consent and retention policy remain separate approval gates. Git classifications remain 58 Merged /63 PR open /28 Uncommitted.

Next: continue the next concrete source-ready package. No external message, real case/donor/file mutation, public publication, migration, cron/configuration change, merge or release occurred.

## 2026-10-17 — Complete fund registry traversal and truthful saves

Ownership: HANDOFF_PENDING. Sole writer continued PR #292 from `3872eb6`; source `1d9b1af75dddc7b650554d7b97f2fc6bf967878c`. No main merge, public fund activation or deployment.

- Replaced inaccessible first-100 registry cap with count-clamped 50-row pages, deterministic status/update/ID ordering and native status plus name/slug/account-code search. Same combined predicate drives counts and rows; links preserve filters and changing filters starts from the beginning. Invalid/repeated status/search values are ignored without reflection. Empty views are described as filtered views, not an empty registry.
- Registry reads select only displayed/edit/revision/independent-review fields. Receipt, active approved-plan and refund-conflict aggregate queries use only displayed fund IDs; they still aggregate ALL qualifying contributions/proposals per displayed fund in SQL. Empty/view-only lists do not issue money reads; planning rollout gate remains. Exact decimal paise validation, original-purpose restrictions, independent maker/checker, refund conflicts and no-cash/no-outcome disclaimers remain.
- Fund creation, draft editing and status review no longer report post-commit cache refresh failure as a failed write. Both view invalidations are attempted independently after persistence/audit; fixed saved+delayed feedback instructs reload before another change. Database/audit failures remain failures. No mutation is replayed to repair a view.
- No new client boundary, stylesheet, package, schema, fund seed, public checkout/allowlist activation or provider/financial operation.

Applied relevant ECC coding/security, Karpathy and Ponytail principles plus existing Impeccable UI conventions. Source detector returned no findings. Listed GitHub repos/plugins are used when relevant rather than installing unrelated runtimes.

Validation: **59 focused cases in four suites pass**, including later-than-100 access, stable pages, shared filter predicates, empty/minimal reads, independent review controls, exact-paise and refund-conflict suppression, and post-commit refresh failures across create/edit/status actions. Application-only TypeScript, changed-file zero-warning ESLint and diff checks pass. Earlier broad string-based approval assertions were narrowed to the actual per-fund transition select so the new read-only APPROVED filter is not confused with self-approval authority; server maker/checker guards remain tested unchanged. No CI pipeline, real fund/donor mutation, PostgreSQL concurrency, browser acceptance, full build or bundle remeasurement is claimed; whole-repository assistance fixture typing limits remain separate.

Master149 source classification remains 60 Implemented /61 Partial /26 Not started /2 other, zero formal closures. AF-FUNDS and AF-ALLOCATION gain scoped operational evidence; they remain partial pending reviewed activation/financial policy/native acceptance. Git classification remains 58 Merged /63 PR open /28 Uncommitted. Main/production and PR291 refs unchanged.

Next: continue next independently source-ready implementation package, preserving the same release boundaries and implementation-first allocation.

## 2026-10-17 — Actionable notification attention queues

Ownership: HANDOFF_PENDING. Sole writer continued existing PR #292 from `6ce052b`; source `67755678d906bc28a67976581654695e07de3cfb`. Main and separate PR291 refs unchanged. No provider operation or release.

- Existing global stale/overdue/terminal health counters now link to actual staff work queues. Shared Prisma-checked predicates govern both health counts and selected rows; status intersection and count-clamped 50-row pagination preserve attention scope. Invalid/repeated attention parameters are not reflected. Counts below the selected view remain explicitly global.
- Stalled and overdue lists sort oldest-first by update/schedule with deterministic IDs; terminal review is newest-first. Selected empty views offer an all-records recovery link. Stalled records remain read-only rather than restarting an in-flight delivery.
- Delivery channel is displayed; retry forms appear only for failed EMAIL records and notification.manage users. Existing independent server permission, EMAIL/FAILED guard, expected timestamp CAS, serializable audit and provider idempotency behavior retained.
- Manual requeue rejects duplicate/File-valued ID, reviewed timestamp and operational reason before transaction entry. Timestamp must exactly match the canonical ISO snapshot rendered by the page. Worker/dashboard retry and stale thresholds share unchanged five-attempt/fifteen-minute constants; no retry budget, scheduling policy or provider behavior changed.
- Staff dates render in IST. No dependency, stylesheet, client boundary, migration, runtime flag, worker activation, cron change or external email added/executed.

Applied relevant ECC/Karpathy/Ponytail principles and existing UI conventions; Impeccable source detector returned no findings. The owner's listed GitHub references remain task-selective; none was installed or executed solely to satisfy a tool-count target.

Validation: **39 focused cases across four suites pass**, covering real page filters/pagination/permission, controlled retry action boundaries, established attention thresholds and existing mocked worker recovery/send behavior. Application-only TypeScript, changed-file zero-warning ESLint and diff checks pass. No CI workflow, authenticated job invocation, real provider send, native database/concurrency, browser acceptance, full build or bundle remeasurement was performed. Earlier whole-repository assistance fixture type limitations remain separate.

Master149 implementation remains 60 Implemented /61 Partial /26 Not started /2 other, zero formally closed. AF-CRM gains scoped transactional delivery operations, not marketing/suppression consent. Its new source is PR-open/not deployed; current Git classifications 58 Merged /63 PR open /28 Uncommitted. No live job/recipient records were changed.

Next: next concrete source-ready development batch; keep implementation dominant and preserve the existing release boundaries.

## 2026-10-17 — Correct filtered retention review and private controls

Ownership: HANDOFF_PENDING. Sole writer continued PR #292 from `ec017cb`; source `b615087923fb817b6439a9c0406144ec90e99b88`. Same branch; no merge or deployment.

- Fixed a verified query bug: active/eligible filters previously affected counts and pagination but were absent from the document read. Counts, rows and preserved page links now use the same predicate, with clamped 50-row pages and truthful filtered-empty wording.
- Replaced whole-document includes with displayed-field selection. Storage object keys and unused applicant names, appeal titles and case timestamps are no longer read for this list. Audit reads match the exact displayed document/case pairs and select only rendered history fields; no global history cap can hide an active hold. Existing history retrieval is not claimed fully bounded by row count.
- Retention decisions, dates, reasons, confirmation and hold snapshots reject repeated scalar values or File inputs before document reads. Calendar dates must be canonical real civil dates; invalid February overflow no longer rolls into March. Existing future-review rule, permission, hold rechecks, terminal-state checks, exact DELETE confirmation, document CAS, privacy withdrawal before storage deletion and audit semantics remain.
- Visible labels are wired to unique document controls. The DELETE option appears only for terminal unheld evidence; hold release remains available and server checks remain authoritative. Staff history dates use Asia/Kolkata rather than server timezone. No policy schedule, dependency, stylesheet, client boundary, migration or automatic deletion added.

Guidance: ECC security/coding standards, Karpathy and the installed Ponytail workflow were read/applied as relevant; Impeccable source detector returned no findings. Owner's newly supplied repository references remain task-selective, not an instruction to run every installer, scan or model router. No new tool installation is claimed.

Validation: **33 focused cases across actual page/action suites pass**, including wrong-filter regression, permission-before-read, pagination, private projections, held/active/linked-appeal decisions, form label connections, scalar cardinality, real leap days and existing destructive ordering/hold guards. Application-only TypeScript, changed-file zero-warning ESLint and diff checks pass. Persistence/storage are mocked; no native PostgreSQL concurrency, real object deletion, browser/manual AT, full build or bundle remeasurement is claimed. Previously recorded whole-repository assistance fixture typing limitations remain separate.

Master149 source classifications unchanged: 60 Implemented /61 Partial /26 Not started /2 other; no formal closure. AF-CONSENT gains actual retention queue/input evidence, while professionally reviewed retention policy and end-to-end acceptance remain open. No live evidence/donor mutation, external message, production configuration, migration, merge or release.

Next: continue the next source-ready implementation batch; retain single-writer ownership and proportionate checks.

## 2026-10-17 — Private donor review evidence and request filters

Ownership: HANDOFF_PENDING. Sole writer continued existing PR #292 from `69780c3`; source commit `5803db150f04784fcc688f168bca9b4c7afe415b`. No merge or release.

- Staff donor-rights history now shows closure time in IST and the controlled outcome from existing transactional closure audit evidence. Only fixed outcome labels render; missing/malformed latest evidence remains explicitly unavailable. No raw audit text, donor contact, actor details or receipt credentials are added. Closed reviews sort newest closure first, with missing dates last; active requests retain oldest-first processing.
- Existing 40-row queue plus one lookahead remains bounded. One audit read selects only entity IDs and metadata for displayed closed requests, capped at 80 rows even for duplicate legacy evidence. Unknown evidence is not inferred from older duplicate entries. No additional audit read for disabled, empty or active-only queues.
- Native request-type filter supports access/correction/deletion-review with strict whitelist. Queue switching, reset and next-page links preserve the chosen type; changing type starts from the first page. No new client boundary, styles, dependency, schema or retention policy.
- Staff start/close decisions reject repeated scalar fields (including identical values and File mixtures) before transactions. Existing permission, disabled-feature gate, status CAS, staff attestation, controlled outcomes, transactional audit and post-commit refresh semantics remain.

Applied previously reviewed ECC coding/security guidance and Karpathy minimal-change principles. Validation: 30 focused page/action tests pass; application-only TypeScript, changed-file zero-warning ESLint and diff checks pass. Persistence is mocked; no native database, browser, full build, bundle remeasurement or live workflow acceptance is claimed. Previously recorded whole-repository test-fixture typing limitations remain separate. Optional workflow activation, retention/legal decisions and deployment remain pending.

Master149 classifications unchanged: 60 Implemented /61 Partial /26 Not started /2 other; no formal closure. AF-CONSENT gains scoped review-history evidence only. No external message, donor record mutation, migration, flag activation, provider operation, merge or deployment.

Next: continue the next unblocked implementation package from existing source and register; keep checks proportionate.

## 2026-10-17 — ECC-guided unambiguous private assistance inputs

Ownership: HANDOFF_PENDING. Sole writer continued PR #292 from `871bd7c`; published source `e7dad1d17cf92288b1cb08dee586489333530bc8`. Same branch; no main merge/release.

Applied the user-requested ECC guidance from the official `affaan-m/ecc` repository: [security-review](https://github.com/affaan-m/ecc/blob/76aaa77df6adc5b889e689007bf99b9a4f74af34/skills/security-review/SKILL.md) and [coding-standards](https://github.com/affaan-m/ecc/blob/76aaa77df6adc5b889e689007bf99b9a4f74af34/skills/coding-standards/SKILL.md), alongside Karpathy guidelines. Reference commit `76aaa77df6adc5b889e689007bf99b9a4f74af34`. Guidance was read and applied; no ECC installer, hosted scan, hooks, external agents or new project dependency was executed.

Implementation:
- One small scalar FormData reader rejects repeated values, including identical repeats and mixed string/File duplicates, while preserving missing/blank/File values for existing domain validation. Adopted across private follow-up scheduling/resolution/reassignment, milestones/redaction, delivery/report review, financial evidence, operational outcomes, consent-copy proposals/approval/withdrawal/publication, late proof linking and disclosure reconciliation.
- Main staff case verification, case status/assignment and appeal-conversion scalar fields use the same boundary. Amounts, case/evidence identities, consent choices, decisions and revision snapshots cannot silently choose the first conflicting value. Existing authentication, permissions, independent reviewers, expected-version/CAS, transaction retry, audit, exact amounts and private/public evidence rules remain unchanged.
- Voiding remains possible without a new affirmative evidence checkbox; in-kind reports retain blank amount/evidence semantics. No generic replacement of domain validators, upload-list handling, schema or financial accounting. Missing final-publication consent and missing withdrawal reasons now reach their specific corrective messages.
- Existing post-commit tests now include the already-required /impact invalidation and prove a cache failure after commit does not replay the write. Actual source cache behavior was retained, not removed to satisfy stale tests.

Validation: **82 duplicate-field cases failed against the inherited parser sources**; final **336 focused cases in 14 suites pass** across affected parsers and real action modules with mocked persistence. Application-only TypeScript, changed-file zero-warning ESLint, diff checks and clean optimized compile-only build pass. No full suite, native database/concurrency, production data generation, authenticated browser or live privacy/financial acceptance is claimed. Previously recorded whole-repository assistance fixture typing limitations remain separate from application-only type success.

JS **814226/819200**, CSS **348052/348160**, unchanged. No UI, client framework, stylesheet, dependency, migration, financial/provider configuration, consent activation or budget change.

Master149 implementation remains **60 Implemented /61 Partial /26 Not started /2 other**, no formal closure. AF-LOCAL/AF-MILESTONES/AF-CONSENT/AF-SETTLEMENT gain scoped input-boundary evidence. New milestone and bank-evidence source belongs to open PR, not the historical merged baseline. Consent retention, approved service-zone/SLA rules, bank settlement integration and real end-to-end acceptance remain incomplete.

Next: continue the next substantive source-ready package without another broad audit. No external messages, real payment/refund, donor/beneficiary mutation, production database action, merge or deployment.

## 2026-10-17 — Private moderation access, follow-up history and consent input guards

Ownership: HANDOFF_PENDING; sole writer continued existing PR #292 from `8c87e93`. Published source `28942de523540d6e12413d50960a783ebae5edd9`; main unchanged. No release authorization or live writes.

- Recognition staff page now exposes all later pending, approved, ineligible-cleanup and donor-consent records through independent bounded pages (30/30/30/50). Count-clamped offsets, stable order, preserved companion-page positions and anchor links replace inaccessible first-page truncation. Counts and row reads use two parallel rounds; no unbounded query or extra donor/contact/receipt fields. Approved names remain removable after refunds/anonymity changes. Feature OFF returns before database reads and never falsely declares the backlog cleared. Noncanonical/malformed names are visible as private record-review entries without echoing raw values or offering mismatched snapshot actions.
- Recognition approve/reject and staff takedown reject repeated required FormData fields before transactions; approval requires canonical reviewed name equality. Existing reconciliation permission, consent timestamp/name CAS, captured/non-anonymous/unrefunded approval eligibility, pending-cleanup ineligibility, serializable updates and audit/cache semantics retained.
- Follow-up workboard now supports completed/cancelled task history and explicit active/inactive/all-case scope. Default remains the operator's open due tasks on active unconverted cases. Resolved history is ordered by resolution time (missing times last), shows IST timestamps and preserves state/scope/team filters across bounded pages. Task completion is explicitly distinguished from verified aid delivery. No mutation shortcut, SLA/urgency inference, applicant names or new case permissions.

Evidence: reproduced **12 failing page cases** and **10 failing ambiguous-input/canonical-name cases** against prior sources. Final **47 focused tests across six suites pass**, including read authorization/gating, pagination after removals, unreachable later records, privacy projections, task history and transactional staff guards. Replaced obsolete source-string truncation checks with actual page/action tests. Application-only TypeScript, changed-file zero-warning ESLint, diff checks and clean optimized compile-only build pass. Impeccable detector reported no findings. Browser/staff round trips, native PostgreSQL concurrency, full data generation and live withdrawal acceptance are NOT certified. Previously reported unrelated assistance-test typing limitations remain.

Emitted JS **814226/819200**, CSS **348052/348160**, unchanged; no new client boundary, stylesheet, dependency, migration or budget relaxation.

Master149 implementation remains **60 Implemented /61 Partial /26 Not started /2 other**, no formal closure or live promotion. AF-R091 and AF-CONSENT now record targeted test evidence for these scoped controls; AF-LOCAL gains task-history/filter evidence. Consent retention, reviewed feature activation, service-zone/urgency/SLA policy and end-to-end acceptance remain open. Current Git classifications **61 Merged /60 PR open /28 Uncommitted**, reflecting new AF-CONSENT source in PR rather than its prior merged baseline.

Next: continue the next unblocked substantive source package; no broad re-audit. No main merge, deployment, production/provider/payment/email operation, consent activation or database migration occurred.

## 2026-10-17 — W7 sponsorship review and manual calendar planning

Ownership: HANDOFF_PENDING on `fix/direct-transfer-feedback-20261013`, PR #292. Sole writer resumed `1ea37edf`; published source `0fd4c049629fa9cd3cab9c493d4f755a7dc04043`. No main merge or production release.

- Sponsorship now has a native server-rendered preference form, fixed education/support choices, optional request to keep the donor name out of public recognition, visible message review, mailto handoff and copy/contact fallback. All existing path CTAs lead into this review. Rejects unknown/repeated/personal query fields without reflecting their values. No message is sent by the website, no student identity/capacity/unit price is invented, and no placement/payment is reserved. School/college remain developing pathways; receipt identity is not confused with public anonymity.
- Giving planner now offers one-date and one-to-ten-day inclusive calendars alongside monthly/Friday schedules. Visitors confirm local religious dates themselves; no moon-sighting forecast. Pure bounded GET download rejects unexpected/duplicate/malformed parameters, uses fixed filenames and private no-store/no-referrer/noindex headers, and redirects invalid requests to inline recovery. Monthly/Friday dates use India civil date; DTSTAMP records actual UTC creation. Calendar events can be edited/deleted and repeat-import behavior is disclosed.
- Removed the reminder client boundary, useState, browser Blob/object-URL download and client calendar serializer. Native forms work without hydration. Reused existing form styles for sponsorship and removed reminder layout/error rules orphaned by the server conversion. No dependency, database migration, provider mandate or new client framework.

Evidence: **60 focused tests across five suites pass**; application-only TypeScript and changed-file zero-warning ESLint pass; diff check and clean optimized compile-only build pass. Impeccable context/detector ran without findings; new copy reviewed using No AI Slop principles. Full repository typecheck still has the previously reproduced assistance-test diagnostics; no full-suite, full data generation, database/browser/screen-reader or external calendar-import acceptance is claimed.

Clean emitted bytes versus preceding W5 build: JS **819856 →814226 (-5630)**, **4974 below819200**; CSS **347875 →348052 (+177)**, **108 below348160**. JS chunks49→48. Inherited JS excess is removed; no budget/configuration relaxation. These are emitted raw-byte figures, not transfer/CWV measurements.

Master149: **60 Implemented /61 Partial /26 Not started /2 other**, no implementation promotion or formal closure. AF-SPONSOR advances only enquiry preparation; inventory/capacity/reservation/refund accounting still depends on approved operating rules. AF-GIVING-PLANNER advances user-chosen dates and mandate separation; local-date/calendar-import acceptance remains open. Updated current sponsorship Git classification from historical Merged to PR open for the new source; aggregate **62 Merged /59 PR open /28 Uncommitted**. No new source is claimed deployed/live.

Next: extend an independently approved W8 operational flow or the next source-ready giving enhancement; preserve the fixed budgets. No payment, external message, migration, production configuration, merge or deployment occurred.

## 2026-10-17 — W5 approved archives beyond the detail cap

Ownership: HANDOFF_PENDING. Continued the authorized existing branch `fix/direct-transfer-feedback-20261013`, PR #292, from verified `d410c027172198ff156e3c045e5463f2c63dea64`; published code `4a0c65e2ef462ad6df88d9d26b93cb7a1d56569d`. Sole implementation writer. Main remains `aedae00171d2cbf585f65f93b783f66c7f003a43`.

- Added fully server-rendered `/media-archive/[kind]/[slug]` for initiative/story/faith records, 24 public records per page with one lookahead. Parent eligible count rejects impossible deep offsets before reading media; the second read repeats parent publication, cause/story privacy and religious-review gates. Ordering retains sortOrder/year/createdAt plus a deterministic ID tie-break. Reuses the minimal public projection and approved media renderer; no storage keys, source paths, review metadata or client gallery state. Previous/next links work without JavaScript; paginated archive is noindex/follow. All four detail variants link at the 48-record cap, preserving heroes and bounded initial payloads.
- Lazy gallery thumbnails use browser auto sizes with gutter-aware, 29rem-capped fallbacks; only a selected lightbox image is eager. Focus cleanup preserves the newer-dialog check while eliminating the inherited React hook lint warning.
- Replaced readonly query assertion with `satisfies Prisma.MediaAssetFindManyArgs`, repairing inherited Prisma query-array incompatibility and public detail inference without changing selected data.

Validation: **56 focused tests pass across 7 suites**, covering page-three access, public projections, private/unpublished/religious gates, invalid and huge page parameters, withdrawal between reads, static archive navigation, image policy and gallery focus. Application-only TypeScript passes; changed-file zero-warning ESLint and diff checks pass; Prisma client generation and clean optimized compile-only build pass. Full repository typecheck still reports **24 diagnostics in untouched assistance tests**, all reproduced at baseline (no new diagnostic locations). No full production generation, native PostgreSQL, real mobile/browser/screen-reader acceptance or measured network/CWV improvement is claimed. Impeccable context and initial source detector ran; no detector findings.

Fixed budget evidence from two empty-output builds: baseline d410c02 JS **819760/819200**, current JS **819856/819200** (**+96**, current excess **656**); CSS **347875/348160** unchanged. Baseline already exceeds JS cap by560. Server-only archive version was retained; no budget, chunking or support target changed. CLI push lacked credentials; connected GitHub tree/commit/ref publication used an expected-head lease and code was read back.

Master149 remains **60 Implemented /61 Partial /26 Not started /2 other**. AF-R052/AF-R054 evidence advanced without classification promotion; full archive/database/device acceptance, responsive transfer measurement and release requirements remain open. No item declared closed/live. No merge, deployment, migration, production record/provider/payment/email operation. Next: source reduction for the inherited JS excess and assistance fixture typing, then the next safe W7 giving/sponsorship package; avoid another broad audit.

## 2026-10-16 — Owner-curated gallery import integrity and recovery (source continuation)

Continued existing PR #292 on `fix/direct-transfer-feedback-20261013` without a new branch or release. Authenticated approved-package ingestion now validates the 154-record staging status before enabling publication. Its client requests are bounded, initial/stale responses cannot override a newer reconciliation, repeat upload/publication attempts lock on uncertain server outcomes, and a read-only status check is offered for recovery. Stored ZIP parsing now validates safe local/central offsets, names, encryption and directory boundaries; the 147 MB checksum no longer clones its full input in JavaScript. Existing exact package/manifest SHA-256, per-image checks, gallery-only roles, permission and staging publication gates were retained.

Server lifecycle consistency: start, upload, status and publish share strict checks for signed owner-approved editorial metadata (alt text, caption, original source reference, dimensions, year, empty external/title roles). Conflicting existing rows are rejected before public object storage writes and rechecked transactionally. Invalid privacy/publication states surface as drift. The staging-only importer UI is suppressed outside the dedicated, authorized Railway service. No production/media/payment/data writes were initiated by this engineering continuation.

Implementation commits: `d1fdfe1`, `89ba8ef`, `47c5e82`, `00e1fcb`, `680a977`, `0022fd3`, `7797c45`, `d197c5`, `3476f1c`, `81dc14f`, `14cbd7b`, `321b589`, `cd7a632`, `5bee92d`, `f808ffa`, `2a6189f`, `b1d4f5a`. Added focused ZIP/status/metadata/runtime and optional rendered-component regressions; these new tests have NOT yet been observed executing successfully. Exact-head fast CI at `5bee92d` stopped on one React hook cleanup lint warning; `f808ffa` corrected the underlying lifecycle issue, then strict indexed access source/test corrections followed. Current-head CI, tests, typecheck, lint, immutable JS/CSS budgets, full browser acceptance and staging database flows remain unverified. Source branch still not merged, deployed or published.

Canonical 149 register unchanged: **60 Implemented / 60 Partial / 27 Not started / 2 other**. Do not promote source requirements or 95-defect aliases without concrete acceptance evidence. Known JS budget prior to this batch was 818167 / 819200 emitted raw bytes; remeasure on an empty-output build. No budget adjustments or release authorization.

## 2026-10-16 — Bounded private consent, information requests and PDF preparation

Continued existing PR #292 from verified remote `5c7688d5d742b0d7e03ed0c028552b955d26a220` and matching local tree. Reproduced **12 failing component cases** against prior sources: stalled preference/status reads, old receipt state after reference change, uncertain mutation handling, duplicate rights rows, and stalled/abandoned PDF preparation. Shared bounded-private-request primitive races the complete transport/body operation against a deadline and receipt lifetime, removes timers/listeners, and works even when mocked transport ignores abort. Cancellation does not imply rollback of a server write.

Both optional donor panels now bound status reads to 8 seconds and mutations to 15 seconds. An uncertain mutation disables further changes and offers **Check status**, which sends only a read action; no mutation is automatically retried. Recognition locks synchronously against same-turn repeated clicks; selection/name controls lock while writing. Receipt-keyed state and lifetime cancellation discard old data/results. Rights status responses reject duplicate request kinds. PDF preparation has a genuine 25-second overall deadline, aborts on unmount/reference change, and cannot redeem an authorization or start a file download after abandonment/timeout. Existing POST-only credentials, server authorization/consent semantics, financial records and all feature gates remain unchanged/off.

Executed final full suite **2222 passed / 11 skipped**, 228 passing suites; **21 focused cases** cover the new lifecycle/helper plus existing PDF success/failure behavior. Extended transport and body stalls, late mutation replies after status recovery, timer cleanup and already-aborted lifetimes. Full generated-route TypeScript; changed-file zero-warning ESLint; browser-test syntax; secret-boundary scanner; generated route report; clean optimized compile-only build pass. Real Chromium153 ran the new synthetic fixture at **390px and 1440px**: both status timeouts/read retries, two uncertain writes followed only by status reads, PDF timeout/fallback, receipt switch isolation, no overflow or JS exceptions. Committed equivalent Playwright cases; the local run used the same real components via a standalone Chromium driver, not the repository Playwright runner. No real donor/provider/email/database write. Impeccable detector completed without findings; new recovery copy checked with No AI Slop principles. Acceptance fixtures were removed before final production-output measurement.

Clean aggregate JS **814858→818167 bytes (+3309)**, **1033 below 819200**; CSS unchanged **347588**, **572 below 348160**; 49 JS files. No budget, browser support, dependency or chunk configuration relaxation. These are emitted raw bytes, not CWV. Master149 remains **60 Implemented / 60 Partial / 27 Not started / 2 other**; AF-DONOR/AF-R091/AF-RECEIPTS remain Partial. Native PostgreSQL/concurrency, full production generation, authenticated staff browser/AT, renderer installation/CA wording, hosted exact-head CI and controlled rollout remain open. No merge/deploy/migration/feature activation.

Ownership: HANDOFF_PENDING on `fix/direct-transfer-feedback-20261013`, existing PR #292. Next: isolated database/full-generation acceptance or another unblocked master-plan source batch; keep feature gates off and preserve fixed budgets.

## 2026-10-16 — Server-rendered staff controls bring compiler JS below cap

Continued PR #292 from verified remote `06b62b3dcda25b4c215104a91323e018a442e2d8`. Four staff form modules (direct-transfer reconciliation, allocation proposal/reversal and donor-rights review) now render static controls/copy on the server. One small client form owns action feedback and pending state; buttons obtain pending state through React form context. Existing server action references pass through the supported Server Component boundary. Action implementations, authorization, validation, hidden IDs, named decisions, required attestation, rejection formNoValidate, feedback placement, pending label and disclosure copy are preserved.

Before/after rendered-markup comparison passed all 15 cases (five form variants × idle/pending/error), ignoring attribute order only. Two real-component JSDOM action tests prove both result discriminators, submitter decision/ID FormData, both buttons disabled during pending, pending label, error alert, manual second submission and success feedback. Full suite **2204 passed / 11 skipped**, 226 passing suites; full generated-route TypeScript; changed-file zero-warning ESLint; client-secret guard; generated route report; clean optimized compile-only build passed. Impeccable detector completed successfully with no reported findings. These checks do not certify authenticated browser/server-action round trips, native PostgreSQL or full production generation.

Clean emitted JS **823514→814858 bytes (-8656)**, now **4342 below the unchanged 819200 cap**; CSS unchanged **347588**, **572 below 348160**. JS files **50→49**. An initial build retained stale chunks and was discarded; these totals come from an empty-output build. No chunking configuration, dependency or browser-target change. Aggregate emitted bytes are not a network/CWV claim. Full production generation, native database acceptance, authenticated browser/AT and exact-head hosted CI remain open. Master149 unchanged **60 Implemented / 60 Partial / 27 Not started / 2 other**; no source item promoted. No merge/deploy/migration/feature activation.

Ownership: HANDOFF_PENDING on `fix/direct-transfer-feedback-20261013`, existing PR #292. This batch closes the measured compiler JS excess; next verify isolated database/full production generation and authenticated staff browser acceptance.

## 2026-10-16 — Private record read deadlines, reference isolation and lean imports

Continued PR #292 from `b0bf41d8faf4138909ba8ba42b78d41d71d99a4f`. Five new regressions failed against the previous sources: both acknowledgement and assistance-status reads could remain loading through stalled transport/JSON, and a newly selected donation reference could briefly display the previous donor record before its animation-frame reset. Both read effects now have an 8-second overall deadline, abort and clear their timers on completion/unmount, and ignore late results. Existing read-only retry messages and private credential capture/scrubbing remain intact; acknowledgement rendering immediately gates loaded records against the selected reference. No write/payment retry is introduced.

Separated pure INR formatting from private-link helpers, and assistance response validation from donation acknowledgement validation. All callers/tests use their direct modules; validation/paise rules are preserved. This removes unused private/financial code from unrelated client graphs without new entry requests. Clean compiler JS **825345→823514 bytes (-1831)**, still **4314 above 819200**; CSS unchanged **347588/348160**. JS file count remains 50. Route entry JS: Donate534290→533882, Assistance tracking530014→528176, acknowledgement532178→532154; Home and intake unchanged. These are uncompressed emitted bytes, not CWV or transfer measurements.

Executed final full Vitest **2187 passed / 11 skipped**, including 19 private-client lifecycle cases; generated-route TypeScript; changed-file zero-warning ESLint; secret-boundary guard; generated route report; clean optimized compile-only build. Actual Chromium153 with intercepted synthetic API records verified BOTH pages end stalled reads, expose manual read retry, recover on exactly one extra request, scrub tokens and produce no JS exceptions. Receipt rendering preserves 100.00 paise display and sensitive-case link omission. No provider, real record, payment or intake write. Native PostgreSQL, full production generation, AT/full-browser release and exact-head hosted CI remain unverified. Master149 stays **60 Implemented / 60 Partial / 27 Not started / 2 other**; no source item promoted to complete. No merge/deploy/migration/feature activation.

Ownership: HANDOFF_PENDING on `fix/direct-transfer-feedback-20261013`, existing PR #292. Next: remaining 4314-byte JS excess via real source savings, then isolated database/full production acceptance. No additional chunk requests or relaxed budgets.

## 2026-10-16 — Reusable client chunks and bounded Companion requests

PR #292 continued from `f187db07653df2581f86da97e48ad0a693d7dd0b`. Configured the installed Next.js production chunker's documented `maxMergeChunkSize: 10000` raw-byte threshold to prevent shared modules being copied into merged route chunks. Clean compiler output removes the duplicate carousel/framework module groups. No budget, browser target, dependency, security header or lazy boundary changed. The 4000-byte trial saved only 444 extra bytes at two extra route requests and was discarded.

Prayer-response regressions reproduced 8 failures against the original component: malformed metadata/moon/tomorrow data could reach rendering, and transport or JSON-body stalls never ended loading. The lazy panel now validates every rendered field and HTTPS announcement link, binds tomorrow to the next local date, and applies an 8-second overall deadline with abort/cleanup and late-response rejection. Clear local-masjid/retry guidance replaces indefinite loading. No new polling or religious content.

Executed: full Vitest **2178 passed / 11 skipped** across 224 passing suites; subsequently expanded Companion DOM suite **11/11 passed** (includes valid nullable/full payloads, malformed details, stalled transport/body, late completion, manual retry and bounded errors); full TypeScript; changed-file zero-warning ESLint; 8 bundle-report tests; generated route attribution; client-secret guard; clean optimized compile-only build. Chromium153 verified 390px About/Contact/Assistance with one H1/no overflow, mobile menu hydration and closure after client navigation, lazy Companion malformed-response rejection and successful retry, plus 1280px Contact. Zero JS exceptions/failed static chunks. APIs were intercepted; no payment, intake write or provider request. A local Donate render could not be accepted without the isolated PostgreSQL configuration; no payment acceptance claimed. Impeccable detector returned zero findings on changed panel; copy checked for slop.

Final JS **847439→825345 bytes (-22094)**; CSS **347588 unchanged**. JS remains **6145 bytes above 819200**; CSS is below 348160. 50 JS files vs 43; compiler route entries add 3–4 script requests (Home12→15, Donate/Assistance13→17), roughly 408–588 bytes; this is a cache-reuse/aggregate-output improvement, NOT proven first-load/CWV improvement. Complete generation, native DB, full browser/AT and hosted exact-head CI remain open. Master149 source totals unchanged **60 Implemented / 60 Partial / 27 Not started / 2 other**. No merge, deploy, migration or flag activation.

Ownership: HANDOFF_PENDING at completed batch on existing branch `fix/direct-transfer-feedback-20261013`. Next: remaining 6145-byte JS excess via genuine source savings; then isolated native DB/full browser release acceptance. Do not substitute aggregate savings for first-load performance.

## 2026-10-16 — Shared checkout emission and retained fund review

Continued PR #292 on `fix/direct-transfer-feedback-20261013` from verified remote `54fdb84692d0c4557a28acdaefd6539a5f536cef`. Both donation server entries now use one client export boundary; actual clean Turbopack output no longer duplicates the online/direct-transfer form modules across those entries. No form is eagerly substituted for its existing lazy import.

Executing previously skipped DOM tests reproduced two existing fund-refresh failures: changed definitions unmounted the original-purpose form, including an uncertain order. The form now remains mounted with the original reviewed snapshot and entered details; controls and the submit handler block new orders until explicit re-review. Re-review resets consent and fields even when policy changes without a revision increment. In-flight original-purpose responses retain their connected form and existing reconciliation locks. Withdrawn funds cannot start another order. Corrected the preset test's stale positional assumption by selecting the actual ₹1,000 button.

Validation: 90 tests across 10 suites (including 8 real-component JSDOM interaction cases), full generated-route TypeScript, changed-file zero-warning ESLint, governed Stylelint, 5 public-boundary Node tests, secret-boundary guard and clean optimized compile-only build passed. Baseline JS **884,313 → 847,439 bytes (-36,874)**; CSS **347,588 → 347,588**. Unchanged JS cap 819,200 still fails by **28,239**; CSS cap 348,160 passes. Intermediate boundary-only saving was 37,128 bytes; final correctness changes add 254 bytes. Compiler entry JS /donate 533,813→533,702; /donate/[slug] 524,109→533,702 (+9,593 tradeoff). These are emitted uncompressed bytes, not network/CWV measurements. Native full generation, provider/browser/AT acceptance and hosted exact-head CI remain uncertified. No merge, deploy, migration or feature activation. Master149 unchanged: 60 Implemented / 60 Partial / 27 Not started / 2 other; AF-R047 and AF-FUNDS remain Partial.

Ownership: HANDOFF_PENDING after committed batch. Next: remove remaining 28,239-byte JS excess using actual emissions, then exact-head full build/browser release gates. Existing PR #292; no new branch.

## 2026-10-16 — Exact-color CSS/Stylelint remediation (handoff)

Ownership: HANDOFF_PENDING after completed source batch on PR #292 / `fix/direct-transfer-feedback-20261013`. Started from verified `437f1e6a`, ownership commit `0c8f782e`; implemented code commit `d0ec5a4d3f2a19d289e389a05c0a4b70fdd5d547`. Actual Actions fast-job 116626056235, run 38794066399, reported 14 `color-no-hex` violations across four CSS modules after prior ESLint corrections. Replaced 2 landing checkout, 9 loading-skeleton, 2 mobile header and 1 impact-print prohibited colors with exact-value canonical tokens, adding four dedicated canonical palette roles (skeleton base/highlight/deep and print outline) to globals. All CSS other declarations, selectors, geometry, font, shadows, timing, content and business behavior preserved.

Verification: guarded source transformation counted all 14, independently read remote code at committed head confirming zero hex matches across four affected modules; every target token resolves to the exact old RGB, including #fff shorthand. GitHub Actions run 38797143461 was in progress when last checked. Full exact-head TypeScript, Vitest, CI Stylelint pass, screenshot/device evaluation, compiled JS/CSS byte budgets and production were **not yet certified**; no inflated release claim. Master149 source totals unchanged 60 Implemented / 60 Partial / 27 Not started / 1 Superseded / 1 Not applicable. AF-R061/R066 remain Partial. Next priority: inspect existing in-flight CI once, then implement measured JS-delivery reduction only with actual compiler evidence (historic JS 882837 / 819200 and CSS 347365 / 348160 at older head). No merge, deployment, migration, payment, mail, secrets or live data operations.

## 2026-10-16 — Grouped exact-head lint source remediation

Ownership: HANDOFF_PENDING after implementing on PR #292 / `fix/direct-transfer-feedback-20261013`, from `4f315eea` to `ac5daac5b2662f0d5bc65d797bf718b4674fcab4`. Diagnosed real Actions fast-job 116569853018 (run 38777759702), which failed on seven ESLint errors and two warnings. Fixed three local contact links using the existing Next navigation wrapper, four unsafe JSX literal apostrophes, and two gallery focus cleanup ref warnings. Gallery opener-by-ID restoration, donor/assistance method locks, and copy/intent are preserved. Readback independently verified all seven edited source modules and nine targeted source assertions. Real ESLint, TypeScript, Vitest, browser and JS/CSS metrics have NOT been rerun at patched HEAD by this agent. The new head triggered CI run 38793797760 (pending when inspected); do not claim it passed. Master149 source states remain 60 Implemented / 60 Partial / 27 Not started / 1 Superseded / 1 Not applicable; no production, payment, data, secrets, feature, merge or deployment operation. Next: exact-head CI outcome and real emission-driven JS duplication, without budget or browser-support reductions.

## 2026-10-15 — Donation method selection and transfer state isolation

Ownership: HANDOFF_PENDING after bounded source batch on existing PR #292 `fix/direct-transfer-feedback-20261013` from `8878ea6d`. Implemented `08db012c` and corrected test syntax `11ae905c`. The active UPI vs bank transfer form now uses a payment-method React identity; switching before submitting remounts the direct-transfer form rather than reusing its previous UTR, date, evidence and validation state. Existing in-flight submission locks still prevent switching during processing. A configured-unavailable bank method is non-selectable and described visibly; Razorpay and direct UPI remain selectable. These changes preserve pending-verification wording, donation intent and amount constraints.

Two focused streamed server-render assertions were added to the existing shared checkout test suite: unavailable bank is disabled and described while UPI remains active; configured bank is selectable without false warning. Test-source escaping was repaired and the final remote source read back. Local repository hydration, Vitest, TypeScript, ESLint, optimized build, browser/mobile/keyboard and Railway acceptance were NOT executed in this environment; source and assertions are committed but not release-verified. No count movement: canonical 149 remain 60 Implemented / 60 Partial / 27 Not started / 1 Superseded / 1 Not applicable. JS remains above its unchanged budget per older measurements. No production money, data, provider, migration, secrets, flags, deployment or merge. Next: exact-head focused checkout tests and source-measured JS duplication when an executable checkout is available.

## 2026-10-15 — Cached appeal CI source-contract repair

Ownership: HANDOFF_PENDING following the verified PR #292 source contract repair from `2356377a` to `8c947644e62e4a12d819c536929fca1eb6058365` on `fix/direct-transfer-feedback-20261013`. Existing CI run 38774914375 failed `scripts/test-public-data-boundaries.mjs` because its source assertion still required the obsolete `getHomepageAppealsCached(limit)` call. Updated the guard for the implemented shared cached candidate projection and additionally asserted that time-sensitive eligibility runs before the display limit. Independently fetched exact-head test/source text and evaluated that order and the new call contract; both assertions hold. This is not proof of full Node test execution, TypeScript, build, browser or live production acceptance. Source implementation remains untouched. Master 149 status unchanged at 60 Implemented / 60 Partial / 27 Not started / 1 Superseded / 1 Not applicable. No financial, database, deployment, secret or feature-flag operations.

## 2026-10-15 — Anonymous admin inventory drift (source complete)

Ownership: HANDOFF_PENDING on existing PR #292 / `fix/direct-transfer-feedback-20261013`, resumed from explicit handoff `84d17c2`. Real Actions run 38773986971 failed its fast-lane admin-inventory guard because new protected routes were absent from the anonymous browser contract. Implemented `f08849b9`: added /admin/allocations, /admin/donations/recognition, /admin/donations/rights to `e2e/admin-anonymous-boundaries.spec.mjs`, retaining the same pre-content redirect-to-login assertions and route protection. GitHub recursive tree vs browser-contract source reconciliation confirms all 16 protected page routes have entries (0 omissions). Inspected protected layout: it invokes requireAuthenticatedUser; each added page also invokes requirePermission. This is static/source verification only; Playwright, TypeScript, Vitest, optimized build and hosted redirect acceptance were not executed. CI for this new head is not claimed green. The historical 149 master counts remain 60 Implemented / 60 Partial / 27 Not started / 1 Superseded / 1 Not applicable. No production/database/payment/migration/flag/secret/deploy/merge operation.

Next: exact-head checks of the three additional anonymous redirects in a runnable checkout/CI, and actual JavaScript duplication investigation from emitted chunks. Avoid raising caps or inventing bundle savings.

## 2026-10-15 — Explicit-site JSON-LD private-media and canonical-origin guards

Ownership: HANDOFF_PENDING on existing PR #292 after completed source-only batch, branch `fix/direct-transfer-feedback-20261013`. Started at `430d3705`; implementation commits `515927f1` (private paths on explicitly passed preview/canonical hostname) and `9676aa12` (single validated HTTPS origin across Organization, Breadcrumb, Appeal and Article/WebPage schemas). The explicit site-origin policy now rechecks same-origin URL paths as application-private even if NEXT_PUBLIC_APP_URL points elsewhere. It omits admin/API/private receipt/assistance links from JSON-LD image fields while preserving public media and configured HTTPS CDN. Three previously ad hoc root/schema builders now use the same canonical origin; malformed userinfo, non-HTTPS or query-bearing configured URLs cannot pollute schema identities or DonateAction targets. Focused source tests cover eight private-route variants, safe absolute/relative/CDN paths, five configured-origin classes, script escaping and consent-safe fallback.

Validation: GitHub create-tree/commit/ref lease plus readback only. Exact-head Vitest, TypeScript, ESLint, optimized build, asset budgets, real browser/search crawler and deployed privacy behavior remain unexecuted locally because a full checkout and GitHub DNS access are unavailable. GitHub CI was in progress when last checked; no green outcome claimed. 149 master statuses unchanged: 60 Implemented / 60 Partial / 27 Not started / 1 Superseded / 1 Not applicable. No main merge, production database, provider payment, email, secrets, migration, feature activation or deployment. Next: exact-head tests, then evidence-led client JS asset optimization or the next actionable ledger defect.

## 2026-10-15 — Cached appeal rollover and resource-conscious live-rail freshness

Ownership: HANDOFF_PENDING after source batch on existing PR #292 `fix/direct-transfer-feedback-20261013` from `c3279ffc` to `21e75ac6e87b44cb86ae4b710e0711a0d4fec546`. Source changes:
- `src/components/islamic-companion.tsx`: previously mounted a single live-appeal read for the lifetime of a tab. Visible tabs with active appeals now revalidate no more than every five minutes, clearing stale donation links before network revalidation and ignoring aborted, timed-out and late responses. Hidden tabs do not poll. Confirmed empty and unavailable rails do not make recurring requests; a tab returning to visibility after the freshness interval can recheck.
- `src/lib/public-content.ts`: cached eligible appeal candidate projection retains 20 bounded candidates and performs the current deadline check **before** applying the caller's visible limit, so a recently expired high-ranked campaign does not consume a homepage/live-rail slot. Cache TTL remains 300 seconds, with the existing privacy/status gates and no additional database read.
- `src/app/api/public/live-rail/route.ts`: explicitly requests four candidates, matching its four-item response contract rather than inheriting the homepage's three-item default.
- Focused Vitest source coverage added/updated across companion effect lifecycle, cached promotional appeal projections and API response. It checks visibility/five-minute cooldown, no empty-rail polling, withdrawal, late timeout completion, time-advance cached rollover, sensitive exclusions and the four-item contract.

Execution: GitHub connector source edits and exact-head branch lease verified. Repository checkout and dependency installation unavailable (GitHub DNS blocked in current container), so TypeScript, focused Vitest, lint, optimized build, asset budgets, real browser and provider/production acceptance **have not been executed in this environment**. Keep historic JS882837/819200 and CSS347365/348160 readings explicitly scoped to predecessor `a263dbee`; new head not measured. All 149 implementation states remain 60 Implemented / 60 Partial / 27 Not started / 1 Superseded / 1 Not applicable. No payment, migration, live database, mail, secrets, deployment, merge or feature activation was performed.

Next: exact-head TypeScript and targeted lifecycle/expiry tests, then source-driven JS duplication investigation from clean emitted assets. Browser visibility and stale-link experience need actual hosted/Chromium acceptance before release.

## 2026-10-15 — Public galleries and structured-data destination safety (source batch complete)

Ownership: HANDOFF_PENDING following source-only PR #292 batch on `fix/direct-transfer-feedback-20261013`, originally claimed from `f2af1b9`; latest implemented code commit `15f77bb7569f871477c2bb857e24b170fd79135a`. Standard PublicMedia already enforced approved image origins, but the gallery client and crawlable Article/WebPage JSON-LD were weaker. Gallery now rejects non-CSP-approved hosts and aliases to private routes. Approved external CDN origins are derived **on the server** and serialized into all three gallery route owners; browser code never depends on the non-public `PUBLIC_MEDIA_BASE_URL` environment variable. Client lightbox/thumbnail rules remain common and no external image is proxied into Next's optimizer.

JSON-LD image links now omit private or unconfigured-host URLs (including recursively encoded/private www/trailing-dot aliases); public Article/Breadcrumb schema paths reject private app/transactional destinations. Strict URL/HTTPS origin normalization, approved media CDN controls and a normal public `/donate` landing remain. Source changes span nine gallery/source/route/test files plus structured-data helper/tests. Targeted existing tests were adjusted for explicit CDN whitelisting; new negative cases cover malformed, unknown, aliased and encoded private paths, SSR gallery omission, and CDN retention. No design or approved media asset was altered.

Verification: GitHub branch lease commits and source-readback only; focused Vitest, TypeScript, lint, bundle-size and rendered browser acceptance **not executed** because no current repository checkout or dependency installation is available and the container cannot resolve GitHub. Historical measurements still apply only to older head. All 149 canonical source statuses unchanged: 60 Implemented / 60 Partial / 27 Not started / 1 Superseded / 1 Not applicable. AF-R052/R054 and AF-R080 acceptance not promoted. No production database, payment, email, migration, secret, flag, deployment or merge actions. Next: exact-head focused tests/client SSR-host allowances, then evidence-led emitted JS duplication cleanup without loosening caps.

## 2026-10-15 — Public-media canonical host privacy guard (in progress)

Ownership: HANDOFF_PENDING after source-only privacy batch on PR #292, branch `fix/direct-transfer-feedback-20261013`, claimed from exact head `a263dbeeecd65d847be6ce6b23f40568f930d1ca`. Scope: same-site domain aliases in public-media privacy checks plus focused regressions. Preserve external media-CDN allowance and all publication gates. GitHub-connector execution; no checkout or native test runner available in current environment. No production operation authorized. Source guard and focused regression authored; local repo checkout, Vitest, TypeScript, build, browser and deploy acceptance unavailable/not executed. No status promotion.

## 2026-10-15 — Live updates and shared checkout imports

Ownership: HANDOFF_PENDING after source batch; sole writer on PR #292 from `a48d0f1a`. Implemented runtime-checked rail content/links, truthful loading/empty/unavailable states, 8-second request deadline and cleanup; API503 on failure and no unused summary. Flattened duplicate method-selector boundary, retaining lazy payment forms. 49 focused tests/8 suites, TypeScript, lint, whitespace and clean compile pass. Isolated import saving 922 bytes; complete source JS 882837/819200 (+218 vs parent), CSS 347365/348160. No budget relaxation or browser/CWV acceptance claimed. Master149 unchanged 60 Implemented / 60 Partial / 27 Not started / 2 other. No production operations.

## 2026-10-15 — Assistance queue triage

Ownership: HANDOFF_PENDING after assistance batch; sole writer on PR #292 from `cbba0d7c`. Added mine/unassigned filters, stable oldest-first triage, preserved pagination filters, honest request ages and minimum staff/history projections. Committed verification/review/assignment survives cache refresh failure via fresh-detail redirect; appeal conversion refreshes the queue. 41 targeted tests, full TypeScript, changed-code ESLint, whitespace and clean compile pass. JS remains blocked 882619/819200; CSS passes 347365/348160. AF-LOCAL stays Partial; zones, urgency and median/p90 metrics pending approved policy/evidence. Master149 unchanged: 60 Implemented / 60 Partial / 27 Not started / 2 other. Native DB/browser acceptance remains open. No release or production operations.

## 2026-10-15 — Navigation fallback and component test discovery

Ownership: HANDOFF_PENDING after navigation/test discovery batch; sole writer on PR #292 from verified `9605af89`. Fixed header/footer/admin missing-pathname handling and deferred motion/scroll until routing is ready. Enabled 19 previously excluded TSX suites; corrected stale fixtures without weakening source privacy gates. Full suite 2084 passed / 19 skipped; TypeScript, changed-code ESLint, clean compile and whitespace pass. JS remains blocked 882619/819200; CSS passes 347365/348160. No experimental config retained. Master149 unchanged: 60 Implemented / 60 Partial / 27 Not started / 2 other. Next: remaining actual JS duplication and rendered browser acceptance; no release operations.

## 2026-10-15 — Retired page-shell CSS cleanup

Ownership: HANDOFF_PENDING after retired-shell CSS batch; sole writer on PR #292 from `afc25cf4`. Aggregate CSS restored to 347365/348160 bytes (-36877); JS remains blocked at 882569/819200. Root global source 124633 bytes still exceeds 60KB goal; AF-R067 source Partial. 24 focused tests, TypeScript, lint, CSS architecture audit and clean compile pass; 238 retired selector branches removed with surviving declarations/order unchanged. Master149: 60 Implemented / 60 Partial / 27 Not started / 2 other. Next: remaining JS excess and bounded browser acceptance. No release or budget changes.

## 2026-10-15 — Bundle deduplication execution

Ownership: HANDOFF_PENDING at completed source boundary; sole writer on PR #292 from `ef9a09e1`. Completed shared async checkout imports: 16,017 aggregate JS bytes removed, CSS unchanged. 69 focused tests, TypeScript, zero-warning lint and clean compile-only build pass. Remaining caps fail: 882569/819200 JS, 384242/348160 CSS. Next: remaining delivery excess and browser slow-chunk/payment acceptance. No release, visual redesign or budget relaxation. Master149 remains 60 Implemented / 59 Partial / 28 Not started / 2 other.

## 2026-10-15 — IndexNow source execution ownership

Ownership: HANDOFF_PENDING at completed source boundary; sole writer on PR #292 from `a656c032228cdcc8ddc6df100f5453615d635381`. Completed: AF-BING disabled-by-default ownership and staff search-discovery workflow; 103 focused tests/type/lint/clean compile pass. No live provider call or indexing activation. Asset budgets fail on baseline (896790 JS / 384242 CSS) and this batch (898586 JS / 384242 CSS); unchanged caps 819200/348160. Next implementation batch: remove actual JS/CSS delivery duplication without widening caps or browser-support targets. Master149: 60 Implemented / 59 Partial / 28 Not started / 2 other.

## 2026-10-15 — Current execution ownership

Ownership: HANDOFF_PENDING at completed source boundary after explicit continuation directive. Sole writer on existing PR #292, branch `fix/direct-transfer-feedback-20261013`, recovered clean head `d73947387563df1ca565942a6bdc653610a99c8f`. Completed batch: actionable finance/privacy review queues, post-commit cache reliability, generated type integration and public edition projection. 158 focused tests, full TypeScript, changed-file ESLint, optimized compile-only build and whitespace checks passed; 16 new cases fail original source. Next: native isolated PostgreSQL pagination/concurrency acceptance, or the next unblocked P1 implementation batch from the master ledger. No release, feature activation, production migration or financial transaction authorized in this batch.

### 2026-10-15 — Grouped B04/W7 source batch: legibility, trust evidence and truthful giving links

**Source work on PR #292:** `a56c33df` (Stories, Governance and Policy typography/contrast);
`df34a0af` (canonical heading, card tokens and focused WCAG ratio regressions);
`6daac981` (publication-approved impact evidence reused in Our Work with no extra query);
`69c7720c` (Homepage, Our Work, Appeals conversion CTA truthfulness when no active appeal exists);
`12b2ac4c` (two HomeTrust donor-navigation SSR regressions).

This is deliberate grouped source development targeting **AF-R019**, **AF-R025**, **AF-R061**, **AF-R087** and **AF-R083**. Existing CSS declarations were edited directly rather than appending a fourth cascade override. Contrast tokens `--af-color-label`, `--af-color-muted` and `--af-color-gold-ink` each exceed 4.5:1 on the canonical canvas/surface in focused arithmetic checks; the CSS tests are **authored, not executed in the repository**. Four high-value public pages now display eligible initiative evidence without an extra database read on the Homepage or Our Work.

**Canonical totals intentionally unchanged:** 149 items = 60 source Implemented, 49 Partial, 38 Not started, 1 Superseded, 1 Not applicable. 69 Defects = 54 Implemented, 13 Partial, 2 Not started. 51 Enhancements = 4 Implemented, 28 Partial, 19 Not started. These fixes advance existing Partial entries but do **not** establish requirement-level live/browser proof, so no source or production closure count is inflated.

**Next relevant work:** Continue existing contrast/font-size/hero surface corrections within B04; do exact representative browser zoom/AT cases before promoting AF-R019 or AF-R025 to fully verified. Preserve source-only branches; no production payment, secret, schema, deploy or merge changes were made in this batch.

## 2026-10-15 — Grouped public integrity and programme enhancement (source-only)

**PR #292** stays open and unmerged. Latest reviewed source before this note: `444b587125072427f60c06f158d3b8e020ab116e`.

One shared B08/B04 implementation batch addressed:
- Inconsistent rounded appeal-card prices vs checkout amount: `public-appeal-progress.ts` now requires valid exact-paise values and both donor selection and appeal cards reuse the same numeric projection; invalid balances are not eligible checkouts or displayed as persuasive progress.
- Duplicate accessible progress widget logic: `PublicFundingMeter` provides the same ARIA percentage and exact amount text to public cards and checkout choices while keeping their existing CSS geometry.
- Reviewed fund purpose drift: changes to name, restriction, intention list, revision or purpose suppress the stale checkout until current approved donor disclosure is reviewed; rejecting old fund orders remains server enforced.
- Published impact strip: only valid distinct public initiative slugs, populated metrics, no cross-page heading ID collisions. The homepage now derives up to three published outcomes from existing discovery records without extra queries; Donate and Appeals retain publication-gated evidence.
- Recurring campaign history: `PublishedEditionIndex` shows a bounded chronologically sorted, per-year approved edition index from the existing published-child projection, with no fabricated donation goals.
- New and extended Vitest unit/SSR cases cover monetary precision, invalid balances, UI purpose changes, ARIA progress, impact link trust and year-by-year records. These were **authored, not run on the hydrated branch** in this session. Full browser accessibility, Visual/CWV, TypeScript, bundle budgets, deployment and financial sandbox remain unverified.

**Canonical 149-source-item status:** 60 Implemented, 49 Partial, 38 Not started, 1 Superseded, 1 Not applicable. **Enhancements:** 4 Implemented, 28 Partial, 19 Not started. The only status movement was **AF-R063 Not started → Partial**, reflecting limited consolidation; AF-R083 remains source implemented and AF-R087/R092 remain partial. Original 95 defect aliases unchanged; no production closures claimed. No merge, live DB/payment/refund, secrets or deployment.

## 2026-10-15 donor UX source milestone (PR #292)

Source commits since prior checkpoint: `d519ae6c` removed unsafe Next loading.tsx route boundaries after reconciling documented streaming/307/308 regression history; `cad9b434` fixed donor route deep links to select only approved appeal/fund checkout, without a second form; `bc2a2f5b` added reviewed verification FAQ with visible/Q&A-identical FAQPage JSON-LD. AF-R083 and AF-FAQ are now source Implemented, while AF-R071 remains Partial (unactivated scaffold). No full CI, sandbox payment, rendered/browser/AT or live validation is claimed. No production money/deploy/migration/merge. Canonical register: 60 Implemented / 48 Partial / 39 Not started / 1 Superseded / 1 Not applicable, of which enhancements: 4 Implemented / 27 Partial / 20 Not started. Original 95 defects remain separately mapped; do not equate the master count with a production fix count.

## 2026-10-15 — CI-driven corrective batch + B09 manual transfer custody (source-only)

**Current PR #292 source checkpoint:** `f4308cc1dccdcd500172db059baa0fe9be80feb0` on `fix/direct-transfer-feedback-20261013`. Existing PR remains open/unmerged. This checkpoint is not proof of deployment or a green run at current HEAD.

1. A real Actions fast-lane failure on earlier `942ab218` (workflow 38626419463) identified a protected giving-fund preview route absent from the anonymous admin browser inventory. Added `/admin/giving-funds/not-a-real-id/preview` to the protected-path test in commit `9cb90060e56789fc79373420b103eb5b84e1d713`.
2. Follow-up Actions 38632465690 progressed beyond route inventory and reported three actual TypeScript errors: nullable MIME header first element in the PDF button, typed `HTMLAnchorElement.click` test mock, and child-process `NODE_ENV` requirement. Fixed together in `835257ae79689d10c3bab04a50f11f1d73416452`; re-validation of current HEAD is not yet established.
3. **Manual bank-transfer custody:** prior direct UPI/bank reconciliation accepted staff notes alone for a CAPTURED mutation. Source now requires an explicit **staff attestation** and typed bank-statement transaction reference equal to the claimed transfer, with a matching exact, safe INR-paise amount. The checks run inside the existing serializable transaction **before** changing captured status, raising appeal totals, queuing acknowledgement or recording a verification event. Successful reconciliation additionally records `bankStatementMatched`, normalized entry reference and matched amount in the audit event. Admin input fields have required client validation (Chromium `v`-mode-safe patterns), with a server-validated rejection workflow that does not falsely attest to a credit. Focused Vitest cases were authored for missing attestation, mismatch, invalid precision, scientific notation, positive exact amounts, normalized case, audit evidence and safe rejection. Source commits `6df46939df31913650fc54d2b2506520d196385b`, `a80900c134eca9a91cb061d7b10e4a1464b3f301`, `f4308cc1dccdcd500172db059baa0fe9be80feb0`.

**Scope caveat:** this is *staff-entered review*, not an authenticated bank API, automatically imported statement, independent bank evidence, second reviewer or automated matching. A dishonest reviewer can still falsely attest. Genuine bank entries that differ from the donor's reference require separate exception review and must never be silently captured. Bank-export format, full deduplication, PII-retention controls and separation of duties remain AF-SETTLEMENT scope.

**Evidence/operation:** GitHub Actions identified two concrete earlier failures with source fixes committed. Current-head TypeScript, Vitest, lint, build, browser, native DB and Railway runtime are **not claimed green**. No production transfer, Razorpay call, refund, email, migration, secret/flag, deployment or main merge was performed. PDF/UA remains disabled in the actual Railway runtime.

**149 canonical register unchanged:** 57 Implemented, 48 Partial, 42 Not started, 1 Superseded, 1 Not applicable. Original 95 aliases remain mapped; AF-SETTLEMENT/AF-RECEIPTS B09 stay Partial.

Next: inspect exact-head CI and fix real failures; pursue a reviewed read-only statement import/duplicate exception matcher only after approved bank-export format and evidence rules are known. Complete Railway Unicode PDF runtime verification and donor-owned token reissue separately.
## 2026-10-15 — B09 source-complete encrypted PDF journey, release still blocked

Current PR #292 HEAD at this checkpoint: `dce4ced655d889169455f6f0f93e4a45e810f64d`, on `fix/direct-transfer-feedback-20261013` (open/unmerged). The earlier code batches remain scoped to B09; no original 95-defect closure is inferred.

**Implemented source this continuation:**
- Actual native PDF/UA rendering through an optional offline, version-pinned WeasyPrint executable; Amaana-branded A4 typography with escaped donor text, Unicode Arabic/Telugu fallback, original designated purpose, exact INR paise and the explicit normal-acknowledgement/not-Form-10BE disclosure.
- `POST /api/donations/receipt-download/redeem`, performing exact flag/key/absolute renderer readiness check, origin/bounded-body/timeout/rate-limit enforcement, encrypted five-minute grant redemption, **fresh original-purpose/accounting/privacy validation**, bounded PDF rendering and a private attachment-only response. No grant or token in GET/URL. Revoked, expired or financially inconsistent claims cannot download.
- A lazy, separately guarded donor download control on the existing token-private acknowledgement page; hidden when disabled. It uses POST-only requests, validates the response content type and maximum size, creates a temporary Blob URL for the attachment, revokes it and provides retry-only download guidance without implying another payment.
- Consolidated feature-readiness policy shared by issuance, redemption and page visibility; a missing renderer cannot issue a dangling grant. Additional integration tests cover policy, actual mocked-API response, optional browser DOM download, default-hidden UI, HTML escaping/Unicode/accounting and an opt-in real PDF renderer.
- Privacy correction: temporary PDF/HTML cleanup failures **reject** the transaction, rather than silently leaving donor data in the scratch directory.
- **Original-purpose restriction:** public token-private historical acknowledgements retain their existing `legacy` or `review` presentation, but native downloadable PDF grants now require provenance `original` on both issue and redemption. Incomplete/mismatched designation history is not silently represented as an approved donor-purpose PDF. Historical donors can still use the existing private print acknowledgement while staff reconcile records.

**Executed local proof:** using synthetic donor names with Arabic and Telugu and hostile escaped HTML text, the TypeScript-backed WeasyPrint 68 engine returned a 25,847-byte tagged PDF/UA-1 output; one A4 page, extraction of both scripts, exact ₹100.30/₹0.10, and the disclaimer. PNG preview inspected for a balanced brand-aligned receipt layout. This demonstrates the *isolated local rendering engine*, not the full GitHub branch, deployed Alpine compatibility, conformance certification, production/browser acceptance or accessibility testing.

**Still open and deployment-blocking:** `npm test`, full `tsc`, changed-file/full lint, client bundle budgets, Playwright/AT, native PostgreSQL, genuine sandboxed Alpine WeasyPrint/Pango/Noto runtime provisioning and Railway memory/image-cost assessment were NOT run at this HEAD. The Railway Dockerfile stays Node-only; no fonts, binaries, secret keys or feature flags were provisioned. The PDF action remains disabled in production. Secure **donor-owned token reissuance and revocation** is still a separate unimplemented governance workflow; grant is replayable within five minutes. Do not enable or publish until verification and owner approval.

The canonical 149 register remains **57 Implemented / 48 Partial / 42 Not started / 1 Superseded / 1 Not applicable**; all original 95 aliases remain intact. AF-RECEIPTS/B09 remains Partial. No main merge, deploy, migration, provider transaction, refund, real donor query, email or live record mutation occurred.

**Next highest-value action:** execute exact-head source testing in a hydrated repository, perform a cost-aware, pinned Alpine runtime integration rehearsal without touching production, then address donor-owned reissuance and the adjacent AF-SETTLEMENT/B09 accounting work. Never substitute a successful local PDF demo for production safety approval.

## 2026-10-15 — B09 native PDF/UA source milestone (deployed feature still disabled)

Existing PR [#292](https://github.com/immazhark/amaana-platform/pull/292), branch `fix/direct-transfer-feedback-20261013`. Published Unicode renderer/doc commit `cb8c49355481dd46cee9add74f0c7dc297eff0c8`, private POST redemption `1355e9791405fc8153a8dc2bec2094c5a78304db`, test correction `560ef2facfdd2b37d66f1c8b47be0c24444b7d12`, and multilingual/renderer tests `fd64d64b84bb6114971e18ad46c7fdba94ad64b5`.

Implemented source: a self-contained, HTML-escaped, Amaana-branded A4 receipt template; exact two-decimal INR formatting, original approved appeal/fund designation, Arabic/Telugu-capable fallback fonts, and explicit ordinary-acknowledgement/not-Form-10BE wording. The optional server-only WeasyPrint renderer invokes a configured absolute executable through a shell-free child process with 15-second deadline, two-process cap per Node instance, private random temporary directory, restrictive HTML file permissions, no network-protocol support, PDF/UA-1 output, max 2MiB and guaranteed temp cleanup. The separately gated POST redemption route refuses missing flags/key/renderer, foreign origins, malformed/oversized/slow JSON, failed attempt limits and invalid/revoked/expired grants; it revalidates donation data before rendering and streams a non-cacheable attachment. No GET, token-bearing URL or public indexable file. The PDF-response boundary now uses an owned ArrayBuffer to satisfy strict fetch body typing.

**Executed local integration evidence (synthetic records, *not* the repository test suite):** generated a 25,847-byte PDF with locally installed WeasyPrint 68.0; `pdfinfo` reported **Tagged: yes**, **Pages: 1**, PDF 1.7; `pdftotext` extracted Arabic and Telugu names, ₹100.30 and ₹0.10 exactly, and the statutory disclaimer. Escaped `<script>` donor text was rendered as literal characters rather than executed. PDF rendered to a PNG and visually inspected for single-page hierarchy, legibility, consistent spacing and disclaimer. The actual TS renderer was executed locally with an external WeasyPrint binary. Vitest and optional actual-binary test cases were **authored but not run by this session's hydrated repository**; no exact-head Next TypeScript, ESLint, CSS/JS budget, browser/AT, Pango-on-Alpine or native-DB result is claimed.

**Runtime gate:** current Railway Dockerfile runner is `node:22-alpine` without Python/WeasyPrint/Unicode font packages. Leave `AMAANA_RECEIPT_PDF_ENABLED=false`, `RECEIPT_DOWNLOAD_ENCRYPTION_KEY` empty and `AMAANA_RECEIPT_PDF_RENDERER_BIN` empty. Do not modify Railway image, enable download UI or production keys before a cost-aware, version-pinned Unicode font/rendering provisioning and sandboxed staged acceptance. The actual PDF/UA function is source implemented; the deployed feature is **not**. Historical 149 master entries remain 57 Implemented / 48 Partial / 42 Not started / 1 Superseded / 1 Not applicable, with all original 95 defect aliases preserved. AF-RECEIPTS/B09 stays Partial. No provider calls, production DB writes, payment/refund/email, migration, live deployment or main merge.

Next: execute exact-head focused test/type/lint and complete staged runtime package sizing and output verification, then wire the donor-facing download control behind the server gate and review accessibility and expiry UX. Independently verified donor-token reissuance still requires an audited ownership and revocation design; the five-minute grant is not one-use.

### 2026-10-15 additional hardening — exact-head `17cb249a1f4766510b38415d9dce2ddac9cff7ec`

A final grouped safety correction ensures the disabled PDF grant-authorize route bounds *actual streamed body bytes* and also aborts stalled requests after a five-second budget. Malformed JSON returns private 404, body oversize 413, slow body 408, and no limiter/private-record lookup occurs before successful body validation. Added focused negative cases in the actual route test. Existing five-minute grant decryption now returns a private null result when the independent key is missing or malformed; issuance still refuses to mint. The planned private PDF response additionally requires a verified settled acknowledgement object rather than accepting a caller-provided reference alone. Header-prefix inspection handles PDF LF/CRLF and output bytes are copied before response.

Source and test additions published on the same PR; no full exact-head `npm test`, TypeScript, production Next build, or rendered-browser verification has been executed in this session. No production feature, endpoint redemption, PDF generator, environment, payments, email or database mutation was activated. B09 remains Partial; master register counts unchanged.

## 2026-10-15 — B09 dormant private PDF authorization and output-contract batch

**Source head:** `491ed6eb9139a54e9d146dc9b20bccb2181643ed` on existing [PR #292](https://github.com/immazhark/amaana-platform/pull/292), `fix/direct-transfer-feedback-20261013`. No PR merge or release.

Implemented in a grouped code batch:
- `src/app/api/donations/receipt-download/authorize/route.ts`: separately scoped, exact-flag (`AMAANA_RECEIPT_PDF_ENABLED=true`) and server encryption-key gated **POST-only** preflight for five-minute encrypted download grants. Feature flag is **false by default** in `.env.example` and key remains unset. Disabled requests return 404 without accessing the request body, private records or rate-limit database. Enabled requests must pass same-origin verification, exact JSON schema/size constraints, the existing receipt-specific attempt limiter and the server-only settled-receipt projection; generic 404/403/413/429 and no-store/private/no-referrer/noindex/nosniff responses. Grants are returned in POST JSON bodies, not appended to URLs, but no frontend invokes the endpoint.
- `src/lib/private-receipt-pdf-response.ts`: server-only bounded **output-response contract**, not a PDF generator. A verified captured/refunded record with a receipt number is required before packaging bytes. The helper checks a supported PDF header, terminal EOF marker, maximum 2MiB output and safe reference-derived filename. It emits `application/pdf` with attachment-only disposition, no-store/private, no-referrer, noindex, nosniff and sandbox CSP. A copy of the byte input is made. Matching negative/type/transport tests were authored.
- Fixed a real source-level off-by-one in the PDF version line detector (inspection now includes newline/CRLF) and a missing-key case in the encrypted-grant opener (returns null rather than throwing for valid ciphertext when the decryption key is absent). New negative tests were added for missing/malformed keys and pending/failed/unreceipted output.
- **No native PDF bytes are generated yet.** No renderer/package/font assets were added. Production lacks a trusted licensed Unicode-capable server PDF renderer supporting Arabic/Telugu and selectable accessible text; npm registry and GitHub DNS were unavailable from the local shell. No PDF redemption HTTP route or donor-account recovery/reissue action was opened.

**Validation:** GitHub publication/readback/structural checks pass; 11 isolated Node cryptographic assertions (on an earlier local mirror) and 5 standalone response-boundary smoke assertions pass. These are *not* actual branch Vitest or compiled Next tests. Current branch TypeScript/ESLint, Vitest test files, browser/AT journeys, production build, font/Unicode, deployed security headers, native Postgres and financial/provider tests remain **unrun/unverified** in this chat session. No falsely attributed current-head green status.

**Register:** 149 items unchanged: 57 Implemented, 48 Partial, 42 Not started, 1 Superseded, 1 Not applicable; original 95 aliases unchanged. AF-RECEIPTS/B09 stays **Partial**. Controlled migration, real PDF renderer, positive/negative route verification, approved donor proof and secure reissue, release merge and production behavior remain gated. No environment toggles, secrets, provider/payment/refund, live DB records, email or Railway deployment changed.

**Next executable:** reconcile a reviewed Unicode-capable PDF library/fonts (license, size, Railway runtime, language shaping, accessibility), implement a private **POST** redemption handler using `redeemVerifiedReceiptDownloadGrant` and `privateReceiptPdfResponse`, then run real generated-file render/inspect/AT/browser and financial privacy regressions. Only then consider flag activation. Do not expose capability in query strings or mark browser Print-to-PDF as server PDF generation.

## 2026-10-15 — B09 encrypted, short-lived receipt download authorization (source only)

Continued directly from PR #292. Published source commits `6b936d83a11fa5c4f2a3520bd1a689e22d5c1e0c` and `f7475554bd77059de3d2368b7a9fb120fed18017` on `fix/direct-transfer-feedback-20261013`.

A dedicated server-only receipt capability module now uses **AES-256-GCM with a cryptographically random 96-bit nonce**, authenticated purpose-specific associated data, canonical base64url and hard input/payload bounds. Each sealed grant carries an encrypted existing donor receipt credential and exact reference, never plaintext in URL or analytics; it expires in **five minutes**, rejects tampering, clock-skew abuse, invalid key formats and rotated keys. Production refuses to use an unconfigured key. The optional `RECEIPT_DOWNLOAD_ENCRYPTION_KEY` is documented as an empty, non-public 64-hex-character secret in `.env.example`; no key has been provisioned or enabled.

A separate server-only issue/redeem wrapper uses the pre-existing **private verified receipt projection** on BOTH issuance and redemption. It authorizes only completed CAPTURED/REFUNDED acknowledgement records with receipt numbers; failed, pending, unreceipted, revoked or invalid claims do not authorize downloads. This retains original appeal/fund purpose, current refund accounting and late sensitive-beneficiary redaction on redemption. New unit suites cover cryptographic envelope expiry/tamper/key rotation and authorization lifecycle. A local Node 22 type-stripping smoke execution passed grant round-trip, expiration, altered-tag rejection, key rotation and malformed-input assertions. **Repository Vitest, typecheck, lint, CSS budgets, rendered/browser and production builds remain NOT RUN** in this session because GitHub is not resolvable in the local shell and the project is not hydrated in the runtime. New repository tests are authored but NOT claimed green.

**This is not a live PDF endpoint, a donor recovery flow, a single-use token, or a statutory receipt.** The encrypted grant is deliberately replayable during its five-minute life; one-time use requires a durable redemption ledger. No grant is returned to the browser at present. Existing print/save-as-PDF remains the only donor-facing export. Do not provision a key, promise native PDF downloads or activate any route until multilingual renderer, private POST ingress, hardened response headers, secure filename handling, responsive/assistive verification, provider and real database tests are complete. Future donor credential reissue requires a separate ownership verification, rate limiting, audit/retention design and consent review; never grant access by knowing only email/reference.

Current canonical register stays **149 entries: 57 Implemented, 48 Partial, 42 Not started, 1 Superseded, 1 Not applicable**. Original 95 aliases unchanged. B09/AF-RECEIPTS remain Partial. No main merge, deployment, schema migration, live payment, provider/key change, email, donor record read, refund or public activation.

Next coherent development: select an audited server-side PDF renderer with licensed Unicode Arabic/Telugu coverage and accessible selectable text; build a private bounded same-origin POST endpoint that re-verifies each grant and emits genuine `application/pdf` only for valid settled records; validate no-store/no-referrer/noindex and controlled `Content-Disposition` plus full rejected/expired/tampered cases; then plan separately audited donor-owned reissue.

## 2026-10-15 — B09 private receipt trust-boundary continuation

Work resumed in ChatGPT chat against existing PR #292; source head `ce6610f9c79ec6dd28af63fbd71024d078be5f7e`, privacy fixture commit `a3b97981efdac0c4a0008c0d1693ea835bb8d3a9`, and browser-regression commit `1f2ad4e75ffec758832790fca6696954a38fcb3f`. The existing token-verified acknowledgement projection is now an isolated server-only function suitable for future PDF delivery. Its contract retains constant-time stored token-hash verification, integer-paise accounting, original appeal/fund designation snapshots and late confidentiality redaction. The same-origin route retains bounded JSON, no-store/private, no-referrer, noindex and uniform private misses. A separate hashed `receipt` request bucket (60 reads/hour per trusted client) bounds guessing without consuming the 10/hour donation-checkout budget; rate denial occurs before private donation lookup, and counter errors fail closed. Raw client IPs and receipt tokens are not persisted in rate attempts. New unit cases cover 429, wrong/missing credentials and distinct hashing. The previous actual privacy-fixture suite has a scoped rate-limit mock while preserving real origin/auth/read checks, avoiding an incomplete Prisma fixture. Three new Playwright scenarios use only synthetic donor/payment data to exercise masked-token recovery and stripping of fragment secrets, paise/partial-refund copy, responsive 390/1440 print isolation and 80G disclaimer retention.

**Evidence discipline:** GitHub code publication and readback/structural preflights completed; neither full Vitest, TypeScript/ESLint, Playwright browser results, nor bundle/production builds were executed locally because no GitHub network checkout or hydrated project runtime is available. The new tests are authored but not claimed green. AF-RECEIPTS/B09 remain **Partial** pending standalone downloadable PDF (not an HTML response), expiring/reissued access, regulated tax-format separation, hosted native database integration, live verification, and controlled release. Master 149 labels remain 57 Implemented / 48 Partial / 42 Not started / 1 Superseded / 1 Not applicable. The original 95-alias history is unchanged. No runtime config change, migration, payments, donor or beneficiary record access, email, PR merge or production deploy.

Next engineering development: create reviewed expiring/reissue receipt credential flow with no disclosure of PII by reference/email alone, integrate server-generated printable PDF through the *same* private projection, then execute focused auth/browser/native validation before proposing a release. Do not hand-roll a Latin-only PDF font path that breaks Urdu/Telugu donor names or mistake browser Save-as-PDF for a native PDF download.

## 2026-10-14 — B09 authenticated acknowledgement recovery and paise-accurate printing (chat handover)

Source commit `a9f866939faf19dd2d06be29bd321043380fd8bd` on existing PR #292; no release or live activation. The verified private acknowledgement now displays exact INR paise, including partial refunds, rather than silently rounding; the formatter rejects unsafe/sub-paise inputs. A masked, optional token-entry form allows a donor holding an existing acknowledgement credential to reopen the same reference after the fragment has been removed. It does not log, persist or place the entered token into a URL, and the existing same-origin server-side hashed-token check, status/accounting contract and no-store response remain authoritative. Print-specific CSS isolates the verified text receipt (including tax disclaimer) for native browser Print / Save as PDF; no new PDF generator, native download link or font dependency has been added.

Focused financial formatter cases were authored (exact paise, comma grouping, invalid/unsafe totals) and published. Readback of four changed source files plus structural checks passed; **repository Vitest, TypeScript/lint, rendered print/browser checks and bundle budgets were not executed in this chat session** because a full GitHub checkout is unavailable to the local runtime. B09 and AF-RECEIPTS remain **Partial**: server-issued downloadable PDF, securely expiring/reissued access, actual browser/AT acceptance and production integration remain to be developed/verified. Canonical 149 classifications and original 95 aliases are unchanged. No merge, deployment, migration, payment/refund, email, provider configuration or private-data write.

Next source step: design token-expiring authenticated PDF retrieval and audited reissue/recovery against the existing donation receipt ledger without using public URLs or issuing tax certificates. Preserve the current historical acknowledgement-link contract until a staged migration/recovery path is validated.

## 2026-10-14 — gated fund donation landing integration

Ownership: HANDOFF_PENDING after coherent B08 public source batch; sole writer existingPR292 from8df944da.88 focused including5 actualDOM cases/type/lint/stylelint/clean compile pass. JS801638/819200; CSS343713/348160. Fund checkout remains disabled by default; no activation or release. Master149 counts preserved; B08 remains partial. NextB09 private receipt PDF/recovery development.

## 2026-10-14 — client bundle and Companion load boundary

Ownership: HANDOFF_PENDING after coherent performance batch. Existing PR292;104 focused/15 Node tests and final type/lint/clean compile pass. JS776483/819200, CSS343292/348160;42717 JS headroom. Master149 counts unchanged; B08 remains partial. No release/public activation.

## 2026-10-14 — dormant fund donor flow batch

Ownership: HANDOFF_PENDING after dormant donor-flow batch.208 focused tests/29 isolatedSQL and clean compile/type/lint passed. JS819180/819200; only20bytes headroom. Publish to PR292; no release/public activation.

## 2026-10-14 — consolidated accounting and master-state continuation

Ownership: HANDOFF_PENDING after consolidated B08 batch; sole writer.449 focused tests/42 isolatedSQL passed;10nativeDB cases skipped. Publish to PR292; master149 counts preserved; no release.

## 2026-10-14 — individual donation accounting projection

Ownership: HANDOFF_PENDING after detail retained-money correction.25 focused tests/type/lint pass; publish to PR292. No release; B08 remains partial.

## 2026-10-14 — gateway derived cache integration

Ownership: HANDOFF_PENDING after gateway cache integration.97 focused tests and final type/lint pass. Publish to existingPR292. No release; B08 remains partial.

## 2026-10-14 — manual reconciliation cache integration

Ownership: HANDOFF_PENDING after manual reconciliation cache unit.20 focused tests/type/lint pass. Publish to PR292; gateway/webhook cache invalidation remains next. No release.

## 2026-10-14 — donation dashboard aggregate integrity

Ownership: HANDOFF_PENDING after overall donation summary integrity. Parent 8d8ac5db. 32 focused tests/type/lint pass. Publish to PR292; no release.

## 2026-10-14 — fund acknowledgement email integration

Ownership: HANDOFF_PENDING after destination-aware acknowledgement unit. Parent 31487ebd. 50 focused tests/type/lint pass; publish to existing PR292. No delivery or worker activation.

## 2026-10-14 — fund summary precision

Ownership: HANDOFF_PENDING after fund aggregate precision unit. Parent 58f24b60; sole writer. 26 focused tests, TypeScript and lint pass. Publish to existing PR292 with guarded head; no release.

## 2026-10-14 — authorized publication and refund continuation

Ownership: HANDOFF_PENDING after completed refund currency unit. Owner explicitly authorized GitHub publication. Shell transport lacks credentials; connected GitHub tools will publish with a guarded head check. Scope: refund currency identity before ledger writes.

## 2026-10-14 — local continuation

Ownership: HANDOFF_PENDING after manual reconciliation INR fix. Publication blocked by automatic approval review. 66 targeted tests, TypeScript and focused lint passed; no remote writes or release.

## 2026-10-14 — B08 continuation ownership

Ownership: HANDOFF_PENDING after the completed currency constraint batch; no concurrent writer. Recovered PR #292 at 324eaeaf7ce9b94a4cb28e9fc2d82af11218646c on fix/direct-transfer-feedback-20261013; sole implementation writer. Integration ref inspected at a6def674. Completed: fund currency constraint, 290 Vitest cases and 25 isolated SQL cases passed. Publication blocked by automatic approval review; local commit only. No release or public checkout activation.

## 2026-10-14 — carousel correction and private giving-fund registry published

Ownership: HANDOFF_PENDING after completed atomic source batches; no concurrent repository writer. User's autonomous source-development directive remains in force; next agent may claim ownership after the normal incoming read/head checks. No generic approval to begin development is required.

Existing PR [#292](https://github.com/immazhark/amaana-platform/pull/292), branch `fix/direct-transfer-feedback-20261013`. Published: carousel immediate-expiry `4bdd683e3c0fbaa436f12402a54d665bd1088fcb`; private registry `b779aeef80c377325fc180ad820b89b61bd099de`; definition audit `f7cb8b1d0e59400d6623d0b368b3ac4e9f9f0913`. Latest validated code is f7cb8b1; this checkpoint follows it. Canonical register/continuation: [AMAANA_MASTER_RECONCILED_EXECUTION_PLAN.md](AMAANA_MASTER_RECONCILED_EXECUTION_PLAN.md), sectionF.

93 focused cases, TypeScript and changed-file lint pass.14 isolated PostgreSQL-WASM migration cases pass using synthetic capture/refund fixtures; existing rows unchanged and no funds seeded. Actual compiled anonymous fund page redirects to login with private headers. Registry compile/guards passed before the later audit-only extension; no new full CI/browser/live claim. No CI polling/rerun, external migration, merge/deployment or financial/mail/provider action.

Next source unit: backward-compatible exactly-one donation designation and purpose snapshot across every legacy payment/direct-transfer/receipt/reconciliation/capture/refund caller. Registry definitions support GENERAL/SADAQAH only; no public fund checkout or active fund seeds. Native Prisma/concurrency, rendered staff workflow, reviewed fund purposes and controlled schema rollout remain precise dependent gates. Keep the existing PR and sole-writer rule.

## 2026-10-14 — published programme evidence

PR292 code head8942b93df1f72e3c48fe493a5572393e6821efe4; B01bd912977, B02a80df913, B04RGB8942b93.19 actual compiled-server anonymous admin/API HTTP guards passed. Chromium download truncated; no local rendered browser claim. CI38552020358 inspected once after publishing. Canonical continuation remains master sectionF; no live actions.

## 2026-10-14 — master programme checkpoint

Ownership: REVIEW_PENDING after published atomic batches; no concurrent writer. Canonical continuation: [AMAANA_MASTER_RECONCILED_EXECUTION_PLAN.md](AMAANA_MASTER_RECONCILED_EXECUTION_PLAN.md), sectionF. Existing PR292/branchfix/direct-transfer-feedback-20261013. Four documents reconciled;149 canonical items,95 original aliases retained. B01 portfolio compile fix, B02 logo/Threads, B04 RGB-token governance locally validated.1187unit/APIpassed/9DBskipped; full lint/type,15sourceguards, clean compilebudgets passed. Browser/live/migration/provider verification remains pending. No production operation.

## 2026-10-14 — master reconciliation execution

Ownership: CODEX_ACTIVE by explicit owner directive. PR #292 branch fix/direct-transfer-feedback-20261013 recovered head 874a79ad58da95d9fea2f6585625a7e202f0a675. Read-only specialists support reconciliation; only parent writes repository. All four supplied documents read. Authoritative master plan being established before feature implementation.

## 2026-10-14 — R-056 stored preview projection corrected

Owner cx authorized continuation on existing PR #292 / fix/direct-transfer-feedback-20261013, parent eaeee2e1145bc09dacdfd6a535ba9796ae79adf0. Found an integration gap: the shared PUBLIC_IMAGE_SELECT used by lean discovery, Our Work, Impact, appeal cover and programme-child/completed-aid projections omitted the newly stored blurDataURL. Add the nullable field to that projection and the separate homepage hero projection. Existing publication/privacy filters, result limits and image validation remain unchanged. The typed WorkPortfolio synthetic media fixture now supplies null for legacy metadata.

Four integration cases run the real getters against selection-respecting Prisma mocks, generate a tiny synthetic JPEG preview using the actual bounded helper, and render the returned media through actual PublicMedia. Hero and shared completed-aid projections both preserve stored previews; null legacy data retains ordinary image rendering. The gallery contract checks preview selection while retaining approved-only filters and 12-image limit. Removing both selections causes five actual regressions to fail; restored source passes 17/17 focused query/render/thumbnail tests. TypeScript, focused zero-warning ESLint and diff checks pass. No full-suite/build/browser rerun claimed for this batch; preceding batch evidence remains separately scoped.

R-056 remains partial: query-to-render integration is now locally verified, but existing nullable migration is unapplied and hosted/deployed acceptance remains pending. Selecting this field requires the already-authored migration before application rollout. Original 95 classification totals unchanged. No database migration/write, media re-ingestion, private-record access, real payment/email, main merge or deployment occurred. Next: remaining actionable register defects and controlled schema/application acceptance.

## 2026-10-14 — R-056 projection continuation

Ownership: REVIEW_PENDING after scoped continuation; no concurrent writer. Existing PR #292, recovered remote eaeee2e1145bc09dacdfd6a535ba9796ae79adf0. Correct missing stored preview selection in lean public-media queries; no migration or production writes.

## 2026-10-14 — immediate promotion expiry and executed handover tests

Recovered PR #292 at 0584c96911eb916dee4147c0630c339f565eb5b8 on fix/direct-transfer-feedback-20261013. Confirmed saveVerification rejects requests already converted to appeals, both before and within the transaction: confidentiality changes for existing appeals are not supported through that action. Do not invent an unlocked classification-change workflow.

Confirmed cache defect: transitionAppeal and updateFeaturing used revalidateTag("appeals", "max"), permitting stale promotional reads after a committed withdrawal. Use Server Action updateTag("appeals") for immediate expiry after successful transaction completion, retaining homepage/listing path invalidation and the shared 300-second data cache. Set live-rail success and fail-closed responses to no-store so downstream caches do not outlive withdrawals. No additional database query is introduced. Existing responses cached before rollout are not retroactively purged by this source change; deployed CDN behavior and already-open client views are not certified.

Four workflow regressions cover PAUSED/CLOSED/FUNDED success ordering after audit and failed-write non-invalidation; two actual route tests cover a withdrawn next response and uncached failure. Full runtime Vitest: 1181 passed, 9 database-dependent skipped. The prior privacy/payment helper and order-route tests were executed successfully, including restored Zakat coverage. Full lint initially found three unused private-relation destructuring bindings from the prior handover; consume the deliberately removed relation with void while preserving the public-only rest object and update the boundary guard. Post-correction affected suites: 21 passed; public-data boundary guards: 5 passed; TypeScript and full zero-warning ESLint/governed Stylelint passed.

Compile-only Next build passed before the lint-only projection correction. Client-secret and static-image guards passed. Generated JS 816683/819200 bytes and CSS 342406/348160 bytes; budgets unchanged. This is compile-only evidence, not full database prerender, browser, hosted or production acceptance. Full suite result precedes the behavior-neutral void correction; affected suites were rerun afterward.

Original 95 classifications remain 10 baseline addressed /33 source implemented /25 partial /16 open /11 unverified. No original-item closure inferred. No main merge, deployment, live payment, private-record mutation, email, migration or provider configuration. Continue remaining register work; staging/browser and hosted release verification remain outstanding.

## 2026-10-14 — continuation ownership

Ownership: REVIEW_PENDING after scoped continuation; no concurrent writer. PR #292 / fix/direct-transfer-feedback-20261013; recovered head 0584c96911eb916dee4147c0630c339f565eb5b8. Scope: execute pending tests and correct stale appeal promotion cache after committed workflow changes. No production operations.

## 2026-10-14 — R-064 retired transaction overrides removed

Ownership: REVIEW_PENDING; no concurrent writer. Same PR #292 / fix/direct-transfer-feedback-20261013, parent6eb2f86ea6e0d86c9df101c2fd3f8068e1840530. User cx authorized source continuation.

Confirm old donation hero/grid/context/back and assistance hero/grid/promise/before-grid classes are absent from current application components/pages, acceptance fixtures and seed content. Current routes use PageHero. Remove their rules across donation/assistance structure and polish files, plus unused branches in experience-finish/accessibility. Remove orphaned v2-donate-context-float animation and empty media blocks. Preserve active donation assurance, form/input/validation/upload controls and route layouts. Six files lose6424source bytes; root shared source127682→127593, still above60KB target. Remove48 ordinary style rules plus one animation/two keyframe-step rules (501→451 total rule nodes).

Diff review caught an initial generic-pruning error that removed whole :is accessibility groups containing both retired and live selectors. Restore groups and remove only the two retired branches before testing/building. All451 retained ordered rule records preserve live selector lists, declarations/importance and media ancestry. Canonical contrast and scalable label rules remain. Extend existing global CSS audit to reject retired selector/animation reintroduction; deliberately reintroduced animation fails the actual audit, restored source passes.

Validation:72 synthetic source-cascade comparisons in local Chromium across both forms,6 widths320–1920, both motion preferences and normal/focus/invalid states have zero computed-style or transition-metadata differences.16 actual compiled Chromium cases pass:12 intake artwork/all4-step checks across6 widths with Axe AA and containment,2 donation validation cases,1 mocked checkout→private acknowledgement and1 direct-UPI pending reconciliation/token-scrub case. Six existing contrast checks, full zero-warning ESLint/governed Stylelint, final focused lint, syntax/diff/ownership checks pass. No real money transfer, intake write or live provider/database/media access. CSS-only batch does not claim a new full runtime unit run; latest1095passed/9DBskipped suite belongs to3284822.

Final production-only compile-mode build, guards and budget measurement run together after fixture removal. No acceptance route in manifest. JS816616/819200 unchanged. Total generated CSS347956→341893 (-6063bytes), leaving6267bytes against348160 ceiling. Uncompressed attributed CSS: /donate199596→196079 (-3517); /request-assistance185223→182594 (-2629); /about187281→187198 (-83). Root local import count remains15. These are generated asset bytes, not transferred bytes/CWV or full browser CSS coverage. Existing7 unattributed routes remain; compile mode is not hosted DB/prerender/release proof.

R-064 advances to partial locally validated: an obsolete transaction override layer is removed; broader fold-and-delete reconciliation remains open. R-06760KB target remains open, R-068coverage remains unverified. Original95 classifications become10 baseline addressed,33 source implemented,25 partial,16 open,11 unverified. No new full defect/deployment closure claimed. Preview migration unapplied; CSP report stage defaults off. No main merge/deployment/live money/mail/storage/data/configuration action. Next: remaining shared CSS/cascade and original-register defects; exact-head hosted gates remain required before release.

## 2026-10-14 — R-058 transaction CSS ownership validated

Ownership: REVIEW_PENDING; no concurrent writer. Existing PR #292 / fix/direct-transfer-feedback-20261013, parent09045ae59305800c5bc8e2bef301a8c1ec2334fa. User cx authorized continued source remediation.

Separate existing forms-experience.css into shared controls (2987source bytes), donate-structure.css (3785) and assistance-structure.css (6387), from12758 shared source bytes. Donation routes no longer inherit assistance/upload/consent layout rules; assistance routes no longer inherit donation layout/amount rules. Existing layouts retain shared-controls→owned-structure→route-polish ordering. Split mixed selector lists by ownership without rewriting declarations. All125 ordered rule records (25shared/38donation/62assistance), declaration values/importance, selector order and media ancestors match their original owner-filtered records. Root imports remain15 and127682source bytes; this does not satisfy the60KB global target.

Extend existing audit to reject owner-specific rules in shared form CSS, wrong transaction import ordering and global reintroduction. A deliberately reintroduced assistance selector fails the real audit; restored source passes. Acceptance donation/direct-donation fixtures now use the actual DonateLayout instead of relying on partial root styles. Runtime form logic, validation, focus, privacy and payment contracts are unchanged.

Validation: TypeScript, full zero-warning lint including governed Stylelint, syntax/diff and ownership checks pass.72 local Chromium synthetic CSS comparisons (both forms, widths320/390/768/1024/1440/1920, both motion preferences, normal/focus/invalid) have zero computed-style or transition-metadata differences; transition endpoints are stabilized before comparison. An initial comparison captured in-flight colour transitions; finish animations and wait for rendering before measuring.125 AST record comparisons independently confirm preserved source semantics.15 actual compiled Chromium cases pass:12 intake artwork/all-step checks across those6 widths with Axe AA audits and containment,2 donation constraint/linked-feedback cases,1 mocked checkout→private acknowledgement journey. No real payment or intake persistence. Direct fixture compiled/typechecked; its dedicated transfer journey was not rerun.

Final clean production-only compile mode, postbuild secret/image guards and measurement run in one shell command with fixture flag false. No acceptance route in generated manifest. JS816616/819200 unchanged. Total CSS347956/348160 (+404bytes for split selector duplication,204bytes headroom). Per-route uncompressed attributed CSS: /donate205383→199596 (-5787); /request-assistance188509→185223 (-3286); /about187281 unchanged. These are generated asset bytes, not network/CWV measurements. Earlier production candidate contained fixture assets and was rejected; only the clean final output is budget evidence. Compile mode does not certify hosted database/prerender/release. Existing7 unattributed routes remain.

R-058 remains partial, with stronger route ownership evidence. Original95 totals unchanged:10 baseline addressed,33 source implemented,24 partial,17 open,11 unverified. Latest full runtime unit suite1095passed/9DBskipped belongs to3284822, not a fresh run of this stylesheet batch. Nullable preview migration unapplied; report-only CSP defaults off. No main merge/deployment/live money/mail/storage/data/provider configuration operation. Next: remaining shared stylesheet/cascade reduction and original-register work; current-head hosted release gates remain required.

## 2026-10-14 — Appeal stylesheet ownership validated; original95 reconciled

Ownership: REVIEW_PENDING; no concurrent writer. Same PR #292 / fix/direct-transfer-feedback-20261013, parent3284822816d31ab4cc9c7bde8b7fd4a75cffeb54. User cx authorized continuation.

Remove unchanged appeal-card.css from root imports; the existing appeals/layout.tsx now imports it before appeals.css and appeals-wow.css, covering listing and detail progress. Root local stylesheet imports16→15, source bytes130807→127682. Add audit guards against global reintroduction or changed subtree order; reintroduction fails the real audit. No CSS declaration, route content, architecture or accessibility authority changed.

Validation:36 synthetic source-cascade comparisons in local Chromium (widths320/390/620/700/900/1440, normal/hover/focus, both motion preferences) report zero computed-style differences with transitions frozen for stable endpoint comparison. Three committed actual AppealCard/AppealsLayout compiled-browser cases pass at320/390/1440, covering layout, progress fill, focus, reduced-motion authority and containment. Initial new test incorrectly expected literal0s; corrected to existing accessibility rule0.01ms, then all3 pass. Synthetic fixture is acceptance-only, no live DB/payment/media access.

TypeScript, full zero-warning ESLint and governed Stylelint, focused final lint, six existing contrast checks, syntax/diff checks and the existing two-file Prettier gate pass. Latest full runtime unit suite remains1095passed/9DBskipped on parent3284822; this stylesheet-import-only batch does not claim a new full unit run. Clean default-off fixture-free compile-mode build passes; JS816616/819200 and CSS347552/348160bytes unchanged. Client secret/static image guards pass. Generated root manifest CSS excludes canonical appeal-card-head. Uncompressed attributed CSS falls2887bytes: home196918→194031; about190168→187281; appeals204974 and appeal detail191638 unchanged. These are build bytes, not transferred bytes/CWV; existing7 unattributed routes remain. Compile mode is not hosted DB/prerender/release acceptance.

Original95 rows now classify10 baseline addressed,33 implemented/source implemented,24 partial,17 open,11 unverified. R-057/R-058 reflect validated scoped progress while broad isolation remains incomplete; R-065 reflects the already-existing limited two-file formatter gate, not a new implementation. Correct stale R-066 local-lint wording and R-075 parked wording because public/llms.txt exists in current branch. No95-wide fresh production closure claim; later N findings are outside95. R-083–095 include requested feature enhancements, not13 proven regressions. Security nonce/hash hardening, CSS budgets/coverage, human/hosted acceptance, reviewed entity/content/financial facts and authorized operational work remain.

R-056 nullable migration remains unapplied; R-017 reporting defaults off. No merge/main change/deployment, provider configuration or live money/mail/storage/data operation. Next: wider CSS ownership/cascade reduction and remaining actionable original-register work; exact-head hosted gates required before release.

## 2026-10-14 IST — R-017 opt-in CSP diagnostic stage implemented

Ownership: REVIEW_PENDING; no concurrent writer. Same PR #292 / fix/direct-transfer-feedback-20261013, parent51ed9829b103d36e2772d3191746e9f4a65c3260. Owner cx authorized continued source work.

AMAANA_CSP_REPORT_ONLY=true adds a script-only report policy without unsafe-inline/eval, a first-party report-uri and modern Reporting-Endpoints/report-to. Existing enforced CSP and Razorpay origins are unchanged; reporting defaults off. No report-sample keyword is used. Production uses both report mechanisms; acceptance explicitly selects legacy transport for deterministic native delivery. Header flag must be present at build time, and the collector also requires the runtime flag.

New /api/security/csp-report accepts bounded legacy/modern envelopes and derives only allowlisted script directives plus inline/eval/same-origin/razorpay/other source categories. Raw document/resource URLs, query tokens, source samples, referrers, policy text, user agents and identifiers never enter emitted records. Configured origin validation rejects missing/insecure/credentialed origins, permitting loopback HTTP only in explicit local/development modes. Foreign Origin/cross-site/wrong MIME requests drop before parsing; native missing/null Origin forms require matching configured report-document origin. Reports are untrusted diagnostics, never authenticated proof of attack.

Collector reads at most4096bytes with a two-second deadline, handles at most three entries per request, and allows20 diagnostic attempts/minute per instance (at most60 coarse log rows). No database counters/rows or client identifiers. Logging is private structured stderr, retained under production console removal. Failures return an empty private/no-store/noindex204. Optional read deadlines belong to the existing bounded-body helper: default caller behavior remains unchanged; timeout and oversize cancellation cannot hold the caller hostage, and timers/reader locks are released.

Validation: six actual Next-config header tests pass, including exact equality of enforced CSP with reporting on/off.52 focused CSP/body/collector cases pass, including private-token/source redaction, modern envelopes, malformed/oversized/foreign/disabled/budget/log-failure cases and stalled cancellation. Full Vitest1095passed/9database-dependent skipped. TypeScript, focused/full zero-warning lint plus governed Stylelint, syntax and diff checks pass. Two actual local Chromium cases pass with report-only enabled: native legacy reports reach the real collector204 and private coarse logs while hydration/inline script execution still work; the existing mocked checkout-to-private-acknowledgement journey passes. No real Razorpay SDK transaction or payment was executed; modern production reporting transport and staged/provider acceptance remain unverified.

Clean fixture-free default-off compile-mode build passes: JS816616/819200bytes and CSS347552/348160bytes; client-secret/static-image guards pass. Compile mode is not hosted database/prerender/release proof. R-017 becomes partial; approved activation, modern transport and payment acceptance remain open. R-014 enforced nonce/hash hardening remains open. Existing R-056 nullable migration is still unapplied. No production/main merge, deployment/configuration change or live money/mail/storage/data operation occurred. Next: remaining original-register remediation and exact-head hosted evidence when available.

Primary protocol references: [CSP3](https://www.w3.org/TR/CSP3/) and [Reporting API](https://www.w3.org/TR/reporting-1/).

## 2026-10-14 IST — R-056 bounded ingestion previews implemented

Ownership: REVIEW_PENDING; no concurrent writer. Same PR #292 / fix/direct-transfer-feedback-20261013; parent 51626ebba112ba99c7f5b9fa3020ff64c7359143. Owner cx authorized continued source implementation.

Implement optional metadata-free JPEG previews from validated public-image upload bytes. Existing 40-million-pixel cap, 12x12 output limit, 1024-byte encoded cap and native two-second processing timeout bound generation. Decode failures preserve ordinary media fallback rather than retrying storage writes. No preview object is uploaded and private evidence/PDF paths do not generate previews. Add nullable MediaAsset.blurDataURL and a matching additive SQL migration; regular admin creation persists previews while retaining isPublic=false. Curated creation persists previews, and explicit re-ingestion of matching approved bytes can fill missing metadata with an audit event without changing consent/publication state.

Only bounded JPEG data URLs can reach public Next Image placeholders. PublicMedia, programme/initiative gallery mappings, thumbnails and lightbox consume metadata; legacy/external delivery keeps its existing fallback. Canonical publication and privacyApprovedAt queries remain unchanged. Reclassify existing pinned sharp0.35.5 from development to production because ingestion now uses it at runtime. Lock graph and every resolved version are unchanged; preserve native-platform metadata.

Validation: full Vitest1052passed/9database-dependent skipped; 93 focused generation/storage/admin authorization checks pass. Prior ingestion/rendering source fails five integration assertions; corrected three-suite56cases pass. TypeScript, Prisma schema validation, focused and full zero-warning lint including governed Stylelint, syntax and diff checks pass. Offline Prisma datamodel diff matches exactly one nullable TEXT column; migration was not applied. An isolated npm ci --omit=dev installation successfully encodes a JPEG with pinned runtime sharp. Five actual local Chromium cases pass: two delayed-image preview cases at390/1440px, responsive gallery columns/no overflow, keyboard modal/focus return and320px containment. Previews remain visible while loading and clear after decoded image readiness. Synthetic fixtures and network interception avoid live media/storage/data access.

Clean fixture-free compile-mode build passes: JS816616/819200bytes, CSS347552/348160bytes; secret-boundary and static-image guards pass. Compile mode is not hosted database/prerender acceptance or live performance proof. R-056 is partial: ingestion/rendering is locally validated; hosted schema/application checks, approved migration/deployment and any owner-approved legacy re-ingestion remain outstanding. No existing live asset was backfilled, no main merge/deployment or live money/mail/storage/database/configuration action occurred. Next: remaining original-register remediation and exact-head hosted evidence when available.

## 2026-10-14 IST — Private-record rendering and document privacy batch

Ownership: REVIEW_PENDING; no concurrent writer. Existing PR #292 / fix/direct-transfer-feedback-20261013, parent 542a4ff8b9a40d77eb6684d76f02b772c41687b8. User handover authorized source continuation only.

Confirmed N-23: acknowledgement/tracking clients asserted untrusted JSON types, allowing incomplete or object-valued found records into rendering. Validate consumed fields, dates, amounts, presentation, intent and the exact requested donation reference before state adoption; malformed reads retain read-only retry guidance. Guard tracking label/copy maps against inherited properties. Confirmed N-24: acknowledgement JSON completion could update state after effect disposal; an effect-local live flag now guards success and error continuations. Existing abort and credential preservation remain.

Defense in depth: configure no-referrer alongside existing no-store on donation/intake/admin/API routes. Apply unconditional noindex/nofollow/noarchive only to private acknowledgement/tracking/received, admin and API matchers. Public donation/intake landing indexing stays unchanged. Existing page metadata and API private headers already protected private records; no production leak claimed. Enforced payment CSP unchanged; R-014/R-017 remain open. Replace CSP source regex tests with actual isolated Next configuration evaluation across production/development/acceptance and indexing on/off.

Validation: 35 focused unit/effect cases pass. Restoring prior clients fails six regressions, including late completion and prototype labels; prior config fails two header regressions. Full Vitest suite 1040 passed / 9 database-dependent skipped. TypeScript and full zero-warning lint including governed Stylelint pass; final focused lint, syntax and diff checks pass. Five generated-header tests pass. Eight targeted actual Chromium cases pass (six new malformed/retry cases plus valid acknowledgement and legacy token capture); the six new cases also pass with actual HTTP referrer/index/cache assertions. Browser uses isolated local build with mocked reads/analytics; no real payment, intake write or production connection. Clean fixture-free compile-mode build passes: JS 816343/819200 bytes; CSS 347552/348160 bytes; client-secret and image-weight guards pass. Compile mode is not database prerender or hosted release proof.

Current-head hosted CI and deployment acceptance remain outstanding. Original 95 totals and closure status are not inferred from these new findings. No main merge, production deployment/configuration, live money/mail/storage/data action. Next: exact-head hosted acceptance and remaining original-register security/performance/CSS work.

## 2026-10-14 IST — R-066 two more Stories selector consolidations

Ownership: REVIEW_PENDING. PR #292, parent 919982f3ec246979b582fe39195d3672a64e0b9a. Combined final feature H2 font-size and ethics-article padding into their respective early selector blocks, eliminating two later duplicate selector blocks. Same winning declarations, no media or DOM changes. Source checks only; browser, build and actual Stylelint execution outstanding. Scoped duplicate-selector exception retained until full route reconciliation. No merge/deployment/payment or live data action.

## 2026-10-14 IST — R-066 Three Stories selector-pair consolidations

Ownership: REVIEW_PENDING. PR #292 on fix/direct-transfer-feedback-20261013; parent fdd2b950e5c75628d0a954e5079e5a47e9e24359. Fold final feature-grid columns/gap, stories-grid gap/top margin, and feature-paragraph margin/line-height into their base CSS selectors, removing three later duplicate blocks. Exact source preconditions and original CSS winner values preserved; responsive declarations untouched. Browser/stylelint/build execution pending, R-066 partial, scoped temporary duplicate-selector exception remains. No merge/deploy/live operations.

## 2026-10-14 IST — R-066 Stories card-copy selector consolidation

Ownership: REVIEW_PENDING. Same PR #292; parent a274a7082e84db1b902d0e722a7f359db72fd300. Consolidate two duplicate unscoped Stories CSS selector pairs by moving the final card-copy padding and H3 font-size declarations into their earlier matching selectors. Remove now-empty late duplicates. All winning values and responsive rule order remain. Source preconditions checked; hosted cascade, lint, browser and build acceptance still pending. R-066 PARTIAL, no merge/deploy/payment/data changes.

## 2026-10-14 IST — R-066 Stories ethics list overridden base padding

Ownership: REVIEW_PENDING. Existing PR #292 / fix/direct-transfer-feedback-20261013; parent 0d0c14be1ad4d0f32c602ba6b3166e37ac9d5879. Removed early unscoped .v2-stories-ethic-list article padding:1.6rem 0, overridden by later same-specificity unscoped padding:1.25rem 0. Preserve all other properties, responsive grid rules and source ordering. Exact winner/precondition checks performed. No full cascade/browser, lint or build execution; R-066 remains PARTIAL and scoped Stylelint duplicate-selector exception remains. No merge/deploy/payment/production data action.

## 2026-10-14 IST — R-066 Stories narrow wide-card overridden min-height

Ownership: REVIEW_PENDING. Existing PR #292 / fix/direct-transfer-feedback-20261013; parent f416fa4feab12ebec2e3d18f60f2e317a0969799. Within max-width:620px, retain the shared 1fr grid-template-columns declaration for ordinary and wide cards but scope min-height:auto to ordinary .v2-stories-card only. Wide cards previously inherited min-height:auto in the media rule, but a later same-specificity unscoped .v2-stories-card.wide min-height:25rem takes precedence; removing the overwritten media declaration preserves the winner. No color, artwork, layout order or intentional responsive value changed. Browser/cascade and lint validation remain pending. R-066 partial and duplicate-selector exception retained. No merge/deploy/payment/data changes.

## 2026-10-14 IST — R-066 Stories 900px redundant wide-card selector

Ownership: REVIEW_PENDING. PR #292 / fix/direct-transfer-feedback-20261013; parent e11c7c0d3a9d6edc8ae14a0060ec7655a7b949d1. Removed .v2-stories-card.wide from the max-width:900px grid-column:span 12 override selector list, retaining the .v2-stories-card match there. The base .v2-stories-card.wide rule already establishes grid-column:span 12; thus at <=900px the winning wide-card column remains unchanged while ordinary cards still expand to twelve columns. Narrower 620px layout untouched. Source checks only, not actual browser/cascade equivalence. R-066 partial; Stylelint Stories duplicate-selector exemption remains. No merge, deploy, payments or live production data.

## 2026-10-14 IST — R-066 Stories wide-card overridden minimum height

Ownership: REVIEW_PENDING. Existing PR #292 / fix/direct-transfer-feedback-20261013; parent 342743d028397296ff6362ea5b8ec69d1676584d. Remove only early unscoped .v2-stories-card.wide min-height:31rem, superseded by later unscoped same-specificity min-height:25rem. Preserve wide grid column and grid-template-columns plus responsive media overrides, all in original order. Source preconditions and later winning rule confirmed. R-066 remains PARTIAL, temporary Stylelint exemption retained, lint/build/browser cascade matrix not executed. No merge, deployment or production/payment actions.

## 2026-10-14 IST — R-066 Stories feature dead base padding

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent a33cb5f999097039cfe938fae23047b84471c93f. Removed early .v2-stories-feature padding-block clamp(5rem,9vw,8rem), which is superseded by a later unscoped same-specificity clamp(3.75rem,6vw,5.75rem) and retains narrower responsive overrides. Base background retained. Exact source preconditions verified. No full cascade/browser or lint execution, so R-066 remains PARTIAL and duplicate-selector exception stays. No merge/deploy/payment or production data actions.

## 2026-10-14 IST — R-066 Stories card dead declarations

Ownership: REVIEW_PENDING. PR #292 / fix/direct-transfer-feedback-20261013; parent 8b0bd2db4ec4bea589bb79a6fb708a9f88c4e02e. Removed six superseded source declarations: card-copy padding, card H3 font-size, card min-height, border-top, border-bottom and transition. Existing later same-specificity rules supply the winning properties; selectors, responsive overrides and source order remain intact. Exact source checks performed; no actual lint/build/browser or complete cascade proof. Cumulative Stories overwritten-property removals in recent batches: thirteen including prior H2 (1) and feature/grid (6). R-066 PARTIAL; Stylelint duplicate-selector exception retained. No merge/deploy/payment or live data operations.

## 2026-10-14 IST — R-066 Stories dead base declarations

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent 30ded17573cf876c344cd5701d12848b744f1e28. Removed six earlier unscoped declarations entirely superseded by later identical-specificity unscoped rules: feature grid grid-template-columns and gap; feature paragraph margin and line-height; story grid gap and margin-top. Preserved later winners and every selector and order, plus unaffected base properties. Exact before/after source preconditions verified. This is source-level cascade reasoning, not rendered browser equivalence or actual lint success. Duplicate selector exemption remains; R-066 PARTIAL. No main merge, deployment, payment or live data.

## 2026-10-14 IST — R-066 Stories overwritten H2 declaration

Ownership: REVIEW_PENDING. PR #292 / fix/direct-transfer-feedback-20261013; parent 80b4d7d0f5facc3eeeef88127f36477790c7303b. Source inspection found the early .v2-stories-feature-copy h2 font-size clamp(3rem,5.5vw,3.5rem) fully superseded by a later same-specificity unscoped rule clamp(2.5rem,4.3vw,3.5rem). Remove only the earlier overwritten font-size declaration; preserve the later winning declaration and all other values, selectors and relative order. Does not resolve duplicate selectors or remove the scoped Stylelint exception. Source preconditions pass; rendered browser, lint and cascade matrices have not been executed. R-066 remains partial. No merge/deploy/provider operations.

## 2026-10-14 IST — R-066 Stories scoped Stylelint transition

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent ceda1d9ab78a415d739094bcf3c203b6bd0f4586. A source audit after registering stories.css in pinned Stylelint found repeated same-context selectors in base and late polish layers, including .v2-stories-feature-grid (2), .v2-stories-card (3) and .v2-stories-feature-copy h2 (2). Full no-duplicate-selectors on this route would block existing historical stylesheet, despite the source-only gate extension being reported as configured. Apply a narrow Stylelint override for this exact route disabling only no-duplicate-selectors while retaining color-no-hex for the route; both rules still apply to the pre-existing governed component modules/donation audit. This avoids falsely claiming the route has clean duplicate-selector governance; R-066 remains PARTIAL until route cascade is consolidated with rendered equivalence proof. No runtime CSS change or browser/build/lint execution; hosted gate must verify actual Stylelint behavior. No merge/deploy or production operations.

## 2026-10-14 IST — R-061/R-066 Stories stylesheet token enforcement

Ownership: REVIEW_PENDING. Existing PR #292 / fix/direct-transfer-feedback-20261013; parent c8c81e62fe86f79c58d4d3a4888f741000c53db4. Replaced the final ten Stories route CSS hex occurrences with eight exact-value root palette roles: deep/dark/highlight blue, caption ink, night/artwork, prose ink and ethics night. Source preconditions counted every former literal and confirmed zero hex remain in stories.css. Extend the existing pinned stylelint:governed npm script to explicitly include src/app/stories.css alongside 17 component modules and donation audit. Existing color-no-hex and no-duplicate-selectors rules remain unchanged. This is source enforcement coverage, not proof of a successful executed lint gate or rendered cascade. R-061/R-066 remain PARTIAL because other route/global CSS, RGB/alpha colors and deployment acceptance are open. No local runtime/lint/build/browser execution available in this connected-GitHub step. No merge, deployment or production data/provider operations.

## 2026-10-14 IST — R-061 repeated Stories body and warm-white text tokens

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent 323c557d3e8627883979cb02ee1984f7ca48415c. Centralize eight more exact-value route colors: four #68717a text declarations now --af-color-story-body-ink and four #fffaf1 foreground declarations now --af-color-story-warm-white. Tokens have identical RGB values, defined once in globals.css. Preserve all selectors, alpha colors, text sizing, backgrounds, and layout. Source-count checks passed. Not a rendered/cascade, lint, build or browser certification. R-061 remains PARTIAL, other route/global and RGB/alpha declarations open. No merge/deploy or provider operations.

## 2026-10-14 IST — R-061 repeated Stories paper and media-stage tokens

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent d4cabf00a33cc7c244f4ade84311effab5a035be. Introduce two exact-value canonical roles in globals.css: --af-color-story-paper (#f3ecdf), --af-color-story-media-stage (#14243a). Replace all four and three matching hex occurrences respectively in Stories route CSS. Old/new declarations resolve to the same RGB; no selector, media, design, alpha, content or functional changes. Source preconditions verified. R-061 remains PARTIAL and no actual CSS cascade/browser/lint/build verification performed; deployment and production unchanged. Next: source-backed remaining route/governance gaps, with actual browser/CI acceptance required.

## 2026-10-14 IST — R-061 Stories canonical exact-value tokens

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent 0d1948b712aeb6ccb396b067369cd3e64daef5c2. Replace four #fffdf8 occurrences with canonical --af-color-surface and one #1d3150 with --af-color-navy-800 in src/app/stories.css. Source checked both tokens map to exactly the former RGB hex values in globals.css. No new token, alpha change, CSS selector movement, specificity/layout change or runtime code. R-061 remains PARTIAL: other route/global and alpha literals, browser/cascade and hosted acceptance remain. No local lint/browser/full build executed. No main merge/deploy or live provider operations.

## 2026-10-14 IST — R-025 Stories heading regression false-positive guard

Ownership: REVIEW_PENDING. PR #292 on fix/direct-transfer-feedback-20261013; parent 0c34fc67e6ea955aab308a4cbbef906f7df70eca. Harden new Stories browser regression: a missing stylesheet could satisfy a lower-only 1.11 heading line-height threshold via browser default normal. Require computed ratio in 1.11–1.13 for five audited selectors, and reject Times New Roman fallback. Existing 390/1440 x 100/200% matrices and contrast checks preserved. This proves expected source-driven 1.12 leading rather than merely loose default. Tests authored but browser still not executed in tool context. No production app source, deployment, main merge, payments or live data changed.

## 2026-10-14 IST — R-025/R-026 Stories computed-style regression coverage

Ownership: REVIEW_PENDING. Existing PR #292 / fix/direct-transfer-feedback-20261013; parent dfdfb3f8120f577b373838c592f0af20731d02c6. Add privacy-safe Playwright Stories computed-style fixture with four width/text-scale matrices (390/1440px, 100/200%). Inspect actual route stylesheet rather than static source: assert >=1.11 computed heading font-size-normalized leading for five real heading selectors; >=4.5 computed foreground contrast against explicit declared light surfaces for six small/body labels. Fixture uses no real media or beneficiary records and cleans up after assertions. Tests authored only: local Chromium/npm acceptance unavailable in connected-GitHub context, hosted execution outstanding. No runtime CSS, design, budget or external provider changes; R-025/R-026 remain PARTIAL. No merge/deploy or live data operations.

## 2026-10-14 IST — R-025 Stories fallback artwork multiline leading

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent f2f3fffd9f559b05e4c0e59ed64f0d7223698806. The Stories feature artwork fallback has large display strong limited to max-width:9ch with line-height .95. Adjust just that line-height to 1.12; preserve image-fallback semantics, font sizing, position, existing CSS order, spacing, and brand illustration. Exact source precondition checked and only one declaration changed. Actual wrapping/rendered zoom and browser verification remain pending; no local lint/build/browser execution in this connected-GitHub step. R-025 still partial. No main merge/deploy or live provider/data operations.

## 2026-10-14 IST — R-026 Stories feature paragraph contrast

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent b64166f9084ed86994306c07e21468e49d12948a. Exact source check: .v2-stories-feature-copy p used #68717a against declared feature background #f3ecdf, estimated WCAG contrast 4.22:1 (below 4.5:1 normal text). Reuse existing Stories ink #5f6974 for this paragraph only: estimated 4.75:1 against that declared background. No typography, spacing, layout, animations, other paragraphs or backgrounds changed. R-026 remains PARTIAL until actual rendered/composited and browser acceptance, including text zoom. Source checked; no local lint/build/browser execution. No main merge/deploy or provider operations.

## 2026-10-14 IST — R-026 Stories hero metadata contrast

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent dc26de50a9fae01618749d6392e5e5e23ba9aa49. Confirmed .v2-story-detail-context small used white at 45% opacity over variable dark hero gradient. At representative background #1d3150 source-composited contrast was ~3.94:1, below the 4.5:1 normal-text threshold. Increase only this label's white opacity to 72%; preserve font/layout/content/gradient and adjacent decorative elements. Exact source declaration precondition checked. Browser/computed contrast across gradient and responsive routes unverified; R-026 PARTIAL. No build/browser suite completed for this source-only change; no merge/deploy/provider operations.

## 2026-10-14 IST — R-026 Stories feature kicker contrast

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent bd72fd762848aeb88d2abd05ab68e7b77e99054d. Corrected source-level Stories feature-copy small kicker foreground #8f7450 on #f3ecdf (calculated contrast 3.74:1) to existing canonical --af-color-gold-ink, preserving typography, layout and gold accents. Exact source replacement checked; no browser/build acceptance. R-026 remains PARTIAL pending actual rendered and additional route contrast verification. No merge/deploy or live data/provider actions.

## 2026-10-14 IST — R-026 Stories light-surface micro-label contrast

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent 85ce02a3c6fd3165c2b6619dbbdc6fd44e5d6fda. Four actual Stories labels used #aa8a5b, #8c7659 or #9b7d51 against white-paper #fffdf8 surfaces (calculated contrast ~3.18:1, 4.26:1 and 3.79:1). Switched only their foreground color to existing --af-color-gold-ink (#604407; source-evaluated ~8.88:1 on #fffdf8). Targets: card metadata span, card category small, detail rule label and detail source-note label. Existing font sizes, layout, hierarchy, other gold decorations and backgrounds remain. Exact source preconditions verified. R-026 PARTIAL pending rendered/cascade and mobile browser acceptance; no full build or browser validation completed in this tool environment. No merge/deploy or production/provider operations.

## 2026-10-14 IST — R-025 Stories card/sidebar/ethics headings

Ownership: REVIEW_PENDING. Existing PR #292 / fix/direct-transfer-feedback-20261013; parent 6aebca94a4d7b2ea4787605f7fcff950ea7d2a18. Three actual Stories heading selectors have tight line-height with likely multiple lines: .v2-stories-card-copy h3 (.98), .v2-story-detail-body-grid>aside h2 (.95 with max-width 10ch), and .v2-story-detail-ethic h2 (.9 with max-width 9ch). Each set to 1.12, without changing font-size, spacing, selector order, content, or breakpoints. Exact selector-value source preconditions verified. Remaining decorative/non-heading display text not modified. No local runtime/browser or production build acceptance in this connected-GitHub-only step; R-025 stays PARTIAL pending 200% text/mobile rendered checks. No merge, deploy or live provider/data operations.

## 2026-10-14 IST — R-025 Stories feature and detail heading leading

Ownership: REVIEW_PENDING. PR #292 same branch; parent 61a4eb49e15bee109da6c655ee0b8b4c0577284e. Source-level Stories feature H2 and individual-story detail H1 had compact line-height .92 and .84 with multi-line max-width constraints. Set both to 1.12, leaving font sizes, letter spacing, selectors, responsive breakpoints and content untouched. Exact source preconditions and replacement declarations checked. These are source changes only; rendered mobile/200% zoom, cross-selector cascade, browser, compile and deployment acceptance are not certified. R-025 remains partial. Other compact Stories display rules require independent rendered evaluation rather than unverified broad replacements. No merge/deploy/payment/live data.

## 2026-10-14 IST — R-025 canonical fact and governance heading leading

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent 0a255bc0fb269b15de6b17ae295bcb70d4632f9a. Two remaining source-level tight heading declarations in src/app/canonical-content.css: canonical fact display strong line-height 1.10 and governance summary strong shorthand 1.05. Adjust both to 1.12 without altering font-size, weight, colors, element semantics, layout, or cascade order. Exact-string preconditions and resulting declarations verified against remote parent; no new specificity, selectors or assets. R-025 remains PARTIAL until actual mobile/zoom/browser acceptance and broader selector coverage. No local browser or production build run in this tool environment. No merge, deploy or provider/data operations. Next: independently verify rendered multiline headings and continue original register.

## 2026-10-14 IST — R-061/R-066 shared component stylesheet governance

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013, parentfe32bd4cf35a8a0ead239201fcc0d98576f91576. Owner cx authorized continuation; no concurrent writer.

Original R-061/R-066 gap: native Stylelint checked only donate-audit.module.css, leaving all17 shared component modules outside its two existing rules. Diagnostic recorded49 hex-color occurrences and9 exact duplicate selectors. Extend the existing pinned stylelint:governed command to the component-module glob plus donation audit, with zero-warning enforcement through the existing npm run lint/CI entrypoint. No dependency or new workflow/status infrastructure.

Replace46 component hex occurrences with exact-value canonical palette roles; remove three redundant literal fallbacks where the canonical token is defined. Reuse existing surface/canvas/blue roles and add16 exact legacy component colors to the canonical root. Preserve approved RGB values, including image masks, photography stages, donor/intake feedback and placeholder gradients. Consolidate9 exact repeated selectors within their own rule containers, including amount emphasis, intake step navigation and carousel witness cards; discard overwritten same-property declarations while retaining important flags. Other grouped reconciliation/route/global rules are outside this bounded batch.

Validation: all17 component modules plus donation audit pass both native rules. A disposable new component module with a hex color and duplicate selector fails the expanded actual command with both diagnostics; removed before commit. Temporary PostCSS comparison across340 stylesheet/width/motion matrices preserves normalized winning property values and important flags per exact selector, with replacement tokens resolving to prior RGB. This does not prove every cross-selector/rendered cascade. Full npm run lint passes; full unit suite1005passed/9database-dependent skipped; diff and secret/static-image guards pass. Clean compile-mode build passes:JS813132/819200bytes,CSS347008/348160bytes. No runtime TS change or new permanent tests. R-061/R-066 remain partial: RGB/alpha literal governance and route/global CSS coverage remain open; hosted browser/deployment acceptance is unverified. No main merge/deploy or live provider/data changes. Next: remaining original CSS/tooling and runtime gaps.

## 2026-10-14 IST — framework navigation feedback corrected

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013, parent402b83b43937c622674f64260ef34dc335bcd54b. Owner cx authorized continuation; no concurrent writer.

Older browser run38449403934 failed both policy-loading cases and mobile-header loading twice: no overlay existed. Confirmed source cause: Next client navigation calls preventDefault, so the document click listener interpreted framework handling as user cancellation. Add one thin NavigationLink owner using native useLinkStatus in a descendant; its headless status component reports true pending and cleanup through a shared event. Update52 application Link imports to this owner; native Next props, refs, prefetch, server child content and hrefs remain. The global indicator associates pending with link identity: older completion cannot clear a newer transition, completion/cancellation/unmount releases its owner, history resets. Plain native anchors retain the existing cancelled/modifier/external/same-path exclusions, with safer Element target narrowing. No navigation monkeypatch, timer heuristic or loading.tsx boundary. Official API: https://nextjs.org/docs/app/api-reference/functions/use-link-status.

Browser acceptance now blocks About before opening the initial page, preventing successful prefetch from legitimately skipping pending. Preserve full overlay geometry, logo/dots, body lock, populated page shell and post-navigation dismissal assertions. Add actual framework-link cancellation case alongside existing native-anchor cancellation; cancelled links must leave route/loading unchanged. Fully prefetched transitions correctly skip pending.

Validation: six actual-component status/effect tests pass with mocked framework hook and DOM event boundaries. Restoring the old progress listener fails framework-start and overlapping-owner checks. Full suite1005passed/9database-dependent skipped; TypeScript and full repository zero-warning ESLint pass; browser syntax/diff checks pass. Clean compile-mode build passes:JS813132/819200bytes,CSS346266/348160bytes; client-secret/static-image guards pass. Existing52 imports are the only changes in their callers. Browser runtime/production prerender and rollout remain unverified. This repairs existing feedback; R-071 route skeletons remain open and the prior unsafe loading-boundary approach remains prohibited. No original95 closure inferred, main merge/deploy or live provider/data changes. Batch complete; next: exact-head browser evidence when available and independent original-register defects.

## 2026-10-14 IST — R-054 lazy thumbnail sizing and acceptance corrections

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013, parent8990d6d687135ddb1391d566870e1cb610549d09. Owner cx authorized continuation; no concurrent writer.

Older hosted browser run38449403934 failed thumbnail acceptance at390px/200% (64w candidate versus128px rendered width) and at tablet/desktop image readiness. HTML source-size rem units resolve like Media Queries against initial font size, not author CSS enlargement. WorkPortfolio now uses auto first on its existing lazy optimized images, with prior mobile/tablet/desktop rem hints as legacy fallback. Explicit CSS slot and intrinsic dimensions remain. Primary references: https://html.spec.whatwg.org/multipage/images.html#sizes-attributes and https://drafts.csswg.org/mediaqueries-4/#units. No new client hook or optimizer host allowance.

Correct the synthetic fixture: prior one-pixel PNG fails strict sharp decoding; its pixel size also violates larger width descriptors and can yield zero density-corrected naturalWidth. Generate flat-color PNG at each requested candidate width and matching4:3 aspect using existing app sharp dependency, resolved with the existing browser-workspace createRequire pattern. No real media request or new dependency. Seven32–384w synthetic candidate rasters strictly decode at declared widths. Keep currentSrc candidate bounds, CSS slot dimensions, lazy loading and enlarged-text checks.

R-025 acceptance-only correction: iterating nth locators over shrinking details:not([open]) skipped disclosures and waited forever; hosted log confirms nth(3) timeout twice. Iterate stable disclosure locators and click only those still closed. Actual user clicks and all heading line-height/containment assertions remain. No typography source closure added.

Validation:25focused portfolio/public-media tests pass; restoring previous thumbnail hint fails the updated actual-render regression. Full suite999passed/9database-dependent skipped; TypeScript, focused zero-warning ESLint, browser syntax and diff checks pass. Clean compile-mode build passes:JS812195/819200bytes,CSS346266/348160bytes; secret/static-image guards pass. Actual browser execution and deployed transfer/CWV remain unverified; R-054 stays partial. No main merge/deploy or live provider/data changes. Next: navigation feedback failures and remaining original-register work.

## 2026-10-14 IST — delegated motion press ownership corrected

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013, parent c48e1030737f26b35a7b3392e84a89d3d28183b6. Owner cx authorized continuation; no concurrent writer.

Older hosted browser run38449403934 recorded the native press regression twice: pointer-down was followed by focus feedback which replaced pressed scale0.98 with1. Track the primary pointer owner and keyboard owners separately. Hover/focus preserve held state; pointer-up/cancel and key-up release the original control even if event target changed. Window blur releases held controls; reduced-motion reset clears ownership and inline effects. Native delegated WAAPI, existing selectors and route teardown remain. No hydration/CWV bottleneck closure inferred.

Validation: five actual-effect tests pass with stub event/DOM/animation boundaries. Restoring the prior module fails three of the initial four cases. Full suite999passed/9database-dependent skipped; TypeScript, focused zero-warning ESLint, browser syntax and diff checks pass. Clean compile-mode build passes:JS812195/819200bytes,CSS346266/348160bytes; client-secret/static-image guards pass. Existing browser press case now explicitly focuses while held; an additional case releases outside the action. Browser execution remains unverified locally. This is a task-introduced motion correction, not an additional original95 closure. No main merge/deploy or live provider/data changes. Next: responsive thumbnail and remaining navigation/typography acceptance failures.

## 2026-10-14 IST — N-20 gallery opener focus correction

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013, parent fb08de7b21bd0926e1063ddadf2661dec81e56e9. Owner cx authorized continuation; no concurrent writer.

Actionable hosted evidence: older fee578a0 workflow38449403934 browser job115477111117 was cancelled after recording failures. Final verify failed because BROWSER=cancelled; fast/database/production jobs succeeded. The duplicate-ID gallery case failed twice after ArrowRight then Escape: focus returned to the last viewed photograph rather than the opening thumbnail. Preserve opener identity in a ref and resolve its current position for cleanup. Existing connected-thumbnail fallback handles removal; image selection, modal keyboard trap and overflow cleanup remain intact. Reorder browser regression now navigates away before closing and still expects the opening identity.

Validation: actual-component effect regressions cover navigation, reorder and opener removal; restoring the old active-index target fails two of three. Five focused gallery tests pass. Full suite994passed/9database-dependent skipped; TypeScript, focused zero-warning ESLint, browser syntax and diff checks pass. Clean compile-mode build passes:JS811745/819200bytes,CSS346266/348160bytes; client-secret/static-image guards pass. Local effect tests use stub DOM/hook boundaries; actual browser correction is not yet certified. N-20 remains a source candidate, not deployed; no original95 closure inferred. Other old-run failures include responsive thumbnail acceptance, navigation feedback, motion press ownership and typography fixture interaction; these still require diagnosis. No main merge/deploy or live provider/data changes. Atomic gallery task complete; next: correct remaining actionable browser failures.

## 2026-10-14 IST — R-069 native lint protections implemented

Ownership: REVIEW_PENDING. PR #292 / fix/direct-transfer-feedback-20261013, parentaec129da47c3d37d123a09d918a3943716eedf78. Owner cx authorized continuation; no concurrent writer.

Enable existing Next-supplied import/no-cycle for src TS/TSX with external packages excluded and runtime dynamic cycles still rejected. Next already supplies eslint-plugin-import2.32.0 and TypeScript resolver3.10.1; no dependency added. A360-file diagnostic passed. Disposable real two-file runtime cycle triggers both participants; the same files changed to type-only references pass.

Add supplemental jsx-a11y/control-has-associated-label for button/summary/ARIA-role names with nested text depth5. Native input/select/textarea associations retain existing label checks: this supplemental rule cannot resolve external/wrapping native labels and initially produced false positives. Do not manufacture duplicate aria-labels. Actual unnamed-button probe fails and named-button probe passes. All probes removed before commit.

Validation: full npm run lint passes (repository ESLint zero warnings plus existing governed Stylelint). Final post-cleanup repository ESLint and diff checks pass; tracked scope is lint configuration and existing coordination/register docs only. App unit/build suites were not rerun because runtime/source assets are unchanged from prior validated image batch. No full WCAG/strict-profile/production acceptance claim; R-069 remains partial pending broader policy acceptance and hosted execution. No main merge/deploy or live provider/data operations. Atomic lint task complete; no active writer. Next: inspect exact-head acceptance and continue remaining original requirements.

## 2026-10-14 IST — R-052/R-054 public image delivery batch completed

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent5c6f6a7c17a322df54f0624a5c569368d7375020. Owner cx authorized continuation; no concurrent writer.

R-054: PageHero canonical owner exports one full-mobile/half-desktop image-sizing hint. Apply to priority photographs/artwork in eight public hero surfaces: About, appeals, Get Involved, education sponsorship, Our Work index, initiative detail, programme categories and umbrella programme detail. Previously some inherited a body70vw hint at tablet widths, while others advertised90vw despite full-mobile photo layouts. Body/gallery/portfolio sizes and lazy behavior stay scoped. Category browser acceptance now includes768px and explicit hero sizes alongside existing preload/lazy checks.

R-052: PublicMedia and CampaignMediaGallery optimized only root-relative paths, so an approved absolute Amaana/media URL bypassed responsive optimization. Shared getPublicImageOptimizationUrl converts only same configured HTTPS app-origin /media/ and /brand/ paths. Never grant optimizer access to external hosts, private/API paths, credentialed URLs, HTTP or malformed origins. Existing direct external/data-image delivery and public consent/cache/size guards retained. Actual-component baseline reproduces absolute-URL bypass; corrected native Image output/preload checks pass. Gallery thumbnails/lightbox share this policy.

Validation:32 focused image-render/policy tests pass; full suite991passed/9database-dependent skipped,105suites passed/one skipped. TypeScript and focused zero-warning ESLint across all affected TSX/helpers/tests pass; React review retains server components, direct imports, no new hooks/request waterfalls, existing alt/intrinsic dimensions and priority scopes. Clean compile-mode build passes:JS811676/819200bytes,CSS346266/348160bytes; client-secret/static-image guards, browser syntax and diff checks pass. No production transfer/CWV, browser/current-head hosted prerender or live rollout proof claimed. R-052/R-054 remain partial until broader responsive/network and deployment acceptance. No main merge/deploy or live money/mail/storage/data/config operations. Batch complete; no active writer. Next: inspect exact-new-head acceptance and correct real failures before release.

## 2026-10-14 IST — standalone global-error typography corrected

Ownership: REVIEW_PENDING. Existing PR #292 / fix/direct-transfer-feedback-20261013, parent c4e0ccc8ae46db36be9d879a15073beb2685b0ee. Owner cx authorized continuation; no concurrent writer.

R-024/R-025 confirmed missed inline occurrences in global-error.tsx: label .72rem (11.52px at normal root) and heading .85 line-height. The standalone fallback replaces the normal root layout, so external accessibility CSS cannot be relied on. Set label .75rem and heading1.12 directly in the canonical fallback. Preserve approved background, text, private-error omission and reset action. No R-057 CSS relocation was performed: that investigation lacked rendered cascade/error-route proof.

Two actual fallback-render typography tests fail on original source and pass after correction; a third verifies complete English document, single H1, recovery control/guidance and private-diagnostic omission. Three focused tests, TypeScript, zero-warning focused ESLint and diff checks pass. Clean compile-mode build passes: JS810842/819200bytes, CSS346266/348160bytes; secret-boundary/static-image guards pass. Full unit suite was not rerun for these two presentation values. Browser/device/global-error recovery acceptance remains unverified locally because Chromium is unavailable.

Earlier fee578a0 CI38449403934 fast/production/database/readiness passed; browser remains running. Attempted running-job logs returned BlobNotFound404, not application failure evidence. Current/new-head hosted acceptance remains required. R-024/R-025 stay partial pending broader rendered and deployment acceptance. No main merge/deploy, live payment/mail/storage/data operation or original-audit closure. Atomic standalone-fallback task complete; no active writer. Next: obtain exact-head acceptance evidence, correct real failures and continue remaining authorized source work.

## 2026-10-14 IST — R-026 single-story archive label corrected

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013, parent cbae8ef48d6ebf52f0dbe4b8255398e7b89a9935. Owner cx authorized implementation; no concurrent writer.

Confirmed R-026 occurrence: stories.css .v2-stories-single-note span displayed the small Archive beginning label in bright --v2-gold on light archive paper, used when exactly one story is published. Replace only that foreground with existing --af-color-gold-ink. Source-token contrast on canvas #faf6ec improves1.83:1 to8.36:1; brand fills/borders unchanged. Source guard fails on old rule and passes after correction.

Six source/token contrast checks and34planner tests pass. Add four loaded-/stories stylesheet regressions at390/1440px and100/200%text, creating the exact one-story note markup without depending on archive record count; assert computed composite contrast>=4.5 and scaled readable font. Browser cases not locally executed (Chromium unavailable). Browser syntax, focused zero-warning ESLint and diff checks pass. Clean compile-mode build passes: JS810840/819200bytes and CSS346266/348160bytes; client-secret/static-image guards pass. Previous968unit/API test result belongs to the prior TS-source head, not a newly rerun full unit suite for this CSS-only change.

Current parent CI38450646534 pending at initial read; earlier fee578a0 fast/production/database/readiness successful with browser running. Exact-new-head acceptance remains required. R-026 stays partial until broader contrast and deployment review; no original-audit full closure inferred. No main merge/deploy or live payment/mail/storage/data operations. Atomic batch complete; no active writer. Next: inspect new-head acceptance and continue remaining register items.

## 2026-10-14 IST — R-008 Breadcrumb and Appeal runtime guards completed

Ownership: REVIEW_PENDING. Existing PR #292 / fix/direct-transfer-feedback-20261013; parent a291c65fbf93ec80e0d0240e562b48767ab9c69d. Owner cx authorized continuation; no concurrent writer.

R-008 uncovered source occurrences: Breadcrumb mapped unchecked items/paths and could throw for malformed runtime records; Appeal trusted TypeScript-only fields and could emit object-valued text or treat string isOpen=false as truthy. Add bounded strict Zod validation to shared structured-data library and use it in both components. Invalid optional schema returns null without preventing the main page from rendering. Breadcrumb destinations require safe root-relative paths; Appeal slugs require the existing lowercase hyphenated shape. Preserve valid text exactly, hardened escaping, sensitive-appeal redaction and real boolean donation-action gates.

Nineteen new actual-component cases (ten breadcrumb/nine appeal) all fail against original source; corrected source passes all. Five prior output/privacy/escaping cases remain passing. Focused JSON-LD suites:28 passed. Full unit/API suite:968 passed, nine database-dependent skipped,102 suites passed/one skipped. TypeScript, focused zero-warning ESLint and diff checks pass. Clean compile-mode Next build passes, JS810840/819200 and CSS346256/348160 bytes; client-secret and static-image guards pass. No browser/full hosted prerender or live deployment certification inferred.

Prior fee578a0 CI38449403934 fast/production/database/readiness passed; browser running at the last read. Current parent a291c65f CI38450017088 pending. This new source requires exact-head acceptance. R-008 now covers Article/WebPage, Breadcrumb and Appeal dynamic inputs; production closure remains pending. No real payment/mail/storage/data writes or main merge/deploy. Atomic batch complete; no active writer. Next: inspect new-head failures and continue original register work.

## 2026-10-14 IST — R-009 remaining JSON-LD surfaces completed

Ownership: REVIEW_PENDING. Same PR #292 / fix/direct-transfer-feedback-20261013; parent fee578a0c644549b6a2102946fc7079f508a6597. Owner cx authorized source continuation; no concurrent writer.

R-009 source gap: Organization, Breadcrumb and Appeal JSON-LD still independently escaped only less-than, while PublicContent used the existing complete serializer. Replace all three with serializeStructuredData from src/lib/structured-data.ts. All four JSON-LD rendering components now escape less-than, greater-than, ampersand and U+2028/U+2029 consistently. Existing less-than escaping already prevented HTML script termination; this is completion of the audited broader escaping requirement, not a newly demonstrated XSS exploit.

Five actual-component render regressions retain real React/server output and actual serializer. Three sensitive-character cases fail against original components; corrected output passes JSON round-trip, graph identity, canonical breadcrumb/donation targets, sensitive-appeal redaction and closed-appeal action omission. No canonical content, figures or payment execution changes.

Validation: nine focused JSON-LD tests pass; full unit/API suite 949 passed, nine database-dependent skipped (102 suites passed, one skipped). TypeScript, focused zero-warning ESLint and diff checks pass. Clean compile-mode build passes; JS 810840/819200 bytes and CSS 346256/348160 bytes. Client-secret/static-image guards and actual emitted route report pass. This does not certify full prerender, hosted database/browser or production rollout. Parent CI38449403934 plan/fast/readiness passed, production/browser/database running at last check. No main merge, deployment or real money/mail/data/storage operations. R-009 source occurrences are covered, deployment closure pending. Next: inspect exact-new-head acceptance and continue remaining original register items. Atomic batch complete; no active implementation writer.

## 2026-10-14 IST — R-054 Our Work thumbnail slot correction

Ownership: REVIEW_PENDING. Completed atomic continuation on PR #292 / fix/direct-transfer-feedback-20261013, parent 8bb927bb86834018924abbd1371c19899deecb08. Owner cx authorized same-branch implementation. No concurrent writer.

Confirmed R-054 source occurrence: WorkPortfolio identity thumbnails use CSS widths 4rem/5.5rem/6.5rem at <=600px/<=1000px/desktop, but inherited PublicMedia sizes of 100vw/70vw/900px. Original actual-component regression fails on that oversized hint; fixed markup passes and offers small responsive candidates while preserving lazy loading, alt text, intrinsic dimensions, identity selection and approved fallback. Rem-based sizes also match 200% root text.

Coverage: two actual React/Next component-render tests; six Playwright cases at 390/768/1440px and 100/200% text check slot width and selected candidate, using opt-in disposable synthetic media and intercepted 1px PNG responses. No beneficiary or storage requests. The unchanged default portfolio fixture remains photo-free. Browser cases are authored, not executed locally: Chromium remains unavailable.

Validation: 12 focused actual-component/media-policy tests and 34 CI-planner tests pass. Application and materialized-fixture TypeScript checks, focused ESLint, browser syntax and diff checks pass. Clean compile-mode build passes: JS 811235/819200 bytes, CSS 346256/348160 bytes. Secret-boundary and checked-in image-weight guards pass. Fixtures excluded from production route build and removed from tracked workspace. Full hosted production/database/browser acceptance remains required; parent CI was pending at the initial read. R-054 remains partial until broader hero sizing and deployed acceptance; no new original-audit closure. No production merge/deploy or live data/provider operations. Next: review exact-new-head acceptance and continue independent original defects. No active writer.

## 2026-10-14 IST — R-025 shared heading and R-047 route attribution batch

Ownership: REVIEW_PENDING. Existing PR #292 / fix/direct-transfer-feedback-20261013, parent 20f126bd75d0cd9bbd4de34b860805585d0e9080. User handover authorizes continuation; no concurrent implementation writer. Local checkout and dependencies restored.

R-025: fix five shared/component/Home leading occurrences (1.00/1.04/1.08 -> 1.12) in experience-finish.css, section-heading.module.css and home-documentary.css. Add 12 rendered cases covering Contact shared/component headings, Home section headings and expanded programme-card titles at 390/1440px with 100/200% root text. Cases require present/visible headings, actual computed leading and text containment. Browser execution pending: local Chromium download returned invalid/truncated ZIP; no rendered pass claimed.

R-047: Next 16 omits app-build-manifest but emits per-page client-reference JSON with entryJSFiles/entryCSSFiles. Parse JSON without evaluating the JS wrapper; deduplicate page, ancestor layout and shared runtime/polyfill files; exclude clientModules on-demand inventories and unrelated metadata/error entries. Report unsupported routes explicitly and retain aggregate-only fallback. Actual clean local build attributes 46 pages; seven special/server-only/redirect routes remain unattributed. Figures are uncompressed manifest-assigned entry bytes, not observed network transfers or field CWV.

Validation: 942 unit/API tests passed, nine database-dependent tests skipped; TypeScript and focused ESLint passed. Eight analyzer tests plus 34 CI-planner tests pass (42 combined). Clean compile-mode Next build passes: JavaScript 810840/819200 bytes, CSS 346256/348160 bytes. Client-secret and static-image guards pass. The earlier dirty incremental build retained obsolete CSS and is not budget evidence. Full hosted prerender/database/browser verification remains required. Prior-head CI 38446049892 remained pending at the last read and does not certify this batch. No main merge/deployment, live payment/email/storage/database writes or original-audit closure claim. Next: review exact-new-head acceptance, fix confirmed failures, then continue remaining original audit items. Atomic batch complete; no active writer.

## 2026-10-13 — exact CI failures and repairs on PR #292

At source head b812193, hosted CI run 38438939175 completed failure. This is not generic CI noise: lint, TypeScript, fast unit tests, database checks, and production Next build passed. Two blockers are separately verified from job logs:
- Browser fixture build: e2e/fixtures/components/gallery-update-fixture.tsx.fixture generated TypeScript TS2345 and TS2532 because current[0]/current[1] are undefined under strict indexed access. Fixed via first/second guards in 3820489.
- Production JavaScript cap: built 820,562 bytes versus hard limit 819,200, an overage of 1,362 bytes; CSS 346,208 is under 348,160 budget. Do not relax either limit. Requires reduction in emitted client JS before integration.
- Checkout order-identity acceptance: six previous mocked orders use order_acceptance_001 with underscores. Source regex was alphanumeric-only and rejected fixture. e30cbbc accepts bounded order_[A-Za-z0-9_]{1,120}; retains namespace, allowed characters and length constraints.

New source/test head e30cbbc544791242878992471a59ba04a7bb02d0. CI run 38439982783 was pending when checked; only budget remains independently confirmed outstanding until measured again. Existing PR #292 targets main. No deployed/verified closure claimed, no live money or media operations, and no merge. No CodeRabbit review work. Ownership REVIEW_PENDING.

## 2026-10-13 — R-054 artwork LCP priority and gallery identity correction

Owner: REVIEW_PENDING on existing PR #292, user-authorized cx. Prior head 352bf40 unchanged at initial read. Continued actual fixes; CodeRabbit review intentionally excluded.

R-054: ProgrammeArtwork was lazy even as above-the-fold category or umbrella hero while photographic PublicMedia heroes were prioritized. cb2f4c0 adds optional preload and fetchPriority='high' to the server-rendered artwork component. 68cdb76 and 27a8f83 pass priority only in programme-detail and category PageHero usage; body-card artwork remains default lazy. a5757d2 adds mobile/desktop real-route browser assertions and 313b595 adds the documented Eid umbrella hero assertion. Source register now partial/targeted fix pending hosted browser, complete hero audit, and deployment verification.

Supplementary N-20 gallery identity collision: safeItems deduplicated by URL only, permitting distinct URLs with duplicate media IDs, duplicate React keys and misleading lightbox selection. 833f5da now deduplicates both URL and media ID. 71dcd7a injects distinct-URL duplicate-ID fixture and 3dc6c10 tests retained 13 thumbnails, correct open/navigation and focus restoration. No real beneficiary content or data writes involved.

Current source/test and register commit e79728ec90187b117a9162bdaa9bbdd24787aac8. No exact-head CI success claimed; unchanged tight JS/CSS caps require hosted verification. No main merge or Railway deploy. Original 95-row audit closures unchanged until release evidence. No active implementation writer at this checkpoint.

## 2026-10-13 — original-audit closure follow-up and safe R-071 withdrawal

Ownership: REVIEW_PENDING. User-authorized cx continuation of existing PR #292; only one implementation writer. R-026 light-background action fallback corrected in 16330b9 / 01a5341 and two viewport rendered regressions committed ae8a663 / 3a0515d. R-016 image-source CSP has already been constrained to known HTTPS origins with an existing header regression, so its register row was reclassified to implemented/release verification pending in 885f622. R-014 unsafe-inline script remains open; do not apply nonce-unaware changes to Razorpay/Next rendering.

R-071 was considered and root, donation, assistance streamed loading boundaries, styles and four SSR test cases were initially authored. Historical register review exposed exact blocker: earlier loading.tsx rollout caused 56 browser failures and 7 flaky cases, including canonical redirects answering HTTP200 instead of 307/308 and missing initial HTML metadata/headings (CI 38285272953). To avoid repeating a documented regression, deleted all four newly added loading files and removed all 1566 bytes of appended skeleton CSS; final corrective commits 484a4bc, b82897b, ca6db96, 43c2bbe, 86211b1. R-071 remains open with a technical blocker, and existing navigation progress is preserved. No root or sensitive-route loading.tsx file remains on this branch.

R-024 focused source scan covered additional public style modules (impact, campaign, policy, donation, appeals, stories, assistance, Companion, galleries, recognition and sponsorship). No static font-size declarations below 12px surfaced in these scanned files, but this is not exhaustive shorthand, computed-style, or screen-reader certification; R-024 stays partial.

Final source/register head before this note a34c9af8a6d629173f713ccfbcda41aafc0d329d, hosted CI 38436913349 pending. No final-head type/build/browser success, deployment, merge, provider transaction or production data write claimed. Continue highest-impact open original-audit findings using source-confirmed corrections only, not CodeRabbit activity.

## 2026-10-13 — R-026 contrast boundary and R-016 source reconciliation

Ownership: REVIEW_PENDING. User-authorized cx continuation on existing PR #292 / fix/direct-transfer-feedback-20261013. Verified previous head 97dd2a1 unchanged before implementation. Focus remains original R-001–R-095 defects, with CodeRabbit out of scope.

R-026: src/app/globals.css unscoped text-button fallback used pale gold #f2c76f and a later blanket src/app/refinement.css override used #e0b318; both are unsuitable for light-background small text. 16330b9 switches the fallback to var(--af-color-gold-ink), and 01a5341 removes the contradictory broad override. Existing explicit admin sidebar (light text/dark background) and admin content (dark gold/light background) selectors remain unchanged. Computed-style regression e2e/ui-consistency.spec.mjs added at ae8a663, regex-parser corrected in 3a0515d. Synthetic role contrast calculations: fallback #604407 on #fffdf8 8.88:1; admin content on #f4f6f9 8.33:1; white sidebar text on #122239 15.37:1. Browser validation remains pending, no full R-026 contrast certification.

R-016: Already implemented in current Next config before this batch. CSP img-src is self/blob/data plus explicit HTTPS origins, not https: wildcard; existing e2e/security-headers.spec.mjs rejects both wildcard and scheme-wide https. Register updated in 885f622 to implemented/release verification pending. Do not alter R-014 script-src unsafe-inline without nonce-compatible checkout acceptance.

Last source/test commit 3a0515df7c92e5cad4a9cf51667d799bbb975d77; register commit 885f6227527c1478ebdbc298329a38d369590321. Original R-024 small font declarations still require broader UI/route verification. No merge/deploy, live payment or production data writes. Exact-head CI and approved JavaScript/CSS budgets must pass before integration. No implementation writer currently active.

## 2026-10-13 — uncertain checkout and bounded public-media reads

Ownership: REVIEW_PENDING after user-authorized cx continuation on existing PR #292 / fix/direct-transfer-feedback-20261013. Verified previous head dc3b78f before writing; independent prior CI pending and superseded by new commits. No second writer or unexpected branch head observed.

N-34 follow-up: online order fetch, network loss and HTTP 5xx/gateway errors previously restored editable checkout despite uncertain provider-order creation. ee3cc7a restricts safe retry to confirmed pre-write HTTP 400/403/409/413/429; uncertain outcomes retain the donor's form and enter non-repeat reconciliation. 6930d14 corrects the safe pre-write path to reset only known-correctable rejections. 248ba1d updates the 500 expectation and adds three actual-component Playwright regressions for 500, 502/HTML and aborted order response.

N-31 follow-up: untrusted whitespace-prefixed verification or order error could be truncated to a blank alert. 693fe51 trims before bounding at 500 characters, and e5c91da adds two browser regressions covering payment verification lock and editable pre-write error.

N-28/N-18 public-media occurrence: getPublicMediaObject had unbounded S3 send and unbounded async iteration. dea63c6 adds actual-module stalled-send and stalled-stream regressions. 568f64c gives a 15-second overall read deadline with AbortSignal transport cancellation, best-effort stream teardown, and promise-race rejection even if abort does not settle. Preserve existing size/consent/readiness/bucket and content-completeness checks.

Latest source/test head 568f64cccd17e2312794c2c967b379ece02b8a4c. Its hosted CI 38431227117 was pending when checked. Tests were authored and published but not locally executed: git clone cannot resolve github.com from the execution environment. Prior CI on superseded heads is not evidence for this head; TypeScript, full production build, fixed JavaScript/CSS budgets, and hosted browser acceptance remain required. No original historical 95-row audit closure is inferred. No main merge, deployment, payment, mail, applicant data or production storage write. No implementation writer remains active after this atomic batch.

## 2026-10-13 — Razorpay response and stale lifecycle follow-up

Ownership: REVIEW_PENDING, existing PR #292 / fix/direct-transfer-feedback-20261013. After prior CI run 38421782865 passed, authorized cx continuation published additional source and focused browser regressions. The latest source-and-test head is cc879889bae53caf4d73f37b9df89d5b7ffd4d37; its hosted CI 38429321925 was pending when checked. Do not substitute prior green CI for this source.

N-32 follow-up: 7d573db protects checkout UI after unmount using the existing form DOM connection check in phase changes, feedback and order-attempt ownership. It prevents a late order response from opening Razorpay after leaving, and prevents a late valid payment confirmation from navigating an unmounted component. Importantly, the Razorpay handler still POSTs payment verification after unmount. e6c270b adds an actual-component regression that triggers a paid callback after switching methods and verifies confirmation without stale navigation.

N-33 follow-up: d1e6861 bounds and filters untrusted online-order field-error arrays to renderable strings, validates the suggested remaining amount and avoids empty error feedback. Previously an object-valued field error could reach React rendering. cc879889 adds three malformed error response and one linked legitimate field-feedback Playwright cases.

Combined new browser regressions this continuation: 11 (six malformed successful orders from previous batch, one lifecycle, four failure-response validation). No local repository checkout was available to run the browser/build/type suite; hosted final-head CI, JavaScript budget, and responsive browser checks remain required. No original historical 95-row audit closures inferred. No production payments, emails or data writes; no merge/deployment. No active writer at this checkpoint.

## 2026-10-13 — Razorpay order response runtime boundary

Ownership: REVIEW_PENDING after user-authorized cx continuation of PR #292. Parent abe0876 passed hosted CI run 38421782865. Source commit 44aeeef guards successful order responses before Razorpay construction: HTTP 201, valid order identity, exact submitted paise amount, INR currency, recognized key shape, bounded receipt credential and usable donor details. Malformed successful responses preserve form values, enter reconciliation and disable another order attempt. Existing payment-reported attempt guards remain. Six rendered browser regressions added in 836dbb4 for invalid success payloads. Hosted browser/build/JS budget acceptance on this newer head is pending, so no original 95-audit closure is claimed. No merge/deployment/live payment or production data write. No implementation writer remains active after this batch.

## 2026-10-13 — malformed payment feedback and media cancellation completed

Ownership: REVIEW_PENDING for completed continuation of existing PR #292 / `fix/direct-transfer-feedback-20261013`, parent `c0ea335d2015f4b97a26928fc508847e38d7ea3a`. Owner `cx` authorized execution. Prior 0fd3838 full browser acceptance passed 1,424 Chromium and 24 Firefox/WebKit cases; final-parent CI 38417911131 passed fast, database and production, with browser still running. Those results do not certify this newer source.

N-31 follow-up: non-string confirmation errors previously reached React rendering, where object-valued feedback could crash the payment form and discard its local follow-up state. Accept only non-empty string error feedback and bound it to 500 characters; otherwise use the existing verification-pending guidance. Preserve entered donor values, payment reconciliation and the duplicate-submission lock. Add five real-component browser cases for object/array/numeric/null/empty error payloads; hosted execution remains pending.

N-28/N-18 supported media-reader occurrence: an oversized object with asynchronous stream cancellation previously stalled its known size-limit rejection or substituted a cancellation exception. Initiate best-effort cancellation without awaiting it, handle rejected cancellation, and preserve the known size error when cleanup throws. The original helper fails both stalled/rejected regression probes. Three actual-module cases now pass for stalled, rejected and synchronous-throw cancellation. Existing byte, completeness, key, private/public bucket, consent and readiness guards remain unchanged.

Validation: 88 focused tests across seven relevant suites passed; final full unit/API suite 940 passed / 9 database-dependent skipped, 100 suites passed / 1 skipped. TypeScript, focused ESLint, journey syntax and whitespace passed. Clean compile-mode assets: JavaScript 819,070 / 819,200 bytes; CSS 346,217 / 348,160 bytes. Client secret-boundary and static image guards passed. Compile mode does not certify full prerender/database/browser acceptance. Fresh final-head hosted verification remains required.

Same PR and branch. No main merge, deployment, real payment/email/applicant record, live storage operation or production-data write. No original-audit closure count or exhaustive security/AAA/performance claim. Publish this completed atomic batch; inspect fresh final-head acceptance before integration. No implementation writer remains active.

## 2026-10-13 — cleanup and payment follow-up correction completed

Ownership: REVIEW_PENDING for completed source on existing PR #292 / `fix/direct-transfer-feedback-20261013`, parent `0fd383865c72fa09404081e95d2a98fc5b3d0a09`. Owner `cx` authorized continuation. Parent CI 38413754175 passed fast/unit/type/lint, isolated database and full production build/budgets; browser remains pending at the checkpoint. That result does not certify this newer source.

N-30 review correction: a failed deletion after a later document validation failure previously returned correctable 400, allowing repeated submissions despite retained private objects. Rejected cleanup now follows uncertain 500 while preserving bounded logs, private headers and the successful-cleanup 400 behavior. The new actual-route regression fails on parent source (400 instead of 500); corrected combined assistance/storage/feedback suites pass 54 tests.

N-29 follow-up: after an earlier checkout reports payment, a newer pending order response could still open another checkout or overwrite verification feedback. Recheck attempt identity and opening phase before processing that response and in its error path. Continue reconciling the reported payment with its original order and receipt token. Add three rendered cases for accepted, server-error and malformed newer responses, waiting for actual JSON completion before asserting no new checkout.

N-31 source finding: malformed successful confirmation responses previously navigated to a private acknowledgement with an absent/invalid reference, including `/donations/undefined/acknowledgement`. Validate the reference before navigation; malformed responses retain reconciliation and the existing payment-confirmation guidance. Add six rendered cases for absent/null/numeric/empty/path-like/oversized references. No original-audit closure count inferred.

Final local full unit/API suite: 937 passed, 9 database-dependent skipped, 100 suites passed / 1 skipped. TypeScript, focused ESLint, journey syntax and whitespace pass. Clean compile-mode build: JavaScript 819,016 / 819,200 bytes; CSS 346,217 / 348,160 bytes; client secret and static image guards pass. Nine new payment browser regressions await hosted execution. Compile mode does not certify full prerender/database/browser acceptance. React checklist review preserves synchronous ref ownership, scoped render helpers, focus cleanup and existing privacy/payment boundaries.

No new PR, main merge, deployment, real payment, assistance record, email, storage deletion or production-data write. Existing historical 95-row totals remain unreconciled. Publish the combined correction to this same PR; fresh final-head acceptance is mandatory before integration. This atomic source batch is complete and no implementation writer remains active.

## 2026-10-13 — assistance outcome and evidence feedback continuation

Ownership: REVIEW_PENDING for the completed continuation of existing PR #292 / `fix/direct-transfer-feedback-20261013`. Recovered remote head `0036228c7ea465518bb5db9c71d80c22e089b755` passed CI 38401689042; main remains `aedae00171d2cbf585f65f93b783f66c7f003a43`. This deliberately extends the current form-integrity batch; PR #291 remains independent. The user explicitly resumed interrupted implementation.

N-30: assistance submission previously had no synchronous duplicate-submit guard and reopened the form after lost, malformed or server-error responses even when a case could already exist. Add a synchronous owner and distinct ready/submitting/submitted/follow-up phases. Only explicit pre-write 400/403/413/429 rejection with usable feedback allows correction; only HTTP 201 with validated private credentials allows navigation. Uncertain outcomes preserve values/files, lock resubmission and provide private contact guidance. Focus runs after committed feedback and cancels stale frames. Tracking credentials remain in fragments.

Evidence feedback: return linked document errors for oversized multipart bodies, forged textual/named-empty attachments and excess files. Typed file-type/size/signature rejections return private 400 after cleaning earlier uploads, before case creation. Storage outages retain uncertain handling. Share existing contact input rendering and control feedback within assistance; retain bounded field-error filtering; validation and privacy checks remain intact.

Validation: final focused form/actual route/storage suites passed 67 tests. TypeScript and focused ESLint passed. Full unit/API run: 935 passed, 9 database-dependent skipped, one unchanged password test timed out while compilation was active. A subsequent limited-worker attempt also timed out during compilation; after compilation ended, all 7 unchanged real-scrypt password/work-factor tests passed without changing thresholds or fixtures. This is not a single fully green final full-suite run. Added 9 rendered journey regressions; syntax passed, local Chromium execution unavailable. Final clean compile-mode build passed: JavaScript 818,824 / 819,200 bytes; CSS 346,217 / 348,160 bytes. Compile mode does not certify full prerender/database/browser acceptance; fresh hosted gates remain required. Five new actual-route assertions fail against the original handler; restoring the fixed handler passes all 67 focused tests.

No new PR, main merge, deployment, real assistance record, payment, transfer, email or production-data write. Historical 95-entry totals remain unreconciled; N-30 is a later finding, not another original-audit closure. Publish this same PR and inspect new-head acceptance. Source, tests and continuity records are complete; no further implementation is active in this atomic batch. A green prior head does not certify this continuation.

## 2026-10-13 — PR292 correction completed

Ownership: REVIEW_PENDING. Existing PR292; previous published head `d2c665225e5465c9a2e5cb549f876d0fc1dd02ae`; base/main `aedae00171d2cbf585f65f93b783f66c7f003a43`. Previous exact-head CI38395402522 passed fast/database/readiness and 1,414 Chromium plus 24 Firefox/WebKit cases. Production compiled successfully but failed the unchanged JavaScript budget (823,043 vs 819,200 bytes); no merge was performed.

Correction: share donor/transfer input markup; server-render verified payment instructions through DonationOptions, with a small client clipboard action. Preserve validation, linked errors, focus, fields, verified account/UPI values and submission locks. Direct-method headings now resolve the donation section's existing aria-labelledby. Checkout attempts also isolate dismissal: an earlier unpaid checkout callback cannot reopen a newer pending request. Added one rendered regression for that race (12 new cases in this PR, 42 total journey cases). Minor review spacing issues corrected.

Revised local compiled assets: JavaScript 818,755 bytes; CSS 346,217 bytes, both within unchanged limits (819,200 / 348,160). JavaScript reduction 4,288 bytes. Compilation and build TypeScript succeeded; final local prerender failed because no local PostgreSQL server exists at localhost:5432. This is not a successful complete local production build. Focused payment/API tests: 127 passed across 8 suites. Explicit TypeScript/focused ESLint, client secret boundary, static image guard, whitespace and journey collection passed. Prior candidate's full unit suite had 910 passes / 9 database-dependent skips. Revised hosted build/database/browser checks must pass before guarded integration; prior browser green does not certify the refactored candidate.

No new PR, main merge, deployment, live payment/transfer/email or production-data write performed by this correction. PR291 worker containment remains independent. Historical 95-entry closure totals remain unreconciled; this continues N-29/R-029–R-033/N-24 rather than inventing original-audit closures. Next: correct any revised-head failure before integration; continue independent confirmed defects while hosted validation runs.

## 2026-10-13 — recovered transfer UX and payment-state candidate

Ownership: REVIEW_PENDING. Branch `fix/direct-transfer-feedback-20261013`; base/main `aedae00171d2cbf585f65f93b783f66c7f003a43`. User explicitly resumed the interrupted chat; seven uncommitted source/test files recovered intact and completed. PR291 worker recovery remains independent.

Implemented: direct-transfer native/server field errors with linked messages and post-commit focus; field correction preserves editing focus; unknown/5xx/malformed/duplicate-reference outcomes retain a follow-up lock and contact guidance without encouraging another payment; clipboard failures announce manual-copy guidance. Cross-method lock updates synchronously before the POST. Online checkout rejects same-event duplicate submits and duplicate provider callbacks; payment-reported dismissal and SDK callbacks cannot reopen verification/reconciliation, while genuine unpaid dismissal permits method selection.

Validation: 90 focused tests passed; full unit/API suite 910 passed, 9 database-dependent skipped; TypeScript and focused ESLint passed; 34 CI-planner cases passed; journey spec syntax/collection passed. Added 11 rendered regressions covering five uncertain outcomes, pending same-event submit/method races, repeat field-focus/correction, native validation, clipboard denial, provider dismissal during verification and safe unpaid dismissal. Local Chromium binary is absent (previous installation already failed); collection is not browser execution. Hosted production-build/browser/database acceptance remains required before integration. No live transaction/email or production-data write, no main merge or deployment by this batch.

Historical 95-entry audit totals remain unreconciled. R-029–R-033 receive additional direct-transfer coverage; N-24 receives conservative failure-response UX. N-29 records the newly confirmed method/provider callback state-loss source paths; implemented, browser verification pending. Do not equate source occurrences, tests, or these follow-ups with additional original-audit closures.

## 2026-10-13 — actual HTTP cancellation regressions

Ownership: CODEX_ACTIVE on the preserved N-28 follow-up branch; validated release3414858b remains unchanged. Added actual assistance and direct-transfer route cases using the real body reader/error class: an oversized stream whose cancel promise never settles returns private413 and does not create a case/donation or upload evidence. Both route cases fail with rejection stalled when only awaited cancellation is restored. Fixed source:34 tests across3 suites passed; TypeScript and focused ESLint passed. Assistance test mock now retains the actual error class to verify the real classifier. No live requests, provider calls or production database writes.

Exact release CI38379820058 still reported running at checkpoint; no main merge based on the old tree's green CI. Worker image and other release checks passed. Preserve independent tests until current release is complete.

## 2026-10-13 — production promotion and independent upload batch checkpoint

Ownership: HANDOFF_PENDING. Consolidated14269ad passed full CI38365252911 across fast/database/production/browser/final verify. PR282 guarded-merged into security3414858b3f325ee120b702e66109b6f67cfac87a, whose tree matches the validated candidate. PR215 remains the sole open release PR. Exact release CI38379820058: promotion readiness, fast, PostgreSQL and production build/budgets passed; browser/final still pending at checkpoint. Worker image CI38379820284 passed. No main merge or new deployment yet.

Production config prepared without deploy: PUBLIC_MEDIA_BASE_URL=https://amaanafoundation.org/media, AMAANA_BROWSER_ACCEPTANCE=false, NEXT_PUBLIC_ENABLE_WEB_VITALS=false. Tested migration preflight node prisma/railway-predeploy.mjs/300s remains configured. Secrets are OAuth-redacted; existing credential names preserved. Notification worker still has old root/build/start config and year-only containment; no real email or authenticated job invocation performed.

Independent N-28 on fix/request-body-cancellation-20261013: original reader awaits a never-settling cancel and hangs an oversized-body rejection. Fake-timer baseline fails; non-awaited cancellation rejects promptly and preserves existing cancellation-failure semantics.107 tests across7 relevant suites, types and lint passed. Direct transfer additionally avoids a redundant body allocation up to5.25MiB per request;32 body/upload tests, types and lint passed. Assistance already used typed bytes directly and was unchanged. Implementation saved401f9574 then894f77a92f27fb698972cb3a260ee1ebdd9d6961; no PR opened or change made to release head. Integrate this follow-up after current production candidate is safely promoted, keeping evidence and scope distinct.

Production remains2a8c35ad; historical95 closure totals unreconciled. New-body finding:FIX_IMPLEMENTED/FOCUSED_TESTS_PASSED, unintegrated and not production-closed. Next checkpoint: final215 release result, guarded main merge only if successful, Railway SUCCESS/SHA/live verification, then targeted follow-up integration.

## 2026-10-13 — independent body rejection correction

Ownership: CODEX_ACTIVE on fix/request-body-cancellation-20261013, based on security3414858b. Consolidated14269ad full CI38365252911 passed all selected gates;282 guarded-merged3414858b;215 final CI38379820058 running. Production unchanged. Canonical media URL and disabled fixture/Web-Vitals flags set with skipDeploys. N-28 implemented: oversized stream rejection previously awaited cancellation indefinitely if underlying cancel never settled. New fake-timer regression fails on the original with rejection stalled; non-awaited best-effort cancel preserves immediate RequestBodyTooLargeError.107 tests across7 body/payment/assistance/webhook suites passed, with typecheck and focused ESLint. Direct-transfer multipart parsing now reuses the bounded Uint8Array directly instead of an extra full-size ArrayBuffer copy (up to5.25MiB per request); assistance already used direct typed bytes and is unchanged.32 body/upload route tests, typecheck and focused ESLint pass after this optimization. Keep this independent commit unintegrated until current release gate finishes; do not mutate the validated release head. Keep current release head unchanged while implementing independently.

## 2026-10-13 — PR backlog reconciled to two release PRs

Ownership: HANDOFF_PENDING. Closed11 verified superseded PRs278,279,280,281,274,249,253,258,240,247,241 with per-PR retained-scope evidence; no branches deleted. Recovered missing real-scrypt tests via existing254: refreshed02ef12c0 passed targeted CI38364040345, guarded mergec3e05f5a. Reconciled original216 without reverting newer work: refreshed025a8247 passed targeted CI38364789878, guarded merge3633cb172edcd671f13227740d76da95c9a5a3d1. Only282 consolidated release and215 main-promotion PR remain open. No new PR created in this cleanup batch.

Preserved unique importer batching/deduplication/UTC timestamps, donation card containment, isolated PostgreSQL cases, scoped Stylelint and readable-label browser regressions. Current safeguards remain:12px status badge, postbuild image weight, privacy migration checks, real-scrypt observer tests and payment/media boundaries. Local891 unit tests passed/9 skipped;41 importer/planner passed/4 PostgreSQL skipped; full ESLint/Stylelint/typecheck passed. Prior original216 full CI38252706957 passed exact retained importer/CSS source; refreshed targeted verification does not certify final integrated browser/database acceptance.

Earlier consolidated03b95b1a full CI38362023764 passed plan/fast/database/production/browser/final verify. It does not certify newer3633cb17. Final combined release gates required before promoting282→215→main. No live deployment or current-production closure asserted. Historical95 closure totals remain unreconciled. Production remains2a8c35ad; Railway migration preflight is configured for next deployment, with OAuth variable-value compatibility still unverified.

## 2026-10-13 — remaining importer/CSS reconciliation

Ownership: CODEX_ACTIVE refreshing existing PR216 onto consolidatedc3e05f5a. PR254 exact refreshed head02ef12c0 passed stacked CI38364040345 and mergedc3e05f5a. Open backlog now215,216,282;11 superseded PRs closed with evidence.

PR216 unique work retained from39b671a1: bulk master/factual-lock reads, scoped media deduplication preserving first metadata and repeat idempotency, UTC updatedAt parity for four bulk legacy category writes; donation CSS folded into one authority with shrinkable grid and link wrapping; importer/browser/CI coverage and scoped Stylelint. Keep newer status badge.75rem, postbuild weight guard, historical-pageview migration checks, route reporting and current stacked security work. Never copy its stale package/workflow/globals snapshots wholesale. 41 importer/planner cases passed locally, including7 importer model cases;4 actual PostgreSQL cases skipped locally. Combined unit891 passed/9 skipped, full ESLint/Stylelint/typecheck passed. Both new browser specs parse. Exact refreshed-head hosted gates and final integration database/browser acceptance remain required. Previous exact-head CI38252706957 passed but does not certify this refreshed candidate. No production data writes or deployment.

## 2026-10-13 — superseded PR cleanup and missing coverage recovery

Ownership: CODEX_ACTIVE for existing PR254 refresh onto consolidated03b95b1a. Closed11 superseded PRs:278,279,280,281,274,249,253,258,240,247,241, after comparing actual source/test deltas and fresh heads. Each closure body explains retained coverage; no branch deletion, stale merge or production closure.

Four PRs remain:215 production release;282 consolidation;216 unique importer/CSS work;254 unique real-scrypt coverage. Unlike the superseded candidates,254's password-work-factors.test.ts is absent and password.test.ts still has malformed four-field over-ceiling fixtures in consolidated. Restore exactly its two test blobs without changing authentication runtime. Seven actual-password tests pass with real Node scrypt calls; typecheck/ESLint pass. Add these paths and tests to existing stacked verification so the refreshed existing PR gets exact-head validation. Preserve both histories when refreshing; no force push.

PR216 exact-head CI38252706957 passed39b671a1. Its importer batching, timestamp and test changes are not fully preserved in282; keep open pending scoped reconciliation, rather than merge stale CSS/workflow snapshots. Historical95 totals remain unreconciled. Newer remediation is not deployed; main remains2a8c35ad.

## 2026-10-13 — notification and release-preflight batch complete

Ownership: HANDOFF_PENDING; source integration70e213e70eed102b29dfa67e09cbdc95cf81ffd0. PR288 merged433fccec after exact-head CI38361087739 passed. PR289 merged70e213e after exact-head CI38361613600 passed.

N-25 checkout credentials recovery: same server UUID, provider order and token hash;37 related tests passed. N-26 notification retry ownership: atomic claim requires snapshot attempts equality;15 notification tests passed. Removing equality reproduces an unwanted provider send in the new race regression; fixed source passes. Files: order/route.ts and provider-order.test.ts; notifications.ts, notifications-claim.test.ts and notifications-worker.test.ts. Combined local suite888 passed/9 skipped;97 suites passed/ 1 skipped; full lint and typecheck passed.

N-27 deployment configuration blocker: Railway production predeploy was only an inline environment check and did not run migrations. Updated existing service b40482be-5e5d-48cc-b36b-39beabfd5d5c in environment38aede68-35aa-42de-adbc-49802e6d44e4 to node prisma/railway-predeploy.mjs with300s timeout. Six wrapper tests passed; describe-service readback verifies both fields. Wrapper runs bounded-retry migrations; production skips preview content import and staging seed. Configuration applies on the next deploy; no deployment or database write triggered by this change.

Railway deployment bb65fc78-088e-4df2-b7b6-80c59fd62da8 is SUCCESS at main2a8c35ad5e553ac0cc78b8027a35b592d1876826; canRollback true. Latest release CI38361776442 for70e213e was queued at checkpoint. OAuth exposes variable names only, so canonical media URL, actual credential values and migration state are not remotely certified. Legacy PUBLIC_MEDIA_S3 credential names remain defined alongside MEDIA_S3 names; safe cleanup remains a release preflight item. No new production closure asserted.

Historical register95; current open/unintegrated/integrated/live-closed/reopened totals remain unreconciled. Next: final-head release gates, env/migration/privacy compatibility, guarded parent/main promotion, then deployment/live verification. No live emails, payments, refunds or beneficiary-sensitive tests performed.

## 2026-10-13 — notification retry continuation

Ownership: CODEX_ACTIVE on fix/notification-attempt-claim-20261013 by owner cx. PR288 integrated433fccec after exact-head CI38361087739 passed. N-26: selected attempt count can become stale before a due retry claim, but completion/failure uses that old count. Atomic claim now requires selected attempts equality as well as max-attempt/due-time guards.15 tests across4 notification suites, typecheck and focused ESLint passed. Removing equality reproduces an unwanted provider send in the new race test; corrected candidate passes. Await exact-head hosted verification before guarded integration. Consolidated release gates remain queued; no production promotion.

## 2026-10-13 — checkout persistence continuation

Ownership: CODEX_ACTIVE on fix/checkout-outcome-recovery-20261013 by owner cx. N-25 confirmed: provider order exists and donation write may commit despite lost acknowledgement, but checkout returns500 and loses original receipt access. Own-ID/token/provider-order recovery implemented; five new regressions;37 related tests plus typecheck and focused ESLint passed. No schema change or real provider requests. Await exact-head hosted CI and guarded merge. Final consolidated release CI remains queued; no promotion.

## 2026-10-13 — completed integration batch and release handoff

Ownership: HANDOFF_PENDING; current batch safely completed. Integration head197ca9078da6a2c885843b10150f9ede576af8d1 contains guarded merges: PR286 e5875b3c (CI38357703887), corrected PR2851c44ee9c (d95ef0ae / CI38359261238), PR287197ca907 (a1adbe80 / CI38360005569). All targeted hosted gates passed on exact task heads. Earlier full CI38356018038 passed9dfd0df8 only; latest full release gates remain pending.

N-23: media stack merge resolution reverted strict qualified transfer timestamps and forged/named-empty attachment checks with six source/test blobs. Restore parent validation before merge; retain media readiness scope. Combined validation332 tests across22 suites plus types/ESLint passed. Do not double-count original defects.

N-24: direct-transfer create may commit without acknowledgement, stranding receipt credentials and blocking retry. Preassign server UUID; recover by own ID and matching receipt-token hash; preserve duplicate-reference409 and fail closed on absent/unavailable/mismatched outcomes. Five new regressions;64 related tests passed. Full local unit suite882 passed/9 skipped;97 suites passed/1 skipped; full lint and typecheck passed. No schema change.

Production main remains2a8c35ad5e553ac0cc78b8027a35b592d1876826; no new deploy/live closure asserted. Historical register95; current open/unintegrated/integrated/production-closed/reopened totals unreconciled. Next: exact final-head release gates, environment/migration compatibility and privacy preflight before security/main promotion. No live charges/refunds or beneficiary tests performed.

## 2026-10-13 — current execution checkpoint

Ownership: CODEX_ACTIVE by explicit owner handoff. See docs/EXECUTION_CHECKPOINT_2026-10-13.md for current evidence. PR286 integrated at e5875b3c. PR285 corrective d95ef0ae restores six parent validation files reverted by its merge resolution (N-23); fresh hosted CI required. Combined candidate:99 focused tests and typecheck passed. Main remains2a8c35ad; no new production deployment or closure. Historical95 entries; current totals unreconciled.

## 2026-10-13 — combined corrective integration candidate

- Actual d59f5e66 CI38306526542 result: fast/database/production passed; browser and final verify FAILED. Browser summary1156passed,5failed,1flaky. Four404 cases consistently measured .98 line-height/font ratio despite earlier fallback edits; one impact fixture failed and the second was flaky after injected main DOM disappeared. No full/cross-browser success for this head is claimed.
- R-025 root cause: later experience-finish.css shared state/error `font` shorthand resets line-height to .98. Change that authoritative shorthand to1.05 for the shared state/receipt/404/error/loading heading family, preserving sizes/fonts and all existing test thresholds. Keep the four real404 assertions.
- Impact harness correction: replace mutation of React-owned main DOM with a server-rendered disposable impact-typography page importing the real impact CSS module. Retain both100/200% cases, exact font, opacity and color assertions; no weakened thresholds or retries. Production fixture preparation removes the entire fixture subtree; actual disabled-build removal probe passes.
- N-21 parked artwork cap fix included: bounded shared-cap encoder,11focused tests, postbuild image guard, actual7derivative evidence and3failing cap-bypass mutation cases. Local source/geometry/alpha unchanged; hosted sharp0.35.5 and full18-image checks pending.
- N-22 source-confirmed optimizer freshness mismatch: managed-media handler returns max-age60/s-maxage300, but global minimumCacheTTL31536000 overrides shorter upstream policies. Official Next image docs and exact v16.3.8 image-optimizer.ts confirm max(minimum,upstream). Lower floor to60; remove conflicting generic /media immutable config header so the handler owns success/error policies; explicitly retain year-long immutable source headers on /brand,/hero,/programme-artwork. Cap optimizer source bodies to existing5MiB managed-upload limit. Add three real optimizer/source-header browser cases with a disposable read-only source using an existing approved WebP; syntax and actual-config parsing pass locally.
- N-22 remains PARTIAL: nominal freshness policy is corrected, but existing caches, stale/error revalidation behavior, CDN purge and real consent-withdrawal acceptance are not certified. Do not describe this as immediate revocation or complete media privacy. Reference https://nextjs.org/docs/app/api-reference/components/image#minimumcachettl and vercel/next.js v16.3.8 packages/next/src/server/image-optimizer.ts; no private-header forwarding/auth-bypass claim.
- Ready for one guarded fast-forward from PR d59f5e66 after its run completed, including parked f3ab3447 ancestry. Fresh candidate lint/types/build/budgets/browser required. No security/main merge, deployment, live transaction or zero-defect/AAA certification.

## 2026-10-13 — parked validation and remaining boundaries

- N-21 sensitivity: detached byte-cap bypass mutation makes3 of11 focused tests fail (oversize fallback, nonmonotonic fallback, bounded rejection); actual candidate remains unchanged. Baseline actual-generation guard fails on422226-byte Taleem; bounded candidate397472 passes. This verifies enforcement rather than merely expected happy-path values.
- N-13 rechecked against actual PR215 advisory: GHSA-vfj7-8cjw-p6xm / CVE-2026-93687 affects braces<=3.0.3; GitHub Advisory Database still lists no patched version (https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Current lock chain eslint-config-next16.3.8→@next/eslint-plugin-next16.3.8→fast-glob3.3.1→micromatch4.0.8→braces3.0.3 is development-only. Docker still asserts braces is absent after prune --omit=dev. No downgrade, suppression, unaudited fork or claim of a new full audit/patch.
- Analytics review: page views and Web Vitals reuse normalizePublicAnalyticsPath; dynamic public slugs group as :slug, private routes are excluded, bodies are bounded and schema-strict. This source review does not close historical nonconforming paths, production migration, retention, live privacy or cost gates.
- Impact contrast review correction: base impact.css contains older light-surface inks, but later impact-wow.css resolves principle labels/paragraphs to canonical gold-ink/muted through brand aliases. No additional confirmed rendered defect established; no extra stylesheet change committed for those two selectors.
- d59f5e66 CI38306526542 browser remains active; other gates passed. Keep artwork code parked and preserve the running suite. No production release actions.

## 2026-10-13 — N-21 generated artwork bypassed image budget (parked)

- Root cause: the fast hero/artwork weight guard runs before `npm run build`; prebuild refinement creates ignored derivatives afterward. d59f5e66 production log contains Taleem422226 bytes against the existing MAX_ARTWORK_BYTES409600 cap. The same baseline pipeline reproduced all seven production byte counts locally; a weight check after baseline generation correctly fails on Taleem.
- Correction: shared-cap encoding helper keeps preferred quality88 when fitting, tries bounded qualities86/84/82/80/78/76, and throws before the oversized output write when none fits. Add the existing weight checker to npm postbuild after the secret-boundary gate, so production/browser builds cannot report success with oversized generated artwork. Add 11 focused encoder boundary/error tests to the existing fast image step. No budget increase or new dependency.
- Actual-file validation: candidate Taleem397472 bytes at quality82 (24754 bytes/5.86% smaller); other six derivatives remain byte-identical at quality88. All seven retain1536×1024 geometry and alpha channels; every downloaded approved source SHA-256 unchanged. Local 14-image subset (7sources+7derivatives) passes weight guard. Preferred/limit/oversize/nonmonotonic/floor/invalid/error cases11/11 pass; syntax passes. Visual comparison preserves the established composition; measured Taleem PSNR36.93dB relative to the prior encoding, not an assertion of lossless output.
- Local encoder is runtime sharp0.35.4; repository pins0.35.5. Exact old output bytes match hosted baseline, but fresh hosted generator/quality/budget validation remains required. Outputs and approved source image files are not committed or regenerated through AI.
- R-053 remains partial: mobile transfer <=150KB and external consent-cleared media delivery are not certified. Track new N-21 as implemented candidate, not deployed.
- Based on PR HEAD d59f5e66; CI38306526542 fast/database/production passed (755unit/9skipped; JS818786/819200,CSS346526/348160), browser still active. Park this follow-up until that browser run completes, then use one guarded integration update. No security/main merge, Railway deployment or live/payment check.

## 2026-10-13 — integrated follow-up candidate after gallery CI passed

- Verified baseline d246e366: run 38303371341 completed successfully across plan, fast, database, production, browser and final verify. Browser log: 1,154 Chromium passed (23.6m), 24 Firefox/WebKit smoke passed (35.3s), no reported flakes. Three new gallery reorder/removal/empty-state regressions included. Fast: 755 unit passed, 9 skipped; production JS818773/819200, CSS346461/348160. Three lint warnings were present on this baseline; parked cleanup addresses them without suppressions and needs fresh hosted verification.
- Candidate batch: gallery cleanup captures current DOM/trigger array safely; typed authorization route table removes unused adapter argument; R-075 static source index; R-024 five explicit sub-12px font declarations (status/pathway/donation/placeholder/impact index); R-025 active error/404 heading .8→1.05 in root and duplicated policy styles; R-019 impact index opacity/background and light-tile caption ink.
- Impact evidence: old index at 62% opacity calculates 4.40:1 over #f7f0de. Opaque #122239 on #fffdf8 calculates 15.73:1 regardless of underlying imagery. Light-tile caption moves #80620d→canonical #604407: 7.94–8.88:1 across #f7f0de/#fffdf8. Palette preserved. This is a scoped numerical/source check, not live image-wide contrast certification.
- Validation: all 79 CSS inventory files inspected for explicit px/rem/clamp and font-shorthand minima; 507 font declarations reviewed. Added eight browser cases: real404×four, actual donation labels×two, disposable impact-style fixtures×two. Node syntax checks pass; new candidate lint/build/unit/browser and budgets pending. No tests or limits weakened.
- Publish only after fresh PR HEAD/ancestry guard; expected old PR head d246e366. R-012, R-019, R-024 and R-025 remain partial; R-075 implemented pending hosted/live serving. No security/main merge, Railway deployment, payment or live verification performed.

## 2026-10-13 — R-024 public stylesheet minimum review

- Read all 79 CSS files from the original repository tree at PR d246e366; root/public/component CSS inventory has no missing fetches. Review targeted explicit px/rem declarations and bounded clamp values, not inherited/em/calculated font sizes or live computed styles.
- Two further sub-12px declarations found: donation-route metadata .68rem and decorative placeholder label clamp(.62rem,1.2vw,.72rem). Raise both to .75rem; earlier parked status/pathway corrections bring this batch to four minimum-size declarations. Placeholder remains decorative/aria-hidden; no semantic or beneficiary-data change.
- Add two actual donation-page browser cases at 390px, verifying both labels equal 12px at 100% and 24px at 200% root size. Together with four R-025 real-404 cases, this batch adds six browser regressions. Node syntax check passes; hosted browser results pending.
- R-024 remains partial until browser, inherited/computed typography, and human acceptance are verified. No claim of universal readable sizing or AAA compliance.
- Parked batch is based on 469a6813; PR d246e366/browser run 38303371341 continues. No security/main merge or deployment.

## 2026-10-13 — R-025 error-heading line spacing

- Current root `not-found.tsx` and `error.tsx` use `.v2-not-found` / `.v2-error-page`; both active headings receive line-height .8 from the globally imported `error-experience.css`. Error heading includes an explicit line break. This is confirmed source evidence; no live overlap measurement claimed.
- Raise the shared heading rule to 1.05 in root error styling and its duplicated policy-route rule, avoiding a later route stylesheet restoring .8. No changes to heading words, route boundaries, redirects, fonts or theme.
- Add four real-404 browser cases (390/1440px × 100/200% root font), checking HTTP404, the actual accessible heading, correct root scaling, and line height at least font size. Syntax check passed; browser execution pending. Existing thresholds unchanged.
- R-025 remains partial: other legacy display rules and broader human typography acceptance are not certified by this narrow correction.
- Parked batch now includes gallery cleanup, R-075 public source index, two R-024 label minimums, and this R-025 correction. Current PR d246e366/browser run 38303371341 still pending; no source update interrupting that run and no deployment.

## 2026-10-13 — R-024 remaining shared-label minimum

- Raise `.status-badge` (globals) and `.canonical-pathway span` (canonical-content) from .72rem to .75rem. At a 16px root, both now reach 12px; at a 32px root, both scale to 24px. Color, spacing, layout and content remain unchanged; replacement length is identical.
- Reviewed the original AM-05/AM-25 findings against current root/public CSS. Legacy tight-heading selectors remain in route styles, but were absent from their current page components; no current rendering failure inferred and no broad deletion performed.
- R-024 stays partial: this is two additional label declarations, not site-wide AAA certification or a completed human acceptance check.
- Based on parked R-075 commit 893dac77, which includes cleanup b5ff59ed. PR HEAD d246e366 and browser run 38303371341 remain active and unchanged. These updates are parked for one guarded integration batch after the running suite completes.

## 2026-10-13 — R-075 public source index (parked integration follow-up)

- Scope: add `public/llms.txt` with 15 canonical links to existing public information and policy routes. No beneficiary, donor, receipt or administrative detail links; no invented impact figures, social URLs or tax promises.
- Compliance: domestic Indian sources only; no FCRA registration; provisional Section 12A/80G approvals; normal acknowledgements are not tax-deduction certificates. Wording checked against the current compliance page.
- Evidence: original `AMAANA_MASTER_REMEDIATION_PLAN(2).md` identifies AM-27; file absence verified at PR HEAD d246e366. Local link/origin/format check passed. This is a small text convention, not a security critical or a guarantee of model indexing.
- Validation baseline: d246e366 fast/database/production gates passed; browser run 38303371341 still active. 77 actual-module local boundary/navigation probes pass. Parked cleanup b5ff59ed still awaits hosted lint/browser verification.
- Publication: keep PR HEAD unchanged until its active browser suite completes; combine this source index with the parked cleanup for the next integration batch. No security/main merge or production deployment performed.

# 2026-10-13 IST — Gallery cleanup lint follow-up parked

Ownership: `CODEX_ACTIVE` under owner continuation; one implementation writer. Parked task `fix/gallery-cleanup-lint-20261013` from consolidated PR #282 `d246e366c89455c4fb444c5b493392f046077103`.

CI 38303371341 at d246e366 passed fast and database; production budget measurements: JS 818,773/819,200 B; CSS 346,461/348,160 B. Hosted units 755 passed / 9 skipped, including 37 actual-helper API boundary and 14 gallery-selection cases. Browser remains in progress; completion is not inferred.

Fast lint was exit-zero but reported THREE warnings: unused _request in the status test adapter; effect-cleanup reads of dialogRef.current and triggerRefs.current. Fix the test table with an explicit Response handler contract and direct status handler. Capture the dialog node and mutable thumbnail-ref array inside the effect; use captured node isConnected to recognize modal removal before focus restoration. Preserve current thumbnail lookup and skip restoration during active modal navigation. No rule disable, threshold weakening or new dependency.

Local TypeScript test syntax parsed. This follow-up still requires hosted lint/type/browser/budget validation; no warning-free CI is claimed yet. N-20 and R-012 broader acceptance remain pending; no new runtime vulnerability count is added for lint warnings.

Next: allow current browser run to finish, inspect new gallery lifecycle results, reconcile this parked follow-up and validate. No security/main merge, Railway deployment or live verification.

---

# 2026-10-13 IST — Gallery lifecycle and actual-helper admin authorization integration

Ownership: `CODEX_ACTIVE` under owner continuation; one implementation writer. Consolidated PR #282 on `fix/consolidated-a11y-regression-20261012`, target `fix/p0-security-remediation-20261010`.

Baseline `0d193c3e0b4aedcb3135944b614055bba34fa628` completed CI 38300163971 successfully: lint/type/unit, database, production, browser and final verify. Hosted units 704 passed / 9 skipped; Chromium 1,151 passed with no failure/flake summary; Firefox/WebKit 24 passed. JS 818,586/819,200 B; CSS 346,461/348,160 B. This certifies the baseline only.

Integrate N-20 from parked `62a721f3`: stable image-ID selection; release stale modal ownership; restore connected thumbnail focus; 14 unit and three dynamic actual-component browser regressions. Local helper 14/14, syntax and production-fixture removal checks pass. Rendered lifecycle/client-byte acceptance still pending.

R-012 coverage: add 37 cases across start/upload/publish/status APIs using real getCurrentUser, hasPermission and isSameOrigin. Verify active/unexpired hashed-token query predicates; anonymous/unresolved sessions; zero/partial permissions; permissions combined across roles; foreign/missing/opaque mutation origins; private error headers; no privileged storage/publication activity before authorization. Stop authorized cases at an explicit inert runtime checkpoint rather than upload/publish.

Local actual API/session/permission/origin execution: 37/37 pass with inert external/persistence adapters. Detached permission-checker mutation (always true) causes 12 failures, with 25 unrelated cases still passing. Added hosted Vitest cases; local TS syntax passes. This is coverage improvement, not a newly discovered production bypass or complete R-012 certification.

Next: fresh combined CI; fix demonstrated failures, inspect gallery bytes and rendering, then integration/release gates. No security/main merge, Railway deployment, real storage mutation, payment or live verification. All compliance/factual/media locks and asset budgets remain unchanged.

---

# 2026-10-13 IST — Gallery lifecycle candidate

Ownership: `CODEX_ACTIVE` under owner continuation; one implementation writer. Parked task `fix/gallery-selection-lifecycle-20261013` from consolidated PR #282 `0d193c3e0b4aedcb3135944b614055bba34fa628`.

N-20: positional selection can change the displayed image after reorder and retain scroll/key ownership after the selected item disappears. Preserve selected ID; derive index; clear removed selections; restore connected thumbnail focus through modal cleanup. Retain layout, media and keyboard controls.

Validation: 14 actual-helper Node cases pass. Add 14 Vitest and three browser cases through the existing disposable synthetic fixture. Script/spec and unit TypeScript syntax pass. React checklist reviewed. Local browser/React execution unavailable; hosted lifecycle and client-byte acceptance pending. No new production dependency or CSS change; budgets remain JS 819,200 B / CSS 348,160 B.

Consolidated CI 38300163971: fast/database/production passed, hosted units 704 passed / 9 skipped; browser running at last check. Do not interrupt it. Next: reconcile/publish this parked batch and validate after that suite completes. No security/main merge, Railway deployment or live verification.

---

# 2026-10-13 IST — Storage/origin integration and Companion scaling correction

Ownership: `CODEX_ACTIVE` under owner cx continuation; one implementation writer. Active consolidated PR #282: `fix/consolidated-a11y-regression-20261012` targeting `fix/p0-security-remediation-20261010`.

Validated baseline `2697dec3661ece25231d2dc5d0eb333d0a8e4ff8`: CI 38297387285 succeeded across fast/database/production/browser/final verify. Actual Chromium summary: 1,149 passed and TWO flaky shared rail/footer/Companion typography tests (390/1280px), both succeeding on retry; Firefox/WebKit 24 passed. JS 818,586/819,200 B; CSS 346,461/348,160 B. This is not zero-flake acceptance.

Integrate parked N-15–N-18 storage/media corrections from `0c695485`, preserving all source/test work. Add N-19: isSameOrigin rejects missing production URL, malformed configured URLs, non-HTTPS production origins, credentialed configuration and opaque Origin. Development HTTP fallback remains available. Five baseline cases reproduced unsafe acceptance/exception behavior; eight corrected actual-helper probes pass.

R-024: hosted flakes read 12px kicker at the 24px assertion after a separate in-place root style mutation. Rework shared checks to reload with a persistent enlarged stylesheet, measure root/text atomically, and verify 100% and 200% reading/prayer typography plus loaded prayer wrapping. No thresholds or budgets weakened. This harness correction still requires hosted browser proof.

Local actual-module/handler probes: 26/26 pass (18 storage/media, eight origin). Added corresponding hosted Vitest cases; local syntax parsed, but local Vitest/Chromium dependencies unavailable. Server-only S3 boundaries remain intact; no database migration, live payment, real S3 mutation or production configuration change.

Next: fresh combined CI on consolidated candidate; resolve demonstrated failures/flakes; integrate to security branch only after required gates and review. No main merge, Railway deploy or live verification claimed.

---

# 2026-10-13 IST — Public storage boundary remediation candidate

Ownership: `CODEX_ACTIVE` under owner continuation. One implementation writer. Parked task: `fix/public-storage-boundaries-20261013` from consolidated PR #282 head `2697dec3661ece25231d2dc5d0eb333d0a8e4ff8`. Security integration remains `c7a4d557`.

N-15: public storage readiness rejected a shared public/private bucket, but common upload/read/delete helpers did not. Enforce separation inside getPublicMediaStorage before creating a client, including trimmed bucket names. Covers ordinary upload, curated upload, read and delete. Private evidence operations remain independent.

N-16: public delivery URL validation happened after persistence and accepted credentials/query/fragments. Validate before storage creation; share the validator with readiness; preserve valid HTTPS prefixes and unpublished null-URL uploads.

N-17: public media publication lookup sat outside the controlled error handler. Move it inside the guard so database failures return an empty no-store 503 with Retry-After and noindex headers before S3 access. A real-handler local probe failed on baseline and passes after correction; add the corresponding route Vitest case.

N-18: public S3 reads buffered entire objects without enforcing the upload-size contract or verifying completeness. Reject oversized ContentLength before reading and close the stream; cap streamed accumulation at 5 MiB; reject truncated bodies. A detached mutation restoring only the old read function failed three guards while 14 unrelated cases still passed. Valid streamed bytes and metadata remain unchanged.

Evidence: actual storage module executed with only AWS SDK/signing replaced by inert transports. Baseline: 9/10 initial probes failed (four absent shared-bucket rejections; three absent unsafe-URL rejections; two uploads before invalid-URL rejection). Corrected: 18/18 combined probes pass (17 storage plus one real media handler). Added 18 Vitest cases for hosted lint/typecheck/unit execution; syntax parsed locally. Local Vitest dependencies are unavailable; these are not claimed as locally executed Vitest results. No real S3 operations or credentials used.

PR #282 CI 38297387285: fast/database/production passed; browser in progress at initial check. Production totals JS 818,586/819,200 B, CSS 346,461/348,160 B. Park the security batch without cancelling or replacing that suite. New storage changes still require hosted candidate CI and eventual combined integration.

No security-branch/main merge, Railway deployment, migration or production privacy/security certification. Next: inspect completion of #282's current browser suite, reconcile this parked candidate with actual HEAD, integrate one atomic batch and validate.

---

# 2026-10-13 IST — R-024 consolidated integration candidate

Ownership: `CODEX_ACTIVE` under the owner's explicit execution handover. Single implementation writer; active PR #282 on `fix/consolidated-a11y-regression-20261012`, target `fix/p0-security-remediation-20261010`.

Verified baseline: `87aa9c613f635dc75b960a801c722f3f2f0f8ed6`. CI 38294121822 completed successfully: fast, database, production, browser and verify; Chromium 1,151 passed with no failure/flake summary; Firefox/WebKit 24 passed. Aggregate JS 818,586/819,200 B; CSS 346,363/348,160 B. These results certify the baseline only.

Parked R-024 work `58c10229` was recovered through `a4e9fa78` and `fdab2ad9`. Correct two literal backslash-n sequences that invalidated intended prayer-label wrapping. Regression guard fails on original parked CSS and passes after correction (2/2 Node tests). Pin browser client date and stub synthetic prayer timings; verify 200% reading/note sizes and seven loaded prayer row wrapping/containment cases at mobile and desktop widths. Spec syntax passes; local Chromium unavailable, so hosted browser results remain required.

CI policy: retain the per-ref concurrency group but set cancel-in-progress false to preserve active expensive browser runs. No tests or budgets weakened. CI planner tests: 33/33 pass locally.

Next: run fresh candidate CI; inspect any new failures and actual JS/CSS totals; integrate into security branch only after gates pass. No merge to main, Railway deployment, real payment/refund, privacy certification or full AAA claim. R-024 remains open for remaining public styles and production acceptance. Preserve canonical response semantics and all factual/compliance/media locks.

---

# 2026-10-12 — Payment integration and keyboard-scroll candidate

Ownership: `CODEX_ACTIVE` under owner continuation; security integration `fix/p0-security-remediation-20261010` at `dcecb8461d374b0c5914b2e050ab9a7cd5339847`. This current checkpoint supersedes historical state below. No parallel repository implementation writer.

Additional integrations:
- N-04, PR #269, validated head 61723e719019b83d2f26aa5c865a51ab0a343206; full CI 38241032771 passed fast/database/production/browser/verify; merge 4d11ca8408b993d9d7f68b1ef56f9f4b83de4473. Runtime validation of consumed Razorpay response fields now composes with #268 callback identity matching. Combined candidate acceptance remains required.
- N-05, PR #270, validated head e88a3761f2e2cff25dc6b6ab7f641ca9275f6414; full CI 38241192347 passed fast/database/production/browser/verify; merge dcecb8461d374b0c5914b2e050ab9a7cd5339847. Reject unusable order identity before persistence.

Independent candidate:
- R-050, draft PR #274, branch fix/keyboard-scroll-handoff-20261012, head f53ebea3cd5b8e90d012b8736e89e14d888485dd. Clean current-base source/test port from #249, with generation invalidation for pending Lenis import and eight keyboard cancellation/restart cases. Hosted CI 38244316271 running. No success or deployment is claimed. Original #249 is not merged and remains a superseded candidate once this replacement is integrated.

Still pending: PR #271 at 8a3ffec148f3b8757a0b7b45909c17c9de00afc8 (nine isolated PostgreSQL tests passed; browser running); PR #272 at cbf45c2f25951d0850b0eaf57cadbc189543c855 (fast/database/production passed; browser running). Do not infer pass from elapsed time, skipped ready-for-review workflows, or historical runs.

R-012 source audit at dcecb846: four admin API handlers enforce session and content permissions before privileged work; three mutations also reject foreign origins. Protected layout requires authentication; private document route requires assistance.view before lookup/signing; all nineteen exported operational server actions in seven protected action modules require their scoped permission at entry. Login/logout are separate credential/session paths. Existing anonymous-browser spec covers twelve protected surfaces and four APIs. This is source/coverage inspection only, not live acceptance or complete independent authenticated-role testing; R-012 remains partial pending current browser/live verification. No auth bypass was established.

Production remains main 2a8c35ad5e553ac0cc78b8027a35b592d1876826. No production promotion, Railway mutation, real donation/refund, email or beneficiary submission performed. Worker rollout remains pending, temporary annual cron containment intact. Preserve all release, factual, privacy, media and payment gates.

Next atomic actions: validate/integrate #271/#272/#274; complete combined integration CI; check PR #215 release gates and production authorization; recover worker only after its source is on main; perform safe live acceptance and update the master finding register. Documentation checkpoint remains separate to avoid cancelling active source-candidate validation.

---

# 2026-10-12 — ChatGPT Work remediation continuation

Ownership: `CODEX_ACTIVE` under the owner's explicit master handoff and cx continuation. This current entry supersedes historical ownership entries below. One repository writer; no parallel implementation agent.

Integration: `fix/p0-security-remediation-20261010` at `2a20844ee540deaa774817e4b0f919f99dc89d58`. Production release PR #215 remains open against main. Documentation task: `docs/remediation-work-checkpoint-20261012`.

Completed this session:
- R-033, PR #265: rejected giving-intent radio focus. Merge dd7bdcfe8040ce28b2f7f03f368dee2d495cc12b. Full CI 38238484810 passed fast/database/production/browser/verify; the separate ready-for-review run skipped validation and was not used as evidence. PR #215's corresponding review thread is now resolved by the reviewer.
- N-03, PR #268: bind provider payment identity to signed callback. Merge 8c71ce25004b1ff6972ed15550f02ff544f6ecdc. CI 38240338711 passed fast/database/production/browser/verify.
- N-09, PR #266: generic curated-gallery HTTP500 response with safe diagnostics. Merge bc9271dbe491eb87030f51e3d3bc4b04cb53de1d. CI 38239767561 passed fast/database/production/browser/verify.
- N-08, PR #267: compare UTF-8 byte lengths before timingSafeEqual. Merge 2a20844ee540deaa774817e4b0f919f99dc89d58. CI 38240152946 passed fast/database/production/browser/verify.

In progress:
- PRs #269, #270, #272: patches reviewed; no open review threads observed. Fast/database/production passed; browser completion still pending at this checkpoint.
- PR #271: found that reconstructed patch omitted real PostgreSQL regression coverage from #258. Restored all three existing cases (older failure/replay preserves newer authorization; matching CREATED and AUTHORIZED failures) in commit 8a3ffec148f3b8757a0b7b45909c17c9de00afc8. Fresh CI 38243416320 pending; previous-head validation cannot certify this commit. Tests use isolated loopback PostgreSQL only. No runtime source changes in this follow-up.
- Combined integration CI must pass for the final selected commit before production promotion. Individual PR passes do not establish combined acceptance.

Production verified from Railway deployment metadata: main 2a8c35ad5e553ac0cc78b8027a35b592d1876826, deployment bb65fc78-088e-4df2-b7b6-80c59fd62da8 SUCCESS. None of this session's fixes is live. Website service has both renamed MEDIA_S3 credential keys and legacy keys; only names inspected, values not exposed. Do not remove legacy keys until deployed-code compatibility and rollback are addressed.

Notification worker: latest deployment 473c17d9-ca74-45b6-908c-c9c0fb3507b6 FAILED; temporary cron 0 0 1 1 * remains active; only CRON_SECRET and NOTIFICATION_JOB_URL defined. Dedicated /ops/notification-cron rollout and successful authenticated invocation are still pending; restore five-minute scheduling only after recovery. No Railway mutation this session.

Next actions: finish remaining PR validation and integration; validate combined candidate; preserve main review/promotion gates; deploy only with required authorization and successful gates; recover worker; verify production; reconcile the recovered 95-row master register plus N findings. No real donations/refunds or user notifications initiated. Preserve factual locks, provisional tax-registration language, domestic-only fundraising, private records, approved imagery and bottom-right Islamic Companion.

---

# 2026-10-12 — Private record access regression coverage

Ownership `REVIEW_PENDING`; bounded test work completed by Codex under owner continuation deliberately supersedes prior implementation wait only for bounded private acknowledgement/assistance tracking regression coverage. Branch `test/private-record-access-boundaries-20261012` from security integration `f5578c31829aeb76ac4e30060cc658342942d762`. Preserve all independent review/integration/main/production gates.

Verified coverage gap: existing acknowledgement and assistance-status route tests replace origin checks, token hashing and bounded body handling with mocks; they do not establish that the actual privacy boundaries compose correctly. Add tests using real origin/token/body helpers, with only persistence mocked. Cover valid minimal responses, rejected origins, wrong or absent record credentials, corrupt persisted hashes, malformed JSON and actual streamed body limits. No runtime vulnerability claim or application change is implied.

Implemented:18 actual-helper privacy cases across acknowledgement and assistance tracking. Only database lookups are mocked; real origin validation, token hashing, constant-time comparison, schema parsing and streamed byte limits execute. Valid replies expose the expected minimal fields; wrong tokens/missing records/corrupt persisted hashes reveal no private data; foreign/null/missing origins, malformed JSON and actual oversized bodies retain private headers and reject before lookup where required.

Controlled mutation proof in a detached scratch checkout: disabling only origin rejection caused six test failures; bypassing only token equality caused four failures. Each runtime route was restored byte-for-byte in finally; primary runtime routes never changed. All18 focused checks and471 full unit tests pass, six database-dependent skips locally; full lint, TypeScript and whitespace checks pass. No user data, payment, email, real persistence, dependencies, runtime application code or secret configuration changes. Draft pending hosted validation and independent review.

PR254 exact-head CI38173157008 passed1094 Chromium and24 Firefox/WebKit plus fast/database/production/final verify; Ready and unmerged without independent approval. PR255 8b8d9841a49f4269133d78a32cf4487c163fbe8d has successful fast/database/production; browser remains running in CI38174787641. Local composition of #241/#247–#255:527 unit tests passed, six database skips; lint/typecheck passed. PR215 review map records the unresolved development-only braces advisory (no patched release), runtime-prune proof and no confirmed public-input path. No independent reviewer identity established; never invent one or self-approve.

# ChatGPT release-hardening checkpoint — 2026-10-07

Ownership `CHATGPT_ACTIVE`. Frozen integration candidate: `9bd04887cb57c28a73f201f8a5c7002657f2b427`, tree `7c42f5b8b452b16f2aea698a8068baf57a969009`. PR #197 patched source-map-js CVE-2026-93749; PR #198 patched current brace-expansion/Sharp production advisories and added fail-closed `npm audit --omit=dev --audit-level=high`; PR #199 moved GitHub first-party actions to Node-24 releases, promoted Prisma CLI to the legitimate runtime dependency set and pruned dev tooling from the Docker runtime. Exact PR #199 CI #2382 passed fast/database/browser/verify; final merge push CI #2383 passed fast/database/production/verify with JavaScript 806040/819200 bytes and CSS 346301/348160 bytes. The PR #199 tested head and final integration merge have an identical Git tree.

Exact Railway preview deployment `c2b5327d-94ee-49f6-b10c-d7f70673a1fa` is SUCCESS on `9bd04887...`, 1/1 online with zero warning/critical notifications. Pre-deploy ran `node prisma/railway-predeploy.mjs`, found 15 migrations and none pending, completed release preparation and passed `/api/health/ready`. Production remains untouched on main `29c7627ed3bffd0b581935c5b934ad903aeca2cd`. PR #104 remains Draft. PR #195 route-level loading boundaries was closed as a regression branch after 41 browser failures including CLS ~0.814.

Final readiness normalization is on branch `docs/final-release-evidence-20261007`. Release-scoped non-applicable gates: no new unreviewed programme media, no legitimate live appeal, no legitimate live refund target. Genuine unresolved gates: Resend/email acceptance, human rendered accessibility review, final human editorial/social judgement, real Railway Rollback rehearsal, main branch protection and formal production promotion. Resend domain changed from failed to pending on 7 Oct and a fresh verification was triggered; all four records remain pending at last check. Main remains unprotected with no ruleset.

Railway environment contains one non-destructive staged no-op patch `45c0bc6c-46db-4ed8-82cb-3a8f02dfb483`: production preDeployCommand current→identical current and timeout 60→60. It has no live effect. The connected Railway API exposes no discard operation, so remove it in the dashboard before cutover; do not Accept & Deploy merely to clear metadata.

Protected behavior: main/production not to be changed before readiness gates and explicit production authorization; no dummy appeal, real-money payment/refund, beneficiary submission or unreviewed public media; no JS/CSS budget increase; provisional 12A/12AB and 80G wording; no FCRA claim; Islamic Companion remains bottom-right.

---

# ChatGPT emergency takeover — 2026-10-05 16:32 IST

Ownership `CHATGPT_ACTIVE` by explicit owner handover after Codex/Work interruption. Continue existing PR #167 on `fix/all-route-audit-20261005`; do not start a competing branch. Verified remote head before takeover: `bd4feedb9fb41a60ad2b6b9f40b06c8c11cf59db`, base `phase-public-site-rebuild` at `2caccb9fb83424f75a4c78ffa4c9339ae2e15ad7`. PR is open, mergeable and unmerged. Main/production PR #104, production indexing, Live Razorpay/payment/refund actions and factual/media locks remain protected.

Latest remote CI run 37290562293: plan, fast and isolated database jobs passed; browser acceptance completed 1076/1078 with exactly two failures, both complete-page audit containment for `/admin/notifications` at mobile and desktop. The last remote containment patch is `bd4feed…`; this failure remains unresolved remotely and must be reverified/fixed, not waived.

The immediately following owner screenshot batch was partially implemented in the interrupted local workspace but was not pushed after `bd4feed…`. Reconstruct on this same branch from repository truth and the owner's latest directives: narrow all slant separators to ~2px; remove text truncation across widths; elevate Areas of Service styling; remove specified left gold separators; add polished glossy hover/focus treatment with reduced-motion safety; restore individual gallery images into the relevant carousels; correct dropdown padding; ensure WhatsApp opens a new tab; apply these patterns consistently site-wide. Preserve the fixed bottom-right Islamic Companion, approved background/media architecture, canonical facts/content, accessibility, performance caps and responsive containment.

Next atomic actions: inspect exact current source for the screenshot surfaces and shared primitives; implement reconstructed fixes plus the remaining notification containment defect; add/adjust focused regressions; then run/trigger scoped checks before the full PR gate. Do not claim complete AAA or defect-free status from automation alone.

---

# Complete route/state UI audit — 2026-10-05 IST

Ownership `CODEX_ACTIVE`. Owner requests every site page receive the same audit, including dynamic children and protected operational states. Atomic branch `fix/all-route-audit-20261005`, verified integration base2caccb9fb83424f75a4c78ffa4c9339ae2e15ad7. Only draft PR104 is open; main/release promotion protected. Build an explicit source route/state inventory, inspect actual desktop/mobile public renders and isolated admin/private journeys, fix confirmed defects, preserve factual copy/approved media/design and unchanged performance caps. Shared polish alone never counts as page-specific review. New complete inventory must distinguish source review, visual review, browser interaction and isolated-state evidence; unknown/unavailable states remain explicit. No subagents, real payments, beneficiary submissions or live staff mutations.

PR167 diagnostic head3c3de5786f20c44454247d9828958fb44af10469 / CI37230459929 completed237 passing and38 failing checks. All60 source page templates have matching desktop/mobile capture;87 routed views plus root interruption per device. Contrast and admin scroll focus findings now fixed locally, homepage editor banner standardized, private acknowledgement429/503 retry and receipt wrapping fixed. Twelve local receipt/recovery/interruption checks pass;440 unit and31 planner checks pass. Final complete acceptance/deployment remains pending; no claim of all-page pass or AAA certification. See ALL_PAGE_UI_AUDIT_2026-10-05.md.

---
# Sitewide experience polish — three batches delivered, 2026-10-05 IST

Ownership `IDLE` for this delivered batch. PR163 shared Motion/Lenis, contrast, navigation crash and compact menu containment fixes; PR164 programme closing alignment; PR165 continuous umbrella lattice are merged to `phase-public-site-rebuild`, deployed and live verified. Main and draft PR104 remain protected; live environment remains staging with test payments. Prior entries below are historical checkpoints.

PR163: CI37225113277 passed 888 Chromium and24 Firefox/WebKit checks without retries; integration37226470652 and exact-source Railway08ff3623-78b7-439a-ac13-5a087ab9a5ea succeeded. Six live contrast/navigation checks passed. PR164: CI37226550562 passed479 focused Chromium checks without retries; integration37227379178 and Railway58157547-5387-467a-85e7-a43de73b48f0 succeeded on merge2ec02ceb4505b3853f324f338a73a38e145af9f6/tree1240ae48ff8bd98517051f488606e84459f47734.

PR165: tested head f223b69b5b05fc9608b475ce9c37c5f90a644f28; merge2405a8f10ac57737ff88071fa155b5739bdda9da; local/remote/tested/merged tree9be0b0249a87a47885563d4eb4e140737e1a5ca5 identical. CI37227916057 passed74 focused checks without retries in2.0minutes; integration37228293890 and Railway5388b090-53b9-4e81-a0e5-e0d6a5a2ec51 succeeded. Live version confirms exact merge. Four final live Eid/auto-rickshaw checks at390/1440px pass: single continuous parent lattice, transparent child sections, correct left title/right desktop actions and20px mobile gap,56px desktop heading cap, no overflow or page errors. Final static JS818952/819200 and CSS346731/348160 bytes, caps unchanged.

Bounded review:78 capture metrics clean and overview/form/programme/footer families inspected. Live background failures on the initial umbrella review were genuine, documented and fixed in PR165; the final rerun passed. Legacy quick-link hover padding warning was an overridden selector, with no measured layout shift. No complete AAA certification or whole-site defect-free claim; human screen-reader/zoom review and separately tracked route/private-state review remain in the inventory. No pending code change or active writer in these batches. New confirmed defects use an atomic branch. See SITE_EXPERIENCE_POLISH_2026-10-04.md.

---
# Sitewide experience polish — programme pattern follow-up, 2026-10-05 IST

Ownership `CODEX_ACTIVE`. Shared batch PR163 and programme alignment PR164 are merged, deployed and exact-version verified. PR163:888 Chromium +24 Firefox/WebKit checks passed; integration37226470652 and Railway08ff3623-78b7-439a-ac13-5a087ab9a5ea green; six live contrast/navigation checks passed. PR164:479 focused Chromium checks passed without retries; integration37227379178 and Railway58157547-5387-467a-85e7-a43de73b48f0 green on merge2ec02ceb4505b3853f324f338a73a38e145af9f6/tree1240ae48ff8bd98517051f488606e84459f47734. Live individual detail alignment passes at390/1440px; umbrella closing geometry passes, but live background checks exposed the legacy alternating paper surface restarting the lattice on umbrella pathways.

Active atomic branch `fix/programme-continuous-pattern-20261005`: make the canonical parent background rule outrank the legacy alternating surface, with Eid/Taleem umbrella regressions. Finish scoped CI and exact-source deployment before closure. Approved media/copy/colors, main and draft PR104 remain protected. This is no AAA certification or whole-site defect-free claim.

---
# Programme closing alignment — published 2026-10-04 UTC

Ownership `CODEX_ACTIVE`. PR164 on `fix/programme-closing-alignment-20261004` validates the remaining programme closing alignment using the existing body heading grid. Initial head `2e2d6c130651e427b2188e8b15e0cf81f2396841`, tree `0ce66f6ef162ec1455beb07ec486359220ba0e6f`; seven local responsive/axe fixture checks and30 planner checks pass. Next action: finish seeded focused CI, merge once green and verify exact-source Railway deployment. Main and draft PR104 protected.

PR163 merged as `cb3cf8b90f2e76044669e500410a2f0c7d3de68d`. Exact tested head `8ff82a0757d72526a57b9aadf1498bef09c7df16`; tested/local/remote/merged tree `04797598d2dd5743717193bd1686e7f2a2e896ae`. CI37225113277 SUCCESS:888 Chromium checks without retries in16.5minutes,24 Firefox/WebKit checks in34.2seconds, fast and isolated database jobs green. Mobile hidden-link Motion crash, five contrast families and compact fine-pointer menu background scroll resolved. Shared Motion/Lenis delivery awaits integration build/Railway/live verification.

---
# Sitewide experience polish — 2026-10-04 IST

Ownership `CODEX_ACTIVE`. Branch `feat/site-experience-polish-20261004`, base `ad1a9941f087297235492795f9ac42c82e2cd557`. Owner delegates page-by-page/batched implementation of motion, micro-interactions, smooth scrolling, responsive/accessibility and performance polish. First inspect all routes and shared foundations, preserve approved brand/content/media and protected main/draft PR104. Motion respects reduced-motion and content remains available before hydration; keyboard/touch/nested scrolling stays native. Keep existing bundle ceilings, verify dependency lifecycle and full shared-system acceptance. Do not claim AAA certification from automated tests. No delegation.


PR163 remains open and undeployed. Resumed from head96733dfeedd20bc7edd66da90a532d39928d0051. Initial seeded CI37215501401 exposed five contrast failures and a mobile route crash: Motion committed styles after a menu link became hidden. Replaced stop with cancellation; strengthened regression against page errors/global interruption fallback; moved legacy text colors to approved contrast tokens. Corrected CI and delivery pending; main and draft PR104 protected.

---
# Initiative photo banners and detail polish — delivered 2026-10-04 IST

Ownership `IDLE`. PR161 merged into `phase-public-site-rebuild`. Tested head `f13ab2a8b3b67192242b8b8f4688d97a980fcba6`; merge `3f7d5e88b16a6c981b2ef59b3e2c0cef65e0a41e`; tested/local/remote/merged tree `df9068cf20bb2266114e5ecd6762f0c9d0a1f532` identical. CI37205921770 SUCCESS:571 focused Chromium checks passed in8.6minutes without retries. Local417 unit checks and29 planner checks pass. Integration37206621914 SUCCESS: production build, JS813541/819200 and CSS345943/348160 budgets and server smoke; duplicate browser/database work skipped.

Railway `74bfba5c-e91d-4f43-9646-63a9d3fd8e55` SUCCESS on exact merge. All30 published initiative pages verified live on desktop:22 single-photo headers, four umbrella collages and four no-media fallbacks; every selected image loaded, one H1, display-serif story heading, narrative reaching shell right edge and no horizontal overflow. Auto-rickshaw page uses its existing landscape vehicle photograph with blended edges; all three gallery originals remain. Pale gold/blue cards retain continuous lattice. Six-width responsiveness/mobile axe verified through isolated CI geometry fixtures; live review does not claim all mobile photo crops were inspected. Final live banner proof inspected and saved.

Selection uses existing published/privacy-approved assets, excludes collage derivatives on individual pages, and leaves other discovery identity selection unchanged. No generated beneficiary imagery, new dependency, schema/payment/email/factual edit or bundle ceiling increase. Main/draft PR104 remain protected. Current task complete; new confirmed defects require a new atomic branch. See INITIATIVE_BANNERS_2026-10-04.md. Documentation closure branch `docs/initiative-banners-delivery-20261004`.

---

# Site regression audit — delivered 2026-10-04 IST

Ownership `IDLE`. PR159 merged to `phase-public-site-rebuild` after full acceptance. Tested head `8ddb7cb4ae640e8d728ec1e95f0d43f71672e43e`; merge `c4bddf7db9e579d14c7ff4a72b6daee9b8a0cd63`; tested/local/remote/merged tree `f8c1d1097f41533d9e49db1aa93f13f89deb0024` identical. CI37202065296 SUCCESS:842 Chromium checks in10.8minutes and24 Firefox/WebKit checks in22.2seconds, no retries; fast and isolated PostgreSQL checks pass. Integration37203377607 SUCCESS: production build, JS813541/819200 and CSS344253/348160 budgets, server smoke and database checks; duplicate browsers skipped. Local414 unit checks and28 planner checks pass.

Eight confirmed defects resolved: tracking hydration; failure/retry states preventing duplicate requests; false confirmation without credentials; client-navigation credential timing; automatic carousel announcements; legacy contact markers; mobile Highlights keyboard access; seasonal image/title overlap. Final mobile home and seasonal native-size captures inspected; all78 named-route capture metrics clean. Earlier89 overview captures inspected; additional17 nested annual/education programme routes reviewed live on desktop for substantive copy, single H1,56px body H2 ceiling, containment and no clinical section. That additional review does not claim all17 were manually reviewed on mobile.

Railway `e8c2440c-54bd-4b7e-a33f-1143a705edf8` SUCCESS on exact merge. Live seasonal image/title gap54.515625px and no overflow; six contact SVGs; correctly hydrated missing-link status/confirmation and no new first-party hydration error; Highlights named focusable region with3px visible outline. Live desktop proof saved. Full submit/retry, protected operational and payment/security journeys use isolated tests; no real donation/refund, beneficiary submission, email or staff mutation performed. Main/draft PR104, canonical facts/media, approved brand patterns/typography, Companion and bundle ceilings preserved. No pending code change in this batch and no whole-site defect-free claim. See SITE_REGRESSION_AUDIT_2026-10-04.md. New confirmed defects use a separate task branch.

---

# Premium carousel controls and programme artwork — delivered 2026-10-04 IST

Ownership `IDLE`. PR157 delivered to `phase-public-site-rebuild`: tested head `6320b7d082b15164942831711d0a8bd9e2cccf85`, merge `d7ee5c64a9c317674d55df6a673b0701481cc0f0`; local/tested/remote/merged tree `90a2d98ff7cb1b0e00272bf1a68e5e1444cecf8c` identical. Final CI37161334707 SUCCESS:173 focused Chromium checks passed without retries in2.8minutes,414 units pass (six isolated-database fast skips),28 planner checks pass. Integration37161688907 SUCCESS: production build, unchanged JS811105/819200 and CSS344018/348160 budgets and server smoke; duplicate browser/database acceptance skipped.

Railway `8d91d45f-1674-47d7-8dc7-a0e811e06f36` SUCCESS on exact merge. Live desktop verification confirms hero slides2/4/5 new derivatives loaded,3 SVG hero controls48px, all5 umbrella card images loaded, emergency shared carousel full1184px width with27.26px display headings and44px SVG controls, relevant flood derivative/privacy blur and COVID branded fallback; seasonal full-width feature/winter imagery retained. Original gradient/pattern/fade, admin overrides, canonical links and Companion preserved. No desktop overflow on verified routes. Mobile/responsive proof is six-width local and seeded CI, not live cloud emulation. Two final live screenshots captured and inspected.

Initial acceptance171/173 passed; two legacy glyph-label selectors corrected to exact semantic labels and aria-hidden SVG checks. All3 gallery checks pass locally. Gallery test path initially selected unknown/full; explicit mapping and regression added, superseded run37161156585 automatically cancelled. Final planner confirms focused union and database skipped; unknown/core/auth/security and main-release paths still fail closed to full. Six authentic source-derived sibling WebP collages have source/output hashes and provenance; gallery originals unchanged. No separately identified COVID source exists, so its branded fallback remains. No database/schema/dependency/payment/email/indexing change. Main/draft PR104 protected. No whole-site defect-free claim. New confirmed defects use a separate task branch.

---

# Nine owner screenshot surfaces — 2026-10-04 IST

State: `IDLE` (delivered PR156; see final ledger). Historical branch `fix/owner-nine-surfaces-20261004`, base `67b3fc256f1f05c29ebde694ba830559f2e91444`. All nine supplied screenshots inspected. Scope Stories ethic pattern; Faith library width/editorial typography; Contact privacy pattern/closing contact icons; sponsorship closing placement; Partner areas; Compliance status/pending patterns and presentation. Preserve factual copy, approved assets, fixed Companion, original headers, unchanged budgets and protected main/draft PR104. Focused responsive/a11y and CI delivery.

---

# Homepage image edge blend and controls — 2026-10-04 IST

Ownership `IDLE`. Homepage edge blend and control refinements delivered through PR154. Tested head `a56bbbf0a4e05ea72be7e93dad4e5b92ea795bae`, merge `a9b84271bd0023106fb06a9faa5b3be67ab6bbf1`; tested and merged tree `0fed7715aa1e36241e309151feb2e13da38b2db8` identical. PR CI37149189924 SUCCESS:110 focused browser checks passed first attempt in1.6minutes. Integration CI37152618989 SUCCESS; duplicate browser/database work skipped. Production JavaScript810705/819200 and CSS348141/348160 bytes, unchanged limits.

Railway deployment `c33bffa1-0db0-4a00-8026-b4dff894b267` SUCCESS on exact merge. Live https://amaanafoundation.org/ verified all five image elements have intersecting side/bottom masks, all three cinematic controls have48px circular translucent surfaces and8px backdrop blur, original gradient/lattice remains, and no desktop horizontal overflow. Final live screenshot inspected and saved. Responsive/mobile proof remains the local14-check six-width validation and focused CI; live cloud proof is desktop. Programme content, crop, backend, fallback and carousel behavior preserved. No pending implementation in this atomic task. Main and draft PR104 remain protected. New confirmed defects use a separate atomic branch; no whole-site defect-free claim.

---

# Dynamic homepage carousel — 2026-10-03 IST

Ownership `IDLE`. Delivered PR152, tested head `9ef0f45ed0bd2bc1ca9fecc92f62640899effdf9`, merge `4d87df7c57eaaab070697fd1244193f9b7c63797`; tested/local/remote/merged tree `5a6493c8e80556bb46969f754f894fd88dab92c2` identical. Final PR CI37145322111 SUCCESS:745 Chromium checks in10.5minutes and24 Firefox/WebKit smoke checks in26.2seconds;414 units and isolated PostgreSQL migration/persistence/revision/rollback checks pass. First core run had736 passes/nine superseded banner expectations; updated assertions preserve gradient/image/edge/fade/grid/overflow/height requirements, final run no retries/flaky failures. Integration CI37146239534 SUCCESS, duplicate browsers correctly skipped; production JavaScript810705/819200 and CSS348088/348160 bytes, unchanged limits.

Railway review deployment `a86daec7-eb42-4992-9e30-ab6d94a16c49` SUCCESS on exact merge. Startup applied20261003180000_home_carousel successfully. Live https://amaanafoundation.org/ confirms five programme slides in requested order, loaded collage images, working dots/pause, original gradient/lattice, right media edge equals shell edge1266px at1363px viewport,60.8px header title, centered controls and no horizontal overflow. `/admin/home-carousel` redirects unauthenticated visitors to `/admin/login`; no signed-in live editor mutation is claimed. Admin action permission/revision/audit guards and persistence validated through unit/isolated database checks. Live has no open public appeal; automatic insertion/removal is verified through tests, not a fabricated live appeal. Responsive/mobile proof is local/seeded CI; cloud live proof desktop only. Final deployed screenshot saved. Five AI-assisted collage derivatives remain separate from original programme photographs, with provenance and meaningful alt text.

Main remains `1a69dd179181390a488623accf1314a1ff09e319`; PR104 remains open/draft (its integration head naturally follows the new merge). No production launch/payment/email/indexing promotion. Next: owner reviews deployed carousel; admin staff use Home carousel to manage slides. New confirmed defects use a separate atomic branch. Documentation closure branch `docs/home-carousel-delivery-20261003`. No whole-site defect-free claim.

---

# Homepage banner composition — 2026-10-03 IST

State: `IDLE`. Delivered PR150, tested head3ecc6b492350bc2cc0053e569917fd88967bb3de, merge7a471eb141b248b000ea73cfff5702cb0c2c43cd; identical local/remote/tested/merged treee5994a3f18163b3b864daf5076f99678352057fb. CI37137587817 SUCCESS:112 first-attempt Chromium checks in2.3minutes and392 units pass (six database-dependent fast skips). Integration37137964849 SUCCESS, duplicate browser/database skipped. Railway2a7bbb9a-f7ba-4a95-9122-a27c7626bc58 SUCCESS on exact merge. Live three-slide carousel, next/previous/pause, full subtitles,64px header title versus56px body cap,480px logo, continuous geometry, no desktop overflow and fixed Companion verified. Right-side approved identity-image fade implemented; current two featured slides have no approved identity header photos and use brand fallback. Six-width fit plus mobile/desktop axe passed. Shared React server-rendered banner composition; no new client library/database call. Production JS819181/819200,CSS344401/348160, caps unchanged. Updated stale legacy-button acceptance to canonical button foreground and selectors. Protected main/PR104 untouched. Policy separator PR149 also deployed/live verified on all four policy routes. See HOME_BANNER_COMPOSITION_AUDIT_2026-10-03.md. Next: owner reviews deployed homepage; only new confirmed defects require a new task branch.

---

# Policy trailing separator — 2026-10-03 IST

State: `IDLE`. Completed PR149. Historical task: branch `fix/policy-trailing-separator-20261003`, base ddbd4d9181c33d806d51746a6f46f7a5c9ace27e. Three owner screenshots show the trailing vertical rule after the third policy principle on Terms/Privacy/Refund. Donation Policy already suppresses it; generalize that existing shared rule to every policy page. Preserve internal dividers/content/backgrounds/responsive layout. Focused existing CI plus desktop/mobile border inspection; main/PR104 protected.

---

# Participation and Appeals pattern correction — 2026-10-03 IST

State: `IDLE`. Four owner screenshot corrections complete through PR146 and corrective PR147. Final head946d82652b52a0d68f5179f886b6bbc8a0d179ba, mergec4309f3f9b664f800e76046a0838d2364e4d9b08; local/tested/remote/merged tree48ab227d530fb03fa7531369550e35664525449b identical. Final CI37128498341 SUCCESS:134 Chromium first-attempt checks in1.8minutes;392 units pass with six database-dependent fast skips. Integration37128803878 SUCCESS; duplicate browser/database skipped. Railway reviewd2a78709-6a93-44cb-8888-4ea23d2deea8 SUCCESS on exact merge. Live two-route desktop checks confirm Get Involved, completed Appeals, dark review and privacy lattice; topmost dark pattern/normal blending, obsolete square absent,12px privacy label/56px title/20px action separation/no divider/no overflow. Dark review and privacy screenshots inspected. Six-width seeded CI and local Get Involved responsive/axe checks pass. Clean build JS819177/819200,CSS348149/348160, caps unchanged; no client JS added. Initial presence-only regression missed global opaque layering; corrected with topmost-layer assertion before final delivery. See PARTICIPATION_APPEALS_PATTERN_AUDIT_2026-10-03.md. Docs closure branchdocs/appeals-pattern-final-delivery-20261003. Main/PR104/artwork/factual copy/media/carousel/payment/Companion preserved. Next: owner reviews deployed changes; new confirmed defects use separate task branch. No whole-site defect-free claim.

---

# Owner surface polish — 2026-10-03 IST

State: `IDLE`. All 19 owner screenshot corrections delivered through PR144, merge `5c0e61c2390c5ca339a754af4550925d525df830`. Local/tested/remote/merged tree `12277a804c87e4b3253969aca22d801fac08531c` identical. Sponsorship process/closing/cards, assistance follow-up, canonical institutional grids/headings, partnership actions, compliance guardrails, policy principles/prose/security notice and approved lattice visibility corrected. PR CI37124521399 SUCCESS:586 Chromium checks passed first attempt in9.6minutes. Integration CI37125268532 SUCCESS; exact-tree acceptance reused, duplicate browser/database skipped. Local15 responsive/navigation checks,24 planner regressions, build/types/lint and design detector pass. JS819181/819200,CSS347615/348160; caps unchanged, CSS smaller than baseline.

Railway review deployment `c4b2596f-9d41-47f9-9dc4-3ec54525096d` SUCCESS on exact merge. Live desktop checks cover all11 affected routes: sponsorship number absent/title38.164px/equal CTA baseline/restored pattern/right closing; four policy prose columns734.234px full width, lighter summaries and shield notice; governance/reporting rows1184px full shell; recognition heading1184px; partnership separator gap32px; assistance rows84.1875px/no shadows; compliance572px+572px with lattice; no horizontal overflow. Responsive proof is local/seeded CI, not cloud viewport resizing. Source/legal/factual/payment/form/media/artwork/Companion contracts preserved; protected main/PR104 untouched. See OWNER_SURFACE_POLISH_AUDIT_2026-10-03.md. Documentation closure branch `docs/owner-surface-delivery-20261003`. Next: owner reviews the deployed fixes; subsequent confirmed defects use a separate atomic branch. No whole-site defect-free claim.

---

# Donate and sponsorship screenshot correction — 2026-10-03 IST

State: `IDLE`. Task completed through PR142, merge `e20149276b6bb864c082f5a15b718eeeec85bc4a`. Donate section1 now matches section2's canonical grid/font; Sponsor Education supporting copy uses body typography/top alignment. PR CI37117208040 SUCCESS:103 first-attempt Chromium checks in1.9minutes, including six widths320/390/768/1024/1440/1920. Integration CI37117505771 SUCCESS; duplicate browsers skipped by exact-tree acceptance. Local typecheck/build/lint (one existing importer warning), detector and23 planner checks pass. JS819181/819200,CSS347746/348160; caps unchanged.

Railway review deployment `f58aa5cc-5729-4f35-ba59-35bed9156977` SUCCESS on exact merge. Live desktop Donate confirms both headings40.89px,left82px; both copy columns643.11px. Sponsor lead changed from40px Georgia/70px line-height to18.88px Arial/33.04px, equal column tops1657.75px and no overflow. Responsive proof is seeded CI; live browser is desktop. See DONATE_SPONSORSHIP_LAYOUT_AUDIT_2026-10-03.md. Source/query/payment/copy/artwork/Companion unchanged. Only protected production PR104 remains; no main promotion. Next: owner continues observations; new confirmed issues use a separate task branch. Documentation closure branch `docs/donate-sponsorship-delivery-20261003`.

---

# Latest delivery — section hierarchy and alignment — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration: `phase-public-site-rebuild`. Implementation/CI/review deployment complete. Documentation closure branch `docs/section-hierarchy-delivery-20261003`.

Completed: body display H2 cap3.5rem across shared and legacy route rules; homepage banner titles exceed body display headings, max4rem; shared homepage title-left/description-right introduction; full-shell closings with right-column supporting copy and aligned actions, mobile stacking; block evidence headings above their labels; wider heading measures. Corrected short Contact closing copy specificity and pre-existing390x844 menu backdrop reachability with a3rem dismiss strip. Approved artwork/content and fixed Companion preserved.

Validation: final24 local responsive/keyboard/scroll/WCAG/Contact/backdrop regressions pass.392 units pass with six database-dependent skips,22 planner and editorial checks pass; lint one existing importer warning. Exact-head PR CI37107270067 SUCCESS:706 Chromium first-attempt checks in10.0minutes and24 Firefox/WebKit smoke checks in51.3seconds. Initial PR CI37106160672 had698pass/3fail; two task-introduced Contact alignment failures and one pre-existing backdrop failure fixed without disabling assertions. Production build/types/coverage/database/server smoke and unchanged budgets green:JavaScript819181/819200,CSS347689/348160. Integration CI37108057516 SUCCESS; exact-tree PR browser acceptance reused, browser job skipped.

Delivery: application PR [#140](https://github.com/immazhark/amaana-platform/pull/140), final head `69f93b5e3ace613a4e5ec16daab598354e7efc52`, merge `3d83e2df7ba5a80687d95d04903c3ed731b7aa7d`; local/tested/remote/merged tree `45cbb6609900ab6c3c72ae66bb98582f1af4cdba` identical. Railway review deployment `e78d725e-3399-410f-aee9-ef12739c2514` SUCCESS on exact application merge. Main/production PR104 remains protected.

Verification limit and next action: desktop/mobile local captures inspected and seeded real-route CI passes. Live /our-work was reachable before deployment, but post-deployment reload failed because the execution environment disconnected (409 environment_offline). No post-deployment live visual confirmation is claimed. Workspace/local checkout refresh also became unavailable. Restore the workspace connection, fetch latest rebuild integration/documentation before any writes, then verify deployed Home/Our Work/Stories/Impact/Contact geometry. No application change or full-suite rerun is needed solely to resume live verification. See SECTION_HIERARCHY_AUDIT_2026-10-03.md. No whole-site defect-free claim; canonical factual/privacy/payment/media/indexing locks preserved.

---

# Latest delivery — Companion panel accessibility — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration: `phase-public-site-rebuild`. Expanded Companion task complete; documentation closure branch `docs/companion-panel-delivery-20261003`.

Completed: labelled tab IDs/shared content panel, roving Tab order, ArrowLeft/Right wrapping and Home/End activation;44px tabs/source controls; scoped panel bounds below sticky chrome and above the existing fixed dock. Normal-height panels flex the scrolling content, short windows scroll the whole panel. Removed unused immutable reminder state, unused refs and delayed focus scheduling; reused static line icon. Fixed dock location, approved visuals/source text and prayer/date/API behavior unchanged.

Verification:25 local responsive/keyboard/header-navigation/WCAG/retry/reachability checks pass in39.9seconds across seven widths and short/tall windows.392 units pass (six database-dependent skips),22 planner regressions pass; fresh build/types/lint green (one existing import warning; two dead-ref warnings removed). Detector emitted no findings before final static-icon optimization. Initial failures classified as stale generated output, alert-locator ambiguity and real subpixel tablet dock overlap; source/test fixes completed without suppressing failing requirements. JavaScript819181/819200 and CSS347670/348160 bytes, unchanged caps.

Delivery: PR [#138](https://github.com/immazhark/amaana-platform/pull/138), tested head `b94d81bec44b368ff584b8a1dab3f0bb2d679c75`, merge `7d2e3ffe62bf284eee5b18e25459e9a6b5dc46ce`; local/tested/merged tree `770db4f9d7496143e6e0c971a87c4cdb20063692` identical. PR CI37101750482 SUCCESS:65 Chromium first-attempt checks pass in1.5minutes. Integration CI37102025429 SUCCESS: exact-tree browser acceptance reused, duplicate browser/database skipped, build/budgets/coverage/server smoke green. Railway review `32edc17f-2650-4358-9954-53549444a074` SUCCESS on exact application merge SHA.

Live desktop /about screenshot/accessibility/DOM confirms44px tabs, actual IDs, selected-only Tab order, named content, real Right/Left activation/focus, panel top145.61px below81px header and bottom849.61px above865.20px dock, fixed Companion, no horizontal overflow. Escape removes the panel and restores dock focus/expanded=false. Mobile/tablet/short-screen proof is local/seeded CI; live cloud-browser viewport resizing not claimed. See `COMPANION_PANEL_AUDIT_2026-10-03.md`.

Next: owner continues UI observations; new confirmed defects use a separate atomic task after incoming checks. Main/production PR104 remains protected. Canonical factual/media/privacy/payment/indexing and fixed Companion locks preserved. No whole-site defect-free claim.

---

# Latest delivery — shared navigation resilience — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration: `phase-public-site-rebuild`. Atomic shared-navigation task complete; documentation closure branch `docs/navigation-audit-delivery-20261003`.

Completed: corrected 760/1020px backdrop breakpoint mismatch, locked background scrolling only while mobile navigation is open, cleared stale menu state on desktop resize with visible home-link focus, and used shared chrome-height/dynamic viewport tokens for short-screen reachability. Reused immutable links for keyboard wrapping; dismissal restores focus without unnecessary animation-frame scheduling. Approved design, banners and fixed Companion unchanged.

Validation: final 11 local responsive/keyboard/header-WCAG checks pass across five widths/two heights; 392 units pass (six database-dependent skips), 21 planner regressions pass. Production build/types/lint pass (three existing warnings). UI audit detector has no emitted findings. PR CI 37099076391 SUCCESS: 57 Chromium checks pass on first attempt in1.5minutes. Integration CI 37099358020 SUCCESS; exact-tree PR acceptance reused, duplicate browsers/database skipped, build/budgets/coverage/server smoke retained. JavaScript819175/819200 and CSS345824/348160 bytes, caps unchanged.

Delivery: PR [#136](https://github.com/immazhark/amaana-platform/pull/136), tested remote head `52fa5a362270cf2a52f9408cdbfa65b48e9d5dc4`, merge `838bf7d7519cf50996cf49c51f084eb78a39c31a`; both tested and merged tree `d2cdefbfba7bf12fec6607a64c845dcd38e3a88d` matches local tree. Railway review deployment `79349c3e-b715-4e54-8aef-3f5c28fc2621` SUCCESS on exact merge SHA. Live desktop /about screenshot/DOM confirms loaded header CSS Module, menu hidden/expanded=false, body overflow visible, no horizontal overflow, approved gradient/geometry/Arabic branding and fixed bottom-right Companion intact. Mobile/tablet and short-screen proof is local/seeded CI, not live cloud-browser resizing.

Next: owner continues UI observations; new confirmed defects use a separate atomic branch after incoming checks. No claim that the entire site is defect-free. Main/production PR104 remains protected. Canonical factual/media/privacy/payment/indexing locks preserved. See `UI_NAVIGATION_AUDIT_2026-10-03.md`.

---

# Latest delivery — assistance progress and actions — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`.

Completed: readable branded current/upcoming assistance progress at14px with44px controls; disabled semantics preserved. Corrected CSS Modules selector for global forward button, restoring desktop right alignment and explicit mobile full-width stacking. Removed duplicate local progress declarations. Form/validation/submission/permission logic unchanged.

Validation:19 local browser checks pass in47seconds, covering24 step/viewports at320/390/768/1024/1440/1920 with WCAG A/AA axe, action geometry, genuine keyboard traversal/focus and retained values; seven existing private assistance journeys pass. Build/types/lint (three unchanged warnings),20planner/content/editorial/global CSS/diff guards pass. Detector finding is only unchanged privacy-note emphasis. Initial default axe best-practice advisory and test focus timing corrected in coverage/method, not suppressed application failures. See ASSISTANCE_PROGRESS_AUDIT_2026-10-03.md.

PR [#134](https://github.com/immazhark/amaana-platform/pull/134) merged asf72eca09957a63e9f7b922563484977b7f8bbb1c. Exact tested remote head3d9ac4705d643f93d914d4337d6a8045b8050783 matches local treeed649737de03c5d1b2ecf55a4e03564daf38f342. PR CI37054686962 SUCCESS:68 Chromium first-attempt pass in2.2minutes,392 unit checks pass (six database-dependent fast skips). Integration push37055303488 SUCCESS; exact-tree browser acceptance reused, duplicate browser/database skipped; production build/budgets/coverage/server smoke green.

Railway review deploymentd43c96f0-3698-46fb-94e9-64994a923bb4 SUCCESS on exact application merge SHA. Live desktop /request-assistance#request-form screenshot/DOM verifies all four progress labels14px,44px targets, opacity1, muted upcoming surfaces with real disabled attributes, active blue surface, forward action right-gap0 and no horizontal overflow. Local/seeded tests cover six widths and all four steps; live verification is desktop. JavaScript819031/819200 and CSS345202/348160, caps unchanged.

Task complete, ownership IDLE. Next: owner continues UI observations; subsequent confirmed defects use a separate atomic branch. Protected PR104/main release, canonical facts/copy, approved artwork, media/privacy/payment/indexing and fixed Companion preserved. No claim of a defect-free whole website. Documentation closure branch docs/assistance-progress-delivery-20261003.

Older entries below are historical.

---

# Assistance progress and actions audit — 2026-10-03 IST

State: `CODEX_ACTIVE`. Branch `fix/public-controls-20261003`, verified integration base `b8d75553b254705baabd42f4a0f80f57a406ddcc`. Owner authorizes continued UI/UX checking and fixes. Only protected production PR104 is open. Confirmed live assistance progress labels12.16px and disabled opacity.48; CSS-module action selector does not match global v2-button, leaving desktop forward action left-aligned. Mobile global rules currently mask width mismatch. Scoped presentation fixed;19 local browser checks pass across24 step/viewports and seven private journeys. Build/types/lint/content/CSS guards and20planner checks pass, CSS345202/JavaScript819031 within unchanged caps. Publish/CI/merge/exact review delivery next. See ASSISTANCE_PROGRESS_AUDIT_2026-10-03.md. Preserve canonical content, artwork, payment/privacy/indexing and fixed Companion.

---

# Latest delivery — policy navigation and accessibility — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`. Application PR [#132](https://github.com/immazhark/amaana-platform/pull/132) merged as `5e505ce4758f7cf8ed6fd6d4a0a7538e1e509ab4`; exact tested task head `0bf13028804bdb67045c41ef660d66eb65329b08`, tree `77b4c8175cc11072c3d7108a098bbf99157d79ab`. Documentation closure branch `docs/policy-audit-delivery-20261003`.

Completed: native policy headings clear sticky chrome; full-width 44px contents targets, keyboard focus and responsive breakpoint parity restored; long desktop contents scroll within short viewports. Restored missing global sr-only utility for Privacy, navigation-loader and private notification labels without removing their accessibility names or changing legal content/action behavior.

Validation: nine local browser tests pass across 24 policy page/viewports at320/390/768/1024/1440/1920 with full axe, real keyboard jumps, direct fragments, short1440x600 sidebar reachability and delayed-loader states. Build/types/lint (three unchanged warnings),20 planner regressions, content/editorial/global CSS/detector/diff checks pass. PR CI37050971480 SUCCESS:657 Chromium checks passed on first attempt in10.4minutes;24 Firefox/WebKit smoke checks pass;392 unit checks pass with six database-dependent fast skips; isolated database verification passes. Shared accessibility CSS correctly retained full acceptance; policy-only paths now have focused coverage.

Integration push CI37052641854 SUCCESS: exact tested tree preserved and duplicate browser suite skipped; production build, coverage, database and smoke checks green. Unchanged caps: JavaScript819087/819200; CSS345331/348160.

Railway review deployment `4652b782-1492-4c60-8601-531c4e83f729` SUCCESS on exact application merge SHA. Live desktop Privacy #policy-03 screenshot/DOM confirms target heading152.33px below header bottom81px, full-width312px contents rows at least44px, viewport-bounded scrolling sidebar, clipped1px sr-only label still present in named accessibility region, and no horizontal overflow. Six-width/mobile/short-screen coverage is local/seeded; live proof is desktop.

Current task: complete. Next: owner continues UI observations; next agent inspects new confirmed defects in a separate atomic branch. Private authenticated staff-record states were not opened. Preserve canonical factual/media/privacy/payment/indexing gates, approved artwork and fixed Companion. Production PR104/main promotion remains protected. See POLICY_NAVIGATION_AUDIT_2026-10-03.md. Older entries below are historical.

---

# Policy navigation audit — 2026-10-03 IST

State: `CODEX_ACTIVE`. Branch `fix/policy-navigation-20261003`; verified integration base `e81ba99fef5455f8d065853993d5e2b8adc4e6d6`. Owner requests continued checking and correction. Only protected production PR104 is open; no competing writer. Confirmed deployed Privacy contents links are30px high and #policy-03 settles with its heading at47.56px beneath81px sticky header. Fix shared policy navigation and anchor offsets across Privacy/Terms/Donation/Refund without changing legal content. Inspect short-screen sidebar reachability and breakpoint parity. Policy anchor/link/sidebar/breakpoint corrections and missing shared sr-only utility implemented. Nine local browser tests pass across24 policy page/viewports, full axe, short-screen/fragment and delayed-loader scenarios. Build/types/lint/content/global CSS/detector and20planner checks pass; JS819087/CSS345331 within caps. Shared accessibility correction intentionally retains full exact-head acceptance. Publication/CI/integration review delivery next. See POLICY_NAVIGATION_AUDIT_2026-10-03.md. Preserve approved media/backgrounds/factual/privacy/payment/indexing and fixed Companion.

---

# Latest delivery — follow-up UI audit — 2026-10-03 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`. Application PR [#130](https://github.com/immazhark/amaana-platform/pull/130) merged as `2044bf97364674e89c9fe558ea6808999d49892b`; exact tested task head `93ee64399a30f834314c5cc56627e45231b7f38e`, tree `73b95c7c3cdf917871ac4e936bd247335e8a9563`.

Completed: corrected Request Assistance Before/After checkerboard bands caused by inherited tiling sizes applied to legacy gradients; restored approved lattice/body surfaces and shared Before heading. Retired corresponding route overrides. Previously blocked state, Contact/Faith and Impact/Our Work surface verification resumed. Canonical content/privacy/payment/media/indexing, approved SVG bytes and fixed Companion preserved.

Validation: build/types/lint (three unchanged warnings),18 planner regressions, content/editorial/SVG/CSS guards and detector pass. All14 local browser checks pass: six widths with full-page axe plus eight private assistance journeys. Desktop/mobile captures inspected. Initial local full Chromium failure was workspace socket permissions; the installed pinned headless runtime resolved it. Final PR CI37047981721 SUCCESS:62 Chromium checks passed on first attempt in2minutes;392 units pass, six database-dependent fast skips. Integration CI37048619969 SUCCESS; exact-tree PR browser acceptance reused, duplicate browsers/database skipped. JS819087/819200 and CSS344667/348160; caps unchanged.

Railway review deployment `7ee3334c-dbf2-45a1-81d3-83217b0c4cb7` SUCCESS on exact application merge SHA. Live /request-assistance DOM and screenshot confirm approved dark lattice with repeat/no-repeat104px/100% layering, shared split heading, approved After body background and no horizontal overflow. Local/seeded tests cover320/390/768/1024/1440/1920; live verification is desktop. See UI_FOLLOWUP_AUDIT_2026-10-02.md.

Current task: complete. Next: owner continues UI observations; no failing required task checks remain. Authenticated private staff-record states were outside this public audit. Production PR104/main promotion and separate release gates remain protected. Older entries below are historical.

---

# Follow-up UI verification — 2026-10-02 IST

State: `CODEX_ACTIVE`. Branch `fix/ui-followup-audit-20261002`; verified integration base `f5458a98188fb8deed78b07a6fad0191453c1d9c`. Owner requests continued inspection and correction of existing issues. Browser/workspace access restored. No competing task PR; production PR104 remains protected. First inspect previously blocked deployed states and evidence closings, then forms/navigation and confirmed legacy conflicts. Preserve approved design, canonical facts/media/privacy/payment/indexing and fixed Companion. Confirmed assistance Before/After repeating-gradient defect and bypassed heading fixed. Build/types/lint, 18 planner tests, content/SVG/global CSS guards pass; JS819087/CSS344667 within unchanged caps. Local browser launch infrastructure-blocked, no responsive success claim. Focused seeded CI, merge and exact-source review deployment pending. See UI_FOLLOWUP_AUDIT_2026-10-02.md.

---

# Latest delivery — UI consistency and legacy-rule audit — 2026-10-02 IST

State: `IDLE`. Outgoing: Codex; incoming: next available implementation agent. Integration `phase-public-site-rebuild`. Application PR [#128](https://github.com/immazhark/amaana-platform/pull/128) merged as `c670a94239aeeed83a72c74b6ce5338a630aeb20`; tested task head `b60aa42e8e8002095c9bdbdf6ed800207a6710c8`. Documentation closure branch `docs/ui-audit-delivery-20261002`.

Completed: fixed state/receipt legacy white text and oversized typography on light L1 banners; readable Home secondary hover/focus; shared Contact social heading; approved Contact/Faith body backgrounds; explicit responsive Impact/Our Work evidence closing layouts and Impact section gap; visible dark closing geometry; removed retired intent-card rules/animations. Canonical narratives/figures, media, privacy, payment behavior, approved SVG bytes, indexing gates and fixed bottom-right Companion preserved.

Validation: all30 canonical live initiatives and four category overviews opened; static public desktop/mobile and six-width local regressions inspected. Build/types/lint/editorial/CSS guards and17planner regressions pass. Final PR CI37036140425 SUCCESS:153 Chromium cases pass on first attempt in3.9minutes;392 unit checks pass (six DB-dependent checks skipped in fast, browser environment seeded). Specific mappings avoid the unrelated398-case whole-site shell matrix:153 selected instead of554. Shared global/unknown/core paths and releases retain broad/full acceptance. Carousel and keyboard-focus checks await actual geometry/focus without relaxing requirements.

Integration push CI37037096503 SUCCESS: production build and unchanged budgets, JS819087/819200 and CSS344368/348160. Exact tested tree retained; duplicate task browsers skipped. Railway review deployment `2d1e38aa-b97f-4694-9920-5243d2e5f310` SUCCESS on exact application merge SHA `c670a94239aeeed83a72c74b6ce5338a630aeb20`.

Current implementation task: complete. Next action: owner continues UI review; when browser/workspace reconnects, inspect deployed confirmation, Contact/Faith body patterns and Impact/Our Work evidence closings. Final live screenshot was blocked by409 environment_offline after merge; no post-deployment screenshot/rendered verification claim is made. Private staff-record states remain outside this public audit. Production PR104 stays protected and automatically runs its separate full release acceptance when the integration head changes; that suite is not a blocker for completed review delivery. See UI_CONSISTENCY_AUDIT_2026-10-02.md. Older entries below are historical.

---

# UI consistency and legacy-rule audit — 2026-10-02 IST

State: `CODEX_ACTIVE`. Branch `fix/ui-consistency-audit-20261002`; verified integration base `8fcc88b935eed87f740dba2159d67f0d3eb8e231`. Owner authorizes reviewing all screens and fixing confirmed UI/UX inconsistencies and conflicting legacy rules while away. Only protected production PR104 is open. Confirmed state/receipt foreground/type conflict, Home hover contrast, Contact social heading and retired intent CSS fixed. Approved body backgrounds restored on Contact/Faith; Impact/Our Work closing grids explicitly restored and Impact evidence-to-heading spacing corrected. Local six-width UI/a11y regression and ten carousel cases pass; build/types/lint/editorial/CSS guards and 17 CI planner regressions pass. JS819087/819200; CSS344368/348160. See UI_CONSISTENCY_AUDIT_2026-10-02.md. Seeded focused CI, merge and exact-source review deployment pending. Preserve approved banners/background SVGs, canonical content/media/privacy/payment/indexing gates and fixed bottom-right Companion.

---

# Latest delivery — site-wide approved L1 banners — 2026-10-02 IST

State: `IDLE`. Outgoing agent: Codex; incoming agent: next available implementation agent. Integration: `phase-public-site-rebuild`. Completed task branch: `fix/sitewide-l1-banners-20261002`. PR [#126](https://github.com/immazhark/amaana-platform/pull/126) merged at `a6cea782514fdf49837af7a41e7d4aa178a4821e`; tested task head `494421b4e727ff65314b7ac82f9f91d273926b37`. Documentation closure branch: `docs/sitewide-banner-delivery-20261002`.

Completed: all shared PageHero purposes use the approved L1 gradient, geometric lattice and right-side Arabic Amaana motif. Home, assistance success/tracking, donation acknowledgement, error/loading and admin headings share the same surface. Page purposes remain semantic. Mobile Home copy stays on the light field; global error uses an independent equivalent; acknowledgement print stays readable. Retired variant styles removed. Canonical content, media, actions, auth and fixed Companion preserved.

Validation: production build/types, lint (three existing warnings), 392 units (six DB-dependent local skips), 15 planner regressions, content/factual/CSS/SVG guards, sixty local production page/viewport checks and eighteen axe audits passed. All six seeded banner tests passed at320/390/768/1024/1440/1920. PR CI37004033430 green:631 Chromium cases passed first attempt, one body-carousel1024px animation timing assertion passed on built-in retry;24 Firefox/WebKit smoke cases passed. The earlier631pass/1fail run exposed a stale About prose selector from prior PR124; corrected to the actual prose column and verified locally, with no layout change. No current failing required checks. JS819087/819200 and CSS346628/348160; caps unchanged.

Integration CI37005131492 passed production build, budgets, database/fast guards and server smoke; exact-tree PR acceptance reused, duplicate browsers skipped. Railway review deployment `503b31d2-e2ff-4fbd-a76b-95a4a81eab50` SUCCESS on exact application SHA `a6cea782514fdf49837af7a41e7d4aa178a4821e`. Live Home, Contact and neonatal initiative DOM confirms identical surface, visible approved Arabic motif and no horizontal overflow. Deployed Contact screenshot inspected and saved. Live neonatal page retains full case narrative and ₹107,520; gallery remains supporting media.

Current implementation task: complete. Exact next action: owner continues UI review on the deployed review website. Future page-specific banner exceptions are deferred until requested. One existing carousel geometry test has a timing-sensitive700ms wait and0.09375px first-attempt overshoot; retry passes, recorded for future test stabilization rather than broadening this banner change. Main/production promotion PR104 remains a separate protected checkpoint. Preserve all canonical factual/compliance/privacy/media/payment/indexing gates, approved SVG bytes and fixed Companion. Older active/pending entries below are historical and superseded.

---

# Site-wide approved L1 banners — 2026-10-02 IST

State: `CODEX_ACTIVE`. Integration base `4f8459967845b2a7bc988adaaf62b073a624faf6`; task branch `fix/sitewide-l1-banners-20261002`. Owner explicitly requests the approved L1 gradient/geometric/Arabic-right artwork on every website header banner, with future per-page exceptions deferred. No other implementation writer or task PR is active; only protected production PR #104 is open. Current task: audit shared PageHero and custom/transactional banners, standardize surfaces without changing canonical content or interactions, then focused validation, integration PR/CI/merge and exact-source preview verification. Prior live browser transport failure is historical; retry verification for this delivery. Preserve factual/media/privacy/payment gates, approved SVG bytes and fixed Companion. Older entries below are historical.

Local validation complete: production build/typecheck, lint (three existing warnings), 392 unit tests (six DB-dependent local skips), 15 CI planner regressions, content/factual/CSS guards and all six approved SVG hashes pass. Sixty production page/viewport combinations and eighteen axe audits pass at 320/390/768/1024/1440/1920; local Home uses the production hero fixture and DB-backed initiative is reserved for seeded CI. Desktop/mobile rendered inspection passed. Final JS 819087/819200 and CSS 346628/348160; fixed budgets unchanged. Implementation complete; publication, seeded full shared-surface CI, green merge and exact-source review deployment remain pending.

Delivery checkpoint: PR #126, head 481d009eb1e19ced645dbd1f41dd4f4a26077812. CI 37002628565 fast/database green; Chromium 631 passed, one pre-existing stale About prose selector failed. The heading wrap introduced in prior PR124 caused the test to measure the left heading as prose. Selector corrected to the actual last direct prose div; unchanged production layout passes locally at 1920/1440/390. All six actual seeded banner tests passed. Corrected acceptance run and deployment remain pending.

---

# Latest delivery — body section headings and footer spacing — 2026-10-02 UTC

State: `IDLE`. Outgoing agent: Codex; incoming agent: next available implementation agent. Integration: `phase-public-site-rebuild`. Completed task branch: `fix/section-headings-footer-spacing-20261002`. PR [#124](https://github.com/immazhark/amaana-platform/pull/124) merged at `892aa722294b2ebb307e6934a444fad3ffee5361`; task head `d837253610ce26e07c5784c21d0edaae84d101ad`. Documentation closure branch: `docs/heading-footer-delivery-20261002`.

Completed: shared server-rendered body introductions use a 40px rule and eyebrow above the left title, subtitle on the right; mobile stacks. Additional right-side content retains its composition. Site-wide footer outer spacing shares one token: 80px desktop, 96px plus safe area on mobile. Canonical/legacy programme galleries and eligible public introductions use the shared component. Content, approved background foundations, factual locks and fixed Companion preserved.

Validation: local production build, lint/types/content/CSS guards, 392 unit tests (six database-dependent skipped locally), 15 CI planner regressions, and 30 local production page/viewport combinations passed. PR CI 36948217424 passed all 507 Chromium cases, including six widths. Integration CI 36949106614 passed build, budgets and server smoke, reusing exact-head PR acceptance and skipping duplicate browsers. JS 818873/819200 and CSS 347314/348160; caps unchanged. Optional-gallery fixture assertion and real keyboard-navigation setup corrected; no current failing application checks.

Railway preview deployment `b7ef3970-885d-4017-bdce-de9f4c6176ff` is SUCCESS on exact application SHA `892aa722294b2ebb307e6934a444fad3ffee5361`. Final public-site visual inspection could not finish because the browser/container transport disconnected with `409 environment_offline`; no post-deployment screenshot or live visual claim is made. Seeded browser acceptance and exact-source deployment are confirmed.

Current implementation task: complete. Exact next action: owner continues UI testing on the deployed review site; when browser access returns, inspect /impact shared introductions and footer, and /our-work/emergency-neonatal-medical-aid gallery. No additional code edits are required for this delivery. Main/production promotion PR #104 remains a separate protected release checkpoint. Do not casually change factual/content locks, private evidence boundaries, payments/indexing gates, approved geometric foundations or Companion positioning.

All older active/pending entries below are historical and superseded by this delivery record.

---

# Body section headings and footer spacing — 2026-10-02

State: `CODEX_ACTIVE`. Branch `fix/section-headings-footer-spacing-20261002`, verified integration `2235263272d0083fa280fc7a1ed0b34acdd6ba88`. Only open PR is protected production #104. Owner requests equal outer footer top/bottom breathing room and a consistent body heading: line + eyebrow, title left, subtitle right; retain compositions with extra content on the right, stack on mobile. Screenshots recovered and inspected. Prior PR122/123 merged with green CI and exact preview deployments; older pending notes below are historical. Shared server-rendered heading implemented across standard public introductions, closings and galleries; original content, hero layouts, content-panel exceptions, card headings and fixed Companion preserved. Thirty actual production page/viewport combinations pass at 320/390/768/1024/1440/1920. Local lint/types/content/CSS audit/build and 392 unit tests pass (six DB-dependent skipped locally); 14 planner regressions pass. Final JS 818873/819200 and CSS 347314/348160, caps unchanged. Footer outer top/bottom uses one token: 80px desktop, 96px mobile plus safe area. Focused seeded CI, green merge and exact-source preview deployment verification remain pending.

---

# Participation, Contact and completed Appeals — 2026-10-01

State: `CODEX_ACTIVE`. Branch `fix/participation-contact-appeals-20261001`; stacked PR #123, remote head 4e73601731f76d6a8fe5f3c2d65efb7b7494e9ab. All six screenshot groups are implemented: shared Contact/Get Involved cards with refined normal/hover/focus states; separated journey headings/copy without misaligned dots or rails; official social SVGs reused from the footer; completed Appeals use BodyCarousel/BodyCard; brand-gradient fallback uses the approved geometric lattice globally. Local production checks pass at 320/390/768/1024/1440/1920; Contact/Get Involved axe checks pass. Units: 392 passed, six database-dependent skipped locally. Build/types/lint/content/global CSS and 13 CI planner regressions pass. Production JS 818873 / 819200 and CSS 344906 / 348160; caps unchanged. Actual database-backed Appeals verification remains for remote CI and deployment.

PR #122 head 04a7b0f28138982bce8d5fa82e28e7d1983b0235, CI 36896947301: fast and database green; browser running. Previous complete Chromium run passed 614 cases; Firefox could not launch because the container HOME owner differed from its runner user. Current commit repairs existing HOME ownership without changing HOME or reinstalling browsers. PR #123 contains this fix as an ancestor. After PR #122 passes and merges, retarget PR #123 to `phase-public-site-rebuild`, trigger focused CI, merge only on green, verify exact-source integration build/Railway preview and actual pages. New presentation changes select ten focused suites without a full cross-browser matrix or refund database job. Main/production remains unchanged.

---

# Initiative detail delivery checkpoint — 2026-10-01

State: `CODEX_ACTIVE`. Owner requested continuation; current CI remains running. PR122 is open on fix/initiative-detail-narrative-20261001; remote head7e09e584e85febe87974d7b83c1e90d0d913e52b. Full canonical and legacy narratives retained; clinical glossary removed; continuous approved pattern, centered closing actions, equal footer padding implemented. All six new initiative browser checks passed at320/390/768/1024/1440/1920. Last full run36888890250:613 passed,1 failed due single-programme category test expecting medical relief to have one record after canonical seed expansion. Test now uses genuinely single-parent Taleem category. Current final CI36891312920 is running. Fast/database previously green; local types/lint/master/build and budgets pass. Not merged or deployed. Next: verify current CI, merge PR122 into phase-public-site-rebuild only after green, check integration build and exact-source Railway preview deployment, inspect rendered initiative pages. Existing browser detailTab id3 on amaanafoundation.org; runtime restored. Main/production protected. CI uses pinned Playwright1.55.0 preinstalled image, postgres service hostname, canonical seed and valid workspace/relative artifact paths; prior20-minute OS mirror install timeout eliminated. User frustrated by full-suite repetition; do not repeat broad runs beyond required failures.

---

# Initiative detail corrections — 2026-10-01

State: `HANDOFF_PENDING`. Local implementation complete. Branch fix/initiative-detail-narrative-20261001 from verified integration20b5c23. Six screenshots inspected. Scope: restore complete canonical narrative, remove clinical glossary, one continuous approved body surface, align closing CTA and footer spacing. Main and factual locks protected. Validation: eight narrative tests including all30 canonical records; full unit suite391 passed before final additional catalogue case; six-width representative production-CSS layout harness passes, SVG artwork visually inspected. Lint/types/master/global CSS audit/build pass; JS818873 and CSS340119 below unchanged budgets. Actual database-backed browser pages and remote CI/staging remain unverified. Publication next.

# CI separation extension — 2026-10-01

State: `HANDOFF_PENDING`. Extended policy verified locally: twelve planner tests, lint, workflow job dependencies, YAML/shell syntax and diff checks pass. Fast/database/production/browser separated with stable aggregate verify gate. Remote publication is pending direct authorization. Continue chore/change-aware-ci-20261001; user requests explicit light/heavy job separation and wider routine UI/content selection. Publication remains blocked by prior auto-review; do not retry export without direct authorization.

# Change-aware CI — 2026-10-01

State: `HANDOFF_PENDING`. Local mechanism implemented and verified: eight planner tests, lint, YAML/shell syntax and diff checks pass. Publication/remote workflow validation pending. User requests implementation of efficient verification criteria. Branch: chore/change-aware-ci-20261001; verified integration base 72fcfe3, PR120 merged. Scope: deterministic diff planner, workflow selection and regression tests; preserve production readiness and budgets.

# Publication authorized — 2026-10-01 IST

State: `CODEX_ACTIVE`. Owner explicitly approved GitHub publication, PR/CI and integration staging delivery. Continue fix/owner-screenshot-polish-20261001 from verified f6980fd3. All local checks pass as recorded below. Terminal push has no credentials; use the connected GitHub publisher to publish the same tested tree. Remote CI, merge and exact-source deployment verification are next.

---

# Publication blocked — 2026-10-01 IST

State: `REVIEW_PENDING`. Branch: `fix/owner-screenshot-polish-20261001`.
Implementation commit: `c911884` (based on verified integration f6980fd3).
All six owner screenshot groups are implemented and locally verified. Nine new production-browser tests pass across 1920/1440/1024/768/390/320, including keyboard disclosure/select, hover/focus, actual moving gradient, reduced motion, no hero-control overlap, no horizontal overflow and axe checks. Eleven existing chrome checks also pass. Lint/types/master/CSS audit/build and 389 unit tests pass; six database-dependent tests are locally skipped. Production JS 818873/819200; CSS 340731/348160. Desktop/mobile visual review confirms contained official logo artwork and aligned portfolio metrics/controls.

Automatic approval review rejected GitHub push: repository export destination requires explicit end-user authorization for this change set. No connector workaround was attempted. Read-only GitHub verification confirms the task branch does not exist remotely (404). No PR, remote CI, integration merge or staging deployment occurred. Staging remains the prior verified application 0227dc8.

Next exact action, after direct user publication authorization: push the task branch to https://github.com/immazhark/amaana-platform, create PR to phase-public-site-rebuild, require green full CI, merge and verify exact-source Railway staging deployment plus rendered Home/Our Work. Main/production promotion, indexing, live payments, factual locks, identity separation and fixed Companion remain protected.

---

# Owner screenshot corrections — 2026-10-01 IST

State: `CODEX_ACTIVE`. Branch: `fix/owner-screenshot-polish-20261001`.
Verified integration base: `f6980fd3a083392deaa375626f6289c70da66d5f`; only open PR is protected production promotion #104. User explicitly requests detailed implementation of six annotated screenshots. Scope: header hover, taller Home hero and official brand fallback, animated Highlights gradient, visible dark-section lattice, trust links/contrast/icons, wider smaller footer lead, portfolio filters/disclosure alignment, brief initiative summaries, consistent metadata and readable brand thumbnails. Preserve factual values, curated identity separation, fixed Companion and integration-only delivery. Local verification complete: nine production-browser checks across six widths, eleven existing chrome checks, axe on corrected surfaces, lint/types/master/CSS audit, 389 unit tests pass (six DB-dependent local skips). Final production JS 818873/819200 and CSS 340731/348160. Desktop/mobile screenshots inspected; full logo artwork contained and controls do not overlap CTAs. Full remote CI and staging verification pending.

---

# Completed delivery — 2026-10-01

State: `IDLE`. Unified body-carousel task is complete.

- PR #118 merged into phase-public-site-rebuild at 0227dc873fd596b71320d9fc2edaf4b43441483e.
- Final task-head CI 36843517333 and integration push CI 36844982063 are SUCCESS: 832 Chromium + 24 Firefox/WebKit checks, unit/refund database, lint/types/content checks.
- Integration production build and unchanged budgets pass. Local production totals: JS 818873/819200 bytes; CSS 344825/348160 bytes.
- Railway preview deployment 90272fe1-bbd5-42f7-a31f-f76f5e86e836 is SUCCESS on exact application SHA 0227dc8.
- Cloud-browser live verification confirms Home starts flush left with 18% preview, Qurbani two-card and Eid seven-card rows use equal row heights and 16:9 visuals, and wrap navigation aligns the last card at the same left edge. Companion remains fixed bottom-right.
- Six local responsive fixture widths and ten interaction checks pass. Terminal live-site DNS was unavailable; live checks used the cloud browser at its desktop viewport. Do not claim six-width live-deployment checks or a public version-endpoint check; the version endpoint was blocked to this browser, while Railway source SHA and deployed UI were verified.
- Shared BodyCarousel/BodyCard, heading controls, progress line, brand SVG fallbacks and site Framer Motion layer are delivered. Manual pause, focus/hover pause, native drag, direct links, keyboard navigation and reduced motion are verified.
- Design specification: docs/BODY_CAROUSEL_DESIGN_SPEC.md. Gallery photos remain separate from hero/identity media. Main, reserved production, indexing, live payments and factual locks remain protected.
- Next: owner visual review and the next explicitly requested UI defect block. Identity photographs remain an external content assignment. No unfinished implementation in this carousel block.

---

## Autoplay focus guard follow-up

Autoplay now checks actual hover/focus state and active drag before advancing, so pointer exit cannot resume while keyboard focus stays inside. Independent manual pause remains. Ten local Chromium checks pass (including focus/blur resume), lint/types/production build pass. Production JS 818873/819200, CSS 344825/348160. Publish focused follow-up to PR #118 and require its exact-head CI before merge.

# Recovery checkpoint — 2026-10-01

State: `CODEX_ACTIVE`; continuing PR #118 at verified remote HEAD b00f8398040606a6479e78a5b480d6f19d551f29. Integration remains 5908d16. Latest CI: 826 passed / 5 failed. Recovered exact published sources; removed retired Impact and programme card rules, fixed in-flight scroll destination tracking and hero offset context. Canonical programme-link assertions and approved 416px hero-height assertions replace obsolete expectations; left-edge wrap geometry is polled until settled. Local lint/type/build/master and 389 unit tests pass; eight existing browser checks pass. Production JS 819177/819200, CSS 344825/348160. Added rapid wrap regression; exact-head CI, integration and staging verification pending. Main and fixed Companion remain protected.

---

## Carousel validation checkpoint

Draft PR #118; initial CI lint issue corrected. Final local lint/type/build pass, 389 unit passes (6 DB skips), eight Chromium checks pass including six widths, exact peek, manual pause, reduced motion, drag and direct-link navigation. JS 818889/819200; CSS 347534/348160. Full exact-head CI and preview deployment pending.

# Current task — 2026-10-01 unified body carousels

State: `CODEX_ACTIVE`
Task branch: `feat/unified-body-carousels-20261001`
Verified integration base: `5908d16b6c31f5919033e68b49b33962068e5a71`.

Owner requests all body carousels start flush left; one design system for Home/L1/L2, fixed visual headers, brand-themed SVG fallbacks, equal card geometry, 15–20% next-card peek, heading-aligned controls and progress line. New explicit instruction requires Framer Motion site-wide where appropriate. Preserve native scroll snap/touch and motion preferences, factual locks, identity media separation and fixed Companion. Only open PR at claim is reserved production PR #104; no competing implementation writer. Prior #116/#117 delivery is complete: 823 Chromium + 24 Firefox/WebKit passed, final integration CI green, Railway success on 5908d16, JS 805951/CSS 346969 within unchanged budgets. Implement and verify this new coherent task before integration; no production promotion.

---

# Current delivery checkpoint — 2026-10-01 IST

State: `CODEX_ACTIVE`
Task branch: `fix/curated-import-validation-bundle`
Integration HEAD: `3107555782a4b9632300bcfb7ef65271e86592fb`.

- PR #116 merged after exact-head CI 36764531334 passed 823 Chromium and 24 Firefox/WebKit cases, lint/types, 389 unit tests and isolated refund database checks.
- Railway staging deployment `b4c52092-3072-4249-9566-be32d4e3fdc8` is SUCCESS on exact integration SHA `3107555`. Rendered homepage verified through cloud browser: header, separate reminder/live rail, five Highlights including ₹12,14,520, canonical footer and fixed Companion are present.
- Integration push CI 36766109793 exposed the existing JS excess: 973,135 / 819,200 bytes. CSS passes: 346,969 / 348,160 bytes. No budget increase allowed or performed.
- Root cause: shared curated-gallery schema imported the exported Zod namespace object, retaining unused validator exports/locales in the admin browser bundle. Changing to an ES module namespace import preserves exactly the same schemas, validation and inferred types while enabling unused exports to be removed.
- Clean local production build after this import-only correction: JS 805,951 / 819,200 bytes; CSS 346,969 / 348,160. TypeScript and all three curated-contract tests pass.
- Next: publish isolated correction PR into integration; require green CI, merge, verify production budgets and staging source SHA. Current application fixes are deployed, but delivery is not fully certified until integration CI is green.
- Main, reserved production service, indexing, Live Razorpay, gallery/identity assignments and fixed bottom-right Companion placement remain locked.

---

# Current checkpoint — 2026-09-30 site chrome + footer + homepage hero correction

State: `CODEX_ACTIVE`
Task branch: `fix/site-chrome-footer-hero-20260930`
Integration base / current phase HEAD at claim: `883d2c6c680bd4ac2796eb68defe16875a9b7bab`.

Incoming Codex ownership explicitly handed over by the owner continuation prompt. Verified task HEAD `464938377ee3b8cddc03b756aa6ab9668b8f655a`, integration HEAD `883d2c6c680bd4ac2796eb68defe16875a9b7bab`, Draft PR #116. CI 36748468904: 808 Chromium checks passed, seven failures under investigation. No concurrent implementation writer is active.

Owner-authorized Block #1 + Block #2 implementation:
- footer geometry/spacing/typography/site-wide parity, gold link states, official social icons, Threads support, future social extensibility;
- slightly taller global header with larger logo, restored thick animated gold nav underline, canonical Support a need CTA;
- split compact Reminder + independent Amaana Live rail below navigation;
- homepage hero breathing room, 45/55 copy/media composition, image fade boundary, removal of decorative 2020/Arabic story graphics;
- fifth homepage Highlights metric for the canonical medical/financial assistance aggregate.

Do not repurpose any of the 154 gallery photographs as hero/banner/thumbnail media. Do not touch main, DNS, indexing, reserved production service, Live Razorpay, or fixed bottom-right Islamic Companion placement.


Codex recovery checkpoint:
- Recovered Draft PR #116, inspected all 19 implementation commits and all seven exact-head browser failures.
- Established `site-chrome.css` after `experience-finish.css`; retired conflicting nav/footer/reminder generations rather than increasing specificity or bundle budgets.
- Fixed footer implicit grid tracks and inherited 48–80px lead margin; restored 44px mobile link targets, canonical active-route gold, safe bottom spacing, and consistent typography.
- Corrected the hero split relative to the public container and secondary CTA contrast; actual Home story and Highlights are shared with the isolated carousel fixture.
- Guarded assistance total against malformed measures, duplicated cases, missing cases and future rollups. Canonical total remains ₹12,14,520; ten focused unit cases pass.
- Expanded rendered acceptance across 1440/1280/1024/768/390/320, including uncut metric values, footer shell parity and fixed Companion positioning. Obsolete tests now enforce the owner’s newer same-footer/two-lane requirements.
- Local lint/type/master and unit checks pass (389 tests, 6 database-dependent skips; three unchanged lint warnings). Full exact-head CI and staging verification remain pending; no completion/deployment claim yet.


Publication recovery — 2026-10-01 IST:
- Owner directly authorized continuation after the explicit publication approval request. Terminal push then failed for missing GitHub credentials.
- Connected GitHub publication succeeded: `12cd093d4024bcb2775ab83c07f0b77fcd5b472a`, whose tree exactly equals local tested tree `50cd32acd66c24f97778d173842b954aa7b02596`.
- PR CI 36762269001 passed lint/types/unit/database/factual checks and 822 Chromium cases. One mobile footer-collapse failure exposed a later generic display rule overriding the existing disclosure state.
- Removed only the redundant generic display declaration; kept the existing disclosure behavior and compact-height assertion. Local failing mobile disclosure test now passes, as do all eleven focused chrome checks. Two broader local checks need unavailable database routes; those same routes passed in CI.
- Clean acceptance CSS was 346,982 / 348,160 bytes before this one-line reduction; budgets remain unchanged. The local JS baseline discrepancy still requires integration production-build verification.
- Publishing this correction and rerunning exact-head CI is next. PR #116 remains Draft until green; no integration merge or Railway deployment has occurred yet.


---

# Historical checkpoint — 2026-09-28 background composition correction

State: `CODEX_ACTIVE`
Task branch: `fix/background-composition-scale`
Base integration SHA: `671e3ba219f01248a0154dfe81525d7518e2efdf`
User explicitly requests uncropped header/footer emblems and uniformly small, lighter body pattern. Prior cover-based acceptance was insufficient. Preserve original six source SVGs; derive independent ornament/tile assets and test actual viewport geometry. Scope is backgrounds and their readable layout only; content, payments, main and draft promotion PR #104 remain untouched. No other implementation writer is active. Verification pending.

---

# Amaana Platform — Active Implementation State

## State
**CODEX_ACTIVE**

## Integration branch
- `phase-public-site-rebuild`
- Family feedback/review is complete as of 21 September 2026.
- Quiet-mode restrictions are lifted. Audited implementation may be pushed phase-by-phase to staging on this branch.
- Current exact integration HEAD: `cdfc8ad2cefb61c992537a3d4cae48e58cfe6aab`; push CI `36330311977` and PR CI `36330314494` are SUCCESS. Exact-head Chromium acceptance: 352 passed in 5.2 minutes.
- Current successful Railway staging deployment: `a7625ecc-5d8b-41d7-a8ac-7cb341e71bfc` from source SHA `b5d5373402e275e3993448914cff75e1bbb23bcb` (`fix: make master copy source reproducible`). Startup encountered one transient Neon P1001, recovered through the existing retry path, and Railway `/api/health/ready` succeeded before deployment reached SUCCESS. The later `cdfc8ad2...` assertion-only commit was correctly SKIPPED by Railway.
- Exact-head repository state is certified by GitHub CI; Railway deploys only application-affecting changes and correctly skips test/documentation-only follow-ups.
- Prior runtime baseline `bce6b1d85bedc9da6e0fb38484e867db71cb4182` / deployment `d0e7608a-df34-425b-9d30-79d1434b1064` remains historical evidence, but that deployment is now `REMOVED` and is not the currently served staging deployment.
- Reserved production service `amaana-platform` now has non-secret hardened deployment parity: `/api/health/ready`, 300-second timeout, restart retry limit 3 and staging-aligned application watch patterns. No deployment was triggered.
- Safe production defaults were staged with deploys skipped: `APP_ENVIRONMENT=production`, `EMAIL_DELIVERY_MODE=disabled`, `NEXT_PUBLIC_ALLOW_INDEXING=false`, and all acceptance/browser flags false. Indexing decision, production public-media bucket, Live payments and live email remain deliberately unresolved.
- Resend production sending-domain resource for `amaanafoundation.org` was created on 27 September 2026 with sending enabled, receiving disabled and tracking disabled. Provider verification has been triggered and remains `pending`; DKIM, SPF MX, SPF TXT and the `rsend` CNAME now all report `pending`, with none yet verified. No transactional email was sent and no new API key was created.
- Live Neon media audit on 27 September 2026: 3 MediaAsset rows total, all unpublished/unapproved initiative-linked legacy VIDEO metadata matching the three removed static MP4s; zero public assets, zero privacy approvals, zero public-without-approval, zero orphaned assets and zero identity assets. No destructive DB cleanup was performed.
- Reserved production service now also has `PUBLIC_MEDIA_BASE_URL=https://amaanafoundation.org/media` configured with deploys skipped. `PUBLIC_MEDIA_S3_BUCKET` and `PRODUCTION_INDEXING_DECISION` remain deliberately unset.
- `main` remains untouched until explicit production-promotion approval.

## Current task stream
- Continue the consolidated audit/enhancement roadmap on the integration branch.
- Curated programme photography is intentionally deferred until the owner finishes selecting images drive-by-drive.
- The media system must remain plug-and-play while that curation happens; do not request replacement media as a blocker for unrelated engineering work.
- Priority UX direction: materially reduce vertical scrolling with deliberate banner, gallery and repeated-card carousels while keeping reading-heavy trust/policy/story content linear.

## Working protocol
1. Keep `main` untouched and indexing disabled.
2. Push coherent, reviewable implementation slices to `phase-public-site-rebuild`; staging auto-deploys browser-affecting changes.
3. Do not initiate real Razorpay payments/refunds or production cutover actions.
4. Do not publish real beneficiary/programme media without the existing human privacy/consent/provenance gate.
5. Do not reintroduce the deleted legacy programme-image pool or heuristic/random hero selection.
6. Use one explicit curated identity/hero image per programme/drive and ordered supporting images.
7. Prefer compact carousels only for media/repeated-card surfaces where they reduce scroll; do not hide long-form accountability or policy reading inside sliders.
8. At each implementation checkpoint, validate build/type safety and retain browser/E2E regression coverage.

## 21 September 2026 media + carousel baseline
- All 191 legacy programme/drive/cause image files were removed from the current staging branch.
- All 175 staging `MediaAsset` IMAGE records were removed. The three legacy static MP4 files were subsequently removed from `public/media`; three matching DB VIDEO metadata rows remain private/unapproved and hosted video remains fail-closed publicly.
- `prisma/integration-media.json` is empty so deleted images cannot silently re-seed.
- Identity image contract is deterministic: `IDENTITY_MEDIA_SORT_ORDER = -1000`; assigning a new identity image demotes the prior identity image for the same target.
- Identity publication requires explicit hero-use approval in addition to the normal privacy/provenance publication gate.
- Shared manual/swipe/keyboard `ScrollCarousel` is implemented without autoplay or a heavy slider dependency.
- Programme galleries use the carousel while retaining the accessible lightbox.
- Long programme-year histories switch to compact carousel presentation when they exceed three entries.
- Impact witness media uses a compact carousel.
- Homepage programme discovery is a horizontal five-area strip.
- A full-width homepage banner carousel is wired but activates only once at least three approved featured identity images exist; until then the existing static PageHero fallback remains.
- Curated image insertion therefore requires data/media work, not another layout redesign. See `docs/CURATED_MEDIA_CAROUSEL_CONTRACT_2026-09-21.md`.

## Completed before this quiet batch
- Secure gated private-bucket public-media proxy and real synthetic upload/publish/unpublish acceptance.
- Database snapshot/restore recovery drill with matching content digests and clean post-restore application startup.
- Fail-closed staging launch acceptance (32 checks) on exact candidate SHA before public-port activation.
- SEO/social metadata hardening and Docker build-time NEXT_PUBLIC_* injection.
- Bounded Prisma advisory-lock retry for transient P1002 migration contention.
- Separate public-media storage from private assistance storage.

## Quiet-batch work completed/in progress

### Release / editorial quality
- Unified read-only launch preflight commands:
  - `npm run launch:preflight`
  - `npm run launch:preflight:rehearsal`
  - `npm run launch:preflight:production`
- Public editorial/compliance guard with tests for:
  - newborn amount ₹107,520;
  - Winter 234 kits / 234 beneficiaries;
  - Aliza amount ₹482,700;
  - provisional 12A/12AB and 80G wording;
  - domestic-only / non-FCRA boundary.
- Exact Aliza public metric changed from rounded `₹4.82L` to `₹482,700`.
- SEO browser coverage now covers all 26 declared static public routes, all four programme-category schemas, generated social images and canonical redirects; exact-head Chromium acceptance completed 352/352.
- Document-title regression coverage prevents duplicate Amaana branding.
- Master-copy generation is now reproducible from tracked `src/content/master-copy.json`; `npm run master:check` is enforced in CI and the confirmed provisional 12A/12AB status is locked against stale source text.
- Privacy, Terms and Refund Policy still explicitly disclose outstanding professional legal/accounting wording review; this remains part of the human `final-editorial-seo-social-review` gate and is not auto-closed by green automation.
- Public/private data-boundary guard prevents public publishing surfaces from reading internal beneficiary/verification/token/storage fields.
- Final human launch QA checklist consolidated into one canonical document.

### Accessibility
- Skip-link target is programmatically focusable.
- Browser acceptance verifies skip-link focus transfer, one H1, document language and main landmark.
- Existing axe, responsive, reduced-motion, keyboard, mobile-focus and 200%-reflow-equivalent coverage retained.
- Branded 404 behavior is browser-tested for 404 status, navigation, noindex and mobile containment.

### Security / privacy / operations
- Private-document signed URL ownership binding and private-cache hardening.
- Admin login timing/identity hardening, bounded credential inputs, expired-session pruning and audited logout.
- Trusted proxy/client-address normalization for rate-limit identity.
- Ephemeral login/donation security-ledger retention/pruning.
- Transactional email worker idempotency/retry/stale-processing recovery plus operational runbook.
- Notification operations page and audited manual requeue path using new `notification.manage` permission.
- Destructive media/private-document deletion intent audit records.
- Public-media route MIME mismatch fails closed; managed PDF delivery acceptance added.
- Staging email delivery remains fail-closed/disabled.
- Browser security-header acceptance now covers CSP, HSTS, framing, referrer, permissions, COOP/CORP and no-store sensitive surfaces.

### Data / query integrity
- Additive operational indexes for audit history, notification lists, security-ledger cleanup and media review ordering.
- No destructive schema migration introduced.

## Additional hardening completed in the quiet batch

### Payment / refund correctness
- Refund processing requires INR and bounded paise values.
- Out-of-order refund webhooks reconcile payment → order and reuse the idempotent capture path before refund accounting.
- Refunds can reopen a FUNDED appeal to PUBLISHED only while the fundraising window is still open; otherwise the under-target funded appeal becomes CLOSED.
- Private donation acknowledgement responses are no-store, no-referrer and noindex.
- Critical unmatched payment/refund events are surfaced in admin donation operations.
- Stored webhook evidence is privacy-minimized.
- Exactly one donor refund notification is queued transactionally for each effective unique refund event.
- `docs/PAYMENT_REFUND_OPERATIONS_RUNBOOK.md` documents the controlled live acceptance.
- Webhook route tests now cover invalid signatures, duplicate event idempotency and end-to-end refund reconciliation into donation/appeal/event/notification records.

### Production indexing boundaries
- Indexing now requires explicit opt-in, official HTTPS Amaana host and `APP_ENVIRONMENT=production`.
- Docker builder defaults `APP_ENVIRONMENT=staging`, making preview builds fail closed.
- `/donate` is a public SEO route while `/donate/<appeal>` remains private.
- All admin surfaces have explicit noindex/nofollow/no-referrer metadata.

### Rollback preparation
- `npm run rehearsal:verify-target` validates exact deployed SHA, health/readiness, representative public routes and private no-cache/noindex boundaries.
- Pinned previous-known-good branch remains `rehearsal/rollback-baseline-2026-09-18`.

### Production RBAC correctness
- New notification view/manage permissions are not seed-only.
- Migration `20260918111500_notification_operations_rbac` idempotently creates/grants them to PRIMARY/BACKUP approvers in production.
- Manual email recovery uses an atomic FAILED-only claim and cannot race an active worker into a duplicate send.
- Notification worker tests cover atomic claim, stable provider idempotency, SENT transition, transient retry scheduling and concurrent claim loss.

## Current background correction
- Six corrected approved SVG source files were supplied and landed byte-for-byte in `public/backgrounds/`.
- `scripts/verify-approved-backgrounds.mjs` locks their SHA-256 hashes and launch preflight fails closed if repo assets differ.
- The family-review deployment still serves the previous backgrounds; responsive rendered QA remains pending until the next controlled staging deployment.

## Operational note
- The preview service remains healthy on the family-review SHA.
- The notification cron's historical failed build was caused by the superseded admin-login TypeScript error, not by the worker. The active cron deployment is healthy and was observed on 19 September 2026 firing every five minutes and receiving HTTP 200 with `status:"disabled"`, which is the intended staging posture.
- No separate cron deployment is required merely to repair that historical failure.

## Additional implementation completed on 19 September 2026

- Donation checkout remount regression fixed with Next Script `onReady` plus an already-loaded `window.Razorpay` fallback; browser acceptance now reproduces unmount/remount behavior so the form cannot remain stuck on “Preparing secure checkout…” after revisiting the page.
- Explicit `payment.failed` webhook state-guard tests added; failed payments cannot increase appeal accounting.
- Transactional-email operations gained a controlled self-recipient acceptance action for authorised staff only, duplicate-active-acceptance protection, audit logging and Resend provider-message-id persistence/visibility.
- Production environment contract now fails closed on staging/Live Razorpay mix-ups, wrong production canonical origin, shared assistance/public-media buckets, insecure public-media origin and launch-only acceptance flags.
- Version health now exposes only non-secret deployment posture (`environment` and Razorpay `paymentMode`); staging/rollback acceptance requires `staging + test`.
- Assistance browser acceptance now covers a synthetic private PDF in the multipart submission. Route tests lock private-document persistence and compensation cleanup when the later database write fails.
- Additive migration `20260919142000_notification_provider_message_id` stores the external email provider message id for delivery reconciliation. It has not been applied to staging/production yet.
- These new quiet-branch changes still require consolidated lint/typecheck/unit/build/browser validation before integration.

## Remaining genuine launch gates
- `rollback-rehearsal` — real staging rollback to a previous known-good deployment and restoration still required.
- `transactional-email-delivery` — controlled live production sender acceptance required.
- `manual-rendered-accessibility-review` — final human rendered review required.
- `final-editorial-seo-social-review` — final human copy/social preview review required.
- `public-media-human-review` — individual media privacy/consent/provenance review required.
- Razorpay account/KYC and website approval are VERIFIED. Provider-backed Test Mode capture, webhook delivery, acknowledgement/accounting and a full refund with `refund.processed` reconciliation are verified. Separate Live API credentials and a separate Live webhook now exist and remain outside staging. Remaining payment gates are provider-backed `payment.failed` evidence (or documented Test Checkout limitation), production-only Live credential installation, controlled real donation acceptance and production receipt/email/refund operations.
- explicit production indexing decision.
- explicit `main` promotion/production approval.

## Recovery anchors
- Database recovery snapshot evidence is recorded in `docs/DATABASE_RECOVERY_DRILL_2026-09-18.md`.
- Preserved Neon branch: `pre-recovery-original-2026-09-18`.
- Pinned rollback baseline branch: `rehearsal/rollback-baseline-2026-09-18` at healthy SHA `4f7cbafb87e8c7d75fd7191d7bcc7a83c9320a3d`.

## Locked facts
- Newborn medical aid: **₹107,520**.
- Winter Drive 2025–26: **234 Winter Kits distributed to 234 beneficiaries**.
- Aliza critical-care appeal: **₹482,700**.
- Taleem Nazira + Hifdh: **25 students combined as of September 2026**.
- Amaana is **not FCRA-registered**; fundraising remains domestic-only.
- 12A/12AB and known 80G status are **provisional** and must be described that way.


## 21 September 2026 implementation checkpoint — carousels, donor intent and guided assistance

### Scroll reduction and curated-media architecture
- Shared manual/swipe/keyboard `ScrollCarousel` now powers programme galleries, long programme-year histories, Homepage field work/programme discovery, Impact witness media and supporting Story media.
- The Homepage full-width curated banner is structurally complete and intentionally activates only once at least three approved featured identity images are available; it supports up to five curated slides and never autoplays.
- Story metadata, Story heroes and Story discovery cards now use the explicit identity-image contract instead of first-file heuristics.
- Mobile Home proof metrics and Impact metrics become horizontal snap strips instead of long stacked blocks.
- Curated image insertion remains data/media work. Do not redesign these surfaces when the selected photographs arrive.

### Donation intent
- Added a donor `givingIntent` record with values `GENERAL`, `SADAQAH` and `ZAKAT`.
- Donor giving intention remains separate from appeal designation and separate from the internal beneficiary Zakat-eligibility review.
- Zakat is offered only when the appeal's private verification record is explicitly `ELIGIBLE`; the order API re-checks this server-side and rejects forged Zakat intent otherwise.
- Giving intent is persisted on the Donation, included in Razorpay order notes, private acknowledgement, donor acknowledgement email payload and admin donation/reconciliation views.
- Additive migration: `20260921103000_donation_giving_intent`.
- The same additive enum/column/index were applied to the staging Neon branch before code rollout; existing records default to `GENERAL`.
- The complete donation-intent stack built successfully on Railway at `430329957477bf513b79577bbeae47f6602d3b3c`.

### Mobile appeal conversion
- Open verified appeal pages now have a mobile-only persistent “Support this appeal” action.
- It is deliberately absent on closed appeals and is not globally injected across Stories/programmes.
- Safe-area spacing prevents the bar from obscuring content and shifts Back-to-top/Companion overlays upward on affected pages.
- Isolated browser acceptance fixture and regression spec cover open/closed state, horizontal containment and floating-control overlap.

### Request Assistance
- The request form is now a genuine four-step guided flow: Contact → Need → Supporting Evidence → Confirm.
- Current-step validation prevents invalid forward progression.
- Input/file state is preserved between steps; the final request remains one secure multipart submission.
- Server validation errors reopen the exact step containing the rejected field and focus that control.
- Browser regression coverage follows the real progressive flow and preserves the private PDF upload test.
- Production compile/TypeScript succeeded and Railway deployment `32b31a06-8577-49d6-b283-e9c3183940ca` reached SUCCESS.

### Performance / regression guards
- Dynamic Homepage data loading is narrowed to dedicated appeal + discovery projections instead of loading unused story/faith/archive data.
- Public media retains intrinsic layout reservation.
- Browser performance coverage records CLS for Home, About, Our Work, Donate and Request Assistance with a <= 0.10 launch budget.
- Hosted GitHub browser workflow execution is not currently being reported for the newest test-only commits. Do not describe those Playwright specs as executed until a runner result is available.

### Current validation note
- Story curated-media deployment `cef325f99e55548596a4e452e549e0c4804b675d` reached SUCCESS before being superseded.
- Guided Assistance deployment `22e252dedd7cc988c9da96f4e72384ef6ecf6e61` reached SUCCESS.
- Latest mobile metric-strip head `71ea4b429e9cfaa6b1fcb3369b453d7cdb64cfef` is in Railway deployment validation at the time of this checkpoint.

## Codex continuation — 2026-09-23

- Ownership: CODEX_ACTIVE (explicit user handover).
- Task branch: fix/webhook-retry-scope; integration: phase-public-site-rebuild.
- Verified baseline HEAD: e76744a28e3da94ce239e45af96f01510fc5524e; no open integration PRs.
- PRE_EXISTING failure: CI run 35772257463/job 106897043629 and staging deployment b85e2a7a-c63f-4ae6-a404-489e3148bf9e fail TypeScript at razorpay/route.ts:254 (payload outside try scope).
- Immediate task: restore retry-handler compilation with event-type collision regression coverage; then durable refund-entity idempotency and private credential lifecycle.
- Main, production controls, live payments/refunds, private media publication remain protected. Impact redesign on hold.

## Codex phase A — 2026-09-23

Ownership CODEX_ACTIVE. Branch fix/refund-entity-idempotency. Recovery PR #102 merged at 30f157521776a1fadf70d326d1cff44d88e69e1f after PR CI passed. Implement additive refund identity ledger with legacy backfill, atomic accounting and real PostgreSQL concurrency tests. Integration build/deploy certification pending. No production actions.

## 24 September 2026 — final launch/cutover certification checkpoint

### Certified application candidate
- Application SHA: `bce6b1d85bedc9da6e0fb38484e867db71cb4182`.
- GitHub Actions run `36012879631`: **SUCCESS** on the exact candidate.
- The run passed the full integration gate, including lint, TypeScript, isolated PostgreSQL refund-ledger verification, coverage, production build, bundle budgets, post-build smoke checks, isolated browser fixture/workspace, Chromium installation, and responsive/accessibility/journey Playwright acceptance.
- Railway staging deployment `d0e7608a-df34-425b-9d30-79d1434b1064`: **SUCCESS** on the same exact application SHA.
- Railway's strict `/api/health/ready` check passed only after the database became reachable; the system correctly remained fail-closed during the prolonged Neon P1001/P1002 incident.
- Real startup recovery evidence from that deployment:
  - reviewed-campaign import recovered after transient database failures;
  - RBAC seed recovered after a transient database failure;
  - staging-acceptance seed recovered after transient database failures;
  - Next.js reached Ready;
  - Railway promoted the candidate only after DB-backed readiness returned healthy.

### Canonical routing/discovery closure
- Legacy `/our-work/*` aliases are centralized and deterministic.
- Legacy `/programmes/*` compatibility routes are also deterministic and no longer depend on database availability before redirecting.
- The static shadow route `/our-work/medical-financial-assistance` now redirects deterministically to the canonical medical/financial programme category.
- Sitemap/public discovery excludes legacy aliases and preserves published/canonical routes.
- Programme-category JSON-LD and canonical metadata are covered by regression tests.
- Homepage/Story/Faith related work links use canonical destination helpers.

### Launch-readiness register
- Rehearsal: **5/6** required gates resolved.
- Production: **9/19** required gates resolved.
- The only unresolved rehearsal gate is `rollback-rehearsal`.
- Rollback rehearsal remains pending because the connected Railway action surface exposes redeploy-latest but not deployment of an arbitrary historical deployment/snapshot. Do not fake this gate through Git rewrites.
- Current candidate and previous known-good deployment identities are recorded in `docs/launch-readiness.json`.

### Remaining production gates
The following remain intentionally PENDING until actual evidence exists:
- approved background artwork human rendered QA;
- transactional live email delivery acceptance;
- final human rendered accessibility review;
- final editorial/SEO/social-preview review;
- public-media privacy/consent/provenance review;
- controlled Live donation acceptance;
- refund/receipt operational production acceptance;
- real staging rollback rehearsal;
- explicit production indexing decision;
- explicit `main` promotion and production authorization.

### Protected actions
- Do not merge/promote to `main` without explicit user approval.
- Do not enable production indexing without the explicit production indexing decision.
- Do not install/use Live Razorpay credentials on staging.
- Do not initiate a real donation/refund merely to make a readiness gate green.
- Do not mark human privacy/accessibility/editorial gates VERIFIED from automated evidence alone.
- Impact-page visual redesign remains deferred until the owner supplies the separate redesign prompt.


## 28 September 2026 — approved background integration

User explicitly requested integration of all six revision-4 SVGs after design review. Codex owns this scoped implementation on `feat/approved-svg-backgrounds`, based on verified integration HEAD `6bb0666c45aa274e5e44a0a7d0339198802164e5`. Only open PR is draft production promotion #104; do not merge it. Replace approved assets byte-for-byte, refresh hash lock, adapt responsive placement and verify readability without changing content or footer height. Baseline push CI 36341349733 fails browser acceptance (classification in progress); PR checks pass. Production remains protected.


## 2026-09-28 — Approved vector background integration
- Current task PR: #105, `feat/approved-svg-backgrounds`, based on `6bb0666c45aa274e5e44a0a7d0339198802164e5`.
- All six revision-4 assets copied byte-for-byte; SHA-256 guard and XML/native-vector checks pass locally (51,146 bytes combined).
- Shared responsive token paths retained. Light body whitening gradients removed; dark-section contrast layers retained. Homepage carousel frame now consumes the header token. Footer height is still content-driven.
- PR CI and staging/browser verification pending at this checkpoint. Do not infer production approval.
- Pre-existing integration CI 36341349733 fails typography-hierarchy at 1440/390 (Arial vs serif expectation); unrelated to this asset change and not suppressed.
