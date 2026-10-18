import { isIP } from "node:net";

type HeaderReader = {
  get(name: string): string | null;
};

/**
 * Trust only the client IP sanitized by Railway's public HTTP ingress.
 *
 * Railway overwrites X-Real-IP and, for trusted Cloudflare IPv4 ingress,
 * resolves it from CF-Connecting-IP. The raw CF-Connecting-IP header can
 * reach the app unchanged and must never control security/abuse counters.
 *
 * Do not fall back to request Host, CF-Connecting-IP, or X-Forwarded-For:
 * those values are not independent proof of client identity. Missing or
 * malformed ingress evidence shares the "unknown" quota instead.
 *
 * Keep the existing signature for both admin login and public workflows.
 * The URL/configuration arguments must not influence proxy trust.
 */
export function getTrustedClientAddress(
  headers: HeaderReader,
  _requestUrl: string,
  _configuredAppUrl?: string,
) {
  // Preserve the positional API used by existing callers without consulting
  // host-derived arguments for security identity.
  void _requestUrl;
  void _configuredAppUrl;

  const ingressAddress = headers.get("x-real-ip")?.trim() ?? "";
  return isIP(ingressAddress) ? ingressAddress : "unknown";
}
