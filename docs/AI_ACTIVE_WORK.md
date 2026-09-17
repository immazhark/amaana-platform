# Amaana Platform — Active Implementation State

## State
**CODEX_ACTIVE**

User explicitly handed repository implementation to Codex on 2026-09-17. Current Git history supersedes the stale launch-rehearsal task description. Single repository writer remains in effect.

## Verified checkpoint
- Integration branch: phase-public-site-rebuild
- Base SHA: 2c01a02e0bcbb1ff92bb86ec9049aa0a4dda8c89
- CI run 35164492769: verify and staging-runtime-acceptance SUCCESS.
- Railway deployment e625eb4c-5b39-40b1-8360-3d12894f77c0: SUCCESS on this exact SHA.
- No open integration PRs at takeover.

## Current atomic task
- Branch: fix/approved-background-artwork
- Replace only the six public/backgrounds SVGs with exact approved ZIP bytes.
- Local package: Amaana_Approved_Background_Repo_Overlay.zip (the available filename omits the handoff's (1) suffix); all six SHA-256 hashes and byte sizes match the authoritative handoff.
- Preserve background CSS, calm PageHero motion, factual locks, privacy gates and strict bundle budgets.
- Next: atomic asset commit, focused PR, full CI, exact-SHA Railway staging/runtime/browser acceptance.
- Shell Git authentication is unavailable; use byte-preserving blob transfer through the authenticated connector, verifying Git blob hashes before commit.

## Unresolved release gates
Existing backup/rollback, human media-consent/provenance, final editorial/accessibility review, public-media provider configuration, CA 12A/12AB, Razorpay KYC/live and controlled financial verification remain evidence-dependent. Do not mark them complete by implication.

## Restrictions
Never modify main, production DNS/Cloudflare, public indexing or live payments. No real donations or beneficiary submissions. Preserve provisional 80G and domestic-only giving. Newborn ₹107,520; Winter 234 kits/234 beneficiaries with phase subsets; Nazira/Hifdh 25 combined; five programme umbrellas.
