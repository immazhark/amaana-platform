# AF-R077 — permanently stop Web Vitals after SPA departure

**Checkpoint:** 11 November 2026 IST. **Sole implementation writer:** CHATGPT_ACTIVE. **Scope:** public performance telemetry attribution only, not privacy-sensitive route publication or analytics activation.

## Reproduced defect

The earlier exact-raw-path guard in `src/lib/web-vitals-path.ts` (merged #757) correctly rejects metrics when the *current* SPA pathname differs from the initial pathname. It has no memory of earlier navigation. Given initial `/about`, the sequence `/about → /donate → /about` returns `[true, false, true]` under the original stateless comparison, rather than `[true, false, false]`. This may allow later navigation measurement to be attributed to the original loaded document. The same issue applies to navigating among public slugs and returning to the initial slug.

**Test-first hosted RED:** PR #762 test-only head `9b13a29c71965e5347bca8165ec21cca6336d242`, full CI run `43013392531`, fast job `130498412167` failed at typecheck with `TS2305` because the expected `createWebVitalDocumentGuard` was not implemented. Synthetic Node route-sequence reproduction separately confirmed `[true,false,true]` in the former predicate.

## Minimal correction

Introduce a per-browser-document guard in the same privacy helper, with irreversible invalidation once a new App Router pathname is observed. The root-level `WebVitalsReporter` uses Next.js `usePathname` and an effect to notify the guard and clear pending metric samples. Both metric acceptance and flush check the guard. The normalized anonymous group labels and 10% opt-in sampler remain unchanged; no identifying slug is sent to telemetry. Further route observations cannot re-open the guard after a departure.

Vitest coverage: different dynamic slugs, private-route departure, return to the original URL, repeated same-page observations, automated browser suppression and private/unknown initial page. These are synthetic state tests; real browser acceptance remains separate. If route changes and reversals are both processed without React committing an intermediate pathname, this implementation cannot observe the uncommitted route; use the hosted browser route test as validation, not a substitute for empirical field monitoring.

**Release:** Current implementation branch `fix/web-vitals-navigation-invalidation-20261111`, initial base `e25987dd2223bfa459e15a1f9f0b4d99760237a9`. PR #760 merged protected main `3fb9cbfce4f941ab0dd34565b882a9155e496b7b` during development; coordination file was reconciled to the completed main blob, preserving both histories. Current head exact CI, review, ready-state, guarded merge and Railway SHA verification are required. No source runtime/test pass is claimed until hosted GREEN completes.

**No changes:** auth/RBAC, payment or webhook behavior, secrets, schema, external providers, production deployment configuration, donor data, consent/media, religious/tax claims. #684 remains financial-activation held. Historical 149 classifications unchanged.

**Rollback:** narrowly revert the document guard and reporter hook to #757's existing exact-path boundary if an observed compatibility issue occurs. Do not weaken private-route suppression.
