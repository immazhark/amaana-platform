import { getIndexNowConfiguration } from "@/lib/indexnow";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8",
  "X-Robots-Tag": "noindex, nofollow, noarchive", "X-Content-Type-Options": "nosniff" };

/** Root-scoped ownership proof. Unconfigured, stale and malformed key paths
 * remain ordinary 404s; no key is ever returned through a query-string API. */
export async function GET(request: Request, context: { params: Promise<{ indexNowKey: string }> }) {
  const config = getIndexNowConfiguration();
  const { indexNowKey } = await context.params;
  if (!config || new URL(request.url).origin !== config.origin ||
      indexNowKey !== `${config.key}.txt` || new URL(request.url).search) {
    return new Response("Not found", { status: 404, headers });
  }
  return new Response(config.key, { headers });
}
