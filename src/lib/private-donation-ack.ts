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

/** Preserve verified INR paise rather than silently rounding private receipts. */
export function formatPrivateReceiptINR(amount: number): string {
  const paise = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(paise)
    || Math.abs(amount - paise / 100) > Number.EPSILON * Math.max(1, amount) * 2) {
    throw new RangeError("Invalid INR amount for a private acknowledgement");
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(paise / 100);
}
