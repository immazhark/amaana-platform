export type LiveRailItem = {
  id: string; title: string; eyebrow: string;
  detailsHref: string; supportHref: string; detailsCta: string; supportCta: string;
};

/** Only the current public-appeal contract can create a donation shortcut.
 * Raw JSON never supplies arbitrary links, action labels or React children. */
export function readLiveRailResponse(value: unknown): LiveRailItem[] | null {
  if (!value || typeof value !== "object") return null;
  const rows = (value as Record<string, unknown>).items;
  if (!Array.isArray(rows) || rows.length > 4) return null;
  const items: LiveRailItem[] = [];
  const seen = new Set<string>();
  for (const value of rows) {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    const slug = typeof row.detailsHref === "string"
      ? /^\/appeals\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(row.detailsHref)?.[1] : undefined;
    if (!slug || slug.length > 200 || row.kind !== "appeal" || row.id !== `appeal-${slug}` ||
        row.supportHref !== `/donate/${slug}` || seen.has(slug) ||
        typeof row.title !== "string" || !row.title.trim() || row.title.length > 300 || /[\u0000-\u001f\u007f]/.test(row.title)) return null;
    seen.add(slug);
    items.push({ id: `appeal-${slug}`, title: row.title, eyebrow: "Live appeal",
      detailsHref: `/appeals/${slug}`, supportHref: `/donate/${slug}`, detailsCta: "View", supportCta: "Donate" });
  }
  return items;
}
