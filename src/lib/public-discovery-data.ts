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
  const records = await prisma.story.findMany({
    where: publicStoryWhere,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { id: "asc" }],
    select: storyIndexSelect,
  });
  // Malformed index identities must not reach pagination or a second public query.
  return retainRoutableStoryRecords(records);
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
  // Reject malformed public identity/text projections before the page renders.
  const reviewed = (Array.isArray(records) ? records : []).filter(record =>
    record && typeof record === "object" && !Array.isArray(record)
    && typeof record.id === "string" && record.id.trim().length > 0
    && typeof record.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)
    && (record.type === "ARTICLE" || record.type === "REMINDER" || record.type === "VIDEO")
    && typeof record.title === "string" && record.title.trim().length > 0
    && typeof record.excerpt === "string"
    && typeof record.sourceCitation === "string"
    && isPublicFaithReviewComplete(record));
  return reviewed.map(record => ({
    id: record.id, slug: record.slug, type: record.type, title: record.title,
    excerpt: record.excerpt, sourceCitation: record.sourceCitation,
    verifiedAt: record.verifiedAt,
    // A corrupt topic relation cannot authorize or disclose public editorial text.
    // Keep the independently reviewed item and omit only unusable taxonomy links.
    topics: (Array.isArray(record.topics) ? record.topics : []).filter(link =>
      link && typeof link === "object" && !Array.isArray(link)
      && link.topic && typeof link.topic === "object" && !Array.isArray(link.topic)
      && typeof link.topic.slug === "string"
      && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(link.topic.slug)
      && typeof link.topic.name === "string" && link.topic.name.trim().length > 0),
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
