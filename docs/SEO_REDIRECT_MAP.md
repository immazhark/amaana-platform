# Amaana Platform — Public Redirect Map

This file records intentional permanent redirects for legacy or superseded public URLs. Keep it aligned with `next.config.ts`. Do not redirect unrelated removed pages to the homepage merely to avoid a 404.

| Previous public route | Canonical route | Reason |
| --- | --- | --- |
| `/our-work/winter-drive-2025-26` | `/our-work/winter-relief` | Consolidated Winter Drive naming under the canonical seasonal-relief programme record. |
| `/our-work/winter-relief-2025-26` | `/our-work/winter-relief` | Consolidated year/status variant into the stable canonical programme URL. |
| `/programmes/emergency-humanitarian-relief` | `/programmes/emergency-relief` | Keep the public category URL concise and aligned with the SEO master while the internal category slug remains `emergency-humanitarian-relief`. |
| `/programmes/seasonal-essentials` | `/programmes/seasonal-relief` | Align the category landing URL with the SEO master and remove a second indexable route for the same content. |

## Rules

- Add a redirect only when the previous route was a valid public route or has meaningful external/search history.
- Prefer the closest canonical successor, not the homepage.
- Keep completed historical programme and appeal URLs stable where practical.
- Review this map whenever public route taxonomy changes.
