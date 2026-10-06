import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { defaultHomeConfig, parseHomeConfig } from '@/lib/home-carousel';
import { getAppealCoverMediaBatch, type ApprovedAppealCoverMedia } from '@/lib/public-page-data';

export const getHomeCarouselConfig = cache(async () => {
  const row = await prisma.homeCarousel.findUnique({ where: { id: 'homepage' } });
  return { config: row ? parseHomeConfig(row.config) : structuredClone(defaultHomeConfig), revision: row?.revision ?? 0 };
});
export const getHomeCarouselImages = cache(async (images: string[]) => {
  const ids = [...new Set(images.filter(i => i.startsWith('asset:')).map(i => i.slice(6)))];
  if (!ids.length) return new Map<string, ApprovedAppealCoverMedia>();
  const assets = await prisma.mediaAsset.findMany({
    where: { id: { in: ids }, kind: 'IMAGE', isPublic: true, privacyApprovedAt: { not: null } },
    select: { id: true, publicUrl: true },
  });
  const approvedByUrl = await getAppealCoverMediaBatch(assets.map(asset => asset.publicUrl));
  return new Map(
    assets.flatMap(asset => {
      if (!asset.publicUrl) return [];
      const approved = approvedByUrl.get(asset.publicUrl);
      return approved ? [[asset.id, approved] as const] : [];
    }),
  );
});
