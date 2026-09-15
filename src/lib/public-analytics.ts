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

export function analyticsDateForHyderabad(now: Date) {
  const parts = Object.fromEntries(
    hyderabadDateFormatter
      .formatToParts(now)
      .filter(part => part.type === "year" || part.type === "month" || part.type === "day")
      .map(part => [part.type, Number(part.value)]),
  );

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}
