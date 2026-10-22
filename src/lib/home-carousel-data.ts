import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { defaultHomeConfig, readStoredHomeConfig } from '@/lib/home-carousel';
import { getAppealCoverMediaBatch, type ApprovedAppealCoverMedia } from '@/lib/public-page-data';

const getHomeCarouselConfigCached = unstable_cache(async () => {
  const row = await prisma.homeCarousel.findUnique({ where: { id: 'homepage' } });
  return { config: row ? readStoredHomeConfig(row.config) : structuredClone(defaultHomeConfig), revision: row?.revision ?? 0 };
}, ['home-carousel-config'], { revalidate: 300, tags: ['home-carousel'] });

export const getHomeCarouselConfig = cache(getHomeCarouselConfigCached);
export const getHomeCarouselImages = cache(async (
  images: readonly string[],
  appealCoverUrls: readonly (string | null | undefined)[] = [],
) => {
  const ids = [...new Set(images.filter(image => image.startsWith('asset:')).map(image => image.slice(6)))];
  const assets = ids.length ? await prisma.mediaAsset.findMany({
    where: { id: { in: ids }, kind: 'IMAGE', isPublic: true, privacyApprovedAt: { not: null } },
    select: { id: true, publicUrl: true },
  }) : [];

  // Configured slides and live-appeal covers share the same privacy-review
  // contract. Fetch the review audit once for the union of their public URLs.
  const urls = [...new Set([...assets.map(asset => asset.publicUrl), ...appealCoverUrls]
    .filter((url): url is string => Boolean(url)))];
  if (!urls.length) {
    return {
      images: new Map<string, ApprovedAppealCoverMedia>(),
      coverByUrl: new Map<string, ApprovedAppealCoverMedia>(),
    };
  }

  const coverByUrl = await getAppealCoverMediaBatch(urls);
  const approvedImages = new Map<string, ApprovedAppealCoverMedia>();
  for (const asset of assets) {
    if (!asset.publicUrl) continue;
    const approved = coverByUrl.get(asset.publicUrl);
    if (approved) approvedImages.set(asset.id, approved);
  }
  return { images: approvedImages, coverByUrl };
});
