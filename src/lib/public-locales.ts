import { isPrivateRoute } from "./public-routing";

export const PUBLIC_LOCALES = ["en", "ur", "te", "hi"] as const;
export type PublicLocale = (typeof PUBLIC_LOCALES)[number];
export type TranslationPublication = {
  locale: Exclude<PublicLocale, "en">;
  path: string;
  status: "DRAFT" | "PUBLISHED";
  reviewed: boolean;
};

export function publicLocaleDirection(locale: PublicLocale): "ltr" | "rtl" {
  return locale === "ur" ? "rtl" : "ltr";
}

/** Expose a translated URL only after review and publication of that exact page. */
export function buildPublishedLanguageAlternates(
  canonicalPath: string,
  translations: readonly TranslationPublication[],
): Partial<Record<PublicLocale, string>> {
  if (!/^\/(?!\/)(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(canonicalPath)) {
    return {};
  }
  if (isPrivateRoute(canonicalPath)) return {};
  if (PUBLIC_LOCALES.some(locale =>
    canonicalPath === `/${locale}` || canonicalPath.startsWith(`/${locale}/`)
  )) return {};
  const result: Partial<Record<PublicLocale, string>> = { en: canonicalPath };
  const seen = new Set<PublicLocale>();
  for (const translation of translations) {
    const { locale, path, status, reviewed } = translation;
    if (!PUBLIC_LOCALES.includes(locale) || locale === "en" || seen.has(locale)) continue;
    if (status !== "PUBLISHED" || reviewed !== true) continue;
    if (path !== `/${locale}${canonicalPath === "/" ? "" : canonicalPath}`) continue;
    result[locale] = path;
    seen.add(locale);
  }
  return result;
}
