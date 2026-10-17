import { prisma } from "@/lib/prisma";
import { publicFaithWhere, isPublicFaithReviewComplete } from "@/lib/faith-publication";

/** Editor-owned topic slugs, subject to the original religious/publication gate. */
export const CHARITABLE_GIVING_TOPIC_SLUGS = [
  "zakat", "sadaqah", "charity", "islamic-charity",
  "generosity", "giving", "waqf", "qurbani",
] as const;

export async function getReviewedGivingEducation() {
  const items = await prisma.faithContent.findMany({
    where: {
      ...publicFaithWhere,
      topics: { some: { topic: { slug: { in: [...CHARITABLE_GIVING_TOPIC_SLUGS] } } } },
    },
    select: {
      id: true, slug: true, title: true, excerpt: true,
      type: true, verifiedAt: true, sourceCitation: true,
      religiousReviewStatus: true, status: true,
      topics: { select: { topic: { select: { slug: true, name: true } } } },
    },
    orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
    take: 12,
  });
  return items.filter(item =>
    isPublicFaithReviewComplete(item) &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) &&
    item.title.trim().length > 0 &&
    item.excerpt.trim().length > 0 &&
    item.topics.some(link =>
      CHARITABLE_GIVING_TOPIC_SLUGS.some(slug => slug === link.topic.slug)));
}
