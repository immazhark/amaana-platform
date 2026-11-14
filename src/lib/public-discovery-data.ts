import { isPublicFaithReviewComplete, publicFaithWhere } from "@/lib/faith-publication";
import { prisma } from "@/lib/prisma";
import { STORY_PAGE_SIZE } from "@/lib/story-discovery";
import { retainRoutableStoryRecords } from "@/lib/story-index-records";

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
  // Revalidate the second public read: records may change after index selection.
  // The database publication gate remains mandatory; malformed render fields
  // must not interrupt the page or expose an unusable destination.
  const visible = retainRoutableStoryRecords(cards).filter(card =>
    typeof card.title === "string" && card.title.trim().length > 0
    && typeof card.summary === "string" && Array.isArray(card.mediaAssets));
  const byId = new Map(visible.map(card => [card.id, card]));
  return ids.flatMap(id => {
    const card = byId.get(id);
    return card ? [card] : [];
  });
}

export async function getFaithDiscoveryData() {
  const records = await prisma.faithContent.findMany({
    where: publicFaithWhere,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      slug: true,
      type: true,
      title: true,
      excerpt: true,
      sourceCitation: true,
      verifiedAt: true,
      status: true,
      religiousReviewStatus: true,
      topics: {
        select: {
          topic: { select: { slug: true, name: true } },
        },
      },
    },
  });
  // Review status is needed only for the final eligibility check; do not serialize it.
  return records.filter(isPublicFaithReviewComplete).map(record => ({
    id: record.id, slug: record.slug, type: record.type, title: record.title,
    excerpt: record.excerpt, sourceCitation: record.sourceCitation,
    verifiedAt: record.verifiedAt, topics: record.topics,
  }));
}

/**
 * The Faith index is metadata-only. Recheck publication and complete religious
 * review for the two images that can actually render (hero and filtered lead).
 * This protects against a withdrawal between the index and media reads.
 */
export async function getVisibleFaithMedia(ids: readonly string[]) {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length > 2) throw new RangeError("At most two Faith media records can be loaded");
  if (uniqueIds.length === 0) return [];

  const records = await prisma.faithContent.findMany({
    where: { ...publicFaithWhere, id: { in: uniqueIds } },
    select: {
      id: true,
      status: true,
      religiousReviewStatus: true,
      verifiedAt: true,
      sourceCitation: true,
      mediaAssets: storyMediaCandidates,
    },
  });
  const allowed = new Set(uniqueIds);
  // Only separately approved media reaches the public library. Invalid
  // projection shapes must not bypass the verified religious review recheck
  // or interrupt text-only fallback if a relation is malformed.
  return (Array.isArray(records) ? records : []).filter(record =>
    record !== null && typeof record === "object" && !Array.isArray(record)
    && typeof record.id === "string" && allowed.has(record.id)
    && Array.isArray(record.mediaAssets)
    && typeof record.sourceCitation === "string"
    && isPublicFaithReviewComplete(record))
    .map(({ id, mediaAssets }) => ({ id, mediaAssets }));
}
