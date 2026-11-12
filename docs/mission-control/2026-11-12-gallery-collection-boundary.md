# AF-R052 — Public gallery collection runtime guard (12 November 2026 IST)

**Writer:** CHATGPT_ACTIVE, single repository writer. Base source SHA `df258d98c51aee0353ab7197fa2a9765f831b92e`. This is a **bounded public rendering error containment** sub-scope, not approval to publish more images or relax current reviewed media safeguards.

## Defect hypothesis and RED

`CampaignMediaGallery` already guards malformed individual item IDs, alt text, URLs, origins and duplicate IDs. However, `items.flatMap` assumes that the collection is always an array because of the TypeScript signature. A null, undefined, string or forged array-like runtime prop would throw before individual validation. New synthetic `src/components/campaign-media-gallery-optimization.test.tsx` test requires malformed collections to render an empty string without crashing and keeps a valid approved illustrative item visible. Test commit `260163c43fa83b6dd31e3510609bb02271a57532` comes first. Record hosted RED before source change; do not claim observed live malfunction or leaked media.

## Bounded correction and acceptance

After RED, insert a single `Array.isArray(items)` check at entry of the existing `useMemo`, returning an empty collection for invalid runtime props. Preserve existing filtering, reviewed external image flag, focus behavior, loading/optimizer, and all privacy/media publication gates. Full exact-head fast/browser/database/production/security CI, independent review, separate ready-state promotion, protected SHA merge, Railway and public identity/readiness. No schema, auth, bank/UPI/payment, public image, secrets, worker, infrastructure or donor records. Rollback revert small source/test/coordination change; AF-R052 remains Partial until full raw-image/privacy acceptance.

## Hosted RED evidence and GREEN source

The test-only PR head `4cf07f88e8fad4a263a5dc2b209f3592495897c6` failed in full CI run `43196407649` (fast job `131108542213`). New regression `campaign-media-gallery-optimization.test.tsx` failed with `TypeError: Cannot read properties of null (reading 'flatMap')` at `src/components/campaign-media-gallery.tsx:29`; 2,969 other tests passed and 20 were already skipped. That is the exact reproduction, not an asserted live incident.

GREEN source commit `a53d9832f3413061082243a19e36b19a96d8b939` adds one `Array.isArray(items)` guard at the start of the existing `useMemo`. No media-selection rule, URL policy, focus state, image or consent logic changes. Full GREEN and separate ready-state CI must still pass before protected merge. This does not close broad AF-R052 media privacy or gallery optimisation acceptance.
