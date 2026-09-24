import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { programmeCategories } from "@/lib/master-copy";
import { programmeCategoryPath } from "@/lib/programme-category-routing";

export const dynamic = "force-dynamic";

const categorySlug = "medical-financial-relief";
const canonical = programmeCategoryPath(categorySlug);
const category = programmeCategories.find(item => item.slug === categorySlug);

export function generateMetadata(): Metadata {
  if (!category) {
    return {
      title: "Initiative not found",
      alternates: { canonical },
    };
  }

  return {
    title: category.title,
    description: category.summary,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${category.title} | Amaana Foundation`,
      description: category.summary,
    },
    twitter: {
      card: "summary",
      title: `${category.title} | Amaana Foundation`,
      description: category.summary,
    },
  };
}

export default function Page() {
  permanentRedirect(canonical);
}
