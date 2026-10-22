import "server-only";
import { prisma } from "@/lib/prisma";
import { publicFaithWhere } from "@/lib/faith-publication";
import { PUBLIC_DETAIL_MEDIA_PROJECTION } from "@/lib/public-content";

export const PUBLIC_ARCHIVE_PAGE_SIZE = 24;
export type PublicArchiveKind = "initiative" | "story" | "faith";

export function parsePublicArchivePage(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d{0,8}$/.test(value)) return null;
  const page = Number(value);
  return (page - 1) * PUBLIC_ARCHIVE_PAGE_SIZE <= 2_147_483_647 ? page : null;
}

/** Count only eligible rows before accepting an offset; a forged huge page
 * cannot force a deep scan. Repeat parent publication gates in the media read
 * so withdrawal between reads fails closed. No storage/review fields leave SQL.
 */
export async function getPublicMediaArchive(kind: string, slug: string, page: number) {
  if (parsePublicArchivePage(String(page)) !== page || !slug || slug.length > 200) return null;
  const mediaWhere = PUBLIC_DETAIL_MEDIA_PROJECTION.where;
  // Page one already fetches one extra row for hasNext. Avoid an expensive
  // parent relation count until a visitor requests an offset page.
  const baseSelect = { id: true, slug: true, title: true } as const;
  const select = page === 1 ? baseSelect : {
    ...baseSelect,
    _count: { select: { mediaAssets: { where: mediaWhere } } },
  } as const;
  const initiativeWhere = { slug, status: "PUBLISHED" as const, cause: { status: "PUBLISHED" as const } };
  const storyWhere = { slug, status: "PUBLISHED" as const, privacyApprovedAt: { not: null } };
  const faithWhere = { slug, ...publicFaithWhere };
  const parent = kind === "initiative"
    ? await prisma.initiative.findFirst({ where: initiativeWhere, select })
    : kind === "story"
      ? await prisma.story.findFirst({ where: storyWhere, select })
      : kind === "faith"
        ? await prisma.faithContent.findFirst({ where: faithWhere, select })
        : null;
  if (!parent) return null;
  // The extra offset-page count must exist and be positive. Fail closed if an
  // unexpected projection omitted it instead of making an unchecked deep read.
  if (page > 1) {
    const count = "_count" in parent ? parent._count?.mediaAssets : undefined;
    if (typeof count !== "number" || (page - 1) * PUBLIC_ARCHIVE_PAGE_SIZE >= count) return null;
  }
  const relation = kind === "initiative" ? { initiative: { id: parent.id, ...initiativeWhere } }
    : kind === "story" ? { story: { id: parent.id, ...storyWhere } }
      : { faithContent: { id: parent.id, ...faithWhere } };
  const media = await prisma.mediaAsset.findMany({
    where: { ...mediaWhere, ...relation },
    select: PUBLIC_DETAIL_MEDIA_PROJECTION.select,
    orderBy: PUBLIC_DETAIL_MEDIA_PROJECTION.orderBy,
    skip: (page - 1) * PUBLIC_ARCHIVE_PAGE_SIZE,
    take: PUBLIC_ARCHIVE_PAGE_SIZE + 1,
  });
  // A parent/media withdrawal between reads must not leave stale copy behind.
  if (!media.length) return null;
  return {
    slug: parent.slug, title: parent.title,
    media: media.slice(0, PUBLIC_ARCHIVE_PAGE_SIZE),
    hasNext: media.length > PUBLIC_ARCHIVE_PAGE_SIZE,
  };
}
