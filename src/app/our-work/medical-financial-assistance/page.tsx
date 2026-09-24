import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { programmeCategories, programmes } from "@/lib/master-copy";
import { programmeCategoryPath } from "@/lib/programme-category-routing";
import { getOurWorkIndexData } from "@/lib/public-page-data";

export const dynamic = "force-dynamic";

const categorySlug = "medical-financial-relief";

function hasPublishedTopLevelProgramme(publishedSlugs: Set<string>) {
  return programmes.some(
    item => item.causeSlug === categorySlug
      && !("parentSlug" in item)
      && publishedSlugs.has(item.slug),
  );
}

async function getPublishedCategory() {
  const category = programmeCategories.find(item => item.slug === categorySlug);
  if (!category) return null;

  const causes = await getOurWorkIndexData();
  const publishedSlugs = new Set(causes.flatMap(cause => cause.initiatives.map(item => item.slug)));
  return hasPublishedTopLevelProgramme(publishedSlugs) ? category : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const category = await getPublishedCategory();
  if (!category) return { title: "Initiative not found" };

  const canonical = programmeCategoryPath(category.slug);
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

export default async function Page() {
  const category = await getPublishedCategory();
  if (!category) notFound();
  permanentRedirect(programmeCategoryPath(category.slug));
}
