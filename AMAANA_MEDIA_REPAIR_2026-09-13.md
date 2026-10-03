# Campaign-media repair — 13 September 2026

Scope: replace the four malformed campaign files without changing homepage structure, backend logic or main.

## Verified originals

- Dates: Drive `19xGmJ26fbwo1wZ2ABhZR88KmOT6i41r-`, `WhatsApp Image 2026-02-26 at 3.51.14 PM.jpeg`, 906,791 bytes, 3024 × 4032. Visually inspected: packages labelled Dates Distribution Drive 2026; no identifiable people.
- Meat: Drive `1KwWNywqnoILWc1Oo1HKQKxgZ6gWN_Lly`, `WhatsApp Image 2026-06-05 at 10.02.44 PM (1).jpeg`, 92,744 bytes, 1280 × 720. Visually inspected: packages labelled Meat Distribution Drive 2026; no identifiable people.

These are the exact source IDs approved in the user's continuation brief. Sources were downloaded through the authenticated Drive browser, not recreated or inferred from filenames.

## Processing

Originals retained unchanged. EXIF orientation applied; output metadata stripped. Aspect ratios preserved. Dates limited to 1350 × 1800; Meat retained at 1280 × 720 without enlargement. WebP quality 84; JPEG quality 85. Both current WebP paths and older JPEG paths repaired so existing references remain valid.

Every generated file passed strict full-pixel decoding locally. Git blob hashes are checked against local bytes before updating the branch. CI now decodes public raster assets and rejects corrupt files or extension/format mismatches, addressing the gap that previously let broken images ship with green builds.

This batch does not certify the overall design, content statistics, mobile experience or release readiness. Subsequent CI and live-preview outcomes must be checked independently.

