import { normalizePublicAnalyticsPath } from "./public-analytics";

/** Preserve the public Web Vitals interface while reusing the page-view privacy boundary. */
export function normalizePublicWebVitalPath(pathname: string): string | null {
  return normalizePublicAnalyticsPath(pathname);
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
