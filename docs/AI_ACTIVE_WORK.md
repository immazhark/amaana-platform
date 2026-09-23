# Amaana Platform — Active Implementation State

## State
**STAGING_PHASED_IMPLEMENTATION_ACTIVE**

## Integration branch
- `phase-public-site-rebuild`
- Family feedback/review is complete as of 21 September 2026.
- Quiet-mode restrictions are lifted. Audited implementation may be pushed phase-by-phase to staging on this branch.
- Current implementation head at this checkpoint: `4c56a0f6fa351ea9262aff945bd6043d6f56ea04`.
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
- All 175 staging `MediaAsset` IMAGE records were removed. Three legacy MP4 records/files remain outside this image-reset scope and hosted video remains fail-closed publicly.
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
- SEO browser coverage extended to donation/sponsorship routes and page-level social images.
- Document-title regression coverage prevents duplicate Amaana branding.
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
