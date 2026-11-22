import { permanentRedirect } from "next/navigation";

// A short, memorable address for campaigns and social posts. It permanently redirects to the canonical Taleem overview and
// keeps the query string (campaign tags), but the destination path is fixed: nothing in the request can change it.
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TaleemShortLink({ searchParams }: { searchParams: SearchParams }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
  }
  const query = params.toString();
  permanentRedirect(`/our-work/taleem${query ? `?${query}` : ""}`);
}
