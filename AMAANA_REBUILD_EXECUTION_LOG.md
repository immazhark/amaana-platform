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

Faith now includes a verified detail route rather than an index-only library.

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

Phase 6 is **not certified complete**. Authentic photography and official brand assets are still required for final creative certification.

## Phase 7 — UX, motion and accessibility refinement — ACTIVE IN PARALLEL

Work already underway:
- keyboard-visible skip link;
- mobile navigation focus-tree behaviour;
- focus-visible treatment across high-value discovery patterns;
- semantic progress indicators;
- labelled form regions and live error/loading feedback;
- specific accessible names for ambiguous actions;
- reduced-motion handling in major experience CSS;
- fixed-header anchor scroll offset;
- removal of broad vertical overflow clipping from the public experience.

Still open:
- full keyboard traversal;
- screen-reader spot checks;
- contrast audit;
- touch-target audit;
- browser zoom/reflow;
- representative desktop/tablet/mobile visual QA;
- real-device motion/performance review.

## Phase 8 — Full QA and release hardening — PENDING

Required:
- factual/religious/compliance review;
- privacy/public-media gate review;
- Razorpay staging reconciliation and failure-state tests;
- Assistance submission/document/tracking E2E;
- Core Web Vitals and route transfer budgets on production-like infrastructure;
- browser/device visual QA;
- accessibility verification;
- rendered metadata/canonical/structured-data review;
- full dead-link/orphan/sitemap crawl;
- independent public-site review against the locked design standard.

## Phase 9 — Staging acceptance and merge — PENDING

- Deploy/verify staging candidate.
- User acceptance review.
- Resolve release blockers.
- Enable production indexing only as an explicit release action.
- Merge to `main` only after explicit approval.

## Current checkpoint

- Branch: `phase-public-site-rebuild`.
- CI #265 passed on `b4ea64be5f72305ffbaeeada8f5bb3bc2c81844d` before the latest audit/refinement commits.
- Phase 5 remains active for authentic media and official brand recovery.
- Phase 6 is active and is re-auditing previous public work rather than assuming earlier code is final.
- Phase 7 accessibility/responsive refinement is running in parallel where issues are discovered.
- Latest continuity audit corrected an important documentation overstatement: current blue/gold values are provisional until master branding assets are successfully inspected.
- Latest shared refinement removes broad vertical clipping, strengthens keyboard focus visibility and reserves scroll offset for fixed-header anchor navigation.
- Nothing in Phase 8/9 is considered complete yet.
