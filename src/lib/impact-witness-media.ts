import { selectIdentityPublicImage, type PublicMediaCandidate } from "./public-media";

const MAX_IMPACT_WITNESSES = 6;

/** Select only media already eligible for an identity surface.
 * Supporting-gallery approval must not elevate an image to a public cover. */
export function selectImpactWitnessMedia<
  T extends { mediaAssets: readonly PublicMediaCandidate[] },
>(records: readonly T[]): Array<{ record: T; media: T["mediaAssets"][number] }> {
  const selected: Array<{ record: T; media: T["mediaAssets"][number] }> = [];
  for (const record of records) {
    const media = selectIdentityPublicImage(record.mediaAssets);
    if (!media) continue;
    selected.push({ record, media });
    if (selected.length === MAX_IMPACT_WITNESSES) break;
  }
  return selected;
}
