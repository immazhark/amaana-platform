import type { Metadata } from "next";
import { programmeBySlug } from "@/lib/master-copy";
import { getPublishedInitiativeBySlug } from "@/lib/public-content";
import { openGraphShareImages, twitterShareImages } from "@/lib/social-share-media";

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
      images: openGraphShareImages(),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Amaana Foundation`,
      description,
      images: twitterShareImages(),
    },
  };
}
