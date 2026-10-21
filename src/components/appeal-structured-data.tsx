import { normalizeStructuredDataSiteUrl, serializeStructuredData } from "@/lib/structured-data";
import { publicAppealShareCopy } from "@/lib/public-appeal-share";

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
  const siteUrl = normalizeStructuredDataSiteUrl();
  const appealUrl = `${siteUrl}/appeals/${slug}`;
  const { title: safeTitle, summary: safeSummary } = publicAppealShareCopy(title, summary, highlySensitive);

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
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }} />;
}
