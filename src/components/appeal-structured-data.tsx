import { z } from "zod";
import { normalizeStructuredDataSiteUrl, serializeStructuredData } from "@/lib/structured-data";
import { publicAppealShareCopy } from "@/lib/public-appeal-share";

type AppealStructuredDataProps = {
  slug: string;
  title: string;
  summary: string;
  isOpen: boolean;
  highlySensitive?: boolean;
};

const appealSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(300).refine(value => value.trim().length > 0),
  summary: z.string().min(1).max(5_000).refine(value => value.trim().length > 0),
  isOpen: z.boolean(),
  highlySensitive: z.boolean().optional(),
}).strict();

export function AppealStructuredData(props: AppealStructuredDataProps) {
  const parsed = appealSchema.safeParse(props);
  if (!parsed.success) return null;
  const { slug, title, summary, isOpen, highlySensitive = false } = parsed.data;
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
