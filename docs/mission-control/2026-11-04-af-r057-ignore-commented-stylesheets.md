# AF-R057 — CSS byte audit must ignore commented-out stylesheets (4 November 2026 IST)

**Independent scope:** The public-route read-only CSS auditor `scripts/audit-live-route-css.mjs` scans raw HTML for `<link>` tags. HTML comments containing obsolete stylesheet tags were mistakenly treated as live stylesheets, inflating reported decoded CSS bytes and potentially causing needless fetches. This is an audit accuracy bug, not a runtime CSS defect.

**Deterministic reproduction:** The current parser returned both `/_next/static/chunks/obsolete.css` from `<!-- ... -->` and the genuine `/_next/static/chunks/current.css`. A new native Node assertion in `scripts/test-live-route-css.mjs` covers both terminated and unterminated HTML comments.

**RED before code:** Test source `8801ca8edc4e94c1da9877cfec9dc41d9514c31f`, draft PR #642, base `4acb5fe255fff915a3e1bffbe05964e373dd5bce`, hosted CI `41729902655`: `plan` SUCCESS; `fast` FAILURE at the new AF-R057 assertion; other independent jobs correctly skipped after failing fast.

**Bounded source correction:** `47203e9fbba55a277573ab53e2eb059be7694dd3`: ignore HTML comments (including an unterminated trailing comment) before the existing `<link>` regex and original same-origin HTTPS / `/_next/static/*.css` validations. No relaxed URL checks, no new dependencies or application changes. All original tests for query variants, redirects, MIME types, URL restrictions and safe integer sizes remain in force.

**Release:** Full exact-head hosted CI and independent diff review; separate ready-state promotion/verify; expected-head guarded merge. Script-only/docs changes may cause a Railway website SKIPPED deployment. No current-route CSS byte baseline, compressed transfer improvement, Core Web Vital claim, or safely removable unused-CSS figure is established. AF-R057/068 historical Partial classification and the 149-item total remain unchanged. Rollback by reverting this PR.

**Single writer, parallel CI:** PR #641 has its corrected browser model on independent `e2e/**` paths. Only CHATGPT_ACTIVE writes either branch; each receives separate exact-head checks and release decisions.

## Merge-lineage reconciliation — 4 November 2026 IST

Accepted main advanced from `4acb5fe255fff915a3e1bffbe05964e373dd5bce` to `230d539d76a44d60d516c7f5862591099bd17692` via accepted PR #641. This branch reconciles by an ordinary two-parent merge commit: parent branch HEAD `3813dad33b0d2b7863124ef0d5da4632b11ef1fa`, second parent accepted main `230d539d76a44d60d516c7f5862591099bd17692`. The merged tree retains the exact previously tested CSS audit source and native test, plus both append-only coordination histories. Previous complete CI `41730605816` passed at old head, but merged-lineage changes require fresh exact-head CI and separate ready-state before SHA-guarded merge. Railway/site rollout may legitimately SKIP scripts/docs paths.
