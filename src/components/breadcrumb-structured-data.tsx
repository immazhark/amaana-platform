type BreadcrumbItem = {
  name: string;
  path: string;
};

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org").replace(/\/$/, "");
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
