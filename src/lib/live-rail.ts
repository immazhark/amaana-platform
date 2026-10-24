export type LiveRailItem = {
  id: string;
  kind: "appeal" | "initiative";
  eyebrow: string;
  title: string;
  subtitle: string;
  detailsHref: string;
  supportHref: string;
  detailsCta: string;
  supportCta: string;
};

/** Malformed successful responses must not break the site-wide live rail. */
export function parseLiveRailItems(payload: unknown): LiveRailItem[] {
  if (!payload || typeof payload !== "object" || !("items" in payload) || !Array.isArray(payload.items)) return [];
  const items: LiveRailItem[] = [];
  for (const value of payload.items) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const item = value as Record<string, unknown>;
    const text = (key: string): string => typeof item[key] === "string" ? item[key] : "";
    const id = text("id"), eyebrow = text("eyebrow"), title = text("title");
    const detailsHref = text("detailsHref"), supportHref = text("supportHref");
    const detailsCta = text("detailsCta"), supportCta = text("supportCta");
    if (item.kind !== "appeal" && item.kind !== "initiative") continue;
    if (![id, eyebrow, title, detailsCta, supportCta].every(value => value.trim())) continue;
    // Keep native site destinations; reject protocol-relative or malformed links.
    if (![detailsHref, supportHref].every(href => /^\/(?!\/)[^\s\\]*$/u.test(href))) continue;
    items.push({ id, kind: item.kind, eyebrow, title, subtitle: text("subtitle"), detailsHref, supportHref, detailsCta, supportCta });
    if (items.length === 4) break; // Match the public endpoint's four-item limit.
  }
  return items;
}
