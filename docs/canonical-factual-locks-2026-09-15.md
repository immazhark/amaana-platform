# Canonical factual locks — 2026-09-15

These values are explicit user-confirmed corrections and supersede older conflicting records. They must remain consistent across public surfaces, admin summaries, seed/migration behavior, impact cards and future reporting.

## Winter Drive 2025–26

Canonical overall metric:

**234 Winter Kits distributed to 234 beneficiaries.**

Supporting phase figures:
- Phase 1: **96 madrasa students**
- Phase 2: **101 Winter Kits**

The phase figures are sub-measures inside the overall drive and must **not** be added to the overall 234 total.

## Emergency neonatal medical-aid case

Canonical amount raised:

**₹107,520**

This supersedes the older ₹107,200 value.

## Implementation source

`prisma/canonical-factual-locks.json` is the structured correction layer applied by `prisma/apply-master-content.mjs`.

The correction layer is deliberately evaluated even when the broader master-content version has already been seeded. This prevents a user-confirmed factual correction from remaining stale merely because the structural content version did not change.

`prisma/master-programmes.json` still contains older source values at this checkpoint and must not be treated as newer authority for these two fields. A later canonical-source consolidation may fold the locks back into that master file, but the structured factual-lock layer is authoritative until that happens.
