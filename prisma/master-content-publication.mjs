/**
 * Existing reviewed master entries predate explicit publication flags.
 * New sensitive cases must remain out of the public database until an
 * authorized review deliberately marks each entry APPROVED.
 * An unknown flag must never result in publication.
 */
export function eligibleMasterInitiatives(initiatives) {
  return initiatives.filter(record => !Object.hasOwn(record, "publicationReviewStatus")
    || record.publicationReviewStatus === "APPROVED");
}
