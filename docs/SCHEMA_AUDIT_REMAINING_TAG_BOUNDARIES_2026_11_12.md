# Remaining schema observer tag boundaries — 12 November 2026 IST

Successor base `bbdf55ca1a79a5beab597c1d76a2e6d7a43f564e` preserves the canonical/meta fix. This task changes only existing script, head, raw-text, inert-region and plaintext tag-name matchers in the read-only HTML schema observer. No parser rewrite or application behavior change.

Synthetic observations reproduced false identity acceptance from a `<script-data>` opener paired with stray `</script>`, false head acceptance from `<head-note>`, removal of active JSON-LD inside `<template-card>`, and rejection of `<plaintext-card>`. A `<style-panel>` wrapper also let the observer discard an active private JSON-LD node before a genuine child `<style>` close tag, yielding a false pass.

Test-only RED commit `2e70172`: `node --test scripts/test-public-schema-audit.mjs` reported 23 passed and four failed. Replacing the seven existing word-boundary matchers with exact HTML tag delimiters yields 27 passed, zero skipped. Existing genuine raw/inert tags, script-string and quoted-markup regressions remain green. `git diff --check` passes.

This is local observer correctness, not website schema release or external search acceptance. No canonical 149-row reclassification. Preserve predecessor and require fresh exact-head CI, independent review, separate ready-state and guarded merge. Rollback: revert only this successor's seven matcher changes and scoped tests.
