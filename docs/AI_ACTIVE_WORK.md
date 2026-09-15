# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

## Active implementation owner
ChatGPT — user-directed takeover after Codex limit exhaustion on 16 September 2026.

## Integration checkpoint
- Branch: `phase-public-site-rebuild`
- Latest stable merged implementation before the current UI pass: PR #39, `4922ec318be25685894028f55feccfc9f9466104`, Railway SUCCESS.
- PR #37 added staging launch-acceptance fixtures/smoke coverage.
- PR #38 protected public appeal updates and completed archives.
- PR #39 retired query-string assistance tracking tokens.

## Current user-directed correction pass
The user reviewed the deployed public site page-by-page and requested a single cohesive UI/content reconciliation iteration:
- restore Ayah/Hadith and Salah/Hijri launchers to an unobtrusive bottom-right position;
- keep the top reminder strip uncluttered;
- reconcile `/our-work` to the canonical five umbrella categories and remove renamed/year-child duplication;
- show Taleem's two documented strands: 25 Nazira+Hifdh students combined and 50 orphan children receiving stationery kits;
- ensure each Our Work row has a thumbnail treatment, using approved original media when present and a neutral Amaana fallback until a final thumbnail is selected;
- remove the same legacy/year-child duplication from `/impact`;
- contain the impact metric rail, allow horizontal scrolling, and keep amounts on one line;
- standardize top-page hero label/title treatment and the animated gradient across Our Work, Impact, Stories, Faith & Reflections and shared v2 pages;
- standardize section-title accent treatment;
- redesign the Stories privacy-gate empty state for legibility;
- repair the Get Involved journey connector;
- preserve visible keyboard focus but replace the raw browser-looking form outline with a branded accessible focus ring;
- add an accessible Back to Top control for long pages;
- ensure programme detail heroes, including Qurbani, never have an empty visual column when no approved photograph is currently linked.

## Current task branch / PR
- Branch: `fix/ui-consistency-dedupe-v2`
- PR: #41 — Reconcile public work and standardize cross-site UI
- PR #40 was closed unmerged after a branch-base cleanup conflict; #41 is the clean replacement based on the current integration head.

## Implementation completed on this branch
- Added `iteration-four.css` as the final visual consistency override layer.
- Added reduced-motion-aware global Back to Top control.
- Restored companion launcher dock to bottom-right and coordinated its position with Back to Top.
- Added branded focus-visible states for form controls and interactive elements.
- Unified hero gradient/eyebrow/title treatment across major v2 public screens.
- Added consistent partial gradient accents to section titles.
- Regrouped Our Work records from canonical master taxonomy instead of raw Cause rows so the five umbrella categories cannot duplicate because of stale DB cause names.
- Default Our Work view now keeps year-child editions under their parent programme; year filtering can still expose specific editions.
- Added temporary Amaana thumbnail fallbacks for initiative rows lacking approved media.
- Added Taleem's two verified public highlights without inventing separate historical programmes.
- Impact now filters through the canonical programme registry and hides annual child editions from the main evidence ledger.
- Impact metric rail is centered, horizontally scrollable and amount-safe.
- Programme detail pages use a restrained factual visual fallback where approved lead media is unavailable.
- Stories privacy-gate empty state and Get Involved journey connector are restyled through the consistency layer.

## Next actions
1. Complete PR #41 CI; repair any lint/type/build/regression failures before merge.
2. Merge only when all CI gates are green.
3. Verify Railway deployment for the merged commit.
4. Run rendered checks on `/our-work`, `/impact`, `/stories`, `/faith-and-reflections`, `/get-involved`, Qurbani detail and representative mobile widths.
5. Continue launch acceptance only after this user-review iteration is verified.

## Factual and release locks
Read `docs/CURRENT_SOURCE_RECONCILIATION_2026-09-15.md` and `docs/canonical-factual-locks-2026-09-15.md`. Newborn ₹107,520; Winter 234 kits/234 beneficiaries with phase subsets; Taleem 25 combined. Canonical taxonomy contains exactly five categories. Main/production promotion remains gated.

## Do-not-touch without explicit need
- Current Amaana colour direction / premium visual language
- Canonical five-category taxonomy
- Private beneficiary evidence, media consent gates and retention controls
- Donation/payment/refund lifecycle except for focused verified defects
- Compliance claims still awaiting CA/legal/payment confirmation
