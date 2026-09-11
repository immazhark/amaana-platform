# Amaana Foundation — Public Site Rebuild Execution Log

This is the durable implementation record for `phase-public-site-rebuild`. Code or green CI alone does not make a phase release-ready.

## Working rules

- Creative direction: **Living Amanah — Faith. Dignity. Action.**
- Two-Wow objective: first the experience, then the depth and evidence of Amaana's work.
- Authentic Amaana material is preferred over stock or generated beneficiary imagery.
- No invented programmes, statistics, religious claims, compliance claims, donation categories, urgency or beneficiary stories.
- Private verification material stays private; public rendering requires a separate public-safe/privacy decision.
- Domestic contributions only; Amaana is not FCRA-registered.
- Provisional 80G must never be represented as final/permanent; 12AB/12A remains subject to professional confirmation.
- No merge to `main` until content, media, visual, responsive, accessibility, workflow, privacy, performance and release QA are complete.
- Official logo/source brand colours are not considered certified until the original branding archive can be inspected successfully.

## Phase 0 — Safety and content architecture — IMPLEMENTED

- Existing Next.js/TypeScript/Prisma platform retained.
- Dynamic Cause, Initiative, Story, FaithContent and MediaAsset architecture added.
- Privacy-gated public stories/media and religious-review gating retained.
- Eid evidence validation fails closed on inconsistent totals.
- Donation/payment, assistance abuse controls, private-document handling, notifications and indexing safeguards retained/audited.

## Phase 1 — Core public journeys — IMPLEMENTED

Rebuilt: Home, About, Our Work, initiative detail, Eid flagship, Impact, Stories, Faith & Reflections, Get Involved, Contact, Appeals, Donate, Request Assistance, acknowledgement/receipt/tracking states.

Faith includes a verified detail route rather than an index-only library.

## Phase 2 — Trust architecture — IMPLEMENTED / CI VERIFIED

- How We Verify.
- Transparency around `Public evidence. Private proofs.`
- Compliance with domestic/FCRA/provisional-80G/12AB boundaries.
- Dedicated trust visual system.

## Phase 3 — Policy and utility experience — IMPLEMENTED / CI VERIFIED

- Privacy, Donation Policy, Refund Policy and Terms rebuilt editorially.
- 404, error and global-error states rebuilt.
- Global App Router loading state added later in Phase 6.

## Phase 4 — Governance / organizational trust — IMPLEMENTED / CI VERIFIED

Verified public facts used:
- Amaana Foundation, Trust.
- DARPAN ID `TS/2024/0403215`.
- DARPAN registration 21-05-2024.
- Registration `BK-4, CS No 59/2024`.
- Sub-Registrar / Registration Act 1908.
- Hyderabad, Telangana.
- Entity registration date 23-02-2024.
- Trustees: Mohammed Ather Khan, Mohammed Mazhar Khan, Syed Iqba Ali.

Sensitive addresses, IDs, signatures and unredacted legal material remain excluded.

## Phase 5 — Authentic content and media population — IN PROGRESS

Implemented:
- `AMAANA_CONTENT_ASSET_REGISTER.md`.
- Admin Media Review workspace and RBAC permissions.
- Explicit publication/privacy approval gate.
- Separate mandatory public-media bucket boundary; private assistance storage remains private.
- Public media type/size/signature validation and HTTPS delivery requirements.
- Public-media readiness reporting and operational preflight documentation.
- Eid and Qurbani original-photo candidates inventoried with evidence-limited alt/caption guidance.

Open Phase 5 gates:
- actual target-environment public-media configuration;
- explicit approval/publication of selected originals;
- remaining archive enumeration and campaign-by-campaign inventory;
- official isolated logo/master colour recovery.

`Branding & Logo.zip` has been found and materialized, but runtime ZIP enumeration/extraction continues to time out. No approximation is allowed to become the master logo.

## Phase 6 — Whole-site senior UX / creative / performance pass — ACTIVE

Quality standard is locked in `AMAANA_PHASE6_EXPERIENCE_QUALITY_STANDARD.md` and detailed work is recorded in `AMAANA_PHASE6_IMPLEMENTATION_LOG.md`.

Implemented during the active Phase 6 pass:
- Homepage first-Wow editorial hero with authentic approved-media support and evidence-led fallback.
- Our Work documentary discovery recomposition.
- Lean public data projections across Home, Our Work, Impact, Stories, Faith, Appeals and donation context.
- Request-level memoization where metadata and page rendering can share a public record.
- Progressive route-scoping of large CSS payloads.
- Razorpay script deferred until after important page work.
- Public analytics deferred to idle time and excluded from sensitive journeys.
- Media geometry reservation, lazy below-fold media and explicit priority only for genuine above-fold media.
- Robots/indexing gate alignment, expanded sitemap, canonical/social metadata coverage and conservative Organization/WebSite structured data.
- Mobile navigation accessibility correction and Escape handling.
- Assistance and donation form semantics/live state improvements.
- Global loading state.
- Repeated inline presentation cleanup across audited major pages.
- Stronger focus-visible, anchor scroll-offset and overflow behaviour in the shared refinement layer.
- Transparency hero moved away from repeated orbit/circle visual language into an evidence-folio composition to reduce cross-page creative repetition.

Phase 6 is **not certified complete**. Authentic photography and official brand assets are still required for final creative certification.

## Phase 7 — UX, motion and accessibility refinement — ACTIVE / SOURCE-HARDENED

Implemented source-level safeguards now include:
- keyboard-visible skip link;
- mobile navigation focus transfer, Escape return and Tab/Shift+Tab containment while expanded;
- focus-visible treatment across high-value discovery patterns;
- semantic progress indicators;
- labelled form regions and live error/loading feedback;
- assistance server errors associated to their controls and focus moved to the first invalid field;
- specific accessible names for ambiguous actions;
- global reduced-motion handling for smooth scrolling, animation and transition timing;
- forced-colors focus/control safeguards;
- fixed-header anchor scroll offset;
- removal of broad vertical overflow clipping from the public experience;
- hosted `VIDEO` media fails closed until synchronized caption support is modeled and verified;
- trust-page small informational labels on light surfaces use an accessible blue role instead of low-contrast working gold.

Still open:
- complete real-browser keyboard traversal;
- screen-reader spot checks;
- rendered contrast verification;
- touch-target audit;
- 200%/400% browser zoom/reflow;
- representative desktop/tablet/mobile visual QA;
- real-device motion/performance review;
- caption architecture/content verification before hosted video can be enabled.

## Phase 8 — Full QA and release hardening — ACTIVE / SOURCE-AUTOMATION ADVANCED

Implemented during this phase:
- centralized public/static and private/transactional route-publication policy used by both sitemap and robots;
- segment-safe private-route matching plus CI regression tests;
- sensitive `/api/*` caching fails closed globally with `private, no-store`;
- production build is started inside CI after compilation and smoke-tested for liveness, key public route rendering, Request Assistance rendering, no-store behavior and critical security headers;
- running-server smoke gate verified green in CI #340;
- aggregate built static JavaScript/CSS sizes are measured in CI and budgeted;
- first measured output: 616,855 B JavaScript / 196,210 B CSS;
- regression budgets tightened to 800 KiB JavaScript / 256 KiB CSS based on measured output rather than arbitrary multi-megabyte ceilings;
- donation browser verification failure now has a reconciliation state that blocks a second checkout attempt after Razorpay has returned a payment response;
- production indexing remains explicitly disabled in CI/staging-like builds unless the official HTTPS-domain release flag is intentionally enabled.

Still open before Phase 8 certification:
- browser-level E2E with stable production-like fixtures;
- staged Razorpay success/failure/reconciliation/refund/duplicate paths;
- staged Assistance upload/receipt/tracking/reviewer/cleanup-failure paths;
- rendered crawl/canonical/structured-data validation against deployed staging;
- Core Web Vitals (LCP, INP, CLS), route transfer profiling and slow-network review;
- Chrome/Safari/Firefox and representative mobile/tablet/desktop visual QA;
- assistive-technology verification;
- factual/religious/compliance professional review where required;
- independent public-site creative review against the locked quality standard.

## Phase 9 — Staging acceptance and merge — BLOCKED ON REAL ENVIRONMENT ACCESS / USER APPROVAL

Required:
- identify/access the actual staging deployment and provider configuration;
- verify database migrations/readiness, public/private storage separation, notifications and public-media preflight;
- execute Razorpay test-mode donation/reconciliation/refund journeys;
- execute Assistance submission/document/tracking/reviewer journeys;
- run real browser/device/accessibility/performance acceptance checks;
- user acceptance review;
- resolve remaining release blockers;
- enable production indexing only as an explicit release action;
- merge to `main` only after explicit approval.

Repository inspection alone is not evidence that these production-like checks passed.

## Current checkpoint

- Branch: `phase-public-site-rebuild`.
- CI #340 verified install, Prisma generation/validation, lint, typecheck, coverage, production build and the new running-server smoke/header gate.
- First aggregate bundle measurement subsequently passed at 616,855 B JavaScript / 196,210 B CSS; tighter 800 KiB / 256 KiB budgets are now the active CI thresholds.
- Phase 5 remains active for authentic media and official brand recovery.
- Phase 6 remains active pending authentic photography, master identity and final rendered creative review.
- Phase 7 is source-hardened but still requires real-browser/device/assistive-technology certification.
- Phase 8 is active with materially stronger automated release gates; production-like/browser certification remains open.
- Phase 9 cannot be honestly certified from source inspection because no staging URL/provider control plane is available in this working context.
- `main` remains untouched.
