# Amaana Platform — Active Implementation State

## State
**CHATGPT_ACTIVE**

User explicitly handed repository implementation back to ChatGPT on 2026-09-17 after Codex exhausted its limit. Single repository writer remains in effect. Codex stopped at a safe boundary after creating this task branch and recording the prior handoff; it did not replace the approved artwork.

## Verified checkpoint
- Integration branch: `phase-public-site-rebuild`
- Integration/base SHA: `2c01a02e0bcbb1ff92bb86ec9049aa0a4dda8c89`
- Integration remains unchanged at takeover.
- CI run `35164492769`: verify and staging-runtime-acceptance SUCCESS on the base SHA.
- Railway deployment `e625eb4c-5b39-40b1-8360-3d12894f77c0`: SUCCESS on the exact base SHA.
- No open integration PRs at the original artwork takeover.

## Current atomic task
- Branch: `fix/approved-background-artwork`
- Codex handoff-only commit: `05d7424b52b168f3082d064ae76029c603457404`.
- Replace only the six `public/backgrounds` SVGs with the exact approved ZIP bytes.
- Uploaded package: `Amaana_Approved_Background_Repo_Overlay(1).zip`.
- ChatGPT independently re-extracted the package and reconfirmed all six SHA-256 hashes and byte sizes against the authoritative manifest before continuing.
- Preserve background CSS, calm PageHero motion, factual locks, privacy gates and strict bundle budgets.
- Next: exact-byte asset commit, focused PR, full CI, exact-SHA Railway staging/runtime/browser acceptance.

## Unresolved release gates
Existing backup/rollback, human media-consent/provenance, final editorial/accessibility review, public-media provider configuration, CA 12A/12AB, Razorpay KYC/live and controlled financial verification remain evidence-dependent. Do not mark them complete by implication.

## Restrictions
Never modify `main`, production DNS/Cloudflare, public indexing or live payments. No real donations or beneficiary submissions. Preserve provisional 80G and domestic-only giving. Newborn ₹107,520; Winter 234 kits/234 beneficiaries with phase subsets; Nazira/Hifdh 25 combined; five programme umbrellas.
