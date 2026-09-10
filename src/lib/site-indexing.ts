const INDEXABLE_HOSTS = new Set(["amaanafoundation.org", "www.amaanafoundation.org"]);

/**
 * Search indexing is opt-in and only allowed on Amaana's official public host.
 * This prevents a staging Railway/domain environment from becoming indexable
 * even if NEXT_PUBLIC_ALLOW_INDEXING is accidentally set to true there.
 */
export function shouldAllowIndexing(appUrl: string | undefined, flag: string | undefined) {
  if (flag !== "true" || !appUrl) return false;

  try {
    const url = new URL(appUrl);
    return url.protocol === "https:" && INDEXABLE_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
