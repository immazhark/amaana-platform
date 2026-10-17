/** Non-secret staging service identity, shared by the build boundary and
 * runtime authorization. An allowed build does not itself authorize a request. */
export const CURATED_GALLERY_REQUIRED_SERVICE_ID = "fcb9d167-eba1-40c8-a4e6-ac35af470989";

export function isApprovedCuratedGalleryTarget(
  environment: string | undefined, serviceId: string | undefined,
) {
  return environment === "staging" && serviceId === CURATED_GALLERY_REQUIRED_SERVICE_ID;
}
