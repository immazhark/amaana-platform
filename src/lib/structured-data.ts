import { z } from "zod";
import { isCspCompatiblePublicImageUrl, isPrivateAppMediaUrl, normalizeSafePublicMediaUrl } from "./public-media";

export type PublicStructuredDataType = "Article" | "WebPage";

export type PublicStructuredDataInput = {
  type: PublicStructuredDataType;
  title: string;
  description: string;
  path: string;
  publishedAt?: Date | string | null;
  modifiedAt?: Date | string | null;
  imageUrl?: string | null;
  section?: string | null;
  keywords?: string[];
};

const publicStructuredDataInputSchema = z.object({
  type: z.enum(["Article", "WebPage"]),
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(5_000),
  path: z.string().min(1).max(2_048),
  publishedAt: z.union([z.date(), z.string().max(64)]).nullable().optional(),
  modifiedAt: z.union([z.date(), z.string().max(64)]).nullable().optional(),
  imageUrl: z.string().max(2_048).nullable().optional(),
  section: z.string().max(200).nullable().optional(),
  keywords: z.array(z.string().max(120)).max(50).optional(),
}).strict();

const breadcrumbInputSchema = z.array(z.object({
  name: z.string().min(1).max(300).refine(value => Boolean(value.trim())),
  path: z.string().min(1).max(2_048),
}).strict()).min(1).max(20);

const appealInputSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(300).refine(value => Boolean(value.trim())),
  summary: z.string().min(1).max(5_000).refine(value => Boolean(value.trim())),
  isOpen: z.boolean(),
  highlySensitive: z.boolean().optional(),
}).strict();

/** Optional schema output must fail closed rather than crash the public page. */
export function validateBreadcrumbStructuredDataInput(input: unknown) {
  const parsed = breadcrumbInputSchema.safeParse(input);
  if (!parsed.success) return null;
  const items: { name: string; path: string }[] = [];
  for (const item of parsed.data) {
    const path = normalizeStructuredDataPath(item.path);
    if (!path) return null;
    items.push({ name: item.name, path });
  }
  return items;
}

export function validateAppealStructuredDataInput(input: unknown) {
  const parsed = appealInputSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

const DEFAULT_SITE_URL = "https://amaanafoundation.org";

function normalizeSiteUrl(value: string | undefined) {
  try {
    const url = new URL(value || DEFAULT_SITE_URL);
    if (url.protocol !== "https:" || url.username || url.password) return DEFAULT_SITE_URL;
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function normalizeStructuredDataPath(path: string) {
  const value = path.trim();
  if (!value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001F\u007F\s]/.test(value)) return null;

  try {
    const url = new URL(value, DEFAULT_SITE_URL);
    if (url.origin !== DEFAULT_SITE_URL) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** Never publish a private/unapproved media destination into crawlable JSON-LD.
 * Keep the output host specific to the current site or an explicitly configured
 * image CDN. Publication and consent are still checked by the caller. */
export function normalizeStructuredDataImage(imageUrl: string | null | undefined, siteUrl: string) {
  const normalized = normalizeSafePublicMediaUrl(imageUrl);
  if (!normalized || isPrivateAppMediaUrl(normalized)) return null;

  try {
    const site = new URL(siteUrl);
    if (site.protocol !== "https:" || site.username || site.password) return null;

    if (normalized.startsWith("/")) return new URL(normalized, site.origin).toString();

    const url = new URL(normalized);
    // A caller-provided canonical siteUrl may differ from the process env in
    // isolated/staging builds. The origin comparison remains exact.
    if (url.origin === site.origin || isCspCompatiblePublicImageUrl(normalized)) {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function isoDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function buildPublicStructuredData(input: PublicStructuredDataInput, configuredSiteUrl = process.env.NEXT_PUBLIC_APP_URL) {
  const parsed = publicStructuredDataInputSchema.safeParse(input);
  if (!parsed.success) return null;

  const safeInput = parsed.data;
  const path = normalizeStructuredDataPath(safeInput.path);
  const title = cleanText(safeInput.title);
  const description = cleanText(safeInput.description);
  if (!path || !title || !description) return null;

  const siteUrl = normalizeSiteUrl(configuredSiteUrl);
  const url = new URL(path, siteUrl).toString();
  const image = normalizeStructuredDataImage(safeInput.imageUrl, siteUrl);
  const published = isoDate(safeInput.publishedAt);
  const modified = isoDate(safeInput.modifiedAt);
  const section = safeInput.section ? cleanText(safeInput.section) : "";
  const keywords = safeInput.keywords?.map(cleanText).filter(Boolean).filter((value, index, list) => list.indexOf(value) === index);

  return {
    "@context": "https://schema.org",
    "@type": safeInput.type,
    "@id": `${url}#content`,
    url,
    name: title,
    headline: title,
    description,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${siteUrl}/#website` },
    publisher: { "@id": `${siteUrl}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(image ? { image } : {}),
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    ...(section ? { articleSection: section } : {}),
    ...(keywords?.length ? { keywords } : {}),
  };
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
