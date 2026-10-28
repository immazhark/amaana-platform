import { publicFaithWhere } from "@/lib/faith-publication";
import { prisma } from "@/lib/prisma";
import { STORY_PAGE_SIZE } from "@/lib/story-discovery";

const DISCOVERY_MEDIA_CANDIDATE_LIMIT = 3;

const publicMediaSelect = {
  id: true,
  kind: true,
  title: true,
  publicUrl: true,
  externalUrl: true,
  altText: true,
  caption: true,
  sourceYear: true,
  sortOrder: true,
} as const;

const publicStoryWhere = { status: "PUBLISHED", privacyApprovedAt: { not: null } } as const;
const storyIndexSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  publishedAt: true,
  cause: { select: { title: true, status: true } },
  initiative: { select: { title: true, status: true, cause: { select: { title: true, status: true } } } },
} as const;
const storyMediaCandidates = {
  where: {
    kind: "IMAGE",
    isPublic: true,
    privacyApprovedAt: { not: null },
    publicUrl: { not: null },
    altText: { not: "" },
  },
  orderBy: { sortOrder: "asc" },
  take: DISCOVERY_MEDIA_CANDIDATE_LIMIT,
  select: publicMediaSelect,
} as const;

export async function getStoriesDiscoveryIndexData() {
  return prisma.story.findMany({
    where: publicStoryWhere,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { id: "asc" }],
    select: storyIndexSelect,
  });
}

export async function getVisibleStoryCards(ids: readonly string[]) {
  if (ids.length > STORY_PAGE_SIZE) throw new Error("Story page size exceeded");
  if (ids.length === 0) return [];

  const cards = await prisma.story.findMany({
    where: { ...publicStoryWhere, id: { in: [...ids] } },
    select: { ...storyIndexSelect, mediaAssets: storyMediaCandidates },
  });
  const byId = new Map(cards.map(card => [card.id, card]));
  return ids.flatMap(id => {
    const card = byId.get(id);
    return card ? [card] : [];
  });
}

export async function getFaithDiscoveryData() {
  return prisma.faithContent.findMany({
    where: publicFaithWhere,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      type: true,
      title: true,
      excerpt: true,
      sourceCitation: true,
      verifiedAt: true,
      topics: {
        select: {
          topic: { select: { slug: true, name: true } },
        },
      },

    },
  });
}

/** Only the library hero and filtered lead render images. Recheck publication
 * when loading their candidates so a withdrawn record supplies no media. */
export async function getVisibleFaithMedia(ids: readonly string[]) {
  const visibleIds = [...new Set(ids)];
  if (visibleIds.length > 2) throw new Error("At most two Faith media records are allowed");
  if (visibleIds.length === 0) return [];

  return prisma.faithContent.findMany({
    where: { ...publicFaithWhere, id: { in: visibleIds } },
    select: {
      id: true,
      mediaAssets: {
        where: {
          kind: "IMAGE",
          isPublic: true,
          privacyApprovedAt: { not: null },
          publicUrl: { not: null },
          altText: { not: "" },
        },
        orderBy: { sortOrder: "asc" },
        take: DISCOVERY_MEDIA_CANDIDATE_LIMIT,
        select: publicMediaSelect,
      },
    },
  });
}
