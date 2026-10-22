import { normalizeStructuredDataPath, normalizeStructuredDataSiteUrl, serializeStructuredData } from "@/lib/structured-data";

type BreadcrumbItem = {
  name: string;
  path: string;
};

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const siteUrl = normalizeStructuredDataSiteUrl();
  // A breadcrumb is only valid if every destination is a public internal page.
  // Do not publish a partial navigation trail if one item is malformed.
  const normalized = items.map(item => {
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
