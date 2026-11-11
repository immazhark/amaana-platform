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

/**
 * The browser document lives across client-side route transitions. Once its
 * original page is left, later metrics cannot be attributed to a return visit,
 * even if that return restores the exact initial pathname.
 */
export function createWebVitalDocumentGuard(initialDocumentPathname: string | null) {
  let leftOriginalDocument = false;

  return {
    observeRoute(currentPathname: string | null): boolean {
      if (currentPathname !== null && currentPathname !== initialDocumentPathname) {
        leftOriginalDocument = true;
      }
      return !leftOriginalDocument
        && canRecordWebVitalOnCurrentRoute(initialDocumentPathname, currentPathname ?? "");
    },
    canRecord(currentPathname: string, automatedBrowser = false): boolean {
      return !leftOriginalDocument
        && canRecordWebVitalOnCurrentRoute(initialDocumentPathname, currentPathname, automatedBrowser);
    },
  };
}
