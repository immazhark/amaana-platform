import { selectIdentityPublicImage, type PublicMediaCandidate } from "./public-media";

/** Supporting gallery approval is never permission for hero or discovery use.
 * Build both witness eligibility and content from the same reviewed identity
 * image to prevent empty public carousels and source-image substitutions. */
export function selectImpactWitnesses<T extends {
  mediaAssets: readonly PublicMediaCandidate[];
}>(initiatives: readonly T[], limit = 6) {
  const matches: Array<{ item: T; media: T["mediaAssets"][number] }> = [];
  for (const item of initiatives) {
    const media = selectIdentityPublicImage(item.mediaAssets);
    if (!media) continue;
    matches.push({ item, media });
    if (matches.length >= limit) break;
  }
  return matches;
}
