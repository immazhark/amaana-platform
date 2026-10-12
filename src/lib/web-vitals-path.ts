import { isTrackablePublicPath } from "./public-analytics";

/**
 * Discard published beneficiary/story/initiative slugs before client upload
 * or server persistence. Static route paths stay readable for performance
 * analysis. There is intentionally no query, fragment, or identifier field.
 */
export function normalizePublicWebVitalPath(pathname: string): string | null {
  // Browser telemetry is already normalized before upload, so accepting the
  // canonical category token here keeps client and server normalization
  // idempotent. Raw published slugs are still reduced to the same token.
  if (/^\/(appeals|stories|our-work|faith-and-reflections|programmes)\/:slug$/.test(pathname)) {
    return pathname;
  }
  if (!isTrackablePublicPath(pathname)) return null;
  const dynamic = /^\/(appeals|stories|our-work|faith-and-reflections|programmes)\/[a-z0-9-]+$/.exec(pathname);
  return dynamic ? `/${dynamic[1]}/:slug` : pathname;
}

/** Never upload or attribute document metrics from a later private SPA route. */
export function canRecordWebVitalOnCurrentRoute(
  initialNormalizedPath: string | null,
  currentPathname: string,
  automatedBrowser = false,
): boolean {
  return !automatedBrowser && initialNormalizedPath !== null
    && normalizePublicWebVitalPath(currentPathname) === initialNormalizedPath;
}
