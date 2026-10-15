import { shouldAllowIndexing } from "@/lib/site-indexing";
import { isPrivateRoute } from "@/lib/public-routing";

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_MAX_URLS = 100;
export type IndexNowConfiguration = { origin: string; host: string; key: string };
export class IndexNowInputError extends Error {}

/** The ownership key is intentionally served as text for search engines,
 * but never serialized to admin clients, audit metadata or logs.
 * Its root filename follows the public proof format required by IndexNow. */
export function getIndexNowConfiguration(env = process.env): IndexNowConfiguration | null {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const key = env.INDEXNOW_KEY ?? "";
  if (!appUrl || env.AMAANA_INDEXNOW_ENABLED !== "true" ||
      !shouldAllowIndexing(appUrl, env.NEXT_PUBLIC_ALLOW_INDEXING, env.APP_ENVIRONMENT) ||
      !/^[a-zA-Z0-9-]{8,128}$/.test(key)) return null;
  try {
    const url = new URL(appUrl);
    if (url.username || url.password || url.port || url.search || url.hash || url.pathname !== "/") return null;
    return { origin: url.origin, host: url.hostname, key };
  } catch { return null; }
}

export function parseIndexNowPaths(value: unknown): string[] {
  if (typeof value !== "string" || value.length > 12_000) throw new IndexNowInputError("Enter up to 100 public page paths.");
  const paths = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!paths.length || paths.length > INDEXNOW_MAX_URLS) throw new IndexNowInputError("Enter between 1 and 100 public page paths.");
  for (const path of paths) {
    if (path.length > 240 || !/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/.test(path) ||
        isPrivateRoute(path) || path === "/shukr" || path === "/get-involved/legacy-giving" ||
        path.startsWith("/appeals/")) {
      throw new IndexNowInputError("Use canonical public paths without queries or credentials. Private pages and individual appeals cannot be submitted here.");
    }
  }
  return [...new Set(paths)];
}

/** A path being syntactically safe is not publication permission. A fresh
 * sitemap snapshot must independently authorize every selected URL. Reject
 * the whole batch on any mismatch instead of silently sending a subset. */
export function buildIndexNowUrlList(paths: readonly string[], sitemap: readonly { url: string }[], config: IndexNowConfiguration): string[] {
  const checked = parseIndexNowPaths(paths.join("\n"));
  const published = new Set(sitemap.map(item => item.url));
  const urls = checked.map(path => `${config.origin}${path}`);
  if (urls.some(url => !published.has(url))) throw new IndexNowInputError("A selected page is absent from the current public sitemap. Review its publication and canonical URL first.");
  return urls;
}
