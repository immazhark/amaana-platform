export function privateDonationAcknowledgementFragment(token: string) {
  return `#token=${encodeURIComponent(token)}`;
}

export function privateDonationAcknowledgementPath(reference: string, token: string) {
  return `/donations/${encodeURIComponent(reference)}/acknowledgement${privateDonationAcknowledgementFragment(token)}`;
}

export function parsePrivateDonationAcknowledgementLocation(search: string, hash: string) {
  const fragment = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const fragmentToken = fragment.get("token");
  if (fragmentToken && fragmentToken.length >= 20) return fragmentToken;

  const legacy = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const legacyToken = legacy.get("token");
  if (legacyToken && legacyToken.length >= 20) return legacyToken;

  return null;
}
