import { z } from "zod";
import { normalizeStructuredDataPath, normalizeStructuredDataSiteUrl, serializeStructuredData } from "@/lib/structured-data";

type BreadcrumbItem = {
  name: string;
  path: string;
};

const breadcrumbItemsSchema = z.array(z.object({
  name: z.string().min(1).max(300).refine(value => value.trim().length > 0),
  path: z.string().min(1).max(2_048),
}).strict()).min(1);

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const parsed = breadcrumbItemsSchema.safeParse(items);
  if (!parsed.success) return null;
  const siteUrl = normalizeStructuredDataSiteUrl();
  // A breadcrumb is only valid if every destination is a public internal page.
  // Do not publish a partial navigation trail if one item is malformed.
  const normalized = parsed.data.map(item => {
    if (!item.name.trim() || /^[a-z][a-z0-9+.-]*:/i.test(item.path)) return null;
    const path = normalizeStructuredDataPath(item.path.startsWith("/") ? item.path : `/${item.path}`);
    return path ? { name: item.name, path } : null;
  });
  if (!normalized.length || normalized.some(item => item === null)) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: normalized.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item!.name,
      item: `${siteUrl}${item!.path}`,
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }} />;
}
