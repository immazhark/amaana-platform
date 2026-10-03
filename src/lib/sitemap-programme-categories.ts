import { programmeCategories, programmes } from "@/lib/master-copy";
import { programmeCategoryPath } from "@/lib/programme-category-routing";

export function publishedProgrammeCategoryPaths(publishedInitiativeSlugs: ReadonlySet<string>) {
  return new Set<string>(
    programmeCategories
      .filter(category =>
        programmes.some(programme =>
          programme.causeSlug === category.slug
          && !("parentSlug" in programme)
          && publishedInitiativeSlugs.has(programme.slug),
        ),
      )
      .map(category => programmeCategoryPath(category.slug))
      .filter(path => path.startsWith("/programmes/")),
  );
}
