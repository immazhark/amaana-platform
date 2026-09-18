import { isIP } from "node:net";

type HeaderReader = {
  get(name: string): string | null;
};

export function getTrustedClientAddress(
  headers: HeaderReader,
  requestUrl: string,
  configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL,
) {
  const configuredHost = configuredAppUrl ? new URL(configuredAppUrl).host.toLowerCase() : null;
  const requestHost = (
    headers.get("x-forwarded-host")
    ?? headers.get("host")
    ?? new URL(requestUrl).host
  ).toLowerCase();

  const cloudflareAddress = headers.get("cf-connecting-ip")?.trim() ?? "";
  const railwayAddress = headers.get("x-real-ip")?.trim() ?? "";
  const forwardedChain = headers.get("x-forwarded-for")
    ?.split(",")
    .map(value => value.trim())
    .filter(Boolean) ?? [];
  const nearestForwardedAddress = forwardedChain.at(-1) ?? "";

  const configuredIsRailwayHost = configuredHost?.endsWith(".up.railway.app") ?? false;
  if (
    configuredHost
    && !configuredIsRailwayHost
    && requestHost === configuredHost
    && isIP(cloudflareAddress)
  ) {
    return cloudflareAddress;
  }

  if (isIP(railwayAddress)) return railwayAddress;
  if (isIP(nearestForwardedAddress)) return nearestForwardedAddress;
  return "unknown";
}
