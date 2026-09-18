# Amaana Foundation — Final Human Launch QA Checklist

This checklist is the human evidence layer that complements automated CI, staging acceptance and repository preflight. It does **not** authorize production launch, indexing, real payments, beneficiary-media publication or a merge to `main`.

Record each review against one exact candidate SHA. If the candidate changes in a way that affects the reviewed surface, repeat the relevant checks.

## 1. Candidate identity

- [ ] Record exact candidate SHA.
- [ ] Confirm `npm run launch:preflight` is green.
- [ ] Confirm the candidate is the same SHA intended for Railway staging.
- [ ] Confirm no one-shot acceptance flag is unintentionally left enabled.
- [ ] Confirm indexing remains disabled during review.

## 2. Human rendered accessibility review

Review at minimum:

- desktop 1440 × 900;
- tablet 768 × 1024;
- mobile 390 × 844;
- browser zoom 200% on desktop;
- keyboard-only navigation;
- reduced-motion preference.

For the following route families:

- [ ] Home
- [ ] About / organization
- [ ] Our Work index
- [ ] Programme detail
- [ ] Appeals index
- [ ] Appeal detail
- [ ] Donate / donation form
- [ ] Request Assistance
- [ ] Transparency / Governance / Compliance
- [ ] Admin sign-in
- [ ] Protected admin operations console

Confirm:

- [ ] no horizontal overflow or clipped primary content;
- [ ] text remains readable and controls usable at 200% zoom;
- [ ] visible focus never disappears;
- [ ] skip link reaches the main content;
- [ ] keyboard order follows the visual/logical order;
- [ ] mobile navigation opens/closes correctly and restores focus;
- [ ] modal/drawer/fixed controls do not trap or obscure focus;
- [ ] reduced-motion mode removes non-essential autoplay/motion;
- [ ] no fixed control overlaps another interactive element;
- [ ] form errors are announced and associated with the correct field;
- [ ] colour/contrast concerns observed by the reviewer are recorded rather than waived informally.

Only then may `manual-rendered-accessibility-review` be considered for VERIFIED status.

## 3. Editorial, factual and terminology review

- [ ] Newborn medical-aid amount is ₹107,520 everywhere it appears.
- [ ] Winter Drive overall metric is 234 Winter Kits to 234 beneficiaries.
- [ ] Aliza medical-aid amount is shown exactly as ₹482,700 where the specific case amount is stated.
- [ ] 12A / 12AB is described as provisional.
- [ ] 80G is described as provisional and not as final/permanent.
- [ ] Amaana is clearly described as not FCRA-registered.
- [ ] Donation messaging remains domestic India-only.
- [ ] Normal acknowledgement is not represented as an 80G tax-deduction certificate.
- [ ] Public category terminology is consistent across navigation, cards and detail pages.
- [ ] CTA labels describe the actual destination/action and do not imply unavailable live services.
- [ ] Completed appeals do not read as currently fundraising.
- [ ] No placeholder, staging-test or internal workflow language appears on public pages.

## 4. SEO and social-share review

With indexing still disabled:

- [ ] canonical URL matches the intended public URL on representative pages;
- [ ] meta title and description are meaningful and page-specific;
- [ ] `og:title`, `og:description` and `og:url` match the page;
- [ ] Twitter/X metadata is present;
- [ ] Open Graph and Twitter images render correctly;
- [ ] Organization/NGO/WebSite JSON-LD contains only confirmed public information;
- [ ] staging `robots.txt` remains fail-closed;
- [ ] staging sitemap remains empty while indexing is disabled.

Immediately before an indexing decision, repeat canonical/robots/sitemap checks against the approved production hostname.

## 5. Public-media human review

For every media item intended to remain public:

- [ ] provenance/source association is known;
- [ ] programme/year association is correct;
- [ ] website use is an approved channel, not inferred from social-media publication;
- [ ] identifiable minors/patients/beneficiaries are handled according to documented consent;
- [ ] private documents, identity details, banking details and medical records are absent;
- [ ] captions/alt text describe visible, verified facts without inference;
- [ ] hero/high-prominence use receives separate consideration;
- [ ] sensitive images are restricted or unpublished when consent/provenance is insufficient;
- [ ] decision is recorded in the public-media review register/admin review workflow.

Do not mark `public-media-human-review` VERIFIED merely because an image was previously posted publicly.

## 6. Transactional email acceptance

Using only an Amaana-controlled test recipient:

- [ ] production sender/domain is verified;
- [ ] live email mode is enabled only in the approved environment;
- [ ] one controlled notification is queued;
- [ ] cron/job reaches the correct environment;
- [ ] exactly one email is accepted and received;
- [ ] queue row reaches SENT;
- [ ] retry/idempotency behavior is verified without creating a duplicate message;
- [ ] a terminal failure can be inspected and, after correction, manually requeued with an audit reason.

No beneficiary-sensitive production content should be used for the first acceptance.

## 7. Payment operations — only after Razorpay live approval and explicit authorization

- [ ] Razorpay live/KYC readiness is confirmed.
- [ ] One explicitly authorised controlled donation is performed.
- [ ] order creation, payment confirmation and webhook reconciliation agree.
- [ ] donation status reaches the expected captured state.
- [ ] acknowledgement/receipt state is correct.
- [ ] refund flow is tested only within the approved controlled scope.
- [ ] refunded amount and net retained totals reconcile.
- [ ] no duplicate donation/payment event is created.
- [ ] donor receives only the intended notification.
- [ ] public appeal target/funded state updates correctly.

Do not perform this section without explicit authorization.

## 8. Rollback rehearsal

- [ ] record candidate SHA/deployment;
- [ ] record previous known-good SHA/deployment;
- [ ] verify current database migration is rollback-compatible;
- [ ] confirm database snapshot/recovery evidence exists;
- [ ] switch staging to the previous known-good deployment using Railway's supported rollback/redeploy mechanism;
- [ ] verify live/readiness health;
- [ ] verify representative public routes and private-boundary routes;
- [ ] restore the candidate;
- [ ] repeat health and route checks;
- [ ] record deployment IDs/timestamps and outcome.

Only successful execution may resolve the `rollback-rehearsal` gate.

## 9. Final production authorization

Before any launch action:

- [ ] all required production gates in `docs/launch-readiness.json` are VERIFIED or explicitly NOT_APPLICABLE with evidence;
- [ ] production indexing decision is explicit;
- [ ] live payment decision is explicit;
- [ ] public-media human review is complete;
- [ ] final candidate SHA is frozen;
- [ ] merge/promotion to `main` has explicit user authorization.

A green checklist is evidence for a decision; it is not itself authorization to launch.
