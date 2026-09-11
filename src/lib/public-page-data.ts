import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  getPublishedFaithContentBySlug,
  getPublishedInitiativeBySlug,
  getPublishedStoryBySlug,
} from "@/lib/public-content";

/**
 * React request memoization for dynamic routes whose metadata and page body
 * need the same public record. This keeps metadata generation from causing a
 * second identical Prisma read during one render request while preserving the
 * existing publication/privacy gates in the underlying getters.
 */
export const getInitiativePageData = cache(getPublishedInitiativeBySlug);
export const getStoryPageData = cache(getPublishedStoryBySlug);
export const getFaithPageData = cache(getPublishedFaithContentBySlug);

export const getAppealPageData = cache(async (slug: string) => {
  return prisma.appeal.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "FUNDED", "CLOSED"] } },
    include: {
      updates: {
        where: { isPublic: true },
        orderBy: { publishedAt: "desc" },
      },
    },
  });
});
