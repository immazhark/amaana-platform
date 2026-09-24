# Reviewed campaign batch — 13 September 2026

Scope: Dates Distribution 2026 and Meat Distribution 2026. The complete archive contains 366 entries; this batch visually reviews 23 files (12 Dates, 11 Meat), not the other 343.

Six source assets selected for publication: Dates labelled packages, campaign cover and results graphic; Meat labelled packages, label close-up and sealed cartons. The campaign JSON records each original Drive ID and public derivative path. Images were resized without enlargement, orientation corrected, encoded as WebP and fully decoded after conversion. EXIF/GPS is not carried into derivatives. No generated photographs or reconstructed campaign graphics are used.

The Dates results post reports 162 kg procured and distributed; it does not establish a recipient count. The campaign cover explicitly identifies 2026. Meat images establish preparation, campaign labelling and year, not recipient totals or expenditure. Existing programme-level totals were not independently reconciled in this batch.

Not selected: identifiable handover photographs pending consent clarification, procurement-label/detail images, graphic animal-processing scenes, repetitive animal/preparation views and the generic social-contact closing slide. Review does not mean approval to publish every source.

Database import is preview-domain-gated, serialized by a transaction advisory lock, and create-only by slug. Existing records and their media/publication decisions remain untouched. An absent seasonal cause is created; an existing unpublished cause is left untouched and its import skipped. No schema migration, payment, authentication or private-document code is changed.

The public detail template now supports multi-paragraph drive accounts, original-image galleries with full-image links, related stories/reflections and active associated appeals. It removes large placeholder explanations. Homepage campaign features use the same database projection as the work index. Existing programme anchors are supported on the index for older links.

Verification: six import tests pass locally, including repeatability, archived-record preservation, missing-cause bootstrap and unpublished-cause preservation. The first implementation commit passed CI but its preview startup exposed an absent cause. Follow-up commit 3dcf032 fixed that startup dependency and deployed successfully, importing two new editions without replacing existing records. September 14 HTTP checks confirm both detail routes return 200 and all six WebP responses fully decode. The source provenance manifest is `campaign-media-provenance.json`.

Resumed corrections: the lead figure now has a transparent background so its light caption sits on the navy hero; the closing volunteer link is explicitly dark blue on the light section. The final deployed desktop/mobile review remains required before this batch is called complete.

Remaining master-plan scope: all historical editions, aid cases, full archive reconciliation, expanded homepage variety, archive filtering and deeper impact storytelling. Recipient-photo consent remains open.
