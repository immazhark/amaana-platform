# Amaana Foundation V2 — Locked Execution Plan

Status: ACTIVE
Branch: `phase-public-site-rebuild`
Brand name: **Amaana Foundation**
Brand anchors: **Amaana Blue `#466FAA`** and **Amaana Gold `#E0B318`**
Creative direction: **Living Amanah**

This plan incorporates the user brief, Amaana source material, prior implementation failures, and review feedback from Codex, Claude and Gemini. It is the working execution sequence for the public-site rebuild.

## 1. Non-negotiable outcome

Amaana Foundation must feel like a premium, contemporary, faith-grounded humanitarian platform built from real Amaana work. It must not resemble a generic charity template, admin product, or stock-photo NGO site.

The experience should balance three emotional speeds:
- **Wonder** — cinematic photography, visual storytelling, editorial composition.
- **Understanding** — clear initiative narratives, timelines, causes, stories and educational content.
- **Trust** — verified outcomes, reports, process, compliance, privacy and accurate donation information.

## 2. Governing principles

1. Real Amaana content drives design decisions.
2. Real Amaana images and videos take priority over decorative placeholders.
3. Brand colours are anchors, not restrictions: use exact blue/gold where appropriate and derived shades/tints elsewhere.
4. No fake urgency, fake donor avatars, countdowns, invented programmes or unverified claims.
5. Islamic identity must be authentic, useful and verified rather than decorative.
6. Beneficiary dignity and privacy override visual drama.
7. Every public page must have a useful next step; no dead ends.
8. Future causes and initiatives must be addable without redesigning the site.
9. Build success and HTTP 200 are engineering checks, not product completion.
10. No page is complete until source, visual, mobile, accessibility, workflow and privacy QA pass.

## 3. Product architecture

### Primary entities
- **Cause** — durable area of service.
- **Initiative** — programme or recurring campaign under a cause.
- **Appeal** — time-bound verified fundraising need.
- **Story** — field note, completed assistance story or editorial update.
- **FaithContent** — Article, Reminder or Video.
- **MediaAsset** — canonical image, video, logo, creative, report or document with provenance and privacy status.

### Initial public journeys
- Home
- Our Work
- Cause pages
- Initiative pages
- Appeals
- Appeal detail
- Impact
- Stories of Amanah
- About / Our Story
- Team / Governance
- How Amaana Works
- Faith & Reflections
- Articles
- Reminders
- Videos
- Get Involved
- Request Assistance
- Donate
- Transparency / Compliance
- Contact
- Policies

## 4. Design system

### Brand colour logic
- Anchor blue: `#466FAA`
- Anchor gold: `#E0B318`
- Derived deep ink/navy from Amaana blue for cinematic sections.
- Soft blue tints for quiet backgrounds and informational surfaces.
- Warm ivory / paper / sand neutrals for editorial warmth.
- Softer or deeper gold variants may be used for readability and restraint.

### Visual language
- real documentary photography
- cinematic full-bleed media
- editorial serif + modern sans pairing
- asymmetric grids
- large-scale numbers
- generous negative space
- restrained Islamic geometry and architectural references
- signature **Golden Thread** linking intent -> action -> impact
- purposeful motion with reduced-motion support

### Avoid
- generic green NGO styling
- endless rounded cards
- glassmorphism for decoration
- stock humanitarian photography
- AI beneficiary imagery
- excessive crescents/lanterns
- internal workflow language in public copy

## 5. Homepage sequence

1. Cinematic real-media hero / carousel.
2. Origin moment: Ramadan 2020 / 85 families.
3. Current action: active appeal or useful no-active-appeal state.
4. Asymmetric Our Work mosaic.
5. Seven Years of Eid Kits signature timeline.
6. One featured human story.
7. Evidence-led impact field.
8. How Amaana Works using Golden Thread.
9. "A Reminder for the Heart" gateway.
10. Latest Faith & Reflections: article + reminder + video.
11. Field Journal / latest photos, video and social activity.
12. "See What Your Trust Became" transparency teaser.
13. Our Story / Team teaser.
14. Get Involved.
15. Emotional final image and rich footer.

## 6. Flagship implementation benchmark: Eid Gift Kits

Eid Kits becomes the quality benchmark for every initiative page.

Required modules:
- authentic hero image/video
- seven-year 2020-2026 timeline
- annual family/kit figures
- documented annual financial information
- yearly real photos
- kit-contents visual story
- appeal -> procurement -> packing -> distribution -> gratitude journey
- 2026 approved impact breakdown
- campaign creatives as historical artefacts
- videos where suitable
- transparency/report links
- related Ramadan / Sadaqah content
- related social coverage

## 7. Faith & Reflections

This is a first-class editorial product, not a miscellaneous blog.

Content types:
- Islamic Articles
- Islamic Reminders
- Videos

Homepage component:
- **A Reminder for the Heart**
- one latest verified reminder
- one featured article/video
- link to full Faith & Reflections area

Religious publishing gate:
- Qur'an Arabic verified
- translation verified
- citation and context verified
- hadith source/authenticity verified
- scholarly/fiqh claims reviewed or linked to authoritative sources
- Amaana never presents itself as a fatwa authority

## 8. Growth-ready causes

No current initiative is hard-wired into the information architecture.

The admin/content system must allow future creation of:
- new causes
- new recurring initiatives
- annual editions of an initiative
- new appeals
- new stories
- new galleries/videos
- new faith content

Public navigation, work grids, related-content modules and filters must consume content dynamically.

## 9. Execution waves

### Wave A — Safety and integrity
- staging noindex
- mobile navigation
- Razorpay failed-state/idempotency audit
- assistance-request abuse/rate limiting
- staff notification audit
- private document storage/security review

### Wave B — Brand and design foundation
- brand token system
- typography
- spacing/grid rules
- navigation/footer
- editorial section primitives
- Golden Thread primitives
- motion/reduced-motion system

### Wave C — Content model
- Cause
- Initiative
- Story
- FaithContent
- MediaAsset
- relationships to Appeals
- publish states
- source/provenance fields
- privacy approval fields
- religious verification state

### Wave D — Homepage
- full visual choreography
- replace non-media surfaces with approved Amaana media
- no-active-appeal UX
- Faith gateway
- Field Journal

### Wave E — Our Work + Eid Kits flagship
- work hub
- cause hierarchy
- initiative template
- complete Eid Kits case study

### Wave F — Impact + Stories + Transparency
- evidence explorer
- completed-assistance stories
- report/document mapping

### Wave G — Faith & Reflections publishing system
- hub
- article page
- reminder page/card
- video page
- topics/tags
- homepage feed
- admin publishing workflow

### Wave H — Appeals / Donate / Request Assistance
- rich active appeals
- useful empty states
- donation UX
- receipt/acknowledgement UX
- domestic-donation compliance language
- Zakat restrictions per initiative
- assistance form security and UX

### Wave I — About / Team / Contact / Social / Get Involved

### Wave J — Full QA and launch readiness
- source accuracy
- content discrepancy review
- desktop visual QA
- mobile visual QA
- Android-width QA
- keyboard/accessibility
- reduced motion
- performance/image optimization
- empty/loading/error states
- privacy/compliance
- donation workflows
- independent review

## 10. Definition of done

No feature is marked complete until:
- its source content is traceable
- approved authentic media is used where available
- the UI meets Amaana V2 visual direction
- desktop and mobile have been visually inspected
- accessibility has been checked
- all CTAs/workflows work
- empty/loading/error states work
- privacy/compliance risks are reviewed
- build/CI passes
- independent QA is recorded
- remaining gaps are explicitly documented

## 11. Immediate implementation status

Started on `phase-public-site-rebuild`:
- V2 homepage foundation
- scalable Our Work content registry
- Faith & Reflections route
- Stories route
- Get Involved route
- evidence-led Impact rewrite
- revised public navigation
- Amaana brand token layer using `#466FAA` / `#E0B318`
- removal of the fabricated single-letter placeholder logo treatment

Next implementation focus:
1. ingest real logo and media assets into the repo/storage pipeline
2. build cinematic media hero
3. build Eid Kits flagship page
4. add dynamic Cause/Initiative/Story/FaithContent schema and admin flows
5. run visual QA before declaring the first public-design wave complete
