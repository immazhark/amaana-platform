import type { Metadata } from "next";
import { programmeBySlug } from "@/lib/master-copy";

export function programmePageMetadata(slug: string, canonical: string): Metadata {
  const programme = programmeBySlug(slug);
  const title = programme?.title ?? "Amaana Programme";
  const description = programme?.summary ?? "Explore documented Amaana Foundation community work in Hyderabad.";

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
