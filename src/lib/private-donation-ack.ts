export function privateDonationAcknowledgementFragment(token: string) {
  return `#token=${encodeURIComponent(token)}`;
}

export function privateDonationAcknowledgementPath(reference: string, token: string) {
  return `/donations/${encodeURIComponent(reference)}/acknowledgement${privateDonationAcknowledgementFragment(token)}`;
}
