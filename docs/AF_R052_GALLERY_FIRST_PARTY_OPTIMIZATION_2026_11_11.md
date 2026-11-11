# AF-R052 — reviewed first-party gallery image optimization

**Date:** 11 November 2026 IST. **Sole writer:** CHATGPT_ACTIVE. **Sub-scope:** optimize approved same-origin managed media URLs supplied directly to the campaign gallery, without modifying media publication decisions.

## Reproduction and red evidence

At source main `b85ede6c7c51c189fbb7eb0b99dba562e9bd4478`, `CampaignMediaGallery` checks only `/media/` and `/brand/` string prefixes when selecting Next/Image. A reviewed `https://amaanafoundation.org/media/2026/approved.webp` URL is otherwise accepted by the established CSP, media-origin and alt-text gates but renders through a raw `<img>`, losing responsive image optimization. The existing server `toPublicGalleryItems` already makes the URL relative; this defect affects direct approved gallery props and must not be claimed as a general hero/LCP regression.

**Native test-first RED:** PR #764 head `9e83acce8ff186dfff98cf782121df9410447c43`, full selected CI run `43020388034`, fast job `130521920259`. Its gallery Vitest group contained nine tests with **one failure**: `optimizes an approved directly supplied first-party absolute managed image` expected an `/_next/image?url=%2Fmedia%2F2026%2Fapproved.webp` optimized source, but the rendered output used a direct URL. This was not a pre-existing suite failure; the new regression reproduced the known raw-image branch.

## Correction

Commit `bbdc142d52820c048373f24e1a621389c37aff81` removes the prefix-only `canOptimizeLocally` check and instead uses the already-tested `getPublicImageOptimizationUrl` for both responsive thumbnail and full-size gallery modal. That existing utility requires approved public managed paths, rejects private app routes, and only converts recognized first-party HTTPS absolute URLs or safe relative managed paths. Other reviewed external CDN media continue to use direct `<img>` elements, not an unreviewed Next remote-image allowlist. The existing dimensions, alt text, priority/lazy defaults, modal focus and controls remain unchanged.

**Acceptance:** native regression GREEN on final exact head, all required CI jobs, source review, separate ready-state and protected SHA-guarded merge. These must be verified individually; successful code commits are not deployment verification. No sample, beneficiary photo, metadata, media consent, payment, authentication, secret, schema, runtime provider or live infrastructure was changed by this scope. This does not claim full AF-R052 closure, quantified page weight improvement or public field Web Vitals changes. Preserve the historical 149 classifications.

**Coordination:** Separate AF-R015 CSP test-only PR #763 was still in exact-head CI during this independent development; AF-R077 #762 merged `b85ede6c7c51c189fbb7eb0b99dba562e9bd4478`, deployed on Railway `4dc61c76-a77e-4dd5-a55e-48cd92f04bbf` SUCCESS at matching source SHA; independent HTTP health readiness is unverified. Financial PR #684 remains a separate activation hold. Rollback only the gallery component change, regression and coordination evidence.
