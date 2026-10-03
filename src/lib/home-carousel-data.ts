import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { defaultHomeConfig, parseHomeConfig } from '@/lib/home-carousel';
import { getAppealCoverMedia } from '@/lib/public-page-data';

export const getHomeCarouselConfig = cache(async () => {
  const row = await prisma.homeCarousel.findUnique({ where: { id: 'homepage' } });
  return { config: row ? parseHomeConfig(row.config) : structuredClone(defaultHomeConfig), revision: row?.revision ?? 0 };
});
export const getHomeCarouselImages = cache(async (images: string[]) => {
  const ids = [...new Set(images.filter(i => i.startsWith('asset:')).map(i => i.slice(6)))];
  if (!ids.length) return new Map<string, NonNullable<Awaited<ReturnType<typeof getAppealCoverMedia>>>>();
  const assets = await prisma.mediaAsset.findMany({ where: { id: { in: ids }, kind: 'IMAGE', isPublic: true, privacyApprovedAt: { not: null } }, select: { id: true, publicUrl: true } });
  const approved = await Promise.all(assets.map(async a => [a.id, await getAppealCoverMedia(a.publicUrl)] as const));
  return new Map(approved.filter((item): item is readonly [string, NonNullable<typeof item[1]>] => item[1] !== null));
});
