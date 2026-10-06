export type HomeSlide = {
  id: string; eyebrow: string; title: string; description: string;
  primaryLabel: string; primaryHref: string; secondaryLabel: string; secondaryHref: string;
  image: string; imageAlt: string; focalX: number; focalY: number;
  order: number; status: 'DRAFT' | 'PUBLISHED'; startsAt: string; endsAt: string; appealSlug: string;
};
export type HomeCarouselConfig = { slides: HomeSlide[]; appealPosition: number };
export const HOME_ARTWORK = ['logo', 'origin', 'eid', 'medical', 'taleem', 'qurbani'] as const;
export const HOME_ARTWORK_SRC = {
  origin: '/hero/origin.webp',
  eid: '/hero/eid.webp',
  medical: '/hero/medical.webp',
  taleem: '/hero/taleem.webp',
  qurbani: '/hero/qurbani.webp',
} as const;
export const defaultHomeSlides: HomeSlide[] = [
  { id: 'origin', eyebrow: 'The Story of Amaana · Hyderabad', title: 'A trust that began around one family table.', description: 'What began as a small grassroots effort to support families with dignity grew into recurring community programmes and a formally organised charitable foundation. Our purpose remains the same: treat every contribution as an amaana — a trust.', primaryLabel: 'Discover our story', primaryHref: '/about', secondaryLabel: 'Explore our work', secondaryHref: '/our-work', image: 'origin', imageAlt: 'Photo-based collage illustrating Amaana community programmes', focalX: 50, focalY: 50, order: 0, status: 'PUBLISHED', startsAt: '', endsAt: '', appealSlug: '' },
  { id: 'eid', eyebrow: 'Ramadan & Eid · A recurring initiative', title: 'Eid Gift Kits. Thoughtful support, year after year.', description: 'Our Eid Gift Kits initiative brings practical essentials to families facing financial hardship, with care for their needs and dignity. Explore the programme’s history and its documented distributions across the years.', primaryLabel: 'Explore Eid Gift Kits', primaryHref: '/our-work/eid-gift-kits', secondaryLabel: 'Ways to support', secondaryHref: '/get-involved', image: 'eid', imageAlt: 'Photo-based collage of Amaana Eid Gift Kit preparation and distribution', focalX: 50, focalY: 50, order: 1, status: 'PUBLISHED', startsAt: '', endsAt: '', appealSlug: '' },
  { id: 'medical', eyebrow: 'Medical & financial relief', title: 'Verified help when a family needs it most.', description: 'Illness and sudden financial hardship can become too heavy for a family to carry alone. Amaana reviews needs, protects personal information and connects responsible support with verified medical and financial assistance.', primaryLabel: 'Explore medical & financial aid', primaryHref: '/programmes/medical-financial-relief', secondaryLabel: 'Request assistance', secondaryHref: '/request-assistance', image: 'medical', imageAlt: 'Photo-based collage illustrating Amaana’s community assistance work', focalX: 50, focalY: 50, order: 2, status: 'PUBLISHED', startsAt: '', endsAt: '', appealSlug: '' },
  { id: 'taleem', eyebrow: 'Amaana Taleem Initiative', title: 'Helping learners continue with dignity.', description: 'Amaana Taleem supports learning through educational essentials, Qur’anic education and verified sponsorship pathways. Discover the initiative and how sustained support can help learners continue their journey.', primaryLabel: 'Explore Amaana Taleem', primaryHref: '/our-work/taleem', secondaryLabel: 'Sponsor education', secondaryHref: '/get-involved/sponsor-education', image: 'taleem', imageAlt: 'Photo-based collage of the Amaana Taleem education initiative', focalX: 50, focalY: 50, order: 3, status: 'PUBLISHED', startsAt: '', endsAt: '', appealSlug: '' },
  { id: 'qurbani', eyebrow: 'Qurbani · Sharing with care', title: 'Qurbani Meat Distribution. Care that reaches families.', description: 'Our recurring Qurbani programme shares meat with families through thoughtful preparation, local coordination and dignified distribution. Explore the main programme and its documented work across the years.', primaryLabel: 'Explore Qurbani distribution', primaryHref: '/our-work/qurbani-meat-distribution', secondaryLabel: 'Ways to support', secondaryHref: '/get-involved', image: 'qurbani', imageAlt: 'Photo-based collage of Amaana Qurbani meat packing and distribution', focalX: 50, focalY: 50, order: 4, status: 'PUBLISHED', startsAt: '', endsAt: '', appealSlug: '' },
];
export const defaultHomeConfig: HomeCarouselConfig = { slides: defaultHomeSlides, appealPosition: 1 };
export function safeHomeHref(value: string) {
  if (!/^\/(?!\/)[a-zA-Z0-9/_?=&%#.-]*$/.test(value) || /%(?:25|2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)) throw new Error('Use a safe internal website link.');
  const url = new URL(value, 'https://amaana.invalid');
  if (url.origin !== 'https://amaana.invalid' || /^\/(?:admin|api)(?:\/|$)/i.test(decodeURIComponent(url.pathname))) throw new Error('Choose a public website destination.');
  return value;
}
export function validateHomeSlide(raw: unknown): HomeSlide {
  if (!raw || typeof raw !== 'object') throw new Error('Slide details are missing.');
  const v = raw as Record<string, unknown>;
  const text = (key: string, min: number, max: number) => {
    if (typeof v[key] !== 'string' || (v[key] as string).trim().length < min || (v[key] as string).trim().length > max) throw new Error(`${key}: use ${min}–${max} characters.`);
    return (v[key] as string).trim();
  };
  const id = text('id', 1, 80);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error('Slide identifier is invalid.');
  const status = text('status', 5, 9);
  if (status !== 'DRAFT' && status !== 'PUBLISHED') throw new Error('Choose Draft or Published.');
  const image = text('image', 1, 120);
  if (!HOME_ARTWORK.includes(image as typeof HOME_ARTWORK[number]) && !/^asset:[a-zA-Z0-9_-]+$/.test(image)) throw new Error('Choose approved artwork or a reviewed media image.');
  const order = Number(v.order), focalX = Number(v.focalX), focalY = Number(v.focalY);
  if (!Number.isInteger(order) || order < 0 || order > 1000 || ![focalX, focalY].every(n => Number.isFinite(n) && n >= 0 && n <= 100)) throw new Error('Order and image focal point are invalid.');
  let startsAt = text('startsAt', 0, 40), endsAt = text('endsAt', 0, 40);
  const appealSlug = text('appealSlug', 0, 160);
  for (const date of [startsAt, endsAt]) if (date && (!/^\d{4}-\d\d-\d\dT/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date.slice(0,10) + 'T00:00:00Z').toISOString().slice(0,10) !== date.slice(0,10))) throw new Error('Use a valid date/time.');
  startsAt = startsAt ? new Date(startsAt.endsWith('Z') || /[+-]\d\d:\d\d$/.test(startsAt) ? startsAt : startsAt + 'Z').toISOString() : '';
  endsAt = endsAt ? new Date(endsAt.endsWith('Z') || /[+-]\d\d:\d\d$/.test(endsAt) ? endsAt : endsAt + 'Z').toISOString() : '';
  if (startsAt && endsAt && Date.parse(startsAt) >= Date.parse(endsAt)) throw new Error('End time must follow start time.');
  if (appealSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(appealSlug)) throw new Error('Appeal slug is invalid.');
  return { id, eyebrow: text('eyebrow', 1, 70), title: text('title', 5, 100), description: text('description', 20, 320), primaryLabel: text('primaryLabel', 2, 42), primaryHref: safeHomeHref(text('primaryHref', 1, 240)), secondaryLabel: text('secondaryLabel', 0, 42), secondaryHref: v.secondaryLabel ? safeHomeHref(text('secondaryHref', 1, 240)) : '', image, imageAlt: text('imageAlt', 0, 200), focalX, focalY, order, status, startsAt, endsAt, appealSlug };
}
export function parseHomeConfig(raw: unknown): HomeCarouselConfig {
  if (!raw || typeof raw !== 'object') throw new Error('Carousel configuration is invalid.');
  const v = raw as Record<string, unknown>;
  if (!Array.isArray(v.slides) || v.slides.length < 1 || v.slides.length > 20) throw new Error('Keep between one and twenty slides.');
  const slides = v.slides.map(validateHomeSlide);
  if (new Set(slides.map(s => s.id)).size !== slides.length) throw new Error('Slide identifiers must be unique.');
  const appealPosition = Number(v.appealPosition);
  if (!Number.isInteger(appealPosition) || appealPosition < 0 || appealPosition > 20) throw new Error('Appeal position must be between zero and twenty.');
  return { slides, appealPosition };
}
export function visibleHomeSlides(config: HomeCarouselConfig, activeAppealSlugs: ReadonlySet<string>, now = new Date()) {
  return config.slides.filter(s => s.status === 'PUBLISHED' && (!s.startsAt || Date.parse(s.startsAt) <= now.getTime()) && (!s.endsAt || Date.parse(s.endsAt) > now.getTime()) && (!s.appealSlug || activeAppealSlugs.has(s.appealSlug))).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

/** Insert automatically sourced appeals once; custom linked slides take precedence. */
export function composeHomeSlides(config: HomeCarouselConfig, appealSlides: HomeSlide[], now = new Date()) {
  const visible = visibleHomeSlides(config, new Set(appealSlides.map(s => s.appealSlug)), now);
  const linked = new Set(visible.map(s => s.appealSlug).filter(Boolean));
  const automatic = appealSlides.filter(s => !linked.has(s.appealSlug));
  // Valid admin saves retain an unscheduled fallback. Protect rendering of old/corrupt empty visibility windows too.
  const general = visible.length ? visible : [defaultHomeSlides[0]];
  const position = Math.min(config.appealPosition, general.length);
  return [...general.slice(0, position), ...automatic, ...general.slice(position)];
}
