const trackablePublicPath = /^\/(?:$|about$|contact$|get-involved$|governance$|how-we-verify$|impact$|transparency$|compliance$|privacy$|terms$|donation-policy$|refund-policy$|appeals(?:\/[a-z0-9-]+)?$|our-work(?:\/[a-z0-9-]+)?$|programmes(?:\/[a-z0-9-]+)?$|stories(?:\/[a-z0-9-]+)?$|faith-and-reflections(?:\/[a-z0-9-]+)?$)/;

const hyderabadDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function isTrackablePublicPath(pathname: string) {
  return pathname.length <= 200 && trackablePublicPath.test(pathname);
}

/** One canonical privacy boundary shared by page views and Web Vitals.
 *  Beneficiary-identifying detail slugs are never retained in aggregates.
 */
export function normalizePublicAnalyticsPath(pathname: string): string | null {
  if (/^\/(appeals|stories|our-work|faith-and-reflections|programmes)\/:slug$/.test(pathname)) {
    return pathname;
  }
  if (!isTrackablePublicPath(pathname)) return null;
  const match = /^\/(appeals|stories|our-work|faith-and-reflections|programmes)\/([a-z0-9-]+)$/.exec(pathname);
  return match ? `/${match[1]}/:slug` : pathname;
}

/**
 * Automated browser probes are not public visits. Besides biasing the
 * reported numbers, recording them incurs avoidable rate-limit and counter
 * writes on every acceptance/audit navigation.
 */
export function shouldRecordPublicPageView(
  pathname: string,
  automatedBrowser: boolean,
  currentPathname = pathname,
) {
  return !automatedBrowser && pathname === currentPathname && isTrackablePublicPath(pathname);
}

export function analyticsDateForHyderabad(now: Date) {
  const parts = Object.fromEntries(
    hyderabadDateFormatter
      .formatToParts(now)
      .filter(part => part.type === "year" || part.type === "month" || part.type === "day")
      .map(part => [part.type, Number(part.value)]),
  );

  const { year, month, day } = parts;
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error("Unable to resolve the Hyderabad analytics date");
  }

  return new Date(Date.UTC(year, month - 1, day));
}
