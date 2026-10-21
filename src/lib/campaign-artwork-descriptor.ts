/** Classification only. Do not import route, storage or publication code here:
 * this predicate also runs in the client-side gallery. */
export type ArtworkDescriptor = { title?: string | null; caption?: string | null; altText?: string | null };

export function isCampaignGraphicDescriptor(asset: ArtworkDescriptor) {
  const descriptor = `${asset.title ?? ""} ${asset.caption ?? ""} ${asset.altText ?? ""}`.toLowerCase();
  return /(infographic|impact graphic|announcement|campaign cover|results update|thank-you|thank you|poster|\b(?:campaign|results?|update|event|designed) graphic\b|\bgraphic (?:update|artwork|slide|card|asset)\b|\bcarousel\b)/.test(descriptor);
}

