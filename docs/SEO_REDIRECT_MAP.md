# Amaana Platform — Public Redirect Map

This file records intentional permanent redirects for legacy or superseded public URLs. Keep it aligned with `next.config.ts`. Do not redirect unrelated removed pages to the homepage merely to avoid a 404.

| Previous public route | Canonical route | Reason |
| --- | --- | --- |
| `/our-work/winter-drive-2025-26` | `/our-work/winter-relief` | Consolidated Winter Drive naming under the canonical seasonal-relief programme record. |
| `/our-work/winter-relief-2025-26` | `/our-work/winter-relief` | Consolidated year/status variant into the stable canonical programme URL. |
| `/our-work/meat-distribution-2025` | `/our-work/qurbani-meat-distribution` | Consolidate the reviewed 2025 meat-drive archive under the stable canonical Qurbani programme route. |
| `/our-work/meat-distribution-2026` | `/our-work/qurbani-meat-distribution` | Consolidate the reviewed 2026 meat-drive archive under the stable canonical Qurbani programme route. |
| `/our-work/financial-aid-auto-rickshaw-2025` | `/our-work/auto-rickshaw-livelihood-support` | Consolidate the reviewed ₹95,000 auto-rickshaw archive under the canonical livelihood-support case. |
| `/our-work/medical-aid-eight-day-old-baby` | `/our-work/emergency-neonatal-medical-aid` | Consolidate the reviewed neonatal archive under the canonical newborn medical-aid case. |
| `/our-work/medical-aid-stage-three-cancer-2025` | `/our-work/oral-cancer-surgery-support` | Consolidate the reviewed ₹319,000 oral-cancer archive under the canonical surgery-support case. |
| `/our-work/medical-aid-ailing-mother` | `/our-work/severe-burn-treatment-support` | Consolidate the reviewed ₹72,000 burn-treatment archive under the canonical case record. |
| `/our-work/medical-aid-aliza-ards-2026` | `/our-work/aliza-critical-care-support` | Consolidate the reviewed Aliza ARDS archive under the canonical critical-care case. |
| `/our-work/medical-financial-assistance` | `/programmes/medical-financial-relief` | Replace the superseded umbrella route with the canonical programme-category landing page. |
| `/programmes/qurbani` | `/our-work/qurbani-meat-distribution` | Preserve the historic convenience programme route while consolidating discovery on the canonical Qurbani programme URL. |
| `/programmes/taleem` | `/our-work/taleem` | Preserve the historic convenience programme route while consolidating discovery on the canonical Taleem programme URL. |
| `/programmes/eid-gift-kits` | `/our-work/eid-gift-kits` | Preserve the historic convenience route while keeping the stable Our Work programme URL canonical. |
| `/programmes/dates-distribution` | `/our-work/dates-distribution` | Preserve the historic convenience route while keeping the stable Our Work programme URL canonical. |
| `/programmes/emergency-humanitarian-relief` | `/programmes/emergency-relief` | Keep the public category URL concise and aligned with the SEO master while the internal category slug remains `emergency-humanitarian-relief`. |
| `/programmes/seasonal-essentials` | `/programmes/seasonal-relief` | Align the category landing URL with the SEO master and remove a second indexable route for the same content. |

## Rules

- Add a redirect only when the previous route was a valid public route or has meaningful external/search history.
- Prefer the closest canonical successor, not the homepage.
- Keep completed historical programme and appeal URLs stable where practical.
- Review this map whenever public route taxonomy changes.
