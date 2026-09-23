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

export function normalizeStructuredDataImage(imageUrl: string | null | undefined, siteUrl: string) {
  const value = imageUrl?.trim();
  if (!value || /[\\\u0000-\u001F\u007F\s]/.test(value)) return null;

  try {
    if (value.startsWith("/")) {
      if (value.startsWith("//")) return null;
      const url = new URL(value, siteUrl);
      if (url.origin !== siteUrl) return null;
      return url.toString();
    }

    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
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
  const path = normalizeStructuredDataPath(input.path);
  const title = cleanText(input.title);
  const description = cleanText(input.description);
  if (!path || !title || !description) return null;

  const siteUrl = normalizeSiteUrl(configuredSiteUrl);
  const url = new URL(path, siteUrl).toString();
  const image = normalizeStructuredDataImage(input.imageUrl, siteUrl);
  const published = isoDate(input.publishedAt);
  const modified = isoDate(input.modifiedAt);
  const section = input.section ? cleanText(input.section) : "";
  const keywords = input.keywords?.map(cleanText).filter(Boolean).filter((value, index, list) => list.indexOf(value) === index);

  const common = {
    "@context": "https://schema.org",
    "@type": input.type,
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

  return common;
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
