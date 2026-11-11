import { normalizePublicAnalyticsPath } from "./public-analytics";

/** Preserve the public Web Vitals interface while reusing the page-view privacy boundary. */
export function normalizePublicWebVitalPath(pathname: string): string | null {
  return normalizePublicAnalyticsPath(pathname);
}

/** Compare exact original document path, not only its anonymized slug bucket.
 * Two distinct public appeal/stories pages can share one analytics label.
 */
export function canRecordWebVitalOnCurrentRoute(
  initialDocumentPathname: string | null,
  currentPathname: string,
  automatedBrowser = false,
): boolean {
  return !automatedBrowser && initialDocumentPathname !== null
    && currentPathname === initialDocumentPathname
    && normalizePublicWebVitalPath(initialDocumentPathname) !== null;
}
