type AppealStructuredDataProps = {
  slug: string;
  title: string;
  summary: string;
  isOpen: boolean;
  highlySensitive?: boolean;
};

export function AppealStructuredData({
  slug,
  title,
  summary,
  isOpen,
  highlySensitive = false,
}: AppealStructuredDataProps) {
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org").replace(/\/$/, "");
  const appealUrl = `${siteUrl}/appeals/${slug}`;
  const safeTitle = highlySensitive ? "Verified Support Appeal" : title;
  const safeSummary = highlySensitive
    ? "A privacy-sensitive verified support appeal from Amaana Foundation. Public details are intentionally limited."
    : summary;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${appealUrl}#webpage`,
      url: appealUrl,
      name: safeTitle,
      description: safeSummary,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
      inLanguage: "en-IN",
    },
  ];

  if (isOpen && !highlySensitive) {
    graph.push({
      "@type": "DonateAction",
      "@id": `${appealUrl}#donate`,
      name: `Support ${safeTitle}`,
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/donate/${slug}`,
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
      recipient: { "@id": `${siteUrl}/#organization` },
      object: { "@id": `${appealUrl}#webpage` },
    });
  }

  const data = { "@context": "https://schema.org", "@graph": graph };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
