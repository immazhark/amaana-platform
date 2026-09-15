export type PrivateTrackingCredentials = {
  reference: string;
  token: string;
};

function parsePrivateTrackingParams(value: string) {
  if (!value) return null;
  const params = new URLSearchParams(value);
  const reference = params.get("reference")?.trim();
  const token = params.get("token");
  if (!reference || !token || token.length < 20) return null;
  return { reference, token };
}

export function privateTrackingFragment(credentials: PrivateTrackingCredentials) {
  const params = new URLSearchParams({
    reference: credentials.reference,
    token: credentials.token,
  });
  return `#${params.toString()}`;
}

export function privateTrackingPath(path: string, credentials: PrivateTrackingCredentials) {
  return `${path}${privateTrackingFragment(credentials)}`;
}

export function parsePrivateTrackingFragment(hash: string): PrivateTrackingCredentials | null {
  return parsePrivateTrackingParams(hash.startsWith("#") ? hash.slice(1) : hash);
}

/**
 * New tracking links keep credentials in the fragment so browsers do not send
 * them to the server, proxy or referrer. Query parsing exists only to preserve
 * already-issued preview links; callers should immediately replace a legacy
 * query URL with the fragment form after reading it in the browser.
 */
export function parsePrivateTrackingLocation(search: string, hash: string): PrivateTrackingCredentials | null {
  return parsePrivateTrackingFragment(hash)
    ?? parsePrivateTrackingParams(search.startsWith("?") ? search.slice(1) : search);
}
