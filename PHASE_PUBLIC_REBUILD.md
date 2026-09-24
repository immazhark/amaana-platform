# Amaana Foundation — Public Site Rebuild Phase

## Goal
Rebuild the public-facing Amaana Foundation website around authentic media, real initiative history, clear visitor journeys, and a distinctive visual system while preserving backend work that survives audit.

## External review baseline
This phase incorporates the recurring findings from Codex, Claude, and Gemini, while verifying every technical claim against the repository before acting on it.

## Non-negotiable design direction
- Homepage opens with a full-width, banner-style visual hero/carousel using authentic Amaana Foundation media.
- The first viewport must create immediate emotional and visual impact without overwhelming visitors with text.
- No stock photography in place of available Amaana media.
- Real logo and brand assets must replace the temporary letter-A mark.
- Motion should be restrained and purposeful: carousel transitions, subtle image movement, scroll reveals, stat/count transitions, and hover feedback where useful.
- Avoid generic SaaS/NGO-template aesthetics, excessive glassmorphism, fake donor avatars, artificial urgency, or decorative effects that compete with the work.
- Mobile navigation must be fully usable.
- Accessibility remains mandatory, including visible keyboard focus states and reduced-motion support where animation is introduced.

## Homepage content architecture
1. Visual hero carousel
   - 3–5 authentic Amaana slides
   - concise headline and supporting line
   - primary and secondary CTA
   - accessible controls, indicators, autoplay pause, touch/swipe support where practical

2. Demonstrated impact
   - real, sourced figures only
   - current confirmed examples include Eid Kits 2026: 710 beneficiaries and Meat Distribution 2026: 350+ families / 28 sheep
   - every important figure should link to supporting initiative content where available

3. Our Work
   - visual gateways into verified initiative categories such as Eid Kits, Meat Distribution, Winter Relief, Flood Relief, Dates Distribution, and Medical/Financial Assistance, subject to actual archive verification

4. Current Appeals
   - rich cards when published appeals exist
   - no dead-end database-empty state
   - if no active appeal exists, clearly state that fact and route visitors to completed work or another legitimate action without inventing a fund/category

5. Featured initiative story
   - large-format photography and narrative from one real campaign

6. How Amaana works
   - concise visual process explaining request, review/verification, decision, and support/publication with consent

7. Visual impact/gallery
   - authentic photography/video only

8. About Amaana
   - human story and mission, not internal publishing/admin workflow language

9. Get involved
   - only real journeys that Amaana actually supports: donation, volunteering, partnership, assistance, etc., after operational/compliance confirmation

10. Footer and trust information
   - contact, policies, compliance disclosures, domestic-donation limitations, and organization identity

## Content and media register
Before the visual rebuild is considered complete, every supplied asset must be classified by:
- asset/file
- initiative
- year/date
- media type
- public/private suitability
- intended page/section
- caption/context
- approved / needs review / do not use

Historical asset counts from earlier assistant messages must not be treated as verified until the actual files are inventoried.

## Immediate technical blockers
- [x] Default non-production/staging deployments to noindex unless explicitly enabled.
- [x] Replace disappearing mobile navigation with an accessible mobile menu.
- [ ] Verify assistance-request upload rate limiting and abuse protection.
- [ ] Verify staff notifications are generated for new assistance requests.
- [ ] Audit donation/payment state transitions, especially already-failed donations.
- [ ] Verify object-storage configuration in deployed environments and retention/access behavior.
- [ ] Confirm production-only indexing flag before launch.

## Repository facts confirmed at phase start
- Current app uses Next.js 16.3.4, React 19.1.1, Prisma 6.12.0 and TypeScript.
- Tailwind is not currently listed as a dependency.
- Current private document storage implementation uses S3-compatible storage and signed URLs, not a local `/uploads` directory.
- Current homepage contains generic hardcoded hero copy, a text verification panel, three simple stats including `Personal`, and an empty featured-appeals fallback.

## Definition of done for a public page
A page is not complete merely because it builds or returns HTTP 200. It must pass:
- real approved content
- real approved media where appropriate
- desktop visual QA
- mobile visual QA
- responsive navigation/layout QA
- keyboard/accessibility QA
- empty/loading/error-state QA
- functional CTA/form/payment path QA where applicable
- content/compliance review
- independent review against this acceptance checklist

## Launch definition
The website is not launch-ready until visitor journeys have been tested end-to-end for:
- donor/supporter
- assistance requester/beneficiary
- ordinary visitor
- administrator

Engineering health checks remain necessary but are not a substitute for product completion.
