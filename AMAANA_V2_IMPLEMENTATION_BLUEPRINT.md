# Amaana Foundation V2 — Implementation Blueprint

Status: ACTIVE EXECUTION PLAN
Branch: `phase-public-site-rebuild`

This blueprint converts all accumulated Amaana source material, user direction, external audit feedback, and implementation lessons into an execution standard. It supplements the existing master experience plan and governs the V2 rebuild.

## 1. Product thesis

Amaana Foundation must not look like a generic NGO template. The public experience should feel like a living documentary of service: real photography, real stories, measurable outcomes, Islamic motivation, local roots, transparent evidence, and graceful pathways to act.

Creative concept: **Living Amanah**.

Design pillars:
- **Faith** — why Amaana serves.
- **Dignity** — how people are represented and supported.
- **Action** — what Amaana actually did.
- **Evidence** — how visitors can verify outcomes.
- **Continuity** — how the work grows from year to year.

## 2. Lessons that now govern the rebuild

The previous public site failed because engineering completion was mistaken for product completion. A successful build, HTTP 200, database schema, or working admin flow is not a finished public experience.

The V2 rebuild therefore follows these non-negotiable rules:
1. Real Amaana content drives the interface; the interface does not dictate what content is allowed to exist.
2. Real Amaana media replaces generic gradients, empty cards, and placeholder branding wherever source media is available.
3. Public pages must tell stories, not expose internal software concepts.
4. Trust must be demonstrated through dates, photos, outcomes, reports, verification process, and compliance evidence.
5. No page is complete without desktop, mobile, accessibility, empty/error state, and content-source QA.
6. Never invent programmes, statistics, beneficiary outcomes, donation categories, urgency, religious claims, or compliance claims.
7. Staging remains non-indexable until deliberately released.
8. Backend work is frozen except security, payment integrity, content-model needs, and verified operational defects.

## 3. Visual direction

The target is a premium editorial-documentary experience with a restrained Islamic identity.

### Palette direction
- Warm ivory/parchment base.
- Deep ink/navy for authority and emotional depth.
- Restrained antique/warm gold for highlights and the signature visual thread.
- Secondary colours derived from the official Amaana logo and authentic campaign media after final asset extraction.
- Green may appear contextually but must not become the default 'Muslim charity' cliché.

### Typography
Use an expressive editorial serif for large emotional statements and a clean contemporary sans-serif for navigation, data, controls, and body text. Avoid generic Arial-led presentation.

### Signature device — The Golden Thread
A restrained gold line visually connects donor intent, procurement, preparation, distribution, and impact. It can become a scroll-progress motif in timelines, initiative journeys, and transparency sections.

### Motion
Use cinematic crossfades, subtle image scale/parallax, scroll reveals, number animation, gallery transitions, and light hover movement. Every animation must respect `prefers-reduced-motion`. No autoplay audio, excessive motion, glassmorphism overload, or decorative gimmicks.

## 4. Information architecture

Primary navigation:
- Our Work
- Impact
- Stories
- Faith & Reflections
- About
- Get Involved
- Donate

Secondary journeys remain accessible for Appeals, Request Assistance, How We Work/Verify, Contact, Transparency/Compliance, Policies, and social channels.

## 5. Content architecture for growth

The platform must support future expansion without code redesign.

### Cause
A durable area of service, e.g. Food & Dignity, Education, Medical & Financial Assistance, Seasonal Relief, Emergency Relief, Livelihoods.

Recommended fields:
- id / slug
- title
- short description
- long introduction
- hero media
- visual theme
- display order
- featured flag
- active/archive status
- related faith topics
- SEO metadata

### Initiative
A concrete programme or recurring campaign under a Cause, e.g. Eid Gift Kits, Qurbani Meat Distribution, Taleem Initiative, Winter Drive.

Recommended fields:
- cause relation
- title / slug
- year / period
- location
- summary / full story
- hero media / gallery / video
- status
- impact metrics
- financial/report evidence
- related appeals
- related articles/reminders
- donation eligibility notes
- featured flag

### Appeal
A time-bound fundraising need with verified story, target, status, updates, donation flow, consent/privacy controls, and closure/outcome.

### Story
Editorial field note or completed impact story linked to one or more causes/initiatives/appeals.

### FaithContent
Supports three public types:
- Article
- Reminder
- Video

Recommended fields:
- type
- title / slug
- excerpt
- body or video URL
- topic tags
- featured image
- Qur'an/hadith references
- verification status
- reviewer/source notes
- publish state/date
- related Amaana work

### MediaAsset
Canonical media register for image, video, document, poster/creative, logo, and report assets with source provenance, privacy classification, alt text, caption, year, initiative, quality status, and publication approval.

This model allows Amaana to add new causes, initiatives, stories, articles, reminders, and videos without restructuring the site.

## 6. Homepage experience

The homepage should be choreographed in three emotional speeds: Wonder -> Understanding -> Trust.

1. **Cinematic hero** — authentic Amaana imagery/video frames; 4–5 story slides; quiet movement; high contrast; clear CTA.
2. **Origin statement** — visual silence: 'It started with 85 families during Ramadan 2020.'
3. **Current action** — active priority appeal/initiative or a useful no-active-appeal state.
4. **Our Work mosaic** — asymmetric photographic service map, not six identical cards.
5. **Seven Years of Eid Kits** — signature 2020–2026 growth narrative, linking to the full case study.
6. **Featured human story** — one dignified long-form story teaser.
7. **Impact field** — metrics tied to source stories, not isolated counters.
8. **How Amaana Works** — Golden Thread from request/support to verified delivery and closure.
9. **A Reminder for the Heart** — homepage gateway into Faith & Reflections.
10. **Latest from Faith & Reflections** — one article, one reminder, one video where published.
11. **Field Journal** — real photos/videos/social updates.
12. **See What Your Trust Became** — transparency teaser that maps contributions to outcomes and reports.
13. **Our Story / Team teaser**.
14. **Get involved**.
15. **Emotional closing image + rich footer**.

## 7. Flagship Eid Kits case study

Eid Kits becomes the visual benchmark for every initiative page.

Opening narrative:
- 2020 — 85 families.
- 2026 — 710 Eid Gift Kits / families reached.
- Seven consecutive years of community-supported giving.

Page modules:
- cinematic hero
- seven-year scroll timeline
- annual family counts and documented kit-cost/donation figures
- real yearly campaign photographs
- 'What goes into a kit' editorial module
- appeal -> procurement -> packing -> distribution -> gratitude process
- 2026 beneficiary/category visualization after approved-data reconciliation
- campaign posters as historical artefacts
- video moments
- financial/report evidence
- related Ramadan/Faith content
- social coverage
- next initiative / support journey

## 8. Faith & Reflections

This is a first-class editorial destination, not a footer blog.

Public sections:
- Articles
- Islamic Reminders
- Videos
- Topics

Potential topic taxonomy:
Qur'an, Hadith, Sadaqah, Zakat, Ramadan, Qurbani/Udhiyah, Compassion, Mercy, Gratitude, Patience, Family, Helping Others, Caring for Orphans, Relieving Hardship, Education, Character, Service.

Homepage gateway: **A Reminder for the Heart**.

Editorial rules:
- verses: Arabic, translation, exact citation and context verified before publication
- hadith: source/reference/authenticity verified before publication
- do not present Amaana as a fatwa or scholarly authority
- Zakat guidance requires qualified/authoritative review or links
- connect faith content to real Amaana work where appropriate without forcing a religious reference into every page

## 9. Our Work experience

Desktop: asymmetric photographic mosaic with initiative scale reflecting importance/history. Mobile: immersive vertical editorial stream.

Initial verified initiative families:
- Eid Gift Kits
- Qurbani / Meat Distribution
- Taleem Initiative
- Winter Drive
- Dates Distribution
- Hyderabad Flood Relief 2020
- Medical & Financial Assistance
- Livelihood Assistance where source-backed

The UI must dynamically accommodate future causes and initiatives.

## 10. Impact and transparency

Impact is an evidence explorer, not three counters.

Design concepts:
- 'Impact is not one number.'
- metrics grouped by type of service/year/cause
- every statistic links to supporting initiative/story/report where possible
- historical year explorer
- campaign-level data visualizations
- completed appeal outcomes

Transparency concept: **See What Your Trust Became**.

Show contribution -> goods/support -> delivery -> measurable outcome -> source/report. Sensitive legal, medical, identity, bank, and private-supporting documents remain private or are redacted before public display.

## 11. Stories of Amanah

Completed medical, financial, livelihood, emergency and community assistance can become dignified editorial stories where consent/publication status allows.

Story structure:
- circumstance
- what was verified
- what Amaana/community did
- amount/support delivered where approved
- known outcome only
- date/location/context
- privacy-safe imagery

No invented recovery, success, or emotional claims.

## 12. About / origin experience

About begins in Ramadan 2020, before it begins with institutional definitions.

Narrative arc:
COVID hardship -> family action -> 85 families -> recurring Eid effort -> growing community -> institutional formalization -> present-day Amaana.

Important historical/legal distinction to resolve before final copy: source narrative describes formalization in 2023 while official legal registration is dated 23 February 2024. Do not publish a reconciled interpretation without source confirmation/approval.

Governance, operational admins/team, trustees, volunteers, and collaborators are separate concepts and must not be conflated.

## 13. Appeals and donation UX

Active appeals must be rich, verified and human. No active appeals must never create a dead end.

No-active-appeal state:
- explain there is no active public appeal
- direct to completed impact/stories
- direct to Follow Our Work
- only show another donation route if legally and operationally approved

No fake urgency, countdowns, donor avatars, manipulative progress, or unverified Zakat labels.

Donation completion should feel human and faith-grounded rather than transactional: acknowledgement, receipt/status, related impact, and follow-up path.

## 14. Mobile standard

Mobile is not a compressed desktop version.
- full-screen navigation
- vertical cinematic hero
- touch-first galleries
- stacked timeline
- readable editorial typography
- sticky action controls only when contextually useful
- comfortable forms/payment
- real Android-width testing

## 15. Engineering sequence

### Wave 0 — Safety gates
- keep staging noindex
- verify mobile navigation
- audit Razorpay failed-state/idempotency behavior
- add assistance abuse/rate limiting if absent
- verify staff notifications
- preserve private storage rules

### Wave 1 — Design foundation
- new visual tokens
- typography system
- spacing/layout primitives
- editorial section patterns
- Golden Thread primitives
- motion/reduced-motion framework
- global shell/navigation/footer

### Wave 2 — Content architecture
- Cause / Initiative / Story / FaithContent / MediaAsset models
- admin CRUD/publishing workflow
- publication states and source/provenance fields
- religious-content verification flags
- privacy/publication approval flags

### Wave 3 — Homepage
Build the full narrative homepage shell and progressively replace temporary visual surfaces with canonical Amaana media as the asset register is ingested.

### Wave 4 — Our Work + flagship Eid Kits
- work mosaic
- initiative template
- Eid Kits 2020–2026 case study

### Wave 5 — Impact + Stories + Transparency
- evidence explorer
- Stories of Amanah
- reports/evidence linking

### Wave 6 — Faith & Reflections
- hub
- article/reminder/video templates
- topics/filtering
- homepage reminder widget
- admin publishing controls

### Wave 7 — Appeals / Donate / Assistance
- repair dead ends
- richer appeal detail
- donation journey
- request-assistance security/UX

### Wave 8 — About / Team / Get Involved / Contact / Social

### Wave 9 — Full QA
- source accuracy
- privacy/compliance
- desktop/mobile visual
- keyboard/accessibility
- performance
- reduced motion
- workflows
- empty/loading/error states
- external independent QA

## 16. Definition of done

A page is complete only when:
- canonical source content is mapped
- authentic approved media is used where available
- design matches Amaana V2 direction
- interactions are implemented and reduced-motion safe
- desktop and mobile are visually inspected
- accessibility is checked
- every CTA works
- empty/error/loading states work
- privacy/compliance risks are reviewed
- build/CI passes
- independent QA has been completed
- unresolved discrepancies are documented

## 17. Immediate implementation started

The first implementation wave on `phase-public-site-rebuild` begins with:
- V2 visual layer and editorial homepage foundation
- revised global navigation including Our Work, Impact, Stories, and Faith & Reflections
- scalable verified-content registry for the first initiative set
- initial Our Work hub
- initial Faith & Reflections hub

Canonical archive media will then replace temporary non-photographic visual surfaces as file-by-file media ingestion completes. No placeholder image will be presented as real Amaana work.
