'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { hasPermission, requirePermission } from '@/lib/auth';
import { defaultHomeConfig, hasSafeHomeSlideLinks, HomeCarouselValidationError, readStoredHomeConfig, parseHomeNumericInput, validateHomeSlide } from '@/lib/home-carousel';
import { withSerializableTransactionRetry } from '@/lib/prisma-transaction';
import { getAppealCoverMediaIssues } from '@/lib/appeal-cover-media';

const SLIDE_FIELDS = ['eyebrow', 'order', 'title', 'description', 'primaryLabel', 'primaryHref', 'secondaryLabel', 'secondaryHref', 'image', 'imageAlt', 'focalX', 'focalY', 'status', 'appealSlug', 'startsAt', 'endsAt'] as const;

function readCarouselField(form: FormData, name: string, optional = false): string {
  const values = form.getAll(name);
  if (optional && values.length === 0) return '';
  const value = values[0];
  if (values.length !== 1 || typeof value !== 'string') {
    throw new HomeCarouselValidationError('The submitted carousel details are invalid. Refresh the editor and try again.');
  }
  return value;
}

export async function saveHomeCarousel(form: FormData) {
  const user = await requirePermission('content.update');
  let notice = 'Carousel saved.';
  try {
    const revision = parseHomeNumericInput(readCarouselField(form, 'revision'));
    if (!Number.isSafeInteger(revision) || revision < 0) throw new HomeCarouselValidationError('Refresh the carousel editor before saving.');
    const operation = readCarouselField(form, 'operation');
    if (!['save', 'add', 'remove', 'settings'].includes(operation)) throw new HomeCarouselValidationError('Invalid carousel operation.');
    const id = readCarouselField(form, 'id', operation === 'add' || operation === 'settings');
    const appealPosition = operation === 'settings' ? readCarouselField(form, 'appealPosition') : '';
    const fields = operation === 'save'
      ? Object.fromEntries(SLIDE_FIELDS.map(name => [name, readCarouselField(form, name)]))
      : {};
    await withSerializableTransactionRetry(async tx => {
      const row = await tx.homeCarousel.findUnique({ where: { id: 'homepage' } });
      if ((row?.revision ?? 0) !== revision) throw new HomeCarouselValidationError('The carousel changed in another session. Refresh before saving.');
      const config = row ? readStoredHomeConfig(row.config) : structuredClone(defaultHomeConfig);
      const current = config.slides.find(s => s.id === id);
      if (operation === 'settings') {
        if (!hasPermission(user, 'content.approve')) throw new HomeCarouselValidationError('Publishing permission is required to change live appeal placement.');
        config.appealPosition = parseHomeNumericInput(appealPosition);
      } else if (operation === 'add') {
        if (config.slides.length >= 20) throw new HomeCarouselValidationError('Twenty slides is the carousel limit.');
        const template = defaultHomeConfig.slides[0];
        if (!template) throw new HomeCarouselValidationError('The homepage carousel default template is unavailable.');
        config.slides.push({ ...template, id: `slide-${randomUUID()}`, eyebrow: 'Amaana Foundation', title: 'New Amaana slide', image: 'logo', order: Math.min(1000, Math.max(...config.slides.map(s => s.order)) + 1), status: 'DRAFT' });
      } else {
        if (!current) throw new HomeCarouselValidationError('Slide no longer exists. Refresh before editing.');
        if (current.status === 'PUBLISHED' && !hasPermission(user, 'content.approve')) throw new HomeCarouselValidationError('Publishing permission is required to modify a live slide.');
        if (operation === 'remove') {
          if (config.slides.length === 1) throw new HomeCarouselValidationError('Keep at least one slide in the editor.');
          config.slides = config.slides.filter(s => s.id !== id);
        } else {
          const slide = validateHomeSlide({ ...fields, id });
          if (slide.status === 'PUBLISHED' && !hasPermission(user, 'content.approve')) throw new HomeCarouselValidationError('Publishing permission is required to publish a slide.');
          if (slide.image.startsWith('asset:')) {
            const media = await tx.mediaAsset.findUnique({ where: { id: slide.image.slice(6) } });
            const review = media ? await tx.auditEvent.findFirst({ where: { entityType: 'MediaAsset', entityId: media.id, action: 'media.privacy_reviewed' }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { metadata: true } }) : null;
            const issues = getAppealCoverMediaIssues(media, review?.metadata);
            if (issues.length) throw new HomeCarouselValidationError(issues.join(' '));
            if (!slide.imageAlt.trim()) throw new HomeCarouselValidationError('Describe the header image for screen readers.');
          }
          if (slide.appealSlug && !await tx.appeal.findUnique({ where: { slug: slide.appealSlug }, select: { id: true } })) throw new HomeCarouselValidationError('Choose an existing appeal slug.');
          config.slides = config.slides.map(s => s.id === id ? slide : s);
        }
      }
      // Only the submitted slide is changed and strictly validated above. Keep
      // other legacy links editable, withheld from public composition until fixed.
      const validated = readStoredHomeConfig(config);
      if (!validated.slides.some(s => s.status === 'PUBLISHED' && hasSafeHomeSlideLinks(s) && !s.appealSlug && !s.startsAt && !s.endsAt)) throw new HomeCarouselValidationError('Keep one published, unscheduled general slide as the permanent fallback.');
      const json = validated as unknown as Prisma.InputJsonValue;
      if (row) {
        const saved = await tx.homeCarousel.updateMany({ where: { id: 'homepage', revision }, data: { config: json, revision: { increment: 1 } } });
        if (saved.count !== 1) throw new HomeCarouselValidationError('The carousel changed. Refresh before saving.');
      } else await tx.homeCarousel.create({ data: { id: 'homepage', config: json } });
      await tx.auditEvent.create({ data: { actorId: user.id, action: `home_carousel.${operation}`, entityType: 'HomeCarousel', entityId: 'homepage', metadata: { slideId: id || null, revision: revision + 1 } } });
    });
    revalidateTag('home-carousel', 'max'); revalidatePath('/'); revalidatePath('/admin/home-carousel');
  } catch (error) {
    notice = error instanceof Prisma.PrismaClientKnownRequestError ? 'Unable to save. Refresh and try again.' : error instanceof HomeCarouselValidationError ? error.message : 'Unable to save the carousel.';
    redirect(`/admin/home-carousel?error=${encodeURIComponent(notice.slice(0,400))}`);
  }
  redirect('/admin/home-carousel?saved=1');
}
