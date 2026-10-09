'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { hasPermission, requirePermission } from '@/lib/auth';
import { defaultHomeConfig, parseHomeConfig, validateHomeSlide } from '@/lib/home-carousel';
import { withSerializableTransactionRetry } from '@/lib/prisma-transaction';
import { getAppealCoverMediaIssues } from '@/lib/appeal-cover-media';

export async function saveHomeCarousel(form: FormData) {
  const user = await requirePermission('content.update');
  let notice = 'Carousel saved.';
  try {
    const revision = Number(form.get('revision'));
    if (!Number.isInteger(revision) || revision < 0) throw new Error('Refresh the carousel editor before saving.');
    const operation = String(form.get('operation'));
    if (!['save', 'add', 'remove', 'settings'].includes(operation)) throw new Error('Invalid carousel operation.');
    await withSerializableTransactionRetry(async tx => {
      const row = await tx.homeCarousel.findUnique({ where: { id: 'homepage' } });
      if ((row?.revision ?? 0) !== revision) throw new Error('The carousel changed in another session. Refresh before saving.');
      const config = row ? parseHomeConfig(row.config) : structuredClone(defaultHomeConfig);
      const id = String(form.get('id') ?? '');
      const current = config.slides.find(s => s.id === id);
      if (operation === 'settings') {
        if (!hasPermission(user, 'content.approve')) throw new Error('Publishing permission is required to change live appeal placement.');
        config.appealPosition = Number(form.get('appealPosition'));
      } else if (operation === 'add') {
        if (config.slides.length >= 20) throw new Error('Twenty slides is the carousel limit.');
        const template = defaultHomeConfig.slides[0];
        if (!template) throw new Error('The homepage carousel default template is unavailable.');
        config.slides.push({ ...template, id: `slide-${randomUUID()}`, eyebrow: 'Amaana Foundation', title: 'New Amaana slide', image: 'logo', order: Math.min(1000, Math.max(...config.slides.map(s => s.order)) + 1), status: 'DRAFT' });
      } else {
        if (!current) throw new Error('Slide no longer exists. Refresh before editing.');
        if (current.status === 'PUBLISHED' && !hasPermission(user, 'content.approve')) throw new Error('Publishing permission is required to modify a live slide.');
        if (operation === 'remove') {
          if (config.slides.length === 1) throw new Error('Keep at least one slide in the editor.');
          config.slides = config.slides.filter(s => s.id !== id);
        } else {
          const fields = Object.fromEntries([...form.entries()].filter(([,v]) => typeof v === 'string'));
          const slide = validateHomeSlide({ ...fields, id });
          if (slide.status === 'PUBLISHED' && !hasPermission(user, 'content.approve')) throw new Error('Publishing permission is required to publish a slide.');
          if (slide.image.startsWith('asset:')) {
            const media = await tx.mediaAsset.findUnique({ where: { id: slide.image.slice(6) } });
            const review = media ? await tx.auditEvent.findFirst({ where: { entityType: 'MediaAsset', entityId: media.id, action: 'media.privacy_reviewed' }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { metadata: true } }) : null;
            const issues = getAppealCoverMediaIssues(media, review?.metadata);
            if (issues.length) throw new Error(issues.join(' '));
            if (!slide.imageAlt.trim()) throw new Error('Describe the header image for screen readers.');
          }
          if (slide.appealSlug && !await tx.appeal.findUnique({ where: { slug: slide.appealSlug }, select: { id: true } })) throw new Error('Choose an existing appeal slug.');
          config.slides = config.slides.map(s => s.id === id ? slide : s);
        }
      }
      const validated = parseHomeConfig(config);
      if (!validated.slides.some(s => s.status === 'PUBLISHED' && !s.appealSlug && !s.startsAt && !s.endsAt)) throw new Error('Keep one published, unscheduled general slide as the permanent fallback.');
      const json = validated as unknown as Prisma.InputJsonValue;
      if (row) {
        const saved = await tx.homeCarousel.updateMany({ where: { id: 'homepage', revision }, data: { config: json, revision: { increment: 1 } } });
        if (saved.count !== 1) throw new Error('The carousel changed. Refresh before saving.');
      } else await tx.homeCarousel.create({ data: { id: 'homepage', config: json } });
      await tx.auditEvent.create({ data: { actorId: user.id, action: `home_carousel.${operation}`, entityType: 'HomeCarousel', entityId: 'homepage', metadata: { slideId: id || null, revision: revision + 1 } } });
    });
    revalidateTag('home-carousel', 'max'); revalidatePath('/'); revalidatePath('/admin/home-carousel');
  } catch (error) {
    notice = error instanceof Prisma.PrismaClientKnownRequestError ? 'Unable to save. Refresh and try again.' : error instanceof Error ? error.message : 'Unable to save the carousel.';
    redirect(`/admin/home-carousel?error=${encodeURIComponent(notice.slice(0,400))}`);
  }
  redirect('/admin/home-carousel?saved=1');
}
