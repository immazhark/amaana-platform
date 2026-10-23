import { z } from "zod";
import { isPrivateAppMediaUrl } from "@/lib/public-media";

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

const DEFAULT_SITE_URL = "https://amaanafoundation.org";

export function normalizeStructuredDataSiteUrl(value = process.env.NEXT_PUBLIC_APP_URL) {
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
    if (url.origin !== DEFAULT_SITE_URL || isPrivateAppMediaUrl(url.pathname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function normalizeStructuredDataImage(imageUrl: string | null | undefined, siteUrl: string) {
  const value = imageUrl?.trim();
  if (!value || /[\\\u0000-\u001F\u007F\s]/.test(value)) return null;

  try {
    if (value.startsWith("/")) {
      if (value.startsWith("//")) return null;
      const url = new URL(value, siteUrl);
      if (url.origin !== siteUrl || isPrivateAppMediaUrl(url.pathname)) return null;
      return url.toString();
    }

    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    // The configured origin and the apex/www production aliases are app
    // routes; none may advertise a protected destination as a public image.
    if (isPrivateAppMediaUrl(url.toString()) ||
        (url.origin === siteUrl && isPrivateAppMediaUrl(url.pathname))) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isoDate(value: Date | string | null | undefined) {
  if (!value) return null;

  if (typeof value === "string") {
    // Date.parse silently rolls impossible ISO days into the next month.
    // Do not publish a date that was never supplied by the source.
    const calendarDate = /^(\d{4})-(\d{2})-(\d{2})(?!\d)/.exec(value);
    if (calendarDate) {
      const year = Number(calendarDate[1]);
      const month = Number(calendarDate[2]);
      const day = Number(calendarDate[3]);
      const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
      const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) return null;
    }
  }

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

  const siteUrl = normalizeStructuredDataSiteUrl(configuredSiteUrl);
  const contentUrl = new URL(path, siteUrl);
  const url = contentUrl.toString();
  contentUrl.hash = "content";
  const image = normalizeStructuredDataImage(safeInput.imageUrl, siteUrl);
  const published = isoDate(safeInput.publishedAt);
  const modified = isoDate(safeInput.modifiedAt);
  const section = safeInput.section ? cleanText(safeInput.section) : "";
  const keywords = safeInput.keywords?.map(cleanText).filter(Boolean).filter((value, index, list) => list.indexOf(value) === index);

  return {
    "@context": "https://schema.org",
    "@type": safeInput.type,
    "@id": contentUrl.toString(),
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
    ...(modified && (!published || modified >= published) ? { dateModified: modified } : {}),
    ...(safeInput.type === "Article" && section ? { articleSection: section } : {}),
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
