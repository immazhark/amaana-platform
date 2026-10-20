const INDEXABLE_HOSTS = new Set(["amaanafoundation.org", "www.amaanafoundation.org"]);

/**
 * Search indexing is opt-in and only allowed on Amaana's official public host.
 * This prevents a staging Railway/domain environment from becoming indexable
 * even if NEXT_PUBLIC_ALLOW_INDEXING is accidentally set to true there.
 */
export function shouldAllowIndexing(
  appUrl: string | undefined,
  flag: string | undefined,
  environment: string | undefined = process.env.APP_ENVIRONMENT,
) {
  if (environment !== "production" || flag !== "true" || !appUrl) return false;

  try {
    const url = new URL(appUrl);
    // URL normalizes :443 to an empty port. Reject credentials and custom ports,
    // which are not part of the official public indexing origin.
    return url.protocol === "https:"
      && !url.username && !url.password && !url.port
      && INDEXABLE_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
