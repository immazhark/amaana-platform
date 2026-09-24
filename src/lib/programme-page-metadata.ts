import type { Metadata } from "next";
import { programmeBySlug } from "@/lib/master-copy";
import { getPublishedInitiativeBySlug } from "@/lib/public-content";

export async function programmePageMetadata(slug: string, canonical: string): Promise<Metadata> {
  const record = await getPublishedInitiativeBySlug(slug);
  if (!record) return { title: "Programme not found" };

  const programme = programmeBySlug(slug);
  const title = programme?.title ?? record.title;
  const description = programme?.summary ?? record.summary;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: `${title} | Amaana Foundation`,
      description,
    },
    twitter: {
      card: "summary",
      title: `${title} | Amaana Foundation`,
      description,
    },
  };
}
