// Receipt-page only. Kept apart from private-donation-ack.ts so the checkout forms, which only build the path, do not bundle the parser.
export function parsePrivateDonationAcknowledgementLocation(search: string, hash: string) {
  const fragment = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const fragmentToken = fragment.get("token");
  if (fragmentToken && fragmentToken.length >= 20) return fragmentToken;

  const legacy = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const legacyToken = legacy.get("token");
  if (legacyToken && legacyToken.length >= 20) return legacyToken;

  return null;
}
