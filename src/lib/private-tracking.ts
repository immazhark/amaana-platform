export type PrivateTrackingCredentials = {
  reference: string;
  token: string;
};

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
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!value) return null;
  const params = new URLSearchParams(value);
  const reference = params.get("reference")?.trim();
  const token = params.get("token");
  if (!reference || !token || token.length < 20) return null;
  return { reference, token };
}
